import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const API = 'http://127.0.0.1:8000'

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState([
    { id: 1, course: 'Database Management Systems', type: 'Assignment', due_date: '2026-08-05', estimated_study_hours: 6, daysLeft: 6 },
    { id: 2, course: 'Programming in Java', type: 'Lab Test', due_date: '2026-08-10', estimated_study_hours: 4, daysLeft: 11 },
  ])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ course: '', type: 'Assignment', due_date: '', estimated_study_hours: 3 })
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  async function handleAdd() {
    if (!form.course || !form.due_date) return
    setLoading(true)
    try {
      await fetch(`${API}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    } catch {}
    const today = new Date()
    const due = new Date(form.due_date)
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    setDeadlines(prev => [...prev, { ...form, id: Date.now(), daysLeft }])
    setForm({ course: '', type: 'Assignment', due_date: '', estimated_study_hours: 3 })
    setShowForm(false)
    setLoading(false)
  }

  function urgencyBadge(days) {
    if (days <= 2) return 'badge-rose'
    if (days <= 5) return 'badge-amber'
    return 'badge-green'
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div className="page-header" style={{ margin: 0 }}>
            <h1>⏰ Deadlines</h1>
            <p>Track assignments, tests, and projects. The AI Planner adjusts your daily schedule accordingly.</p>
          </div>
          <button className="btn btn-primary btn-sm" id="add-deadline-btn" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ Add Deadline'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-active)' }}>
            <div className="section-title">New Deadline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Course Name</label>
                  <input className="input" placeholder="e.g. Database Management Systems" value={form.course} onChange={e => set('course', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                    {['Assignment', 'Lab Test', 'Mid-term Exam', 'End-term Exam', 'Project', 'Quiz'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Study Hours</label>
                  <input className="input" type="number" min={1} max={50} value={form.estimated_study_hours} onChange={e => set('estimated_study_hours', parseInt(e.target.value))} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                {loading ? <><span className="spinner" /> Adding...</> : '+ Add Deadline'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {deadlines.length === 0 && (
            <div className="empty-state"><div className="empty-icon">📭</div><p>No deadlines yet. Add one above!</p></div>
          )}
          {deadlines.sort((a, b) => a.daysLeft - b.daysLeft).map(d => (
            <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700 }}>{d.course}</span>
                  <span className="badge badge-blue">{d.type}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Due: {d.due_date} · ~{d.estimated_study_hours}h of study needed
                </div>
                {d.daysLeft <= 5 && (
                  <div style={{ marginTop: '0.4rem', color: 'var(--accent-amber)', fontSize: '0.8rem', fontWeight: 600 }}>
                    💡 Planner suggests ~{Math.ceil(d.estimated_study_hours / Math.max(d.daysLeft, 1))}h/day to stay on track
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={`badge ${urgencyBadge(d.daysLeft)}`}>{d.daysLeft}d left</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
