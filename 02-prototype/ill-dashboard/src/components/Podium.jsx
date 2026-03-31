import Avatar from './Avatar'

export default function Podium({ leaderboard }) {
  if (leaderboard.length < 1) return null

  // Group by rank — handles ties correctly
  const byRank = {}
  leaderboard.forEach((entry) => {
    if (!byRank[entry.rank]) byRank[entry.rank] = []
    byRank[entry.rank].push(entry)
  })
  const sortedRanks = Object.keys(byRank).map(Number).sort((a, b) => a - b)
  const podiumRanks = sortedRanks.slice(0, 3) // top 3 distinct ranks

  if (podiumRanks.length < 1) return null

  const slots = podiumRanks.map((rank) => ({ rank, players: byRank[rank] }))
  // Always display in order: 2nd (left), 1st (center), 3rd (right)
  const slot1 = slots.find((s) => s.rank === 1)
  const slot2 = slots.find((s) => s.rank === 2) || slots[1]
  const slot3 = slots.find((s) => s.rank === 3) || slots[2]

  const COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
  const BAR_HEIGHTS = { 1: 64, 2: 46, 3: 36 }

  const PodiumSlot = ({ slot }) => {
    if (!slot) return <div style={{ flex: '1 1 0', maxWidth: 110 }} />
    const { rank, players } = slot
    const color = COLORS[rank] || '#888'
    const barHeight = BAR_HEIGHTS[rank] || 36
    const isFirst = rank === 1
    const avatarSize = isFirst ? 52 : 40
    const isTied = players.length > 1

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', maxWidth: 110 }}>
        {isFirst && <div style={{ fontSize: 18, marginBottom: 3 }}>👑</div>}

        {/* Avatar(s) — stacked if tied */}
        <div style={{ position: 'relative', height: avatarSize, width: isTied ? avatarSize + 16 : avatarSize }}>
          {players.slice(0, 2).map((entry, i) => (
            <div key={entry.playerId} style={{
              position: 'absolute',
              left: isTied ? i * 14 : 0,
              border: `${isFirst ? 3 : 2}px solid ${color}`,
              borderRadius: '50%',
              boxShadow: `0 0 ${isFirst ? 16 : 10}px ${color}50`,
              background: 'var(--bg)',
            }}>
              <Avatar player={entry.player} size={avatarSize} />
            </div>
          ))}
        </div>

        {/* Name(s) */}
        <div style={{ fontSize: isTied ? 9 : 11, fontWeight: 700, marginTop: 5, textAlign: 'center', maxWidth: '100%' }}>
          {players.map((e) => e.player.name).join(' = ')}
        </div>

        {/* Points */}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 1 }}>
          {players[0].points} pts
          {isTied && <span style={{ fontSize: 8, color, marginLeft: 3, fontWeight: 800 }}>TIE</span>}
        </div>

        {/* Bar */}
        <div style={{
          width: '100%', maxWidth: 72,
          height: barHeight,
          borderRadius: '8px 8px 0 0',
          marginTop: 6,
          background: `linear-gradient(180deg, ${color}30, ${color}08)`,
          border: `1px solid ${color}40`,
          borderBottom: 'none',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: 6, fontSize: 14, fontWeight: 900, color,
        }}>
          {rank}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 12px 6px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 180,
        background: 'radial-gradient(ellipse, rgba(255,215,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6,
        height: 185, position: 'relative',
      }}>
        <PodiumSlot slot={slot2} />
        <PodiumSlot slot={slot1} />
        <PodiumSlot slot={slot3} />
      </div>
    </div>
  )
}
