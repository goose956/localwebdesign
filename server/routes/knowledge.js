const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all entries (admin)
router.get('/', verifyToken, (req, res) => {
  const entries = db.prepare('SELECT * FROM chat_knowledge ORDER BY category ASC, sort_order ASC').all();
  res.json(entries);
});

// Create entry (admin)
router.post('/', verifyToken, (req, res) => {
  const { category, title, content, sort_order, is_active } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  if (title.length > 200 || content.length > 5000) return res.status(400).json({ error: 'Input too long' });
  const result = db.prepare(
    'INSERT INTO chat_knowledge (category, title, content, sort_order, is_active) VALUES (?, ?, ?, ?, ?)'
  ).run(category || 'general', title.trim(), content.trim(), sort_order || 0, is_active !== false ? 1 : 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update entry (admin)
router.put('/:id', verifyToken, (req, res) => {
  const { category, title, content, sort_order, is_active } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  db.prepare(
    'UPDATE chat_knowledge SET category=?, title=?, content=?, sort_order=?, is_active=? WHERE id=?'
  ).run(category || 'general', title.trim(), content.trim(), sort_order || 0, is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// Delete entry (admin)
router.delete('/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM chat_knowledge WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
