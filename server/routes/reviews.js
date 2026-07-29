const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get visible reviews (public)
router.get('/', (req, res) => {
  const reviews = db.prepare(
    'SELECT * FROM reviews WHERE is_visible = 1 ORDER BY sort_order ASC, created_at ASC'
  ).all();
  res.json(reviews);
});

// Get all reviews (admin)
router.get('/all', verifyToken, (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY sort_order ASC, created_at ASC').all();
  res.json(reviews);
});

// Create (admin)
router.post('/', verifyToken, (req, res) => {
  const { name, company, role, rating, review, avatar, is_visible, sort_order } = req.body;
  if (!name || !review) return res.status(400).json({ error: 'Name and review required' });
  const result = db.prepare(
    'INSERT INTO reviews (name, company, role, rating, review, avatar, is_visible, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, company || '', role || '', rating || 5, review, avatar || '', is_visible !== false ? 1 : 0, sort_order || 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update (admin)
router.put('/:id', verifyToken, (req, res) => {
  const { name, company, role, rating, review, avatar, is_visible, sort_order } = req.body;
  db.prepare(
    'UPDATE reviews SET name=?, company=?, role=?, rating=?, review=?, avatar=?, is_visible=?, sort_order=? WHERE id=?'
  ).run(name, company || '', role || '', rating || 5, review, avatar || '', is_visible ? 1 : 0, sort_order || 0, req.params.id);
  res.json({ success: true });
});

// Delete (admin)
router.delete('/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
