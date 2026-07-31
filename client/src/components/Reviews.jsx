import { useState, useEffect } from 'react';
import useReveal from '../hooks/useReveal.js';

const Stars = ({ n = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill={i < n ? '#f59e0b' : 'none'}
        stroke="#f59e0b" strokeWidth="1.5">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const avatarColor = (name) => {
  const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f97316','#f43f5e'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const ref = useReveal();

  useEffect(() => {
    fetch('/api/reviews').then(r => r.json()).then(setReviews).catch(() => {});
  }, []);

  if (!reviews.length) return null;

  // Duplicated once so the strip can loop seamlessly — the CSS animation slides exactly one
  // copy's width (-50% of the doubled track) then resets instantly, which is imperceptible
  // since the visual content at that reset point is identical to where it started.
  const track = [...reviews, ...reviews];
  // Roughly constant per-card pace regardless of how many reviews exist, rather than a fixed
  // duration that would feel rushed with 3 reviews and glacial with 15.
  const durationSec = Math.max(reviews.length * 6, 18);

  return (
    <section className="pt-14 pb-28 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal" ref={ref}>
          <p className="section-label mb-3">Testimonials</p>
          <h2 className="section-title mb-4">
            What Our Clients <span className="gradient-text">Say</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Don't just take our word for it — hear from the businesses we've helped grow.
          </p>
        </div>
      </div>

      {/* Full-bleed single-row marquee — deliberately outside the max-w-7xl wrapper above so the
          edges fade into the page rather than hard-cutting mid-card. Pauses on hover so a card
          that catches someone's eye doesn't keep sliding away while they're reading it. */}
      <div className="reviews-marquee-mask">
        <div
          className="reviews-marquee-track"
          style={{ animationDuration: `${durationSec}s`, width: `${track.length * 344}px` }}
        >
          {track.map((r, i) => (
            <ReviewCard key={`${r.id}-${i}`} review={r} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }) {
  return (
    <div
      className="glass rounded-2xl p-7 flex flex-col flex-shrink-0"
      style={{ width: 320 }}
    >
      {/* Quote mark */}
      <div className="text-5xl leading-none font-serif mb-4 select-none" style={{ color: 'var(--primary)', opacity: 0.4 }}>"</div>

      {/* Stars */}
      <Stars n={review.rating} />

      {/* Review text — flex-1 pushes author to bottom */}
      <p className="mt-4 text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>
        {review.review}
      </p>

      {/* Author — always at the bottom */}
      <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
        {review.avatar ? (
          <img src={review.avatar} alt={review.name}
            className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ background: avatarColor(review.name) }}>
            {initials(review.name)}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{review.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {review.role}{review.role && review.company ? ' · ' : ''}{review.company}
          </p>
        </div>
      </div>
    </div>
  );
}
