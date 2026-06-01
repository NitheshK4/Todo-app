import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtHours = (h) => {
  if (h < 1) return '< 1 hr';
  if (h < 24) return `${h} hrs`;
  const days = Math.round(h / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: '0.85rem' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, glow }) => (
  <div className="analytics-stat-card" style={{ '--glow-color': color }}>
    <div className="analytics-stat-icon" style={{ background: `${color}22`, color }}>
      {icon}
    </div>
    <div>
      <div className="analytics-stat-value" style={{ color }}>{value}</div>
      <div className="analytics-stat-label">{label}</div>
      {sub && <div className="analytics-stat-sub">{sub}</div>}
    </div>
    {glow && <div className="analytics-stat-glow" style={{ background: color }} />}
  </div>
);

// ── Donut Slice colours ────────────────────────────────────────
const PRIORITY_COLORS  = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', urgent: '#fca5a5' };
const STATUS_COLORS    = { pending: '#94a3b8', in_progress: '#06b6d4', completed: '#10b981', archived: '#818cf8' };

// ── Main Page ─────────────────────────────────────────────────
const AnalyticsPage = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/analytics');
        setData(res.analytics);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Transform priority/status objects → array for Pie
  const priorityData = useMemo(() => data
    ? Object.entries(data.tasksByPriority)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, value: v, color: PRIORITY_COLORS[k] }))
    : [], [data]);

  const statusData = useMemo(() => data
    ? Object.entries(data.tasksByStatus)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k.replace('_', ' '), value: v, color: STATUS_COLORS[k] }))
    : [], [data]);

  if (loading) {
    return (
      <div className="page">
        <NavBar />
        <div className="center" style={{ flex: 1, flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <span style={{ color: 'var(--text-muted)' }}>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completionRingOffset = 283 - (283 * data.completionRate) / 100;

  return (
    <div className="page">
      <NavBar />

      <div className="analytics-page">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <h2>
              <span className="gradient-text">Analytics</span> Dashboard
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Your productivity insights, {user?.name?.split(' ')[0]} 🚀
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-outline btn-sm">← Back to Dashboard</Link>
        </div>

        {/* ── Top Stat Cards ─────────────────────────────────── */}
        <div className="analytics-stats-grid">
          <StatCard
            icon="🔥"
            label="Current Streak"
            value={`${data.currentStreak}d`}
            sub={`Best: ${data.longestStreak} days`}
            color="#f59e0b"
            glow
          />
          <StatCard
            icon="✅"
            label="Completion Rate"
            value={`${data.completionRate}%`}
            sub={`${data.tasksByStatus.completed} of ${data.totalTasks} tasks`}
            color="#10b981"
          />
          <StatCard
            icon="⏱️"
            label="Avg. Time to Complete"
            value={fmtHours(data.avgTimeToComplete)}
            sub="from creation to done"
            color="#06b6d4"
          />
          <StatCard
            icon="📋"
            label="Total Tasks"
            value={data.totalTasks}
            sub={`${data.tasksByStatus.in_progress} in progress`}
            color="#7c3aed"
          />
        </div>

        {/* ── Charts Row 1 ───────────────────────────────────── */}
        <div className="analytics-charts-row">
          {/* Daily Completions Bar Chart */}
          <div className="analytics-chart-card" style={{ flex: 2 }}>
            <div className="analytics-chart-header">
              <h3>Tasks Completed — Last 14 Days</h3>
              <span className="analytics-chart-badge">Daily</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.completedPerDay} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
                <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]}>
                  {data.completedPerDay.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.completed > 0 ? 'url(#barGradient)' : 'rgba(255,255,255,0.05)'}
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Completion Rate Ring */}
          <div className="analytics-chart-card analytics-ring-card">
            <div className="analytics-chart-header">
              <h3>Completion Rate</h3>
            </div>
            <div className="analytics-ring-wrap">
              <svg viewBox="0 0 100 100" className="analytics-ring-svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={completionRingOffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="analytics-ring-label">
                <span className="analytics-ring-pct">{data.completionRate}%</span>
                <span className="analytics-ring-sub">done</span>
              </div>
            </div>
            <div className="analytics-ring-stats">
              <div><span style={{ color: '#10b981' }}>✓</span> {data.tasksByStatus.completed} completed</div>
              <div><span style={{ color: '#94a3b8' }}>○</span> {data.tasksByStatus.pending} pending</div>
            </div>
          </div>
        </div>

        {/* ── Charts Row 2 ───────────────────────────────────── */}
        <div className="analytics-charts-row">
          {/* Weekly Trend Line */}
          <div className="analytics-chart-card" style={{ flex: 2 }}>
            <div className="analytics-chart-header">
              <h3>Weekly Trend — Created vs Completed</h3>
              <span className="analytics-chart-badge">7 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.weeklyTrend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }}
                  formatter={(v) => <span style={{ color: '#94a3b8' }}>{v}</span>}
                />
                <Line type="monotone" dataKey="created" name="Created" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Pie */}
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <h3>By Priority</h3>
            </div>
            {priorityData.length === 0 ? (
              <div className="center" style={{ height: 200, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 8, fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="analytics-legend">
                  {priorityData.map((d) => (
                    <div key={d.name} className="analytics-legend-item">
                      <span className="analytics-legend-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Recently Completed ──────────────────────────────── */}
        {data.recentlyCompleted?.length > 0 && (
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <h3>Recently Completed</h3>
              <span className="analytics-chart-badge">Last 5</span>
            </div>
            <div className="analytics-recent-list">
              {data.recentlyCompleted.map((t) => (
                <div key={t.id} className="analytics-recent-item">
                  <span className="analytics-recent-dot" style={{ background: PRIORITY_COLORS[t.priority] }} />
                  <span className="analytics-recent-title">{t.title}</span>
                  <span className="analytics-recent-date">
                    {new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Streak Banner ───────────────────────────────────── */}
        <div className="analytics-streak-banner">
          <div className="analytics-streak-fire">🔥</div>
          <div>
            <div className="analytics-streak-title">
              {data.currentStreak > 0
                ? `${data.currentStreak}-day streak! Keep it going!`
                : 'Start your streak today!'}
            </div>
            <div className="analytics-streak-sub">
              Complete at least 1 task every day to maintain your streak.
              Best: <strong>{data.longestStreak} days</strong>
            </div>
          </div>
          {data.currentStreak > 0 && (
            <div className="analytics-streak-days">
              {Array.from({ length: Math.min(data.currentStreak, 7) }).map((_, i) => (
                <div key={i} className="analytics-streak-pip active" />
              ))}
              {Array.from({ length: Math.max(0, 7 - data.currentStreak) }).map((_, i) => (
                <div key={`e${i}`} className="analytics-streak-pip" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
