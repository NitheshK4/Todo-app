import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { low: 'dot-low', medium: 'dot-medium', high: 'dot-high', urgent: 'dot-urgent' };
const STATUS_MAP = { pending: 'badge-pending', in_progress: 'badge-in_progress', completed: 'badge-completed', archived: 'badge-archived' };

const TodoCard = ({ todo, onUpdated, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);

  const toggleStatus = async () => {
    const next = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/todos/${todo.id}`, { status: next });
      onUpdated({ ...todo, status: next });
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this todo?')) return;
    setDeleting(true);
    try {
      await api.delete(`/todos/${todo.id}`);
      onDeleted(todo.id);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); setDeleting(false); }
  };

  return (
    <div className={`todo-item fade-in ${todo.status === 'completed' ? 'completed' : ''}`} onClick={toggleStatus}>
      <div className={`priority-dot ${PRIORITY_COLORS[todo.priority]}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="todo-title">{todo.title}</div>
        {todo.description && <div className="todo-desc" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{todo.description}</div>}
        <div className="todo-meta">
          <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
          <span className={`badge ${STATUS_MAP[todo.status]}`}>{todo.status.replace('_', ' ')}</span>
          {todo.dueDate && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              📅 {new Date(todo.dueDate).toLocaleDateString()}
            </span>
          )}
          {todo.tags?.map(t => (
            <span key={t} style={{ fontSize: '0.72rem', color: '#a78bfa', background: 'rgba(124,58,237,0.1)', padding: '0.1rem 0.5rem', borderRadius: '20px' }}>#{t}</span>
          ))}
        </div>
      </div>
      <div className="todo-actions" onClick={e => e.stopPropagation()}>
        <button className="btn btn-outline btn-sm btn-icon" onClick={toggleStatus} title="Toggle status">
          {todo.status === 'completed' ? '↺' : '✓'}
        </button>
        <button className="btn btn-danger btn-sm btn-icon" onClick={handleDelete} disabled={deleting} title="Delete">
          {deleting ? '...' : '🗑'}
        </button>
      </div>
    </div>
  );
};

export default TodoCard;
