const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get active theme (public)
router.get('/active', (req, res) => {
  const theme = db.prepare('SELECT * FROM themes WHERE is_active = 1').get();
  if (!theme) return res.json({ name: 'default', config: {} });
  res.json({ ...theme, config: JSON.parse(theme.config) });
});

// Get all themes (admin)
router.get('/', verifyToken, (req, res) => {
  const themes = db.prepare('SELECT * FROM themes ORDER BY is_preset DESC, name ASC').all()
    .map(t => ({ ...t, config: JSON.parse(t.config) }));
  res.json(themes);
});

// Activate a theme (admin)
router.put('/activate/:id', verifyToken, (req, res) => {
  db.prepare('UPDATE themes SET is_active = 0').run();
  db.prepare('UPDATE themes SET is_active = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Create custom theme (admin)
router.post('/', verifyToken, (req, res) => {
  const { name, config } = req.body;
  if (!name || !config) return res.status(400).json({ error: 'Name and config required' });
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  try {
    const result = db.prepare(
      'INSERT INTO themes (name, slug, config, is_active, is_preset) VALUES (?, ?, ?, 0, 0)'
    ).run(name, slug, JSON.stringify(config));
    res.json({ success: true, id: result.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Failed to create theme' });
  }
});

// Update custom theme (admin)
router.put('/:id', verifyToken, (req, res) => {
  const { name, config } = req.body;
  db.prepare('UPDATE themes SET name=?, config=? WHERE id=?')
    .run(name, JSON.stringify(config), req.params.id);
  res.json({ success: true });
});

// Delete custom theme (admin)
router.delete('/:id', verifyToken, (req, res) => {
  const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(req.params.id);
  if (!theme) return res.status(404).json({ error: 'Not found' });
  if (theme.is_preset) return res.status(400).json({ error: 'Cannot delete preset themes' });
  db.prepare('DELETE FROM themes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
