import { Navigate, useLocation } from 'react-router-dom';
import { isAdminUser, useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

export function AuthLoading() {
  return (
    <div className="auth-guard-loading">
      <div className="auth-spinner" />
      <span>Đang kiểm tra quyền truy cập...</span>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (user) {
    return <Navigate to={isAdminUser(user) ? '/admin' : '/'} replace />;
  }
  return children;
}
