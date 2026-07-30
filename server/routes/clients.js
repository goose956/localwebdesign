const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function parseClient(row) {
  if (!row) return row;
  let services = [];
  try { services = JSON.parse(row.services || '[]'); } catch {}
  return { ...row, services };
}

// List all synced clients (admin)
router.get('/', verifyToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM clients ORDER BY synced_at DESC').all();
  res.json(rows.map(parseClient));
});

// One client's full record (admin)
router.get('/:siteId', verifyToken, (req, res) => {
  const row = db.prepare('SELECT * FROM clients WHERE site_id = ?').get(req.params.siteId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(parseClient(row));
});

// Update — ONLY ever reads extra_notes off the body. The synced fields (business_name, phone,
// about_text, services) are Site-Builder-owned and would just be overwritten on the next
// publish anyway, so this route deliberately never lets them be written here, enforced
// server-side rather than relying on the admin UI to behave.
router.put('/:siteId', verifyToken, (req, res) => {
  const { extra_notes } = req.body || {};
  const result = db.prepare('UPDATE clients SET extra_notes = ? WHERE site_id = ?')
    .run(String(extra_notes || '').slice(0, 3000), req.params.siteId);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Delete a client record (e.g. demo site abandoned/deleted). Leaves past chat_sessions/
// chat_messages history intact — same as deleting a chat_knowledge entry doesn't delete logs.
router.delete('/:siteId', verifyToken, (req, res) => {
  db.prepare('DELETE FROM clients WHERE site_id = ?').run(req.params.siteId);
  res.json({ success: true });
});

module.exports = router;
