import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { low: 'dot-low', medium: 'dot-medium', high: 'dot-high', urgent: 'dot-urgent' };
const STATUS_MAP = { pending: 'badge-pending', in_progress: 'badge-in_progress', completed: 'badge-completed', archived: 'badge-archived' };

const TodoCard = ({ todo, onUpdated, onDeleted, isSelected, onToggleSelect }) => {
  const [deleting, setDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  const toggleStatus = async (e) => {
    if (e) e.stopPropagation();
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

  const toggleSubtask = async (e, subtask) => {
    e.stopPropagation();
    const updatedStatus = !subtask.isCompleted;
    try {
      const { data } = await api.put(`/todos/${todo.id}/subtasks/${subtask.id}`, {
        isCompleted: updatedStatus
      });
      const updatedSubtasks = todo.subtasks.map(s => s.id === subtask.id ? data.subtask : s);
      onUpdated({ ...todo, subtasks: updatedSubtasks });
    } catch (err) {
      toast.error('Failed to update step');
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setAddingSubtask(true);
    try {
      const { data } = await api.post(`/todos/${todo.id}/subtasks`, {
        title: newSubtaskTitle
      });
      const updatedSubtasks = [...(todo.subtasks || []), data.subtask];
      onUpdated({ ...todo, subtasks: updatedSubtasks });
      setNewSubtaskTitle('');
      toast.success('Step added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add step');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleDeleteSubtask = async (e, subtaskId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this step?')) return;
    try {
      await api.delete(`/todos/${todo.id}/subtasks/${subtaskId}`);
      const updatedSubtasks = todo.subtasks.filter(s => s.id !== subtaskId);
      onUpdated({ ...todo, subtasks: updatedSubtasks });
      toast.success('Step deleted');
    } catch (err) {
      toast.error('Failed to delete step');
    }
  };

  const subtasks = todo.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
  const percentComplete = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div 
      className={`todo-item fade-in ${todo.status === 'completed' ? 'completed' : ''} ${isExpanded ? 'expanded' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      <div style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={e => e.stopPropagation()}
          style={{
            marginRight: '0.25rem',
            cursor: 'pointer',
            alignSelf: 'center',
            accentColor: 'var(--primary)',
            width: '16px',
            height: '16px'
          }}
        />
        <div className={`priority-dot ${PRIORITY_COLORS[todo.priority]}`} />
        
        {/* Clickable Middle Section */}
        <div 
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="todo-title" style={{ flex: 1 }}>{todo.title}</div>
            <span style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.8rem', 
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              marginRight: '0.5rem'
            }}>
              ▼
            </span>
          </div>
          {todo.description && (
            <div className="todo-desc" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {todo.description}
            </div>
          )}
          <div className="todo-meta">
            <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
            <span className={`badge ${STATUS_MAP[todo.status]}`}>{todo.status.replace('_', ' ')}</span>
            {todo.dueDate && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                📅 {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
            {todo.tags?.map(t => (
              <span key={t} style={{ fontSize: '0.72rem', color: '#a78bfa', background: 'rgba(124,58,237,0.1)', padding: '0.1rem 0.5rem', borderRadius: '20px' }}>
                #{t}
              </span>
            ))}
          </div>

          {/* Checklist progress bar */}
          {totalSubtasks > 0 && (
            <div className="subtask-progress-container" style={{ marginTop: '0.6rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>📋 Checklist</span>
                <span>{completedSubtasks}/{totalSubtasks} steps ({percentComplete}%)</span>
              </div>
              <div className="subtask-progress-bar-bg" style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div className="subtask-progress-bar-fill" style={{ height: '100%', width: `${percentComplete}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="todo-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-outline btn-sm btn-icon" onClick={toggleStatus} title="Toggle status">
            {todo.status === 'completed' ? '↺' : '✓'}
          </button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={handleDelete} disabled={deleting} title="Delete">
            {deleting ? '...' : '🗑'}
          </button>
        </div>
      </div>

      {/* Expanded Subtasks Panel */}
      {isExpanded && (
        <div 
          className="subtasks-panel" 
          onClick={e => e.stopPropagation()}
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            paddingTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            width: '100%',
            paddingLeft: '2.5rem'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Steps to Complete:
          </div>

          {/* List subtasks */}
          {subtasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {subtasks.map(sub => (
                <div 
                  key={sub.id} 
                  className={`subtask-item ${sub.isCompleted ? 'completed' : ''}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.65rem',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sub.isCompleted}
                    onChange={(e) => toggleSubtask(e, sub)}
                    style={{ cursor: 'pointer', accentColor: '#10b981', width: '15px', height: '15px' }}
                  />
                  <span style={{ 
                    fontSize: '0.88rem', 
                    flex: 1, 
                    textDecoration: sub.isCompleted ? 'line-through' : 'none',
                    color: sub.isCompleted ? 'var(--text-muted)' : 'var(--text)',
                    transition: 'color 0.2s'
                  }}>
                    {sub.title}
                  </span>
                  <button 
                    className="btn-delete-subtask" 
                    onClick={(e) => handleDeleteSubtask(e, sub.id)}
                    title="Remove step"
                    style={{ 
                      padding: '0.2rem 0.35rem', 
                      fontSize: '0.75rem', 
                      border: 'none', 
                      color: 'var(--danger)',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
              No steps added yet. Add steps below to track your progress.
            </div>
          )}

          {/* Inline input form */}
          <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              className="form-input"
              placeholder="+ Add a step..."
              value={newSubtaskTitle}
              onChange={e => setNewSubtaskTitle(e.target.value)}
              disabled={addingSubtask}
              style={{ 
                padding: '0.4rem 0.75rem', 
                fontSize: '0.82rem', 
                borderRadius: 'var(--radius)', 
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px dashed rgba(255, 255, 255, 0.12)'
              }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={addingSubtask || !newSubtaskTitle.trim()}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
            >
              {addingSubtask ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TodoCard;
