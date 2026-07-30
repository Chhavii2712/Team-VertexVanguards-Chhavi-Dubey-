import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Hero badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '100px', padding: '0.35rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 6px var(--accent-blue)', display: 'inline-block' }} />
        AI-Powered Academic Planner
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, marginBottom: '1.25rem', maxWidth: '800px' }}>
        Study Smarter,<br />
        <span className="text-gradient">Plan Better.</span>
      </h1>

      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '520px', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.7 }}>
        StudyLoop scans your ID card, builds your personalized curriculum, generates your FFCS timetable, and creates a 24-hour study routine — all powered by AI.
      </p>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
        <button className="btn btn-primary btn-lg" id="get-started-btn" onClick={() => navigate('/upload-id')}>
          Get Started →
        </button>
        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/dashboard')}>
          View Dashboard
        </button>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '🪪', text: 'ID Card OCR' },
          { icon: '📅', text: 'FFCS Generator' },
          { icon: '🧠', text: 'AI Planner' },
          { icon: '📚', text: 'Study Assistant' },
          { icon: '💬', text: 'Chat Agent' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {f.icon} {f.text}
          </div>
        ))}
      </div>
    </div>
  )
}
