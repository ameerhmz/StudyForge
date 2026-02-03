import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import StudyRoom from './pages/StudyRoom'
import TopicStudy from './pages/TopicStudy'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDetailView from './pages/StudentDetailView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subject/:subjectId" element={<StudyRoom />} />
        <Route path="/subject/:subjectId/topic/:topicId" element={<TopicStudy />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/student/:studentId" element={<StudentDetailView />} />
        {/* Legacy route for backward compatibility */}
        <Route path="/study/:documentId" element={<StudyRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
