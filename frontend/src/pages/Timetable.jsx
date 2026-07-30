import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const TIMES = ['08:30', '10:05', '11:40', '13:15', '14:50', '16:25']

function buildGrid(schedule) {
  const grid = {}
  DAYS.forEach(d => { grid[d] = {} })
  schedule?.forEach(slot => {
    const day = slot.day?.slice(0, 3).toUpperCase()
    if (day && grid[day]) {
      grid[day][slot.time?.split('-')[0]] = slot.course
    }
  })
  return grid
}

export default function Timetable() {
  const navigate = useNavigate()
  const options = JSON.parse(sessionStorage.getItem('timetableOptions') || '[]')
  const [selected, setSelected] = useState(null)

  // If no options from API, show mock timetable for demo
  const displayOptions = options.length > 0 ? options : [
    {
      score: 5,
      schedule: [
        { day: 'Monday', time: '08:30-10:00', course: 'CSE3015' },
        { day: 'Monday', time: '10:05-11:35', course: 'CSE1010' },
        { day: 'Wednesday', time: '08:30-10:00', course: 'CSE3015' },
        { day: 'Thursday', time: '11:40-13:10', course: 'CSE2004' },
        { day: 'Friday', time: '08:30-10:00', course: 'CSE3015' },
      ]
    },
    {
      score: 3,
      schedule: [
        { day: 'Monday', time: '11:40-13:10', course: 'CSE3015' },
        { day: 'Tuesday', time: '08:30-10:00', course: 'CSE1010' },
        { day: 'Wednesday', time: '11:40-13:10', course: 'CSE3015' },
        { day: 'Friday', time: '11:40-13:10', course: 'CSE3015' },
      ]
    }
  ]

  function handleSelect(idx) {
    setSelected(idx)
    sessionStorage.setItem('chosenTimetable', JSON.stringify(displayOptions[idx]))
  }

  function handleContinue() {
    navigate('/lifestyle')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '920px' }}>
        <div className="page-header">
          <div className="breadcrumb"><span style={{ color: 'var(--text-muted)' }}>Setup</span> › <span>Choose Timetable</span></div>
          <h1>Choose Your Timetable</h1>
          <p>{displayOptions.length} clash-free timetable{displayOptions.length !== 1 ? 's' : ''} generated. Select the one that works best for you.</p>
        </div>

        {displayOptions.map((opt, idx) => {
          const grid = buildGrid(opt.schedule)
          const stars = Math.min(5, Math.max(1, opt.score))
          return (
            <div
              key={idx}
              className="card"
              style={{ marginBottom: '1.5rem', cursor: 'pointer', borderColor: selected === idx ? 'var(--accent-blue)' : 'var(--border)', background: selected === idx ? 'rgba(59,130,246,0.05)' : 'var(--bg-card)' }}
              onClick={() => handleSelect(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Timetable {idx + 1}</div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < stars ? 'var(--accent-amber)' : 'var(--border)', fontSize: '1rem' }}>★</span>
                  ))}
                </div>
              </div>
              <div className="timetable-grid">
                <table className="tt-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      {TIMES.map(t => <th key={t}>{t}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day}>
                        <td style={{ fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>{day}</td>
                        {TIMES.map(t => {
                          const course = grid[day]?.[t]
                          return (
                            <td key={t} className={course ? 'tt-cell-filled' : ''}>
                              {course || ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        <button className="btn btn-primary btn-lg" id="confirm-timetable-btn" style={{ width: '100%' }} disabled={selected === null} onClick={handleContinue}>
          ✅ Confirm & Set Up Lifestyle →
        </button>
      </div>
    </div>
  )
}
