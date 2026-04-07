import { useState } from 'react'

// Static manifest — add new entries here as weeks complete
// { week: N, winner: { name, file }, runnerUp: { name, file } }
const CERT_MANIFEST = [
  {
    week: 1,
    winner:   { name: 'Shan Mohammed',    file: '/certificates/week-1-winner.jpg' },
    runnerUp: { name: 'Deepanshu Pincha', file: '/certificates/week-1-runner-up.jpg' },
  },
]

async function shareOrDownload(file, label) {
  const url = window.location.origin + file
  // Try Web Share API first (works on mobile — opens native share sheet including Instagram)
  if (navigator.share) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const fileObj = new File([blob], label + '.jpg', { type: 'image/jpeg' })
      await navigator.share({ files: [fileObj], title: label })
      return
    } catch {
      // Fall through to download
    }
  }
  // Fallback: trigger download
  const a = document.createElement('a')
  a.href = url
  a.download = label + '.jpg'
  a.click()
}

export default function Certificates() {
  const weeks = CERT_MANIFEST.map((c) => c.week)
  const [selectedWeek, setSelectedWeek] = useState(weeks[weeks.length - 1])
  const cert = CERT_MANIFEST.find((c) => c.week === selectedWeek)

  return (
    <div style={{ padding: '4px 12px 24px' }}>
      {/* Week selector */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px' }}>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          style={{
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', padding: '8px 32px 8px 14px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      {cert ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CertCard
            title="WINNER"
            accentColor="#C9A84C"
            cert={cert.winner}
            week={cert.week}
            type="winner"
          />
          <CertCard
            title="RUNNER-UP"
            accentColor="#9E9E9E"
            cert={cert.runnerUp}
            week={cert.week}
            type="runner-up"
          />
        </div>
      ) : (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          No certificates yet for Week {selectedWeek}
        </div>
      )}
    </div>
  )
}

function CertCard({ title, accentColor, cert, week, type }) {
  const [sharing, setSharing] = useState(false)
  const label = `ILL Week ${week} ${title}`

  const handleShare = async () => {
    setSharing(true)
    await shareOrDownload(cert.file, label)
    setSharing(false)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accentColor}44`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${accentColor}33`,
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: accentColor, textTransform: 'uppercase' }}>
            Week {week}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: accentColor }}>
            {title}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>
            {cert.name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Download */}
          <a
            href={cert.file}
            download={`${label}.jpg`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 10px',
              textDecoration: 'none',
            }}
          >
            ↓ Save
          </a>
          {/* Share */}
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, color: '#fff',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              border: 'none', borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', opacity: sharing ? 0.6 : 1,
            }}
          >
            {sharing ? '...' : '↗ Share'}
          </button>
        </div>
      </div>

      {/* Certificate image */}
      <img
        src={cert.file}
        alt={label}
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  )
}
