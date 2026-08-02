import { useEffect, useState } from 'react';
import { api } from '../api.js';

const PLAN_META = [
  { key: 'starter', name: 'Starter AI',            tagline: 'Never miss an enquiry' },
  { key: 'voice',   name: 'Voice Receptionist AI', tagline: 'Chat & voice' },
  { key: 'agent',   name: 'Voice AI & Agent',      tagline: 'Full autopilot growth' },
];

export default function PricingManager() {
  const [pricing, setPricing] = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const load = () => api.get('/pricing').then(data => { setPricing(data); setForm(data); });
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const setAmount = (plan, billing, value) => {
    setForm(f => ({ ...f, [plan]: { ...f[plan], [billing]: value } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      for (const { key } of PLAN_META) {
        payload[key] = {
          monthly: Number(form[key]?.monthly),
          yearly:  Number(form[key]?.yearly),
        };
      }
      await api.put('/pricing', payload);
      await load();
      flash('Pricing updated ✓');
    } catch (err) {
      flash(err.message);
    }
    setSaving(false);
  };

  if (!pricing) return <div style={{ color: '#64748b' }}>Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Pricing</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Set the monthly and annual price for each plan on the public Pricing page. Changes apply immediately — no redeploy needed.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {PLAN_META.map(({ key, name, tagline }) => (
          <div key={key} className="admin-card">
            <div className="mb-4">
              <h2 className="font-semibold text-white text-base">{name}</h2>
              <p className="text-xs" style={{ color: '#475569' }}>{tagline}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Monthly (£)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="admin-input w-full"
                  value={form[key]?.monthly ?? ''}
                  onChange={e => setAmount(key, 'monthly', e.target.value)}
                />
                <p className="text-xs mt-1" style={{ color: '#334155' }}>Price shown when billed monthly</p>
              </div>
              <div>
                <label className="admin-label">Yearly — per month (£)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="admin-input w-full"
                  value={form[key]?.yearly ?? ''}
                  onChange={e => setAmount(key, 'yearly', e.target.value)}
                />
                <p className="text-xs mt-1" style={{ color: '#334155' }}>
                  Billed as £{((Number(form[key]?.yearly) || 0) * 12).toFixed(2)}/year total
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {saving ? 'Saving…' : 'Save Pricing'}
          </button>
          {msg && (
            <span className="text-xs font-semibold" style={{ color: msg.includes('✓') ? '#34d399' : '#f87171' }}>{msg}</span>
          )}
        </div>

        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-lg flex-shrink-0">💳</span>
          <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
            These amounts feed both the public Pricing page and Stripe Checkout, so customers always pay whatever is set here. Connect your Stripe account under Settings to start accepting payments.
          </p>
        </div>
      </div>
    </div>
  );
}
