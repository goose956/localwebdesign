import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

const PAGES_OPTIONS = [
  'Home', 'About Us', 'Services', 'Portfolio / Gallery', 'Testimonials',
  'Blog / News', 'Contact', 'Booking / Appointments', 'FAQs', 'Pricing', 'Team', 'Other',
];

const FEATURES_OPTIONS = [
  'Contact Form', 'Online Booking System', 'Image Gallery', 'Blog / News Section',
  'Social Media Links', 'Google Maps', 'Newsletter Signup', 'Video Integration',
  'Customer Reviews', 'Live Chat', 'Payment / Shop', 'Photo Slideshow', 'Other',
];

const BUDGETS = [
  'Under £500', '£500 – £1,000', '£1,000 – £2,000', '£2,000 – £5,000', '£5,000+', 'Not sure yet',
];

const TIMELINES = [
  'ASAP — within 2 weeks', '1 month', '2–3 months', '3–6 months', 'Flexible / no rush',
];

const INDUSTRIES = [
  'Trades & Construction', 'Hospitality & Food', 'Hair & Beauty', 'Health & Wellness',
  'Legal & Finance', 'Estate Agency', 'Retail', 'Fitness & Sport', 'Automotive',
  'Education & Training', 'Creative & Arts', 'Cleaning & Domestic', 'Other',
];

