const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Submit brief (public)
router.post('/', (req, res) => {
  const {
    name, email, phone, business_name, business_type, project_type,
    pages, features, reference_sites, style_notes, budget, timeline, extra_info
  } = req.body;

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (name.length > 100 || email.length > 200) return res.status(400).json({ error: 'Input too long' });

  try {
    const result = db.prepare(`
      INSERT INTO briefs
        (name, email, phone, business_name, business_type, project_type,
         pages, features, reference_sites, style_notes, budget, timeline, extra_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email.trim().toLowerCase(),
      phone?.trim().slice(0, 30) || '',
      business_name?.trim().slice(0, 200) || '',
      business_type?.trim().slice(0, 100) || '',
      project_type?.trim() || '',
      JSON.stringify(Array.isArray(pages) ? pages : []),
      JSON.stringify(Array.isArray(features) ? features : []),
      reference_sites?.trim().slice(0, 500) || '',
      style_notes?.trim().slice(0, 1000) || '',
      budget?.trim() || '',
      timeline?.trim() || '',
      extra_info?.trim().slice(0, 2000) || ''
    );
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save brief' });
  }
});

// Get all briefs (admin)
router.get('/', verifyToken, (req, res) => {
  const { status } = req.query;
  const where = status ? ' WHERE status = ?' : '';
  const briefs = db.prepare(`SELECT * FROM briefs${where} ORDER BY created_at DESC`)
    .all(...(status ? [status] : []))
    .map(b => ({
      ...b,
      pages: JSON.parse(b.pages || '[]'),
      features: JSON.parse(b.features || '[]'),
    }));
  res.json(briefs);
});

// Update status (admin)
router.put('/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  if (!['new', 'reviewed', 'in-progress', 'completed', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE briefs SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Delete (admin)
router.delete('/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM briefs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Stats (admin)
router.get('/stats', verifyToken, (req, res) => {
  res.json({
    total:       db.prepare('SELECT COUNT(*) as c FROM briefs').get().c,
    new:         db.prepare("SELECT COUNT(*) as c FROM briefs WHERE status='new'").get().c,
    reviewed:    db.prepare("SELECT COUNT(*) as c FROM briefs WHERE status='reviewed'").get().c,
    in_progress: db.prepare("SELECT COUNT(*) as c FROM briefs WHERE status='in-progress'").get().c,
  });
});

module.exports = router;
