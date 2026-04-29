import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MFASetupPage from './pages/MFASetupPage';
import MFAVerifyPage from './pages/MFAVerifyPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';

// Handles redirect after Google OAuth
const OAuthCallback = () => {
  const [params] = useSearchParams();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      // Fetch user info then store
      import('./api/axios').then(({ default: api }) => {
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        api.get('/auth/me').then(({ data }) => {
          login(data.user, accessToken, refreshToken);
          navigate('/dashboard');
        });
      });
    } else {
      navigate('/login');
    }
  }, []);

  return <div className="center" style={{ minHeight: '100vh' }}>Signing you in...</div>;
};

const App = () => {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mfa-verify" element={<MFAVerifyPage />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/mfa-setup" element={<ProtectedRoute><MFASetupPage /></ProtectedRoute>} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
