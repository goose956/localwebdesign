const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// List all sessions (admin)
router.get('/', verifyToken, (req, res) => {
  const sessions = db.prepare(`
    SELECT
      s.session_id,
      s.message_count,
      s.started_at,
      s.last_message_at,
      (SELECT content FROM chat_messages WHERE session_id = s.session_id AND role = 'user' ORDER BY id ASC LIMIT 1) as first_message
    FROM chat_sessions s
    ORDER BY s.last_message_at DESC
  `).all();
  res.json(sessions);
});

// Get full conversation for a session (admin)
router.get('/:sessionId', verifyToken, (req, res) => {
  const messages = db.prepare(
    'SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC'
  ).all(req.params.sessionId);
  res.json(messages);
});

// Delete a session and its messages (admin)
router.delete('/:sessionId', verifyToken, (req, res) => {
  db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(req.params.sessionId);
  db.prepare('DELETE FROM chat_sessions WHERE session_id = ?').run(req.params.sessionId);
  res.json({ success: true });
});

// Clear all sessions (admin)
router.delete('/', verifyToken, (req, res) => {
  db.prepare('DELETE FROM chat_messages').run();
  db.prepare('DELETE FROM chat_sessions').run();
  res.json({ success: true });
});

module.exports = router;
