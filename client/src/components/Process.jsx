import useReveal from '../hooks/useReveal.js';

const steps = [
  {
    num: '01',
    title: 'Discovery',
    desc: 'We start by understanding your business, goals, audience, and competition to build the perfect strategy.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  },
  {
    num: '02',
    title: 'Design',
    desc: 'We create beautiful, pixel-perfect designs tailored to your brand — you\'ll see it before a single line of code is written.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    num: '03',
    title: 'Development',
    desc: 'Your approved design is brought to life with clean, fast, SEO-friendly code. Mobile-first, always.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
  },
  {
    num: '04',
    title: 'Launch',
    desc: 'After thorough testing and your sign-off, we launch your site. We don\'t disappear — support is included.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3l14 9-14 9V3z" />,
  },
];

export default function Process() {
  const ref = useReveal();

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal" ref={ref}>
          <p className="section-label mb-3">Our Process</p>
          <h2 className="section-title mb-4">
            How We <span className="gradient-text">Work</span>
          </h2>
          <p className="section-subtitle mx-auto">
            A clear, collaborative process from first conversation to launch day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.3 }} />

          {steps.map(({ num, title, desc, icon }, i) => (
            <ProcessStep key={i} num={num} title={title} desc={desc} icon={icon} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessStep({ num, title, desc, icon, delay }) {
  const ref = useReveal();
  return (
    <div className="flex flex-col items-center text-center reveal" ref={ref} style={{ transitionDelay: `${delay}ms` }}>
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-2xl glass flex items-center justify-center"
          style={{ border: '1px solid var(--border)' }}>
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'var(--primary)' }}>
            {icon}
          </svg>
        </div>
        <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'var(--gradient)' }}>
          {num.slice(1)}
        </span>
      </div>
      <h3 className="font-display font-semibold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  );
}
