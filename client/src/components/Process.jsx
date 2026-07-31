import { Fragment } from 'react';
import useReveal from '../hooks/useReveal.js';

const pillars = [
  {
    title: 'Design',
    desc: "Most local businesses are stuck with a website that's gone stale — slow, outdated, and not doing them any favours. We design fantastic, modern sites built specifically around your brand, so you finally have something you're proud to send people to.",
    tags: ['Modern Design', 'Mobile-First', 'Brand-Matched'],
    stat: null,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M7 6.5h.01M10.2 6.5h.01" />
      </>
    ),
  },
  {
    title: 'Response',
    desc: "Our AI qualifies every enquiry the moment it comes in — through web chat or voice — and forwards the job straight to your mobile with their contact details, so you can call back before anyone else even picks up the phone.",
    tags: ['Web Chat + Voice AI', 'Instant Qualification', 'Straight to Your Mobile'],
    stat: { value: '78%', label: 'of customers go with whichever business responds first' },
    icon: (
      <>
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        <path d="M13.2 8.3l-2.9 4h2.4l-.9 3.7L15 12h-2.4z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    title: 'Agents',
    desc: "Your website keeps working after launch — building new pages automatically to grow your reach, chasing up review requests and following up with happy customers, and posting fresh content to your social media. All completely on autopilot.",
    tags: ['Auto-Generated Pages', 'Review Follow-Up', 'Social Media Autopilot'],
    stat: null,
    icon: (
      <>
        <rect x="5" y="9" width="14" height="10" rx="2" />
        <path d="M9 9V6a3 3 0 016 0v3" />
        <circle cx="9.5" cy="14" r="1" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="14" r="1" fill="currentColor" stroke="none" />
        <path d="M9.5 17.5h5" />
      </>
    ),
  },
];

const ChevronDivider = () => (
  <div className="hidden lg:flex items-center justify-center flex-shrink-0" style={{ width: 32 }}>
    <svg className="w-6 h-6" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.4 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

export default function Process() {
  const ref = useReveal();

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal" ref={ref}>
          <p className="section-label mb-3">How We Work</p>
          <h2 className="section-title mb-4">
            Three Ways We <span className="gradient-text">Grow Your Business</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Attract more customers, respond faster than anyone else, and keep growing — all built into every site.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-0">
          {pillars.map(({ title, desc, tags, stat, icon }, i) => (
            <Fragment key={title}>
              <PillarCard title={title} desc={desc} tags={tags} stat={stat} icon={icon} delay={i * 100} />
              {i < pillars.length - 1 && <ChevronDivider />}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ title, desc, tags, stat, icon, delay }) {
  const ref = useReveal();
  return (
    <div
      className="glass glass-hover rounded-2xl p-8 flex flex-col gap-4 reveal flex-1"
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--gradient)', boxShadow: '0 8px 24px var(--glow)' }}>
        <svg className="w-8 h-8" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>

      <h3 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{title}</h3>

      {stat && (
        <div className="flex items-baseline gap-2">
          <span className="gradient-text font-display font-bold" style={{ fontSize: '2.5rem', lineHeight: 1 }}>{stat.value}</span>
          <span className="text-xs leading-snug" style={{ color: 'var(--text-secondary)', maxWidth: '9rem' }}>{stat.label}</span>
        </div>
      )}

      <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>{desc}</p>

      <div className="flex flex-wrap gap-2 pt-2">
        {tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
      </div>
    </div>
  );
}
