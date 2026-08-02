const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// All persisted, mutable state (SQLite file + uploaded images) lives under data/ — deliberately
// NOT directly in server/, so a Railway volume can be mounted at server/data without also
// masking the application code that lives alongside it (mounting a volume at a path overlays
// it, hiding whatever the image had there — mounting straight at server/ made server.js itself
// disappear at runtime: "Cannot find module '/app/server/server.js'").
const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

// One-time migration for existing local installs: move a pre-existing server/database.db (from
// before this data/ split) into its new home, rather than silently starting a fresh empty DB.
const legacyDbPath = path.join(__dirname, 'database.db')
const dbPath = path.join(dataDir, 'database.db')
if (fs.existsSync(legacyDbPath) && !fs.existsSync(dbPath)) {
  fs.renameSync(legacyDbPath, dbPath)
  for (const ext of ['-shm', '-wal']) {
    if (fs.existsSync(legacyDbPath + ext)) fs.renameSync(legacyDbPath + ext, dbPath + ext)
  }
}

const db = new Database(dbPath)

// Destination for portfolio thumbnails uploaded from Site Builder — same persistent volume as
// database.db, so it survives restarts/redeploys the same way the DB already does.
const legacyUploadsDir = path.join(__dirname, 'uploads')
const uploadsDir = path.join(dataDir, 'uploads')
if (fs.existsSync(legacyUploadsDir) && !fs.existsSync(uploadsDir)) {
  fs.renameSync(legacyUploadsDir, uploadsDir)
}
fs.mkdirSync(path.join(uploadsDir, 'portfolio'), { recursive: true });

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'web',
    image_url TEXT DEFAULT '',
    live_url TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    config TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    is_preset INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT DEFAULT '',
    role TEXT DEFAULT '',
    rating INTEGER DEFAULT 5,
    review TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    is_visible INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    client_site_id TEXT DEFAULT NULL,
    message_count INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    about_text TEXT DEFAULT '',
    services TEXT DEFAULT '[]',
    extra_notes TEXT DEFAULT '',
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    business_name TEXT DEFAULT '',
    business_type TEXT DEFAULT '',
    project_type TEXT DEFAULT '',
    pages TEXT DEFAULT '[]',
    features TEXT DEFAULT '[]',
    reference_sites TEXT DEFAULT '',
    style_notes TEXT DEFAULT '',
    budget TEXT DEFAULT '',
    timeline TEXT DEFAULT '',
    extra_info TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// One-time migration for existing (already-deployed) databases — CREATE TABLE IF NOT EXISTS
// above won't retroactively add a column to a chat_sessions table that already existed before
// this column did. NULL means "OpenTwentyFour's own visitor chat"; a real site_id means a Site
// Builder client's demo site.
const chatSessionCols = db.prepare("PRAGMA table_info(chat_sessions)").all().map(c => c.name);
if (!chatSessionCols.includes('client_site_id')) {
  db.exec('ALTER TABLE chat_sessions ADD COLUMN client_site_id TEXT DEFAULT NULL');
}

// SQLite can't add a UNIQUE column via ALTER TABLE — uniqueness for site_id is enforced at the
// application layer in the site-sync upsert instead (looked up by value, same as clients.site_id).
const portfolioCols = db.prepare("PRAGMA table_info(portfolio)").all().map(c => c.name);
if (!portfolioCols.includes('site_id')) {
  db.exec('ALTER TABLE portfolio ADD COLUMN site_id TEXT DEFAULT NULL');
}
if (!portfolioCols.includes('synced_at')) {
  db.exec('ALTER TABLE portfolio ADD COLUMN synced_at DATETIME DEFAULT NULL');
}
// ON CONFLICT(site_id) in the site-sync upsert requires an actual unique index (ALTER TABLE ADD
// COLUMN can't declare UNIQUE directly) — safe with existing NULL site_id rows, since SQLite
// treats each NULL as distinct for uniqueness purposes.
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_site_id ON portfolio(site_id)');

