import { Link } from 'react-router-dom';
import { useChat } from '../context/ChatContext.jsx';

export default function Hero() {
  const { openChat } = useChat();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-bg)' }} />

      {/* Animated orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Subtle grid */}
      <div className="absolute inset-0 grid-overlay" />

      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border opacity-[0.04]"
          style={{ borderColor: 'var(--primary)', animation: 'spin 40s linear infinite' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full border opacity-[0.06]"
          style={{ borderColor: 'var(--secondary)', animation: 'spin 30s linear infinite reverse' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full border opacity-[0.08]"
          style={{ borderColor: 'var(--primary)', animation: 'spin 20s linear infinite' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full text-sm mb-10"
          style={{ animationDelay: '0s' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span style={{ color: 'var(--text-secondary)' }}>Now taking new projects for 2025</span>
        </div>

        {/* Headline */}
        <h1 className="section-title mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.08 }}>
          Transform Your<br />
          <span className="gradient-text">Digital Presence</span><br />
          Into a Masterpiece
        </h1>

        {/* Subline */}
        <p className="section-subtitle mx-auto mb-12" style={{ fontSize: '1.2rem', maxWidth: '640px' }}>
          We help local service businesses get online and get found — with stunning websites that build trust and bring in more customers.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/portfolio" className="btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.25rem' }}>
            View Our Work
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <button onClick={openChat} className="btn-secondary" style={{ fontSize: '1.05rem', padding: '1rem 2.25rem' }}>
            Find Out More
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
          {[
            { value: '150+', label: 'Projects Delivered' },
            { value: '98%',  label: 'Client Satisfaction' },
            { value: '8+',   label: 'Years Experience'    },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="gradient-text font-display font-bold" style={{ fontSize: '2.25rem' }}>{value}</div>
              <div className="text-xs mt-1 font-medium tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 flex justify-center pt-2"
          style={{ borderColor: 'var(--border-hover)' }}>
          <div className="w-1 h-3 rounded-full" style={{ background: 'var(--primary)' }} />
        </div>
      </div>
    </section>
  );
}
