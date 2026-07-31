const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { messages, sessionId, siteId } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  // Generate or reuse session ID
  const sid = sessionId || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Ensure session row exists. client_site_id is only ever set on first creation (ON CONFLICT
  // DO NOTHING) — a session's tenant never changes mid-conversation. NULL means this is
  // OpenTwentyFour's own visitor chat, unchanged from before this column existed.
  db.prepare(`
    INSERT INTO chat_sessions (session_id, client_site_id, message_count, started_at, last_message_at)
    VALUES (?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(session_id) DO NOTHING
  `).run(sid, siteId || null);

  // Save the latest user message (last in array)
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'user', String(lastUserMsg.content).slice(0, 2000));
    db.prepare("UPDATE chat_sessions SET message_count = message_count + 1, last_message_at = CURRENT_TIMESTAMP WHERE session_id = ?").run(sid);
  }

  // Sanitize — only last 20 turns, no injections
  const history = messages.slice(-20).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 800),
  }));

  // API key: DB setting takes priority over environment variable — shared by both OpenTwentyFour's
  // own chat and every client site's, there is no per-client OpenAI key.
  const keyRow = db.prepare("SELECT value FROM site_settings WHERE key = 'openai_api_key'").get();
  const apiKey = keyRow?.value || process.env.OPENAI_API_KEY;

  // Graceful fallback if no API key configured — shared by both branches below.
  if (!apiKey) {
    return res.json({
      sessionId: sid,
      message: "I'm not fully set up yet — but I'd love to chat about your project! Please use our contact form or give us a call and we'll get back to you within 24 hours. 😊",
    });
  }

  let systemPrompt;

  if (siteId) {
    // ── Client demo site path — a Site Builder site, not OpenTwentyFour itself ──────────────
    const client = db.prepare('SELECT * FROM clients WHERE site_id = ?').get(siteId);

    if (!client) {
      // Not synced yet (chat was enabled but the site hasn't been published since, or the
      // sync call failed) — don't fall through to OpenTwentyFour's own knowledge base, that
      // would answer as the wrong business entirely.
      return res.json({
        sessionId: sid,
        message: "I'm not fully set up yet — please give us a call and we'll help right away! 😊",
      });
    }

    let services = [];
    try { services = JSON.parse(client.services || '[]'); } catch {}
    const servicesText = services.length > 0
      ? services.map(s => `- ${s.name}: ${s.blurb}`).join('\n')
      : '(no services listed)';

    systemPrompt = `You are a friendly assistant for ${client.business_name}. You chat with visitors on their website.

Answer using ONLY the information below. Do not invent services, prices, or availability.

ABOUT: ${client.about_text || '(no about text provided)'}

SERVICES:
${servicesText}

ADDITIONAL NOTES: ${client.extra_notes || '(none)'}

PRICING RULE (always follow this): Never quote a specific price or number. If asked about cost,
tell them pricing depends on the job and encourage them to call ${client.phone || 'us'} for a
quick, accurate quote.

Keep replies short (2-4 sentences), friendly, and always steer toward calling ${client.phone || 'us'}
or leaving their details, since that's how the business actually converts enquiries.`;
  } else {
    // ── OpenTwentyFour's own chat — completely unchanged from before this feature existed ──
    const knowledge = db.prepare(
      'SELECT category, title, content FROM chat_knowledge WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    const knowledgeText = knowledge.length > 0
      ? knowledge.map(k => `### ${k.title}\n${k.content}`).join('\n\n')
      : 'No knowledge base configured yet.';

    const goalRow = db.prepare("SELECT value FROM site_settings WHERE key = 'chatbot_goal'").get();
    const nameRow = db.prepare("SELECT value FROM site_settings WHERE key = 'chatbot_name'").get();
    const botName = nameRow?.value || 'Alex';
    const conversationGoal = goalRow?.value ||
      'Guide the visitor towards choosing and signing up for one of our plans (Starter, Professional, or Enterprise) by directing them to the Pricing page.';

    systemPrompt = `You are ${botName}, a friendly web design consultant working for OpenTwentyFour. You chat with potential clients on the OpenTwentyFour website.

YOUR PRIMARY GOAL:
${conversationGoal}

Every conversation should naturally progress towards this goal. Once you understand the customer's needs, steer the conversation confidently in this direction.

IMPORTANT — you represent the COMPANY, not yourself personally:
- Always say "we", "us", "our team" when referring to OpenTwentyFour. Never say "I'm based..." — say "We're based..."
- Answer factual questions about the company directly and accurately using the knowledge base below
- Do NOT be evasive. If someone asks where we are based, tell them the location clearly.

RESPONSE FORMAT — every reply must follow this structure:
1. Answer the customer's question directly (1-3 sentences)
2. Blank line
3. One short follow-up question about THEIR business or project

FOLLOW-UP RULES:
- The follow-up must always be about the CUSTOMER — their business type, website situation, goals, or timeline
- NEVER ask the customer to confirm or relate to facts you just told them about the company
- Wrong: "Are you based there too?" / "Does that location work for you?"
- Right: "What kind of business do you run?" / "Do you currently have a website?"

Always refer to the company as "we" / "us" / "our team". Use occasional friendly emojis. Keep responses concise. Never fabricate information.

--- KNOWLEDGE BASE ---
${knowledgeText}
--- END KNOWLEDGE BASE ---`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI error:', data.error.message);
      return res.json({ sessionId: sid, message: "I'm having a quick brain moment! Try again in a second, or drop us a message via the Contact page. 😅" });
    }

    const reply = data.choices[0].message.content.trim();

    // Save assistant reply to log
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'assistant', reply);
    db.prepare("UPDATE chat_sessions SET message_count = message_count + 1, last_message_at = CURRENT_TIMESTAMP WHERE session_id = ?").run(sid);

    res.json({ sessionId: sid, message: reply });
  } catch (err) {
    console.error('Chat fetch error:', err.message);
    res.json({ sessionId: sid, message: "Connection hiccup on my end — sorry! Feel free to use our contact form and we'll be in touch within 24 hours. 🙏" });
  }
});

module.exports = router;
