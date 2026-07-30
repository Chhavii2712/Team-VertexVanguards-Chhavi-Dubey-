import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const API = 'http://127.0.0.1:8000'

const TYPE_COLOR = {
  class:  'var(--accent-blue)',
  study:  'var(--accent-purple)',
  meal:   'var(--accent-amber)',
  gym:    'var(--accent-green)',
  travel: 'var(--accent-cyan)',
  sleep:  'var(--text-muted)',
  break:  'var(--accent-rose)',
  other:  'var(--text-muted)',
}

const TYPE_ICON = {
  class:  '📅',
  study:  '📚',
  meal:   '🍽️',
  gym:    '🏋️',
  travel: '🚌',
  sleep:  '😴',
  break:  '☕',
  other:  '⚡',
}

const TYPE_LABEL = {
  class: 'Class', study: 'Study', meal: 'Meal', gym: 'Gym',
  travel: 'Travel', sleep: 'Rest', break: 'Break', other: 'Other',
}

export default function DailyPlanner() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState([])
  const [loading, setLoading] = useState(true)
  const [replanning, setReplanning] = useState(false)
  const [error, setError] = useState(null)
  const [adjustInput, setAdjustInput] = useState('')
  const [showAdjust, setShowAdjust] = useState(false)
  const scrollRef = useRef(null)

  // Load plan on mount
  useEffect(() => {
    generatePlan()
  }, [])

  async function generatePlan(adjustment = null) {
    setLoading(true)
    setError(null)
    try {
      const body = adjustment ? { adjustment } : {}
      const res = await fetch(`${API}/generate-daily-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.plan && data.plan.length > 0) {
        setPlan(data.plan)
      } else {
        setError('No plan generated. Please set up your timetable and lifestyle first.')
      }
    } catch {
      setError('Backend not connected. Please start the FastAPI server.')
    } finally {
      setLoading(false)
      setReplanning(false)
    }
  }

  async function handleReplan() {
    setReplanning(true)
    await generatePlan(adjustInput || null)
    setAdjustInput('')
    setShowAdjust(false)
  }

  function handleStudyShortcut(label) {
    // Extract subject name from label like "Study: DBMS — Priority 🔥"
    const match = label.match(/Study[:\s]+([A-Za-z0-9\s\-]+)/i)
    const subject = match ? match[1].trim() : label.replace(/Study[:\s]*/i, '').trim()
    sessionStorage.setItem('studyQuery', subject)
    navigate('/study')
  }

  // Compute stats from plan
  const classBlocks = plan.filter(p => p.type === 'class')
  const studyBlocks = plan.filter(p => p.type === 'study')
  const gymBlocks   = plan.filter(p => p.type === 'gym')
  const freeBlocks  = plan.filter(p => ['break', 'other'].includes(p.type))

  // Rough hour counts (assume each block is ~1h unless label says otherwise)
  const classHrs  = classBlocks.length
  const studyHrs  = studyBlocks.length
  const gymHrs    = gymBlocks.length
  const freeHrs   = freeBlocks.length

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem', overflowY: 'auto', height: '100vh' }} ref={scrollRef}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="page-header" style={{ margin: 0 }}>
            <h1>📅 Daily Planner</h1>
            <p>AI-generated 24-hour schedule for <strong>{today}</strong>. Personalized to your habits and deadlines.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdjust(s => !s)}>
              ✏️ Adjust Schedule
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleReplan} disabled={replanning || loading}>
              {replanning ? <><span className="spinner" /> Replanning...</> : '🔄 Replan'}
            </button>
          </div>
        </div>

        {/* Adjust panel */}
        {showAdjust && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-active)' }}>
            <div className="section-title">✏️ Adjust Today's Plan</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Describe any changes — <em>"I have football practice at 5 PM"</em>, <em>"I couldn't study yesterday"</em>, <em>"move gym to morning"</em>, etc.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Type your adjustment here..."
                value={adjustInput}
                onChange={e => setAdjustInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReplan()}
              />
              <button className="btn btn-primary" onClick={handleReplan} disabled={!adjustInput.trim() || replanning}>
                Apply →
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
            <span className="spinner" style={{ width: 36, height: 36 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              🧠 Gemini AI is personalizing your schedule...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/slot-selection')}>
                → Select Timetable Slots
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/lifestyle')}>
                → Setup Lifestyle
              </button>
            </div>
          </div>
        )}

        {/* Plan loaded */}
        {!loading && !error && plan.length > 0 && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                { label: 'Class Hours', value: `${classHrs}`, color: 'var(--accent-blue)',   icon: '📅' },
                { label: 'Study Hours', value: `${studyHrs}`, color: 'var(--accent-purple)', icon: '📚' },
                { label: 'Gym / Fitness', value: `${gymHrs}`, color: 'var(--accent-green)',  icon: '🏋️' },
                { label: 'Free Blocks',  value: `${freeHrs}`, color: 'var(--accent-amber)',  icon: '⚡' },
              ].map((s, i) => (
                <div key={i} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {Object.entries(TYPE_COLOR).filter(([t]) => t !== 'other').map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  {TYPE_LABEL[type]}
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="card" style={{ padding: '1.5rem 2rem' }}>
              <div className="timeline">
                {plan.map((item, i) => {
                  const color = TYPE_COLOR[item.type] || TYPE_COLOR.other
                  const icon = TYPE_ICON[item.type] || '⚡'
                  const isStudy = item.type === 'study'
                  return (
                    <div key={i} className="timeline-item">
                      <div className="timeline-time" style={{ width: 55, flexShrink: 0 }}>{item.time}</div>
                      <div className="timeline-track">
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: color,
                          boxShadow: `0 0 8px ${color}60`,
                          flexShrink: 0, marginTop: '0.15rem',
                        }} />
                        {i < plan.length - 1 && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-content" style={{ flex: 1 }}>
                        <div style={{
                          background: 'var(--bg-surface)',
                          border: `1px solid var(--border)`,
                          borderLeft: `3px solid ${color}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.55rem 0.9rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <span>{icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</span>
                          </div>
                          {isStudy && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
                              onClick={() => handleStudyShortcut(item.label)}
                            >
                              📖 Open Notes
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
