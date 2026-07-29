import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal.js';
import { useChat } from '../context/ChatContext.jsx';

export default function CTA() {
  const ref = useReveal();
  const { openChat } = useChat();
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      <div className="absolute inset-0 grid-overlay" />
      <div className="orb" style={{ width: 500, height: 500, background: 'var(--primary)', opacity: 0.08,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(100px)', position: 'absolute' }} />
      <div className="relative max-w-3xl mx-auto px-6 text-center reveal" ref={ref}>
        <p className="section-label mb-4">Ready to Start?</p>
        <h2 className="section-title mb-6">
          More Local Customers <span className="gradient-text">Start Here</span>
        </h2>
        <p className="section-subtitle mx-auto mb-10">
          Whether you need a brand-new website or want to modernise what you've got — let's have a quick chat and see how we can help your business grow online.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={openChat} className="btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
            Find Out More
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <Link to="/portfolio" className="btn-secondary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
            See Our Portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
