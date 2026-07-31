import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CTA from '../components/CTA.jsx';
import useReveal from '../hooks/useReveal.js';

/* ── Plan sign-up modal ── */
function PlanModal({ plan, onClose }) {
  const [form, setForm]     = useState({ name: '', email: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/plan-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: plan.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 relative"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>✕</button>

        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>You're in! 🎉</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              We've got your details for the <strong style={{ color: 'var(--primary)' }}>{plan.name}</strong> plan.
              We'll be in touch within 24 hours to get things moving.
            </p>
            <button onClick={onClose} className="btn-primary mt-6 w-full" style={{ justifyContent: 'center' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1">
              <span className="section-label">{plan.tagline}</span>
            </div>
            <h3 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
              Get Started with {plan.name}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Leave your details and we'll be in touch within 24 hours to kick things off.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: 'var(--text-secondary)' }}>Your Name *</label>
                <input
                  type="text" required maxLength={100}
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full glass rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: 'var(--text-secondary)' }}>Email Address *</label>
                <input
                  type="email" required maxLength={200}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className="w-full glass rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              {status === 'error' && (
                <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {errMsg}
                </p>
              )}
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full mt-1"
                style={{ justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}>
                {status === 'loading' ? 'Sending…' : `Get Started with ${plan.name}`}
              </button>
              <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                No commitment — we'll chat first and make sure it's the right fit.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Ongoing monthly service, not a one-off build cost — Monthly = pay-as-you-go; Yearly = paid
// upfront for the year at ~15% off (still a subscription, just billed annually, unlike the
// old one-off/ownership framing this replaced).
const plans = [
  {
    name: 'Starter AI',
    tagline: 'Never miss an enquiry',
    desc: 'A beautiful website plus an AI chat assistant that captures every enquiry — perfect for getting started.',
    monthly: { amount: '40', label: 'Billed monthly' },
    yearly:  { amount: '34', label: 'Billed annually · £408 total', saving: '£72', savingPct: '15%' },
    groups: [
      { title: 'Attract new customers', items: ['Beautiful, professionally designed website'] },
      { title: 'Respond', items: ['AI chat assistant', "Never miss a job — any enquiry texted direct to your mobile"] },
      { title: 'Hosting', items: ['Unlimited AI chat responses', 'Full web support'] },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Voice Receptionist AI',
    tagline: 'Chat & voice',
    desc: 'Everything in Starter, plus a real AI voice receptionist that answers your phone around the clock.',
    monthly: { amount: '130', label: 'Billed monthly' },
    yearly:  { amount: '110', label: 'Billed annually · £1,320 total', saving: '£240', savingPct: '15%' },
    groups: [
      { title: 'Attract new customers', items: ['Beautiful, professionally designed website'] },
      { title: 'Respond', items: ['AI chat AND voice assistant', "Never miss a job — any enquiry texted direct to your mobile"] },
      { title: 'Hosting', items: ['Unlimited AI chat responses', '200 minutes/month voice agent credits', 'Full web support'] },
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Voice AI & Agent',
    tagline: 'Full autopilot growth',
    desc: 'Everything in Voice Receptionist, plus an AI agent that chases reviews, creates content, and posts to social — all on autopilot.',
    monthly: { amount: '499', label: 'Billed monthly' },
    yearly:  { amount: '424', label: 'Billed annually · £5,088 total', saving: '£900', savingPct: '15%' },
    groups: [
      { title: 'Attract new customers', items: ['Beautiful, professionally designed website'] },
      { title: 'Respond', items: ['AI chat AND voice assistant', "Never miss a job — any enquiry texted direct to your mobile"] },
      { title: 'Agent', items: [
        'Asks for and follows up reviews with customers (big for local search ranking)',
        'Creates content on autopilot to dominate local search',
        'Auto-posts to social media to showcase your latest work',
      ] },
      { title: 'Hosting', items: ['Unlimited AI chat responses', '1000 minutes/month voice agent credits', 'Full web support'] },
    ],
    cta: "Let's Talk",
    popular: false,
  },
];

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

function PricingCard({ plan, billing, delay, onSelect }) {
  const ref = useReveal();
  const pricing = billing === 'monthly' ? plan.monthly : plan.yearly;
  const isYearly = billing === 'yearly';

  return (
    <div
      className={`glass rounded-2xl p-8 flex flex-col reveal ${plan.popular ? 'pricing-popular' : 'glass-hover'}`}
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, position: 'relative', overflow: 'hidden' }}
    >
      {plan.popular && (
        <div className="absolute top-6 right-6">
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
            style={{ background: 'var(--gradient)' }}>
            ★ Most Popular
          </span>
        </div>
      )}
      {plan.popular && (
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'var(--gradient)' }} />
      )}

      <p className="section-label mb-2">{plan.tagline}</p>
      <h3 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
        {plan.name}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{plan.desc}</p>

      {/* Price block */}
      <div className="mb-5">
        <div className="flex items-end gap-1 mb-1">
          <span className="font-display font-bold" style={{ fontSize: '3rem', lineHeight: 1, color: 'var(--text-primary)' }}>
            £{pricing.amount}
          </span>
          <span className="text-lg font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>/mo</span>
        </div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {pricing.label}
        </p>
      </div>

      {/* Saving badge — only on yearly */}
      {isYearly && pricing.saving && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Save {pricing.saving}/yr vs paying monthly
        </div>
      )}

      {!isYearly && (
        <div className="mb-5 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(99,102,241,0.07)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          💡 Pay yearly to save {plan.yearly.saving}/yr ({plan.yearly.savingPct} off)
        </div>
      )}

      <div className="flex flex-col gap-5 mb-8 flex-1">
        {plan.groups.map(group => (
          <div key={group.title}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: 'var(--primary)' }}>
              {group.title}
            </p>
            <div className="flex flex-col gap-2.5">
              {group.items.map(item => (
                <div key={item} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--primary)' }}><CheckIcon /></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelect(plan)}
        className={plan.popular ? 'btn-primary' : 'btn-secondary'}
        style={{ textAlign: 'center', justifyContent: 'center', width: '100%' }}
      >
        {plan.cta}
      </button>
    </div>
  );
}

export default function Pricing() {
  const [billing, setBilling]       = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const ref = useReveal();

  return (
    <>
      <Navbar />
      {selectedPlan && <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
      <main style={{ background: 'var(--bg-primary)' }}>
        {/* Hero */}
        <section className="page-hero" style={{ background: 'var(--gradient-bg)' }}>
          <div className="orb orb-1" style={{ opacity: 0.1 }} />
          <div className="orb orb-2" style={{ opacity: 0.07 }} />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative max-w-5xl mx-auto px-6">
            <h1 className="section-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}>
              Simple Pricing, <span className="gradient-text">Exceptional Results</span>
            </h1>
          </div>
        </section>

        {/* Plans */}
        <section className="py-10 relative">
          <div className="max-w-7xl mx-auto px-6">

            {/* Billing toggle */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center p-1 rounded-2xl gap-1"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setBilling('monthly')}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={billing === 'monthly' ? {
                    background: 'var(--gradient)', color: '#fff',
                    boxShadow: '0 4px 16px var(--glow)',
                  } : { color: 'var(--text-secondary)', background: 'transparent' }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={billing === 'yearly' ? {
                    background: 'var(--gradient)', color: '#fff',
                    boxShadow: '0 4px 16px var(--glow)',
                  } : { color: 'var(--text-secondary)', background: 'transparent' }}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <PricingCard key={plan.name} plan={plan} billing={billing} delay={i * 100} onSelect={setSelectedPlan} />
              ))}
            </div>

            {/* Context banner — below the cards */}
            <div className="max-w-2xl mx-auto mt-8">
              {billing === 'yearly' ? (
                <div className="text-center px-5 py-3.5 rounded-2xl text-sm"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <strong>Yearly</strong> — pay upfront for the year and save ~15% vs monthly. Still an ongoing plan, just billed annually.
                </div>
              ) : (
                <div className="text-center px-5 py-3.5 rounded-2xl text-sm"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <strong>Monthly</strong> — pay month to month, cancel any time. Same plan, easier on cash flow.
                </div>
              )}
            </div>

            <div className="mt-14 text-center reveal" ref={ref}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Hosting and web support are included in every plan.{' '}
                <Link to="/contact" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                  Get in touch
                </Link>{' '}
                if you need something custom beyond these plans.
              </p>
            </div>
          </div>
        </section>

        <IncludedSection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

function IncludedSection() {
  const ref = useReveal();
  const perks = [
    { icon: '🤖', title: '24/7 AI Chat', desc: "Chats with visitors around the clock, even when you can't — you're only notified when someone wants to book you." },
    { icon: '🎨', title: 'Custom Design',    desc: 'Every website is uniquely designed for your brand — no templates.' },
    { icon: '📱', title: 'Mobile First',      desc: 'Looks stunning and works perfectly on every device.' },
    { icon: '⚡', title: 'Lightning Fast',    desc: 'Optimised for speed — fast load times improve SEO and conversions.' },
    { icon: '🔍', title: 'SEO Ready',         desc: 'Built with search engines in mind from the very start.' },
    { icon: '🛡️', title: 'Secure & Safe',     desc: 'SSL, secure code practices and regular updates included.' },
    { icon: '🤝', title: 'Ongoing Support',   desc: "We're here after launch too — not just during the build." },
  ];

  return (
    <section className="py-24" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 reveal" ref={ref}>
          <p className="section-label mb-3">Included in Every Plan</p>
          <h2 className="section-title">The <span className="gradient-text">OpenTwentyFour</span> Standard</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {perks.map(({ icon, title, desc }, i) => {
            const pRef = useReveal();
            return (
              <div key={title} className="glass glass-hover rounded-2xl p-6 flex gap-4 reveal"
                ref={pRef} style={{ transitionDelay: `${i * 60}ms` }}>
                <span className="text-3xl flex-shrink-0">{icon}</span>
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
