import useReveal from '../hooks/useReveal.js';

const stats = [
  { value: '78%', label: 'of customers buy from the first business that answers' },
  { value: '100%', label: 'answer rate — day, night, and weekends' },
  { value: '21x', label: 'higher conversion when a lead is captured within 5 minutes' },
];

const points = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Zero Lost Revenue',
    desc: "Every call gets answered instantly, any time of day. Your AI assistant captures the caller's details and locks in the job before they can ring the next business on Google.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    title: 'Smart Filtering, Not Spam',
    desc: "It's a gatekeeper, not a nuisance. The AI handles routine questions and scheduling itself, then only sends you a text when there's a genuine, qualified job worth your time.",
  },
];

export default function LeadCatcher() {
  const ref = useReveal();
  const quoteRef = useReveal();

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      <div className="absolute inset-x-0 top-0 h-px gradient-divider" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 reveal" ref={ref}>
          <p className="section-label mb-3">Never Miss a Job</p>
          <h2 className="section-title mb-4">
            A Missed Call Is <span className="gradient-text">Lost Revenue</span>
          </h2>
          <p className="section-subtitle mx-auto">
            78% of customers buy from whichever business answers first. When you're off the clock, that job goes straight to a competitor — unless your website is answering for you.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass rounded-2xl p-6 text-center">
              <div className="gradient-text font-display font-bold" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {value}
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Value prop cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {points.map(({ icon, title, desc }, i) => {
            const pRef = useReveal();
            return (
              <div key={title} className="glass glass-hover rounded-2xl p-8 flex flex-col gap-4 reveal"
                ref={pRef} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-card)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                  {icon}
                </div>
                <h3 className="font-display font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Pull quote */}
        <div className="max-w-3xl mx-auto text-center reveal" ref={quoteRef}>
          <div className="glass rounded-2xl px-8 py-10" style={{ borderColor: 'var(--border-hover)' }}>
            <div className="text-5xl leading-none font-serif mb-4 select-none" style={{ color: 'var(--primary)', opacity: 0.4 }}>"</div>
            <p className="font-display font-semibold" style={{ fontSize: '1.35rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
              Letting a call go to voicemail is the same as handing cash to your competitor.
            </p>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px gradient-divider" />
    </section>
  );
}
