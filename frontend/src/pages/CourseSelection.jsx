import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'

const CATEGORY_COLORS = {
  'Programme Core': 'badge-blue',
  'Programme Electives': 'badge-purple',
  'University Core': 'badge-amber',
  'Open Electives': 'badge-green',
}

export default function CourseSelection() {
  const navigate = useNavigate()
  const student = JSON.parse(sessionStorage.getItem('student') || '{}')
  const branch = student.branch_code || student.branch || 'BAI'

  const [curriculum, setCurriculum] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCurriculum() {
      try {
        const res = await fetch(`${API}/curriculum/${branch}`)
        const data = await res.json()
        setCurriculum(data)
      } catch {
        setError('Could not load curriculum. Check the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchCurriculum()
  }, [branch])

  function toggleCourse(code) {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  function handleContinue() {
    const selectedCourses = curriculum?.all_courses?.filter(c => selected.includes(c.code))
    sessionStorage.setItem('selectedCourses', JSON.stringify(selectedCourses || []))
    navigate('/slot-selection')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '860px' }}>
        <div className="page-header">
          <div className="breadcrumb">
            <span style={{ color: 'var(--text-muted)' }}>Setup</span> › <span>Course Selection</span>
          </div>
          <h1>Select Your Courses</h1>
          <p>
            Curriculum for <strong style={{ color: 'var(--accent-blue)' }}>{curriculum?.branch_name || branch}</strong> — pick the courses you are taking this semester.
          </p>
        </div>

        {loading && <div className="loading"><div className="spinner" /> Loading curriculum...</div>}
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem', color: 'var(--accent-rose)', marginBottom: '1.5rem' }}>
            ⚠️ {error}
          </div>
        )}

        {curriculum?.categories?.map(cat => (
          <div key={cat.name} style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>{cat.name}</h2>
              <span className={`badge ${CATEGORY_COLORS[cat.name] || 'badge-cyan'}`}>{cat.courses.length} courses</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.65rem' }}>
              {cat.courses.map(course => (
                <div
                  key={course.code}
                  className={`course-card ${selected.includes(course.code) ? 'selected' : ''}`}
                  onClick={() => toggleCourse(course.code)}
                >
                  <div className="course-checkbox" />
                  <div className="course-info">
                    <div className="course-name">{course.name}</div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem' }}>
                      <span className="course-code">{course.code}</span>
                      <span className="course-credits">{course.credits} credits</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sticky bottom bar */}
        {!loading && (
          <div style={{ position: 'sticky', bottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(10px)' }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '1.1rem' }}>{selected.length}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem', fontSize: '0.9rem' }}>courses selected</span>
            </div>
            <button className="btn btn-primary" id="continue-slot-selection-btn" disabled={selected.length === 0} onClick={handleContinue}>
              Continue to Slot Selection →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
