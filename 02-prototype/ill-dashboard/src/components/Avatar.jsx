import { AVATAR_COLORS } from '../data/sampleData'

export default function Avatar({ player, size = 32 }) {
  const colorIndex = (player.id - 1) % AVATAR_COLORS.length
  const bg = AVATAR_COLORS[colorIndex]

  if (player.avatar) {
    return (
      <img
        src={player.avatar}
        alt={player.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 800,
        color: '#0A1628',
        flexShrink: 0,
      }}
    >
      {player.initials}
    </div>
  )
}
