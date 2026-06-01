import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import SettingsModal from './SettingsModal';

const NavBar = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to={isAuthenticated ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
        <span className="nav-logo">✦ TodoPro</span>
      </Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {user?.name} · <span style={{ color: '#a78bfa' }}>{user?.plan}</span>
            </span>
            <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
            <Link to="/analytics" className="btn btn-outline btn-sm">📊 Analytics</Link>
            <Link to="/pricing" className="btn btn-outline btn-sm">Upgrade</Link>
            <button onClick={() => setShowSettings(true)} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚙️ Settings
            </button>
            <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </nav>
  );
};

export default NavBar;
