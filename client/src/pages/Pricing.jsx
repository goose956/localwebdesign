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

// Monthly = spread over 6 months (includes ~20% premium for flexibility)
// Yearly  = one-off upfront — shown as per/month equivalent so user can compare
const plans = [
  {
    name: 'Starter',
    tagline: 'Perfect for getting online',
    desc: 'Ideal for local businesses and sole traders who need a professional website fast.',
    monthly: { amount: '80',  total: '960',   label: '12 monthly payments · Total £960' },
    yearly:  { amount: '67',  total: '799',   label: 'One-off payment of £799', saving: '£161', savingPct: '17%' },
    features: [
      'Up to 5 pages',
      'Mobile-responsive design',
      'Contact form',
      'Basic on-page SEO & Google listing',
      'Google Analytics setup',
      '3 revision rounds',
      '30-day post-launch support',
      'SSL & hosting guidance',
    ],
    notIncluded: ['Blog / News section', 'Booking system'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    tagline: 'Most popular',
    desc: 'The complete package for local businesses that want to stand out and win more customers.',
    monthly: { amount: '150', total: '1,800', label: '12 monthly payments · Total £1,800' },
    yearly:  { amount: '125', total: '1,499', label: 'One-off payment of £1,499', saving: '£301', savingPct: '17%' },
    features: [
      'Up to 10 pages',
      'Mobile-responsive design',
      'Contact form + booking system',
      'Advanced local SEO',
      'Custom animations & interactions',
      'Blog / News section',
      'Google Analytics + Search Console',
      '5 revision rounds',
      '60-day post-launch support',
      'Speed & performance optimisation',
    ],
    notIncluded: [],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For ambitious businesses',
    desc: 'Fully bespoke builds for businesses that want everything done properly, end to end.',
    monthly: { amount: '300', total: '3,600', label: 'From 12 monthly payments · Total from £3,600', prefix: 'from' },
    yearly:  { amount: '250', total: '2,999', label: 'One-off payment from £2,999', saving: 'from £601', savingPct: '17%', prefix: 'from' },
    features: [
      'Unlimited pages',
      'Advanced booking & enquiry systems',
      'Custom integrations & automations',
      'Advanced animations',
      'CMS for easy content editing',
      'Priority local SEO',
      'Unlimited revision rounds',
      '12-month priority support',
      'Monthly maintenance option',
      'Dedicated project manager',
    ],
    notIncluded: [],
    cta: "Let's Talk",
    popular: false,
  },
];

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        {pricing.prefix && (
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>{pricing.prefix}</p>
        )}
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
          Save {pricing.saving} vs monthly · No subscription
        </div>
      )}

      {!isYearly && (
        <div className="mb-5 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(99,102,241,0.07)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          💡 Switch to Yearly to save {plan.yearly.saving}
        </div>
      )}

      <div className="flex flex-col gap-3 mb-8 flex-1">
        {plan.features.map(f => (
          <div key={f} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--primary)' }}><CheckIcon /></span>
            {f}
          </div>
        ))}
        {plan.notIncluded.map(f => (
          <div key={f} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <CrossIcon />
            {f}
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
          <div className="relative max-w-3xl mx-auto px-6">
            <p className="section-label mb-4">Transparent Pricing</p>
            <h1 className="section-title mb-6">
              Simple Pricing,<br />
              <span className="gradient-text">Exceptional Results</span>
            </h1>
            <p className="section-subtitle mx-auto">
              No hidden fees. No confusing jargon. Pay upfront or spread the cost — your choice.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="py-20 relative">
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

            {/* Context banner */}
            <div className="max-w-2xl mx-auto mb-10">
              {billing === 'yearly' ? (
                <div className="text-center px-5 py-3.5 rounded-2xl text-sm"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <strong>Yearly (one-off payment)</strong> — a single upfront fee. No monthly bills, no subscriptions. You own your website outright from day one.
                </div>
              ) : (
                <div className="text-center px-5 py-3.5 rounded-2xl text-sm"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <strong>Monthly</strong> — pay in 12 equal monthly instalments. Same great service, easier on cash flow.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <PricingCard key={plan.name} plan={plan} billing={billing} delay={i * 100} onSelect={setSelectedPlan} />
              ))}
            </div>

            <div className="mt-14 text-center reveal" ref={ref}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                All prices exclude ongoing hosting and domain costs.{' '}
                <Link to="/contact" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                  Get in touch
                </Link>{' '}
                for a custom quote tailored to your business.
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
          <h2 className="section-title">The <span className="gradient-text">Pixel&amp;Craft</span> Standard</h2>
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
