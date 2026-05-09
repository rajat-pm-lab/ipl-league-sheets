import { PLAYERS, STAGES, getStageForWeek } from './constants.js';

// Compute weekly scores for all players
// weeklyOverrides: { [weekNum]: { rule_id: { points, note } } } — from "Weekly Rules" sheet tab
export function computeWeeklyScores(predictions, matchResults, rules, weekNum, weeklyOverrides = {}, upToMatchNum = Infinity) {
  const weekMatches = matchResults.filter((m) => m.week === weekNum && m.matchNum <= upToMatchNum);
  const stageKey = getStageForWeek(weekNum);
  const stageNum = stageKey.replace('STAGE_', '');
  const weekOverride = weeklyOverrides[weekNum] || {};
  // Priority: week-specific override → stage rule → fallback default
  const correctPts = weekOverride.correct_pick?.points
    ?? rules.correct_pick?.[`stage${stageNum}`] ?? rules.correct_pick?.points ?? 10;
  const nrPts = weekOverride.no_result?.points
    ?? rules.no_result?.[`stage${stageNum}`] ?? rules.no_result?.points ?? 0;

  // ── Week 4: Cannibalisation resolution ──
  // Collect all votes { targetPlayerId: { matchNum: voteCount } }
  const cannibVotes = {};
  for (const player of PLAYERS) {
    const c = (predictions[player.id] || {})._cannibalise;
    if (!c) continue;
    // Only count if the cannibalised match is within the scoring window
    if (!weekMatches.find((m) => m.matchNum === c.matchNum)) continue;
    if (!cannibVotes[c.targetPlayerId]) cannibVotes[c.targetPlayerId] = {};
    cannibVotes[c.targetPlayerId][c.matchNum] = (cannibVotes[c.targetPlayerId][c.matchNum] || 0) + 1;
  }
  // Resolve: each target player → 1 cannibalised matchNum
  const cannibalisedMatch = {}; // { playerId: matchNum }
  for (const [targetIdStr, voteCounts] of Object.entries(cannibVotes)) {
    const targetId = Number(targetIdStr);
    const targetTripleDips = (predictions[targetId] || {})._tripleDips || [];
    const maxVotes = Math.max(...Object.values(voteCounts));
    const tied = Object.entries(voteCounts)
      .filter(([, v]) => v === maxVotes)
      .map(([m]) => Number(m));
    if (tied.length === 1) {
      cannibalisedMatch[targetId] = tied[0];
    } else {
      // Tie-break 1: prefer target's triple dip game
      const tdTied = tied.filter((m) => targetTripleDips.includes(m));
      const pool = tdTied.length > 0 ? tdTied : tied;
      // Tie-break 2: earlier match in week sequence
      cannibalisedMatch[targetId] = pool.slice().sort((a, b) => a - b)[0];
    }
  }

  // ── Week 7 Vendetta: pre-compute winner/loser counts per match ──
  const isVendetta = weekNum === 7;
  const vendettaCounts = {}; // { matchNum: { winners: N, losers: N } }
  if (isVendetta) {
    for (const match of weekMatches) {
      if (!match.winner || match.winner === 'NR') continue;
      let winnerCount = 0, loserCount = 0;
      for (const player of PLAYERS) {
        const pp = predictions[player.id] || {};
        const late = (pp._lateMatches || []).includes(match.matchNum);
        const pick = late ? null : pp[match.matchNum];
        if (!pick) { loserCount++; continue; }
        if (pick === match.winner) winnerCount++;
        else loserCount++;
      }
      vendettaCounts[match.matchNum] = { winners: winnerCount, losers: loserCount };
    }
  }

  return PLAYERS.map((player) => {
    const playerPicks = predictions[player.id] || {};
    let predicted = 0, played = 0, wins = 0, losses = 0, draws = 0, points = 0;

    const tripleDips = playerPicks._tripleDips || [];
    const doubleDipMatch = playerPicks._doubleDip || null;
    const hateTeam = playerPicks._hateTeam || null;
    const myCannibalised = cannibalisedMatch[player.id] ?? null;
    const lateMatches = playerPicks._lateMatches || [];

    for (const match of weekMatches) {
      const isLate = lateMatches.includes(match.matchNum);
      // Late submission: prediction counts as not made (0 pts, not shown as predicted)
      const pick = isLate ? null : playerPicks[match.matchNum];
      if (pick) predicted++;

      if (!match.winner) continue; // skip if no result yet
      played++;

      const isNR = match.winner === 'NR';

      // ── Late submission: 0 points, counts as loss ──
      if (isLate) {
        losses++;
        continue;
      }

      // ── Cannibalisation: 0 points regardless of result (highest priority) ──
      if (myCannibalised === match.matchNum) {
        losses++;
        // 0 points — cannibalised game
        continue;
      }

      if (isNR) {
        // No Result — always 0 points, counts as draw
        draws++;
        points += nrPts;
        continue;
      }

      // ── Week 7 Vendetta: (10 * losers) / winners ──
      if (isVendetta) {
        if (pick === match.winner) {
          wins++;
          const vc = vendettaCounts[match.matchNum];
          const vendettaPts = vc.winners > 0 ? Math.round((10 * vc.losers) / vc.winners * 100) / 100 : 0;
          points += vendettaPts;
        } else {
          losses++;
        }
        continue;
      }

      // ── Triple Dip (Week 4): +30 correct, -20 wrong ──
      if (tripleDips.includes(match.matchNum)) {
        if (pick === match.winner) {
          wins++;
          points += 30;
        } else if (pick) {
          losses++;
          points -= 20;
        }
        continue;
      }

      // ── Confidence scoring (Week 3) ──
      const confidence = playerPicks._confidence?.[match.matchNum];
      if (confidence !== undefined) {
        if (pick === match.winner) {
          wins++;
          points += 10 + confidence;
        } else if (pick) {
          losses++;
          points -= confidence;
        }
        continue;
      }

      const hateTeamPlaying = hateTeam && (match.home === hateTeam || match.away === hateTeam);
      const isDoubleDip = doubleDipMatch === match.matchNum && !hateTeamPlaying;

      // ── Double Dip: +20 correct, -10 wrong ──
      if (isDoubleDip) {
        if (pick === match.winner) {
          wins++;
          points += 20;
        } else {
          losses++;
          points -= 10;
        }
        continue;
      }

      // ── Hate Team match ──
      if (hateTeamPlaying) {
        if (match.winner !== hateTeam) {
          wins++;
          points += 15;
        } else {
          losses++;
          points -= 5;
        }
        continue;
      }

      // ── BAU: +correctPts correct, 0 wrong ──
      if (pick === match.winner) {
        wins++;
        points += correctPts;
      } else {
        losses++;
      }
    }

    return { playerId: player.id, predicted, played, wins, losses, draws, points };
  });
}

