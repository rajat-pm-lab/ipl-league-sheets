import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { CUMULATIVE_POINTS, AVATAR_COLORS } from '../data/sampleData'

export default function PointsRaceChart({ currentWeek }) {
  // Build chart data: { week: 'W1', player1: 40, player2: 35, ... }
  const chartData = []
  for (let w = 0; w <= currentWeek; w++) {
    const point = { week: w === 0 ? 'Start' : `W${w}` }
    CUMULATIVE_POINTS.forEach((p) => {
      point[p.name] = p.weeks[w] || 0
    })
    chartData.push(point)
  }

  return (
    <div style={{
      margin: '20px 12px', padding: 20, background: 'var(--surface)',
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        fontSize: 14, fontWeight: 800, letterSpacing: 0.5,
        textTransform: 'uppercase', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 4, height: 16, background: 'var(--gold)', borderRadius: 2 }} />
        Points Race
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis
            dataKey="week" tick={{ fill: '#8899AA', fontSize: 10, fontWeight: 600 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8899AA', fontSize: 9 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1A2D47', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, fontSize: 11, color: '#fff',
            }}
          />
          {CUMULATIVE_POINTS.map((p, i) => (
            <Line
              key={p.name} type="monotone" dataKey={p.name}
              stroke={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              strokeWidth={i < 3 ? 2.5 : 1.5}
              strokeOpacity={i < 3 ? 0.9 : 0.4}
              dot={false} activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
