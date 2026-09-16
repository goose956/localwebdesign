const express = require('express');
const db = require('../db');

const router = express.Router();

// Preview API — Google renames/reissues Live model ids periodically (this was researched
// 2026-09-16, the day after "gemini-3.8-live" shipped). If token minting starts failing with a
// "model not found"-style error, check https://ai.google.dev/gemini-api/docs/live-api for the
// current model id and update this constant — nothing else needs to change.
const LIVE_MODEL = 'models/gemini-3.8-live';

// "Capella" is the HD voice Google's own docs call out as carrying a British accent. The formal
// en-GB language code isn't supported yet on native-audio models, so the accent is reinforced via
// the system instruction below (specific phrasing, not just "British accent") rather than a
// locale setting.
const VOICE_NAME = 'Capella';

// POST /api/voice/token — mints a short-lived Gemini Live API token scoped to one Site Builder
// demo site's synced business data, so a public demo page can open a voice session directly with
// Gemini without this server proxying the actual audio (keeps latency down) and without the real
// Gemini API key ever reaching the browser. Reads the exact same `clients` row /api/chat already
// reads for text — voice and chat share one synced-data path, just phrase the system prompt
// differently (short spoken sentences vs a chat-window reply).
router.post('/token', async (req, res) => {
  const { siteId } = req.body || {};
  if (!siteId || typeof siteId !== 'string') {
    return res.status(400).json({ error: 'siteId required' });
  }

  const keyRow = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_api_key'").get();
  const apiKey = keyRow?.value || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'not_configured' });
  }

  const client = db.prepare('SELECT * FROM clients WHERE site_id = ?').get(siteId);
  if (!client) {
    // Not synced yet — same reasoning as chat.js: never fall through to a generic assistant,
    // that would answer as the wrong business entirely.
    return res.status(404).json({ error: 'not_synced' });
  }

  let services = [];
  try { services = JSON.parse(client.services || '[]'); } catch {}
  const servicesText = services.length > 0
    ? services.map(s => `${s.name}: ${s.blurb}`).join('. ')
    : 'no services listed';

  const systemInstruction = `You are a friendly phone-style voice assistant for ${client.business_name}. ` +
    `Speak with a natural British English accent, as heard in England. Keep every reply to 1-3 short ` +
    `spoken sentences — this is a live voice conversation, not a chat window, so never use lists, ` +
    `markdown, or long explanations.\n\n` +
    `ABOUT: ${client.about_text || 'no details provided'}\n` +
    `SERVICES: ${servicesText}\n` +
    `ADDITIONAL NOTES: ${client.extra_notes || 'none'}\n\n` +
    `Answer using ONLY the information above — never invent services, prices, or availability. If ` +
    `asked about cost, say pricing depends on the job and suggest calling ${client.phone || 'the business'} ` +
    `for an accurate quote. Always steer the conversation toward the visitor calling ` +
    `${client.phone || 'the business'} or leaving their details.`;

  try {
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const tokenRes = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } } },
            tools: [],
          },
        },
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData?.name) {
      return res.status(502).json({ error: 'token_mint_failed', detail: tokenData?.error?.message || 'Unknown error' });
    }
    res.json({ token: tokenData.name, model: LIVE_MODEL, businessName: client.business_name, phone: client.phone });
  } catch (e) {
    res.status(502).json({ error: 'token_mint_failed', detail: e.message });
  }
});

module.exports = router;
