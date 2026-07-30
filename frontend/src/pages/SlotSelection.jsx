import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000'

// ── Common VIT FFCS slot combinations organized by credit type ──
const SLOT_OPTIONS_BY_CREDITS = {
  4: [
    { name: 'A11+A12+A13 (Morning Mon/Wed/Fri)', slots: ['A11', 'A12', 'A13'] },
    { name: 'B11+B12+B13 (Morning Mon/Wed/Fri)', slots: ['B11', 'B12', 'B13'] },
    { name: 'C11+C12+C13 (Morning Mon/Wed/Fri)', slots: ['C11', 'C12', 'C13'] },
    { name: 'A21+A22+A23 (Afternoon Mon/Wed/Fri)', slots: ['A21', 'A22', 'A23'] },
    { name: 'B21+B22+B23 (Afternoon Mon/Wed/Fri)', slots: ['B21', 'B22', 'B23'] },
    { name: 'A14+B14+C14 (Friday Block)', slots: ['A14', 'B14', 'C14'] },
    { name: 'Other (Custom)', slots: [], custom: true },
  ],
  3: [
    { name: 'D11+D12 (Tue/Thu Morning)', slots: ['D11', 'D12'] },
    { name: 'E11+E12 (Tue/Thu Morning)', slots: ['E11', 'E12'] },
    { name: 'F11+F12 (Tue/Thu Morning)', slots: ['F11', 'F12'] },
    { name: 'E14+F14 (Fri Afternoon)', slots: ['E14', 'F14'] },
    { name: 'E21+E22 (Tue/Thu Afternoon)', slots: ['E21', 'E22'] },
    { name: 'F21+F22 (Tue/Thu Afternoon)', slots: ['F21', 'F22'] },
    { name: 'Other (Custom)', slots: [], custom: true },
  ],
  2: [
    { name: 'C21 (Mon Afternoon)', slots: ['C21'] },
    { name: 'A13 (Fri Morning)', slots: ['A13'] },
    { name: 'B24 (Fri Afternoon)', slots: ['B24'] },
    { name: 'F11 (Tue Morning)', slots: ['F11'] },
    { name: 'A11 (Mon Morning)', slots: ['A11'] },
    { name: 'D11 (Tue Morning)', slots: ['D11'] },
    { name: 'E14 (Fri Afternoon)', slots: ['E14'] },
    { name: 'Other (Custom)', slots: [], custom: true },
  ],
}

function getSlotOptions(credits) {
  // Return slot options based on credit count; fallback to 4-credit options
  const c = parseInt(credits, 10)
  return SLOT_OPTIONS_BY_CREDITS[c] || SLOT_OPTIONS_BY_CREDITS[4]
}

export default function SlotSelection() {
  const navigate = useNavigate()
  const courses = JSON.parse(sessionStorage.getItem('selectedCourses') || '[]')
  const [selections, setSelections] = useState({})
  const [customSlots, setCustomSlots] = useState({})
  const [preferences, setPreferences] = useState({ morning_classes: false, no_friday: false, compact: false })
  const [loading, setLoading] = useState(false)

  function selectOption(courseCode, option) {
    setSelections(prev => ({ ...prev, [courseCode]: option }))
  }

  function allSelected() {
    return courses.every(c => selections[c.code])
  }

  async function handleGenerate() {
    setLoading(true)
    try {
      // Build slot_combinations dict for the API
      const slot_combinations = {}
      courses.forEach(c => {
        const sel = selections[c.code]
        if (!sel) return
        const slots = sel.custom
          ? (customSlots[c.code] || '').split(',').map(s => s.trim()).filter(Boolean)
          : sel.slots
        if (!slot_combinations[c.code]) slot_combinations[c.code] = []
        slot_combinations[c.code].push(slots)
      })

      const res = await fetch(`${API}/generate-timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_courses: courses.map(c => c.code),
          slot_combinations,
          preferences,
        })
      })
      const data = await res.json()
      sessionStorage.setItem('timetableOptions', JSON.stringify(data.options || []))
      navigate('/timetable')
    } catch {
      alert('Could not reach backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '780px' }}>
        <div className="page-header">
          <div className="breadcrumb"><span style={{ color: 'var(--text-muted)' }}>Setup</span> › <span>Slot Selection</span></div>
          <h1>Choose Your Slot Options</h1>
          <p>Pick a slot combination for each course. The generator will create all clash-free timetables.</p>
        </div>

        {courses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No courses selected. Go back and select your courses first.</p>
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/course-selection')}>← Back</button>
          </div>
        )}

        {courses.map(course => {
          const options = getSlotOptions(course.credits)
          const selected = selections[course.code]
          return (
            <div key={course.code} className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{course.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{course.code} · {course.credits} credits</div>
                </div>
                {selected && !selected.custom && <span className="badge badge-purple">✓ {selected.name}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {options.map((opt, i) => (
                  <div key={i} className={`slot-option ${selected?.name === opt.name ? 'selected' : ''}`} onClick={() => selectOption(course.code, opt)}>
                    <div className="radio" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{opt.name}</div>
                      {!opt.custom && (
                        <div className="slot-chips">
                          {opt.slots.map(s => <span key={s} className="slot-chip">{s}</span>)}
                        </div>
                      )}
                      {opt.custom && selected?.name === opt.name && (
                        <input
                          className="input"
                          style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                          placeholder="Enter slots e.g. A11, A12, A13"
                          value={customSlots[course.code] || ''}
                          onChange={e => setCustomSlots(prev => ({ ...prev, [course.code]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {courses.length > 0 && (
          <>
            {/* Preferences */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="section-title">⚙️ Timetable Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { key: 'morning_classes', label: '🌅 Prefer morning classes' },
                  { key: 'no_friday', label: '🎉 Minimize Friday classes' },
                  { key: 'compact', label: '📐 Prefer compact schedule (fewer gaps)' },
                ].map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={preferences[p.key]}
                      onChange={() => setPreferences(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                      style={{ accentColor: 'var(--accent-blue)', width: 16, height: 16 }}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" id="generate-timetable-btn" style={{ width: '100%' }} disabled={!allSelected() || loading} onClick={handleGenerate}>
              {loading ? <><span className="spinner" /> Generating...</> : '✨ Generate Clash-Free Timetables →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
