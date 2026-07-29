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

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const apiLimiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many submissions, please try again later.' } });
const chatLimiter    = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Too many chat messages, please slow down.' } });

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5000',
  /\.railway\.app$/
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin);
    cb(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use('/api', apiLimiter);

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
