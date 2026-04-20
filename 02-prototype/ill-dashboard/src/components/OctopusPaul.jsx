import Avatar from './Avatar'

// ── Paul's projection algorithm ───────────────────────────────
// Projected final week score = current week pts already earned
//   + (remaining matches × player's historical win rate × 10pts per win)
// Historical win rate = career wins / career played (across all past weeks)
function projectWeekFinal(weeklyData, players, selectedWeek, weekMatches) {
  const completedMatches = weekMatches.filter((m) => m.winner !== undefined).length
  const remainingMatches = weekMatches.length - completedMatches

  const scored = players.map((p) => {
    // Points already locked in this week
    const thisWeekRow = (weeklyData[selectedWeek] || []).find((r) => r.playerId === p.id)
    const currentPts = thisWeekRow?.points ?? 0

    // Historical accuracy across all weeks (excluding current — still in progress)
    let totalWins = 0
    let totalPlayed = 0
    Object.entries(weeklyData).forEach(([w, rows]) => {
      if (Number(w) === selectedWeek) return // exclude current week
      const row = (rows || []).find((r) => r.playerId === p.id)
      if (row) {
        totalWins += row.wins ?? 0
        totalPlayed += row.played ?? 0
      }
    })
    const winRate = totalPlayed > 0 ? totalWins / totalPlayed : 0.45 // fallback: 45% if no history

    // Project: remaining matches × win rate × 10pts per correct pick
    const expectedAdditional = remainingMatches * winRate * 10
    const projectedPts = currentPts + expectedAdditional

    return { player: p, projectedPts, currentPts, winRate, remainingMatches }
  })

  scored.sort((a, b) => b.projectedPts - a.projectedPts)
  return {
    first: scored[0],
    second: scored[1],
    lappa: scored[scored.length - 1],
    completedMatches,
    remainingMatches,
    totalMatches: weekMatches.length,
  }
}

// ── Paul SVG avatar ──────────────────────────────────────────
function PaulSVG({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 62 Q16 70 20 80 Q24 70 28 80 Q32 70 28 62" fill="#2979CC" />
      <path d="M32 65 Q28 74 32 83 Q36 74 40 83 Q44 74 40 65" fill="#2979CC" />
      <path d="M44 65 Q40 74 44 83 Q48 74 52 83 Q56 74 52 65" fill="#2979CC" />
      <path d="M54 62 Q50 70 54 80 Q58 70 62 80 Q64 70 58 62" fill="#2979CC" />
      <ellipse cx="40" cy="50" rx="27" ry="22" fill="#2060B0" opacity="0.3" />
      <ellipse cx="40" cy="38" rx="28" ry="30" fill="#3D8EE0" />
      <ellipse cx="32" cy="20" rx="10" ry="7" fill="#6FB8FF" opacity="0.45" />
      <ellipse cx="29" cy="36" rx="9" ry="10" fill="white" />
      <ellipse cx="51" cy="36" rx="9" ry="10" fill="white" />
      <circle cx="31" cy="37" r="5.5" fill="#1A2A4A" />
      <circle cx="53" cy="37" r="5.5" fill="#1A2A4A" />
      <circle cx="33" cy="34" r="2" fill="white" />
      <circle cx="55" cy="34" r="2" fill="white" />
      <path d="M31 50 Q40 57 49 50" stroke="#2060B0" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="44" rx="5" ry="3" fill="#FF8FAB" opacity="0.35" />
      <ellipse cx="60" cy="44" rx="5" ry="3" fill="#FF8FAB" opacity="0.35" />
    </svg>
  )
}

// ── Prediction card ──────────────────────────────────────────
function PredCard({ label, emoji, player, projectedPts, accentColor }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 5, padding: '10px 4px 12px',
      background: `${accentColor}12`,
      border: `1px solid ${accentColor}40`,
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <Avatar player={player} size={34} />
      <div style={{
        fontSize: 10, fontWeight: 800, color: accentColor,
        textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text)',
        textAlign: 'center', maxWidth: 60,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {player?.name ?? '?'}
      </div>
      {projectedPts !== undefined && (
        <div style={{
          fontSize: 9, fontWeight: 700,
          color: accentColor, opacity: 0.7,
        }}>
          ~{Math.round(projectedPts)} pts
        </div>
      )}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────
export default function OctopusPaul({ weeklyData, players, selectedWeek, weekMatches }) {
  if (!weeklyData || !players?.length || !weekMatches?.length) return null

  // Don't show if week hasn't started yet (no results at all)
  const weekStarted = weekMatches.some((m) => m.winner !== undefined)
  if (!weekStarted) return null

  let prediction
  try {
    prediction = projectWeekFinal(weeklyData, players, selectedWeek, weekMatches)
  } catch {
    return null
  }

  const { completedMatches, remainingMatches, totalMatches } = prediction
  const progressPct = Math.round((completedMatches / totalMatches) * 100)
  const weekDone = remainingMatches === 0

  return (
    <div style={{
      margin: '14px 12px 4px',
      padding: '14px 14px 16px',
      background: 'linear-gradient(135deg, rgba(61,142,224,0.08), rgba(30,60,120,0.12))',
      border: '1px solid rgba(61,142,224,0.2)',
      borderRadius: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <PaulSVG size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5, color: '#6FB8FF' }}>
            🔮 Paul's Week {selectedWeek} Prediction
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
            {weekDone
              ? 'Final standings — week complete'
              : `${completedMatches}/${totalMatches} matches done · ${remainingMatches} remaining`}
          </div>
          {/* Progress bar */}
          <div style={{
            marginTop: 6, height: 3,
            background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #3D8EE0, #6FB8FF)',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>

      {/* Three prediction cards */}
      <div style={{ display: 'flex', gap: 8 }}>
        <PredCard
          label={weekDone ? 'Winner 🏆' : 'Week Winner'}
          emoji="👑"
          player={prediction.first?.player}
          projectedPts={prediction.first?.projectedPts}
          accentColor="var(--gold)"
        />
        <PredCard
          label="Runner-up"
          emoji="🥈"
          player={prediction.second?.player}
          projectedPts={prediction.second?.projectedPts}
          accentColor="#A0AEC0"
        />
        <PredCard
          label="Lappa 🫣"
          emoji="💩"
          player={prediction.lappa?.player}
          projectedPts={prediction.lappa?.projectedPts}
          accentColor="var(--red)"
        />
      </div>

      <div style={{
        marginTop: 10, fontSize: 8, fontWeight: 600,
        color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: 0.3,
      }}>
        {weekDone
          ? 'Paul called it. Or didn\'t. Either way, blame the octopus.'
          : 'Projection updates after every match. Paul is an octopus. Blame him, not us.'}
      </div>
    </div>
  )
}
