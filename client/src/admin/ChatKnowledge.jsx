import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CATEGORIES = ['about', 'services', 'pricing', 'process', 'faq', 'general'];
const EMPTY = { category: 'services', title: '', content: '', sort_order: 0, is_active: true };

const categoryColors = {
  about:    { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc' },
  services: { bg: 'rgba(6,182,212,0.15)',   text: '#67e8f9' },
  pricing:  { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d' },
  process:  { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7' },
  faq:      { bg: 'rgba(168,85,247,0.15)',  text: '#d8b4fe' },
  general:  { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
};

export default function ChatKnowledge() {
  const [entries, setEntries] = useState([]);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [filter, setFilter]   = useState('all');

  const load = () => api.get('/knowledge').then(setEntries).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const startEdit = (e) => {
    setEditing(e.id);
    setForm({ ...e, is_active: Boolean(e.is_active) });
  };
  const cancelEdit = () => { setEditing(null); setForm(EMPTY); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    try {
      if (editing) { await api.put(`/knowledge/${editing}`, payload); flash('Entry updated!'); }
      else         { await api.post('/knowledge', payload); flash('Entry added!'); }
      cancelEdit(); load();
    } catch (err) { flash(err.message); }
    setSaving(false);
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this knowledge entry?')) return;
    await api.delete(`/knowledge/${id}`).catch(() => {});
    if (editing === id) cancelEdit();
    flash('Deleted.'); load();
  };

  const toggleActive = async (entry) => {
    await api.put(`/knowledge/${entry.id}`, { ...entry, is_active: !entry.is_active }).catch(() => {});
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_active: e.is_active ? 0 : 1 } : e));
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.category === filter);
  const totalActive = entries.filter(e => e.is_active).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Chatbot Knowledge Base</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            This is what your AI consultant "Alex" knows. Add, edit or remove entries to shape the conversation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
            {totalActive} active entries feeding the AI
          </div>
        </div>
      </div>

      {/* OpenAI key notice */}
      <div className="admin-card mb-6 flex items-start gap-4" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <span className="text-2xl flex-shrink-0">🔑</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#fcd34d' }}>OpenAI API Key Required</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#92680f' }}>
            Add your OpenAI API key to <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>server/.env</code> as{' '}
            <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>OPENAI_API_KEY=sk-...</code> for the chatbot to work.
            Without it, Alex will respond with a polite fallback message. Get your key at{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#fcd34d' }}>platform.openai.com</a>.
          </p>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form */}
        <div className="xl:col-span-2">
          <div className="admin-card sticky top-4">
            <h2 className="font-semibold text-white mb-5">{editing ? 'Edit Entry' : 'Add Knowledge Entry'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="admin-label">Category</label>
                <select className="admin-input" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Title *</label>
                <input className="admin-input" name="title" value={form.title}
                  onChange={handleChange} required maxLength={200}
                  placeholder="e.g. Starter Plan — £799" />
              </div>
              <div>
                <label className="admin-label">Content *</label>
                <textarea
                  className="admin-input resize-none"
                  name="content" rows={8}
                  value={form.content}
                  onChange={handleChange}
                  required maxLength={5000}
                  placeholder="Write everything Alex should know about this topic. Be specific — Alex will quote this directly when answering customers."
                />
                <p className="text-xs mt-1 text-right" style={{ color: '#334155' }}>{form.content.length}/5000</p>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="admin-label">Sort Order</label>
                  <input className="admin-input" name="sort_order" type="number"
                    value={form.sort_order} onChange={handleChange} min={0} />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <input type="checkbox" id="is_active" name="is_active" checked={form.is_active}
                    onChange={handleChange} className="w-4 h-4 accent-indigo-500" />
                  <label htmlFor="is_active" className="admin-label mb-0 cursor-pointer">Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Entry'}
                </button>
                {editing && (
                  <button type="button" onClick={cancelEdit}
                    className="py-2.5 px-4 rounded-xl font-semibold text-sm"
                    style={{ background: '#1e293b', color: '#94a3b8' }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Entries list */}
        <div className="xl:col-span-3">
          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {['all', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold capitalize transition-all"
                style={{
                  background: filter === cat ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b',
                  color: filter === cat ? '#fff' : '#64748b',
                }}>
                {cat === 'all' ? `All (${entries.length})` : `${cat} (${entries.filter(e => e.category === cat).length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="admin-card text-center py-20">
              <span className="text-4xl mb-4 block">🧠</span>
              <p className="font-semibold text-white mb-1">No entries yet</p>
              <p className="text-sm" style={{ color: '#475569' }}>Add knowledge entries using the form — the more you add, the smarter Alex becomes.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(entry => {
                const col = categoryColors[entry.category] || categoryColors.general;
                return (
                  <div key={entry.id} className="rounded-xl p-4 transition-all"
                    style={{
                      background: '#0f172a',
                      border: `1px solid ${editing === entry.id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                      opacity: entry.is_active ? 1 : 0.5,
                    }}>
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                        style={{ background: col.bg, color: col.text }}>
                        {entry.category}
                      </span>
                      <h3 className="font-semibold text-sm text-white flex-1 min-w-0">{entry.title}</h3>
                      {!entry.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#1e293b', color: '#475569' }}>Hidden</span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#475569' }}>
                      {entry.content}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(entry)}
                        className="text-xs py-1.5 px-3 rounded-lg font-medium flex-shrink-0"
                        style={{ background: entry.is_active ? 'rgba(16,185,129,0.1)' : '#1e293b', color: entry.is_active ? '#34d399' : '#64748b' }}>
                        {entry.is_active ? '● Active' : '○ Inactive'}
                      </button>
                      <button onClick={() => startEdit(entry)}
                        className="text-xs py-1.5 px-3 rounded-lg font-medium"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteEntry(entry.id)}
                        className="text-xs py-1.5 px-3 rounded-lg font-medium ml-auto"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
