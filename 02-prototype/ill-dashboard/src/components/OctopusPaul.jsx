import { useState } from 'react'
import Avatar from './Avatar'

// ── Paul's projection algorithm ───────────────────────────────
//
// A 5-factor weighted model that scores each player and ranks them
// to predict Week N winner, runner-up, and lappa.
//
// FINAL PAUL SCORE (0–1 scale):
//   0.40 × N(ExpectedRemainingPts)   ← future week projection
//   0.20 × N(CurrentWeekPts)         ← points earned so far this week
//   0.20 × N(RankScore, week-1)      ← most recent prior week standing
//   0.15 × N(RankScore, week-2)      ← 2nd most recent prior week
//   0.05 × N(RankScore, week-3)      ← 3rd most recent prior week
//
// N(x) = min-max normalisation across all players for that factor.
// RankScore(rank) = numPlayers − rank + 1  (rank 1 → highest score)
//
// ── FACTOR 1: ExpectedRemainingPts ─────────────────────────────
// For each remaining (unplayed) match:
//   - Cannibalised match  → 0 pts   (checked FIRST, overrides everything)
//   - Triple Dip match    → blendedRate × 50 − 20   (EV of +30/−20)
//   - BAU match           → blendedRate × 10         (EV of +10/0)
//
// blendedRate = Bayesian blend of Week N form + career rate
//   = (w4Wins + careerRate × 5) / (w4Played + 5)
//   Prior weight of 5 pseudo-matches prevents small-sample overfit.
//   Falls back to careerRate (weeks 1..N-1) if no picks yet this week.
//   Absolute fallback: 0.45 if no history at all.
//
// Triple Dip breakeven: blendedRate = 40% (EV = 0 at exactly 40%)
// Below 40% → TD hurts vs BAU. Above 40% → TD pays off.
//
// ── CANNIBALISATION PRIORITY ────────────────────────────────────
// Cannibalised check always runs before TD check.
// So a cannibalised TD match = 0 pts, not TD EV.
// cannibResolution[week][playerId].matchNum = the single resolved match.
//
// ── AUTO-UPDATES ────────────────────────────────────────────────
// Paul re-runs on every page load (Vercel 60s cache).
// Punch winner into Google Sheet → Paul updates within ~1 min.

function normalize(values) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0.5)
  return values.map((v) => (v - min) / (max - min))
}

function projectWeekFinal(weeklyData, players, selectedWeek, weekMatches, allPredictions, cannibResolution) {
  const remainingWeekMatches = weekMatches.filter((m) => m.winner === undefined)
  const completedWeekMatches = weekMatches.filter((m) => m.winner !== undefined)
  const completedCount = completedWeekMatches.length

  // ── Per-player raw factor values ────────────────────────────
  const playerData = players.map((p) => {
    const pp = (allPredictions?.[selectedWeek] || {})[p.id] || {}
    const tripleDips = pp._tripleDips || []
    const cannibMatchNum = cannibResolution?.[selectedWeek]?.[p.id]?.matchNum ?? null

    // Career win rate: all weeks BEFORE selectedWeek
    let careerWins = 0, careerPlayed = 0
    Object.entries(weeklyData).forEach(([w, rows]) => {
      if (Number(w) >= selectedWeek) return
      const row = (rows || []).find((r) => r.playerId === p.id)
      if (row) { careerWins += row.wins ?? 0; careerPlayed += row.played ?? 0 }
    })
    const careerRate = careerPlayed > 0 ? careerWins / careerPlayed : 0.45

    // Current-week raw pick accuracy (for Bayesian blend)
    let wkWins = 0, wkPlayed = 0
    for (const m of completedWeekMatches) {
      const pick = pp[m.matchNum]
      if (!pick) continue
      wkPlayed++
      if (pick === m.winner) wkWins++
    }

    // Bayesian blend: prior weight = 5 pseudo-matches at career rate
    const blendedRate = (wkWins + careerRate * 5) / (wkPlayed + 5)

    // Factor 1: expected pts from remaining matches
    let expectedRemaining = 0
    for (const m of remainingWeekMatches) {
      if (m.matchNum === cannibMatchNum) {
        // cannibalised — forced 0, even if it's a TD
      } else if (tripleDips.includes(m.matchNum)) {
        expectedRemaining += blendedRate * 50 - 20  // EV of +30/−20
      } else {
        expectedRemaining += blendedRate * 10        // EV of +10/0
      }
    }

    // Factor 2: points already earned this week
    const wkRow = (weeklyData[selectedWeek] || []).find((r) => r.playerId === p.id)
    const currentWeekPts = wkRow?.points ?? 0

    return { p, blendedRate, expectedRemaining, currentWeekPts }
  })

  // ── Prior-week rank scores ──────────────────────────────────
  // Get up to 3 most recent weeks before selectedWeek
  const priorWeeks = Object.keys(weeklyData)
    .map(Number)
    .filter((w) => w < selectedWeek)
    .sort((a, b) => b - a)   // descending: most recent first
    .slice(0, 3)

  // Weights: most recent → 20%, 2nd → 15%, 3rd → 5%
  const priorWeights = [0.20, 0.15, 0.05]

  // For each prior week, compute rank scores (numPlayers − rank + 1)
  const priorRankScores = priorWeeks.map((w) => {
    const rows = [...(weeklyData[w] || [])].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    const scoreMap = {}
    let rank = 1
    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i].points !== rows[i - 1].points) rank = i + 1
      scoreMap[rows[i].playerId] = players.length - rank + 1
    }
    return scoreMap
  })

  // ── Normalise all factors ───────────────────────────────────
  const f1N = normalize(playerData.map((d) => d.expectedRemaining))
  const f2N = normalize(playerData.map((d) => d.currentWeekPts))
  const priorN = priorRankScores.map((scoreMap) =>
    normalize(playerData.map((d) => scoreMap[d.p.id] ?? 0))
  )

  // ── Compute Paul scores ─────────────────────────────────────
  // paulScore (0–1) is a weighted blend used for tiebreaking.
  // Primary ranking is by projectedPts (the number displayed to users).
  const scored = playerData.map((d, i) => {
    let paulScore = 0.40 * f1N[i] + 0.20 * f2N[i]
    for (let k = 0; k < priorWeeks.length; k++) {
      paulScore += priorWeights[k] * (priorN[k]?.[i] ?? 0)
    }
    return {
      player: d.p,
      paulScore,
      projectedPts: d.currentWeekPts + d.expectedRemaining,
    }
  })

  // Rank by projected pts (matches displayed value); paulScore breaks ties
  scored.sort((a, b) => b.projectedPts - a.projectedPts || b.paulScore - a.paulScore)
  return {
    first: scored[0],
    second: scored[1],
    lappa: scored[scored.length - 1],
    completedMatches: completedCount,
    remainingMatches: remainingWeekMatches.length,
    totalMatches: weekMatches.length,
  }
}

