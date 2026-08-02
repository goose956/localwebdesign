const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const PLAN_KEYS = ['starter', 'voice', 'agent'];
const settingKey = (plan, billing) => `price_${plan}_${billing}`;

// GET /api/pricing — public, amounts in pounds. Read by the Pricing page and by
// /api/checkout when building a Stripe Checkout Session, so both always agree on the
// current price.
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT key, value FROM site_settings WHERE key LIKE 'price_%'").all();
  const pence = {};
  rows.forEach(r => { pence[r.key] = parseInt(r.value, 10) || 0; });

  const result = {};
  for (const plan of PLAN_KEYS) {
    result[plan] = {
      monthly: (pence[settingKey(plan, 'monthly')] || 0) / 100,
      yearly:  (pence[settingKey(plan, 'yearly')] || 0) / 100,
    };
  }
  res.json(result);
});

// PUT /api/pricing — admin. Body: { starter: {monthly, yearly}, voice: {...}, agent: {...} },
// all amounts in pounds. Validates everything before writing anything, so a bad value in one
// plan can't leave the others half-updated.
router.put('/', verifyToken, (req, res) => {
  const body = req.body || {};
  const updates = [];

  for (const plan of PLAN_KEYS) {
    const entry = body[plan];
    if (!entry) continue;
    for (const billing of ['monthly', 'yearly']) {
      if (!(billing in entry)) continue;
      const amount = Number(entry[billing]);
      if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
        return res.status(400).json({ error: `Invalid ${billing} amount for ${plan}` });
      }
      updates.push([settingKey(plan, billing), String(Math.round(amount * 100))]);
    }
  }

  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  for (const [key, value] of updates) upsert.run(key, value);

  res.json({ success: true });
});

module.exports = router;
