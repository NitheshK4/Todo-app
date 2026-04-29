import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import TodoCard from '../components/TodoCard';
import TodoModal from '../components/TodoModal';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const FILTERS = ['all', 'pending', 'in_progress', 'completed'];

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTodos = async () => {
    try {
      const { data } = await api.get('/todos');
      setTodos(data.todos);
    } catch { toast.error('Failed to load todos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTodos(); }, []);

  const filtered = todos.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,
    pending: todos.filter(t => t.status === 'pending').length,
    urgent: todos.filter(t => t.priority === 'urgent').length,
  };

  return (
    <div className="page">
      <NavBar />
      <div className="dashboard">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2>Good day, {user?.name?.split(' ')[0]} 👋</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              🔒 All your todos are AES-256 encrypted
            </p>
          </div>
          <button id="create-todo-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Todo
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: stats.total, color: '#7c3aed' },
            { label: 'Completed', value: stats.completed, color: '#10b981' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Urgent', value: stats.urgent, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Search todos..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          <div className="filters">
            {FILTERS.map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Banner */}
        {user?.plan === 'free' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <strong>You're on the Free plan</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>Upgrade for unlimited todos, priority support & more.</p>
            </div>
            <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade ✦</Link>
          </div>
        )}

        {/* MFA Banner */}
        {!user?.mfaEnabled && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '0.75rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem' }}>⚠️ Secure your account with <strong>2FA / MFA</strong></span>
            <Link to="/mfa-setup" className="btn btn-outline btn-sm">Enable MFA</Link>
          </div>
        )}

        {/* Todos */}
        {loading ? (
          <div className="center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your encrypted todos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="center" style={{ padding: '4rem', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem' }}>📝</div>
            <p>{search ? 'No todos match your search' : 'No todos yet. Create your first one!'}</p>
            {!search && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Todo</button>}
          </div>
        ) : (
          <div className="todo-grid">
            {filtered.map(todo => (
              <TodoCard key={todo.id} todo={todo}
                onUpdated={updated => setTodos(ts => ts.map(t => t.id === updated.id ? updated : t))}
                onDeleted={id => setTodos(ts => ts.filter(t => t.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TodoModal onClose={() => setShowModal(false)} onCreated={todo => setTodos(ts => [todo, ...ts])} />
      )}
    </div>
  );
};

export default DashboardPage;
