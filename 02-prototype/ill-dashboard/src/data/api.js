// Fetches league data from /api/sheets-data, falls back to static sampleData
let cachedData = null;
let fetchPromise = null;

export async function fetchLeagueData() {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/sheets-data')
    .then((res) => {
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cachedData = data;
      // Client-side cache for 5 minutes
      setTimeout(() => { cachedData = null; }, 5 * 60 * 1000);
      return data;
    })
    .catch(async (err) => {
      console.warn('API fetch failed, using static fallback:', err.message);
      // Fall back to static sample data
      const sample = await import('./sampleData.js');
      return {
        players: sample.PLAYERS,
        iplTeams: sample.IPL_TEAMS,
        stages: sample.STAGES,
        weeklyData: sample.WEEKLY_DATA,
        matchSchedule: sample.MATCH_SCHEDULE,
        allPredictions: sample.ALL_PREDICTIONS,
        cumulativePoints: sample.CUMULATIVE_POINTS,
        currentWeek: 1,
        _fallback: true,
      };
    })
    .finally(() => { fetchPromise = null; });

  return fetchPromise;
}

export function clearCache() {
  cachedData = null;
}
