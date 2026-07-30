import { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_STYLES = {
  'new':         { bg: 'rgba(239,68,68,0.15)',   color: '#f87171',  label: 'New'         },
  'reviewed':    { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa',  label: 'Reviewed'    },
  'in-progress': { bg: 'rgba(245,158,11,0.15)',  color: '#fcd34d',  label: 'In Progress' },
  'completed':   { bg: 'rgba(16,185,129,0.15)',  color: '#34d399',  label: 'Completed'   },
  'archived':    { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8',  label: 'Archived'    },
};

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const Tag = ({ label }) => (
  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
    {label}
  </span>
);

export default function BriefManager() {
  const [briefs, setBriefs]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/briefs').then(data => { setBriefs(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/briefs/${id}/status`, { status }).catch(() => {});
    setBriefs(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
  };

  const deleteBrief = async (id) => {
    if (!confirm('Delete this brief?')) return;
    await api.delete(`/briefs/${id}`).catch(() => {});
    if (selected?.id === id) setSelected(null);
    load();
  };

  const newCount = briefs.filter(b => b.status === 'new').length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Project Briefs</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Website questionnaires submitted by clients. {briefs.length} total
            {newCount > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>{newCount} new</span>}
          </p>
        </div>
        <a href="/start-project" target="_blank" rel="noopener noreferrer"
          className="text-sm px-4 py-2 rounded-xl font-semibold"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
          View Form ↗
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
        </div>
      ) : briefs.length === 0 ? (
        <div className="admin-card text-center py-24">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="font-semibold text-white mb-2">No briefs yet</p>
          <p className="text-sm mb-4" style={{ color: '#475569' }}>
            Share the form URL with clients to start receiving project briefs.
          </p>
          <a href="/start-project" target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold underline" style={{ color: '#6366f1' }}>
            /start-project ↗
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* List */}
          <div className="xl:col-span-2 flex flex-col gap-3">
            {briefs.map(brief => {
              const st = STATUS_STYLES[brief.status] || STATUS_STYLES.new;
              return (
                <div key={brief.id}
                  onClick={() => setSelected(brief)}
                  className="rounded-xl p-4 cursor-pointer transition-all"
                  style={{
                    background: selected?.id === brief.id ? '#162032' : '#0f172a',
                    border: `1px solid ${selected?.id === brief.id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-white">{brief.name}</p>
                      <p className="text-xs" style={{ color: '#475569' }}>{brief.business_name || brief.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      <span className="text-xs" style={{ color: '#334155' }}>{fmt(brief.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {brief.business_type && <Tag label={brief.business_type} />}
                    {brief.project_type  && <Tag label={brief.project_type} />}
                    {brief.budget        && <Tag label={brief.budget} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="xl:col-span-3">
            {!selected ? (
              <div className="admin-card flex flex-col items-center justify-center py-20 text-center sticky top-4">
                <span className="text-4xl mb-4">👈</span>
                <p className="font-semibold text-white mb-1">Select a brief to read</p>
                <p className="text-sm" style={{ color: '#475569' }}>Click any submission on the left to see the full details.</p>
              </div>
            ) : (
              <div className="admin-card sticky top-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-5 pb-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h2 className="font-display font-bold text-xl text-white">{selected.name}</h2>
                    {selected.business_name && <p className="text-sm" style={{ color: '#94a3b8' }}>{selected.business_name}</p>}
                    <p className="text-xs mt-1" style={{ color: '#475569' }}>Submitted {fmt(selected.created_at)}</p>
                  </div>
                  <button onClick={() => deleteBrief(selected.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 ml-4"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>Delete</button>
                </div>

                {/* Status selector */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {Object.entries(STATUS_STYLES).map(([val, s]) => (
                    <button key={val} onClick={() => updateStatus(selected.id, val)}
                      className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                      style={{
                        background: selected.status === val ? s.bg : '#1e293b',
                        color: selected.status === val ? s.color : '#475569',
                        border: `1px solid ${selected.status === val ? s.color + '40' : 'transparent'}`,
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-5 max-h-[600px] overflow-y-auto pr-1">
                  <BriefRow label="Email">
                    <a href={`mailto:${selected.email}`} style={{ color: '#6366f1' }}>{selected.email}</a>
                  </BriefRow>
                  {selected.phone        && <BriefRow label="Phone">{selected.phone}</BriefRow>}
                  {selected.business_type&& <BriefRow label="Industry">{selected.business_type}</BriefRow>}
                  {selected.project_type && <BriefRow label="Project Type">{selected.project_type}</BriefRow>}

                  {selected.pages?.length > 0 && (
                    <BriefRow label="Pages Needed">
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selected.pages.map(p => <Tag key={p} label={p} />)}
                      </div>
                    </BriefRow>
                  )}

                  {selected.features?.length > 0 && (
                    <BriefRow label="Features Required">
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selected.features.map(f => <Tag key={f} label={f} />)}
                      </div>
                    </BriefRow>
                  )}

                  {selected.reference_sites && <BriefRow label="Reference Sites"><Prose>{selected.reference_sites}</Prose></BriefRow>}
                  {selected.style_notes     && <BriefRow label="Style / Brand Notes"><Prose>{selected.style_notes}</Prose></BriefRow>}
                  {selected.budget          && <BriefRow label="Budget">{selected.budget}</BriefRow>}
                  {selected.timeline        && <BriefRow label="Timeline">{selected.timeline}</BriefRow>}
                  {selected.extra_info      && <BriefRow label="Additional Info"><Prose>{selected.extra_info}</Prose></BriefRow>}
                </div>

                {/* Reply button */}
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <a href={`mailto:${selected.email}?subject=Re: Your Website Brief — ${selected.business_name || selected.name}`}
                    className="btn-primary w-full" style={{ justifyContent: 'center' }}>
                    Reply by Email
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const BriefRow = ({ label, children }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#475569' }}>{label}</p>
    <div className="text-sm" style={{ color: '#e2e8f0' }}>{children}</div>
  </div>
);

const Prose = ({ children }) => (
  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#94a3b8' }}>{children}</p>
);
