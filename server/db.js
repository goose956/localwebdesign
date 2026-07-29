const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

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
`);

// Seed default themes
const themeCount = db.prepare('SELECT COUNT(*) as count FROM themes').get();
if (themeCount.count === 0) {
  const themes = [
    {
      name: 'Midnight Purple',
      slug: 'midnight',
      config: JSON.stringify({
        primary: '#6366f1', primaryDark: '#4f46e5', secondary: '#8b5cf6',
        accent: '#f59e0b', bgPrimary: '#0a0a14', bgSecondary: '#13131f',
        bgCard: 'rgba(255,255,255,0.05)', textPrimary: '#ffffff', textSecondary: '#a0a0b8',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        gradientBg: 'radial-gradient(ellipse at top, #1a1040 0%, #0a0a14 60%)',
        glow: 'rgba(99, 102, 241, 0.3)'
      }),
      is_active: 1
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
        glow: 'rgba(6, 182, 212, 0.3)'
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
        glow: 'rgba(16, 185, 129, 0.3)'
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
        glow: 'rgba(249, 115, 22, 0.3)'
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
        glow: 'rgba(244, 63, 94, 0.3)'
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
        glow: 'rgba(226, 232, 240, 0.2)'
      }),
      is_active: 0
    }
  ];
  const insert = db.prepare('INSERT INTO themes (name, slug, config, is_active, is_preset) VALUES (?, ?, ?, ?, 1)');
  themes.forEach(t => insert.run(t.name, t.slug, t.config, t.is_active));
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
      title: 'About Pixel&Craft',
      content: 'Pixel&Craft is a professional web design agency with over 8 years of experience. We specialise in creating stunning, high-performance websites for businesses of all sizes. We have delivered over 150 projects with a 98% client satisfaction rate. Our team is passionate about design and dedicated to helping businesses succeed online.',
      sort_order: 1
    },
    {
      category: 'services',
      title: 'New Business Websites',
      content: "We build beautiful brand-new websites for businesses that don't have an online presence yet. This includes everything: strategy, design, development, mobile optimisation, contact forms, basic SEO, and Google Analytics setup. Perfect for small businesses, sole traders, and startups wanting to make a great first impression online.",
      sort_order: 2
    },
    {
      category: 'services',
      title: 'Website Redesigns',
      content: 'Got an outdated or underperforming website? We transform existing websites into modern, high-converting digital experiences. We audit your current site, understand what needs improving, and rebuild it with fresh design, better performance, and improved SEO. Many clients see a significant increase in enquiries after a redesign.',
      sort_order: 3
    },
    {
      category: 'services',
      title: 'E-Commerce Stores',
      content: 'We build full e-commerce stores that are designed to convert browsers into buyers. Includes product listings, shopping cart, secure payment integration, order management, and a clean admin area to manage your products. Great for businesses wanting to sell products or services online.',
      sort_order: 4
    },
    {
      category: 'services',
      title: 'Landing Pages',
      content: 'High-converting landing pages for specific campaigns, product launches, or lead generation. Built with a clear focus on one goal — getting visitors to take action. Fast to build and extremely effective for paid advertising campaigns.',
      sort_order: 5
    },
    {
      category: 'pricing',
      title: 'Starter Plan — £799',
      content: 'Our Starter plan is £799 (one-time fee). It includes: up to 5 pages, mobile-responsive design, contact form, basic on-page SEO, Google Analytics setup, 3 revision rounds, and 30-day post-launch support. Ideal for small businesses and sole traders just getting started online.',
      sort_order: 6
    },
    {
      category: 'pricing',
      title: 'Professional Plan — £1,499 (Most Popular)',
      content: 'Our Professional plan is £1,499 (one-time fee) and is our most popular option. It includes: up to 10 pages, mobile-responsive design, contact form plus booking system, advanced on-page SEO, custom animations and interactions, blog/news section, Google Analytics and Search Console setup, 5 revision rounds, and 60-day post-launch support. Perfect for growing businesses that want to stand out.',
      sort_order: 7
    },
    {
      category: 'pricing',
      title: 'Enterprise Plan — From £2,999',
      content: 'Our Enterprise plan starts from £2,999 (one-time fee, price varies by complexity). It includes: unlimited pages, e-commerce functionality, custom integrations and APIs, advanced animations, CMS for easy content editing, priority performance and SEO, unlimited revisions, 12-month priority support, and a dedicated project manager. For businesses that need the very best.',
      sort_order: 8
    },
    {
      category: 'process',
      title: 'How We Work',
      content: 'Our process has 4 clear stages: 1) Discovery — we learn about your business, goals, and audience. 2) Design — we create pixel-perfect designs for your approval before any coding begins. 3) Development — we build your site with clean, fast, SEO-friendly code. 4) Launch — after thorough testing and your sign-off, we go live. Post-launch support is included in every plan.',
      sort_order: 9
    },
    {
      category: 'faq',
      title: 'Common Questions',
      content: 'Q: How long does it take? A: Starter sites typically take 2-3 weeks, Professional 3-5 weeks, Enterprise 6-12 weeks. Q: Do I own my website? A: Yes, you own everything — code, content, and domain. Q: Do you need a deposit? A: We take a 50% deposit to begin, then the remainder on completion. Q: Can you help with hosting? A: Yes, we provide hosting recommendations and setup guidance. Q: What if I need changes after launch? A: All plans include post-launch support, and we offer ongoing maintenance packages.',
      sort_order: 10
    }
  ];
  const insert = db.prepare('INSERT INTO chat_knowledge (category, title, content, sort_order) VALUES (?, ?, ?, ?)');
  entries.forEach(e => insert.run(e.category, e.title, e.content, e.sort_order));
  console.log('✓ Chat knowledge base seeded');
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
