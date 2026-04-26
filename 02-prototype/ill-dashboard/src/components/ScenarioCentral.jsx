import { useState, useMemo } from 'react'
import Avatar from './Avatar'

const ROASTS = ['Lodu', 'Dalley', 'BKL', 'Bhadwey']

function pickRoast(playerId) {
  return ROASTS[playerId % ROASTS.length]
}

// ── Weighted Probability Engine ──
// Computes per-match win probability for each team using:
//   Factor 1: Player prediction accuracy (current week 60% + previous week 40%)
//   Factor 2: IPL team form (home/away win rate from tournament data)
//   Factor 3: Player's team-specific accuracy (how well they pick THIS team)
//
// Final formula per remaining match M (home H vs away A):
//   P(H wins) = w1 * playerAccuracy(picker, H) + w2 * teamForm(H, home) + w3 * teamSpecificAcc(picker, H)
//   Normalized so P(H) + P(A) = 1
//
// Then: expectedPts(player) = SUM over remaining matches of P(picked_team_wins) * correctPts
// Weighted rank 1 probability = SUM over combos where player is #1 of P(combo)

const WEIGHTS = { accuracy: 0.35, teamForm: 0.40, teamSpecific: 0.25 }

function computePlayerAccuracyRate(weeklyScores, weeklyData, playerId, currentWeek) {
  // Current week accuracy
  const currData = weeklyScores.find(s => s.playerId === playerId)
  const currPlayed = currData?.played || 0
  const currWins = currData?.wins || 0
  const currRate = currPlayed > 0 ? currWins / currPlayed : 0.5

  // Previous week accuracy
  const prevWeek = currentWeek - 1
  const prevData = (weeklyData[prevWeek] || []).find(s => s.playerId === playerId)
  const prevPlayed = prevData?.played || 0
  const prevWins = prevData?.wins || 0
  const prevRate = prevPlayed > 0 ? prevWins / prevPlayed : 0.5

  // Overall accuracy (all weeks before current)
  let totalPlayed = 0, totalWins = 0
  for (const [w, scores] of Object.entries(weeklyData)) {
    if (Number(w) >= currentWeek) continue
    const s = scores.find(s => s.playerId === playerId)
    if (s) { totalPlayed += s.played; totalWins += s.wins }
  }
  const overallRate = totalPlayed > 0 ? totalWins / totalPlayed : 0.5

  // Weighted: current 50%, previous 30%, overall 20%
  const weighted = currPlayed > 0
    ? 0.50 * currRate + 0.30 * prevRate + 0.20 * overallRate
    : prevPlayed > 0
      ? 0.60 * prevRate + 0.40 * overallRate
      : overallRate

  return {
    current: currRate,
    previous: prevRate,
    overall: overallRate,
    weighted,
    currPlayed,
    prevPlayed,
    totalPlayed,
  }
}

function getTeamFormScore(teamFormData, teamAbbr, slot) {
  // slot = 'home' or 'away'
  const form = teamFormData?.[teamAbbr]
  if (!form) return 0.5
  const s = form[slot]
  if (!s || s.score === null) return 0.5
  return s.score / 10 // normalize 1-10 to 0.1-1.0
}

function getTeamSpecificAccuracy(teamAccuracy, playerId, teamAbbr) {
  const playerAcc = teamAccuracy?.[playerId]
  if (!playerAcc || !playerAcc[teamAbbr]) return 0.5
  const acc = playerAcc[teamAbbr]
  const total = (acc.home?.a || 0) + (acc.away?.a || 0)
  const correct = (acc.home?.c || 0) + (acc.away?.c || 0)
  if (total === 0) return 0.5
  return correct / total
}

// Compute match outcome probabilities using all factors
function computeMatchProbabilities(remainingMatches, teamFormData) {
  return remainingMatches.map(m => {
    const homeForm = getTeamFormScore(teamFormData, m.home, 'home')
    const awayForm = getTeamFormScore(teamFormData, m.away, 'away')
    // Normalize
    const total = homeForm + awayForm
    return {
      matchNum: m.matchNum,
      home: m.home,
      away: m.away,
      homeProb: total > 0 ? homeForm / total : 0.5,
      awayProb: total > 0 ? awayForm / total : 0.5,
    }
  })
}

