/* OpenTwentyFour chat widget — embedded on Site Builder demo sites via a single
 * <script src=".../widget.js?v=1" data-site-id="..." data-api-base="..." async> tag,
 * injected at publish time. Plain vanilla JS, no framework, no build step — Vite ships this
 * file byte-for-byte from client/public/ into client/dist/, served statically by the same
 * Express app that serves the OpenTwentyFour marketing site and its API.
 *
 * Mirrors src/components/ChatWidget.jsx's visual design (bubble, slide-up panel, gradient
 * header, typing-dots) but themed via Site Builder's own CSS variable names (--sb-primary
 * etc, set by src/template/palettes.js on every generated site's wrapping element) instead of
 * OpenTwentyFour's own theme variables — since this script runs INSIDE a demo site's own page,
 * where those variables are already in scope, it inherits that site's palette automatically
 * just by referencing the same names. Site Builder palettes have no pre-built gradient string
 * (unlike OpenTwentyFour's own themes), so this builds its own 2-stop gradient from
 * --sb-primary -> --sb-primary-dark wherever the original widget used var(--gradient).
 */
(function () {
  var slot = document.getElementById('chat-widget-slot');
  if (!slot) return; // inert without the mount point — safe to include on any page

  var siteId = slot.getAttribute('data-site-id') || '';

  var siteDataEl = document.getElementById('site-data');
  var siteData = {};
  try { siteData = siteDataEl ? JSON.parse(siteDataEl.textContent) : {}; } catch (e) {}
  var businessName = siteData.name || 'us';
  var businessPhone = siteData.phone || '';

  // The <script> tag that loaded this file — used to read config attributes and, as a
  // fallback, to derive the API's origin from this script's own src (since it's served by the
  // very same OpenTwentyFour app the API lives on).
  var thisScript = document.currentScript;
  var apiBase = (thisScript && thisScript.getAttribute('data-api-base')) || '';
  if (!apiBase && thisScript && thisScript.src) {
    try { apiBase = new URL(thisScript.src).origin; } catch (e) {}
  }
  apiBase = (apiBase || '').replace(/\/$/, '');
  if (!apiBase) return; // nothing sensible to call — stay inert rather than error

  // ---- styles ---------------------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent = [
    '#pc-chat-bubble{position:fixed;bottom:20px;right:20px;z-index:2147483000;width:56px;height:56px;',
    'border-radius:9999px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.25);background:linear-gradient(135deg,var(--sb-primary,#1d4ed8),var(--sb-primary-dark,#1e3a8a));',
    'transition:transform .2s ease;}',
    '#pc-chat-bubble:hover{transform:scale(1.06);}',
    '#pc-chat-panel{position:fixed;bottom:88px;right:20px;z-index:2147483000;width:min(380px,calc(100vw - 24px));',
    'height:min(540px,calc(100vh - 120px));border-radius:16px;overflow:hidden;display:none;flex-direction:column;',
    'background:var(--sb-bg,#fff);border:1px solid rgba(0,0,0,0.08);box-shadow:0 20px 50px rgba(0,0,0,0.25);',
    'font-family:inherit;animation:pcSlideUp .25s ease forwards;}',
    '#pc-chat-panel.open{display:flex;}',
    '@keyframes pcSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
    '.pc-chat-header{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:12px 14px;',
    'background:linear-gradient(135deg,var(--sb-primary,#1d4ed8),var(--sb-primary-dark,#1e3a8a));color:#fff;}',
    '.pc-chat-avatar{width:34px;height:34px;border-radius:9999px;background:rgba(255,255,255,0.2);',
    'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;}',
    '.pc-chat-title{flex:1;min-width:0;}',
    '.pc-chat-title strong{display:block;font-size:13px;line-height:1.2;}',
    '.pc-chat-title span{display:block;font-size:11px;opacity:.85;}',
    '.pc-chat-close{background:rgba(255,255,255,0.15);border:none;color:#fff;width:26px;height:26px;',
    'border-radius:9999px;cursor:pointer;font-size:14px;line-height:1;flex-shrink:0;}',
    '.pc-chat-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;}',
    '.pc-msg{max-width:80%;padding:9px 12px;border-radius:14px;font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word;}',
    '.pc-msg-user{align-self:flex-end;background:linear-gradient(135deg,var(--sb-primary,#1d4ed8),var(--sb-primary-dark,#1e3a8a));color:#fff;border-bottom-right-radius:4px;}',
    '.pc-msg-bot{align-self:flex-start;background:var(--sb-bg-alt,#f1f5f9);color:var(--sb-text,#0f172a);border-bottom-left-radius:4px;}',
    '.pc-typing{align-self:flex-start;display:flex;gap:4px;padding:10px 12px;background:var(--sb-bg-alt,#f1f5f9);border-radius:14px;border-bottom-left-radius:4px;}',
    '.pc-typing span{width:6px;height:6px;border-radius:9999px;background:var(--sb-primary,#1d4ed8);opacity:.5;animation:pcDot 1.2s ease-in-out infinite;}',
    '.pc-typing span:nth-child(2){animation-delay:.2s;} .pc-typing span:nth-child(3){animation-delay:.4s;}',
    '@keyframes pcDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}',
    '.pc-chat-inputrow{flex-shrink:0;display:flex;gap:6px;padding:10px;border-top:1px solid rgba(0,0,0,0.08);}',
    '.pc-chat-input{flex:1;resize:none;border:1px solid rgba(0,0,0,0.12);border-radius:10px;padding:8px 10px;',
    'font-size:13px;font-family:inherit;color:var(--sb-text,#0f172a);background:var(--sb-bg,#fff);outline:none;max-height:80px;}',
    '.pc-chat-send{border:none;border-radius:10px;width:38px;height:38px;flex-shrink:0;cursor:pointer;color:#fff;',
    'display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--sb-primary,#1d4ed8),var(--sb-primary-dark,#1e3a8a));}',
    '.pc-chat-send:disabled{opacity:.4;cursor:default;}',
  ].join('');
  document.head.appendChild(style);

  // ---- markup -----------------------------------------------------------------------------
  var bubble = document.createElement('button');
  bubble.id = 'pc-chat-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';

  var panel = document.createElement('div');
  panel.id = 'pc-chat-panel';

  var initial = escapeHtml(businessName);
  panel.innerHTML =
    '<div class="pc-chat-header">' +
      '<div class="pc-chat-avatar">' + initial.charAt(0).toUpperCase() + '</div>' +
      '<div class="pc-chat-title"><strong>' + initial + '</strong><span>Usually replies in a few minutes</span></div>' +
      '<button class="pc-chat-close" aria-label="Close chat">&times;</button>' +
    '</div>' +
    '<div class="pc-chat-messages" id="pc-chat-messages"></div>' +
    '<div class="pc-chat-inputrow">' +
      '<textarea class="pc-chat-input" id="pc-chat-input" rows="1" placeholder="Type your message…"></textarea>' +
      '<button class="pc-chat-send" id="pc-chat-send" aria-label="Send">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>' +
      '</button>' +
    '</div>';

  slot.appendChild(bubble);
  slot.appendChild(panel);

  var messagesEl = panel.querySelector('#pc-chat-messages');
  var inputEl = panel.querySelector('#pc-chat-input');
  var sendBtn = panel.querySelector('#pc-chat-send');
  var closeBtn = panel.querySelector('.pc-chat-close');

  // ---- state --------------------------------------------------------------------------
  var state = {
    messages: [{ role: 'assistant', content: 'Hi! Ask me anything about ' + businessName + ' 👋' }],
    sessionId: null,
    loading: false,
    open: false,
  };

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    var html = state.messages.map(function (m) {
      var cls = m.role === 'user' ? 'pc-msg pc-msg-user' : 'pc-msg pc-msg-bot';
      return '<div class="' + cls + '">' + escapeHtml(m.content) + '</div>';
    }).join('');
    if (state.loading) {
      html += '<div class="pc-typing"><span></span><span></span><span></span></div>';
    }
    messagesEl.innerHTML = html;
    messagesEl.scrollTop = messagesEl.scrollHeight;
    sendBtn.disabled = state.loading;
  }

  function setOpen(open) {
    state.open = open;
    panel.classList.toggle('open', open);
    if (open) { render(); setTimeout(function () { inputEl.focus(); }, 50); }
  }

  bubble.addEventListener('click', function () { setOpen(!state.open); });
  closeBtn.addEventListener('click', function () { setOpen(false); });

  async function send() {
    var text = inputEl.value.trim();
    if (!text || state.loading) return;
    state.messages.push({ role: 'user', content: text });
    inputEl.value = '';
    state.loading = true;
    render();

    try {
      var res = await fetch(apiBase + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.messages, sessionId: state.sessionId, siteId: siteId }),
      });
      var data = await res.json();
      if (data.sessionId && !state.sessionId) state.sessionId = data.sessionId;
      state.messages.push({ role: 'assistant', content: data.message || "Sorry, something went wrong!" });
    } catch (e) {
      state.messages.push({ role: 'assistant', content: 'Connection issue on my end! Try again, or call ' + (businessPhone || 'us') + '.' });
    }
    state.loading = false;
    render();
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  render();
})();
