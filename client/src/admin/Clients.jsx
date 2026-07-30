import { useEffect, useState } from 'react';
import { api } from '../api.js';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Client sites synced from Site Builder — rows only ever come from a publish, never created
// here. Synced fields (name/phone/about/services) are read-only, since they'd just be
// overwritten on the next publish anyway; extra_notes is the one thing this admin panel
// actually owns.
export default function Clients() {
  const [clients, setClients]   = useState([]);
  const [selected, setSelected] = useState(null); // site_id
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  const load = () => api.get('/clients').then(setClients).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const selectClient = (c) => {
    setSelected(c.site_id);
    setNotes(c.extra_notes || '');
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.put(`/clients/${selected}`, { extra_notes: notes });
      flash('Saved!');
      load();
    } catch (err) { flash(err.message); }
    setSaving(false);
  };

  const deleteClient = async (siteId, e) => {
    e.stopPropagation();
    if (!confirm('Remove this client site? Its past chat logs are kept.')) return;
    await api.delete(`/clients/${siteId}`).catch(() => {});
    if (selected === siteId) setSelected(null);
    flash('Removed.'); load();
  };

  const current = clients.find(c => c.site_id === selected);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Client Sites</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Every Site Builder demo site with chat enabled shows up here automatically once it's published —
          nothing to set up by hand beyond the "Extra Notes" field below.
        </p>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
          {msg}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="admin-card text-center py-24">
          <span className="text-4xl mb-4 block">🏢</span>
          <p className="font-semibold text-white mb-1">No client sites synced yet</p>
          <p className="text-sm" style={{ color: '#475569' }}>
            Enable chat and publish a site from Site Builder to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* List */}
          <div className="xl:col-span-2 flex flex-col gap-3">
            {clients.map(c => (
              <div key={c.site_id} onClick={() => selectClient(c)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selected === c.site_id ? '#162032' : '#0f172a',
                  border: `1px solid ${selected === c.site_id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-white">{c.business_name || '(unnamed)'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{c.phone || 'no phone'}</p>
                    <p className="text-xs mt-1" style={{ color: '#334155' }}>Synced {timeAgo(c.synced_at)} · {c.services?.length || 0} services</p>
                  </div>
                  <button onClick={(e) => deleteClient(c.site_id, e)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                    title="Remove client">×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="xl:col-span-3">
            {!current ? (
              <div className="admin-card flex flex-col items-center justify-center py-20 text-center sticky top-4">
                <span className="text-4xl mb-4">👈</span>
                <p className="font-semibold text-white mb-1">Select a client</p>
                <p className="text-sm" style={{ color: '#475569' }}>Click any site on the left to view and top up its details.</p>
              </div>
            ) : (
              <div className="admin-card sticky top-4">
                <h2 className="font-semibold text-white mb-1">{current.business_name}</h2>
                <p className="text-xs mb-5" style={{ color: '#334155' }}>Synced from Site Builder — re-publish to update</p>

                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label className="admin-label">Phone</label>
                    <input className="admin-input" value={current.phone || ''} readOnly disabled />
                  </div>
                  <div>
                    <label className="admin-label">About</label>
                    <textarea className="admin-input resize-none" rows={3} value={current.about_text || ''} readOnly disabled />
                  </div>
                  <div>
                    <label className="admin-label">Services</label>
                    <div className="flex flex-col gap-2">
                      {(current.services || []).map((s, i) => (
                        <div key={i} className="text-xs rounded-lg px-3 py-2" style={{ background: '#0f172a', color: '#94a3b8' }}>
                          <span className="font-semibold text-white">{s.name}</span> — {s.blurb}
                        </div>
                      ))}
                      {(!current.services || current.services.length === 0) && (
                        <p className="text-xs" style={{ color: '#334155' }}>No services synced.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                  <label className="admin-label">Extra Notes (FAQ, tone, policies — not synced, edited here only)</label>
                  <textarea className="admin-input resize-none" rows={5} value={notes}
                    onChange={e => setNotes(e.target.value)} maxLength={3000}
                    placeholder="Anything the chatbot should know that isn't already in the page copy — opening hours, service area limits, common questions, tone notes…" />
                  <p className="text-xs mt-1 text-right" style={{ color: '#334155' }}>{notes.length}/3000</p>
                  <button onClick={saveNotes} disabled={saving}
                    className="mt-3 py-2.5 px-5 rounded-xl font-semibold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {saving ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
