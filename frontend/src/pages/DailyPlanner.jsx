import Sidebar from '../components/Sidebar'

const MOCK_PLAN = [
  { time: '06:30', label: 'Wake Up', type: 'sleep', icon: '☀️', duration: '30min' },
  { time: '07:00', label: 'Breakfast', type: 'meal', icon: '🍳', duration: '30min' },
  { time: '07:30', label: 'Travel to College', type: 'travel', icon: '🚌', duration: '45min' },
  { time: '08:30', label: 'Java — CSE1010', type: 'class', icon: '💻', duration: '1h 30min' },
  { time: '10:05', label: 'DBMS — CSE3015', type: 'class', icon: '🗄️', duration: '1h 30min' },
  { time: '11:40', label: 'Free / Self Study', type: 'study', icon: '📖', duration: '1h' },
  { time: '13:00', label: 'Lunch', type: 'meal', icon: '🍱', duration: '1h' },
  { time: '14:00', label: 'OS — CSE2004', type: 'class', icon: '🖥️', duration: '1h 30min' },
  { time: '16:00', label: 'Travel Home', type: 'travel', icon: '🚌', duration: '45min' },
  { time: '17:00', label: 'Break / Rest', type: 'sleep', icon: '😴', duration: '1h' },
  { time: '18:00', label: 'Gym', type: 'gym', icon: '🏋️', duration: '1h' },
  { time: '19:30', label: 'Study: DBMS (Deadline Priority)', type: 'study', icon: '📚', duration: '1h 30min' },
  { time: '21:00', label: 'Dinner', type: 'meal', icon: '🍽️', duration: '30min' },
  { time: '21:30', label: 'Study: Java', type: 'study', icon: '📖', duration: '1h' },
  { time: '22:30', label: 'Wind Down / Review', type: 'sleep', icon: '🌙', duration: '30min' },
  { time: '23:00', label: 'Sleep', type: 'sleep', icon: '😴', duration: '7h 30min' },
]

const TYPE_COLOR = { class: 'var(--accent-blue)', study: 'var(--accent-purple)', meal: 'var(--accent-amber)', gym: 'var(--accent-green)', travel: 'var(--accent-cyan)', sleep: 'var(--text-muted)' }
const TYPE_LABEL = { class: 'Class', study: 'Study', meal: 'Meal', gym: 'Gym', travel: 'Travel', sleep: 'Rest' }

export default function DailyPlanner() {
  const studyTotal = MOCK_PLAN.filter(p => p.type === 'study').length * 1.5
  const classTotal = MOCK_PLAN.filter(p => p.type === 'class').length * 1.5

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem' }}>
        <div className="page-header">
          <h1>📅 Daily Planner</h1>
          <p>Your AI-generated 24-hour schedule for today.</p>
        </div>

        {/* Summary Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { label: 'Class Hours', value: `${classTotal}h`, color: 'var(--accent-blue)', icon: '📅' },
            { label: 'Study Hours', value: `${studyTotal}h`, color: 'var(--accent-purple)', icon: '📚' },
            { label: 'Travel Time', value: '1.5h', color: 'var(--accent-cyan)', icon: '🚌' },
            { label: 'Free Time', value: '3.5h', color: 'var(--accent-green)', icon: '⚡' },
          ].map((s, i) => (
            <div key={i} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_COLOR).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              {TYPE_LABEL[type]}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <div className="timeline">
            {MOCK_PLAN.map((item, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-time" style={{ width: 55 }}>{item.time}</div>
                <div className="timeline-track">
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: TYPE_COLOR[item.type], boxShadow: `0 0 8px ${TYPE_COLOR[item.type]}60`, flexShrink: 0, marginTop: '0.15rem' }} />
                  {i < MOCK_PLAN.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div style={{ background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderLeft: `3px solid ${TYPE_COLOR[item.type]}`, borderRadius: 'var(--radius-sm)', padding: '0.55rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
