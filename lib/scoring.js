import { PLAYERS, STAGES, getStageForWeek } from './constants.js';

// Compute weekly scores for all players
export function computeWeeklyScores(predictions, matchResults, rules, weekNum) {
  const weekMatches = matchResults.filter((m) => m.week === weekNum);
  const stageKey = getStageForWeek(weekNum);
  const stageNum = stageKey.replace('STAGE_', '');
  const correctPts = rules.correct_pick?.[`stage${stageNum}`] ?? rules.correct_pick?.points ?? 10;
  const nrPts = rules.no_result?.[`stage${stageNum}`] ?? rules.no_result?.points ?? 5;

  return PLAYERS.map((player) => {
    const playerPicks = predictions[player.id] || {};
    let predicted = 0, played = 0, wins = 0, losses = 0, draws = 0, points = 0;

    for (const match of weekMatches) {
      const pick = playerPicks[match.matchNum];
      if (pick) predicted++;

      if (!match.winner) continue; // skip if no result yet
      played++;

      if (match.winner === 'NR' || match.status === 'no_result') {
        draws++;
        points += nrPts;
      } else if (pick === match.winner) {
        wins++;
        points += correctPts;
      } else {
        losses++;
      }
    }

    return { playerId: player.id, predicted, played, wins, losses, draws, points };
  });
}

// Rank and sort leaderboard entries
export function rankLeaderboard(entries, playerLookup) {
  return entries
    .map((d) => ({ ...d, player: playerLookup[d.playerId] }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
    .map((d, i) => ({ ...d, rank: i + 1 }));
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
