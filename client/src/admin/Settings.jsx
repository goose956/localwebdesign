import { useEffect, useState } from 'react';
import { api } from '../api.js';

const FIELDS = [
  {
    section: 'AI Chatbot',
    icon: '🤖',
    desc: 'Configure the AI-powered chat consultant that appears on your website.',
    fields: [
      {
        key: 'openai_api_key',
        label: 'OpenAI API Key',
        placeholder: 'sk-proj-…',
        type: 'password',
        sensitive: true,
        hint: (
          <>
            Get your key at{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: '#6366f1' }}>
              platform.openai.com/api-keys
            </a>
            . The chatbot uses <strong>gpt-4o-mini</strong> — very low cost (fractions of a penny per chat).
          </>
        ),
      },
      {
        key: 'chatbot_goal',
        label: 'Conversation Goal',
        placeholder: 'e.g. Guide the visitor towards choosing and signing up for one of our plans by directing them to the Pricing page.',
        type: 'textarea',
        hint: 'This is the AI\'s primary objective for every chat. Be specific — it gets injected directly into the AI\'s instructions.',
      },
      {
        key: 'chatbot_name',
        label: 'Chatbot Name',
        placeholder: 'Alex',
        type: 'text',
        hint: 'The name displayed in the chat widget header.',
      },
      {
        key: 'chatbot_greeting',
        label: 'Opening Greeting',
        placeholder: "Hi! I'm Alex, your web design consultant 👋…",
        type: 'textarea',
        hint: 'The first message visitors see when they open the chat.',
      },
    ],
  },
  {
    section: 'Company Details',
    icon: '🏢',
    desc: 'Used by the AI chatbot when answering questions about contacting you.',
    fields: [
      { key: 'company_name',  label: 'Company Name',  placeholder: 'OpenTwentyFour',               type: 'text' },
      { key: 'company_email', label: 'Email Address', placeholder: 'hello@opentwentyfour.co.uk',  type: 'text' },
      { key: 'company_phone', label: 'Phone Number',  placeholder: '+44 (0) 7700 900 123',        type: 'text' },
    ],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [editing, setEditing]   = useState({}); // key → { value, show }
  const [saving, setSaving]     = useState({});
  const [msgs, setMsgs]         = useState({});

  const load = () => api.get('/settings').then(setSettings).catch(() => {});
  useEffect(() => { load(); }, []);

  const flash = (key, m) => {
    setMsgs(p => ({ ...p, [key]: m }));
    setTimeout(() => setMsgs(p => { const n = { ...p }; delete n[key]; return n; }), 3000);
  };

  const startEdit = (key, currentMasked) => {
    setEditing(p => ({ ...p, [key]: { value: '', show: false } }));
  };

  const cancelEdit = (key) => {
    setEditing(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const saveField = async (key) => {
    const value = editing[key]?.value ?? '';
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await api.put(`/settings/${key}`, { value });
      cancelEdit(key);
      await load();
      flash(key, 'Saved ✓');
    } catch (err) {
      flash(key, err.message);
    }
    setSaving(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const clearField = async (key) => {
    if (!confirm('Clear this setting?')) return;
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await api.delete(`/settings/${key}`);
      await load();
      flash(key, 'Cleared');
    } catch {}
    setSaving(p => { const n = { ...p }; delete n[key]; return n; });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Manage API keys and configuration. Sensitive values are stored securely on the server and never exposed in the browser.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {FIELDS.map(section => (
          <div key={section.section} className="admin-card">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{section.icon}</span>
              <div>
                <h2 className="font-semibold text-white text-base">{section.section}</h2>
                <p className="text-xs" style={{ color: '#475569' }}>{section.desc}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
              {section.fields.map(field => {
                const s = settings[field.key];
                const isSet = s?.isSet;
                const maskedVal = s?.value || '';
                const isEditing = field.key in editing;
                const isSaving = saving[field.key];
                const msg = msgs[field.key];

                return (
                  <div key={field.key}>
                    <label className="admin-label">{field.label}</label>

                    {/* Current status row */}
                    {!isEditing && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 admin-input flex items-center gap-2 cursor-default"
                          style={{ minHeight: 42 }}>
                          {isSet ? (
                            <>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                              <span className="font-mono text-sm" style={{ color: '#94a3b8' }}>
                                {field.sensitive ? maskedVal : maskedVal}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#475569' }} />
                              <span className="text-sm italic" style={{ color: '#475569' }}>Not set</span>
                            </>
                          )}
                        </div>
                        <button onClick={() => startEdit(field.key)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                          {isSet ? 'Update' : 'Set'}
                        </button>
                        {isSet && (
                          <button onClick={() => clearField(field.key)}
                            className="px-3 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    {/* Edit row */}
                    {isEditing && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {field.type === 'textarea' ? (
                            <textarea
                              className="admin-input resize-none flex-1"
                              rows={3}
                              autoFocus
                              value={editing[field.key].value}
                              onChange={e => setEditing(p => ({ ...p, [field.key]: { ...p[field.key], value: e.target.value } }))}
                              placeholder={field.placeholder}
                            />
                          ) : (
                            <div className="flex-1 relative">
                              <input
                                className="admin-input w-full pr-10"
                                type={field.sensitive && !editing[field.key].show ? 'password' : 'text'}
                                autoFocus
                                value={editing[field.key].value}
                                onChange={e => setEditing(p => ({ ...p, [field.key]: { ...p[field.key], value: e.target.value } }))}
                                placeholder={field.placeholder}
                                autoComplete="off"
                              />
                              {field.sensitive && (
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                  style={{ color: '#475569' }}
                                  onClick={() => setEditing(p => ({ ...p, [field.key]: { ...p[field.key], show: !p[field.key].show } }))}
                                >
                                  {editing[field.key].show ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveField(field.key)} disabled={isSaving}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            {isSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => cancelEdit(field.key)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{ background: '#1e293b', color: '#94a3b8' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hint text */}
                    {field.hint && (
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#334155' }}>{field.hint}</p>
                    )}

                    {/* Flash message */}
                    {msg && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: msg.includes('✓') ? '#34d399' : '#f87171' }}>
                        {msg}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Security note */}
        <EmailOctopusSection settings={settings} onSave={load} />

        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-lg flex-shrink-0">🔒</span>
          <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
            Sensitive values like API keys are stored in your server database and never sent to the browser. They are masked in this interface after saving. Your OpenAI key is only used server-side to power the chat.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── EmailOctopus dedicated section ── */
function EmailOctopusSection({ settings, onSave }) {
  const eoKey     = settings['emailoctopus_api_key'];
  const eoListId  = settings['emailoctopus_list_id'];
  const eoListName= settings['emailoctopus_list_name'];
  const eoEnabled = settings['emailoctopus_enabled'];

  const isKeySet     = eoKey?.isSet;
  const isConfigured = isKeySet && eoListId?.isSet;
  const isEnabled    = eoEnabled?.value === '1';

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey]         = useState(false);
  const [editingKey, setEditingKey]   = useState(false);
  const [lists, setLists]             = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [listError, setListError]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const saveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    try {
      await api.put('/settings/emailoctopus_api_key', { value: apiKeyInput.trim() });
      setEditingKey(false);
      setApiKeyInput('');
      await onSave();
      flash('API key saved ✓');
    } catch (err) { flash(err.message); }
    setSaving(false);
  };

  const loadLists = async () => {
    setLoadingLists(true);
    setListError('');
    try {
      const data = await api.get('/emailoctopus/lists');
      setLists(data);
      if (data.length === 0) setListError('No lists found in your EmailOctopus account.');
    } catch (err) { setListError(err.message); }
    setLoadingLists(false);
  };

  const selectList = async (list) => {
    setSaving(true);
    try {
      await Promise.all([
        api.put('/settings/emailoctopus_list_id',   { value: list.id }),
        api.put('/settings/emailoctopus_list_name', { value: list.name }),
      ]);
      await onSave();
      flash(`List "${list.name}" selected ✓`);
    } catch (err) { flash(err.message); }
    setSaving(false);
  };

  const toggleEnabled = async () => {
    setSaving(true);
    try {
      await api.put('/settings/emailoctopus_enabled', { value: isEnabled ? '0' : '1' });
      await onSave();
    } catch {}
    setSaving(false);
  };

  const clearAll = async () => {
    if (!confirm('Disconnect EmailOctopus?')) return;
    await Promise.all([
      api.delete('/settings/emailoctopus_api_key'),
      api.delete('/settings/emailoctopus_list_id'),
      api.delete('/settings/emailoctopus_list_name'),
      api.delete('/settings/emailoctopus_enabled'),
    ]).catch(() => {});
    setLists([]);
    await onSave();
  };

  return (
    <div className="admin-card">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🐙</span>
        <div className="flex-1">
          <h2 className="font-semibold text-white text-base">EmailOctopus</h2>
          <p className="text-xs" style={{ color: '#475569' }}>
            Auto-subscribe contact form enquiries to your EmailOctopus list.
          </p>
        </div>
        {isConfigured && (
          <button onClick={clearAll} className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>Disconnect</button>
        )}
      </div>

      {msg && (
        <p className="text-xs font-semibold mb-3 mt-1" style={{ color: msg.includes('✓') ? '#34d399' : '#f87171' }}>{msg}</p>
      )}

      <div className="mt-5 flex flex-col gap-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>

        {/* Step 1: API Key */}
        <div>
          <label className="admin-label">Step 1 — API Key</label>
          {!editingKey ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 admin-input flex items-center gap-2" style={{ minHeight: 42 }}>
                {isKeySet ? (
                  <><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                  <span className="font-mono text-sm" style={{ color: '#94a3b8' }}>{eoKey.value}</span></>
                ) : (
                  <><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#475569' }} />
                  <span className="text-sm italic" style={{ color: '#475569' }}>Not set</span></>
                )}
              </div>
              <button onClick={() => setEditingKey(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                {isKeySet ? 'Update' : 'Set'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  className="admin-input w-full pr-10"
                  type={showKey ? 'text' : 'password'}
                  autoFocus
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="Your EmailOctopus API key"
                  autoComplete="off"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}
                  onClick={() => setShowKey(v => !v)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showKey
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={saveKey} disabled={saving || !apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : 'Save Key'}
                </button>
                <button onClick={() => { setEditingKey(false); setApiKeyInput(''); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: '#1e293b', color: '#94a3b8' }}>Cancel</button>
              </div>
            </div>
          )}
          <p className="text-xs mt-2 leading-relaxed" style={{ color: '#334155' }}>
            Find your API key at{' '}
            <a href="https://emailoctopus.com/account/api" target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: '#6366f1' }}>emailoctopus.com/account/api</a>
          </p>
        </div>

        {/* Step 2: Choose list */}
        {isKeySet && (
          <div>
            <label className="admin-label">Step 2 — Choose Your List</label>
            {eoListId?.isSet && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                ✓ Currently using: <strong>{eoListName?.value || eoListId.value}</strong>
              </div>
            )}
            <button onClick={loadLists} disabled={loadingLists}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white mb-3 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {loadingLists ? 'Loading…' : eoListId?.isSet ? '↺ Refresh Lists' : 'Load My Lists'}
            </button>
            {listError && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{listError}</p>}
            {lists.length > 0 && (
              <div className="flex flex-col gap-2">
                {lists.map(list => (
                  <button key={list.id} onClick={() => selectList(list)} disabled={saving}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all"
                    style={{
                      background: eoListId?.value === list.id ? 'rgba(99,102,241,0.15)' : '#0f172a',
                      border: `1px solid ${eoListId?.value === list.id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                      color: '#e2e8f0',
                    }}>
                    <span className="font-medium">{list.name}</span>
                    <span className="text-xs" style={{ color: '#475569' }}>
                      {list.counts?.subscribed ?? 0} subscribers
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Enable */}
        {isConfigured && (
          <div>
            <label className="admin-label">Step 3 — Enable Auto-Subscribe</label>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                  Auto-subscribe contact form submissions
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  When someone fills in the contact form, they're added to your EmailOctopus list tagged <code>website-enquiry</code>
                </p>
              </div>
              <button onClick={toggleEnabled} disabled={saving}
                className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ml-4"
                style={{ background: isEnabled ? '#6366f1' : '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: isEnabled ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
