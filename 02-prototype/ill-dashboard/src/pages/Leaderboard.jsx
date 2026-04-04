import { useState, useEffect } from 'react'
import { useLeagueData } from '../data/DataContext'

import LeaderboardTable from '../components/LeaderboardTable'
import PredictionsView from '../components/PredictionsView'

const TABS = ['Weekly', 'Stage', 'Overall', 'Picks']

export default function Leaderboard() {
  const { data, loading, computeWeeklyLeaderboard, computeStageLeaderboard } = useLeagueData()
  const [activeTab, setActiveTab] = useState('Weekly')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedStage, setSelectedStage] = useState('STAGE_1')
  const [weekInitialized, setWeekInitialized] = useState(false)

  // Default to the currently active week once data loads
  useEffect(() => {
    if (data && !weekInitialized) {
      const cw = data.currentWeek || 1
      setSelectedWeek(cw)
      setSelectedStage(cw <= 3 ? 'STAGE_1' : cw <= 6 ? 'STAGE_2' : 'STAGE_3')
      setWeekInitialized(true)
    }
  }, [data, weekInitialized])

  // Compute whether the selected week is fully complete (all matches have results)
  const weekMatches = data?.matchSchedule?.[selectedWeek] || []
  const weekComplete = weekMatches.length > 0 && weekMatches.every((m) => m.winner !== undefined)

  // Rules for selected week — from API or a sensible default
  const weekRules = data?.weeklyRules?.[selectedWeek] || { correct: 10, wrong: 0, noResult: 5, note: '' }

  if (loading || !data) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading league data...</div>
      </div>
    )
  }

  const { players, stages, weeklyData } = data

  let leaderboard = []
  if (activeTab === 'Weekly') {
    leaderboard = computeWeeklyLeaderboard(weeklyData, selectedWeek, players)
  } else if (activeTab === 'Stage') {
    const stageWeeks = stages[selectedStage]?.weeks || []
    leaderboard = computeStageLeaderboard(weeklyData, stageWeeks, players)
  } else if (activeTab === 'Overall') {
    const allWeeks = Object.keys(stages).flatMap((s) => stages[s].weeks)
    leaderboard = computeStageLeaderboard(weeklyData, allWeeks, players)
  }

  const currentStageKey = selectedWeek <= 3 ? 'STAGE_1' : selectedWeek <= 6 ? 'STAGE_2' : 'STAGE_3'
  const currentStage = stages[currentStageKey]

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 12px 8px', position: 'sticky', top: 0,
        background: 'var(--bg)', zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
            background: 'linear-gradient(135deg, var(--gold), #FFA000)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Indian Lappa League
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
            Predict &nbsp;|&nbsp; Banter &nbsp;|&nbsp; Win
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {data._source === 'api' && (
            <div style={{ fontSize: 8, color: 'var(--green)', alignSelf: 'center', fontWeight: 700 }}>● LIVE</div>
          )}
          <IconButton title="Share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
          </IconButton>
          <IconButton title="Admin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </IconButton>
        </div>
      </div>

      {/* Stage Badge */}
      <div style={{
        margin: '12px 12px 0', padding: '10px 14px', borderRadius: 12,
        background: `linear-gradient(135deg, ${currentStage.color}20, ${currentStage.color}08)`,
        border: `1px solid ${currentStage.color}4D`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: currentStage.color,
          boxShadow: `0 0 8px ${currentStage.color}`,
          animation: 'pulse 2s infinite',
        }} />
        <span style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
          color: currentStage.color,
        }}>
          {currentStage.label} — Week {selectedWeek}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: 'var(--green)',
          background: 'rgba(0,200,83,0.15)', padding: '3px 8px', borderRadius: 6,
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>
          ● Match Day
        </span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', padding: '0 12px', marginTop: 20,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {TABS.map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, textAlign: 'center', padding: '12px 0',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--gold)' : 'var(--text-secondary)',
              cursor: 'pointer', position: 'relative', transition: 'color 0.2s',
              ...(activeTab === tab ? {
                borderBottom: '3px solid var(--gold)',
                marginBottom: -1,
              } : {}),
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Selectors */}
      {(activeTab === 'Weekly' || activeTab === 'Picks') && (
        <div style={{ padding: '12px 12px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              style={{
                background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text)', padding: '8px 32px 8px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
          {/* Weekly rules strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Points:</span>
            <RuleChip color="var(--green)" label={`✓ Correct +${weekRules.correct}`} />
            <RuleChip color="var(--red)" label={`✗ Wrong ${weekRules.wrong}`} />
            <RuleChip color="var(--grey)" label={`≈ No Result +${weekRules.noResult}`} />
            {weekRules.note && (
              <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 600, fontStyle: 'italic' }}>{weekRules.note}</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Stage' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 12px', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(stages).map(([key, stage]) => (
            <button
              key={key}
              onClick={() => setSelectedStage(key)}
              style={{
                background: selectedStage === key ? stage.color + '30' : 'var(--surface)',
                border: `1px solid ${selectedStage === key ? stage.color + '60' : 'rgba(255,255,255,0.1)'}`,
                color: selectedStage === key ? stage.color : 'var(--text-secondary)',
                padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.5,
              }}
            >
              {stage.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'Picks'
        ? <PredictionsView selectedWeek={selectedWeek} data={data} />
        : <LeaderboardTable
            leaderboard={leaderboard}
            activeTab={activeTab}
            weekComplete={activeTab !== 'Weekly' || weekComplete}
          />
      }

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function RuleChip({ color, label }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color,
      background: `${color}18`, border: `1px solid ${color}40`,
      padding: '2px 7px', borderRadius: 6,
    }}>{label}</span>
  )
}

function IconButton({ children, title }) {
  return (
    <div
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 10, background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s',
      }}
    >
      {children}
    </div>
  )
}
