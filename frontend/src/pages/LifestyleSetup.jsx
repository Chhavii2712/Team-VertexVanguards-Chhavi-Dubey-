import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000'

export default function LifestyleSetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    wake_up_time: '06:30',
    sleep_time: '23:00',
    study_hours: 3,
    gym_preference: false,
    travel_time: 30,
    meal_timings: ['08:00', '13:00', '20:00'],
    club_activities: [],
  })
  const [loading, setLoading] = useState(false)

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch(`${API}/save-lifestyle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      sessionStorage.setItem('lifestyle', JSON.stringify(form))
      navigate('/dashboard')
    } catch {
      sessionStorage.setItem('lifestyle', JSON.stringify(form))
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const student = JSON.parse(sessionStorage.getItem('student') || '{}')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <div className="page-header">
          <div className="breadcrumb"><span style={{ color: 'var(--text-muted)' }}>Setup</span> › <span>Lifestyle</span></div>
          <h1>Lifestyle Setup</h1>
          <p>Tell us about your daily routine so the Planner Agent can create your perfect 24-hour schedule.</p>
        </div>

        {student.residence === 'Day Scholar' && (
          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)', fontSize: '0.875rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            🚌 <span><strong>Day Scholar</strong> detected — travel time will be added to your daily plan automatically.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="section-title">⏰ Sleep Schedule</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Wake Up Time</label>
                <input className="input" type="time" value={form.wake_up_time} onChange={e => set('wake_up_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Sleep Time</label>
                <input className="input" type="time" value={form.sleep_time} onChange={e => set('sleep_time', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">📚 Study Goals</div>
            <div className="form-group">
              <label className="form-label">Daily Study Hours: <strong style={{ color: 'var(--accent-blue)' }}>{form.study_hours}h</strong></label>
              <input type="range" min={1} max={10} value={form.study_hours} onChange={e => set('study_hours', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-blue)', marginTop: '0.5rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>1h</span><span>5h</span><span>10h</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">🏃 Activities</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <input type="checkbox" checked={form.gym_preference} onChange={() => set('gym_preference', !form.gym_preference)}
                style={{ accentColor: 'var(--accent-blue)', width: 16, height: 16 }} />
              🏋️ I go to the gym daily
            </label>
            {student.residence === 'Day Scholar' && (
              <div className="form-group">
                <label className="form-label">One-way Travel Time (minutes)</label>
                <input className="input" type="number" min={0} max={180} value={form.travel_time} onChange={e => set('travel_time', parseInt(e.target.value))} />
              </div>
            )}
          </div>

          <button id="save-lifestyle-btn" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Saving...</> : '🚀 Generate My Daily Plan →'}
          </button>
        </div>
      </div>
    </div>
  )
}
