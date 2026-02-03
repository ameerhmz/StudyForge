import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children, requireTeacher = false }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireTeacher && user?.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
