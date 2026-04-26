import { useState, useMemo } from 'react'
import Avatar from './Avatar'

const ROASTS = ['Lodu', 'Dalley', 'BKL', 'Bhadwey']

function pickRoast(playerId) {
  return ROASTS[playerId % ROASTS.length]
}

// Simulate scoring for remaining matches given a specific outcome combination
function simulateScenarios(weeklyScores, remainingMatches, predictions, correctPts) {
  const playerIds = weeklyScores.map((s) => s.playerId)
  const basePoints = {}
  const baseWins = {}
  weeklyScores.forEach((s) => {
    basePoints[s.playerId] = s.points
    baseWins[s.playerId] = s.wins
  })

  const n = remainingMatches.length
  const totalCombos = 1 << n // 2^n
  // For each player, track best rank, worst rank, and rank 1 count
  const results = {}
  playerIds.forEach((id) => {
    results[id] = { bestRank: Infinity, worstRank: 0, rank1Count: 0, rankCounts: {} }
  })

  // Pre-compute each player's pick for each remaining match
  const playerPicks = {}
  playerIds.forEach((id) => {
    playerPicks[id] = remainingMatches.map((m) => predictions[id]?.[m.matchNum] || null)
  })

  for (let combo = 0; combo < totalCombos; combo++) {
    // Determine winner for each remaining match in this combo
    const outcomes = remainingMatches.map((m, i) => (combo >> i) & 1 ? m.away : m.home)

    // Compute points for each player
    const pts = {}
    const wins = {}
    playerIds.forEach((id) => {
      let extraPts = 0
      let extraWins = 0
      for (let i = 0; i < n; i++) {
        if (playerPicks[id][i] === outcomes[i]) {
          extraPts += correctPts
          extraWins++
        }
      }
      pts[id] = basePoints[id] + extraPts
      wins[id] = baseWins[id] + extraWins
    })

    // Rank players
    const sorted = playerIds
      .map((id) => ({ id, pts: pts[id], wins: wins[id] }))
      .sort((a, b) => b.pts - a.pts || b.wins - a.wins)

    let currentRank = 1
    sorted.forEach((entry, i) => {
      if (i > 0 && (entry.pts !== sorted[i - 1].pts || entry.wins !== sorted[i - 1].wins)) {
        currentRank = i + 1
      }
      const r = results[entry.id]
      if (currentRank < r.bestRank) r.bestRank = currentRank
      if (currentRank > r.worstRank) r.worstRank = currentRank
      if (currentRank === 1) r.rank1Count++
      r.rankCounts[currentRank] = (r.rankCounts[currentRank] || 0) + 1
    })
  }

  return { results, totalCombos }
}

// Find which match outcomes are REQUIRED for a player to reach rank 1
function findRank1Requirements(weeklyScores, remainingMatches, predictions, correctPts, playerId) {
  const playerIds = weeklyScores.map((s) => s.playerId)
  const basePoints = {}
  const baseWins = {}
  weeklyScores.forEach((s) => {
    basePoints[s.playerId] = s.points
    baseWins[s.playerId] = s.wins
  })

  const n = remainingMatches.length
  const totalCombos = 1 << n

  const playerPicks = {}
  playerIds.forEach((id) => {
    playerPicks[id] = remainingMatches.map((m) => predictions[id]?.[m.matchNum] || null)
  })

  // Track which match outcomes appear in ALL rank-1 scenarios
  const rank1Combos = []

  for (let combo = 0; combo < totalCombos; combo++) {
    const outcomes = remainingMatches.map((m, i) => (combo >> i) & 1 ? m.away : m.home)

    const pts = {}
    const wins = {}
    playerIds.forEach((id) => {
      let extraPts = 0
      let extraWins = 0
      for (let i = 0; i < n; i++) {
        if (playerPicks[id][i] === outcomes[i]) {
          extraPts += correctPts
          extraWins++
        }
      }
      pts[id] = basePoints[id] + extraPts
      wins[id] = baseWins[id] + extraWins
    })

    // Check if selected player is rank 1
    const isRank1 = playerIds.every((id) => {
      if (id === playerId) return true
      return pts[playerId] > pts[id] ||
        (pts[playerId] === pts[id] && wins[playerId] >= wins[id])
    })

    if (isRank1) {
      rank1Combos.push(outcomes)
    }
  }

  if (rank1Combos.length === 0) return null

  // Find required outcomes: matches where ALL rank-1 scenarios have the same winner
  const required = []
  for (let i = 0; i < n; i++) {
    const allSame = rank1Combos.every((combo) => combo[i] === rank1Combos[0][i])
    if (allSame) {
      required.push({ match: remainingMatches[i], mustWin: rank1Combos[0][i] })
    }
  }

  return { required, totalPaths: rank1Combos.length, totalCombos }
}

