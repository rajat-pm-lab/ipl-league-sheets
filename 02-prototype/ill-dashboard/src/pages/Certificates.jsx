import { useState, useEffect } from 'react'

async function shareOrDownload(file, label) {
  const url = window.location.origin + file
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
  const a = document.createElement('a')
  a.href = url
  a.download = label + '.jpg'
  a.click()
}

export default function Certificates() {
  const [manifest, setManifest] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)

  useEffect(() => {
    fetch('/certificates/manifest.json')
      .then((r) => r.json())
      .then((data) => {
        setManifest(data)
        if (data.length > 0) setSelectedWeek(data[data.length - 1].week)
      })
      .catch(() => setManifest([]))
  }, [])

  if (manifest === null) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
  }

  if (manifest.length === 0) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No certificates yet</div>
  }

  const cert = manifest.find((c) => c.week === selectedWeek)

  return (
    <div style={{ padding: '4px 12px 24px' }}>
      {/* Week selector */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px' }}>
        <select
          value={selectedWeek ?? ''}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          style={{
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', padding: '8px 32px 8px 14px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {manifest.map((c) => (
            <option key={c.week} value={c.week}>Week {c.week}</option>
          ))}
        </select>
      </div>

      {cert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cert.winner && (
            <CertCard title="WINNER" accentColor="#C9A84C" cert={cert.winner} week={cert.week} />
          )}
          {cert.runnerUp && (
            <CertCard title="RUNNER-UP" accentColor="#9E9E9E" cert={cert.runnerUp} week={cert.week} />
          )}
        </div>
      )}
    </div>
  )
}

function CertCard({ title, accentColor, cert, week }) {
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
      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${accentColor}33`,
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: accentColor, textTransform: 'uppercase' }}>
            Week {week}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: accentColor }}>{title}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>{cert.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, color: '#fff',
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              border: 'none', borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', opacity: sharing ? 0.6 : 1,
            }}
          >
            {sharing ? '...' : (
              <>
                <InstagramIcon />
                Share
              </>
            )}
          </button>
        </div>
      </div>
      <img src={cert.file} alt={label} style={{ width: '100%', display: 'block' }} />
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}
