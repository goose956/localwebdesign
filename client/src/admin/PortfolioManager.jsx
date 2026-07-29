import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CATEGORIES = ['web', 'ecommerce', 'redesign', 'landing'];
const EMPTY = { title: '', description: '', category: 'web', image_url: '', live_url: '', tags: '', featured: false, sort_order: 0 };

export default function PortfolioManager() {
  const [items, setItems]     = useState([]);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null); // id | null
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const load = () => api.get('/portfolio').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({ ...item, tags: Array.isArray(item.tags) ? item.tags.join(', ') : '' });
  };

  const cancelEdit = () => { setEditing(null); setForm(EMPTY); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
    };
    try {
      if (editing) {
        await api.put(`/portfolio/${editing}`, payload);
        flash('Project updated!');
      } else {
        await api.post('/portfolio', payload);
        flash('Project added!');
      }
      cancelEdit();
      load();
    } catch (err) { flash(err.message); }
    setSaving(false);
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this portfolio item?')) return;
    await api.delete(`/portfolio/${id}`).catch(() => {});
    if (editing === id) cancelEdit();
    flash('Deleted.');
    load();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Portfolio Manager</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Add, edit and organise your portfolio projects.</p>
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
            <h2 className="font-semibold text-white mb-5">{editing ? 'Edit Project' : 'Add New Project'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="admin-label">Project Title *</label>
                <input className="admin-input" name="title" value={form.title}
                  onChange={handleChange} required placeholder="Bloom Boutique Website" />
              </div>
              <div>
                <label className="admin-label">Category</label>
                <select className="admin-input" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Description</label>
                <textarea className="admin-input resize-none" name="description" rows={3}
                  value={form.description} onChange={handleChange}
                  placeholder="Brief description of the project…" />
              </div>
              <div>
                <label className="admin-label">Image URL</label>
                <input className="admin-input" name="image_url" value={form.image_url}
                  onChange={handleChange} placeholder="https://res.cloudinary.com/…" />
                <p className="text-xs mt-1" style={{ color: '#334155' }}>
                  Use Cloudinary, Unsplash or any public image URL.
                </p>
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="rounded-lg object-cover w-full h-28" style={{ background: '#0f172a' }} />
              )}
              <div>
                <label className="admin-label">Live URL</label>
                <input className="admin-input" name="live_url" type="url" value={form.live_url}
                  onChange={handleChange} placeholder="https://client-website.com" />
              </div>
              <div>
                <label className="admin-label">Tags (comma separated)</label>
                <input className="admin-input" name="tags" value={form.tags}
                  onChange={handleChange} placeholder="React, E-Commerce, Tailwind" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="admin-label">Sort Order</label>
                  <input className="admin-input" name="sort_order" type="number" value={form.sort_order}
                    onChange={handleChange} min={0} />
                </div>
                <div className="flex items-end pb-0.5 gap-2">
                  <input type="checkbox" id="featured" name="featured" checked={form.featured}
                    onChange={handleChange} className="w-4 h-4 accent-indigo-500" />
                  <label htmlFor="featured" className="admin-label mb-0 cursor-pointer">Featured</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Project'}
                </button>
                {editing && (
                  <button type="button" onClick={cancelEdit}
                    className="py-2.5 px-4 rounded-xl font-semibold text-sm"
                    style={{ background: '#1e293b', color: '#94a3b8' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Items grid */}
        <div className="xl:col-span-3">
          {items.length === 0 ? (
            <div className="admin-card text-center py-20">
              <span className="text-4xl mb-4 block">🖼️</span>
              <p className="font-semibold text-white mb-1">No projects yet</p>
              <p className="text-sm" style={{ color: '#475569' }}>Add your first portfolio project using the form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="rounded-xl overflow-hidden"
                  style={{ background: '#0f172a', border: `1px solid ${editing === item.id ? '#6366f1' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="relative" style={{ paddingBottom: '55%', background: '#1e293b' }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ color: '#334155' }}>
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {item.featured && (
                      <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>★ Featured</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-white mb-0.5">{item.title}</h3>
                    <p className="text-xs mb-2" style={{ color: '#475569' }}>{item.category}</p>
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#1e293b', color: '#64748b' }}>{t}</span>)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)}
                        className="flex-1 text-xs py-1.5 rounded-lg font-medium"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        className="text-xs py-1.5 px-3 rounded-lg font-medium"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
