const express = require('express');
const db = require('../db');

const router = express.Router();

// Preview API — Google renames/reissues Live model ids periodically (this was researched
// 2026-09-16, the day after "gemini-3.8-live" shipped). If token minting starts failing with a
// "model not found"-style error, check https://ai.google.dev/gemini-api/docs/live-api for the
// current model id and update this constant — nothing else needs to change.
const LIVE_MODEL = 'models/gemini-3.8-live';

// "Capella" is the HD voice Google's own docs call out as carrying a British accent. Confirmed
// against the live v1beta discovery doc (2026-09-16) that `en-GB` IS a valid SpeechConfig
// languageCode for this model — combined with the system instruction's explicit phrasing below,
// not relying on the voice/prompt alone.
const VOICE_NAME = 'Capella';
const LANGUAGE_CODE = 'en-GB';

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
    `${client.phone || 'the business'} or leaving their details.\n\n` +
    `The very first message you receive each session is not from the visitor — it's a stage ` +
    `direction telling you the call has just connected. Answer it the way a receptionist answers a ` +
    `ringing phone: a brief, warm greeting naming the business (e.g. "${client.business_name}, how ` +
    `can I help?"), then stop and wait — do not pre-empt what the visitor might ask.`;

  try {
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    // Field names verified 2026-09-16 against Google's own v1beta discovery doc — the Live API
    // docs page describing this as `liveConnectConstraints` was wrong/outdated; the real
    // AuthToken resource nests everything under `bidiGenerateContentSetup`. Because fieldMask is
    // left empty here, this pinned setup entirely REPLACES whatever the browser client sends on
    // connect (per the schema's own documented behaviour) — that's what makes locking it here
    // actually secure, not just a hint the client could override.
    const tokenRes = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        bidiGenerateContentSetup: {
          model: LIVE_MODEL,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          // Diagnostic aid, not a product feature yet: inputAudioTranscription surfaces what
          // Gemini actually heard from the visitor's mic as text in serverContent — the widget
          // logs it to the console, which is how we can tell "your audio never arrived / arrived
          // as noise" apart from "it arrived fine but the reply logic is what's broken" without
          // needing server-side audio logging. outputAudioTranscription alongside it for the same
          // reason on the reply side. These must be set here (not client-side) — the client's own
          // connect() config is fully replaced by this locked setup per the empty fieldMask above.
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
              languageCode: LANGUAGE_CODE,
            },
          },
          tools: [],
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
