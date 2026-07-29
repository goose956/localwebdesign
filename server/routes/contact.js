const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Submit contact form (public)
router.post('/', (req, res) => {
  const { name, email, phone, service, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (name.length > 100 || email.length > 200 || message.length > 2000) {
    return res.status(400).json({ error: 'Input exceeds maximum length' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO contacts (name, email, phone, service, message) VALUES (?, ?, ?, ?, ?)'
    ).run(
      name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim().slice(0, 30) : null,
      service ? service.trim().slice(0, 100) : null,
      message.trim()
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get messages (admin)
router.get('/', verifyToken, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where = status ? ' WHERE status = ?' : '';
  const params = status ? [status] : [];
  const messages = db.prepare(`SELECT * FROM contacts${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, parseInt(limit), offset);
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM contacts${where}`).get(...params);
  res.json({ messages, total: count });
});

// Get stats (admin)
router.get('/stats', verifyToken, (req, res) => {
  res.json({
    total:    db.prepare('SELECT COUNT(*) as c FROM contacts').get().c,
    unread:   db.prepare("SELECT COUNT(*) as c FROM contacts WHERE status='unread'").get().c,
    read:     db.prepare("SELECT COUNT(*) as c FROM contacts WHERE status='read'").get().c,
    replied:  db.prepare("SELECT COUNT(*) as c FROM contacts WHERE status='replied'").get().c,
    archived: db.prepare("SELECT COUNT(*) as c FROM contacts WHERE status='archived'").get().c,
  });
});

// Update status (admin)
router.put('/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  if (!['unread', 'read', 'replied', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Delete message (admin)
router.delete('/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
