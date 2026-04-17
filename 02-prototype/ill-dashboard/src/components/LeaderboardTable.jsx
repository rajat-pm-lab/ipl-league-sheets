import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'

const rankIcons = { 1: '👑', 2: '🥈', 3: '🥉' }
const rankColors = { 1: 'var(--gold)', 2: '#C0C0C0', 3: '#CD7F32' }

const LAPPA_LABELS = {
  Weekly: 'Lappa of the Week 🫣',
  Stage: 'Lappa of the Stage 🫣',
  Overall: 'Ultimate Lappa 🫣',
}

const gridCols = '36px 28px 1fr 26px 26px 22px 22px 22px 44px 14px'

export default function LeaderboardTable({ leaderboard, activeTab = 'Weekly', weekComplete = false, rankDeltas = {} }) {
  const navigate = useNavigate()
  const maxPts = Math.max(...leaderboard.map((r) => r.points), 1)

  return (
    <div style={{ padding: '0 8px' }}>
      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '6px 8px 2px',
        fontSize: 7, fontWeight: 600, color: 'rgba(136,153,170,0.6)', letterSpacing: 0.2,
      }}>
        {[
          { abbr: 'PRD', full: 'Predicted' },
          { abbr: 'PLD', full: 'Played' },
          { abbr: 'W', full: 'Won' },
          { abbr: 'L', full: 'Lost' },
          { abbr: 'D', full: 'Draw' },
        ].map((item) => (
          <span key={item.abbr}><span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{item.abbr}</span> = {item.full}</span>
        ))}
      </div>

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: gridCols,
        gap: 3, alignItems: 'center', padding: '8px 8px',
        fontSize: 8, fontWeight: 700, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: 0.3,
      }}>
        <span>#</span><span /><span>Player</span>
        <span style={{ textAlign: 'center' }}>Prd</span>
        <span style={{ textAlign: 'center' }}>Pld</span>
        <span style={{ textAlign: 'center' }}>W</span>
        <span style={{ textAlign: 'center' }}>L</span>
        <span style={{ textAlign: 'center' }}>D</span>
        <span style={{ textAlign: 'right' }}>Pts</span>
        <span />
      </div>

      {/* Rows */}
      {leaderboard.map((row) => {
        const isFirst = row.rank === 1
        const isSecond = row.rank === 2
        const isLast = row.rank === leaderboard.length

        let rowStyle = {
          display: 'grid', gridTemplateColumns: gridCols,
          gap: 3, alignItems: 'center', padding: '9px 8px',
          borderRadius: 10, marginBottom: 3, cursor: 'pointer',
          background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.03)',
          transition: 'all 0.2s',
        }

        if (isFirst) {
          rowStyle.borderLeft = '3px solid var(--gold)'
          rowStyle.background = 'linear-gradient(90deg, rgba(255,215,0,0.08), var(--surface))'
        } else if (isSecond) {
          rowStyle.borderLeft = '3px solid rgba(0,200,83,0.6)'
          rowStyle.background = 'linear-gradient(90deg, rgba(0,200,83,0.05), var(--surface))'
        } else if (isLast) {
          rowStyle.borderLeft = '3px solid var(--red)'
          rowStyle.background = 'linear-gradient(90deg, rgba(255,23,68,0.05), var(--surface))'
        }

        return (
          <div
            key={row.playerId}
            style={rowStyle}
            onClick={() => navigate(`/player/${row.playerId}`)}
          >
            {/* Rank */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                fontSize: rankIcons[row.rank] ? 14 : 12, fontWeight: 800,
                color: rankColors[row.rank] || 'var(--text-secondary)', lineHeight: 1,
              }}>
                {rankIcons[row.rank] || row.rank}
              </div>
            </div>

            {/* Avatar */}
            <Avatar player={row.player} size={28} />

            {/* Name */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                {row.player.name}
                {(() => {
                  const delta = rankDeltas[row.playerId] ?? 0
                  return delta !== 0 ? (
                    <span style={{
                      fontSize: 8, fontWeight: 800, lineHeight: 1,
                      color: delta > 0 ? 'var(--green)' : 'var(--red)',
                      background: delta > 0 ? 'rgba(0,200,83,0.12)' : 'rgba(255,23,68,0.12)',
                      padding: '1px 4px', borderRadius: 4, flexShrink: 0,
                    }}>
                      {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                    </span>
                  ) : null
                })()}
              </div>
              {weekComplete && isFirst && (
                <span style={{
                  fontSize: 8, fontWeight: 700, color: 'var(--gold)',
                  background: 'rgba(255,215,0,0.15)', padding: '1px 5px',
                  borderRadius: 3, display: 'inline-block', marginTop: 1,
                }}>₹700 Winner</span>
              )}
              {weekComplete && isSecond && (
                <span style={{
                  fontSize: 8, fontWeight: 700, color: 'var(--green)',
                  background: 'rgba(0,200,83,0.15)', padding: '1px 5px',
                  borderRadius: 3, display: 'inline-block', marginTop: 1,
                }}>₹300 Runner-up</span>
              )}
              {weekComplete && isLast && (
                <span style={{
                  fontSize: 8, fontWeight: 700, color: 'var(--red)',
                  background: 'rgba(255,23,68,0.15)', padding: '1px 5px',
                  borderRadius: 3, display: 'inline-block', marginTop: 1,
                }}>{LAPPA_LABELS[activeTab]}</span>
              )}
            </div>

            {/* Stats */}
            <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.predicted}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.played}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{row.wins}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{row.losses}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: 'var(--grey)', fontVariantNumeric: 'tabular-nums' }}>{row.draws}</div>

            {/* Points with bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{row.points}</span>
              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, transition: 'width 0.5s',
                  width: `${(row.points / maxPts) * 100}%`,
                  background: isLast
                    ? 'linear-gradient(90deg, var(--red), var(--orange))'
                    : 'linear-gradient(90deg, var(--blue), var(--gold))',
                }} />
              </div>
            </div>

            {/* Profile chevron */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}