// Seed default themes
const themeCount = db.prepare('SELECT COUNT(*) as count FROM themes').get();
if (themeCount.count === 0) {
  const themes = [
    {
      name: 'Studio White',
      slug: 'studio-white',
      config: JSON.stringify({
        primary: '#f97316', primaryDark: '#ea580c', secondary: '#6b7280',
        accent: '#f59e0b', bgPrimary: '#ffffff', bgSecondary: '#f7f7f8',
        bgCard: 'rgba(0,0,0,0.03)', textPrimary: '#18181b', textSecondary: '#52525b',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #fff7ed 0%, #ffffff 60%)',
        glow: 'rgba(249, 115, 22, 0.25)',
        border: 'rgba(0,0,0,0.08)', borderHover: 'rgba(0,0,0,0.18)'
      }),
      is_active: 1
    },
    {
      name: 'Midnight Purple',
      slug: 'midnight',
      config: JSON.stringify({
        primary: '#6366f1', primaryDark: '#4f46e5', secondary: '#8b5cf6',
        accent: '#f59e0b', bgPrimary: '#0a0a14', bgSecondary: '#13131f',
        bgCard: 'rgba(255,255,255,0.05)', textPrimary: '#ffffff', textSecondary: '#a0a0b8',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #1a1040 0%, #0a0a14 60%)',
        glow: 'rgba(99, 102, 241, 0.3)',
        border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)'
      }),
      is_active: 0
    },
    {
      name: 'Ocean Depths',
      slug: 'ocean',
      config: JSON.stringify({
        primary: '#06b6d4', primaryDark: '#0891b2', secondary: '#3b82f6',
        accent: '#f59e0b', bgPrimary: '#030712', bgSecondary: '#0c1220',
        bgCard: 'rgba(6,182,212,0.07)', textPrimary: '#ffffff', textSecondary: '#94a3b8',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #0c2040 0%, #030712 60%)',
        glow: 'rgba(6, 182, 212, 0.3)',
        border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)'
      }),
      is_active: 0
    },
    {
      name: 'Emerald Forest',
      slug: 'emerald',
      config: JSON.stringify({
        primary: '#10b981', primaryDark: '#059669', secondary: '#06b6d4',
        accent: '#f59e0b', bgPrimary: '#030d0a', bgSecondary: '#0a1f16',
        bgCard: 'rgba(16,185,129,0.07)', textPrimary: '#ffffff', textSecondary: '#94a3b8',
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #0a2818 0%, #030d0a 60%)',
        glow: 'rgba(16, 185, 129, 0.3)',
        border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)'
      }),
      is_active: 0
    },
    {
      name: 'Sunset Blaze',
      slug: 'sunset',
      config: JSON.stringify({
        primary: '#f97316', primaryDark: '#ea580c', secondary: '#ec4899',
        accent: '#fbbf24', bgPrimary: '#0d0806', bgSecondary: '#1a100c',
        bgCard: 'rgba(249,115,22,0.07)', textPrimary: '#ffffff', textSecondary: '#d4a899',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #2a1008 0%, #0d0806 60%)',
        glow: 'rgba(249, 115, 22, 0.3)',
        border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)'
      }),
      is_active: 0
    },
    {
      name: 'Rose Gold',
      slug: 'rose',
      config: JSON.stringify({
        primary: '#f43f5e', primaryDark: '#e11d48', secondary: '#a855f7',
        accent: '#fbbf24', bgPrimary: '#0d0507', bgSecondary: '#1a0c10',
        bgCard: 'rgba(244,63,94,0.07)', textPrimary: '#ffffff', textSecondary: '#c4a0a8',
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #2a0818 0%, #0d0507 60%)',
        glow: 'rgba(244, 63, 94, 0.3)',
        border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)'
      }),
      is_active: 0
    },
    {
      name: 'Silver Chrome',
      slug: 'chrome',
      config: JSON.stringify({
        primary: '#e2e8f0', primaryDark: '#cbd5e1', secondary: '#94a3b8',
        accent: '#6366f1', bgPrimary: '#020617', bgSecondary: '#0f172a',
        bgCard: 'rgba(255,255,255,0.04)', textPrimary: '#ffffff', textSecondary: '#94a3b8',
        gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #1e2a3a 0%, #020617 60%)',
        glow: 'rgba(226, 232, 240, 0.2)',
        border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)'
      }),
      is_active: 0
    }
  ];
  const insert = db.prepare('INSERT INTO themes (name, slug, config, is_active, is_preset) VALUES (?, ?, ?, ?, 1)');
  themes.forEach(t => insert.run(t.name, t.slug, t.config, t.is_active));
}