// ── Paul SVG avatar ──────────────────────────────────────────
function PaulSVG({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 62 Q16 70 20 80 Q24 70 28 80 Q32 70 28 62" fill="#2979CC" />
      <path d="M32 65 Q28 74 32 83 Q36 74 40 83 Q44 74 40 65" fill="#2979CC" />
      <path d="M44 65 Q40 74 44 83 Q48 74 52 83 Q56 74 52 65" fill="#2979CC" />
      <path d="M54 62 Q50 70 54 80 Q58 70 62 80 Q64 70 58 62" fill="#2979CC" />
      <ellipse cx="40" cy="50" rx="27" ry="22" fill="#2060B0" opacity="0.3" />
      <ellipse cx="40" cy="38" rx="28" ry="30" fill="#3D8EE0" />
      <ellipse cx="32" cy="20" rx="10" ry="7" fill="#6FB8FF" opacity="0.45" />
      <ellipse cx="29" cy="36" rx="9" ry="10" fill="white" />
      <ellipse cx="51" cy="36" rx="9" ry="10" fill="white" />
      <circle cx="31" cy="37" r="5.5" fill="#1A2A4A" />
      <circle cx="53" cy="37" r="5.5" fill="#1A2A4A" />
      <circle cx="33" cy="34" r="2" fill="white" />
      <circle cx="55" cy="34" r="2" fill="white" />
      <path d="M31 50 Q40 57 49 50" stroke="#2060B0" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="44" rx="5" ry="3" fill="#FF8FAB" opacity="0.35" />
      <ellipse cx="60" cy="44" rx="5" ry="3" fill="#FF8FAB" opacity="0.35" />
    </svg>
  )
}

// ── Prediction card ──────────────────────────────────────────
function PredCard({ label, emoji, player, projectedPts, accentColor }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3, padding: '8px 4px 10px',
      background: `${accentColor}12`,
      border: `1px solid ${accentColor}40`,
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <Avatar player={player} size={30} />
      <div style={{
        fontSize: 10, fontWeight: 800, color: accentColor,
        textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text)',
        textAlign: 'center', maxWidth: 60,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {player?.name ?? '?'}
      </div>
      {projectedPts !== undefined && (
        <div style={{
          fontSize: 9, fontWeight: 700,
          color: accentColor, opacity: 0.7,
        }}>
          ~{Math.round(projectedPts)} pts
        </div>
      )}
    </div>
  )
}

// ── Algorithm explainer ───────────────────────────────────────
const FACTORS = [
  {
    pct: '40%', color: '#6FB8FF', barWidth: '100%',
    name: 'Future matches',
    desc: 'Expected pts from remaining games — Triple Dips score +30/−20, cannibalised matches score 0',
  },
  {
    pct: '20%', color: '#5AABF5', barWidth: '50%',
    name: 'This week so far',
    desc: 'Points already locked in from completed matches this week',
  },
  {
    pct: '20%', color: '#4F9FE8', barWidth: '50%',
    name: 'Last week',
    desc: 'How you finished last week — recent form matters most',
  },
  {
    pct: '15%', color: '#7AB8EE', barWidth: '37.5%',
    name: '2 weeks ago',
    desc: 'Your standing from 2 weeks back',
  },
  {
    pct: '5%', color: '#9BBFDA', barWidth: '12.5%',
    name: '3 weeks ago',
    desc: 'Your earliest week standing — a distant echo',
  },
]