// Rank and sort leaderboard entries — tied points share the same rank
export function rankLeaderboard(entries, playerLookup) {
  const sorted = entries
    .map((d) => ({ ...d, player: playerLookup[d.playerId] }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);
  // Use a running rank variable — sorted[i-1].rank would be unset (pre-map array)
  let currentRank = 1;
  return sorted.map((d, i) => {
    if (i > 0 && d.points !== sorted[i - 1].points) currentRank = i + 1;
    return { ...d, rank: currentRank };
  });
}

// Compute stage leaderboard by aggregating weeks
export function computeStageLeaderboard(weeklyDataMap, stageKey, playerLookup) {
  const weeks = STAGES[stageKey]?.weeks || [];
  const aggregated = {};

  PLAYERS.forEach((p) => {
    aggregated[p.id] = {
      playerId: p.id, predicted: 0, played: 0,
      wins: 0, losses: 0, draws: 0, points: 0, weeklyWins: 0,
    };
  });

  for (const w of weeks) {
    const weekData = weeklyDataMap[w];
    if (!weekData || weekData.length === 0) continue;

    // Find weekly winner
    const sorted = [...weekData].sort((a, b) => b.points - a.points || b.wins - a.wins);
    if (sorted[0]?.points > 0) {
      aggregated[sorted[0].playerId].weeklyWins++;
    }

    for (const row of weekData) {
      const agg = aggregated[row.playerId];
      if (!agg) continue;
      agg.predicted += row.predicted;
      agg.played += row.played;
      agg.wins += row.wins;
      agg.losses += row.losses;
      agg.draws += row.draws;
      agg.points += row.points;
    }
  }

  return rankLeaderboard(Object.values(aggregated), playerLookup);
}

// Compute overall leaderboard across all stages
export function computeOverallLeaderboard(weeklyDataMap, playerLookup) {
  const allWeeks = Object.keys(STAGES).flatMap((s) => STAGES[s].weeks);
  const aggregated = {};

  PLAYERS.forEach((p) => {
    aggregated[p.id] = {
      playerId: p.id, predicted: 0, played: 0,
      wins: 0, losses: 0, draws: 0, points: 0, weeklyWins: 0,
    };
  });

  for (const w of allWeeks) {
    const weekData = weeklyDataMap[w];
    if (!weekData || weekData.length === 0) continue;

    const sorted = [...weekData].sort((a, b) => b.points - a.points || b.wins - a.wins);
    if (sorted[0]?.points > 0) {
      aggregated[sorted[0].playerId].weeklyWins++;
    }

    for (const row of weekData) {
      const agg = aggregated[row.playerId];
      if (!agg) continue;
      agg.predicted += row.predicted;
      agg.played += row.played;
      agg.wins += row.wins;
      agg.losses += row.losses;
      agg.draws += row.draws;
      agg.points += row.points;
    }
  }

  return rankLeaderboard(Object.values(aggregated), playerLookup);
}

// Compute cumulative points per player per week (for race chart)
export function computeCumulativePoints(weeklyDataMap) {
  const maxWeek = Math.max(...Object.keys(weeklyDataMap).map(Number), 0);
  return PLAYERS.map((player) => {
    const weeks = [0];
    let total = 0;
    for (let w = 1; w <= maxWeek; w++) {
      const weekData = weeklyDataMap[w];
      if (weekData) {
        const pw = weekData.find((d) => d.playerId === player.id);
        total += pw ? pw.points : 0;
      }
      weeks.push(total);
    }
    return { playerId: player.id, name: player.name, weeks };
  });
}
