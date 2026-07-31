import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext.jsx';

const navLinks = [
  { to: '/',          label: 'Home'      },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/pricing',   label: 'Pricing'   },
  { to: '/contact',   label: 'Contact'   },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const { pathname }            = useLocation();
  const { openChat }            = useChat();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'color-mix(in srgb, var(--bg-primary) 85%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between h-18 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--gradient)' }}
          >
            O24
          </div>
          <span className="font-display font-700 text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Open<span className="gradient-text">TwentyFour</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{
                color: pathname === to ? 'var(--primary)' : 'var(--text-secondary)',
                background: pathname === to ? 'var(--bg-card)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={openChat} className="btn-primary" style={{ padding: '0.55rem 1.4rem', fontSize: '0.9rem' }}>
            Find Out More
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: 'var(--text-primary)', background: open ? 'var(--bg-card)' : 'transparent' }}
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-6 pb-6 pt-2 flex flex-col gap-2"
          style={{ background: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)', borderBottom: '1px solid var(--border)' }}
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-4 py-3 rounded-lg text-sm font-medium"
              style={{ color: pathname === to ? 'var(--primary)' : 'var(--text-secondary)', background: pathname === to ? 'var(--bg-card)' : 'transparent' }}
            >
              {label}
            </Link>
          ))}
          <button onClick={() => { openChat(); setOpen(false); }} className="btn-primary mt-2 text-center" style={{ fontSize: '0.9rem' }}>
            Find Out More
          </button>
        </div>
      )}
    </header>
  );
}
