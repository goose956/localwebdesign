import useReveal from '../hooks/useReveal.js';

const stats = [
  { value: '78%', label: 'of customers buy from the first business that answers' },
  { value: '100%', label: 'answer rate — day, night, and weekends' },
  { value: '21x', label: 'higher conversion when a lead is captured within 5 minutes' },
];

export default function LeadCatcher() {
  const ref = useReveal();

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass rounded-2xl p-6 text-center">
              <div className="gradient-text font-display font-bold" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {value}
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px gradient-divider" />
    </section>
  );
}
