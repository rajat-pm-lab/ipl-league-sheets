import Avatar from './Avatar'

export default function Podium({ leaderboard }) {
  if (leaderboard.length < 3) return null
  const [first, second, third] = leaderboard

  const PodiumPlayer = ({ data, position }) => {
    const isFirst = position === 1
    const avatarSize = isFirst ? 56 : 44
    const barHeight = position === 1 ? 64 : position === 2 ? 46 : 36
    const borderColor = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', maxWidth: 110 }}>
        {isFirst && <div style={{ fontSize: 18, marginBottom: 3 }}>👑</div>}
        <div style={{
          border: `${isFirst ? 3 : 2}px solid ${borderColor}`,
          borderRadius: '50%',
          boxShadow: `0 0 ${isFirst ? 20 : 12}px ${borderColor}40`,
        }}>
          <Avatar player={data.player} size={avatarSize} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
          {data.player.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 1 }}>
          {data.points} pts
        </div>
        <div style={{
          width: '100%', maxWidth: 72,
          height: barHeight,
          borderRadius: '8px 8px 0 0',
          marginTop: 6,
          background: `linear-gradient(180deg, ${borderColor}30, ${borderColor}08)`,
          border: `1px solid ${borderColor}40`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 6,
          fontSize: 14,
          fontWeight: 900,
          color: borderColor,
        }}>
          {position}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px 12px 6px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 180,
        background: 'radial-gradient(ellipse, rgba(255,215,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6,
        height: 175, position: 'relative',
      }}>
        <PodiumPlayer data={second} position={2} />
        <PodiumPlayer data={first} position={1} />
        <PodiumPlayer data={third} position={3} />
      </div>
    </div>
  )
}
