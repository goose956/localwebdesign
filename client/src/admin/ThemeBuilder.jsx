import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';

const PRESET_KEYS = [
  { key: 'primary',      label: 'Primary',         desc: 'Main brand colour' },
  { key: 'primaryDark',  label: 'Primary Dark',     desc: 'Hover / dark variant' },
  { key: 'secondary',    label: 'Secondary',        desc: 'Accent complement' },
  { key: 'accent',       label: 'Accent',           desc: 'Highlights & stars' },
  { key: 'bgPrimary',    label: 'Background',       desc: 'Main background' },
  { key: 'bgSecondary',  label: 'Background Alt',   desc: 'Section backgrounds' },
  { key: 'textPrimary',  label: 'Text Primary',     desc: 'Headings & body' },
  { key: 'textSecondary',label: 'Text Secondary',   desc: 'Captions & muted text' },
  { key: 'border',       label: 'Border',           desc: 'Card & divider lines' },
  { key: 'borderHover',  label: 'Border Hover',     desc: 'Hover / focus lines' },
];

export default function ThemeBuilder() {
  const { loadActiveTheme, applyTheme } = useTheme();
  const [themes, setThemes]     = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [editing, setEditing]   = useState(null); // { id, name, config } | null
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  const load = () => api.get('/themes').then(data => {
    setThemes(data);
    const active = data.find(t => t.is_active);
    if (active) setActiveId(active.id);
  }).catch(() => {});

  useEffect(() => { load(); }, []);

  const activate = async (id) => {
    await api.put(`/themes/activate/${id}`).catch(() => {});
    setActiveId(id);
    const t = themes.find(t => t.id === id);
    if (t) applyTheme(t.config);
    await loadActiveTheme();
    flash('Theme activated!');
    load();
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/themes/${editing.id}`, { name: editing.name, config: editing.config });
      if (activeId === editing.id) applyTheme(editing.config);
      flash('Theme saved!');
      setEditing(null);
      load();
    } catch { flash('Failed to save.'); }
    setSaving(false);
  };

  const createTheme = async () => {
    if (!newName.trim()) return;
    const base = themes.find(t => t.slug === 'midnight') || themes[0];
    const config = base ? { ...base.config } : {};
    setSaving(true);
    try {
      await api.post('/themes', { name: newName, config });
      setNewName(''); setCreating(false);
      flash('Custom theme created!');
      load();
    } catch { flash('Failed to create.'); }
    setSaving(false);
  };

  const deleteTheme = async (id) => {
    if (!confirm('Delete this theme?')) return;
    await api.delete(`/themes/${id}`).catch(() => {});
    if (editing?.id === id) setEditing(null);
    flash('Deleted.');
    load();
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const updateConfig = (key, val) => {
    setEditing(e => ({ ...e, config: { ...e.config, [key]: val } }));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Theme Builder</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Choose a preset or build your own colour scheme.</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-xl font-semibold text-white text-sm flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          + New Custom Theme
        </button>
      </div>

      {msg && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
          {msg}
        </div>
      )}

      {/* New theme modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-2xl p-8 w-full max-w-sm" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="font-semibold text-white mb-4">New Custom Theme</h3>
            <label className="admin-label">Theme Name</label>
            <input className="admin-input mb-5" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My Brand Theme" />
            <p className="text-xs mb-5" style={{ color: '#475569' }}>It will be created based on the Midnight Purple preset. You can edit the colours after.</p>
            <div className="flex gap-3">
              <button onClick={createTheme} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button onClick={() => setCreating(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: '#1e293b', color: '#94a3b8' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme cards list */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide mb-1" style={{ color: '#475569' }}>
            Available Themes
          </h2>
          {themes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={theme.id === activeId}
              onActivate={() => activate(theme.id)}
              onEdit={() => setEditing({ ...theme, config: { ...theme.config } })}
              onDelete={!theme.is_preset ? () => deleteTheme(theme.id) : null}
            />
          ))}
        </div>

        {/* Editor panel */}
        <div>
          {editing ? (
            <div className="admin-card sticky top-4">
              <h2 className="font-semibold text-white mb-1">
                Editing: <span style={{ color: '#6366f1' }}>{editing.name}</span>
              </h2>
              <p className="text-xs mb-5" style={{ color: '#475569' }}>
                Changes apply live to the website when you save.
              </p>

              {/* Name */}
              <label className="admin-label">Theme Name</label>
              <input className="admin-input mb-4"
                value={editing.name}
                onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))} />

              {/* Colour pickers */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {PRESET_KEYS.map(({ key, label, desc }) => (
                  <div key={key}>
                    <label className="admin-label">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editing.config[key]?.startsWith('#') ? editing.config[key] : '#6366f1'}
                        onChange={e => updateConfig(key, e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                        style={{ outline: 'none' }}
                      />
                      <input
                        type="text"
                        value={editing.config[key] || ''}
                        onChange={e => updateConfig(key, e.target.value)}
                        className="admin-input text-xs flex-1"
                        placeholder="#000000"
                      />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#334155' }}>{desc}</p>
                  </div>
                ))}
              </div>

              {/* Gradient editor */}
              <label className="admin-label">Gradient (CSS value)</label>
              <input className="admin-input mb-2 text-xs font-mono"
                value={editing.config.gradient || ''}
                onChange={e => updateConfig('gradient', e.target.value)}
                placeholder="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" />

              {/* Preview strip */}
              <div className="h-6 rounded-lg mb-4" style={{ background: editing.config.gradient || 'var(--gradient)' }} />

              <div className="flex gap-3">
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(null)} className="py-2.5 px-4 rounded-xl font-semibold text-sm"
                  style={{ background: '#1e293b', color: '#94a3b8' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-card flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-4">🎨</span>
              <p className="font-semibold text-white mb-2">Select a theme to edit</p>
              <p className="text-sm" style={{ color: '#475569' }}>Click "Edit" on any theme to customise its colours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, isActive, onActivate, onEdit, onDelete }) {
  const config = theme.config;
  return (
    <div className="rounded-xl p-4 flex items-center gap-4 transition-all"
      style={{
        background: '#0f172a',
        border: `1px solid ${isActive ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isActive ? '0 0 0 1px #6366f1' : 'none',
      }}>
      {/* Gradient swatch */}
      <div className="w-14 h-10 rounded-lg flex-shrink-0" style={{ background: config.gradient }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-white">{theme.name}</span>
          {theme.is_preset ? (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e293b', color: '#475569' }}>Preset</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>Custom</span>
          )}
          {isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>● Active</span>
          )}
        </div>
        {/* Colour dots */}
        <div className="flex gap-1.5 mt-2">
          {[config.primary, config.secondary, config.accent, config.bgPrimary].filter(Boolean).map((c, i) => (
            <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {!isActive && (
          <button onClick={onActivate} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            Activate
          </button>
        )}
        <button onClick={onEdit} className="text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: '#1e293b', color: '#94a3b8' }}>
          Edit
        </button>
        {onDelete && (
          <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}
