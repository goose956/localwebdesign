require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes (this also seeds the DB on first run)
const contactRoutes   = require('./routes/contact');
const portfolioRoutes = require('./routes/portfolio');
const themeRoutes     = require('./routes/theme');
const adminRoutes     = require('./routes/admin');
const reviewRoutes    = require('./routes/reviews');
const chatRoutes      = require('./routes/chat');
const knowledgeRoutes = require('./routes/knowledge');
const settingsRoutes  = require('./routes/settings');
const chatLogsRoutes    = require('./routes/chat_logs');
const emailOctopusRoutes = require('./routes/emailoctopus');
const planSignupRoutes   = require('./routes/plan_signup');
const briefsRoutes       = require('./routes/briefs');
const siteSyncRoutes    = require('./routes/site_sync');
const clientsRoutes     = require('./routes/clients');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const apiLimiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many submissions, please try again later.' } });
const chatLimiter    = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Too many chat messages, please slow down.' } });
const siteSyncLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Too many sync requests, please slow down.' } });

// CUSTOM_DOMAINS (comma-separated, no protocol — e.g. "opentwentyfour.co.uk,www.opentwentyfour.co.uk")
// lets a custom domain added in Railway start working again with just an env var + redeploy,
// not a code change each time. Covers both the bare domain and a www. variant automatically.
const customDomainOrigins = (process.env.CUSTOM_DOMAINS || 'opentwentyfour.co.uk,www.opentwentyfour.co.uk')
  .split(',').map(d => d.trim()).filter(Boolean).map(d => `https://${d}`);

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5000',
  /\.railway\.app$/,
  ...customDomainOrigins,
];

const strictCors = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin);
    cb(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true
});

// Deliberately open CORS for the small set of routes embedded Site Builder demo sites call
// directly (the chat widget + its sync/status checks). No cookies/credentials ever cross this
// boundary, and origins are fundamentally unenumerable — every demo site is an arbitrary
// <slug>-demo.github.io or an arbitrary custom domain a client brings, so a static allowlist
// (like the one used for every other route) can't work here. The data itself isn't secret
// either — it's the same business name/phone/services already visible in that site's own
// public HTML.
const openCors = cors({ origin: true, credentials: false });

// A single dispatcher, not two separate app.use(cors(...)) calls — a blanket, unscoped
// app.use(cors(...)) runs for EVERY request regardless of what's mounted on a specific path
// afterward (Express applies unscoped middleware in registration order, before path-scoped
// ones get a chance to run first), so a second, path-mounted cors() can never actually
// override an earlier blanket one. Branching on req.path inside one middleware is what
// actually makes "open for these two paths, strict for everything else" work.
const OPEN_CORS_PATHS = ['/api/chat', '/api/site-sync'];
app.use((req, res, next) => {
  const isOpenPath = OPEN_CORS_PATHS.some(p => req.path === p || req.path.startsWith(p + '/'));
  return (isOpenPath ? openCors : strictCors)(req, res, next);
});

app.use(express.json({ limit: '2mb' }));
app.use('/api', apiLimiter);

// Portfolio thumbnails uploaded from Site Builder — plain static file serving, no CORS needed
// since <img src> loads aren't subject to it (unlike the fetch calls to /api/chat, /api/site-sync).
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));

// API routes
app.use('/api/contact',   contactLimiter, contactRoutes);
app.use('/api/portfolio',  portfolioRoutes);
app.use('/api/themes',    themeRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/chat',      chatLimiter, chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/chat-logs',    chatLogsRoutes);
app.use('/api/emailoctopus', emailOctopusRoutes);
app.use('/api/plan-signup',  planSignupRoutes);
app.use('/api/briefs',       briefsRoutes);
app.use('/api/site-sync', siteSyncLimiter, siteSyncRoutes);
app.use('/api/clients',   clientsRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
