import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StudyProvider } from './context/StudyContext'
import Landing from './pages/Landing'
import UploadID from './pages/UploadID'
import CourseSelection from './pages/CourseSelection'
import SlotSelection from './pages/SlotSelection'
import Timetable from './pages/Timetable'
import LifestyleSetup from './pages/LifestyleSetup'
import Dashboard from './pages/Dashboard'
import DailyPlanner from './pages/DailyPlanner'
import Deadlines from './pages/Deadlines'
import StudyAssistant from './pages/StudyAssistant'
import Chat from './pages/Chat'
import './index.css'

function App() {
  return (
    <StudyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload-id" element={<UploadID />} />
          <Route path="/course-selection" element={<CourseSelection />} />
          <Route path="/slot-selection" element={<SlotSelection />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/lifestyle" element={<LifestyleSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<DailyPlanner />} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="/study" element={<StudyAssistant />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </StudyProvider>
  )
}

export default App
