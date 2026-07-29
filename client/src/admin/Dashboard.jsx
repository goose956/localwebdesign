import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/contact/stats').then(setStats).catch(() => {});
    api.get('/contact?limit=5').then(d => setRecent(d.messages || [])).catch(() => {});
  }, []);

  const statCards = stats ? [
    { label: 'Total Messages',  value: stats.total,    color: '#6366f1', icon: '📬' },
    { label: 'Unread',          value: stats.unread,   color: '#ef4444', icon: '🔴' },
    { label: 'Read',            value: stats.read,     color: '#3b82f6', icon: '👁️' },
    { label: 'Replied',         value: stats.replied,  color: '#10b981', icon: '✅' },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Welcome back — here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, color, icon }) => (
          <div key={label} className="admin-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{icon}</span>
              <span className="text-2xl font-display font-bold" style={{ color }}>{value}</span>
            </div>
            <p className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { to: '/admin/messages',  label: 'View Messages',   emoji: '📩' },
          { to: '/admin/portfolio', label: 'Add Portfolio',   emoji: '🖼️' },
          { to: '/admin/reviews',   label: 'Manage Reviews',  emoji: '⭐' },
          { to: '/admin/themes',    label: 'Change Theme',    emoji: '🎨' },
        ].map(({ to, label, emoji }) => (
          <Link key={to} to={to}
            className="admin-card flex flex-col items-center gap-2 text-center hover:border-indigo-500 transition-colors"
            style={{ textDecoration: 'none', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent messages */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Recent Messages</h2>
          <Link to="/admin/messages" className="text-xs" style={{ color: '#6366f1' }}>View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: '#475569' }}>No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {msg.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">{msg.name}</span>
                    <span className={`status-badge status-${msg.status}`}>{msg.status}</span>
                    {msg.service && <span className="text-xs" style={{ color: '#475569' }}>{msg.service}</span>}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>{msg.message}</p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: '#334155' }}>
                  {new Date(msg.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
