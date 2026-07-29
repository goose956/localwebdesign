const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { messages, sessionId } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  // Generate or reuse session ID
  const sid = sessionId || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Ensure session row exists
  db.prepare(`
    INSERT INTO chat_sessions (session_id, message_count, started_at, last_message_at)
    VALUES (?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(session_id) DO NOTHING
  `).run(sid);

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

  // Pull active knowledge base from DB
  const knowledge = db.prepare(
    'SELECT category, title, content FROM chat_knowledge WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  const knowledgeText = knowledge.length > 0
    ? knowledge.map(k => `### ${k.title}\n${k.content}`).join('\n\n')
    : 'No knowledge base configured yet.';

  // API key: DB setting takes priority over environment variable
  const keyRow = db.prepare("SELECT value FROM site_settings WHERE key = 'openai_api_key'").get();
  const apiKey = keyRow?.value || process.env.OPENAI_API_KEY;

  // Pull conversation goal and chatbot name from settings
  const goalRow = db.prepare("SELECT value FROM site_settings WHERE key = 'chatbot_goal'").get();
  const nameRow = db.prepare("SELECT value FROM site_settings WHERE key = 'chatbot_name'").get();
  const botName = nameRow?.value || 'Alex';
  const conversationGoal = goalRow?.value ||
    'Guide the visitor towards choosing and signing up for one of our plans (Starter, Professional, or Enterprise) by directing them to the Pricing page.';

  // Graceful fallback if no API key configured
  if (!apiKey) {
    return res.json({
      message: "I'm not fully set up yet — but I'd love to chat about your project! Please use our contact form or give us a call and we'll get back to you within 24 hours. 😊",
    });
  }

  const systemPrompt = `You are ${botName}, a friendly web design consultant working for Pixel&Craft. You chat with potential clients on the Pixel&Craft website.

YOUR PRIMARY GOAL:
${conversationGoal}

Every conversation should naturally progress towards this goal. Once you understand the customer's needs, steer the conversation confidently in this direction.

IMPORTANT — you represent the COMPANY, not yourself personally:
- Always say "we", "us", "our team" when referring to Pixel&Craft. Never say "I'm based..." — say "We're based..."
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
