import { Link } from 'react-router-dom';

const FooterLink = ({ to, children }) => (
  <Link to={to} className="block text-sm transition-colors duration-200 hover:text-white"
    style={{ color: 'var(--text-secondary)' }}>
    {children}
  </Link>
);

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'var(--gradient)' }}>O24</div>
              <span className="font-display font-bold text-lg">
                Open<span className="gradient-text">TwentyFour</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              We design stunning websites for local businesses, then bring them into the AI age with a smart assistant that's always on duty — answering questions and taking calls 24/7.
            </p>
            <div className="flex gap-3">
              {['twitter', 'instagram', 'linkedin', 'facebook'].map(platform => (
                <a key={platform} href="#" aria-label={platform}
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center transition-all duration-200 hover:border-primary"
                  style={{ borderColor: 'var(--border)' }}>
                  <SocialIcon name={platform} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-sm mb-4 tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
              Navigation
            </h4>
            <div className="flex flex-col gap-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/portfolio">Portfolio</FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <FooterLink to="/admin">Admin</FooterLink>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm mb-4 tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
              Services
            </h4>
            <div className="flex flex-col gap-3">
              {['24/7 AI Assistant', 'New Business Websites', 'Website Redesigns', 'Local SEO & Visibility', 'Professional Rebranding'].map(s => (
                <span key={s} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="gradient-divider my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>© {new Date().getFullYear()} OpenTwentyFour. All rights reserved.</p>
          <p>Crafted with ♥ for businesses that deserve better online.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }) {
  const icons = {
    twitter: <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>,
    instagram: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>,
    linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
    facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
  };
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}
      style={{ color: 'var(--text-secondary)' }}>
      {name === 'instagram' ? icons[name] :
       <path strokeLinecap="round" strokeLinejoin="round" d={typeof icons[name] === 'object' ? undefined : icons[name]} />}
      {name === 'instagram' && <>{icons[name]}</>}
      {['twitter','linkedin','facebook'].includes(name) && icons[name]}
    </svg>
  );
}
