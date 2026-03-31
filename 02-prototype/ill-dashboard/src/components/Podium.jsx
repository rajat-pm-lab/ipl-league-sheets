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

  // Use positional slots — top 3 distinct rank groups by index (not by rank number)
  // This avoids the bug where slot2 and slot3 point to the same group when rank 2 doesn't exist
  const slot0 = podiumRanks[0] != null ? { rank: podiumRanks[0], players: byRank[podiumRanks[0]] } : null
  const slot1 = podiumRanks[1] != null ? { rank: podiumRanks[1], players: byRank[podiumRanks[1]] } : null
  const slot2 = podiumRanks[2] != null ? { rank: podiumRanks[2], players: byRank[podiumRanks[2]] } : null

  // Visual config by podium position (not by actual rank number)
  const POS_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
  const POS_BAR_HEIGHTS = [64, 46, 36]
  const POS_AVATAR_SIZES = [52, 40, 40]

  const PodiumSlot = ({ slot, posIndex }) => {
    if (!slot) return <div style={{ flex: '1 1 0', maxWidth: 110 }} />
    const { rank, players } = slot
    const color = POS_COLORS[posIndex]
    const barHeight = POS_BAR_HEIGHTS[posIndex]
    const avatarSize = POS_AVATAR_SIZES[posIndex]
    const isCenter = posIndex === 0
    const isTied = players.length > 1

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', maxWidth: 110 }}>
        {isCenter && <div style={{ fontSize: 18, marginBottom: 3 }}>👑</div>}

        {/* Avatar(s) — side by side if tied (not overlapping) */}
        <div style={{ display: 'flex', gap: isTied ? 3 : 0, justifyContent: 'center' }}>
          {players.slice(0, 2).map((entry) => (
            <div key={entry.playerId} style={{
              border: `${isCenter ? 3 : 2}px solid ${color}`,
              borderRadius: '50%',
              boxShadow: `0 0 ${isCenter ? 16 : 10}px ${color}50`,
              background: 'var(--bg)',
              flexShrink: 0,
            }}>
              <Avatar player={entry.player} size={isTied ? Math.round(avatarSize * 0.72) : avatarSize} />
            </div>
          ))}
          {players.length > 2 && (
            <div style={{
              width: avatarSize * 0.72, height: avatarSize * 0.72, borderRadius: '50%',
              background: `${color}30`, border: `2px solid ${color}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color, flexShrink: 0,
            }}>+{players.length - 2}</div>
          )}
        </div>

        {/* Name(s) */}
        <div style={{ fontSize: isTied ? 9 : 11, fontWeight: 700, marginTop: 5, textAlign: 'center', maxWidth: '100%', lineHeight: 1.3 }}>
          {players.slice(0, 2).map((e) => e.player.name).join(' = ')}
          {players.length > 2 && ` +${players.length - 2}`}
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
        <PodiumSlot slot={slot1} posIndex={1} />
        <PodiumSlot slot={slot0} posIndex={0} />
        <PodiumSlot slot={slot2} posIndex={2} />
      </div>
    </div>
  )
}
