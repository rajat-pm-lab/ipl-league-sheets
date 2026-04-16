import { useParams, useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'
import { useLeagueData } from '../data/DataContext'
import Avatar from '../components/Avatar'

const AVATAR_COLORS = [
  '#FFD700', '#2979FF', '#00C853', '#FF6D00', '#AA00FF',
  '#00BCD4', '#FF1744', '#76FF03', '#FF9100', '#448AFF',
  '#E040FB', '#FFAB40', '#69F0AE',
]

const WEEKLY_PRIZE = { 1: 700, 2: 300 }

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useLeagueData()
  const playerId = Number(id)

  if (loading || !data) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  const { players, weeklyData, allPredictions, cumulativePoints, currentWeek, weekComplete, stages, iplTeams } = data
  const player = players.find((p) => p.id === playerId)
  if (!player) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Player not found</div>
  }

  const playerColor = AVATAR_COLORS[(player.id - 1) % AVATAR_COLORS.length]
  const weeksWithData = Object.keys(weeklyData).map(Number).sort((a, b) => a - b)

  // ── Overall stats (sum across all weeks) ──
  const overall = weeksWithData.reduce(
    (acc, w) => {
      const row = (weeklyData[w] || []).find((r) => r.playerId === playerId)
      if (!row) return acc
      return {
        points: acc.points + row.points,
        wins: acc.wins + row.wins,
        losses: acc.losses + row.losses,
        draws: acc.draws + row.draws,
      }
    },
    { points: 0, wins: 0, losses: 0, draws: 0 }
  )

  // ── Current week stats ──
  const currentWeekRow = (weeklyData[currentWeek] || []).find((r) => r.playerId === playerId) ||
    { points: 0, wins: 0, losses: 0, draws: 0 }

  // ── Overall rank ──
  const overallTotals = {}
  players.forEach((p) => { overallTotals[p.id] = 0 })
  for (const w of weeksWithData) {
    ;(weeklyData[w] || []).forEach((r) => {
      overallTotals[r.playerId] = (overallTotals[r.playerId] || 0) + r.points
    })
  }
  const sortedIds = Object.entries(overallTotals).sort(([, a], [, b]) => b - a)
  const overallRank = sortedIds.findIndex(([pid]) => Number(pid) === playerId) + 1

  const accuracy =
    overall.wins + overall.losses > 0
      ? ((overall.wins / (overall.wins + overall.losses)) * 100).toFixed(1)
      : '—'

  // ── Points Over Time chart ──
  const playerCumData = (cumulativePoints || []).find((p) => p.playerId === playerId)
  const chartData = weeksWithData.map((w) => {
    const total = (cumulativePoints || []).reduce((s, p) => s + (p.weeks[w] || 0), 0)
    const avg = Math.round(total / Math.max((cumulativePoints || []).length, 1))
    return { week: `W${w}`, player: playerCumData?.weeks[w] || 0, avg }
  })

  // ── Prediction Breakdown ──
  const donutData = [
    { name: 'Correct', value: overall.wins, color: 'var(--green)' },
    { name: 'Incorrect', value: overall.losses, color: 'var(--red)' },
    { name: 'No Result', value: overall.draws, color: '#607D8B' },
  ]
  const totalPredicted = overall.wins + overall.losses + overall.draws

  // ── Team Loyalty Map ──
  const teamCounts = {}
  for (const weekPreds of Object.values(allPredictions || {})) {
    const picks = weekPreds[playerId] || {}
    for (const [key, team] of Object.entries(picks)) {
      if (key.startsWith('_') || !team) continue
      teamCounts[team] = (teamCounts[team] || 0) + 1
    }
  }
  const totalPicks = Object.values(teamCounts).reduce((s, v) => s + v, 0)
  const teamLoyalty = (iplTeams || []).map((t) => ({ ...t, count: teamCounts[t.abbr] || 0 }))

  // ── Prize Earnings ──
  const prizeList = []
  for (const w of weeksWithData) {
    if (!weekComplete[w]) continue
    const wd = weeklyData[w]
    if (!wd) continue
    const sorted = [...wd].sort((a, b) => b.points - a.points || b.wins - a.wins)
    const idx = sorted.findIndex((r) => r.playerId === playerId)
    const prize = WEEKLY_PRIZE[idx + 1]
    if (prize && sorted[0].points > 0) {
      prizeList.push({ week: w, prize, label: idx === 0 ? 'Winner' : 'Runner-up' })
    }
  }
  const totalPrize = prizeList.reduce((s, p) => s + p.prize, 0)

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Nav */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 12px',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 12,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--surface)',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Player Profile
        </span>
      </div>

      {/* Hero Card */}
      <div style={{
        margin: '12px 12px 0', padding: '20px 16px 20px',
        background: 'linear-gradient(135deg, var(--surface), var(--surface-alt))',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          background: `radial-gradient(circle, ${playerColor}22, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ border: `3px solid ${playerColor}66`, borderRadius: '50%', boxShadow: `0 4px 20px ${playerColor}4D` }}>
            <Avatar player={player} size={72} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>{player.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', background: 'rgba(255,215,0,0.15)', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.2)' }}>
                #{overallRank} Overall
              </span>
              {accuracy !== '—' && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'rgba(0,200,83,0.12)', padding: '3px 10px', borderRadius: 6 }}>
                  {accuracy}% Acc
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current week row */}
        <div style={{ marginTop: 18, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>
            Week {currentWeek} — Current
          </div>
          <StatRow stats={currentWeekRow} playerColor={playerColor} />
        </div>

        {/* Overall row */}
        <div style={{ marginTop: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>
            Overall — All Weeks
          </div>
          <StatRow stats={overall} playerColor={playerColor} />
        </div>
      </div>

      {/* Points Over Time */}
      {chartData.length > 0 && (
        <Section title="Points Over Time" accentColor={playerColor}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`grad-${playerId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={playerColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={playerColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: '#8899AA', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1A2D47', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
              <Area type="monotone" dataKey="avg" stroke="#8899AA" strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.5} fill="none" name="Group Avg" />
              <Area type="monotone" dataKey="player" stroke={playerColor} strokeWidth={2.5} fill={`url(#grad-${playerId})`} name={player.name} dot={{ r: 4, fill: playerColor }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            <LegendDot color={playerColor} label={player.name} />
            <LegendDot color="#8899AA" label="Group Avg" />
          </div>
        </Section>
      )}

      {/* Prediction Breakdown */}
      <Section title="Prediction Breakdown" accentColor="var(--green)">
        {totalPredicted === 0 ? (
          <EmptyState label="No predictions yet" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 110, height: 110, flexShrink: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" stroke="none">
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{totalPredicted}</div>
                <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>MATCHES</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {donutData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: d.color, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Team Loyalty Map */}
      <Section title="Team Loyalty Map" accentColor="var(--gold)">
        {totalPicks === 0 ? (
          <EmptyState label="No picks data yet" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {teamLoyalty.map((t) => {
                const pct = totalPicks > 0 ? t.count / totalPicks : 0
                const heat = pct >= 0.15 ? 'high' : pct >= 0.07 ? 'med' : t.count > 0 ? 'low' : 'none'
                const heatStyles = {
                  high: { background: `${t.color}30`, border: `1px solid ${t.color}50`, color: t.color },
                  med: { background: `${t.color}18`, border: `1px solid ${t.color}30`, color: t.color },
                  low: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' },
                  none: { background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)' },
                }
                return (
                  <div key={t.abbr} style={{ borderRadius: 8, padding: '10px 4px', textAlign: 'center', ...heatStyles[heat] }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{t.abbr}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{t.count}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
              {totalPicks} total picks across all weeks
            </div>
          </>
        )}
      </Section>

      {/* Prize Earnings */}
      <Section title="Prize Earnings" accentColor="var(--gold)">
        {prizeList.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', padding: '8px 0' }}>
            No prizes yet — keep playing!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prizeList.map((p) => (
              <div key={p.week} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Week {p.week} — {p.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Weekly prize</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>₹{p.prize}</div>
              </div>
            ))}
            <div style={{ marginTop: 4, padding: '12px 12px', background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.03))', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Earnings</div>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>Out of ₹45,500 pool</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>₹{totalPrize}</div>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

function StatRow({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
      {[
        { value: stats.points, label: 'Pts', color: 'var(--gold)' },
        { value: stats.wins, label: 'W', color: 'var(--green)' },
        { value: stats.losses, label: 'L', color: 'var(--red)' },
        { value: stats.draws, label: 'D', color: 'var(--blue)' },
      ].map((s) => (
        <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function Section({ title, accentColor, children }) {
  return (
    <div style={{ margin: '12px 12px 0', padding: 16, background: 'var(--surface)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 14, borderRadius: 2, background: accentColor }} />
        {title}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
      {label}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </div>
  )
}
