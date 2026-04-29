import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MFASetupPage = () => {
  const [step, setStep] = useState(1); // 1=loading, 2=show QR, 3=verify, 4=done
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/mfa/setup');
      setQrCode(data.qrCode);
      setManualKey(data.manualKey);
      setStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const verifySetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/mfa/verify-setup', { token });
      setBackupCodes(data.backupCodes);
      setStep(4);
      toast.success('MFA enabled! 🔐');
    } catch { toast.error('Invalid code. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="card fade-in" style={{ maxWidth: 440, width: '100%' }}>
        {step === 1 && (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>🔐 Enable MFA</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Add an extra layer of security with Google Authenticator or Authy.
            </p>
            <button className="btn btn-primary btn-full" onClick={startSetup} disabled={loading}>
              {loading ? 'Generating...' : 'Set Up MFA →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>📱 Scan QR Code</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Open Google Authenticator, tap +, then scan this code:
            </p>
            {qrCode && (
              <div className="qr-container" style={{ textAlign: 'center' }}>
                <img src={qrCode} alt="MFA QR Code" style={{ width: 180, height: 180 }} />
              </div>
            )}
            <details style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <summary style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Can't scan? Enter key manually</summary>
              <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 8, fontSize: '0.8rem', wordBreak: 'break-all', color: '#a78bfa' }}>
                {manualKey}
              </code>
            </details>
            <button className="btn btn-primary btn-full" onClick={() => setStep(3)}>
              I've Scanned It →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>✓ Verify Code</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Enter the 6-digit code from your authenticator app:
            </p>
            <form onSubmit={verifySetup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="form-input otp-input" maxLength={6} placeholder="000000"
                value={token} onChange={e => setToken(e.target.value.replace(/\D/, ''))} autoFocus required />
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || token.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h2>MFA Enabled!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Save these backup codes. You'll need them if you lose your phone.
              </p>
            </div>
            <div className="backup-codes">
              {backupCodes.map(c => <div key={c} className="backup-code">{c}</div>)}
            </div>
            <button className="btn btn-primary btn-full mt-2" onClick={() => navigate('/dashboard')}>
              Go to Dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MFASetupPage;
