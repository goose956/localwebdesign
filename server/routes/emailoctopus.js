const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { fetchLists } = require('../utils/emailoctopus');

const router = express.Router();

// GET /api/emailoctopus/lists — fetch lists from EO using stored API key (admin)
router.get('/lists', verifyToken, async (req, res) => {
  const keyRow = db.prepare("SELECT value FROM site_settings WHERE key = 'emailoctopus_api_key'").get();
  if (!keyRow?.value) {
    return res.status(400).json({ error: 'EmailOctopus API key not set. Add it in Settings first.' });
  }
  try {
    const lists = await fetchLists(keyRow.value);
    res.json(lists);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
