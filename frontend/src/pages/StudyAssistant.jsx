import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'

const API = 'http://127.0.0.1:8000'

export default function StudyAssistant() {
  // Navigation & Mode State
  const [activeTab, setActiveTab] = useState('tutor') // 'tutor' | 'summaries' | 'examprep' | 'flashcards' | 'recommendations'
  const [mode, setMode] = useState('general') // 'general' | 'notes'
  const [simplicityLevel, setSimplicityLevel] = useState('standard') // 'standard' | 'beginner' | 'exam'
  
  // Q&A State
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileSummary, setFileSummary] = useState(null)

  // Smart Summaries State
  const [summaryStyle, setSummaryStyle] = useState('short')
  const [summaryResult, setSummaryResult] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Exam Topics & Quiz State
  const [topicsResult, setTopicsResult] = useState(null)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [quizList, setQuizList] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  // Flashcards State
  const [flashcards, setFlashcards] = useState([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [flippedCards, setFlippedCards] = useState({})

  // Recommendations State
  const [recommendationResult, setRecommendationResult] = useState(null)
  const [recsLoading, setRecsLoading] = useState(false)
  const [recTopic, setRecTopic] = useState('')

  // Context Integration State
  const [contextData, setContextData] = useState(null)

  // Load Session Context on mount
  useEffect(() => {
    fetch(`${API}/study-context`)
      .then(res => res.json())
      .then(data => {
        setContextData(data)
        if (data.has_notes) {
          setMode('notes')
          if (data.filename) setUploadedFile({ name: data.filename })
        }
      })
      .catch(() => {})

    // Check if redirect query was passed from deadlines page
    const studyQuery = sessionStorage.getItem('studyQuery')
    if (studyQuery) {
      setQuery(studyQuery)
      setRecTopic(studyQuery)
      setActiveTab('recommendations')
      sessionStorage.removeItem('studyQuery')
      setRecsLoading(true)
      fetch(`${API}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: studyQuery })
      })
      .then(res => res.json())
      .then(data => {
        setRecommendationResult(data.recommendations)
        setRecsLoading(false)
      })
      .catch(() => {
        setRecommendationResult('⚠️ Error connecting to server.')
        setRecsLoading(false)
      })
    }
  }, [])

  // File Upload Handler
  async function handleUpload(file) {
    if (!file) return
    setUploadedFile(file)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/upload-notes`, { method: 'POST', body: form })
      const data = await res.json()
      setFileSummary(data.summary || 'Notes uploaded and indexed successfully.')
      setResponse(data.summary || 'Notes uploaded and indexed successfully.')
      setMode('notes')
    } catch {
      setResponse('Notes uploaded locally (backend not connected).')
    } finally {
      setLoading(false)
    }
  }

  // Ask Tutor Handler
  async function handleAsk() {
    if (!query.trim()) return
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${API}/study-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode, level: simplicityLevel })
      })
      const data = await res.json()
      setResponse(data.response || 'No response received.')
    } catch {
      setResponse('⚠️ Backend error or server not connected.')
    } finally {
      setLoading(false)
    }
  }

  // Generate Smart Summaries
  async function handleGenerateSummary(style) {
    setSummaryStyle(style)
    setSummaryLoading(true)
    setSummaryResult(null)
    try {
      const res = await fetch(`${API}/study-summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style })
      })
      const data = await res.json()
      if (res.status !== 200) {
        setSummaryResult(`⚠️ ${data.detail || 'Upload notes first.'}`)
      } else {
        setSummaryResult(data.summary)
      }
    } catch {
      setSummaryResult('⚠️ Error connecting to server.')
    } finally {
      setSummaryLoading(false)
    }
  }

  // Generate Exam Topics
  async function handleFetchTopics() {
    setTopicsLoading(true)
    setTopicsResult(null)
    try {
      const res = await fetch(`${API}/study-topics`, { method: 'POST' })
      const data = await res.json()
      if (res.status !== 200) {
        setTopicsResult(`⚠️ ${data.detail || 'Upload notes first to extract exam topics.'}`)
      } else {
        setTopicsResult(data.topics)
      }
    } catch {
      setTopicsResult('⚠️ Error connecting to server.')
    } finally {
      setTopicsLoading(false)
    }
  }

  // Generate MCQ Quiz
  async function handleGenerateQuiz() {
    setQuizLoading(true)
    setQuizList([])
    setQuizAnswers({})
    setQuizSubmitted(false)
    try {
      const res = await fetch(`${API}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_questions: 5 })
      })
      const data = await res.json()
      if (res.status !== 200) {
        alert(data.detail || 'Please upload notes first.')
      } else {
        setQuizList(data.quiz || [])
      }
    } catch {
      alert('Error connecting to server.')
    } finally {
      setQuizLoading(false)
    }
  }

  function handleSelectQuizOption(qIdx, optionLetter) {
    if (quizSubmitted) return
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optionLetter }))
  }

  function handleSubmitQuiz() {
    let score = 0
    quizList.forEach((q, idx) => {
      const userChoice = quizAnswers[idx]
      // Match option letter prefix like "B" with "B. ..."
      if (userChoice && q.answer && userChoice.trim().toUpperCase() === q.answer.trim().toUpperCase()) {
        score += 1
      }
    })
    setQuizScore(score)
    setQuizSubmitted(true)
  }

  // Generate Flashcards
  async function handleGenerateFlashcards() {
    setCardsLoading(true)
    setFlashcards([])
    setFlippedCards({})
    try {
      const res = await fetch(`${API}/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 6 })
      })
      const data = await res.json()
      if (res.status !== 200) {
        alert(data.detail || 'Please upload notes first.')
      } else {
        setFlashcards(data.flashcards || [])
      }
    } finally {
      setCardsLoading(false)
    }
  }

  function toggleCardFlip(idx) {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  // Generate Resource Recommendations
  async function handleFetchRecommendations() {
    setRecsLoading(true)
    setRecommendationResult(null)
    try {
      const res = await fetch(`${API}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: recTopic })
      })
      const data = await res.json()
      setRecommendationResult(data.recommendations)
    } catch {
      setRecommendationResult('⚠️ Error connecting to server.')
    } finally {
      setRecsLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ padding: '2rem' }}>
        
        {/* Top Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>📖 Study Agent — AI Academic Tutor</h1>
            <p>Master concepts, generate quizzes, build flashcards, and revise uploaded course material.</p>
          </div>

          {contextData?.student?.branch_code && (
            <div style={{ background: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
              🎯 Specialization: <strong>{contextData.student.branch_code}</strong>
            </div>
          )}
        </div>

        {/* Feature Tabs Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'tutor', label: '🧠 AI Tutor & Q&A' },
            { id: 'summaries', label: '📑 Smart Summaries' },
            { id: 'examprep', label: '🎯 CAT/FAT Topics & Quiz' },
            { id: 'flashcards', label: '🎴 Flashcards' },
            { id: 'recommendations', label: '🎥 Recommendations' },
          ].map(t => (
            <button
              key={t.id}
              className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(t.id)}
              style={{ borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: AI TUTOR & Q&A */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'tutor' && (
          <div>
            {/* Mode & Simplicity Controls Bar */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Study Mode</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn btn-sm ${mode === 'general' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('general')}>
                    🌐 General AI
                  </button>
                  <button className={`btn btn-sm ${mode === 'notes' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('notes')}>
                    📄 Uploaded Notes ({uploadedFile ? uploadedFile.name : 'No file'})
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Simplicity / Tone</div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { key: 'standard', label: 'Standard' },
                    { key: 'beginner', label: '🐣 Beginner (ELI5)' },
                    { key: 'exam', label: '📝 Exam-Focused' }
                  ].map(lvl => (
                    <button
                      key={lvl.key}
                      className={`btn btn-sm ${simplicityLevel === lvl.key ? 'btn-outline' : 'btn-ghost'}`}
                      style={{ borderColor: simplicityLevel === lvl.key ? 'var(--accent-blue)' : undefined, fontSize: '0.8rem' }}
                      onClick={() => setSimplicityLevel(lvl.key)}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Upload Area if mode is notes */}
            {mode === 'notes' && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="section-title">Upload Course Material</div>
                <label
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
                    padding: '1.5rem', cursor: 'pointer', textAlign: 'center'
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]) }}
                >
                  <input type="file" accept=".pdf,.txt,.docx,.pptx,.ppt,.doc" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />
                  <div style={{ fontSize: '1.8rem' }}>📄</div>
                  <div style={{ fontWeight: 600 }}>{uploadedFile ? uploadedFile.name : 'Click to select or drop PDF, PPTX, DOCX, TXT'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Indexes slides and pages automatically for targeted explanations</div>
                </label>

                {fileSummary && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <strong>📑 Material Taxonomy Overview:</strong>
                    <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{fileSummary}</div>
                  </div>
                )}
              </div>
            )}

            {/* Query Box */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label">Ask Your Academic Question</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try: "Explain Slide 12", "What is SQL?", "Difference between TCP and UDP"</span>
                </div>
                <textarea
                  className="textarea"
                  placeholder={mode === 'general' ? "e.g. Explain Deadlock conditions with real-world analogy..." : "e.g. Explain Slide 5 of my uploaded presentation or summarize ACID properties..."}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ minHeight: '90px' }}
                />
              </div>

              {/* Page / Slide quick helper chips */}
              {mode === 'notes' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Targets:</span>
                  {['Explain Slide 1', 'Explain Slide 5', 'Explain Slide 12', 'Explain Page 2'].map(chip => (
                    <button key={chip} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => setQuery(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              <button id="study-ask-btn" className="btn btn-primary" onClick={handleAsk} disabled={loading || !query.trim()}>
                {loading ? <><span className="spinner" /> AI Thinking...</> : '💡 Get Comprehensive Answer'}
              </button>
            </div>

            {/* AI Response Output */}
            {response && (
              <div className="card" style={{ borderColor: 'var(--border-active)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                    <span>✨</span> Tutor Explanation ({simplicityLevel.toUpperCase()})
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(response)}>📋 Copy</button>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>{response}</div>
              </div>
            )}

            {/* Quick Popular Topics */}
            {!response && !loading && (
              <div style={{ marginTop: '1rem' }}>
                <div className="section-title">💡 Popular Study Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Explain Deadlock', 'SQL Joins & Normalization', 'ACID Properties', 'Binary Search Trees', 'OS CPU Scheduling', 'TCP vs UDP', 'Heap Sort', 'Recursion vs Iteration'].map(t => (
                    <button key={t} className="btn btn-ghost btn-sm" onClick={() => setQuery(`Explain ${t} in detail`)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: SMART SUMMARIES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'summaries' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="section-title">⚡ Smart Summarization Engine</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Don't have time to read 100 slides before class or CAT exams? Generate condensed notes instantly.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { style: 'short', title: '⏱️ Short Summary', desc: '5–10 lines high-level overview before class' },
                  { style: 'detailed', title: '📖 Detailed Breakdown', desc: 'Chapter-by-chapter / section breakdown' },
                  { style: 'bullet', title: '📌 Bullet Key Notes', desc: 'Important definitions & core takeaways' },
                  { style: 'revision', title: '⚡ 2-Page Cheat Sheet', desc: 'Exam revision cheat-sheet for 1 day before' },
                ].map(item => (
                  <div
                    key={item.style}
                    style={{
                      padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                      cursor: 'pointer', background: summaryStyle === item.style ? 'var(--bg-surface)' : 'transparent',
                      borderColor: summaryStyle === item.style ? 'var(--accent-blue)' : 'var(--border)'
                    }}
                    onClick={() => handleGenerateSummary(item.style)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" onClick={() => handleGenerateSummary(summaryStyle)} disabled={summaryLoading}>
                {summaryLoading ? <><span className="spinner" /> Generating Summary...</> : `🚀 Generate ${summaryStyle.toUpperCase()} Summary`}
              </button>
            </div>

            {summaryResult && (
              <div className="card" style={{ borderColor: 'var(--border-active)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-blue)' }}>
                  📑 {summaryStyle.toUpperCase()} SUMMARY RESULT
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {summaryResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: CAT/FAT TOPICS & QUIZ GENERATOR */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'examprep' && (
          <div>
            {/* Top Bar Buttons */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleFetchTopics} disabled={topicsLoading}>
                {topicsLoading ? <><span className="spinner" /> Extracting...</> : '🔥 Extract Top CAT / FAT Exam Topics'}
              </button>

              <button className="btn btn-secondary" onClick={handleGenerateQuiz} disabled={quizLoading}>
                {quizLoading ? <><span className="spinner" /> Building Quiz...</> : '📝 Generate 5-Question MCQ Quiz'}
              </button>
            </div>

            {/* Exam Topics Result */}
            {topicsResult && (
              <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-active)' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
                  🎯 Most Important Exam Topics (CAT / FAT Prep)
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {topicsResult}
                </div>
              </div>
            )}

            {/* MCQ Quiz Section */}
            {quizList.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="section-title" style={{ margin: 0 }}>📝 MCQ Assessment Quiz ({quizList.length} Questions)</div>
                  {quizSubmitted && (
                    <div style={{ padding: '0.35rem 0.85rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--accent-blue)', border: '1px solid var(--border)' }}>
                      Score: {quizScore} / {quizList.length} ({(quizScore / quizList.length * 100).toFixed(0)}%)
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {quizList.map((q, idx) => (
                    <div key={idx} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                        Q{idx + 1}. {q.question}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const optionLetter = opt.substring(0, 1).toUpperCase()
                          const isSelected = quizAnswers[idx] === optionLetter
                          const isCorrect = q.answer && q.answer.toUpperCase().includes(optionLetter)

                          let bgColor = 'transparent'
                          let borderColor = 'var(--border)'

                          if (quizSubmitted) {
                            if (isCorrect) {
                              bgColor = 'rgba(16, 185, 129, 0.15)'
                              borderColor = '#10b981'
                            } else if (isSelected && !isCorrect) {
                              bgColor = 'rgba(239, 68, 68, 0.15)'
                              borderColor = '#ef4444'
                            }
                          } else if (isSelected) {
                            borderColor = 'var(--accent-blue)'
                            bgColor = 'rgba(59, 130, 246, 0.1)'
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizOption(idx, optionLetter)}
                              style={{
                                textAlign: 'left', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${borderColor}`, background: bgColor, cursor: quizSubmitted ? 'default' : 'pointer',
                                color: 'var(--text-primary)', fontSize: '0.88rem', transition: 'all 0.15s'
                              }}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button className="btn btn-primary" onClick={handleSubmitQuiz} style={{ marginTop: '1.5rem' }}>
                    ✅ Submit Quiz & View Score
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={handleGenerateQuiz} style={{ marginTop: '1.5rem' }}>
                    🔄 Retake New Quiz
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 4: FLASHCARDS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'flashcards' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="section-title" style={{ margin: 0 }}>🎴 Concept Revision Flashcards</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click cards to flip between Front (Question) and Back (Answer)</div>
              </div>
              <button className="btn btn-primary" onClick={handleGenerateFlashcards} disabled={cardsLoading}>
                {cardsLoading ? <><span className="spinner" /> Generating...</> : '🎴 Generate Flashcards'}
              </button>
            </div>

            {flashcards.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {flashcards.map((card, idx) => {
                  const isFlipped = flippedCards[idx]
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCardFlip(idx)}
                      style={{
                        minHeight: '180px', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)', cursor: 'pointer', display: 'flex',
                        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        textAlign: 'center', background: isFlipped ? 'var(--bg-surface)' : 'var(--bg-card)',
                        borderColor: isFlipped ? 'var(--accent-blue)' : 'var(--border)',
                        transition: 'transform 0.2s, background 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        {isFlipped ? '💡 ANSWER / BACK' : '❓ CONCEPT / FRONT'}
                      </div>
                      <div style={{ fontWeight: isFlipped ? 500 : 700, fontSize: '0.95rem', color: isFlipped ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.5 }}>
                        {isFlipped ? card.back : card.front}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', marginTop: '1rem' }}>
                        (Click to flip 🔄)
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Click <strong>"Generate Flashcards"</strong> to create interactive memory revision cards from your notes.
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 5: RESOURCE RECOMMENDATIONS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'recommendations' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="section-title">🎥 AI Resource & Practice Recommender</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Suggests high-yield YouTube search topics, standard textbook chapters, official docs, and practice question focus areas.
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Subject / Topic Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. DBMS Normalization, Operating System Deadlocks, Machine Learning..."
                  value={recTopic}
                  onChange={e => setRecTopic(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={handleFetchRecommendations} disabled={recsLoading || !recTopic.trim()}>
                {recsLoading ? <><span className="spinner" /> Searching Recommendations...</> : '🔍 Get Recommended Resources'}
              </button>
            </div>

            {recommendationResult && (
              <div className="card" style={{ borderColor: 'var(--border-active)' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
                  📌 Recommended Learning Resources for "{recTopic}"
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {recommendationResult}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
