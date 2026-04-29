import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TodoModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'pending', dueDate: '', tags: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
      };
      const { data } = await api.post('/todos', payload);
      onCreated(data.todo);
      toast.success('Todo created! 🔒 Encrypted & saved.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">✦ New Todo</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="work, personal, urgent" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline btn-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '🔒 Encrypting...' : '✓ Create Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoModal;
