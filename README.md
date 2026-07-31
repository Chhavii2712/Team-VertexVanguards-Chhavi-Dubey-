# StudyLoop 🚀

StudyLoop is a next-generation, AI-powered academic companion designed specifically for engineering students. By combining Optical Character Recognition (OCR), intelligent scheduling algorithms, and a powerful Large Language Model (LLM) engine, StudyLoop acts as your ultimate personalized tutor, planner, and curriculum manager.

## 🌟 Key Features

StudyLoop is packed with **18+ comprehensive study features**, heavily powered by Google's Gemini LLM:

### 🤖 The AI Study Assistant (Dual-Mode RAG)
Upload your course materials (PDF, DOCX, PPTX, TXT) and let StudyLoop do the heavy lifting:
- **Smart Summarization:** Get executive summaries, chapter breakdowns, or bullet-point notes.
- **Exam Preparation:** Automatically extract the top 5-10 most important topics for CAT/FAT exams.
- **Interactive Quizzes & Flashcards:** Instantly generate MCQs and revision flashcards from your notes.
- **Adaptive Explanations:** Ask the AI to explain complex topics like you're a beginner (ELI5), or focus strictly on exam relevance and marking schemes.
- **Targeted Retrieval:** Ask questions about specific pages or presentation slides.
- **Resource Recommendations:** Get curated YouTube topics, official documentation links, and practice question areas.

### 📅 Intelligent Daily Planner
- **Automated Scheduling:** Blends your fixed college timetable with your personal study goals and impending deadlines.
- **Lifestyle Aware:** Configures study blocks based on your personal habits (e.g., Early Bird vs. Night Owl).
- **Conflict-Free:** Maps course curriculum slots dynamically to ensure your schedule actually works.

### 🪪 Smart Onboarding via OCR
- **ID Card Scanning:** Upload a photo of your student ID and let our local OCR engine instantly extract your Name, Registration Number, Branch, and Semester.

### 💬 Interactive Chat
- A persistent, context-aware chat interface to talk to your personalized academic tutor.

---

## 🏗️ Architecture & Tech Stack

StudyLoop is built with a modern, high-performance tech stack:

- **Frontend:** React, Vite, TailwindCSS (Dynamic & responsive UI)
- **Backend:** Python, FastAPI (High-performance async server)
- **AI / LLM Engine:** Google Gemini (Currently powered by the blazing fast `gemini-3.5-flash` model)
- **LLM Wrapper:** A custom `GeminiKeyManager` that handles round-robin multi-key rotation, automatic failover, and thread-safe concurrency.
- **Document Parsing:** PyMuPDF (fitz) and native XML parsers for DOCX/PPTX.

## 📂 Project Structure

- `/backend` - The FastAPI server. Contains the `agents/` (Planner, Study, Chat), `ocr/`, `scheduler/`, and `services/` (Key Manager).
- `/frontend` - The React application featuring a dynamic Dashboard, Timetable, Study Assistant, and Setup Wizards.
- `/curriculum` & `/data` - Contains JSON data mappings for courses, slot timings, and university curriculum structures.

---

## ⚙️ Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   ```bash
   .\venv\Scripts\Activate.ps1   # On Windows
   source venv/bin/activate       # On Mac/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## 🔑 Environment Variables

To activate the AI features, you must configure your `.env` file in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```
StudyLoop supports multi-key failover! Add up to 4 Gemini API keys:
```env
GEMINI_API_KEY_1="your_key_here"
GEMINI_API_KEY_2="your_key_here"
```
Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
