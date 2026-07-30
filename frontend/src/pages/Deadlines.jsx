import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const API = 'http://127.0.0.1:8000'

export default function Deadlines() {
  const navigate = useNavigate()
  const [deadlines, setDeadlines] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ course: '', type: 'Assignment', due_date: '', estimated_study_hours: 3 })
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  // Load deadlines on mount and when refreshKey changes
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${API}/deadlines`)
        const data = await res.json()
        setDeadlines(data.deadlines || [])
        setAnalysis(data.analysis || null)
      } catch (err) {
        console.error('Error fetching deadlines:', err)
      }
    }
    loadData()
  }, [refreshKey])

  async function handleAdd() {
    if (!form.course || !form.due_date) return
    setLoading(true)
    try {
      await fetch(`${API}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      setForm({ course: '', type: 'Assignment', due_date: '', estimated_study_hours: 3 })
      setShowForm(false)
      setRefreshKey(p => p + 1)
    } catch (err) {
      alert('Could not connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(courseName) {
    try {
      await fetch(`${API}/deadlines/${encodeURIComponent(courseName)}`, {
        method: 'DELETE'
      })
      setRefreshKey(p => p + 1)
    } catch (err) {
      alert('Could not complete deadline.')
    }
  }

  function handleStudyRecs(courseName) {
    sessionStorage.setItem('studyQuery', courseName)
    navigate('/study')
  }

  function urgencyBadge(days) {
    if (days <= 2) return 'badge-rose'
    if (days <= 5) return 'badge-amber'
    return 'badge-green'
  }

  // Simple formatter for AI markdown analysis to make it look stunning
  function formatAnalysisText(text) {
    if (!text) return 'No priority data available.'
    
    // Split lines and render with styled spans
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('PRIORITY LIST:') || trimmed.startsWith("TODAY'S FOCUS:") || trimmed.startsWith('TIP:')) {
        return <div key={idx} style={{ fontWeight: 700, color: 'var(--accent-blue)', marginTop: '0.85rem', marginBottom: '0.4rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{trimmed}</div>
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // Bullet
        return <div key={idx} style={{ paddingLeft: '1rem', position: 'relative', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {trimmed.slice(1).trim()}</div>
      }
      if (/^\d+\./.test(trimmed)) {
        // Numbered list
        return <div key={idx} style={{ paddingLeft: '0.5rem', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{trimmed}</div>
      }
      return <div key={idx} style={{ marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{trimmed}</div>
    })
  }

  // Find priority analysis summary
  const enrichedDeadlines = analysis?.deadlines_with_days || []

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="page-header" style={{ margin: 0 }}>
            <h1>⏰ Deadline Agent</h1>
            <p>Track academic tasks, calculate urgency splits, and coordinate study sessions with your AI Planner.</p>
          </div>
          <button className="btn btn-primary btn-sm" id="add-deadline-btn" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ Add Deadline'}
          </button>
        </div>

        {/* Outer Split Layout */}
        <div style={{ display: 'flex', gap: '2rem', flex: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Left Column: Deadlines form + card list */}
          <div style={{ flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {showForm && (
              <div className="card" style={{ borderColor: 'var(--border-active)', animation: 'slideDown 0.3s ease-out' }}>
                <div className="section-title">New Academic Deadline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                      <label className="form-label">Course Name / Code</label>
                      <input className="input" placeholder="e.g. DBMS or CSE3015" value={form.course} onChange={e => set('course', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Task Type</label>
                      <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                        {['Assignment', 'Quiz', 'CAT Exam', 'Lab Evaluation', 'Presentation', 'Project Submission'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Due Date</label>
                      <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Estimated Work Hours</label>
                      <input className="input" type="number" min={1} max={50} value={form.estimated_study_hours} onChange={e => set('estimated_study_hours', parseInt(e.target.value))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleAdd} disabled={loading} style={{ alignSelf: 'flex-end', minWidth: '140px' }}>
                    {loading ? <><span className="spinner" /> Adding...</> : '+ Save Deadline'}
                  </button>
                </div>
              </div>
            )}

            {/* List of Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {deadlines.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>All clear! No pending academic deadlines.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use the button above to add new assignments or quizzes.</p>
                </div>
              )}

              {enrichedDeadlines.map((d, index) => (
                <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', position: 'relative' }}>
                  
                  {/* Card Main Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{d.course}</span>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{d.type}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        📅 Due Date: <strong>{d.due_date}</strong> · Needs <strong>{d.estimated_study_hours}h</strong> total study
                      </div>
                    </div>
                    <div>
                      <span className={`badge ${urgencyBadge(d.days_left)}`} style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                        ⏰ {d.days_left}d left
                      </span>
                    </div>
                  </div>

                  {/* Daily splits note */}
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-blue)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      📚 Focus Allocation: <strong>{d.daily_hours_needed} hours/day</strong> recommended to stay on track.
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleStudyRecs(d.course)}>
                      📚 Study Recommendations →
                    </button>
                  </div>

                  {/* Actions line */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={() => handleComplete(d.course)}>
                      ✓ Mark Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: AI Priority Insights */}
          <div style={{ flex: 1, minWidth: '280px', position: 'sticky', top: '0' }}>
            <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>AI Priority Insights</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {analysis ? (
                  formatAnalysisText(analysis.raw_analysis)
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Add academic deadlines to trigger priority calculations, recommended splits, and study schedules.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
