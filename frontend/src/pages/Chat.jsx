import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const API = 'http://127.0.0.1:8000'

const INITIAL_MESSAGES = [
  { role: 'assistant', text: "Hi! I'm your StudyLoop AI assistant 👋 I can help you plan your day, answer study questions, track deadlines, or explain any topic. What would you like to do?" }
]

const SUGGESTIONS = [
  'Plan my day for tomorrow',
  'I have a DBMS exam in 3 days',
  'Explain database normalization',
  'Show my timetable',
]

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.response || 'I am working on that...' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Backend not connected. Please start the FastAPI server.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Chat Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700 }}>StudyLoop AI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span className="glow-dot" />Online</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" /> Thinking...
              </div>
            </div>
          )}

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="btn btn-ghost btn-sm" onClick={() => { setInput(s) }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <input
            className="input"
            id="chat-input"
            style={{ borderRadius: '12px' }}
            placeholder="Ask anything — plan my day, explain SQL, check deadlines..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button className="btn btn-primary btn-icon" id="chat-send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>→</button>
        </div>
      </div>
    </div>
  )
}
