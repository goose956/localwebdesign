/* OpenTwentyFour voice agent widget — a Gemini Live API voice demo embedded on Site Builder
 * demo sites via <script type="module" src=".../voice-widget.js?v=1" data-site-id="..."
 * data-api-base="..."> injected at publish time when a site's voiceEnabled flag is on. Loads
 * the official @google/genai SDK from esm.sh (no bundler needed here — this file ships
 * byte-for-byte from client/public/, same as widget.js) and opens a direct browser-to-Gemini
 * WebSocket session using a short-lived token minted by /api/voice/token — this file, and this
 * server, never see the real Gemini API key.
 *
 * esm.sh, not jsDelivr's raw dist/web/index.mjs: that file ships with an unresolved bare
 * `import pRetry from 'p-retry'` baked in, which is a valid Node-style import but not something a
 * browser can resolve on its own (bare specifiers need an import map or a bundler) — it throws
 * "Failed to resolve module specifier" and the whole script fails before the mic bubble ever
 * renders. esm.sh rewrites the entire dependency graph to real, fetchable URLs; confirmed by
 * pulling its resolved bundle and checking it has zero remaining bare imports.
 *
 * Shares the same #chat-widget-slot mount point as widget.js (both are inert without it, and
 * both just append their own elements into it independently — no coordination needed between
 * the two scripts). Positioned bottom-LEFT so it never collides with the chat bubble at
 * bottom-right when a site has both enabled.
 */
import { GoogleGenAI, Modality } from 'https://esm.sh/@google/genai';

// document.currentScript is spec'd to return null inside a type="module" script — it only works
// for classic scripts (which is why widget.js, a classic script, could use it). import.meta.url
// is the module-correct equivalent, and since this file is always served from the same origin as
// the API it calls (Site Builder always sets pixelCraftApiUrl to that one server), deriving
// apiBase from it needs no separate data-api-base attribute at all.
var apiBase = '';
try { apiBase = new URL(import.meta.url).origin; } catch (e) {}
apiBase = (apiBase || '').replace(/\/$/, '');

