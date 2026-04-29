import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) return (
    <div className="center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
    </div>
  );

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