function AlgorithmExplainer() {
  return (
    <div style={{
      marginTop: 10,
      paddingTop: 12,
      borderTop: '1px solid rgba(61,142,224,0.15)',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 1.8,
        textTransform: 'uppercase', color: '#6FB8FF',
        opacity: 0.85, marginBottom: 12,
      }}>
        Paul's 5-Factor Model
      </div>

      {FACTORS.map((f) => (
        <div key={f.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 11 }}>
          {/* % pill */}
          <div style={{
            minWidth: 34, padding: '3px 6px', borderRadius: 6,
            fontSize: 10, fontWeight: 900, textAlign: 'center',
            flexShrink: 0, marginTop: 1,
            background: `${f.color}22`, color: f.color,
          }}>
            {f.pct}
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{f.name}</div>
            <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 5 }}>{f.desc}</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: f.barWidth, background: `linear-gradient(90deg, #3D8EE0, ${f.color})`, borderRadius: 2 }} />
            </div>
          </div>
        </div>
      ))}

      {/* Insight note */}
      <div style={{
        marginTop: 14, padding: '8px 10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
        fontSize: 9, fontWeight: 600,
        color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        💡 <span style={{ color: 'rgba(255,200,80,0.85)', fontWeight: 700 }}>Triple Dip tip:</span> You need &gt;40% prediction accuracy for a Triple Dip to help vs a normal pick. Below that, it actually hurts.
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────
export default function OctopusPaul({ weeklyData, players, selectedWeek, weekMatches, allPredictions, cannibResolution }) {
  const [showExplainer, setShowExplainer] = useState(false)

  if (!weeklyData || !players?.length || !weekMatches?.length) return null

  // Don't show if week hasn't started yet (no results at all)
  const weekStarted = weekMatches.some((m) => m.winner !== undefined)
  if (!weekStarted) return null

  let prediction
  try {
    prediction = projectWeekFinal(weeklyData, players, selectedWeek, weekMatches, allPredictions, cannibResolution)
  } catch {
    return null
  }

  const { completedMatches, remainingMatches, totalMatches } = prediction
  const progressPct = Math.round((completedMatches / totalMatches) * 100)
  const weekDone = remainingMatches === 0

  return (
    <div style={{
      margin: '14px 12px 4px',
      padding: '12px 12px 14px',
      background: 'linear-gradient(135deg, rgba(61,142,224,0.08), rgba(30,60,120,0.12))',
      border: '1px solid rgba(61,142,224,0.2)',
      borderRadius: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <PaulSVG size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5, color: '#6FB8FF' }}>
            🔮 Paul's Week {selectedWeek} Winner Prediction
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
            {weekDone
              ? 'Final standings — week complete'
              : `Updates after every match · ${completedMatches}/${totalMatches} done`}
          </div>
          {/* Progress bar */}
          <div style={{
            marginTop: 6, height: 3,
            background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #3D8EE0, #6FB8FF)',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>

      {/* Three prediction cards */}
      <div style={{ display: 'flex', gap: 8 }}>
        <PredCard
          label={weekDone ? 'Winner 🏆' : 'Week Winner'}
          emoji="👑"
          player={prediction.first?.player}
          projectedPts={prediction.first?.projectedPts}
          accentColor="var(--gold)"
        />
        <PredCard
          label="Runner-up"
          emoji="🥈"
          player={prediction.second?.player}
          projectedPts={prediction.second?.projectedPts}
          accentColor="#A0AEC0"
        />
        <PredCard
          label="Lappa 🫣"
          emoji="💩"
          player={prediction.lappa?.player}
          projectedPts={prediction.lappa?.projectedPts}
          accentColor="var(--red)"
        />
      </div>

      <div style={{
        marginTop: 6, fontSize: 8, fontWeight: 600,
        color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: 0.3,
      }}>
        {weekDone
          ? 'Paul called it. Or didn\'t. Either way, blame the octopus.'
          : 'Projection updates after every match. Paul is an octopus. Blame him, not us.'}
      </div>

      {/* Explainer CTA */}
      <div
        onClick={() => setShowExplainer((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginTop: 10, padding: '8px 0',
          background: 'rgba(61,142,224,0.1)',
          border: '1px solid rgba(61,142,224,0.25)',
          borderRadius: 10,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6FB8FF', letterSpacing: 0.3 }}>
          {showExplainer ? 'Got it' : 'How does Paul predict?'}
        </span>
        <span style={{
          fontSize: 10, color: '#6FB8FF',
          transform: showExplainer ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>
          ▾
        </span>
      </div>

      {/* Explainer panel */}
      {showExplainer && <AlgorithmExplainer />}
    </div>
  )
}
