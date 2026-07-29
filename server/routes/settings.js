const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Sensitive keys that must never be returned in plaintext
const SENSITIVE = ['openai_api_key'];

const mask = (key, value) => {
  if (!SENSITIVE.includes(key) || !value) return value;
  // Show first 7 chars (e.g. "sk-proj") then mask the rest
  return value.length > 10 ? value.slice(0, 7) + '•'.repeat(8) + value.slice(-4) : '•'.repeat(value.length);
};

// GET /api/settings — all settings (admin), sensitive values masked
router.get('/', verifyToken, (req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM site_settings').all();
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = {
      value: mask(r.key, r.value),
      isSet: Boolean(r.value),
      updated_at: r.updated_at,
    };
  });
  res.json(settings);
});

// PUT /api/settings/:key — upsert a setting (admin)
router.put('/:key', verifyToken, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  // Allowlist of keys that can be set
  const ALLOWED_KEYS = ['openai_api_key', 'company_name', 'company_email', 'company_phone', 'chatbot_name', 'chatbot_greeting', 'chatbot_goal'];
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(400).json({ error: 'Unknown setting key' });
  }

  if (typeof value !== 'string') {
    return res.status(400).json({ error: 'Value must be a string' });
  }

  if (value.length > 500) {
    return res.status(400).json({ error: 'Value too long' });
  }

  db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value.trim());

  res.json({ success: true, isSet: Boolean(value.trim()) });
});

// DELETE /api/settings/:key — clear a setting (admin)
router.delete('/:key', verifyToken, (req, res) => {
  db.prepare('DELETE FROM site_settings WHERE key = ?').run(req.params.key);
  res.json({ success: true });
});

module.exports = router;
