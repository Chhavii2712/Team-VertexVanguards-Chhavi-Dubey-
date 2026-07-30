const API_BASE_URL = 'http://localhost:8000/api';

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error (${url}):`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => fetchJson(`${API_BASE_URL}/health`),

  // Module 1: ID Reader / OCR
  scanID: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson(`${API_BASE_URL}/scan-id`, {
      method: 'POST',
      body: formData,
    });
  },

  // Module 2: Curriculum Service
  getCurriculum: (branchCode) => fetchJson(`${API_BASE_URL}/curriculum/${branchCode}`),

  // Module 3: Timetable Generator
  generateTimetable: (data) => fetchJson(`${API_BASE_URL}/generate-timetable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  saveTimetable: (timetable) => fetchJson(`${API_BASE_URL}/save-timetable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timetable),
  }),

  // Module 4: Lifestyle Setup
  saveLifestyle: (lifestyleData) => fetchJson(`${API_BASE_URL}/save-lifestyle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lifestyleData),
  }),

  // Module 5 & 7: Daily Planner Agent
  generateDailyPlan: (data = {}) => fetchJson(`${API_BASE_URL}/generate-daily-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  replan: () => fetchJson(`${API_BASE_URL}/replan`, {
    method: 'POST',
  }),

  // Module 6: Deadline Agent
  getDeadlines: () => fetchJson(`${API_BASE_URL}/deadlines`),
  addDeadline: (deadline) => fetchJson(`${API_BASE_URL}/deadlines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deadline),
  }),

  // Module 8: Study Assistant
  uploadNotes: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson(`${API_BASE_URL}/upload-notes`, {
      method: 'POST',
      body: formData,
    });
  },
  askStudyAssistant: (query, mode = 'general') => fetchJson(`${API_BASE_URL}/study-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode }),
  }),
  generateQuiz: (numQuestions = 5) => fetchJson(`${API_BASE_URL}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_questions: numQuestions }),
  }),

  // Module 9: AI Chat
  sendChatMessage: (message, history = []) => fetchJson(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  }),

  // Dashboard
  getDashboardData: () => fetchJson(`${API_BASE_URL}/dashboard`),
};

export default api;
