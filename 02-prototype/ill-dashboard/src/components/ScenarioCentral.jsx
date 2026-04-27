import { useState, useMemo } from 'react'
import Avatar from './Avatar'

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

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

export default function ScenarioCentral({ weeklyData, players, selectedWeek, matchSchedule, allPredictions }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedOutcomes, setSelectedOutcomes] = useState({})

  const weekScores = weeklyData?.[selectedWeek] || []
  const weekMatches = matchSchedule?.[selectedWeek] || []
  const weekPredictions = allPredictions?.[selectedWeek] || {}
  const correctPts = 10

  // Split matches into completed vs remaining
  const completedMatches = weekMatches.filter(m => m.winner !== undefined && m.winner !== null)
  const remainingMatches = weekMatches.filter(m => m.winner === undefined || m.winner === null)
  const selectedCount = Object.keys(selectedOutcomes).length

  // Current standings (before any scenario toggles)
  const currentRanked = useMemo(() => {
    if (!weekScores.length) return []
    const sorted = [...weekScores].sort((a, b) => b.points - a.points || b.wins - a.wins)
    let rank = 1
    return sorted.map((s, i) => {
      if (i > 0 && (s.points !== sorted[i - 1].points || s.wins !== sorted[i - 1].wins)) rank = i + 1
      return { ...s, rank }
    })
  }, [weekScores])

  // Build a lookup: playerId -> current rank
  const currentRankMap = useMemo(() => {
    const map = {}
    currentRanked.forEach(r => { map[r.playerId] = r.rank })
    return map
  }, [currentRanked])

  // Projected standings based on toggled outcomes
  const projectedRanked = useMemo(() => {
    if (!weekScores.length) return []
    if (selectedCount === 0) return currentRanked

    // Start with current scores
    const projected = weekScores.map(s => ({
      playerId: s.playerId,
      points: s.points,
      wins: s.wins,
      losses: s.losses,
      played: s.played,
    }))

    // Apply each selected outcome
    for (const [matchNumStr, winner] of Object.entries(selectedOutcomes)) {
      const matchNum = Number(matchNumStr)
      projected.forEach(p => {
        const pick = weekPredictions[p.playerId]?.[matchNum]
        if (!pick) return
        if (pick === winner) {
          p.points += correctPts
          p.wins += 1
        } else {
          p.losses += 1
        }
        p.played += 1
      })
    }

    // Rank
    const sorted = [...projected].sort((a, b) => b.points - a.points || b.wins - a.wins)
    let rank = 1
    return sorted.map((s, i) => {
      if (i > 0 && (s.points !== sorted[i - 1].points || s.wins !== sorted[i - 1].wins)) rank = i + 1
      return { ...s, rank }
    })
  }, [weekScores, selectedOutcomes, selectedCount, weekPredictions, currentRanked, correctPts])

  const toggleOutcome = (matchNum, team) => {
    setSelectedOutcomes(prev => {
      if (prev[matchNum] === team) {
        // Deselect
        const next = { ...prev }
        delete next[matchNum]
        return next
      }
      return { ...prev, [matchNum]: team }
    })
  }

  const resetAll = () => setSelectedOutcomes({})

  if (!weekScores.length || weekMatches.length === 0) return null

  const allDone = remainingMatches.length === 0
  const noResultsYet = weekMatches.length > 0 && completedMatches.length === 0

  const playerLookup = {}
  players.forEach(p => { playerLookup[p.id] = p })

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
              {allDone
                ? 'All matches completed — final standings are in'
                : noResultsYet
                  ? 'No results yet — check back after matches start'
                  : `${completedMatches.length} done, ${remainingMatches.length} remaining — toggle outcomes to see projections`}
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

          {/* No results yet state */}
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
                Hold On!
              </div>
              <div style={{
                fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6,
              }}>
                No match results have been updated yet.
                <br />
                Scenarios will be available once results start coming in.
              </div>
              <div style={{
                fontSize: 10, color: 'var(--text-secondary)', marginTop: 10,
                opacity: 0.5, fontStyle: 'italic',
              }}>
                Analysis will appear here once results are entered
              </div>
            </div>
          )}

          {/* All done state */}
          {allDone && !noResultsYet && (
            <div style={{
              padding: 16, textAlign: 'center', color: 'var(--text-secondary)',
              fontSize: 12, fontStyle: 'italic',
            }}>
              All matches are done for this week. Check the Weekly leaderboard for final standings.
            </div>
          )}

          {/* Main interactive content */}
          {!noResultsYet && !allDone && (
            <>
              {/* Status bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', marginBottom: 12,
                background: 'rgba(255,215,0,0.06)',
                border: '1px solid rgba(255,215,0,0.1)',
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>
                  {remainingMatches.length}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  matches remaining
                  <br />
                  <strong style={{ color: 'var(--text)' }}>Tap teams to pick winners</strong>
                </div>
              </div>

              {/* Completed matches (locked) */}
              {completedMatches.length > 0 && (
                <>
                  <SectionLabel>Completed Matches</SectionLabel>
                  {completedMatches.map(m => (
                    <LockedMatchCard key={m.matchNum} match={m} />
                  ))}
                </>
              )}

              {/* Upcoming matches (toggleable) */}
              <SectionLabel>Upcoming — Pick Winners</SectionLabel>
              {remainingMatches.map(m => (
                <ToggleMatchCard
                  key={m.matchNum}
                  match={m}
                  selected={selectedOutcomes[m.matchNum] || null}
                  onToggle={(team) => toggleOutcome(m.matchNum, team)}
                />
              ))}

              {/* Projected Standings */}
              <SectionLabel>
                {selectedCount > 0
                  ? `Projected Standings (${selectedCount} of ${remainingMatches.length} set)`
                  : 'Current Standings'}
              </SectionLabel>
              {/* Table header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px', marginBottom: 2,
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>#</div>
                <div style={{ width: 26 }} />
                <div style={{ flex: 1, fontSize: 8, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Player</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>W-L</div>
                <div style={{ fontSize: 8, fontWeight: 700, minWidth: 30, textAlign: 'right', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pts</div>
                {selectedCount > 0 && (
                  <div style={{ fontSize: 8, fontWeight: 700, minWidth: 24, textAlign: 'right', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>▲▼</div>
                )}
              </div>
              {projectedRanked.map(entry => {
                const player = playerLookup[entry.playerId]
                if (!player) return null
                const currentRank = currentRankMap[entry.playerId] || entry.rank
                const delta = selectedCount > 0 ? currentRank - entry.rank : 0
                return (
                  <ProjectionRow
                    key={entry.playerId}
                    player={player}
                    rank={entry.rank}
                    points={entry.points}
                    wins={entry.wins}
                    losses={entry.losses}
                    delta={delta}
                    hasSelection={selectedCount > 0}
                  />
                )
              })}

              {/* Reset button */}
              {selectedCount > 0 && (
                <button
                  onClick={resetAll}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: 'var(--text-secondary)',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}
                >
                  <ResetIcon />
                  Reset all picks
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, color: 'var(--gold)',
      textTransform: 'uppercase', letterSpacing: 1,
      margin: '16px 0 10px', paddingBottom: 6,
      borderBottom: '1px solid rgba(255,215,0,0.12)',
    }}>
      {children}
    </div>
  )
}

