import { useEffect, useState } from 'react';
import { api } from '../api.js';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const fmt = (dateStr) => new Date(dateStr).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

export default function ChatLogs() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);   // session_id
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const load = () => api.get('/chat-logs').then(setSessions).catch(() => {});
  useEffect(() => { load(); }, []);

  const openSession = async (sessionId) => {
    if (selected === sessionId) { setSelected(null); setMessages([]); return; }
    setSelected(sessionId);
    setLoadingMsgs(true);
    try {
      const msgs = await api.get(`/chat-logs/${sessionId}`);
      setMessages(msgs);
    } catch {}
    setLoadingMsgs(false);
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    await api.delete(`/chat-logs/${sessionId}`).catch(() => {});
    if (selected === sessionId) { setSelected(null); setMessages([]); }
    load();
  };

  const clearAll = async () => {
    if (!confirm('Delete ALL chat logs? This cannot be undone.')) return;
    await api.delete('/chat-logs').catch(() => {});
    setSelected(null); setMessages([]); load();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Chat Logs</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Every conversation visitors have had with Alex. {sessions.length} total session{sessions.length !== 1 ? 's' : ''}.
          </p>
        </div>
        {sessions.length > 0 && (
          <button onClick={clearAll}
            className="text-sm px-4 py-2 rounded-xl font-semibold"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            Clear All Logs
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="admin-card text-center py-24">
          <span className="text-4xl mb-4 block">💬</span>
          <p className="font-semibold text-white mb-1">No conversations yet</p>
          <p className="text-sm" style={{ color: '#475569' }}>
            Chat sessions will appear here once visitors start using the chatbot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Sessions list */}
          <div className="xl:col-span-2 flex flex-col gap-3">
            {sessions.map(s => (
              <div
                key={s.session_id}
                onClick={() => openSession(s.session_id)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selected === s.session_id ? '#162032' : '#0f172a',
                  border: `1px solid ${selected === s.session_id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: selected === s.session_id ? '0 0 0 1px #6366f1' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      💬
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
                        {s.message_count} message{s.message_count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs" style={{ color: '#334155' }}>{fmt(s.started_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: '#334155' }}>{timeAgo(s.last_message_at)}</span>
                    <button
                      onClick={(e) => deleteSession(s.session_id, e)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                      title="Delete session"
                    >×</button>
                  </div>
                </div>
                {s.first_message && (
                  <p className="text-xs leading-relaxed line-clamp-2 ml-10" style={{ color: '#475569' }}>
                    "{s.first_message}"
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Conversation view */}
          <div className="xl:col-span-3">
            {!selected ? (
              <div className="admin-card flex flex-col items-center justify-center py-20 text-center sticky top-4">
                <span className="text-4xl mb-4">👈</span>
                <p className="font-semibold text-white mb-1">Select a conversation</p>
                <p className="text-sm" style={{ color: '#475569' }}>Click any session on the left to read the full chat.</p>
              </div>
            ) : (
              <div className="admin-card sticky top-4">
                <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 className="font-semibold text-white">Conversation</h2>
                  <span className="text-xs" style={{ color: '#334155' }}>
                    {sessions.find(s => s.session_id === selected)?.started_at && fmt(sessions.find(s => s.session_id === selected).started_at)}
                  </span>
                </div>

                {loadingMsgs ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-h-[520px] overflow-y-auto pr-1">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                          style={{ background: msg.role === 'user' ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {msg.role === 'user' ? '👤' : 'A'}
                        </div>
                        <div className="flex flex-col gap-1 max-w-[78%]">
                          <div
                            className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                            style={msg.role === 'user' ? {
                              background: '#1e293b',
                              color: '#e2e8f0',
                              borderBottomRightRadius: 4,
                            } : {
                              background: 'rgba(99,102,241,0.1)',
                              color: '#e2e8f0',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderBottomLeftRadius: 4,
                            }}
                          >
                            {msg.content}
                          </div>
                          <span className={`text-xs ${msg.role === 'user' ? 'text-right' : ''}`}
                            style={{ color: '#334155' }}>
                            {fmt(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
