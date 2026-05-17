import { readMatchResults, readScoringRules, readWeekPredictions, readWeeklyRuleOverrides } from '../lib/sheets.js';
import { computeWeeklyScores, computeCumulativePoints, rankLeaderboard, computeOverallLeaderboard } from '../lib/scoring.js';
import { PLAYERS, IPL_TEAMS, STAGES, getStageForWeek } from '../lib/constants.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read all data from Google Sheets
    const [matchResults, rules, weeklyOverrides] = await Promise.all([
      readMatchResults(),
      readScoringRules(),
      readWeeklyRuleOverrides(),
    ]);

    // Determine which weeks have data
    const weeksWithMatches = [...new Set(matchResults.map((m) => m.week))].sort((a, b) => a - b);
    // Current week = first week that still has incomplete/upcoming matches; fallback to last week
    const incompleteWeek = weeksWithMatches.find((w) =>
      matchResults.filter((m) => m.week === w).some((m) => !m.winner)
    );
    const currentWeek = incompleteWeek ?? (weeksWithMatches.length > 0 ? Math.max(...weeksWithMatches) : 1);

    // Read predictions for each week (in parallel), passing matchResults for DD resolution
    const predictionsByWeek = {};
    await Promise.all(
      weeksWithMatches.map(async (w) => {
        predictionsByWeek[w] = await readWeekPredictions(w, matchResults);
      })
    );

    // Build match schedule per week
    const matchSchedule = {};
    for (const m of matchResults) {
      if (!matchSchedule[m.week]) matchSchedule[m.week] = [];
      matchSchedule[m.week].push({
        matchNum: m.matchNum,
        home: m.home,
        away: m.away,
        date: m.date,
        ...(m.winner ? { winner: m.winner === 'NR' ? null : m.winner } : {}),
      });
    }

    // ── Week 8 format data: compute dynamic format per match ──
    const week8Formats = {};
    const week8Matches = matchResults.filter((m) => m.week === 8);
    for (const m of week8Matches) {
      if (!m.winner || m.winner === 'NR') continue;
      if (m.runsHome != null && m.runsAway != null && m.wicketsHome != null && m.wicketsAway != null) {
        const total = m.runsHome + m.runsAway + m.wicketsHome + m.wicketsAway;
        week8Formats[m.matchNum] = {
          format: (total % 6) + 2,
          runsHome: m.runsHome,
          wicketsHome: m.wicketsHome,
          runsAway: m.runsAway,
          wicketsAway: m.wicketsAway,
          total,
        };
      }
    }

    // Compute weekly scores
    const weeklyData = {};
    for (const w of weeksWithMatches) {
      weeklyData[w] = computeWeeklyScores(
        predictionsByWeek[w] || {},
        matchResults,
        rules,
        w,
        weeklyOverrides
      );
    }

    // Compute per-week rules (for UI display) and weekComplete flags
    const weeklyRules = {};
    const weekComplete = {};
    for (const w of weeksWithMatches) {
      const stageKey = getStageForWeek(w);
      const stageNum = stageKey.replace('STAGE_', '');
      const weekOverride = weeklyOverrides[w] || {};
      weeklyRules[w] = {
        correct: weekOverride.correct_pick?.points ?? rules.correct_pick?.[`stage${stageNum}`] ?? rules.correct_pick?.points ?? 10,
        wrong: weekOverride.wrong_pick?.points ?? rules.wrong_pick?.[`stage${stageNum}`] ?? rules.wrong_pick?.points ?? 0,
        noResult: weekOverride.no_result?.points ?? rules.no_result?.[`stage${stageNum}`] ?? rules.no_result?.points ?? 0,
        note: weekOverride.correct_pick?.note || weekOverride.no_result?.note || '',
      };
      const weekMatches = matchResults.filter((m) => m.week === w);
      weekComplete[w] = weekMatches.length > 0 && weekMatches.every((m) => m.winner);
    }

    // Compute cumulative points for race chart
    const cumulativePoints = computeCumulativePoints(weeklyData);

    // ── Team form data: each team's home/away performance in the tournament ──
    const teamFormRaw = {};
    for (const m of matchResults) {
      if (!m.winner) continue; // skip unplayed
      const isNR = m.winner === 'NR';
      for (const slot of ['home', 'away']) {
        const abbr = slot === 'home' ? m.home : m.away;
        if (!abbr) continue;
        if (!teamFormRaw[abbr]) teamFormRaw[abbr] = { home: { w: 0, l: 0, nr: 0 }, away: { w: 0, l: 0, nr: 0 } };
        if (isNR) {
          teamFormRaw[abbr][slot].nr++;
        } else if (m.winner === abbr) {
          teamFormRaw[abbr][slot].w++;
        } else {
          teamFormRaw[abbr][slot].l++;
        }
      }
    }
    // Attach confidence score 1-10 (based on win rate, excluding NR)
    const teamFormData = {};
    for (const [abbr, form] of Object.entries(teamFormRaw)) {
      const scoreFor = (s) => {
        const played = s.w + s.l;
        if (played === 0) return null;
        return Math.max(1, Math.round((s.w / played) * 10));
      };
      teamFormData[abbr] = {
        home: { ...form.home, score: scoreFor(form.home) },
        away: { ...form.away, score: scoreFor(form.away) },
      };
    }

    // ── Team-wise home/away accuracy per player ──
    // Computed server-side so matchNum alignment matches scoring.js exactly
    const teamAccuracy = {};
    for (const player of PLAYERS) {
      const playerAcc = {};
      for (const m of matchResults) {
        // Only completed matches with a real winner
        if (!m.winner || m.winner === 'NR') continue;
        const pick = (predictionsByWeek[m.week] || {})[player.id]?.[m.matchNum];
        if (!pick) continue;
        if (!playerAcc[pick]) playerAcc[pick] = { home: { a: 0, c: 0 }, away: { a: 0, c: 0 } };
        const slot = pick === m.home ? 'home' : 'away';
        playerAcc[pick][slot].a++;
        if (pick === m.winner) playerAcc[pick][slot].c++;
      }
      teamAccuracy[player.id] = playerAcc;
    }

    // ── Cannibalisation resolution per week (for Picks tab display) ──
    // { [week]: { [targetPlayerId]: { matchNum, by: [cannibaliserPlayerId, ...] } } }
    const cannibResolution = {};
    for (const w of weeksWithMatches) {
      const weekPreds = predictionsByWeek[w] || {};
      const weekMatchNums = new Set(matchResults.filter((m) => m.week === w).map((m) => m.matchNum));

      // Collect votes: who wants to cannibalise which match of whom
      const votes = {}; // { targetPlayerId: { matchNum: [cannibaliserIds] } }
      for (const player of PLAYERS) {
        const c = (weekPreds[player.id] || {})._cannibalise;
        if (!c || !weekMatchNums.has(c.matchNum)) continue;
        if (!votes[c.targetPlayerId]) votes[c.targetPlayerId] = {};
        if (!votes[c.targetPlayerId][c.matchNum]) votes[c.targetPlayerId][c.matchNum] = [];
        votes[c.targetPlayerId][c.matchNum].push(player.id);
      }

      if (Object.keys(votes).length === 0) continue;
      cannibResolution[w] = {};

      for (const [targetIdStr, matchVotes] of Object.entries(votes)) {
        const targetId = Number(targetIdStr);
        const targetTripleDips = (weekPreds[targetId] || {})._tripleDips || [];
        const maxVotes = Math.max(...Object.values(matchVotes).map((v) => v.length));
        const tied = Object.entries(matchVotes)
          .filter(([, v]) => v.length === maxVotes)
          .map(([m, v]) => ({ matchNum: Number(m), voters: v }));
        const tdTied = tied.filter(({ matchNum }) => targetTripleDips.includes(matchNum));
        const pool = tdTied.length > 0 ? tdTied : tied;
        const resolved = pool.slice().sort((a, b) => a.matchNum - b.matchNum)[0];
        cannibResolution[w][targetId] = { matchNum: resolved.matchNum, by: resolved.voters };
      }
    }

    // ── Rank deltas since last completed match ──
    const playerLookup = {};
    PLAYERS.forEach((p) => { playerLookup[p.id] = p; });

    const completedMatches = matchResults
      .filter((m) => m.winner)
      .sort((a, b) => a.matchNum - b.matchNum);
    const lastMatch = completedMatches.at(-1);

    let rankDeltas = null;
    if (lastMatch) {
      const { matchNum: lastMatchNum, week: lastMatchWeek } = lastMatch;

      // Weekly scores excluding the last match
      const prevWeekData = computeWeeklyScores(
        predictionsByWeek[lastMatchWeek] || {},
        matchResults,
        rules,
        lastMatchWeek,
        weeklyOverrides,
        lastMatchNum - 1
      );

      // Weekly rank delta (for the week containing the last match)
      const currWeekRanked = rankLeaderboard(weeklyData[lastMatchWeek] || [], playerLookup);
      const prevWeekRanked = rankLeaderboard(prevWeekData, playerLookup);
      const weeklyDeltas = {};
      for (const curr of currWeekRanked) {
        const prev = prevWeekRanked.find((r) => r.playerId === curr.playerId);
        weeklyDeltas[curr.playerId] = prev ? prev.rank - curr.rank : 0;
      }

      // Overall rank delta
      const prevWeeklyDataMap = { ...weeklyData, [lastMatchWeek]: prevWeekData };
      const currOverall = computeOverallLeaderboard(weeklyData, playerLookup);
      const prevOverall = computeOverallLeaderboard(prevWeeklyDataMap, playerLookup);
      const overallDeltas = {};
      for (const curr of currOverall) {
        const prev = prevOverall.find((r) => r.playerId === curr.playerId);
        overallDeltas[curr.playerId] = prev ? prev.rank - curr.rank : 0;
      }

      rankDeltas = {
        weekly: weeklyDeltas,
        overall: overallDeltas,
        lastMatchWeek,
        lastMatch: { matchNum: lastMatchNum, home: lastMatch.home, away: lastMatch.away },
      };
    }

    // Response
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({
      players: PLAYERS,
      iplTeams: IPL_TEAMS,
      stages: STAGES,
      weeklyData,
      matchSchedule,
      allPredictions: predictionsByWeek,
      cumulativePoints,
      currentWeek,
      weeklyRules,
      weekComplete,
      rankDeltas,
      teamAccuracy,
      teamFormData,
      cannibResolution,
      week8Formats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('sheets-data error:', err);
    return res.status(500).json({
      error: 'Failed to load data from Google Sheets',
      message: err.message,
    });
  }
}
