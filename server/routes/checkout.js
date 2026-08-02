const express = require('express');
const Stripe = require('stripe');
const db = require('../db');

const router = express.Router();

const PLAN_NAMES = {
  starter: 'Starter AI',
  voice:   'Voice Receptionist AI',
  agent:   'Voice AI & Agent',
};

const getSetting = (key) => db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key)?.value || '';

// POST /api/checkout/create-session — called after the pricing page's lead-capture form
// succeeds. Builds the subscription price inline from the current site_settings amount rather
// than a pre-created Stripe Price, so an admin editing pricing takes effect immediately with
// no Stripe-side syncing.
router.post('/create-session', async (req, res) => {
  const { plan, billing, name, email } = req.body || {};

  if (!PLAN_NAMES[plan] || !['monthly', 'yearly'].includes(billing)) {
    return res.status(400).json({ error: 'Invalid plan or billing period' });
  }
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Name and a valid email are required' });
  }

  const secretKey = getSetting('stripe_secret_key');
  if (!secretKey) {
    return res.status(400).json({ error: 'Stripe is not configured yet' });
  }

  const unitAmount = parseInt(getSetting(`price_${plan}_${billing}`), 10);
  if (!unitAmount || unitAmount <= 0) {
    return res.status(400).json({ error: 'Pricing is not set up for this plan yet' });
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email.trim().toLowerCase(),
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `${PLAN_NAMES[plan]} (${billing === 'yearly' ? 'Annual' : 'Monthly'})` },
          unit_amount: unitAmount,
          recurring: { interval: billing === 'yearly' ? 'year' : 'month' },
        },
        quantity: 1,
      }],
      success_url: `${clientUrl}/pricing?checkout=success`,
      cancel_url: `${clientUrl}/pricing?checkout=cancelled`,
      metadata: { plan, billing, name: name.trim() },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Could not start checkout — please try again' });
  }
});

module.exports = router;
