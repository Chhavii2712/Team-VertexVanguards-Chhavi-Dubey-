import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const MOCK_SCHEDULE = [
  { time: '06:30', label: 'Wake Up', type: 'sleep', icon: '☀️' },
  { time: '07:00', label: 'Breakfast', type: 'meal', icon: '🍳' },
  { time: '07:45', label: 'Travel to College', type: 'travel', icon: '🚌' },
  { time: '08:30', label: 'Java — CSE1010', type: 'class', icon: '💻' },
  { time: '10:05', label: 'DBMS — CSE3015', type: 'class', icon: '🗄️' },
  { time: '13:00', label: 'Lunch', type: 'meal', icon: '🍱' },
  { time: '14:50', label: 'OS — CSE2004', type: 'class', icon: '🖥️' },
  { time: '17:00', label: 'Travel Home', type: 'travel', icon: '🚌' },
  { time: '18:00', label: 'Gym', type: 'gym', icon: '🏋️' },
  { time: '19:30', label: 'Study: DBMS', type: 'study', icon: '📚' },
  { time: '20:30', label: 'Dinner', type: 'meal', icon: '🍽️' },
  { time: '21:00', label: 'Study: Java', type: 'study', icon: '📖' },
  { time: '22:30', label: 'Wind Down', type: 'sleep', icon: '🌙' },
  { time: '23:00', label: 'Sleep', type: 'sleep', icon: '😴' },
]

const TYPE_COLOR = { class: 'var(--accent-blue)', study: 'var(--accent-purple)', meal: 'var(--accent-amber)', gym: 'var(--accent-green)', travel: 'var(--accent-cyan)', sleep: 'var(--text-muted)' }

export default function Dashboard() {
  const navigate = useNavigate()
  const student = JSON.parse(sessionStorage.getItem('student') || '{}')
  const courses = JSON.parse(sessionStorage.getItem('selectedCourses') || '[]')

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>
              Good morning, <span className="text-gradient">{student.name?.split(' ')[0] || 'Student'}</span> 👋
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{student.branch || 'BAI'}</span>
              <span className="badge badge-cyan">{student.residence || 'Hosteller'}</span>
              {student.current_year_of_study && <span className="badge badge-purple">Year {student.current_year_of_study}</span>}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/chat')}>💬 Ask AI</button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Classes Today', value: '3', icon: '📅', color: 'var(--accent-blue)' },
            { label: 'Study Hours', value: '3h', icon: '📚', color: 'var(--accent-purple)' },
            { label: 'Deadlines', value: '2', icon: '⏰', color: 'var(--accent-amber)' },
            { label: 'Courses', value: courses.length || 5, icon: '🎓', color: 'var(--accent-green)' },
          ].map((s, i) => (
            <div key={i} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', lineHeight: 1, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
          {/* Today's Timeline */}
          <div>
            <div className="section-title">📆 Today's Schedule</div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="timeline">
                {MOCK_SCHEDULE.map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-track">
                      <div className={`timeline-dot ${item.type}`} style={{ background: TYPE_COLOR[item.type] }} />
                      {i < MOCK_SCHEDULE.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-block" style={{ borderLeft: `3px solid ${TYPE_COLOR[item.type]}` }}>
                        <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                        <span style={{ fontWeight: 600 }}>{item.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div className="section-title">⚡ Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Add Deadline', icon: '➕', to: '/deadlines', color: 'badge-amber' },
                  { label: 'Study Assistant', icon: '🤖', to: '/study', color: 'badge-purple' },
                  { label: 'View Timetable', icon: '📅', to: '/timetable', color: 'badge-blue' },
                ].map((a, i) => (
                  <button key={i} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => navigate(a.to)}>
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="section-title">🔔 Upcoming Deadlines</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { course: 'DBMS Assignment', due: '3 days', priority: 'badge-rose' },
                  { course: 'Java Lab Test', due: '7 days', priority: 'badge-amber' },
                ].map((d, i) => (
                  <div key={i} className="card card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.course}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due in {d.due}</div>
                    </div>
                    <span className={`badge ${d.priority}`}>{d.due}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
