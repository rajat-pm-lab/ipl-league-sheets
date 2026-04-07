import { useState } from 'react'
import { IPL_TEAMS } from '../data/sampleData'
import Avatar from './Avatar'

export default function PredictionsView({ selectedWeek, data }) {
  const players = data?.players || []
  const matches = (data?.matchSchedule || {})[selectedWeek] || []
  const weekPredictions = (data?.allPredictions || {})[selectedWeek] || {}
  const weekRules = (data?.weeklyRules || {})[selectedWeek] || {}

  // Detect if this week has DD or HT mechanics
  const allPicks = Object.values(weekPredictions)
  const hasDD = allPicks.some((p) => p._doubleDip)
  const hasHT = allPicks.some((p) => p._hateTeam)

  if (matches.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        No match data yet for Week {selectedWeek}
      </div>
    )
  }

  // Count correct/incorrect/nr per player for the summary
  const playerStats = {}
  players.forEach((p) => {
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
      {/* Week rules strip */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        padding: '8px 2px 12px',
      }}>
        <RuleChip label={`✓ Correct +${weekRules.correct ?? 10}`} color="var(--green)" />
        {(hasDD || hasHT) && (
          <RuleChip label={`✗ Wrong 0`} color="var(--text-secondary)" />
        )}
        {hasDD && (
          <>
            <RuleChip label="🎯 DD Correct +20" color="#FF9800" />
            <RuleChip label="🎯 DD Wrong -10" color="var(--red)" />
          </>
        )}
        {hasHT && (
          <>
            <RuleChip label="💀 HT Loses +15" color="var(--green)" />
            <RuleChip label="💀 HT Wins -5" color="var(--red)" />
          </>
        )}
      </div>

      {/* Match cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map((match) => (
          <MatchCard
            key={match.matchNum}
            match={match}
            weekPredictions={weekPredictions}
            players={players}
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
            {players
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

function MatchCard({ match, weekPredictions, players }) {
  const [expanded, setExpanded] = useState(false)
  const isNoResult = match.winner === null
  const isPending = match.winner === undefined
  const homeTeam = IPL_TEAMS.find((t) => t.abbr === match.home)
  const awayTeam = IPL_TEAMS.find((t) => t.abbr === match.away)

  // Count how many players have this as their Double Dip match
  const doubleDipCount = players.filter((p) => (weekPredictions[p.id] || {})._doubleDip === match.matchNum).length

  let correctCount = 0
  let totalPicks = 0
  players.forEach((p) => {
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
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '14px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div style={{
          fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)',
          background: 'rgba(255,255,255,0.06)', borderRadius: 6,
          padding: '4px 7px', letterSpacing: 0.3, flexShrink: 0,
        }}>
          #{match.matchNum}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800 }}>
            <TeamBadge team={homeTeam} abbr={match.home} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>vs</span>
            <TeamBadge team={awayTeam} abbr={match.away} />
          </div>
          {!isPending && (
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3, color: isNoResult ? 'var(--blue)' : 'var(--green)' }}>
              {isNoResult ? 'No Result — 0pts all' : `Winner: ${match.winner}`}
            </div>
          )}
          {isPending && match.date && (
            <div style={{ fontSize: 10, fontWeight: 600, marginTop: 3, color: 'var(--text-secondary)' }}>
              {match.date}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {doubleDipCount > 0 && (
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#FF9800',
              background: 'rgba(255,152,0,0.15)', padding: '2px 6px', borderRadius: 5,
              letterSpacing: 0.3,
            }}>
              🎯×{doubleDipCount}
            </div>
          )}
          {!isPending && !isNoResult && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: 'var(--green)',
              background: 'rgba(0,200,83,0.12)', padding: '3px 8px', borderRadius: 6,
            }}>
              {correctCount}/{totalPicks}
            </div>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {players.map((p) => {
            const playerPicks = weekPredictions[p.id] || {}
            const pick = playerPicks[match.matchNum]
            const pickedTeam = IPL_TEAMS.find((t) => t.abbr === pick)
            const isDD = playerPicks._doubleDip === match.matchNum
            const hateTeam = playerPicks._hateTeam
            const hateTeamPlaying = hateTeam && (match.home === hateTeam || match.away === hateTeam)
            const isHate = hateTeamPlaying && !isDD

            // Determine outcome, chip style, row style, and points
            let chip = null
            let bg = 'rgba(255,255,255,0.02)'
            let borderColor = 'rgba(255,255,255,0.04)'
            let pts = null
            let ptsColor = 'var(--text-secondary)'

            if (!isPending) {
              if (isNoResult) {
                chip = <StatusChip label="◎ NR" chipBg="rgba(41,121,255,0.15)" chipColor="var(--blue)" chipBorder="rgba(41,121,255,0.3)" />
                bg = 'rgba(41,121,255,0.05)'; borderColor = 'rgba(41,121,255,0.12)'
                pts = '0'; ptsColor = 'var(--text-secondary)'
              } else if (isHate) {
                const htWon = match.winner === hateTeam
                chip = <StatusChip label={`💀 ${hateTeam}`} chipBg="rgba(233,30,99,0.18)" chipColor="#FF4081" chipBorder="rgba(233,30,99,0.35)" />
                bg = htWon ? 'rgba(255,23,68,0.04)' : 'rgba(0,200,83,0.05)'
                borderColor = htWon ? 'rgba(255,23,68,0.12)' : 'rgba(0,200,83,0.15)'
                pts = htWon ? '-5' : '+15'; ptsColor = htWon ? 'var(--red)' : 'var(--green)'
              } else if (isDD) {
                const ddCorrect = pick === match.winner
                chip = <StatusChip label="🎯 DD" chipBg="rgba(255,152,0,0.18)" chipColor="#FF9800" chipBorder="rgba(255,152,0,0.35)" />
                bg = ddCorrect ? 'rgba(255,152,0,0.07)' : 'rgba(255,23,68,0.04)'
                borderColor = ddCorrect ? 'rgba(255,152,0,0.25)' : 'rgba(255,23,68,0.12)'
                pts = ddCorrect ? '+20' : (pick ? '-10' : null)
                ptsColor = ddCorrect ? '#FF9800' : 'var(--red)'
              } else if (pick) {
                const correct = pick === match.winner
                chip = correct
                  ? <StatusChip label="✓" chipBg="rgba(0,200,83,0.18)" chipColor="var(--green)" chipBorder="rgba(0,200,83,0.3)" />
                  : <StatusChip label="✗" chipBg="rgba(255,23,68,0.15)" chipColor="var(--red)" chipBorder="rgba(255,23,68,0.28)" />
                bg = correct ? 'rgba(0,200,83,0.05)' : 'rgba(255,23,68,0.03)'
                borderColor = correct ? 'rgba(0,200,83,0.15)' : 'rgba(255,23,68,0.1)'
                pts = correct ? '+10' : '0'; ptsColor = correct ? 'var(--green)' : 'rgba(255,255,255,0.3)'
              }
            }

            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 10,
                background: bg, border: `1px solid ${borderColor}`,
              }}>
                {/* Status chip — leftmost */}
                <div style={{ width: 52, flexShrink: 0 }}>
                  {chip}
                </div>
                {/* Avatar + name */}
                <Avatar player={p} size={26} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                {/* Separator */}
                <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                {/* Pick */}
                <div style={{ fontSize: 12, fontWeight: 900, color: pickedTeam?.color || 'var(--text-secondary)', flexShrink: 0, minWidth: 28, textAlign: 'center' }}>
                  {pick || (isHate ? '—' : '—')}
                </div>
                {/* Points */}
                {pts !== null && (
                  <div style={{ fontSize: 13, fontWeight: 900, color: ptsColor, flexShrink: 0, minWidth: 30, textAlign: 'right' }}>
                    {pts}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TeamBadge({ team, abbr }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 900, color: team?.color || '#fff', letterSpacing: 0.3 }}>
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

function StatusChip({ label, chipBg, chipColor, chipBorder }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      height: 22, padding: '0 7px', borderRadius: 6,
      background: chipBg, color: chipColor,
      border: `1px solid ${chipBorder}`,
      fontSize: 10, fontWeight: 800, letterSpacing: 0.2,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </div>
  )
}

function RuleChip({ label, color }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6, padding: '3px 8px',
      letterSpacing: 0.2,
    }}>
      {label}
    </div>
  )
}
