const express = require('express');
const Stripe = require('stripe');
const db = require('../db');

const router = express.Router();

const getSetting = (key) => db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key)?.value || '';

// POST /api/stripe/webhook — mounted in server.js with express.raw() ahead of the global
// express.json() parser, since Stripe's signature check needs the exact raw request body.
router.post('/', (req, res) => {
  const secretKey = getSetting('stripe_secret_key');
  const webhookSecret = getSetting('stripe_webhook_secret');
  if (!secretKey || !webhookSecret) return res.status(400).send('Stripe not configured');

  const stripe = new Stripe(secretKey);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
    const plan = session.metadata?.plan || '';
    const billing = session.metadata?.billing || '';
    const name = session.metadata?.name || '';

    if (email) {
      // Mark the matching lead (created by /api/plan-signup moments earlier) as paid, so it
      // surfaces in the admin's existing Messages inbox instead of needing a separate
      // payments dashboard — Stripe's own dashboard remains the source of truth for billing.
      const contact = db.prepare('SELECT id FROM contacts WHERE email = ? ORDER BY id DESC LIMIT 1').get(email);
      if (contact) {
        db.prepare("UPDATE contacts SET status = 'paid' WHERE id = ?").run(contact.id);
      } else {
        db.prepare(
          'INSERT INTO contacts (name, email, service, message, status) VALUES (?, ?, ?, ?, ?)'
        ).run(name || email, email, plan, `Subscribed via Stripe Checkout (${billing}).`, 'paid');
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;
