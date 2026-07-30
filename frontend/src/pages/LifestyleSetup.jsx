import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000'

// ── Quiz Questions ─────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'sleep_type',
    emoji: '🌞',
    title: "What's your sleep personality?",
    subtitle: 'Be honest — no judgment here!',
    options: [
      { value: 'early_bird', emoji: '🌅', label: 'Early Bird', sub: "I'm up before my alarm." },
      { value: 'night_owl', emoji: '🦉', label: 'Night Owl', sub: 'My brain starts working after dinner.' },
      { value: 'snoozer', emoji: '😴', label: 'Professional Snoozer', sub: 'Five alarms are just a suggestion.' },
    ],
  },
  {
    id: 'morning_energy',
    emoji: '☕',
    title: 'How are your mornings?',
    options: [
      { value: 'ready', emoji: '😁', label: 'Ready to conquer', sub: 'Let me at it!' },
      { value: 'coffee', emoji: '☕', label: "Don't talk until coffee", sub: 'Essential fuel required.' },
      { value: 'loading', emoji: '🥲', label: 'Still loading...', sub: '⠀⠀⠀⠀⠀⠀⠀' },
    ],
  },
  {
    id: 'study_style',
    emoji: '📚',
    title: 'How do you study?',
    options: [
      { value: 'focused', emoji: '🎯', label: 'Long focused sessions', sub: 'Lock in, get it done.' },
      { value: 'pomodoro', emoji: '⏳', label: 'Pomodoro technique', sub: '25 min on, 5 min off.' },
      { value: 'last_minute', emoji: '⚡', label: 'Last-minute bursts', sub: 'Deadline = motivation.' },
      { value: 'mood', emoji: '🎲', label: 'Depends on my mood', sub: 'Day-by-day vibes.' },
    ],
  },
  {
    id: 'study_environment',
    emoji: '🎵',
    title: 'Ideal study environment?',
    options: [
      { value: 'music', emoji: '🎧', label: 'Music', sub: 'Lo-fi or bust.' },
      { value: 'silence', emoji: '🤫', label: 'Pure silence', sub: 'Library mode.' },
      { value: 'rain', emoji: '🌧️', label: 'Rain sounds', sub: 'Cozy background.' },
      { value: 'cafe', emoji: '☕', label: 'Café vibes', sub: 'Background chatter.' },
    ],
  },
  {
    id: 'peak_productivity',
    emoji: '🧠',
    title: 'When do you feel most productive?',
    subtitle: 'Hard tasks go here.',
    options: [
      { value: 'morning', emoji: '🌅', label: 'Morning', sub: '7 AM — 12 PM' },
      { value: 'afternoon', emoji: '☀️', label: 'Afternoon', sub: '12 PM — 5 PM' },
      { value: 'evening', emoji: '🌆', label: 'Evening', sub: '5 PM — 9 PM' },
      { value: 'late_night', emoji: '🌙', label: 'Late Night', sub: '9 PM — 12 AM' },
    ],
  },
  {
    id: 'exercise_type',
    emoji: '💪',
    title: 'Exercise preferences?',
    options: [
      { value: 'gym', emoji: '🏋️', label: 'Gym', sub: 'Weight training.' },
      { value: 'sports', emoji: '🏃', label: 'Sports / Running', sub: 'Cardio all day.' },
      { value: 'walk', emoji: '🚶', label: 'Evening walk', sub: 'Casual movement.' },
      { value: 'none', emoji: '😂', label: 'Exercise? What is that?', sub: 'Keyboard athlete.' },
    ],
  },
  {
    id: 'meal_preference',
    emoji: '🍽️',
    title: 'Meals in a day?',
    options: [
      { value: 'three_meals', emoji: '🍳', label: 'Breakfast + Lunch + Dinner', sub: 'Properly fueled.' },
      { value: 'skip_breakfast', emoji: '🌮', label: 'Lunch + Dinner only', sub: 'Skip the morning rush.' },
    ],
  },
  {
    id: '_travel',    // Special: shown only for Day Scholars
    emoji: '🚌',
    title: 'How long is your daily commute?',
    subtitle: 'Travel time will be blocked automatically.',
    options: [
      { value: 15, emoji: '⚡', label: '15 minutes', sub: 'Super close.' },
      { value: 30, emoji: '🚌', label: '30 minutes', sub: 'Manageable.' },
      { value: 45, emoji: '🛣️', label: '45 minutes', sub: 'A bit far.' },
      { value: 60, emoji: '😤', label: '1 hour+', sub: 'Long commute life.' },
    ],
    dayScholarOnly: true,
  },
  {
    id: 'club_activities',
    emoji: '🎭',
    title: 'Regular extracurricular commitments?',
    subtitle: 'Select all that apply — planner reserves these hours.',
    multi: true,
    options: [
      { value: 'Club Meetings', emoji: '🤝', label: 'Club Meetings' },
      { value: 'Sports Practice', emoji: '⚽', label: 'Sports' },
      { value: 'Dance', emoji: '💃', label: 'Dance' },
      { value: 'Music', emoji: '🎸', label: 'Music' },
      { value: 'Events/Fest', emoji: '🎉', label: 'Events / Fest' },
      { value: 'None', emoji: '🙅', label: 'None' },
    ],
  },
  {
    id: 'phone_usage_hours',
    emoji: '📱',
    title: 'Time lost to Instagram / Reels / YouTube?',
    subtitle: 'Be honest... we will schedule study BEFORE leisure 😈',
    options: [
      { value: 0.5, emoji: '😇', label: '< 30 minutes', sub: 'Impressive restraint.' },
      { value: 1, emoji: '😅', label: '~1 hour', sub: 'Fair enough.' },
      { value: 2, emoji: '😬', label: '2–3 hours', sub: 'We see you.' },
      { value: 4, emoji: '😭', label: "Don't ask 😭", sub: 'We will fix this.' },
    ],
  },
  {
    id: 'study_hours',
    emoji: '📖',
    title: 'Daily study goal?',
    options: [
      { value: 1, emoji: '🌱', label: '1 Hour', sub: 'Just enough.' },
      { value: 2, emoji: '💡', label: '2 Hours', sub: 'Steady progress.' },
      { value: 3, emoji: '🔥', label: '3 Hours', sub: 'Serious student.' },
      { value: 4, emoji: '💪', label: '4+ Hours', sub: 'Grind mode.' },
    ],
  },
  {
    id: 'relaxation_style',
    emoji: '😌',
    title: 'How do you recharge?',
    options: [
      { value: 'music', emoji: '🎵', label: 'Music', sub: 'Plug in, tune out.' },
      { value: 'walk', emoji: '🚶', label: 'Walk', sub: 'Clear the head.' },
      { value: 'coffee', emoji: '☕', label: 'Coffee break', sub: 'Café therapy.' },
      { value: 'nap', emoji: '😴', label: 'Power nap', sub: '20 min reboot.' },
      { value: 'netflix', emoji: '📺', label: 'Netflix / Series', sub: 'One episode only? 😅' },
    ],
  },
  {
    id: 'semester_goal',
    emoji: '🎯',
    title: "What's your semester goal?",
    options: [
      { value: 'cgpa', emoji: '📈', label: 'Improve CGPA', sub: '9+ or bust.' },
      { value: 'internship', emoji: '💼', label: 'Crack an Internship', sub: 'Resume-ready.' },
      { value: 'projects', emoji: '🛠️', label: 'Build Projects', sub: 'Portfolio power.' },
      { value: 'skills', emoji: '🧑‍💻', label: 'Learn New Skills', sub: 'Level up.' },
      { value: 'survive', emoji: '😭', label: 'Just survive', sub: 'One day at a time.' },
    ],
  },
  {
    id: 'deadline_personality',
    emoji: '😅',
    title: 'Your deadline personality?',
    options: [
      { value: 'early', emoji: '✅', label: 'Finish everything early', sub: 'Always prepared.' },
      { value: 'on_time', emoji: '⏰', label: 'Usually on time', sub: 'Reliable.' },
      { value: 'one_day_before', emoji: '😬', label: 'One day before', sub: 'Classic panic mode.' },
      { value: 'procrastinator', emoji: '💀', label: 'Deadline is my motivation', sub: 'Adrenaline junkie.' },
    ],
  },
  {
    id: 'motivation_style',
    emoji: '🎉',
    title: 'How do you want to be motivated?',
    options: [
      { value: 'encourage', emoji: '🤗', label: 'Encourage Me', sub: '"You\'ve got this! 💪"' },
      { value: 'roast', emoji: '🔥', label: 'Roast Me', sub: '"No excuses — study now!"' },
      { value: 'progress', emoji: '📊', label: 'Show Progress', sub: 'Stats and checkpoints.' },
      { value: 'achievements', emoji: '🏆', label: 'Achievements', sub: 'Badges and milestones.' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function LifestyleSetup() {
  const navigate = useNavigate()
  const student = JSON.parse(sessionStorage.getItem('student') || '{}')
  const isHosteller = student.residence !== 'Day Scholar'

  // Filter out travel question for hostellers
  const questions = QUESTIONS.filter(q => !(q.dayScholarOnly && isHosteller))
  const total = questions.length

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    wake_up_time: '06:30',
    sleep_time: '23:00',
    gym_preference: false,
    meal_timings: ['07:30', '13:00', '20:00'],
    travel_time: 30,
    club_activities: [],
  })
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState('forward')

  const q = questions[step]
  const isMulti = q?.multi === true
  const progress = ((step) / total) * 100

  function selectOption(val) {
    if (q.id === '_travel') {
      setAnswers(prev => ({ ...prev, travel_time: val }))
    } else if (isMulti) {
      const current = answers.club_activities || []
      if (val === 'None') {
        setAnswers(prev => ({ ...prev, club_activities: current.includes('None') ? [] : ['None'] }))
      } else {
        const updated = current.includes(val)
          ? current.filter(v => v !== val)
          : [...current.filter(v => v !== 'None'), val]
        setAnswers(prev => ({ ...prev, club_activities: updated }))
      }
    } else {
      setAnswers(prev => ({ ...prev, [q.id]: val }))
    }
  }

  function isSelected(val) {
    if (q.id === '_travel') return answers.travel_time === val
    if (isMulti) return (answers.club_activities || []).includes(val)
    return answers[q.id] === val
  }

  function next() {
    if (step < total - 1) {
      setDirection('forward')
      setStep(s => s + 1)
    } else {
      handleSubmit()
    }
  }

  function back() {
    if (step > 0) {
      setDirection('back')
      setStep(s => s - 1)
    }
  }

  async function handleSubmit() {
    setLoading(true)

    // Derive gym_preference from exercise_type
    const exercise = answers.exercise_type || 'none'
    const payload = {
      ...answers,
      gym_preference: exercise === 'gym',
    }

    try {
      await fetch(`${API}/save-lifestyle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      sessionStorage.setItem('lifestyle', JSON.stringify(payload))
    } catch {
      sessionStorage.setItem('lifestyle', JSON.stringify(payload))
    } finally {
      setLoading(false)
      navigate('/planner')
    }
  }

  const canAdvance = isMulti
    ? (answers.club_activities || []).length > 0
    : q.id === '_travel'
      ? answers.travel_time !== undefined
      : answers[q.id] !== undefined

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Card container */}
      <div style={{ width: '100%', maxWidth: '620px' }}>

        {/* Welcome header (step 0 only) */}
        {step === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Your timetable is ready!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Before I create your <strong>perfect 24-hour schedule</strong>, let me know a little about you 😄
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span>Question {step + 1} of {total}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 99,
              background: 'var(--gradient-primary)',
              width: `${progress}%`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>

        {/* Question card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{q.emoji}</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.3rem' }}>{q.title}</h2>
            {q.subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{q.subtitle}</p>}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: q.options.length <= 3 ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.75rem',
          }}>
            {q.options.map(opt => {
              const selected = isSelected(opt.value)
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => selectOption(opt.value)}
                  style={{
                    border: selected ? '2px solid var(--accent-blue)' : '2px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: selected ? 'rgba(99, 179, 237, 0.1)' : 'var(--bg-surface)',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    transition: 'all 0.18s ease',
                    transform: selected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selected ? '0 0 0 3px rgba(99, 179, 237, 0.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                      {opt.label}
                    </div>
                    {opt.sub && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {opt.sub}
                      </div>
                    )}
                  </div>
                  {selected && <span style={{ marginLeft: 'auto', color: 'var(--accent-blue)', fontSize: '1rem', flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step > 0 && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={back}>
              ← Back
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={next}
            disabled={!canAdvance || loading}
          >
            {loading
              ? <><span className="spinner" /> Generating your plan...</>
              : step === total - 1
                ? '🚀 Generate My Perfect Schedule →'
                : 'Next →'
            }
          </button>
        </div>

      </div>
    </div>
  )
}
