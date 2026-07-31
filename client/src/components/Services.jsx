import useReveal from '../hooks/useReveal.js';

const services = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'New Business Websites',
    desc: "No website yet? We'll build you something professional and eye-catching from scratch — so local customers can find you, trust you, and get in touch.",
    tags: ['Custom Design', 'Mobile Ready', 'SEO'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Website Redesigns',
    desc: 'Old site letting you down? We transform outdated websites into modern, fast, and professional ones that properly represent your business and win more work.',
    tags: ['Refresh', 'Speed Boost', 'Rebrand'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Local SEO & Visibility',
    desc: "We make sure your business shows up when local customers search Google for your services. More visibility means more phone calls, more bookings, more revenue.",
    tags: ['Google Ready', 'Local Search', 'Maps'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Your 24/7 AI Assistant',
    desc: "Every website comes to life with a friendly AI assistant that chats with visitors and answers calls any time of day — even when you're on a job. We only text you when someone's ready to book.",
    tags: ['Answers Calls & Chats', '24/7 Availability', 'Only Notified When It Matters'],
  },
];

export default function Services() {
  const ref = useReveal();

  return (
    <section className="py-28 relative" style={{ background: 'var(--bg-secondary)' }}>
      <div className="absolute inset-x-0 top-0 h-px gradient-divider" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal" ref={ref}>
          <p className="section-label mb-3">What We Do</p>
          <h2 className="section-title mb-4">
            Built for <span className="gradient-text">Local Businesses</span>
          </h2>
          <p className="section-subtitle mx-auto">
            We specialise in helping trades, hospitality, health &amp; beauty, and professional service businesses win more local customers online — every website now comes with its own AI assistant working around the clock.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ icon, title, desc, tags }, i) => (
            <ServiceCard key={i} icon={icon} title={title} desc={desc} tags={tags} delay={i * 80} />
          ))}
        </div>

        {/* Industries strip */}
        <IndustriesStrip />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px gradient-divider" />
    </section>
  );
}

function ServiceCard({ icon, title, desc, tags, delay }) {
  const ref = useReveal();
  return (
    <div
      className="glass glass-hover rounded-2xl p-7 flex flex-col gap-4 reveal"
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--bg-card)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
      </div>
    </div>
  );
}

const industries = [
  { emoji: '🔧', label: 'Trades & Builders' },
  { emoji: '🍽️', label: 'Restaurants & Cafés' },
  { emoji: '💇', label: 'Hair & Beauty' },
  { emoji: '🏋️', label: 'Fitness & Wellness' },
  { emoji: '⚖️', label: 'Legal & Accountancy' },
  { emoji: '🏡', label: 'Estate Agents' },
  { emoji: '🦷', label: 'Healthcare & Dental' },
  { emoji: '🚗', label: 'Automotive' },
];

function IndustriesStrip() {
  const ref = useReveal();
  return (
    <div className="mt-16 reveal" ref={ref}>
      <p className="text-center text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-secondary)' }}>
        Industries We Serve
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {industries.map(({ emoji, label }) => (
          <div key={label} className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{ color: 'var(--text-secondary)' }}>
            <span>{emoji}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
