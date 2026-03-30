import { readMatchResults, readScoringRules, readWeekPredictions } from '../lib/sheets.js';
import { computeWeeklyScores, computeCumulativePoints } from '../lib/scoring.js';
import { PLAYERS, IPL_TEAMS, STAGES } from '../lib/constants.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read all data from Google Sheets
    const [matchResults, rules] = await Promise.all([
      readMatchResults(),
      readScoringRules(),
    ]);

    // Determine which weeks have data
    const weeksWithMatches = [...new Set(matchResults.map((m) => m.week))].sort((a, b) => a - b);
    const currentWeek = weeksWithMatches.length > 0 ? Math.max(...weeksWithMatches) : 1;

    // Read predictions for each week (in parallel)
    const predictionsByWeek = {};
    await Promise.all(
      weeksWithMatches.map(async (w) => {
        predictionsByWeek[w] = await readWeekPredictions(w);
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
        ...(m.winner && m.status !== 'upcoming' ? { winner: m.winner === 'NR' ? null : m.winner } : {}),
      });
    }

    // Compute weekly scores
    const weeklyData = {};
    for (const w of weeksWithMatches) {
      weeklyData[w] = computeWeeklyScores(
        predictionsByWeek[w] || {},
        matchResults,
        rules,
        w
      );
    }

    // Compute cumulative points for race chart
    const cumulativePoints = computeCumulativePoints(weeklyData);

    // Response
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      players: PLAYERS,
      iplTeams: IPL_TEAMS,
      stages: STAGES,
      weeklyData,
      matchSchedule,
      allPredictions: predictionsByWeek,
      cumulativePoints,
      currentWeek,
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
