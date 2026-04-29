import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.mfaRequired) {
        localStorage.setItem('mfaTempToken', data.tempToken);
        toast('Enter your MFA code 🔐');
        navigate('/mfa-verify');
      } else {
        login(data.user, data.accessToken, data.refreshToken);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const googleLogin = () => {
    window.location.href = `${window.location.origin.replace('3000','5000')}/api/auth/oauth/google`;
  };

  return (
    <div className="auth-page">
      <div className="card auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✦</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your TodoPro account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="login-email" className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '🔐 Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="divider-text" style={{ margin: '1.25rem 0' }}>or continue with</div>

        <button className="btn btn-google btn-full" onClick={googleLogin}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} />
          Sign in with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" className="auth-link">Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