// Retroactive migration for already-seeded (pre-existing) databases — CREATE/seed above only
// runs once when the themes table is first created, so an already-deployed DB never sees new
// presets added later. Insert "Studio White" if missing and make it the active theme; also
// backfill border/borderHover into any existing theme configs that predate those two fields
// (ThemeContext only overrides CSS vars a theme's config actually defines, so a theme missing
// them would silently keep whatever the previous active theme had left in the DOM).
const studioWhite = db.prepare("SELECT id FROM themes WHERE slug = 'studio-white'").get();
if (!studioWhite) {
  const insertOne = db.prepare('INSERT INTO themes (name, slug, config, is_active, is_preset) VALUES (?, ?, ?, 0, 1)');
  const { lastInsertRowid } = insertOne.run('Studio White', 'studio-white', JSON.stringify({
    primary: '#f97316', primaryDark: '#ea580c', secondary: '#6b7280',
    accent: '#f59e0b', bgPrimary: '#ffffff', bgSecondary: '#f7f7f8',
    bgCard: 'rgba(0,0,0,0.03)', textPrimary: '#18181b', textSecondary: '#52525b',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    gradientBg: 'radial-gradient(ellipse at top, #fff7ed 0%, #ffffff 60%)',
    glow: 'rgba(249, 115, 22, 0.25)',
    border: 'rgba(0,0,0,0.08)', borderHover: 'rgba(0,0,0,0.18)'
  }));
  db.prepare('UPDATE themes SET is_active = 0').run();
  db.prepare('UPDATE themes SET is_active = 1 WHERE id = ?').run(lastInsertRowid);
}
for (const row of db.prepare('SELECT id, config FROM themes').all()) {
  const config = JSON.parse(row.config);
  if (!config.border) {
    // Luminance check so a border colour that reads on the theme's own background isn't
    // hardcoded to a specific hex — a future custom light theme gets a dark border too.
    const hex = (config.bgPrimary || '#000000').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) || 0, g = parseInt(hex.slice(2, 4), 16) || 0, b = parseInt(hex.slice(4, 6), 16) || 0;
    const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;
    config.border = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    config.borderHover = isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)';
    db.prepare('UPDATE themes SET config = ? WHERE id = ?').run(JSON.stringify(config), row.id);
  }
}

// Seed sample reviews
const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
if (reviewCount.count === 0) {
  const reviews = [
    { name: 'Sarah Mitchell', company: 'Bloom Boutique', role: 'Owner', rating: 5, review: 'Absolutely transformed our online presence! Our new website has increased enquiries by 300% in just two months. The design is stunning and our customers love it.', sort_order: 1 },
    { name: 'James Rodriguez', company: 'Peak Performance Gym', role: 'Director', rating: 5, review: 'We went from a basic website to something truly impressive. The team understood our brand perfectly and delivered beyond expectations. Highly recommend!', sort_order: 2 },
    { name: 'Emma Thompson', company: 'Artisan Coffee Co.', role: 'Co-Founder', rating: 5, review: 'Professional, creative, and delivered on time. Our new site perfectly captures our brand essence. Online orders have tripled since launch!', sort_order: 3 },
    { name: 'David Chen', company: 'TechFlow Solutions', role: 'CEO', rating: 5, review: 'The attention to detail is remarkable. They built a website that truly represents our tech company and impresses every client we show it to.', sort_order: 4 },
    { name: 'Lisa Parker', company: 'Parker Law Group', role: 'Managing Partner', rating: 5, review: 'A complete game-changer for our firm. The website is elegant, professional, and has brought in significant new client enquiries. Excellent investment!', sort_order: 5 },
    { name: 'Michael Foster', company: 'Foster Estates', role: 'Principal', rating: 5, review: 'Stunning redesign of our property website. The listings section is beautiful and intuitive. Our agents and clients are all very impressed with the result.', sort_order: 6 }
  ];
  const insert = db.prepare('INSERT INTO reviews (name, company, role, rating, review, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, 1)');
  reviews.forEach(r => insert.run(r.name, r.company, r.role, r.rating, r.review, r.sort_order));
}