// Full weighted simulation with probabilities
function simulateScenariosWeighted(
  weeklyScores, remainingMatches, predictions, correctPts, players,
  weeklyData, currentWeek, teamFormData, teamAccuracy
) {
  const playerIds = weeklyScores.map(s => s.playerId)
  const basePoints = {}
  const baseWins = {}
  weeklyScores.forEach(s => {
    basePoints[s.playerId] = s.points
    baseWins[s.playerId] = s.wins
  })

  const n = remainingMatches.length
  const totalCombos = 1 << n

  const results = {}
  playerIds.forEach(id => {
    results[id] = { bestRank: Infinity, worstRank: 0, rank1Count: 0, rankCounts: {}, weightedRank1: 0, expectedPoints: 0 }
  })

  const playerPicks = {}
  playerIds.forEach(id => {
    playerPicks[id] = remainingMatches.map(m => predictions[id]?.[m.matchNum] || null)
  })

  // Pre-compute match probabilities
  const matchProbs = computeMatchProbabilities(remainingMatches, teamFormData)

  // Pre-compute per-player accuracy profiles
  const accuracyProfiles = {}
  playerIds.forEach(id => {
    accuracyProfiles[id] = computePlayerAccuracyRate(weeklyScores, weeklyData, id, currentWeek)
  })

  // Pre-compute per-player expected points for each remaining match
  playerIds.forEach(id => {
    let expected = 0
    for (let i = 0; i < n; i++) {
      const pick = playerPicks[id][i]
      if (!pick) continue
      const mp = matchProbs[i]
      const pickProb = pick === mp.home ? mp.homeProb : mp.awayProb
      // Blend with player accuracy
      const acc = accuracyProfiles[id]
      const teamAcc = getTeamSpecificAccuracy(teamAccuracy, id, pick)
      const blended = WEIGHTS.teamForm * pickProb + WEIGHTS.accuracy * acc.weighted + WEIGHTS.teamSpecific * teamAcc
      expected += blended * correctPts
    }
    results[id].expectedPoints = Math.round(basePoints[id] + expected)
  })

  // Track rank-1 combo data for player-centric analysis
  const rank1ByPlayer = {}
  playerIds.forEach(id => { rank1ByPlayer[id] = [] })

  for (let combo = 0; combo < totalCombos; combo++) {
    const outcomes = remainingMatches.map((m, i) => (combo >> i) & 1 ? m.away : m.home)

    // Compute probability of this specific combo
    let comboProb = 1
    for (let i = 0; i < n; i++) {
      const mp = matchProbs[i]
      comboProb *= outcomes[i] === mp.home ? mp.homeProb : mp.awayProb
    }

    const pts = {}
    const wins = {}
    const correctCounts = {}
    playerIds.forEach(id => {
      let extraPts = 0, extraWins = 0, correct = 0
      for (let i = 0; i < n; i++) {
        if (playerPicks[id][i] === outcomes[i]) {
          extraPts += correctPts
          extraWins++
          correct++
        }
      }
      pts[id] = basePoints[id] + extraPts
      wins[id] = baseWins[id] + extraWins
      correctCounts[id] = correct
    })

    // Rank players
    const sorted = playerIds
      .map(id => ({ id, pts: pts[id], wins: wins[id] }))
      .sort((a, b) => b.pts - a.pts || b.wins - a.wins)

    let currentRank = 1
    const ranks = {}
    sorted.forEach((entry, i) => {
      if (i > 0 && (entry.pts !== sorted[i - 1].pts || entry.wins !== sorted[i - 1].wins)) {
        currentRank = i + 1
      }
      ranks[entry.id] = currentRank
      const r = results[entry.id]
      if (currentRank < r.bestRank) r.bestRank = currentRank
      if (currentRank > r.worstRank) r.worstRank = currentRank
      if (currentRank === 1) {
        r.rank1Count++
        r.weightedRank1 += comboProb
      }
      r.rankCounts[currentRank] = (r.rankCounts[currentRank] || 0) + 1
    })

    // Store for player-centric requirements
    playerIds.forEach(id => {
      if (ranks[id] === 1) {
        rank1ByPlayer[id].push({ correctCounts, comboProb })
      }
    })
  }

  // Compute player-centric requirements
  const playerRequirements = {}
  playerIds.forEach(targetId => {
    const combos = rank1ByPlayer[targetId]
    if (combos.length === 0) {
      playerRequirements[targetId] = null
      return
    }

    const req = {}
    playerIds.forEach(id => {
      const counts = combos.map(c => c.correctCounts[id])
      req[id] = { min: Math.min(...counts), max: Math.max(...counts) }
    })

    // Weighted probability of rank 1
    const totalWeightedProb = combos.reduce((sum, c) => sum + c.comboProb, 0)

    playerRequirements[targetId] = {
      perPlayer: req,
      totalPaths: combos.length,
      totalCombos,
      weightedProb: totalWeightedProb,
    }
  })

  return { results, totalCombos, playerRequirements, matchProbs, accuracyProfiles }
}

function TvAntennaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <line x1="8" y1="2" x2="12" y2="8" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="2" x2="12" y2="8" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="2" r="1" fill="var(--gold)" />
      <circle cx="16" cy="2" r="1" fill="var(--gold)" />
      <rect x="4" y="8" width="16" height="12" rx="2" fill="var(--gold)" opacity="0.2" stroke="var(--gold)" strokeWidth="1.2" />
      <rect x="6" y="10" width="12" height="8" rx="1" fill="var(--gold)" opacity="0.1" />
      <path d="M14 13 Q16 12 14 11" stroke="var(--gold)" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M15 14 Q18 12 15 10" stroke="var(--gold)" strokeWidth="0.6" fill="none" opacity="0.3" />
    </svg>
  )
}

function MootBucket() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      margin: '12px 0 4px', opacity: 0.9,
    }}>
      <svg width="80" height="90" viewBox="0 0 80 90">
        <path d="M15 25 L10 80 Q10 85 15 85 L65 85 Q70 85 70 80 L65 25 Z"
          fill="#3A2518" stroke="#5C3D2E" strokeWidth="1.5" />
        <ellipse cx="40" cy="25" rx="28" ry="6" fill="#5C3D2E" stroke="#7A5640" strokeWidth="1" />
        <ellipse cx="40" cy="35" rx="24" ry="5" fill="rgba(255,215,0,0.3)" />
        <path d="M18 35 Q16 35 16 37 L13 75 Q13 80 18 80 L62 80 Q67 80 67 75 L64 37 Q64 35 62 35 Z"
          fill="rgba(255,215,0,0.2)" />
        <ellipse cx="35" cy="36" rx="8" ry="2" fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="0.5">
          <animate attributeName="rx" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <path d="M20 20 Q40 5 60 20" fill="none" stroke="#7A5640" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="38" cy="12" r="2" fill="rgba(255,215,0,0.5)">
          <animate attributeName="cy" values="8;32" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="43" cy="5" r="1.5" fill="rgba(255,215,0,0.4)">
          <animate attributeName="cy" values="5;32" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
          <animate attributeName="opacity" values="0.7;0" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
        </circle>
      </svg>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--gold)', opacity: 0.6,
        marginTop: 2, letterSpacing: 0.5,
      }}>
        moot pee le bhai
      </div>
    </div>
  )
}

