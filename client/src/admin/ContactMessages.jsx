import { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUSES = ['unread', 'read', 'replied', 'archived'];
const FILTERS  = [{ value: '', label: 'All' }, ...STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))];

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter]     = useState('');
  const [total, setTotal]       = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    const url = filter ? `/contact?status=${filter}` : '/contact';
    api.get(url).then(d => { setMessages(d.messages || []); setTotal(d.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/contact/${id}/status`, { status }).catch(() => {});
    setMessages(m => m.map(x => x.id === id ? { ...x, status } : x));
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
  };

  const deleteMsg = async (id) => {
    if (!confirm('Delete this message?')) return;
    await api.delete(`/contact/${id}`).catch(() => {});
    setMessages(m => m.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Messages</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{total} message{total !== 1 ? 's' : ''} total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: filter === f.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b',
              color: filter === f.value ? '#fff' : '#94a3b8',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message list */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="admin-card text-center py-16">
              <p className="text-lg mb-1" style={{ color: '#475569' }}>No messages</p>
              <p className="text-sm" style={{ color: '#334155' }}>Check back later!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id}
                onClick={() => { setSelected(msg); if (msg.status === 'unread') updateStatus(msg.id, 'read'); }}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selected?.id === msg.id ? '#1e2d45' : '#0f172a',
                  border: `1px solid ${selected?.id === msg.id ? '#6366f1' : msg.status === 'unread' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {msg.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{msg.name}</span>
                      <span className={`status-badge status-${msg.status}`}>{msg.status}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>{msg.email}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: '#334155' }}>{msg.message}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#334155' }}>
                    {new Date(msg.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message detail */}
        <div>
          {selected ? (
            <div className="admin-card sticky top-4">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-bold text-xl text-white">{selected.name}</h2>
                  <p className="text-sm mt-0.5" style={{ color: '#6366f1' }}>{selected.email}</p>
                  {selected.phone && <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{selected.phone}</p>}
                </div>
                <button onClick={() => deleteMsg(selected.id)}
                  className="p-2 rounded-lg text-xs font-medium flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  🗑 Delete
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
                {selected.service && <span className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{selected.service}</span>}
                <span className="text-xs" style={{ color: '#334155' }}>
                  {new Date(selected.created_at).toLocaleString('en-GB')}
                </span>
              </div>

              <div className="rounded-xl p-4 mb-5 text-sm leading-relaxed" style={{ background: '#0f172a', color: '#94a3b8' }}>
                {selected.message}
              </div>

              <div>
                <p className="admin-label mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                      style={{
                        background: selected.status === s ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b',
                        color: selected.status === s ? '#fff' : '#64748b',
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <a href={`mailto:${selected.email}?subject=Re: Your enquiry`}
                className="mt-5 block text-center py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                Reply via Email ↗
              </a>
            </div>
          ) : (
            <div className="admin-card flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-4">📩</span>
              <p className="font-semibold text-white mb-1">Select a message</p>
              <p className="text-sm" style={{ color: '#475569' }}>Click any message to read the full content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