function ToggleChip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left"
      style={{
        background: selected ? 'var(--gradient)' : 'var(--bg-card)',
        color: selected ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${selected ? 'transparent' : 'var(--border)'}`,
        boxShadow: selected ? '0 4px 12px var(--glow)' : 'none',
      }}
    >
      {selected ? '✓ ' : ''}{label}
    </button>
  );
}

function SectionHeading({ step, title, desc }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
        style={{ background: 'var(--gradient)' }}>
        {step}
      </div>
      <div>
        <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {desc && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>}
      </div>
    </div>
  );
}

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
      style={{ color: 'var(--text-secondary)' }}>
      {label}{required && ' *'}
    </label>
    {children}
  </div>
);

const inputStyle = {
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
};

export default function StartProject() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', business_name: '', business_type: '',
    project_type: '', pages: [], features: [],
    reference_sites: '', style_notes: '', budget: '', timeline: '', extra_info: '',
  });
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleArr = (key, val) => setForm(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrMsg('');
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-6 py-32"
          style={{ background: 'var(--bg-primary)' }}>
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
              <svg className="w-10 h-10" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display font-bold text-3xl mb-4" style={{ color: 'var(--text-primary)' }}>
              Brief Received! 🎉
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              Thank you — we've got everything we need to put together a personalised proposal for you.
              We'll review your brief and be in touch within 24 hours.
            </p>
            <Link to="/" className="btn-primary" style={{ justifyContent: 'center' }}>
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg-primary)' }}>
        {/* Header */}
        <section className="pt-28 pb-10 relative" style={{ background: 'var(--gradient-bg)' }}>
          <div className="orb orb-1" style={{ opacity: 0.08 }} />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative max-w-2xl mx-auto px-6 text-center">
            <h1 className="section-title mb-3">
              Tell Us About Your <span className="gradient-text">Website</span>
            </h1>
            <p className="section-subtitle mx-auto" style={{ fontSize: '1rem' }}>
              Fill in as much or as little as you like — the more detail you give us, the more accurate your quote will be.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6">
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-10">

                {/* Section 1 — Your Details */}
                <div className="glass rounded-2xl p-8">
                  <SectionHeading step="1" title="Your Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Your Name" required>
                      <input className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle} type="text" required maxLength={100}
                        value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder="Jane Smith"
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </Field>
                    <Field label="Email Address" required>
                      <input className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle} type="email" required maxLength={200}
                        value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="jane@example.com"
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </Field>
                    <Field label="Phone Number">
                      <input className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle} type="tel" maxLength={30}
                        value={form.phone} onChange={e => set('phone', e.target.value)}
                        placeholder="+44 7700 900 000"
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </Field>
                    <Field label="Business Name">
                      <input className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle} type="text" maxLength={200}
                        value={form.business_name} onChange={e => set('business_name', e.target.value)}
                        placeholder="Acme Plumbing Ltd"
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </Field>
                  </div>
                </div>

                {/* Section 2 — Your Business */}
                <div className="glass rounded-2xl p-8">
                  <SectionHeading step="2" title="Your Business"
                    desc="Help us understand your industry so we can tailor the design." />
                  <div className="flex flex-col gap-5">
                    <Field label="Industry / Business Type">
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRIES.map(ind => (
                          <ToggleChip key={ind} label={ind}
                            selected={form.business_type === ind}
                            onToggle={() => set('business_type', form.business_type === ind ? '' : ind)} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Project Type">
                      <div className="flex flex-wrap gap-2">
                        {['Brand new website', 'Redesign of existing site', 'Not sure yet'].map(t => (
                          <ToggleChip key={t} label={t}
                            selected={form.project_type === t}
                            onToggle={() => set('project_type', form.project_type === t ? '' : t)} />
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Section 3 — Pages & Features */}
                <div className="glass rounded-2xl p-8">
                  <SectionHeading step="3" title="Pages & Features"
                    desc="Select everything you'd like included — don't worry if you're not sure on some." />
                  <div className="flex flex-col gap-6">
                    <Field label="Pages needed">
                      <div className="flex flex-wrap gap-2">
                        {PAGES_OPTIONS.map(p => (
                          <ToggleChip key={p} label={p}
                            selected={form.pages.includes(p)}
                            onToggle={() => toggleArr('pages', p)} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Features required">
                      <div className="flex flex-wrap gap-2">
                        {FEATURES_OPTIONS.map(f => (
                          <ToggleChip key={f} label={f}
                            selected={form.features.includes(f)}
                            onToggle={() => toggleArr('features', f)} />
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Section 4 — Design Preferences */}
                <div className="glass rounded-2xl p-8">
                  <SectionHeading step="4" title="Design Preferences"
                    desc="This helps us match the style and feel to your brand." />
                  <div className="flex flex-col gap-5">
                    <Field label="Any websites you like the look of?">
                      <textarea className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                        style={inputStyle} rows={3}
                        value={form.reference_sites} onChange={e => set('reference_sites', e.target.value)}
                        maxLength={500}
                        placeholder="e.g. www.example.com — I like the clean layout&#10;www.another.com — love the colours"
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </Field>
                    <Field label="Colours, style or brand notes">
                      <textarea className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                        style={inputStyle} rows={3}
                        value={form.style_notes} onChange={e => set('style_notes', e.target.value)}
                        maxLength={1000}
                        placeholder="e.g. Our brand colours are navy and gold. We want something modern and professional, not too corporate."
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </Field>
                  </div>
                </div>

                {/* Section 5 — Budget & Timeline */}
                <div className="glass rounded-2xl p-8">
                  <SectionHeading step="5" title="Budget & Timeline" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field label="Budget range">
                      <div className="flex flex-col gap-2">
                        {BUDGETS.map(b => (
                          <ToggleChip key={b} label={b}
                            selected={form.budget === b}
                            onToggle={() => set('budget', form.budget === b ? '' : b)} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Ideal timeline">
                      <div className="flex flex-col gap-2">
                        {TIMELINES.map(t => (
                          <ToggleChip key={t} label={t}
                            selected={form.timeline === t}
                            onToggle={() => set('timeline', form.timeline === t ? '' : t)} />
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Section 6 — Anything else */}
                <div className="glass rounded-2xl p-8">
                  <SectionHeading step="6" title="Anything Else?"
                    desc="Any other details, questions, or things we should know about your project." />
                  <textarea className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                    style={inputStyle} rows={5}
                    value={form.extra_info} onChange={e => set('extra_info', e.target.value)}
                    maxLength={2000}
                    placeholder="Tell us anything else that would help — existing website URL, specific requirements, questions you have…"
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {form.extra_info.length}/2000
                  </p>
                </div>

                {/* Submit */}
                {status === 'error' && (
                  <div className="px-5 py-4 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {errMsg}
                  </div>
                )}

                <button type="submit" disabled={status === 'loading'} className="btn-primary w-full"
                  style={{ fontSize: '1.05rem', padding: '1rem', justifyContent: 'center' }}>
                  {status === 'loading' ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Submitting…
                    </>
                  ) : 'Submit My Brief'}
                </button>
                <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  We'll review your brief and get back to you within 24 hours with a personalised quote.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
