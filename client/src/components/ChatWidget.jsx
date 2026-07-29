import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../context/ChatContext.jsx';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm Alex, your web design consultant 👋 I'm here to help you find the perfect website solution for your business. What kind of business do you run?",
};

const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-2 h-2 rounded-full"
        style={{
          background: 'var(--primary)',
          animation: `typingDot 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
          opacity: 0.6,
        }} />
    ))}
  </div>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

export default function ChatWidget() {
  const { isOpen, openChat, closeChat } = useChat();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [hasNew, setHasNew]     = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setHasNew(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isOpen && messages.length > 1) setHasNew(true);
  }, [messages]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, sessionId }),
      });
      const data = await res.json();
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message || "Sorry, something went wrong!" }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection issue on my end! Try again, or contact us directly. 🙏" }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickReplies = messages.length === 1 ? [
    "I need a new website",
    "I want to redesign my site",
    "I need an online shop",
    "Tell me about your pricing",
  ] : [];

  return (
    <>
      {/* Typing dot animation */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--glow); }
          50% { box-shadow: 0 0 0 10px transparent; }
        }
      `}</style>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-5 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: 'min(380px, calc(100vw - 24px))',
            height: 'min(540px, calc(100vh - 120px))',
            animation: 'chatSlideUp 0.3s ease forwards',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: 'var(--gradient)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-none">Alex</p>
              <p className="text-white/70 text-xs mt-0.5">Web Design Consultant · Online</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/pricing" onClick={closeChat}
                className="text-white/70 hover:text-white text-xs font-medium transition-colors">
                Pricing ↗
              </Link>
              <button onClick={closeChat} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Close chat">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 mt-auto mb-0.5 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'var(--gradient)', minWidth: 24 }}>A</div>
                )}
                <div
                  className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'user' ? {
                    background: 'var(--gradient)',
                    color: '#fff',
                    borderBottomRightRadius: 4,
                  } : {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderBottomLeftRadius: 4,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 mt-auto mb-0.5 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--gradient)', minWidth: 24 }}>A</div>
                <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick reply chips */}
            {quickReplies.length > 0 && !loading && (
              <div className="flex flex-wrap gap-2 mt-1">
                {quickReplies.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{ background: 'var(--bg-card)', color: 'var(--primary)', border: '1px solid var(--primary)', opacity: 0.9 }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3 flex gap-2 items-end"
            style={{ borderTop: '1px solid var(--border)' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              rows={1}
              className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                maxHeight: 100,
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: 'var(--gradient)' }}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={isOpen ? closeChat : openChat}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300"
        style={{
          background: isOpen ? '#1e293b' : 'var(--gradient)',
          border: isOpen ? '2px solid var(--border)' : 'none',
          animation: !isOpen ? 'chatPulse 3s ease-in-out infinite' : 'none',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {/* Unread dot */}
        {hasNew && !isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-bg-primary"
            style={{ background: '#ef4444', borderColor: 'var(--bg-primary)' }} />
        )}
      </button>
    </>
  );
}