export default function ScenarioCentral({ weeklyData, players, selectedWeek, matchSchedule, allPredictions, teamFormData, teamAccuracy }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const weekScores = weeklyData?.[selectedWeek] || []
  const weekMatches = matchSchedule?.[selectedWeek] || []
  const weekPredictions = allPredictions?.[selectedWeek] || {}

  const remainingMatches = weekMatches.filter(m => m.winner === undefined)
  const completedCount = weekMatches.length - remainingMatches.length
  const noResultsYet = weekMatches.length > 0 && completedCount === 0
  const correctPts = 10

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
    return simulateScenariosWeighted(
      weekScores, remainingMatches, weekPredictions, correctPts, players,
      weeklyData, selectedWeek, teamFormData, teamAccuracy
    )
  }, [selectedPlayer, weekScores, remainingMatches, weekPredictions, players, weeklyData, selectedWeek, teamFormData, teamAccuracy])

  if (!weekScores.length || weekMatches.length === 0) return null

  const playerObj = players.find(p => p.id === selectedPlayer)
  const currentEntry = currentRanked.find(r => r.playerId === selectedPlayer)
  const playerResult = scenario?.results?.[selectedPlayer]

  return (
    <div style={{
      margin: '10px 12px 0', borderRadius: 14,
      background: 'linear-gradient(135deg, #132237, #1A2D47)',
      border: '1px solid rgba(255,215,0,0.15)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '12px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TvAntennaIcon />
          <div>
            <div style={{
              fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
              color: 'var(--gold)',
            }}>
              Scenario Central
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
              {noResultsYet
                ? 'Abhi toh week shuru bhi nahi hua — ruk ja'
                : remainingMatches.length === 0
                  ? 'Sab matches ho gaye — ab kya hi scenario dekhega'
                  : `${completedCount} done, ${remainingMatches.length} baaki — apni aukaat check kar`}
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
          {!noResultsYet && <div style={{ marginBottom: 14 }}>
            <select
              value={selectedPlayer || ''}
              onChange={e => setSelectedPlayer(Number(e.target.value) || null)}
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text)', padding: '10px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <option value="">Kiska scenario dekhna hai?</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>}

          {/* No results yet */}
          {noResultsYet && (
            <div style={{
              padding: '20px 16px', textAlign: 'center',
              background: 'rgba(0,0,0,0.2)', borderRadius: 10,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📺</div>
              <div style={{
                fontSize: 14, fontWeight: 900, color: 'var(--orange)',
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                Bklodeyyyy
              </div>
              <div style={{
                fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6,
              }}>
                Result toh update hone de pehle.
                <br />
                Abhi koi match ka result nahi aaya — scenario kya dikhaye?
              </div>
              <div style={{
                fontSize: 10, color: 'var(--text-secondary)', marginTop: 10,
                opacity: 0.5, fontStyle: 'italic',
              }}>
                Jaise hi Rajjo results daalega, yahaan analysis aa jayega
              </div>
            </div>
          )}

          {remainingMatches.length === 0 && !noResultsYet && (
            <div style={{
              padding: 16, textAlign: 'center', color: 'var(--text-secondary)',
              fontSize: 12, fontStyle: 'italic',
            }}>
              Week khatam bhai. Jo ho gaya so ho gaya. Ab Weekly leaderboard dekh le.
            </div>
          )}

          {!noResultsYet && selectedPlayer && remainingMatches.length > 0 && scenario && playerResult && (
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

              {/* Accuracy profile badge */}
              <AccuracyBadge profile={scenario.accuracyProfiles[selectedPlayer]} playerName={playerObj?.name} />

              <ScenarioVerdict
                playerResult={playerResult}
                scenario={scenario}
                playerObj={playerObj}
                players={players}
                currentRank={currentEntry?.rank}
                remainingMatches={remainingMatches}
                currentRanked={currentRanked}
                selectedPlayer={selectedPlayer}
                teamFormData={teamFormData}
                teamAccuracy={teamAccuracy}
                weeklyData={weeklyData}
                selectedWeek={selectedWeek}
              />
            </div>
          )}

          {!noResultsYet && !selectedPlayer && remainingMatches.length > 0 && (
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

function AccuracyBadge({ profile, playerName }) {
  if (!profile) return null
  const pct = Math.round(profile.weighted * 100)
  const color = pct >= 60 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--red)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      background: 'rgba(0,0,0,0.15)', borderRadius: 8, marginBottom: 10,
      border: `1px solid ${color}20`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#132237',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, color,
        }}>
          {pct}%
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Prediction Accuracy
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>
          This week {Math.round(profile.current * 100)}%
          {profile.prevPlayed > 0 && <> &middot; Last week {Math.round(profile.previous * 100)}%</>}
          {profile.totalPlayed > 0 && <> &middot; Overall {Math.round(profile.overall * 100)}%</>}
        </div>
      </div>
    </div>
  )
}

function ScenarioVerdict({ playerResult, scenario, playerObj, players, currentRank, remainingMatches, currentRanked, selectedPlayer, teamFormData, teamAccuracy, weeklyData, selectedWeek }) {
  const { bestRank, worstRank, rank1Count, rankCounts, weightedRank1, expectedPoints } = playerResult
  const { totalCombos, playerRequirements, matchProbs, accuracyProfiles } = scenario
  const rawPct = Math.round((rank1Count / totalCombos) * 100)
  const weightedPct = Math.round(weightedRank1 * 100)
  const n = remainingMatches.length
  const req = playerRequirements[selectedPlayer]

  const playerLookup = {}
  players.forEach(p => { playerLookup[p.id] = p })

  // Already #1 and guaranteed
  if (bestRank === 1 && worstRank === 1) {
    return (
      <div>
        <VerdictCard
          emoji="👑"
          color="var(--gold)"
          title="BOSS MODE ON"
          subtitle={`${playerObj?.name} gaddi mein baitha hai — koi nahi hila sakta. Week sealed.`}
        />
        <FormulaNote />
      </div>
    )
  }

  // Rank 1 is possible
  if (rank1Count > 0 && req) {
    const pctColor = weightedPct >= 50 ? 'var(--green)' : weightedPct >= 20 ? 'var(--orange)' : 'var(--red)'

    // Build opponent analysis
    const selfReq = req.perPlayer[selectedPlayer]
    const threats = currentRanked
      .filter(r => r.playerId !== selectedPlayer)
      .map(r => ({
        ...r,
        player: playerLookup[r.playerId],
        reqData: req.perPlayer[r.playerId],
        accuracy: accuracyProfiles[r.playerId],
      }))
      .filter(t => t.reqData && t.reqData.max < n)
      .slice(0, 6)

    return (
      <div>
        <VerdictCard
          emoji="🔥"
          color="var(--green)"
          title="CHANCE HAI BHAI!"
          subtitle={`${rank1Count} out of ${totalCombos} scenarios mein ${playerObj?.name} #1 finish karega`}
        />

        {/* Dual probability bars — raw vs weighted */}
        <div style={{
          margin: '10px 0', padding: '10px 14px',
          background: 'rgba(0,0,0,0.2)', borderRadius: 10,
        }}>
          {/* Weighted (smart) probability */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Smart Probability
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: pctColor }}>
              {weightedPct}%
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%', borderRadius: 4, width: `${weightedPct}%`,
              background: `linear-gradient(90deg, ${pctColor}, var(--gold))`,
              transition: 'width 0.5s',
            }} />
          </div>

          {/* Raw (brute force) probability */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
          }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Raw (equal odds)
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {rawPct}%
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, width: `${rawPct}%`,
              background: 'var(--text-secondary)', opacity: 0.4,
              transition: 'width 0.5s',
            }} />
          </div>
        </div>

        {/* Expected points projection */}
        <div style={{
          padding: '8px 12px', background: 'rgba(255,215,0,0.06)', borderRadius: 8,
          border: '1px solid rgba(255,215,0,0.1)', marginBottom: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Projected End-of-Week Points
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
              Based on team form + prediction accuracy
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gold)' }}>
            ~{expectedPoints}
          </div>
        </div>

        {/* Match-by-match probability breakdown */}
        <MatchProbabilities
          matchProbs={matchProbs}
          playerPicks={remainingMatches.map(m => ({
            matchNum: m.matchNum,
            home: m.home,
            away: m.away,
            pick: (scenario.results ? Object.keys(scenario.results) : []).length > 0
              ? (weeklyData?.[selectedWeek] ? null : null)
              : null,
          }))}
          predictions={weeklyData?.[selectedWeek] ? undefined : undefined}
          selectedPlayer={selectedPlayer}
          allPredictions={null}
          remainingMatches={remainingMatches}
          weekPredictions={null}
        />

        {/* Player-centric requirements with opponent intel */}
        <div style={{
          padding: '12px 14px', background: 'rgba(0,0,0,0.15)',
          borderRadius: 10, marginTop: 8,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: 'var(--gold)', marginBottom: 10,
          }}>
            {playerObj?.name} jeetega agar remaining {n} games mein:
          </div>

          <PlayerReqRow
            player={playerObj}
            label={`${playerObj?.name} ke`}
            min={selfReq.min}
            max={selfReq.max}
            total={n}
            isSelf
            accuracy={accuracyProfiles[selectedPlayer]}
          />

          {threats.map(t => (
            <PlayerReqRow
              key={t.playerId}
              player={t.player}
              label={`${t.player.name} ke`}
              min={t.reqData.min}
              max={t.reqData.max}
              total={n}
              accuracy={t.accuracy}
            />
          ))}

          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--gold)',
            marginTop: 10, paddingTop: 8,
            borderTop: '1px solid rgba(255,215,0,0.15)',
          }}>
            Tab chance hai — warna moot piyega bhai
          </div>
        </div>

        <RankDistribution rankCounts={rankCounts} totalCombos={totalCombos} />
        <FormulaNote />
      </div>
    )
  }

  // Rank 1 NOT possible
  return (
    <div>
      <VerdictCard
        emoji="💀"
        color="var(--red)"
        title={`${pickRoast(playerObj?.id)} — TUMSE NA HO PAYEGA BETA`}
        subtitle={`${playerObj?.name} ka Rank 1 is IMPOSSIBLE this week. Chahe kuch bhi ho jaye, #1 nahi aa sakta.`}
      />

      <MootBucket />

      {/* Expected final points even in defeat */}
      <div style={{
        padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
        marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Projected points
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--orange)' }}>
          ~{expectedPoints}
        </span>
      </div>

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
              Sab kuch tera favor mein ho toh bhi max yahan tak:
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

      <RankDistribution rankCounts={rankCounts} totalCombos={totalCombos} />
      <FormulaNote />
    </div>
  )
}

