const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads', 'portfolio');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// Public routes (no admin JWT) — called directly by Site Builder's own publish step and by
// its Generated Sites view, never by a logged-in human. Guarded instead by a lightweight
// shared-secret header, deliberately NOT the admin JWT/password: if this key ever leaked out
// of a compiled Electron app, it can only ever create/update a client's synced fields, never
// touch /admin.
function verifySyncKey(req, res, next) {
  const provided = req.headers['x-sync-key'];
  const expected = process.env.SITE_SYNC_KEY;
  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: 'Invalid sync key' });
  }
  next();
}

// Upsert a client's synced fields — called by Site Builder's sites:publish step every time a
// chat-enabled site is published. Never touches extra_notes (admin-owned, manual-only field).
router.post('/upsert', verifySyncKey, (req, res) => {
  const { siteId, businessName, phone, aboutText, services } = req.body || {};

  if (!siteId || typeof siteId !== 'string') {
    return res.status(400).json({ error: 'siteId required' });
  }

  const name = String(businessName || '').slice(0, 200);
  const ph = String(phone || '').slice(0, 60);
  const about = String(aboutText || '').slice(0, 3000);
  const svc = Array.isArray(services)
    ? services.slice(0, 4).map(s => ({
        name: String(s?.name || '').slice(0, 100),
        blurb: String(s?.blurb || '').slice(0, 500),
      }))
    : [];

  db.prepare(`
    INSERT INTO clients (site_id, business_name, phone, about_text, services, synced_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(site_id) DO UPDATE SET
      business_name = excluded.business_name,
      phone = excluded.phone,
      about_text = excluded.about_text,
      services = excluded.services,
      synced_at = CURRENT_TIMESTAMP
  `).run(siteId, name, ph, about, JSON.stringify(svc));

  const row = db.prepare('SELECT synced_at FROM clients WHERE site_id = ?').get(siteId);
  res.json({ success: true, syncedAt: row.synced_at });
});

// Status check — Site Builder polls this to show a soft "synced / not synced yet" indicator,
// never a hard gate. Also guarded by the sync key; costs nothing and stops enumeration of
// which site IDs exist.
router.get('/status/:siteId', verifySyncKey, (req, res) => {
  const row = db.prepare('SELECT synced_at, business_name FROM clients WHERE site_id = ?').get(req.params.siteId);
  const portfolioRow = db.prepare('SELECT synced_at, image_url FROM portfolio WHERE site_id = ?').get(req.params.siteId);
  const portfolio = portfolioRow
    ? { synced: true, syncedAt: portfolioRow.synced_at, imageUrl: portfolioRow.image_url }
    : { synced: false };
  if (!row) return res.json({ synced: false, portfolio });
  res.json({ synced: true, syncedAt: row.synced_at, businessName: row.business_name, portfolio });
});

// Upload (or refresh) a Site Builder demo site's portfolio entry — called by the "Add to
// Portfolio" / "Update Portfolio" action in Generated Sites, never automatically on every
// publish. Fixed filename per site (siteId.png) so re-publishing overwrites cleanly instead of
// accumulating orphaned files. On first publish this creates the row with sensible defaults for
// everything the admin hasn't set yet; on every subsequent publish it ONLY refreshes the
// thumbnail + live link — title/description/category/tags/featured/sort_order are left alone so
// curation done in Portfolio Manager survives a thumbnail refresh.
router.post('/portfolio', verifySyncKey, upload.single('thumbnail'), (req, res) => {
  const { siteId, title, liveUrl } = req.body || {};

  if (!siteId || typeof siteId !== 'string') {
    return res.status(400).json({ error: 'siteId required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'thumbnail file required' });
  }

  const safeId = siteId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) return res.status(400).json({ error: 'invalid siteId' });

  const filename = `${safeId}.png`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/portfolio/${filename}`;
  const safeTitle = String(title || 'Untitled Project').slice(0, 200);
  const safeLiveUrl = String(liveUrl || '').slice(0, 500);

  db.prepare(`
    INSERT INTO portfolio (title, description, category, image_url, live_url, tags, featured, sort_order, site_id, synced_at)
    VALUES (?, '', 'web', ?, ?, '[]', 0, 0, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(site_id) DO UPDATE SET
      image_url = excluded.image_url,
      live_url = excluded.live_url,
      synced_at = CURRENT_TIMESTAMP
  `).run(safeTitle, imageUrl, safeLiveUrl, safeId);

  const row = db.prepare('SELECT id FROM portfolio WHERE site_id = ?').get(safeId);

  res.json({ success: true, imageUrl, portfolioId: row.id });
});

module.exports = router;
