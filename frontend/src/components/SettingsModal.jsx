import { useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SettingsModal = ({ onClose }) => {
  const { user, updateUser } = useAuthStore();
  const [reminders, setReminders] = useState(user?.emailRemindersEnabled ?? true);
  const [digest, setDigest] = useState(user?.dailyDigestEnabled ?? true);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/user/preferences', {
        emailRemindersEnabled: reminders,
        dailyDigestEnabled: digest,
      });
      
      updateUser({
        emailRemindersEnabled: reminders,
        dailyDigestEnabled: digest,
      });
      
      toast.success('Notification settings saved!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3 className="modal-title">⚙️ Notification Settings</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Email Reminders Switch Row */}
            <div className="settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ paddingRight: '1rem' }}>
                <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '0.25rem', fontSize: '0.95rem' }}>⏰ Email Reminders</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>Get email notifications for high-priority tasks due within 24 hours.</div>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', flexShrink: 0 }}>
                <input 
                  type="checkbox" 
                  checked={reminders} 
                  onChange={(e) => setReminders(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: reminders ? '#7c3aed' : '#334155',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px', left: reminders ? '26px' : '4px', bottom: '3px',
                    backgroundColor: '#ffffff', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}/>
                </span>
              </label>
            </div>

            {/* Daily Digest Switch Row */}
            <div className="settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ paddingRight: '1rem' }}>
                <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '0.25rem', fontSize: '0.95rem' }}>🌅 Daily Digest</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>Receive a summary email at 8:00 AM detailing all active and pending tasks.</div>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', flexShrink: 0 }}>
                <input 
                  type="checkbox" 
                  checked={digest} 
                  onChange={(e) => setDigest(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: digest ? '#7c3aed' : '#334155',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px', left: digest ? '26px' : '4px', bottom: '3px',
                    backgroundColor: '#ffffff', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}/>
                </span>
              </label>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline btn-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Saving...' : '✓ Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
