import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const MFAVerifyPage = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleVerify = async (e) => {
    e.preventDefault();
    const tempToken = localStorage.getItem('mfaTempToken');
    if (!tempToken) return navigate('/login');
    setLoading(true);
    try {
      const { data } = await api.post('/mfa/verify-login', { token }, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      localStorage.removeItem('mfaTempToken');
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome, ${data.user.name}! 🔐`);
      navigate('/dashboard');
    } catch { toast.error('Invalid code. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="card fade-in" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
        <h2 style={{ marginBottom: '0.25rem' }}>Two-Factor Authentication</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          Enter the 6-digit code from your Google Authenticator app
        </p>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input className="form-input otp-input" maxLength={6} placeholder="000000"
            value={token} onChange={e => setToken(e.target.value.replace(/\D/, ''))}
            autoFocus required />
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || token.length !== 6}>
            {loading ? 'Verifying...' : 'Verify →'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Can also use a backup code
        </p>
        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.85rem' }}
          onClick={() => navigate('/login')}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default MFAVerifyPage;
