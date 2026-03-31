import { createContext, useContext, useState, useEffect } from 'react'
import * as sampleData from './sampleData'

const DataContext = createContext(null)

// Scoring helpers that work with any data (API or static)
function rankAndSort(entries, players) {
  const lookup = {}
  players.forEach((p) => { lookup[p.id] = p })
  const sorted = entries
    .map((d) => ({ ...d, player: lookup[d.playerId] }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
  // Use a running rank variable — sorted[i-1].rank would be unset (pre-map array)
  let currentRank = 1
  return sorted.map((d, i) => {
    if (i > 0 && d.points !== sorted[i - 1].points) currentRank = i + 1
    return { ...d, rank: currentRank }
  })
}

function computeWeeklyLeaderboard(weeklyData, weekNum, players) {
  const data = weeklyData[weekNum]
  // If no data yet for this week, show all players at zero (don't blank the screen)
  if (!data || data.length === 0) {
    return players.map((p, i) => ({
      playerId: p.id, player: p,
      predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0,
      rank: i + 1,
    }))
  }
  return rankAndSort(data, players)
}

function computeStageLeaderboard(weeklyData, stageWeeks, players) {
  const aggregated = {}
  players.forEach((p) => {
    aggregated[p.id] = { playerId: p.id, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0, weeklyWins: 0 }
  })
  for (const w of stageWeeks) {
    const weekData = weeklyData[w]
    if (!weekData || weekData.length === 0) continue
    const sorted = [...weekData].sort((a, b) => b.points - a.points || b.wins - a.wins)
    if (sorted[0]?.points > 0) aggregated[sorted[0].playerId].weeklyWins++
    weekData.forEach((row) => {
      const agg = aggregated[row.playerId]
      if (!agg) return
      agg.predicted += row.predicted
      agg.played += row.played
      agg.wins += row.wins
      agg.losses += row.losses
      agg.draws += row.draws
      agg.points += row.points
    })
  }
  return rankAndSort(Object.values(aggregated), players)
}

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sheets-data')
      .then((res) => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json()
      })
      .then((apiData) => {
        setData({ ...apiData, _source: 'api' })
      })
      .catch((err) => {
        console.warn('API failed, using static data:', err.message)
        setData({
          players: sampleData.PLAYERS,
          iplTeams: sampleData.IPL_TEAMS,
          stages: sampleData.STAGES,
          weeklyData: sampleData.WEEKLY_DATA,
          matchSchedule: sampleData.MATCH_SCHEDULE,
          allPredictions: sampleData.ALL_PREDICTIONS,
          cumulativePoints: sampleData.CUMULATIVE_POINTS,
          currentWeek: 1,
          _source: 'static',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DataContext.Provider value={{ data, loading, computeWeeklyLeaderboard, computeStageLeaderboard }}>
      {children}
    </DataContext.Provider>
  )
}

export function useLeagueData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useLeagueData must be inside DataProvider')
  return ctx
}
