import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const API = 'http://localhost:8000'

export default function StudyAssistant() {
  const [mode, setMode] = useState('general') // 'general' | 'notes'
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  async function handleAsk() {
    if (!query.trim()) return
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${API}/study-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode })
      })
      const data = await res.json()
      setResponse(data.response || 'No response received.')
    } catch {
      setResponse('⚠️ Backend not connected. Start the FastAPI server to use this feature.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file) {
    setUploadedFile(file)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/upload-notes`, { method: 'POST', body: form })
      const data = await res.json()
      setResponse(data.summary || 'Notes uploaded and indexed successfully.')
    } catch {
      setResponse('Notes uploaded locally (backend not connected).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem' }}>
        <div className="page-header">
          <h1>📚 Study Assistant</h1>
          <p>Ask anything about your courses, or upload notes for personalized AI answers.</p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '0.35rem', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)' }}>
          {[{ key: 'general', label: '🌐 General AI' }, { key: 'notes', label: '📄 From My Notes' }].map(m => (
            <button key={m.key} className={`btn btn-sm ${mode === m.key ? 'btn-primary' : 'btn-ghost'}`} style={{ border: 'none' }} onClick={() => setMode(m.key)}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'notes' && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-title">Upload Notes</div>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '2rem', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]) }}>
              <input type="file" accept=".pdf,.txt,.docx" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />
              <div style={{ fontSize: '2rem' }}>📄</div>
              <div style={{ fontWeight: 600 }}>{uploadedFile ? uploadedFile.name : 'Drop your notes here'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>PDF, TXT, DOCX supported</div>
            </label>
          </div>
        )}

        {/* Query Box */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Your Question</label>
            <textarea
              className="textarea"
              placeholder={mode === 'general' ? "e.g. Explain database normalization with examples..." : "e.g. Summarize unit 2 of my uploaded notes..."}
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minHeight: '90px' }}
            />
          </div>
          <button id="study-ask-btn" className="btn btn-primary" onClick={handleAsk} disabled={loading || !query.trim()}>
            {loading ? <><span className="spinner" /> Generating...</> : '🧠 Get Answer'}
          </button>
        </div>

        {/* Response */}
        {response && (
          <div className="card" style={{ borderColor: 'var(--border-active)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.85rem' }}>
              <span>✨</span> AI Response
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{response}</div>
          </div>
        )}

        {/* Quick Topics */}
        {!response && !loading && (
          <div>
            <div className="section-title">💡 Popular Topics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Explain Deadlock', 'SQL Joins', 'ACID Properties', 'Normalization', 'Binary Trees', 'OS Scheduling', 'Network Layers', 'Machine Learning basics'].map(t => (
                <button key={t} className="btn btn-ghost btn-sm" onClick={() => setQuery(`Explain ${t} with examples`)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