// Seed chat knowledge base
const knowledgeCount = db.prepare('SELECT COUNT(*) as count FROM chat_knowledge').get();
if (knowledgeCount.count === 0) {
  const entries = [
    {
      category: 'about',
      title: 'About OpenTwentyFour',
      content: 'OpenTwentyFour is a web design company that brings your website into the AI age. We design and build stunning, high-performance websites for local businesses of all sizes — and every site comes with its own AI assistant that chats with visitors and answers calls 24/7, even when you\'re not available. We have delivered over 150 projects with a 98% client satisfaction rate. We only get in touch when someone\'s ready to become a customer.',
      sort_order: 1
    },
    {
      category: 'services',
      title: '24/7 AI Website Assistant',
      content: "Every website we build comes with a built-in AI assistant that chats with visitors and can answer phone calls any time of day — even when you're busy on a job or it's outside business hours. The assistant handles common questions and captures details from interested customers. You're only texted when someone's ready to book you for work, so routine enquiries never interrupt your day.",
      sort_order: 2
    },
    {
      category: 'services',
      title: 'New Business Websites',
      content: "We build beautiful brand-new websites for businesses that don't have an online presence yet. This includes everything: strategy, design, development, mobile optimisation, contact forms, basic SEO, and Google Analytics setup. Perfect for small businesses, sole traders, and startups wanting to make a great first impression online.",
      sort_order: 3
    },
    {
      category: 'services',
      title: 'Website Redesigns',
      content: 'Got an outdated or underperforming website? We transform existing websites into modern, high-converting digital experiences. We audit your current site, understand what needs improving, and rebuild it with fresh design, better performance, and improved SEO. Many clients see a significant increase in enquiries after a redesign.',
      sort_order: 4
    },
    {
      category: 'services',
      title: 'E-Commerce Stores',
      content: 'We build full e-commerce stores that are designed to convert browsers into buyers. Includes product listings, shopping cart, secure payment integration, order management, and a clean admin area to manage your products. Great for businesses wanting to sell products or services online.',
      sort_order: 5
    },
    {
      category: 'services',
      title: 'Landing Pages',
      content: 'High-converting landing pages for specific campaigns, product launches, or lead generation. Built with a clear focus on one goal — getting visitors to take action. Fast to build and extremely effective for paid advertising campaigns.',
      sort_order: 6
    },
    {
      category: 'pricing',
      title: 'Starter AI — £40/month',
      content: "Our Starter AI plan is £40/month (or £34/month if paid annually, £408/year — a 15% saving). It includes: a beautiful, professionally designed website, an AI chat assistant that answers visitor questions, and never missing a job — any enquiry is texted direct to your mobile. Hosting includes unlimited AI chat responses and full web support. Perfect for getting online and never missing an enquiry.",
      sort_order: 7
    },
    {
      category: 'pricing',
      title: 'Voice Receptionist AI — £130/month (Most Popular)',
      content: "Our Voice Receptionist AI plan is £130/month (or £110/month if paid annually, £1,320/year — a 15% saving) and is our most popular option. It includes everything in Starter AI, plus the AI assistant can now answer phone calls with a real voice, not just chat — so the business never misses a call any time of day. Hosting includes unlimited AI chat responses, 200 minutes/month of voice agent credits, and full web support.",
      sort_order: 8
    },
    {
      category: 'pricing',
      title: 'Voice AI & Agent — £499/month',
      content: "Our Voice AI & Agent plan is £499/month (or £424/month if paid annually, £5,088/year — a 15% saving). It includes everything in Voice Receptionist AI, plus an AI agent that works on autopilot: it asks for and follows up reviews with customers (important for local search ranking), creates content to help dominate local search, and auto-posts to social media to showcase the business's latest work. Voice agent credits are higher on this plan — 1000 minutes/month, not the 200 minutes/month on Voice Receptionist AI. For businesses that want full autopilot growth.",
      sort_order: 9
    },
    {
      category: 'process',
      title: 'How We Work',
      content: 'Our process has 4 clear stages: 1) Discovery — we learn about your business, goals, and audience. 2) Design — we create pixel-perfect designs for your approval before any coding begins. 3) Development — we build your site with clean, fast, SEO-friendly code. 4) Launch — after thorough testing and your sign-off, we go live. Post-launch support is included in every plan.',
      sort_order: 10
    },
    {
      category: 'faq',
      title: 'Common Questions',
      content: 'Q: How long does it take? A: Starter sites typically take 2-3 weeks, Professional 3-5 weeks, Enterprise 6-12 weeks. Q: Do I own my website? A: Yes, you own everything — code, content, and domain. Q: Do you need a deposit? A: We take a 50% deposit to begin, then the remainder on completion. Q: Can you help with hosting? A: Yes, we provide hosting recommendations and setup guidance. Q: What if I need changes after launch? A: All plans include post-launch support, and we offer ongoing maintenance packages.',
      sort_order: 11
    }
  ];
  const insert = db.prepare('INSERT INTO chat_knowledge (category, title, content, sort_order) VALUES (?, ?, ?, ?)');
  entries.forEach(e => insert.run(e.category, e.title, e.content, e.sort_order));
  console.log('✓ Chat knowledge base seeded');
}

// Seed default pricing (amounts stored in pence) — matches the values that used to be
// hardcoded directly in Pricing.jsx before admin-editable pricing existed. ON CONFLICT DO
// NOTHING so this never clobbers an amount an admin has since changed.
const defaultPricing = {
  price_starter_monthly: '4000',
  price_starter_yearly:  '3400',
  price_voice_monthly:   '13000',
  price_voice_yearly:    '11000',
  price_agent_monthly:   '49900',
  price_agent_yearly:    '42400',
};
const insertPricingDefault = db.prepare(`
  INSERT INTO site_settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO NOTHING
`);
for (const [key, value] of Object.entries(defaultPricing)) {
  insertPricingDefault.run(key, value);
}

// Seed default admin
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (adminCount.count === 0) {
  const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const hash = bcrypt.hashSync(defaultPassword, 12);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('✓ Default admin created. Username: admin, Password:', defaultPassword);
}

module.exports = db;
