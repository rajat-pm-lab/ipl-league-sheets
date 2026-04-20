import Avatar from './Avatar'

// ── Paul's algorithm ──────────────────────────────────────────
// Weighted score: 40% current week + 35% avg last 3 weeks + 25% overall avg/week + trend bonus
function computePaulPrediction(weeklyData, players, currentWeek) {
  const prevWeeks = [currentWeek - 1, currentWeek - 2, currentWeek - 3].filter((w) => w >= 1)
  const totalWeeks = Math.max(currentWeek, 1)

  const scored = players.map((p) => {
    const getpts = (w) => (weeklyData[w] || []).find((r) => r.playerId === p.id)?.points ?? 0

    const curPts = getpts(currentWeek)
    const recentPts = prevWeeks.map(getpts)
    const avgRecent = recentPts.length ? recentPts.reduce((a, b) => a + b, 0) / recentPts.length : 0
    const overallAvg =
      Object.keys(weeklyData).reduce((sum, w) => sum + getpts(Number(w)), 0) / totalWeeks
    const trend = recentPts[0] !== undefined ? getpts(currentWeek) - recentPts[0] : 0

    const score = curPts * 0.4 + avgRecent * 0.35 + overallAvg * 0.25 + trend * 0.05
    return { player: p, score }
  })

  function getpts(w) {
    return (weeklyData[w] || []).find((r) => r.playerId === this.id)?.points ?? 0
  }

  scored.sort((a, b) => b.score - a.score)
  return {
    first: scored[0],
    second: scored[1],
    lappa: scored[scored.length - 1],
  }
}

// ── Paul SVG avatar ──────────────────────────────────────────
function PaulSVG({ size = 64 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 80 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tentacles — 4 wavy legs */}
      <path d="M22 62 Q16 70 20 80 Q24 70 28 80 Q32 70 28 62" fill="#2979CC" />
      <path d="M32 65 Q28 74 32 83 Q36 74 40 83 Q44 74 40 65" fill="#2979CC" />
      <path d="M44 65 Q40 74 44 83 Q48 74 52 83 Q56 74 52 65" fill="#2979CC" />
      <path d="M54 62 Q50 70 54 80 Q58 70 62 80 Q64 70 58 62" fill="#2979CC" />

      {/* Body shadow */}
      <ellipse cx="40" cy="50" rx="27" ry="22" fill="#2060B0" opacity="0.3" />

      {/* Main body / head */}
      <ellipse cx="40" cy="38" rx="28" ry="30" fill="#3D8EE0" />

      {/* Highlight on top */}
      <ellipse cx="32" cy="20" rx="10" ry="7" fill="#6FB8FF" opacity="0.45" />

      {/* Eyes — white sclera */}
      <ellipse cx="29" cy="36" rx="9" ry="10" fill="white" />
      <ellipse cx="51" cy="36" rx="9" ry="10" fill="white" />

      {/* Pupils */}
      <circle cx="31" cy="37" r="5.5" fill="#1A2A4A" />
      <circle cx="53" cy="37" r="5.5" fill="#1A2A4A" />

      {/* Eye shine */}
      <circle cx="33" cy="34" r="2" fill="white" />
      <circle cx="55" cy="34" r="2" fill="white" />

      {/* Smile */}
      <path d="M31 50 Q40 57 49 50" stroke="#2060B0" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Rosy cheeks */}
      <ellipse cx="20" cy="44" rx="5" ry="3" fill="#FF8FAB" opacity="0.35" />
      <ellipse cx="60" cy="44" rx="5" ry="3" fill="#FF8FAB" opacity="0.35" />
    </svg>
  )
}

// ── Prediction card for one player ──────────────────────────
function PredCard({ label, emoji, player, accentColor }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '10px 6px 12px',
      background: `${accentColor}12`,
      border: `1px solid ${accentColor}40`,
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <Avatar player={player} size={36} />
      <div style={{
        fontSize: 10, fontWeight: 800, color: accentColor,
        textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text)',
        textAlign: 'center', lineHeight: 1.2,
        maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {player?.name ?? '?'}
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────
export default function OctopusPaul({ weeklyData, players, currentWeek }) {
  if (!weeklyData || !players?.length) return null

  // Need at least 1 completed week to make a call
  const hasData = Object.values(weeklyData).some((w) => w?.length > 0)
  if (!hasData) return null

  // Clone players and safely compute
  let prediction
  try {
    // Inline helper so closure works
    const getpts = (p, w) => (weeklyData[w] || []).find((r) => r.playerId === p.id)?.points ?? 0
    const prevWeeks = [currentWeek - 1, currentWeek - 2, currentWeek - 3].filter((w) => w >= 1)
    const totalWeeks = Math.max(currentWeek, 1)

    const scored = players.map((p) => {
      const curPts = getpts(p, currentWeek)
      const recentPts = prevWeeks.map((w) => getpts(p, w))
      const avgRecent = recentPts.length ? recentPts.reduce((a, b) => a + b, 0) / recentPts.length : 0
      const overallAvg =
        Object.keys(weeklyData).reduce((sum, w) => sum + getpts(p, Number(w)), 0) / totalWeeks
      const trend = recentPts[0] !== undefined ? curPts - recentPts[0] : 0
      const score = curPts * 0.4 + avgRecent * 0.35 + overallAvg * 0.25 + trend * 0.05
      return { player: p, score }
    })
    scored.sort((a, b) => b.score - a.score)
    prediction = {
      first: scored[0],
      second: scored[1],
      lappa: scored[scored.length - 1],
    }
  } catch {
    return null
  }

  return (
    <div style={{
      margin: '14px 12px 4px',
      padding: '14px 14px 16px',
      background: 'linear-gradient(135deg, rgba(61,142,224,0.08), rgba(30,60,120,0.12))',
      border: '1px solid rgba(61,142,224,0.2)',
      borderRadius: 16,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <PaulSVG size={56} />
        <div>
          <div style={{
            fontSize: 13, fontWeight: 900, letterSpacing: 0.5,
            color: '#6FB8FF',
          }}>
            🔮 Paul's Prediction
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)',
            marginTop: 2, lineHeight: 1.5,
          }}>
            Based on current form, 3-week trend<br />& season performance
          </div>
        </div>
      </div>

      {/* Three cards */}
      <div style={{ display: 'flex', gap: 8 }}>
        <PredCard label="1st Today" emoji="👑" player={prediction.first?.player} accentColor="var(--gold)" />
        <PredCard label="2nd Today" emoji="🥈" player={prediction.second?.player} accentColor="#A0AEC0" />
        <PredCard label="Lappa" emoji="🫣" player={prediction.lappa?.player} accentColor="var(--red)" />
      </div>

      <div style={{
        marginTop: 10, fontSize: 8, fontWeight: 600,
        color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: 0.3,
      }}>
        Paul is an octopus. He could be wrong. Blame him, not us.
      </div>
    </div>
  )
}
