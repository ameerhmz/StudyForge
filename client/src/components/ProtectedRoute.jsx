import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children, requireTeacher = false }) {
  const { isAuthenticated, isCheckingAuth, user } = useAuthStore();

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireTeacher && user?.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
