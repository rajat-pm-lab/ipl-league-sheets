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
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
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
