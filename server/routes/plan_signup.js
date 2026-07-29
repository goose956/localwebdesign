const express = require('express');
const db = require('../db');
const { subscribeContact } = require('../utils/emailoctopus');

const router = express.Router();

// POST /api/plan-signup
// Called from the pricing page "Get Started" modal.
// Creates a contact record AND subscribes to EmailOctopus with the plan as a tag.
router.post('/', async (req, res) => {
  const { name, email, plan } = req.body;

  if (!name || !email || !plan) {
    return res.status(400).json({ error: 'Name, email and plan are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (name.length > 100 || email.length > 200) {
    return res.status(400).json({ error: 'Input too long' });
  }

  const planTag = `plan-${plan.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  try {
    // Save to contacts inbox so admin sees it
    db.prepare(
      'INSERT INTO contacts (name, email, service, message) VALUES (?, ?, ?, ?)'
    ).run(
      name.trim(),
      email.trim().toLowerCase(),
      plan,
      `Interested in the ${plan} plan via the pricing page.`
    );

    // Subscribe to EmailOctopus with plan tag (fire-and-forget)
    const nameParts = name.trim().split(' ');
    subscribeContact(db, {
      email: email.trim().toLowerCase(),
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      tags: [planTag, 'pricing-page'],
    }).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
