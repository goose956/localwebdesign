import { useEffect, useState } from 'react';
import { api } from '../api.js';

const EMPTY = { name: '', company: '', role: '', rating: 5, review: '', avatar: '', is_visible: true, sort_order: 0 };
const Stars = ({ n, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(i => (
      <button key={i} type="button" onClick={() => onChange(i)}>
        <svg className="w-6 h-6" viewBox="0 0 20 20" fill={i <= n ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="1.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))}
  </div>
);

const initials = (n) => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
const avatarBg = (n) => {
  const c=['#6366f1','#8b5cf6','#06b6d4','#10b981','#f97316','#f43f5e'];
  let h=0; for(const x of n) h=(h*31+x.charCodeAt(0))%c.length;
  return c[h];
};

export default function ReviewsManager() {
  const [reviews, setReviews]   = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  const load = () => api.get('/reviews/all').then(setReviews).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const startEdit = (r) => { setEditing(r.id); setForm({ ...r, is_visible: Boolean(r.is_visible) }); };
  const cancelEdit = () => { setEditing(null); setForm(EMPTY); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    try {
      if (editing) { await api.put(`/reviews/${editing}`, payload); flash('Review updated!'); }
      else         { await api.post('/reviews', payload); flash('Review added!'); }
      cancelEdit(); load();
    } catch (err) { flash(err.message); }
    setSaving(false);
  };

  const toggleVisible = async (r) => {
    await api.put(`/reviews/${r.id}`, { ...r, is_visible: !r.is_visible }).catch(() => {});
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, is_visible: !x.is_visible } : x));
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/reviews/${id}`).catch(() => {});
    if (editing === id) cancelEdit();
    flash('Deleted.'); load();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Reviews Manager</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Manage client testimonials shown on your homepage.</p>
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
            <h2 className="font-semibold text-white mb-5">{editing ? 'Edit Review' : 'Add New Review'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="admin-label">Client Name *</label>
                <input className="admin-input" name="name" value={form.name} onChange={handleChange} required placeholder="Jane Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Company</label>
                  <input className="admin-input" name="company" value={form.company} onChange={handleChange} placeholder="Acme Ltd" />
                </div>
                <div>
                  <label className="admin-label">Role / Title</label>
                  <input className="admin-input" name="role" value={form.role} onChange={handleChange} placeholder="Owner" />
                </div>
              </div>
              <div>
                <label className="admin-label">Review *</label>
                <textarea className="admin-input resize-none" name="review" rows={4} value={form.review}
                  onChange={handleChange} required placeholder="What the client said…" />
              </div>
              <div>
                <label className="admin-label">Rating</label>
                <Stars n={Number(form.rating)} onChange={n => setForm(f => ({ ...f, rating: n }))} />
              </div>
              <div>
                <label className="admin-label">Avatar URL (optional)</label>
                <input className="admin-input" name="avatar" value={form.avatar}
                  onChange={handleChange} placeholder="https://…" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="admin-label">Sort Order</label>
                  <input className="admin-input" name="sort_order" type="number" value={form.sort_order} onChange={handleChange} min={0} />
                </div>
                <div className="flex items-end pb-0.5 gap-2">
                  <input type="checkbox" id="is_visible" name="is_visible" checked={form.is_visible} onChange={handleChange} className="w-4 h-4 accent-indigo-500" />
                  <label htmlFor="is_visible" className="admin-label mb-0 cursor-pointer">Visible</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Review'}
                </button>
                {editing && (
                  <button type="button" onClick={cancelEdit} className="py-2.5 px-4 rounded-xl font-semibold text-sm"
                    style={{ background: '#1e293b', color: '#94a3b8' }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Reviews list */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {reviews.length === 0 ? (
            <div className="admin-card text-center py-20">
              <span className="text-4xl mb-4 block">⭐</span>
              <p className="font-semibold text-white mb-1">No reviews yet</p>
              <p className="text-sm" style={{ color: '#475569' }}>Add your first client review using the form.</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.id} className="rounded-xl p-4"
              style={{ background: '#0f172a', border: `1px solid ${editing === r.id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`, opacity: r.is_visible ? 1 : 0.55 }}>
              <div className="flex items-start gap-3">
                {r.avatar ? (
                  <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: avatarBg(r.name) }}>{initials(r.name)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-white">{r.name}</span>
                    {r.company && <span className="text-xs" style={{ color: '#475569' }}>{r.role ? `${r.role} · ` : ''}{r.company}</span>}
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(i => <span key={i} className="text-xs" style={{ color: i <= r.rating ? '#f59e0b' : '#334155' }}>★</span>)}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#64748b' }}>{r.review}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button onClick={() => toggleVisible(r)} className="text-xs py-1.5 px-3 rounded-lg font-medium flex-1"
                  style={{ background: r.is_visible ? 'rgba(16,185,129,0.1)' : '#1e293b', color: r.is_visible ? '#34d399' : '#64748b' }}>
                  {r.is_visible ? '● Visible' : '○ Hidden'}
                </button>
                <button onClick={() => startEdit(r)} className="text-xs py-1.5 px-3 rounded-lg font-medium"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>Edit</button>
                <button onClick={() => deleteReview(r.id)} className="text-xs py-1.5 px-3 rounded-lg font-medium"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