function MatchProbabilities({ matchProbs, remainingMatches }) {
  if (!matchProbs || matchProbs.length === 0) return null

  return (
    <div style={{
      padding: '10px 12px', background: 'rgba(0,0,0,0.15)',
      borderRadius: 10, marginBottom: 8,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      }}>
        Match Win Probabilities (Team Form)
      </div>
      {matchProbs.map((mp, i) => {
        const homePct = Math.round(mp.homeProb * 100)
        const awayPct = 100 - homePct
        return (
          <div key={mp.matchNum} style={{ marginBottom: i < matchProbs.length - 1 ? 8 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text)' }}>{mp.home}</span>
              <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>M{mp.matchNum}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text)' }}>{mp.away}</span>
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
              <div style={{
                width: `${homePct}%`, background: 'var(--blue)', borderRadius: '3px 0 0 3px',
                transition: 'width 0.3s',
              }} />
              <div style={{
                width: `${awayPct}%`, background: 'var(--orange)', borderRadius: '0 3px 3px 0',
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--blue)' }}>{homePct}%</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--orange)' }}>{awayPct}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PlayerReqRow({ player, label, min, max, total, isSelf, accuracy }) {
  const rangeText = min === max
    ? `${min} out of ${total} sahi ho`
    : `${min}-${max} out of ${total} sahi ho`

  const accPct = accuracy ? Math.round(accuracy.weighted * 100) : null
  const accColor = accPct >= 60 ? 'var(--green)' : accPct >= 40 ? 'var(--orange)' : 'var(--red)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <Avatar player={player} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: isSelf ? 'var(--gold)' : 'var(--text)',
        }}>
          {label}
        </span>
        {accPct !== null && (
          <span style={{ fontSize: 9, color: accColor, marginLeft: 6, fontWeight: 600 }}>
            ({accPct}% acc)
          </span>
        )}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        color: isSelf ? 'var(--green)' : 'var(--text-secondary)',
        textAlign: 'right',
      }}>
        {rangeText}
      </div>
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

function RankDistribution({ rankCounts, totalCombos }) {
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
      {ranks.map(rank => {
        const count = rankCounts[rank]
        const pct = Math.round((count / totalCombos) * 100)
        const barPct = (count / maxCount) * 100
        const color = rank === 1 ? 'var(--gold)' : rank <= 3 ? 'var(--green)' : rank >= 10 ? 'var(--red)' : 'var(--blue)'
        return (
          <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color, minWidth: 22, textAlign: 'right' }}>
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

function FormulaNote() {
  return (
    <div style={{
      marginTop: 10, padding: '10px 12px',
      background: 'rgba(255,215,0,0.04)', borderRadius: 8,
      border: '1px solid rgba(255,215,0,0.08)',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 6,
      }}>
        How this works
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'monospace' }}>
        <div><strong>Smart Probability</strong> = weighted sum across all 2^N outcome combos</div>
        <div style={{ marginTop: 4 }}>Per-combo weight = product of each match's team win probability:</div>
        <div style={{ marginTop: 2, paddingLeft: 8, color: 'var(--gold)', opacity: 0.8 }}>
          P(team wins) = Team Form (home/away win rate in IPL)
        </div>
        <div style={{ marginTop: 6 }}><strong>Projected Points</strong> = current pts + SUM over remaining matches of:</div>
        <div style={{ paddingLeft: 8, marginTop: 2, color: 'var(--gold)', opacity: 0.8 }}>
          (0.40 * teamFormProb + 0.35 * playerAccuracy + 0.25 * teamSpecificAcc) * pointsPerCorrect
        </div>
        <div style={{ marginTop: 6 }}><strong>Player Accuracy</strong> = 50% this week + 30% last week + 20% overall</div>
        <div style={{ marginTop: 2 }}><strong>Team Specific Acc</strong> = player's hit rate when picking that specific team</div>
        <div style={{ marginTop: 6, fontStyle: 'italic', opacity: 0.6 }}>
          Raw probability treats all outcomes as equally likely (coin flip). Smart probability uses real IPL data.
        </div>
      </div>
    </div>
  )
}
