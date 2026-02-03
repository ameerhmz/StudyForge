import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import StudyRoom from './pages/StudyRoom';
import TopicStudy from './pages/TopicStudy';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDetailView from './pages/StudentDetailView';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'sonner';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth(); // Check authentication on app load
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject/:subjectId"
          element={
            <ProtectedRoute>
              <StudyRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject/:subjectId/topic/:topicId"
          element={
            <ProtectedRoute>
              <TopicStudy />
            </ProtectedRoute>
          }
        />

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Teacher-only Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requireTeacher>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/student/:studentId"
          element={
            <ProtectedRoute requireTeacher>
              <StudentDetailView />
            </ProtectedRoute>
          }
        />

        {/* Legacy route for backward compatibility */}
        <Route
          path="/study/:documentId"
          element={
            <ProtectedRoute>
              <StudyRoom />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