(function () {
  if (!apiBase) return; // nothing sensible to call — stay inert rather than error

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
    return; // unsupported browser — stay inert rather than show a button that can only fail
  }

  // This is a <head> script, executed before the React app below it in the document has had a
  // chance to mount and render #chat-widget-slot — checking for it once and bailing if absent
  // (the original approach) meant this NEVER found it, deterministically, not just as a rare
  // race. Poll briefly instead; give up after 10s in case something's genuinely wrong rather than
  // polling forever.
  var attempts = 0;
  var pollTimer = setInterval(function () {
    attempts++;
    var slot = document.getElementById('chat-widget-slot');
    if (slot) { clearInterval(pollTimer); init(slot); }
    else if (attempts >= 100) { clearInterval(pollTimer); }
  }, 100);

  function init(slot) {
  var siteId = slot.getAttribute('data-site-id') || '';

  // ---- styles ---------------------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent = [
    '#pc-voice-bubble{position:fixed;bottom:20px;left:20px;z-index:2147483000;width:56px;height:56px;',
    'border-radius:9999px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.25);background:linear-gradient(135deg,var(--sb-primary,#1d4ed8),var(--sb-primary-dark,#1e3a8a));',
    'transition:transform .2s ease;}',
    '#pc-voice-bubble:hover{transform:scale(1.06);}',
    '#pc-voice-bubble.pc-voice-live{animation:pcVoicePulse 1.4s ease-in-out infinite;}',
    '@keyframes pcVoicePulse{0%,100%{box-shadow:0 8px 24px rgba(0,0,0,0.25),0 0 0 0 rgba(239,68,68,.45)}',
    '50%{box-shadow:0 8px 24px rgba(0,0,0,0.25),0 0 0 9px rgba(239,68,68,0)}}',
    '#pc-voice-status{position:fixed;bottom:84px;left:20px;z-index:2147483000;max-width:220px;',
    'padding:8px 12px;border-radius:10px;font-size:12px;line-height:1.4;display:none;font-family:inherit;',
    'background:var(--sb-bg,#fff);color:var(--sb-text,#0f172a);box-shadow:0 8px 24px rgba(0,0,0,0.2);border:1px solid rgba(0,0,0,0.08);}',
    '#pc-voice-status.show{display:block;}',
  ].join('');
  document.head.appendChild(style);

  // ---- markup -----------------------------------------------------------------------------
  var bubble = document.createElement('button');
  bubble.id = 'pc-voice-bubble';
  bubble.setAttribute('aria-label', 'Talk to us');
  bubble.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"/>' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-14 0M12 18v3"/></svg>';

  var status = document.createElement('div');
  status.id = 'pc-voice-status';

  slot.appendChild(status);
  slot.appendChild(bubble);

  var statusTimer = null;
  function showStatus(text, autoHideMs) {
    status.textContent = text;
    status.classList.add('show');
    if (statusTimer) clearTimeout(statusTimer);
    if (autoHideMs) statusTimer = setTimeout(hideStatus, autoHideMs);
  }
  function hideStatus() { status.classList.remove('show'); }

  // ---- audio helpers ------------------------------------------------------------------------
  function base64ToArrayBuffer(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  function arrayBufferToBase64(buf) {
    var bytes = new Uint8Array(buf);
    var binary = '';
    for (var i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  var state = { active: false, inputCtx: null, outputCtx: null, session: null, stream: null, processor: null, nextPlayTime: 0 };

  // Model output is 24kHz mono 16-bit PCM. Chunks are queued back-to-back (nextPlayTime tracks
  // where the previous chunk ends) so playback stays gapless instead of overlapping or racing.
  function playPcmChunk(arrayBuffer) {
    var ctx = state.outputCtx;
    if (!ctx) return;
    var int16 = new Int16Array(arrayBuffer);
    var float32 = new Float32Array(int16.length);
    for (var i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    var buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    var startAt = Math.max(ctx.currentTime, state.nextPlayTime);
    source.start(startAt);
    state.nextPlayTime = startAt + buffer.duration;
  }

  function clearQueuedAudio() {
    // Barge-in: Gemini marks a turn `interrupted` when the visitor starts talking over it.
    // Already-scheduled AudioBufferSourceNodes can't be unscheduled individually, so instead we
    // just stop honouring the old timeline — the next chunk starts at "now" instead of queueing
    // behind audio that's about to be irrelevant.
    if (state.outputCtx) state.nextPlayTime = state.outputCtx.currentTime;
  }

  function stop(message) {
    var wasActive = state.active;
    state.active = false;
    bubble.classList.remove('pc-voice-live');
    if (message) showStatus(message, 3000); else hideStatus();
    try { state.session && state.session.close(); } catch (e) {}
    try { state.processor && state.processor.disconnect(); } catch (e) {}
    try { state.stream && state.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { state.inputCtx && state.inputCtx.close(); } catch (e) {}
    try { state.outputCtx && state.outputCtx.close(); } catch (e) {}
    state.session = null; state.stream = null; state.inputCtx = null; state.outputCtx = null; state.processor = null;
    return wasActive;
  }

  async function start() {
    showStatus('Connecting…');
    var tokenRes, tokenData;
    try {
      tokenRes = await fetch(apiBase + '/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: siteId }),
      });
      tokenData = await tokenRes.json();
    } catch (e) {
      showStatus('Connection issue — please try again.', 3000);
      return;
    }
    if (!tokenRes.ok || !tokenData.token) {
      var msg = tokenData && tokenData.error === 'not_synced'
        ? 'Voice agent is still warming up — try again shortly.'
        : 'Voice agent unavailable right now.';
      showStatus(msg, 3500);
      return;
    }

    var stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      showStatus('Microphone access is needed to talk — please allow it.', 4000);
      return;
    }

    state.stream = stream;
    state.outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    state.inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    state.nextPlayTime = 0;

    var ai = new GoogleGenAI({ apiKey: tokenData.token });

    try {
      state.session = await ai.live.connect({
        model: tokenData.model,
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onopen: function () {
            state.active = true;
            bubble.classList.add('pc-voice-live');
            showStatus('Listening — talk anytime.');
          },
          onmessage: function (message) {
            if (message.serverContent && message.serverContent.interrupted) clearQueuedAudio();
            var parts = (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) || [];
            parts.forEach(function (p) {
              if (p.inlineData && p.inlineData.mimeType && p.inlineData.mimeType.indexOf('audio/pcm') === 0 && p.inlineData.data) {
                playPcmChunk(base64ToArrayBuffer(p.inlineData.data));
              }
            });
          },
          onerror: function () { stop('Connection issue — try again.'); },
          onclose: function () { if (state.active) stop(); },
        },
      });
    } catch (e) {
      stop('Could not start voice session.');
      return;
    }

    // Mic capture: Web Audio resamples a MediaStream source to the AudioContext's own sample
    // rate (16000 here) automatically — no manual resampling math needed. ScriptProcessorNode is
    // deprecated but still universally supported, and is the simplest single-file way to read
    // raw PCM frames without hosting a separate AudioWorklet module file for this demo widget.
    var source = state.inputCtx.createMediaStreamSource(stream);
    var processor = state.inputCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = function (e) {
      if (!state.active || !state.session) return;
      var input = e.inputBuffer.getChannelData(0);
      var pcm16 = new Int16Array(input.length);
      for (var i = 0; i < input.length; i++) {
        var s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      try {
        state.session.sendRealtimeInput({ media: { data: arrayBufferToBase64(pcm16.buffer), mimeType: 'audio/pcm;rate=16000' } });
      } catch (e2) {}
    };
    source.connect(processor);
    processor.connect(state.inputCtx.destination);
    state.processor = processor;
  }

  bubble.addEventListener('click', function () {
    if (state.active) stop(); else start();
  });
  } // end init()
})();
