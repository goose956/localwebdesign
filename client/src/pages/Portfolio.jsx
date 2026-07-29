import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CTA from '../components/CTA.jsx';
import useReveal from '../hooks/useReveal.js';

const CATEGORIES = [
  { value: 'all',       label: 'All Work'   },
  { value: 'web',       label: 'Business'   },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'redesign',  label: 'Redesigns'  },
  { value: 'landing',   label: 'Landing Pages' },
];

function PortfolioCard({ item, delay }) {
  const ref = useReveal();
  return (
    <div
      className="group relative glass rounded-2xl overflow-hidden reveal cursor-pointer"
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, border: '1px solid var(--border)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ paddingBottom: '62%', background: 'var(--bg-secondary)' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-card))' }}>
            <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          {item.live_url && (
            <a href={item.live_url} target="_blank" rel="noopener noreferrer"
              className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem' }}
              onClick={e => e.stopPropagation()}>
              View Live Site ↗
            </a>
          )}
        </div>

        {/* Featured badge */}
        {item.featured && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'var(--gradient)' }}>
            Featured
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {item.description}
          </p>
        )}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(tag => <span key={tag} className="tag-chip">{tag}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [items, setItems]       = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading]   = useState(true);
  const ref = useReveal();

  useEffect(() => {
    setLoading(true);
    const url = category === 'all' ? '/api/portfolio' : `/api/portfolio?category=${category}`;
    fetch(url).then(r => r.json()).then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  }, [category]);

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg-primary)' }}>
        {/* Hero */}
        <section className="page-hero" style={{ background: 'var(--gradient-bg)' }}>
          <div className="orb orb-1" style={{ opacity: 0.1 }} />
          <div className="orb orb-2" style={{ opacity: 0.07 }} />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative max-w-3xl mx-auto px-6">
            <p className="section-label mb-4">Our Portfolio</p>
            <h1 className="section-title mb-6">
              Work We're <span className="gradient-text">Proud Of</span>
            </h1>
            <p className="section-subtitle mx-auto">
              A collection of websites we've designed and built for businesses across a range of industries.
            </p>
          </div>
        </section>

        {/* Filter + Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-14 reveal" ref={ref}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    background: category === cat.value ? 'var(--gradient)' : 'var(--bg-card)',
                    color: category === cat.value ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${category === cat.value ? 'transparent' : 'var(--border)'}`,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>No projects yet in this category.</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Check back soon — more work coming!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, i) => (
                  <PortfolioCard key={item.id} item={item} delay={i * 60} />
                ))}
              </div>
            )}
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
