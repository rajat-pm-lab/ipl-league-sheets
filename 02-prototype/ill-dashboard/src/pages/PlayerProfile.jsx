import { useParams, useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'
import { PLAYERS, AVATAR_COLORS, WEEKLY_DATA, MATCH_HISTORY_SAMPLE_W3, TEAM_PREDICTIONS_SAMPLE, IPL_TEAMS, getOverallLeaderboard } from '../data/sampleData'
import Avatar from '../components/Avatar'

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playerId = Number(id)
  const player = PLAYERS.find((p) => p.id === playerId)

  if (!player) return <div style={{ padding: 40, textAlign: 'center' }}>Player not found</div>

  const overall = getOverallLeaderboard()
  const playerStats = overall.find((r) => r.playerId === playerId) || {}
  const accuracy = playerStats.wins && (playerStats.wins + playerStats.losses) > 0
    ? ((playerStats.wins / (playerStats.wins + playerStats.losses)) * 100).toFixed(1)
    : '0'

  // Points over time
  const chartData = [{ week: 'Start', player: 0, avg: 0 }]
  for (let w = 1; w <= 3; w++) {
    const weekData = WEEKLY_DATA[w]
    if (!weekData) continue
    const prev = chartData[chartData.length - 1]
    const pw = weekData.find((d) => d.playerId === playerId)
    const avgPts = weekData.reduce((sum, d) => sum + d.points, 0) / weekData.length
    chartData.push({
      week: `W${w}`,
      player: prev.player + (pw ? pw.points : 0),
      avg: prev.avg + avgPts,
    })
  }

  // Donut data
  const donutData = [
    { name: 'Correct', value: playerStats.wins || 0, color: 'var(--green)' },
    { name: 'Incorrect', value: playerStats.losses || 0, color: 'var(--red)' },
    { name: 'No Result', value: playerStats.draws || 0, color: 'var(--grey)' },
  ]

  const colorIndex = (player.id - 1) % AVATAR_COLORS.length
  const playerColor = AVATAR_COLORS[colorIndex]

  const matchHistory = MATCH_HISTORY_SAMPLE_W3
  const teamPredictions = TEAM_PREDICTIONS_SAMPLE

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Nav Bar */}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Player Profile
        </span>
      </div>

      {/* Player Card */}
      <div style={{
        margin: '0 12px', padding: '20px 16px 16px',
        background: 'linear-gradient(135deg, var(--surface), var(--surface-alt))',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          background: `radial-gradient(circle, ${playerColor}1F, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ border: `3px solid ${playerColor}66`, borderRadius: '50%', boxShadow: `0 4px 20px ${playerColor}4D` }}>
            <Avatar player={player} size={72} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>{player.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: 'var(--gold)',
                background: 'rgba(255,215,0,0.15)', padding: '3px 10px', borderRadius: 6,
                border: '1px solid rgba(255,215,0,0.2)',
              }}>
                🥈 Rank #{playerStats.rank || '-'}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--green)',
                background: 'rgba(0,200,83,0.12)', padding: '3px 10px', borderRadius: 6,
              }}>
                {accuracy}% Acc
              </span>
            </div>
          </div>
        </div>

        {/* Stat Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 20, position: 'relative', zIndex: 1 }}>
          {[
            { value: playerStats.points || 0, label: 'Points', color: 'var(--gold)' },
            { value: playerStats.wins || 0, label: 'Wins', color: 'var(--green)' },
            { value: playerStats.losses || 0, label: 'Losses', color: 'var(--red)' },
            { value: playerStats.draws || 0, label: 'Draws', color: 'var(--blue)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px',
              textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points Over Time */}
      <Section title="Points Over Time" accentColor="var(--blue)">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={playerColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={playerColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fill: '#8899AA', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
            <YAxis tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1A2D47', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
            <Area type="monotone" dataKey="avg" stroke="#8899AA" strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.5} fill="none" name="Group Avg" />
            <Area type="monotone" dataKey="player" stroke={playerColor} strokeWidth={2.5} fill="url(#grad)" name={player.name} dot={{ r: 4, fill: playerColor }} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
          <Legend color={playerColor} label={player.name} />
          <Legend color="#8899AA" label="Group Avg" />
        </div>
      </Section>

      {/* Prediction Breakdown */}
      <Section title="Prediction Breakdown" accentColor="var(--green)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 110, height: 110, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" stroke="none">
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.8} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'relative', top: -68, textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{playerStats.predicted || 0}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)' }}>MATCHES</div>
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
      </Section>

      {/* Team Loyalty Map */}
      <Section title="Team Loyalty Map" accentColor="var(--gold)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {teamPredictions.map((tp) => {
            const team = IPL_TEAMS.find((t) => t.abbr === tp.team)
            const heat = tp.count >= 4 ? 'high' : tp.count >= 2 ? 'med' : tp.count > 0 ? 'low' : 'none'
            const heatStyles = {
              high: { background: 'rgba(0,200,83,0.2)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--green)' },
              med: { background: 'rgba(41,121,255,0.15)', border: '1px solid rgba(41,121,255,0.1)', color: 'var(--blue)' },
              low: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-secondary)' },
              none: { background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.2)' },
            }
            return (
              <div key={tp.team} style={{ borderRadius: 8, padding: '10px 4px', textAlign: 'center', ...heatStyles[heat] }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{tp.team}</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{tp.count}</div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Prize Earnings */}
      <Section title="Prize Earnings" accentColor="var(--gold)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <EarningCard label="Weekly Prizes" value="₹700" detail="1x Winner (Week 2)" />
          <EarningCard label="Stage Prizes" value="₹0" detail="Stage 1 in progress" />
          <div style={{
            gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
            border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: '14px 12px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Earnings</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>₹700</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Out of ₹45,500 pool</div>
          </div>
        </div>
      </Section>

      {/* Match History */}
      <Section title="Match History — Week 3" accentColor="var(--red)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {matchHistory.map((m) => (
            <div key={m.matchNum} style={{
              display: 'grid', gridTemplateColumns: '22px 1fr auto 36px',
              gap: 8, alignItems: 'center', padding: '9px 10px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.03)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>#{m.matchNum}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  <TeamBadge abbr={m.home} /> {m.home} vs {m.away} <TeamBadge abbr={m.away} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Picked: <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{m.predicted}</span>
                  {' '}&bull;{' '}
                  {m.result === 'draw' ? 'No Result' : `Won: ${m.winner}`}
                </div>
              </div>
              <ResultIcon result={m.result} />
              <div style={{
                fontSize: 14, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                color: m.result === 'correct' ? 'var(--green)' : m.result === 'incorrect' ? 'var(--red)' : 'var(--grey)',
              }}>
                {m.result === 'correct' ? '+10' : m.result === 'draw' ? '+5' : '0'}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Head to Head */}
      <Section title="Head to Head" accentColor="var(--blue)">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: 16, background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>⚔️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Compare with another player</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, accentColor, children }) {
  return (
    <div style={{
      margin: '12px 12px 0', padding: 16, background: 'var(--surface)',
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 4, height: 14, borderRadius: 2, background: accentColor }} />
        {title}
      </div>
      {children}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </div>
  )
}

function TeamBadge({ abbr }) {
  const team = IPL_TEAMS.find((t) => t.abbr === abbr)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: 4, fontSize: 8, fontWeight: 800,
      background: team?.color || '#333', color: '#fff', marginRight: 2, verticalAlign: 'middle',
    }}>
      {abbr?.[0]}
    </span>
  )
}

function ResultIcon({ result }) {
  const styles = {
    correct: { bg: 'rgba(0,200,83,0.15)', color: 'var(--green)', border: 'rgba(0,200,83,0.3)', icon: '✓' },
    incorrect: { bg: 'rgba(255,23,68,0.15)', color: 'var(--red)', border: 'rgba(255,23,68,0.3)', icon: '✗' },
    draw: { bg: 'rgba(96,125,139,0.15)', color: 'var(--grey)', border: 'rgba(96,125,139,0.3)', icon: '—' },
  }
  const s = styles[result] || styles.draw
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 900, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.icon}
    </div>
  )
}

function EarningCard({ label, value, detail }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12, padding: '14px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{detail}</div>
    </div>
  )
}