export default function ScenarioCentral({ weeklyData, players, selectedWeek, matchSchedule, allPredictions }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const weekScores = weeklyData?.[selectedWeek] || []
  const weekMatches = matchSchedule?.[selectedWeek] || []
  const weekPredictions = allPredictions?.[selectedWeek] || {}

  // Remaining matches = no winner yet
  const remainingMatches = weekMatches.filter((m) => m.winner === undefined)
  const completedMatches = weekMatches.filter((m) => m.winner !== undefined)

  // Points per correct pick (BAU week 5+)
  const correctPts = 10

  // Current weekly leaderboard
  const currentRanked = useMemo(() => {
    if (!weekScores.length) return []
    const sorted = [...weekScores].sort((a, b) => b.points - a.points || b.wins - a.wins)
    let rank = 1
    return sorted.map((s, i) => {
      if (i > 0 && (s.points !== sorted[i - 1].points || s.wins !== sorted[i - 1].wins)) rank = i + 1
      return { ...s, rank }
    })
  }, [weekScores])

  const scenario = useMemo(() => {
    if (!selectedPlayer || remainingMatches.length === 0) return null
    const sim = simulateScenarios(weekScores, remainingMatches, weekPredictions, correctPts)
    const req = findRank1Requirements(weekScores, remainingMatches, weekPredictions, correctPts, selectedPlayer)
    return { ...sim, requirements: req, playerId: selectedPlayer }
  }, [selectedPlayer, weekScores, remainingMatches, weekPredictions])

  if (!weekScores.length || weekMatches.length === 0) return null

  const playerObj = players.find((p) => p.id === selectedPlayer)
  const currentEntry = currentRanked.find((r) => r.playerId === selectedPlayer)
  const playerResult = scenario?.results?.[selectedPlayer]

  return (
    <div style={{
      margin: '10px 12px 0', borderRadius: 14,
      background: 'linear-gradient(135deg, #132237, #1A2D47)',
      border: '1px solid rgba(255,215,0,0.15)',
      overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '12px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
              color: 'var(--gold)',
            }}>
              Scenario Central
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
              {remainingMatches.length === 0
                ? 'Sab matches ho gaye — ab kya hi scenario dekhega'
                : `${remainingMatches.length} match${remainingMatches.length > 1 ? 'es' : ''} baaki — apni aukaat check kar`}
            </div>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 14px 16px' }}>
          {/* Player selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <select
              value={selectedPlayer || ''}
              onChange={(e) => setSelectedPlayer(Number(e.target.value) || null)}
              style={{
                flex: 1, background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text)', padding: '10px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <option value="">Kiska scenario dekhna hai?</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* No remaining matches */}
          {remainingMatches.length === 0 && (
            <div style={{
              padding: 16, textAlign: 'center', color: 'var(--text-secondary)',
              fontSize: 12, fontStyle: 'italic',
            }}>
              Week khatam bhai. Jo ho gaya so ho gaya. Ab Weekly leaderboard dekh le.
            </div>
          )}

          {/* Scenario results */}
          {selectedPlayer && remainingMatches.length > 0 && scenario && playerResult && (
            <div>
              {/* Current standing card */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: 'rgba(0,0,0,0.2)', borderRadius: 10, marginBottom: 12,
              }}>
                <Avatar player={playerObj} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                    {playerObj?.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Abhi Rank #{currentEntry?.rank || '?'} &nbsp;|&nbsp; {currentEntry?.points || 0} pts &nbsp;|&nbsp; {currentEntry?.wins || 0}W-{currentEntry?.losses || 0}L
                  </div>
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 900, color: currentEntry?.rank === 1 ? 'var(--gold)' : 'var(--text-secondary)',
                }}>
                  #{currentEntry?.rank || '?'}
                </div>
              </div>

              {/* Scenario verdict */}
              <ScenarioVerdict
                playerResult={playerResult}
                scenario={scenario}
                playerObj={playerObj}
                currentRank={currentEntry?.rank}
                remainingMatches={remainingMatches}
              />
            </div>
          )}

          {/* Prompt to select if no player */}
          {!selectedPlayer && remainingMatches.length > 0 && (
            <div style={{
              padding: 20, textAlign: 'center', color: 'var(--text-secondary)',
              fontSize: 11,
            }}>
              Upar se player select kar pehle, phir batata hoon aukaat
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScenarioVerdict({ playerResult, scenario, playerObj, currentRank, remainingMatches }) {
  const { bestRank, worstRank, rank1Count, rankCounts } = playerResult
  const { totalCombos, requirements } = scenario
  const rank1Pct = Math.round((rank1Count / totalCombos) * 100)

  // Already #1 and guaranteed
  if (bestRank === 1 && worstRank === 1) {
    return (
      <VerdictCard
        emoji="👑"
        color="var(--gold)"
        title="BOSS MODE ON"
        subtitle={`${playerObj?.name} gaddi mein baitha hai — koi nahi hila sakta. Week sealed.`}
      />
    )
  }

  // Rank 1 is possible
  if (rank1Count > 0) {
    const pctColor = rank1Pct >= 50 ? 'var(--green)' : rank1Pct >= 20 ? 'var(--orange)' : 'var(--red)'

    return (
      <div>
        <VerdictCard
          emoji="🔥"
          color="var(--green)"
          title="CHANCE HAI BHAI!"
          subtitle={`${rank1Count} out of ${totalCombos} scenarios mein ${playerObj?.name} #1 finish karega`}
        />

        {/* Probability bar */}
        <div style={{
          margin: '10px 0', padding: '10px 14px',
          background: 'rgba(0,0,0,0.2)', borderRadius: 10,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Rank 1 probability
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color: pctColor }}>
              {rank1Pct}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, width: `${rank1Pct}%`,
              background: `linear-gradient(90deg, ${pctColor}, var(--gold))`,
              transition: 'width 0.5s',
            }} />
          </div>
        </div>

        {/* Requirements */}
        {requirements && requirements.required.length > 0 && (
          <div style={{
            padding: '10px 14px', background: 'rgba(0,0,0,0.15)',
            borderRadius: 10, marginTop: 8,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--gold)',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
            }}>
              Ye hona zaroori hai — warna bhool ja:
            </div>
            {requirements.required.map(({ match, mustWin }) => (
              <div key={match.matchNum} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, minWidth: 20 }}>
                  M{match.matchNum}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                  {match.home} vs {match.away}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: 'var(--green)' }}>
                  {mustWin} jeete ✓
                </span>
              </div>
            ))}
            {requirements.required.length < remainingMatches.length && (
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
                Baaki matches mein kuch bhi ho sakta hai — tere favor mein bhi ja sakta hai
              </div>
            )}
          </div>
        )}

        {requirements && requirements.required.length === 0 && (
          <div style={{
            padding: '10px 14px', background: 'rgba(0,200,83,0.08)',
            borderRadius: 10, marginTop: 8, fontSize: 11, color: 'var(--green)',
            fontWeight: 600,
          }}>
            Kisi specific result ki zaroorat nahi — multiple paths hain #1 tak. Duaa kar aur chill kar.
          </div>
        )}

        {/* Rank distribution */}
        <RankDistribution rankCounts={rankCounts} totalCombos={totalCombos} bestRank={bestRank} />
      </div>
    )
  }

  // Rank 1 NOT possible — roast time
  return (
    <div>
      <VerdictCard
        emoji="💀"
        color="var(--red)"
        title={`${pickRoast(playerObj?.id)} — TUMSE NA HO PAYEGA BETA`}
        subtitle={`${playerObj?.name} ka Rank 1 is IMPOSSIBLE this week. Chahe kuch bhi ho jaye, #1 nahi aa sakta.`}
      />

      <div style={{
        margin: '10px 0', padding: '12px 14px',
        background: 'rgba(255,23,68,0.08)', borderRadius: 10,
        border: '1px solid rgba(255,23,68,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Best case scenario
            </div>
            <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 4 }}>
              Sab kuch tera favor mein ho toh bhi max yahan tak pohochega:
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--orange)' }}>
            #{bestRank}
          </div>
        </div>
      </div>

      <div style={{
        margin: '8px 0', padding: '12px 14px',
        background: 'rgba(0,0,0,0.15)', borderRadius: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Worst case
            </div>
            <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 4 }}>
              Agar kismat bhi saath nahi di toh:
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--red)' }}>
            #{worstRank}
          </div>
        </div>
      </div>

      {/* Rank distribution */}
      <RankDistribution rankCounts={rankCounts} totalCombos={totalCombos} bestRank={bestRank} />
    </div>
  )
}

function VerdictCard({ emoji, color, title, subtitle }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: `${color}10`, border: `1px solid ${color}30`,
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: 1 }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 26 }}>
        {subtitle}
      </div>
    </div>
  )
}

function RankDistribution({ rankCounts, totalCombos, bestRank }) {
  const ranks = Object.keys(rankCounts).map(Number).sort((a, b) => a - b)
  const maxCount = Math.max(...Object.values(rankCounts))

  return (
    <div style={{
      marginTop: 10, padding: '10px 14px',
      background: 'rgba(0,0,0,0.15)', borderRadius: 10,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      }}>
        Rank distribution — kitne scenarios mein kahan finish karega
      </div>
      {ranks.map((rank) => {
        const count = rankCounts[rank]
        const pct = Math.round((count / totalCombos) * 100)
        const barPct = (count / maxCount) * 100
        const color = rank === 1 ? 'var(--gold)' : rank <= 3 ? 'var(--green)' : rank >= 10 ? 'var(--red)' : 'var(--blue)'
        return (
          <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color, minWidth: 22, textAlign: 'right',
            }}>
              #{rank}
            </span>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, width: `${barPct}%`,
                background: color, opacity: 0.7, transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
