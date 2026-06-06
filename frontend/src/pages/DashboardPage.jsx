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
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const fetchTodos = async () => {
    try {
      const { data } = await api.get('/todos', {
        params: { sortBy, sortOrder }
      });
      setTodos(data.todos);
    } catch { toast.error('Failed to load todos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTodos(); }, [sortBy, sortOrder]);

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

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (filtered.length > 0 && selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(t => t.id));
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/todos/bulk-update', { ids: selectedIds, status });
      setTodos(ts => ts.map(t => selectedIds.includes(t.id) ? { ...t, status } : t));
      setSelectedIds([]);
      toast.success('Todos updated');
    } catch {
      toast.error('Failed to update todos');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} todos?`)) return;
    try {
      await api.post('/todos/bulk-delete', { ids: selectedIds });
      setTodos(ts => ts.filter(t => !selectedIds.includes(t.id)));
      setSelectedIds([]);
      toast.success('Todos deleted');
    } catch {
      toast.error('Failed to delete todos');
    }
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
          <div className="filters" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
            <select
              className="form-select"
              value={`${sortBy}:${sortOrder}`}
              onChange={e => {
                const [by, order] = e.target.value.split(':');
                setSortBy(by);
                setSortOrder(order);
              }}
              style={{ width: 'auto', padding: '0.35rem 1rem', height: 'auto', fontSize: '0.82rem', borderRadius: '20px' }}
            >
              <option value="createdAt:DESC">Newest First</option>
              <option value="createdAt:ASC">Oldest First</option>
              <option value="dueDate:ASC">Due Soonest</option>
              <option value="dueDate:DESC">Due Latest</option>
              <option value="priority:DESC">Highest Priority</option>
              <option value="priority:ASC">Lowest Priority</option>
            </select>
          </div>
        </div>

        {/* Plan Banner */}
        {user?.plan === 'free' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <strong>You\'re on the Free plan</strong>
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

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {selectedIds.length} items selected
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => handleBulkStatusUpdate('completed')}>
                ✓ Mark Completed
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => handleBulkStatusUpdate('pending')}>
                ↺ Mark Pending
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                🗑 Delete
              </button>
            </div>
          </div>
        )}

        {/* Select All Checkbox */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
            <input
              type="checkbox"
              checked={filtered.length > 0 && selectedIds.length === filtered.length}
              onChange={handleToggleSelectAll}
              style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select All</span>
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
                isSelected={selectedIds.includes(todo.id)}
                onToggleSelect={() => handleToggleSelect(todo.id)}
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
