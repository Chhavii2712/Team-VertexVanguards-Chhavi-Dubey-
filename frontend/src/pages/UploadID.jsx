import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'

const STEPS = ['Upload ID', 'Select Courses', 'Choose Slots', 'Timetable', 'Lifestyle', 'Dashboard']

export default function UploadID() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleFile(f) {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  async function handleScan() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/scan-id`, { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      // Save to session storage for other pages
      sessionStorage.setItem('student', JSON.stringify(data))
    } catch {
      setError('Could not connect to backend. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    navigate('/course-selection')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        {/* Step bar */}
        <div className="step-bar" style={{ marginBottom: '2.5rem' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div className={`step ${i === 0 ? 'active' : ''}`}>
                <div className="step-circle">{i === 0 ? '1' : i + 1}</div>
                <span className="step-label" style={{ display: i === 0 ? 'block' : 'none' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="step-connector" style={{ flex: 1 }} />}
            </div>
          ))}
        </div>

        <div className="page-header">
          <h1>Scan Your ID Card</h1>
          <p>Upload your college ID. Our OCR engine will automatically extract your details.</p>
        </div>

        {/* Upload Zone */}
        <div
          className={`card ${dragging ? 'card-hover' : ''}`}
          style={{ border: `2px dashed ${dragging ? 'var(--accent-blue)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'center', padding: '2.5rem', marginBottom: '1.25rem', transition: 'all 0.2s', background: dragging ? 'rgba(59,130,246,0.05)' : 'var(--bg-card)' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          {preview ? (
            <img src={preview} alt="ID Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪪</div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Drop your ID card here</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>or click to browse — JPG, PNG supported</div>
            </>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'var(--accent-green)', background: 'rgba(16,185,129,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-green)', fontWeight: 700 }}>
              <span>✓</span> ID Scanned Successfully
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Name', value: result.name || '—' },
                { label: 'Registration', value: result.registration || '—' },
                { label: 'Branch', value: result.branch || '—' },
                { label: 'Joining Year', value: result.joining_year || result.joiningYear || '—' },
                { label: 'Type', value: result.residence || result.studentType || '—' },
                { label: 'Year of Study', value: result.current_year_of_study ? `Year ${result.current_year_of_study}` : '—' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.9rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!result ? (
            <button className="btn btn-primary" id="scan-id-btn" style={{ flex: 1 }} onClick={handleScan} disabled={!file || loading}>
              {loading ? <><span className="spinner" /> Scanning...</> : '🔍 Scan ID'}
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleContinue}>
              Continue to Course Selection →
            </button>
          )}
          {file && !result && (
            <button className="btn btn-ghost" onClick={() => { setFile(null); setPreview(null) }}>Clear</button>
          )}
        </div>
      </div>
    </div>
  )
}
