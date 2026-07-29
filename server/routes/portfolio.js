const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all visible portfolio items (public)
router.get('/', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM portfolio WHERE 1=1';
  const params = [];
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY featured DESC, sort_order ASC, created_at DESC';
  const items = db.prepare(query).all(...params).map(item => ({
    ...item,
    tags: JSON.parse(item.tags || '[]'),
    featured: Boolean(item.featured)
  }));
  res.json(items);
});

// Create (admin)
router.post('/', verifyToken, (req, res) => {
  const { title, description, category, image_url, live_url, tags, featured, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const result = db.prepare(
    'INSERT INTO portfolio (title, description, category, image_url, live_url, tags, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', category || 'web', image_url || '', live_url || '',
    JSON.stringify(Array.isArray(tags) ? tags : []), featured ? 1 : 0, sort_order || 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update (admin)
router.put('/:id', verifyToken, (req, res) => {
  const { title, description, category, image_url, live_url, tags, featured, sort_order } = req.body;
  db.prepare(
    'UPDATE portfolio SET title=?, description=?, category=?, image_url=?, live_url=?, tags=?, featured=?, sort_order=? WHERE id=?'
  ).run(title, description || '', category || 'web', image_url || '', live_url || '',
    JSON.stringify(Array.isArray(tags) ? tags : []), featured ? 1 : 0, sort_order || 0, req.params.id);
  res.json({ success: true });
});

// Delete (admin)
router.delete('/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM portfolio WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