function LockedMatchCard({ match }) {
  const { matchNum, home, away, winner, date } = match
  return (
    <div style={{
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
      opacity: 0.55,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Match {matchNum}{date ? ` · ${date}` : ''}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 700, color: 'var(--green)',
          background: 'rgba(76,175,80,0.15)',
          padding: '2px 6px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: 0.3,
        }}>
          Result
        </span>
      </div>
      <div style={{
        display: 'flex', borderRadius: 8, overflow: 'hidden',
        background: 'rgba(0,0,0,0.3)', height: 42,
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800,
          color: winner === home ? 'var(--bg)' : 'var(--text-secondary)',
          background: winner === home ? 'var(--green)' : 'transparent',
          opacity: winner === home ? 1 : 0.3,
        }}>
          {home}
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800,
          color: winner === away ? 'var(--bg)' : 'var(--text-secondary)',
          background: winner === away ? 'var(--green)' : 'transparent',
          opacity: winner === away ? 1 : 0.3,
        }}>
          {away}
        </div>
      </div>
    </div>
  )
}

function ToggleMatchCard({ match, selected, onToggle }) {
  const { matchNum, home, away, date } = match
  const isActive = selected !== null

  return (
    <div style={{
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
      background: 'rgba(0,0,0,0.2)',
      border: isActive ? '1px solid rgba(255,215,0,0.2)' : '1px solid transparent',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Match {matchNum}{date ? ` · ${date}` : ''}
        </span>
      </div>
      <div style={{
        display: 'flex', borderRadius: 8, overflow: 'hidden',
        background: 'rgba(0,0,0,0.3)', height: 42,
        cursor: 'pointer', position: 'relative',
      }}>
        {/* Home team */}
        <div
          onClick={() => onToggle(home)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
            transition: 'all 0.25s ease',
            color: selected === home ? 'var(--bg)' : 'var(--text-secondary)',
            background: selected === home ? 'var(--green)' : 'transparent',
            opacity: selected && selected !== home ? 0.35 : 1,
          }}
        >
          {home}
        </div>
        {/* Away team */}
        <div
          onClick={() => onToggle(away)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
            transition: 'all 0.25s ease',
            color: selected === away ? 'var(--bg)' : 'var(--text-secondary)',
            background: selected === away ? 'var(--green)' : 'transparent',
            opacity: selected && selected !== away ? 0.35 : 1,
          }}
        >
          {away}
        </div>
        {/* VS indicator when nothing selected */}
        {!selected && (
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 8, fontWeight: 900, color: 'var(--text-secondary)',
            background: 'rgba(0,0,0,0.5)',
            padding: '2px 5px', borderRadius: 4,
            pointerEvents: 'none',
          }}>
            VS
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectionRow({ player, rank, points, wins, losses, delta, hasSelection }) {
  const rankColor = rank === 1 ? 'var(--gold)' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-secondary)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px', borderRadius: 8,
      marginBottom: 3,
      transition: 'all 0.3s ease',
      background: 'rgba(0,0,0,0.1)',
    }}>
      <div style={{
        fontSize: 14, fontWeight: 900, minWidth: 28, textAlign: 'center',
        color: rankColor,
      }}>
        #{rank}
      </div>
      <Avatar player={player} size={26} />
      <div style={{ flex: 1, fontSize: 11, fontWeight: 700 }}>
        {player.name}
      </div>
      <div style={{
        fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600,
      }}>
        {wins}W-{losses}L
      </div>
      <div style={{
        fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        minWidth: 30, textAlign: 'right',
        color: rank === 1 ? 'var(--gold)' : 'var(--text)',
      }}>
        {points}
      </div>
      {hasSelection && (
        <div style={{
          fontSize: 9, fontWeight: 700, minWidth: 24, textAlign: 'right',
          color: delta > 0 ? 'var(--green)' : delta < 0 ? 'var(--red)' : 'var(--text-secondary)',
        }}>
          {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '–'}
        </div>
      )}
    </div>
  )
}
