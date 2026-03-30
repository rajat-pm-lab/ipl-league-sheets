import { readMatchResults, writeMatchResult } from '../../lib/sheets.js';
import { TEAM_NAME_MAP } from '../../lib/constants.js';

export default async function handler(req, res) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const apiKey = process.env.CRICKET_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ message: 'No CRICKET_API_KEY set — skipping auto-update. Enter results manually in the Google Sheet.' });
    }

    // Fetch current/recent matches from CricAPI
    const apiRes = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`
    );
    const apiData = await apiRes.json();

    if (apiData.status !== 'success' || !apiData.data) {
      return res.status(200).json({ message: 'No match data from API', raw: apiData.info });
    }

    // Filter for IPL matches
    const iplMatches = apiData.data.filter(
      (m) => m.series_id && m.name && m.matchType === 't20' &&
        (m.series?.toLowerCase().includes('ipl') || m.name?.toLowerCase().includes('ipl'))
    );

    // Read current results from sheet
    const sheetResults = await readMatchResults();
    const upcomingMatches = sheetResults.filter((m) => !m.winner || m.status === 'upcoming');

    let updated = 0;
    for (const apiMatch of iplMatches) {
      if (!apiMatch.matchEnded) continue;

      // Try to match API result to our sheet by teams
      const teams = (apiMatch.teams || []).map((t) => normalizeTeam(t)).filter(Boolean);
      if (teams.length !== 2) continue;

      // Find matching upcoming match in sheet
      const sheetMatch = upcomingMatches.find(
        (m) => teams.includes(m.home) && teams.includes(m.away)
      );
      if (!sheetMatch) continue;

      // Determine winner
      let winner = 'NR';
      if (apiMatch.matchWinner) {
        winner = normalizeTeam(apiMatch.matchWinner) || 'NR';
      }

      const success = await writeMatchResult(sheetMatch.matchNum, winner, 'completed');
      if (success) updated++;
    }

    return res.status(200).json({
      message: `Updated ${updated} match result(s)`,
      iplMatchesFound: iplMatches.length,
    });
  } catch (err) {
    console.error('cron update-results error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function normalizeTeam(name) {
  if (!name) return null;
  const cleaned = name.trim().toLowerCase();
  return TEAM_NAME_MAP[cleaned] || cleaned.toUpperCase();
}
