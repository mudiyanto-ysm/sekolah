import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Membungkus halaman yang butuh login.
 * Jika `allowedRoles` diisi, hanya role tersebut yang boleh mengakses.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Memuat...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
