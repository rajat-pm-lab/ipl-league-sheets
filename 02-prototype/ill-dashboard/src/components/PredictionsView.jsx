import { useState } from 'react'
import { IPL_TEAMS } from '../data/sampleData'
import Avatar from './Avatar'

export default function PredictionsView({ selectedWeek, data }) {
  const players = data?.players || []
  const matches = (data?.matchSchedule || {})[selectedWeek] || []
  const weekPredictions = (data?.allPredictions || {})[selectedWeek] || {}
  const weekRules = (data?.weeklyRules || {})[selectedWeek] || {}
  const weekCannibResolution = (data?.cannibResolution || {})[selectedWeek] || {}

  // Detect which mechanics this week has
  const allPicks = Object.values(weekPredictions)
  const hasDD = allPicks.some((p) => p._doubleDip)
  const hasHT = allPicks.some((p) => p._hateTeam)
  const hasConfidence = allPicks.some((p) => p._confidence)
  const hasTD = allPicks.some((p) => p._tripleDips?.length > 0)
  const hasCannibalise = allPicks.some((p) => p._cannibalise)

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
        {hasTD ? (
          // Week 4: Triple Dip + Cannibalisation
          <>
            <RuleChip label="✓ Correct +10" color="var(--green)" />
            <RuleChip label="✗ Wrong 0" color="var(--text-secondary)" />
            <RuleChip label="🚀 TD Correct +30" color="#E040FB" />
            <RuleChip label="🚀 TD Wrong -20" color="var(--red)" />
            {hasCannibalise && <RuleChip label="💀 Cannibalised 0" color="#FF4081" />}
          </>
        ) : hasConfidence ? (
          <>
            <RuleChip label="🎯 Confidence week" color="#FFD700" />
            <RuleChip label="✓ Correct: +10+Conf" color="var(--green)" />
            <RuleChip label="✗ Wrong: -Conf" color="var(--red)" />
          </>
        ) : (
          <>
            <RuleChip label={`✓ Correct +${weekRules.correct ?? 10}`} color="var(--green)" />
            {(hasDD || hasHT) && (
              <RuleChip label="✗ Wrong 0" color="var(--text-secondary)" />
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
            cannibResolution={weekCannibResolution}
            hasTD={hasTD}
          />
        ))}
      </div>

      {/* Strategy declarations table — shown when week has special mechanics */}
      {(hasTD || hasCannibalise || hasDD || hasHT) && (
        <StrategyTable
          weekPredictions={weekPredictions}
          players={players}
          matches={matches}
          cannibResolution={weekCannibResolution}
          hasTD={hasTD}
          hasCannibalise={hasCannibalise}
        />
      )}

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

function StrategyTable({ weekPredictions, players, matches, cannibResolution, hasTD, hasCannibalise }) {
  const matchMap = {}
  matches.forEach((m) => { matchMap[m.matchNum] = m })

  const matchLabel = (num) => {
    const m = matchMap[num]
    return m ? `${m.home}·${m.away}` : `M${num}`
  }

  const rows = players.map((p) => {
    const picks = weekPredictions[p.id] || {}
    const td1 = picks._tripleDips?.[0]
    const td2 = picks._tripleDips?.[1]
    const cannib = picks._cannibalise
    const cannibTarget = cannib ? players.find((pl) => pl.id === cannib.targetPlayerId)?.name : null
    const dd = picks._doubleDip
    const ht = picks._hateTeam

    // cannibalisation received (resolved)
    const receivedCannib = cannibResolution[p.id]
    const cannibByNames = receivedCannib
      ? (receivedCannib.by || []).map((bid) => players.find((pl) => pl.id === bid)?.name).filter(Boolean)
      : []

    return { p, td1, td2, cannibTarget, cannibMatch: cannib?.matchNum, dd, ht, cannibByNames, receivedMatch: receivedCannib?.matchNum }
  }).filter((r) => r.td1 || r.td2 || r.cannibTarget || r.dd || r.ht)

  if (rows.length === 0) return null

  return (
    <div style={{
      marginBottom: 16, padding: '12px 14px',
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
        color: 'var(--text-secondary)', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--gold)' }} />
        Week Strategies
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map(({ p, td1, td2, cannibTarget, cannibMatch, dd, ht, cannibByNames, receivedMatch }) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <Avatar player={p} size={22} />
            <span style={{ fontSize: 11, fontWeight: 700, minWidth: 64, color: 'var(--text)' }}>
              {p.name}
            </span>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
              {td1 && (
                <StratTag label={`TD1 ${matchLabel(td1)}`} color="#A78BFA" bg="rgba(124,58,237,0.12)" />
              )}
              {td2 && (
                <StratTag label={`TD2 ${matchLabel(td2)}`} color="#818CF8" bg="rgba(99,102,241,0.12)" />
              )}
              {cannibTarget && (
                <StratTag label={`💀 ${cannibTarget} · ${matchLabel(cannibMatch)}`} color="#FCA5A5" bg="rgba(239,68,68,0.1)" />
              )}
              {dd && (
                <StratTag label={`DD ${matchLabel(dd)}`} color="#FCD34D" bg="rgba(180,83,9,0.12)" />
              )}
              {ht && (
                <StratTag label={`HT ${ht}`} color="#94A3B8" bg="rgba(148,163,184,0.08)" />
              )}
            </div>

            {/* If this player got cannibalised, show who by */}
            {cannibByNames.length > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#FCA5A5',
                background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                💀 by {cannibByNames.join(', ')} · {matchLabel(receivedMatch)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StratTag({ label, color, bg }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
      padding: '2px 6px', borderRadius: 4,
      color, background: bg, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function MatchCard({ match, weekPredictions, players, cannibResolution = {}, hasTD = false }) {
  const [expanded, setExpanded] = useState(false)
  const isNoResult = match.winner === null
  const isPending = match.winner === undefined
  const homeTeam = IPL_TEAMS.find((t) => t.abbr === match.home)
  const awayTeam = IPL_TEAMS.find((t) => t.abbr === match.away)

  // Count how many players have this as their Double Dip match
  const doubleDipCount = players.filter((p) => (weekPredictions[p.id] || {})._doubleDip === match.matchNum).length
  // Count triple dippers on this match (TD1 vs TD2)
  const td1Count = players.filter((p) => (weekPredictions[p.id] || {})._tripleDips?.[0] === match.matchNum).length
  const td2Count = players.filter((p) => (weekPredictions[p.id] || {})._tripleDips?.[1] === match.matchNum).length
  const tripleDipCount = td1Count + td2Count
  // Players cannibalised on this match + their names
  const cannibalisedEntries = Object.entries(cannibResolution)
    .filter(([, v]) => v.matchNum === match.matchNum)
  const cannibalisedPlayerIds = cannibalisedEntries.map(([pid]) => Number(pid))
  const cannibalisedNames = cannibalisedEntries
    .map(([pid]) => players.find((pl) => pl.id === Number(pid))?.name)
    .filter(Boolean)

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
          {td1Count > 0 && (
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#E040FB',
              background: 'rgba(224,64,251,0.15)', padding: '2px 6px', borderRadius: 5,
              letterSpacing: 0.3,
            }}>
              🚀TD1×{td1Count}
            </div>
          )}
          {td2Count > 0 && (
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#CE93D8',
              background: 'rgba(206,147,216,0.15)', padding: '2px 6px', borderRadius: 5,
              letterSpacing: 0.3,
            }}>
              🚀TD2×{td2Count}
            </div>
          )}
          {cannibalisedNames.length > 0 && (
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#FF4081',
              background: 'rgba(255,64,129,0.15)', padding: '2px 6px', borderRadius: 5,
              letterSpacing: 0.3,
            }}>
              💀 {cannibalisedNames.join(', ')}
            </div>
          )}
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
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {players.map((p) => {
            const playerPicks = weekPredictions[p.id] || {}
            const isLate = (playerPicks._lateMatches || []).includes(match.matchNum)
            const effectivePick = isLate ? null : playerPicks[match.matchNum]
            const pick = playerPicks[match.matchNum]  // always show what they picked (even if late)
            const pickedTeam = IPL_TEAMS.find((t) => t.abbr === pick)
            const isDD = playerPicks._doubleDip === match.matchNum
            const hateTeam = playerPicks._hateTeam
            const hateTeamPlaying = hateTeam && (match.home === hateTeam || match.away === hateTeam)
            const isHate = hateTeamPlaying && !isDD
            const tripleDipSlot = !isLate && playerPicks._tripleDips
              ? playerPicks._tripleDips.indexOf(match.matchNum)
              : -1
            const isTD = tripleDipSlot >= 0
            const isCannibalisedForMe = !isLate && cannibResolution[p.id]?.matchNum === match.matchNum
            const cannibalisedBy = isCannibalisedForMe
              ? (cannibResolution[p.id].by || []).map((bid) => players.find((pl) => pl.id === bid)?.name).filter(Boolean).join(', ')
              : null
            const confidence = playerPicks._confidence?.[match.matchNum]

            // ── Determine accent, mechanic tag, points ──
            let accentColor = 'rgba(255,255,255,0.06)'
            let rowBg = 'transparent'
            let tag = null        // { label, color, bg }
            let pts = null
            let ptsColor = 'rgba(255,255,255,0.3)'
            let pickMuted = false

            if (isLate) {
              accentColor = '#D97706'
              rowBg = 'rgba(217,119,6,0.04)'
              tag = { label: '⏰ Late', color: '#FCD34D', bg: 'rgba(217,119,6,0.14)' }
              pts = '0'; pickMuted = true

            } else if (isCannibalisedForMe) {
              accentColor = '#EF4444'
              rowBg = 'rgba(239,68,68,0.04)'
              tag = { label: `💀 ${cannibalisedBy}`, color: '#FCA5A5', bg: 'rgba(239,68,68,0.12)' }
              pts = '0'; pickMuted = true

            } else if (isPending) {
              if (isTD) {
                accentColor = '#7C3AED'
                tag = { label: tripleDipSlot === 0 ? 'TD1' : 'TD2', color: '#A78BFA', bg: 'rgba(124,58,237,0.14)' }
              } else if (confidence !== undefined) {
                accentColor = '#D97706'
                tag = { label: `×${confidence}`, color: '#FCD34D', bg: 'rgba(217,119,6,0.12)' }
              } else if (isDD) {
                accentColor = '#B45309'
                tag = { label: 'DD', color: '#FCD34D', bg: 'rgba(180,83,9,0.14)' }
              } else if (isHate) {
                accentColor = 'rgba(255,255,255,0.15)'
                tag = { label: `HT ${hateTeam}`, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' }
              }

            } else if (isNoResult) {
              accentColor = '#3B82F6'
              rowBg = 'rgba(59,130,246,0.04)'
              tag = { label: 'NR', color: '#93C5FD', bg: 'rgba(59,130,246,0.12)' }
              pts = '0'

            } else if (isTD) {
              const tdCorrect = effectivePick === match.winner
              accentColor = tdCorrect ? '#7C3AED' : '#DC2626'
              rowBg = tdCorrect ? 'rgba(124,58,237,0.05)' : 'rgba(220,38,38,0.04)'
              const slot = tripleDipSlot === 0 ? 'TD1' : 'TD2'
              tag = tdCorrect
                ? { label: `${slot} +30`, color: '#A78BFA', bg: 'rgba(124,58,237,0.14)' }
                : { label: `${slot} −20`, color: '#FCA5A5', bg: 'rgba(220,38,38,0.12)' }
              pts = tdCorrect ? '+30' : (effectivePick ? '−20' : null)
              ptsColor = tdCorrect ? '#A78BFA' : '#F87171'

            } else if (confidence !== undefined) {
              const confCorrect = effectivePick === match.winner
              accentColor = confCorrect ? '#059669' : '#DC2626'
              rowBg = confCorrect ? 'rgba(5,150,105,0.05)' : 'rgba(220,38,38,0.04)'
              tag = confCorrect
                ? { label: `×${confidence}`, color: '#34D399', bg: 'rgba(52,211,153,0.1)' }
                : { label: `×${confidence}`, color: '#FCA5A5', bg: 'rgba(220,38,38,0.1)' }
              pts = confCorrect ? `+${10 + confidence}` : `−${confidence}`
              ptsColor = confCorrect ? '#34D399' : '#F87171'

            } else if (isHate) {
              const htWon = match.winner === hateTeam
              accentColor = htWon ? '#DC2626' : '#059669'
              rowBg = htWon ? 'rgba(220,38,38,0.04)' : 'rgba(5,150,105,0.04)'
              tag = { label: `HT ${hateTeam}`, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' }
              pts = htWon ? '−5' : '+15'
              ptsColor = htWon ? '#F87171' : '#34D399'

            } else if (isDD) {
              const ddCorrect = effectivePick === match.winner
              accentColor = ddCorrect ? '#B45309' : '#DC2626'
              rowBg = ddCorrect ? 'rgba(180,83,9,0.06)' : 'rgba(220,38,38,0.04)'
              tag = { label: 'DD', color: '#FCD34D', bg: 'rgba(180,83,9,0.14)' }
              pts = ddCorrect ? '+20' : (effectivePick ? '−10' : null)
              ptsColor = ddCorrect ? '#FCD34D' : '#F87171'

            } else if (effectivePick) {
              const correct = effectivePick === match.winner
              accentColor = correct ? '#059669' : 'rgba(255,255,255,0.08)'
              rowBg = correct ? 'rgba(5,150,105,0.04)' : 'transparent'
              pts = correct ? '+10' : '0'
              ptsColor = correct ? '#34D399' : 'rgba(255,255,255,0.25)'
            }

            const pickColor = pickMuted
              ? 'rgba(255,255,255,0.2)'
              : (pickedTeam?.color || 'rgba(255,255,255,0.35)')

            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px 7px 12px', borderRadius: 8,
                background: rowBg,
                borderLeft: `2px solid ${accentColor}`,
              }}>
                {/* Avatar + Name — left, flex */}
                <Avatar player={p} size={24} />
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: 'var(--text)',
                }}>
                  {p.name}
                </span>

                {/* Mechanic tag — right of name */}
                {tag && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                    padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                    color: tag.color, background: tag.bg, whiteSpace: 'nowrap',
                  }}>
                    {tag.label}
                  </span>
                )}

                {/* Pick */}
                <span style={{
                  fontSize: 12, fontWeight: 900, flexShrink: 0,
                  minWidth: 30, textAlign: 'right',
                  color: pickColor,
                  opacity: pickMuted ? 0.5 : 1,
                }}>
                  {pick || '—'}
                </span>

                {/* Points */}
                <span style={{
                  fontSize: 12, fontWeight: 900, flexShrink: 0,
                  minWidth: 30, textAlign: 'right',
                  color: pts !== null ? ptsColor : 'transparent',
                }}>
                  {pts ?? '—'}
                </span>
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
