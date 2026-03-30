import { useState } from 'react'
import { PLAYERS, MATCH_SCHEDULE, ALL_PREDICTIONS, IPL_TEAMS } from '../data/sampleData'
import Avatar from './Avatar'

export default function PredictionsView({ selectedWeek }) {
  const matches = MATCH_SCHEDULE[selectedWeek] || []
  const weekPredictions = ALL_PREDICTIONS[selectedWeek] || {}

  if (matches.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        No match data yet for Week {selectedWeek}
      </div>
    )
  }

  // Count correct/incorrect/nr per player for the summary
  const playerStats = {}
  PLAYERS.forEach((p) => {
    let correct = 0, incorrect = 0, nr = 0
    matches.forEach((m) => {
      const pick = (weekPredictions[p.id] || {})[m.matchNum]
      if (!pick || m.winner === undefined) return
      if (m.winner === null) nr++
      else if (pick === m.winner) correct++
      else incorrect++
    })
    playerStats[p.id] = { correct, incorrect, nr }
  })

  return (
    <div style={{ padding: '4px 12px 0' }}>
      {/* Subtitle */}
      <div style={{
        fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600,
        padding: '8px 2px 12px', letterSpacing: 0.3,
      }}>
        Tap any match to see all players' picks
      </div>

      {/* Match cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map((match) => (
          <MatchCard
            key={match.matchNum}
            match={match}
            weekPredictions={weekPredictions}
          />
        ))}
      </div>

      {/* Weekly picks summary per player — only show when matches have results */}
      {matches.some((m) => m.winner !== undefined) && (
      <div style={{
        marginTop: 16, padding: 14,
        background: 'var(--surface)', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 4, height: 14, borderRadius: 2, background: 'var(--blue)' }} />
          Week {selectedWeek} Accuracy
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PLAYERS
            .map((p) => ({ ...p, stats: playerStats[p.id] }))
            .sort((a, b) => b.stats.correct - a.stats.correct)
            .map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 8px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
              }}>
                <Avatar player={p} size={24} />
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <div style={{ display: 'flex', gap: 6, fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ color: 'var(--green)' }}>{p.stats.correct}</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
                  <span style={{ color: 'var(--red)' }}>{p.stats.incorrect}</span>
                  {p.stats.nr > 0 && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
                      <span style={{ color: 'var(--blue)' }}>{p.stats.nr}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
        <div style={{
          display: 'flex', gap: 14, padding: '10px 0 0',
          fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)',
        }}>
          <LegendDot color="var(--green)" label="Correct" />
          <LegendDot color="var(--red)" label="Wrong" />
          <LegendDot color="var(--blue)" label="No Result" />
        </div>
      </div>
      )}
    </div>
  )
}

function MatchCard({ match, weekPredictions }) {
  const [expanded, setExpanded] = useState(false)
  const isNoResult = match.winner === null
  const isPending = match.winner === undefined
  const homeTeam = IPL_TEAMS.find((t) => t.abbr === match.home)
  const awayTeam = IPL_TEAMS.find((t) => t.abbr === match.away)

  // Count how many got it right
  let correctCount = 0
  let totalPicks = 0
  PLAYERS.forEach((p) => {
    const pick = (weekPredictions[p.id] || {})[match.matchNum]
    if (pick) {
      totalPicks++
      if (!isPending && !isNoResult && pick === match.winner) correctCount++
    }
  })

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
    }}>
      {/* Match header — always visible, tappable */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {/* Match number */}
        <div style={{
          fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)',
          background: 'rgba(255,255,255,0.06)', borderRadius: 6,
          padding: '4px 7px', letterSpacing: 0.3, flexShrink: 0,
        }}>
          #{match.matchNum}
        </div>

        {/* Teams */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800 }}>
            <TeamBadge team={homeTeam} abbr={match.home} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>vs</span>
            <TeamBadge team={awayTeam} abbr={match.away} />
          </div>
          {!isPending && (
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3, color: isNoResult ? 'var(--blue)' : 'var(--green)' }}>
              {isNoResult ? 'No Result — 5pts all' : `Winner: ${match.winner}`}
            </div>
          )}
        </div>

        {/* Stats badge + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isPending && !isNoResult && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: 'var(--green)',
              background: 'rgba(0,200,83,0.12)', padding: '3px 8px', borderRadius: 6,
            }}>
              {correctCount}/{totalPicks}
            </div>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              color: 'var(--text-secondary)', transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expanded: all players' picks */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 10px 14px',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 4,
          }}>
            {PLAYERS.map((p) => {
              const pick = (weekPredictions[p.id] || {})[match.matchNum]
              const pickedTeam = IPL_TEAMS.find((t) => t.abbr === pick)

              let status = 'pending'
              let bg = 'rgba(255,255,255,0.03)'
              let borderColor = 'rgba(255,255,255,0.04)'
              let statusIcon = ''

              if (pick && !isPending) {
                if (isNoResult) {
                  status = 'nr'
                  bg = 'rgba(41,121,255,0.08)'
                  borderColor = 'rgba(41,121,255,0.15)'
                  statusIcon = '◎'
                } else if (pick === match.winner) {
                  status = 'correct'
                  bg = 'rgba(0,200,83,0.08)'
                  borderColor = 'rgba(0,200,83,0.2)'
                  statusIcon = '✓'
                } else {
                  status = 'wrong'
                  bg = 'rgba(255,23,68,0.06)'
                  borderColor = 'rgba(255,23,68,0.15)'
                  statusIcon = '✗'
                }
              }

              const statusColors = {
                correct: 'var(--green)',
                wrong: 'var(--red)',
                nr: 'var(--blue)',
                pending: 'var(--text-secondary)',
              }

              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10,
                  background: bg, border: `1px solid ${borderColor}`,
                }}>
                  <Avatar player={p} size={22} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: pickedTeam?.color || 'var(--text-secondary)', marginTop: 1 }}>
                      {pick || '—'}
                    </div>
                  </div>
                  {statusIcon && (
                    <span style={{
                      fontSize: 13, fontWeight: 900, color: statusColors[status],
                      width: 20, textAlign: 'center',
                    }}>
                      {statusIcon}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TeamBadge({ team, abbr }) {
  return (
    <span style={{
      fontSize: 13, fontWeight: 900, color: team?.color || '#fff',
      letterSpacing: 0.3,
    }}>
      {abbr}
    </span>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span>{label}</span>
    </div>
  )
}
