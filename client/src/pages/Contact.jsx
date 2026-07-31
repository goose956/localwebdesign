import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import useReveal from '../hooks/useReveal.js';

const services = [
  'New Business Website',
  'Website Redesign',
  'Local SEO Package',
  'Booking System',
  'Other / Not Sure',
];

const contactInfo = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    label: 'Email',
    value: 'hello@opentwentyfour.co.uk',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
    label: 'Phone',
    value: '+44 (0) 7700 900 123',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    label: 'Response Time',
    value: 'Within 24 hours',
  },
];

export default function Contact() {
  const [form, setForm]         = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [status, setStatus]     = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const ref = useReveal();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', service: '', message: '' });
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg-primary)' }}>
        {/* Hero */}
        <section className="page-hero" style={{ background: 'var(--gradient-bg)' }}>
          <div className="orb orb-1" style={{ opacity: 0.1 }} />
          <div className="orb orb-2" style={{ opacity: 0.07 }} />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative max-w-2xl mx-auto px-6">
            <p className="section-label mb-4">Get in Touch</p>
            <h1 className="section-title mb-6">
              Let's Start Your <span className="gradient-text">Project</span>
            </h1>
            <p className="section-subtitle mx-auto">
              Tell us about your project and we'll get back to you within 24 hours with a free, no-obligation quote.
            </p>
          </div>
        </section>

        {/* Form + Info */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

              {/* Left: Contact info */}
              <div className="lg:col-span-2 reveal" ref={ref}>
                <h2 className="font-display font-bold text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
                  How to Reach Us
                </h2>
                <div className="flex flex-col gap-5 mb-10">
                  {contactInfo.map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl glass flex items-center justify-center flex-shrink-0"
                        style={{ color: 'var(--primary)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {icon}
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                          style={{ color: 'var(--text-secondary)' }}>{label}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust signals */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                    Why Choose Us
                  </h3>
                  {[
                    'Free consultation & quote',
                    'No upfront payment required',
                    'You own your website',
                    'Clear timelines & updates',
                    'Post-launch support included',
                  ].map(point => (
                    <div key={point} className="flex items-center gap-3 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Form */}
              <div className="lg:col-span-3">
                <div className="glass rounded-2xl p-8 lg:p-10">
                  {status === 'success' ? (
                    <SuccessMessage />
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField label="Your Name *" id="name">
                          <input
                            id="name" name="name" type="text" value={form.name}
                            onChange={handleChange} required maxLength={100}
                            placeholder="Jane Smith"
                            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                          />
                        </FormField>
                        <FormField label="Email Address *" id="email">
                          <input
                            id="email" name="email" type="email" value={form.email}
                            onChange={handleChange} required maxLength={200}
                            placeholder="jane@example.com"
                            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField label="Phone (optional)" id="phone">
                          <input
                            id="phone" name="phone" type="tel" value={form.phone}
                            onChange={handleChange} maxLength={30}
                            placeholder="+44 7700 900 000"
                            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                          />
                        </FormField>
                        <FormField label="Service Needed" id="service">
                          <select
                            id="service" name="service" value={form.service}
                            onChange={handleChange}
                            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none"
                            style={{ color: form.service ? 'var(--text-primary)' : 'var(--text-secondary)',
                              border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                          >
                            <option value="" style={{ background: 'var(--bg-secondary)' }}>Select a service…</option>
                            {services.map(s => <option key={s} value={s} style={{ background: 'var(--bg-secondary)' }}>{s}</option>)}
                          </select>
                        </FormField>
                      </div>

                      <FormField label="Tell Us About Your Project *" id="message">
                        <textarea
                          id="message" name="message" value={form.message}
                          onChange={handleChange} required maxLength={2000}
                          rows={5}
                          placeholder="Tell us about your business, what you need, any reference sites you like, your budget range, and your timeline…"
                          className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                          style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                        <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-secondary)' }}>
                          {form.message.length}/2000
                        </p>
                      </FormField>

                      {status === 'error' && (
                        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          {errorMsg}
                        </div>
                      )}

                      <button type="submit" className="btn-primary w-full" style={{ fontSize: '1rem', padding: '1rem' }}
                        disabled={status === 'loading'}>
                        {status === 'loading' ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Sending…
                          </>
                        ) : 'Send Message'}
                      </button>

                      <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                        We'll respond within 24 hours. No spam, ever.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FormField({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SuccessMessage() {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
        <svg className="w-10 h-10" fill="none" stroke="#10b981" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
        Message Received! 🎉
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Thank you for reaching out! We'll review your project details and get back to you within 24 hours with a personalised response.
      </p>
    </div>
  );
}
