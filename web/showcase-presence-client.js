const STORAGE_KEY = 'cc2027:showcase-session:v1';
const PREF_KEY = 'cc2027:showcase-participation:v1';

function readPreference() {
  try { return sessionStorage.getItem(PREF_KEY) !== '0'; } catch { return true; }
}

function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    return saved?.sessionId && /^[a-f0-9-]{36}$/i.test(saved.sessionId) ? saved : null;
  } catch { return null; }
}

export function createShowcaseParticipation({ getState, getAvatar }) {
  let session = readSession();
  let optedIn = readPreference();
  let heartbeat = 0;
  let frameTimer = 0;
  let frameRaf = 0;
  let frameDemandTimer = 0;
  let frameDemandUntil = 0;
  let lastCaptureAt = 0;
  let status = 'roaming';
  let gameTitle = '';
  let score = null;
  let busy = false;
  let frameBusy = false;
  let activeJoin = false;

  function frameData() {
    const canvas = document.getElementById('mgCanvas');
    if (!canvas || canvas.width < 1 || canvas.height < 1) return null;
    const scale = Math.min(1, 480 / canvas.width, 270 / canvas.height);
    const target = document.createElement('canvas');
    target.width = Math.max(1, Math.round(canvas.width * scale));
    target.height = Math.max(1, Math.round(canvas.height * scale));
    target.getContext('2d').drawImage(canvas, 0, 0, target.width, target.height);
    return new Promise(resolve => target.toBlob(resolve, 'image/webp', 0.5));
  }

  async function post(url, body, keepalive = false) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
  }

  async function sendPresence(includeAvatar = false) {
    if (!optedIn || !getState().tourEntered || busy) return;
    const current = getState();
    const body = {
      sessionId: session.sessionId,
      status,
      currentPlaceId: current.currentPlaceId,
      targetPlaceId: current.targetPlaceId,
      position: current.position,
      displayName: current.displayName,
      gameTitle,
      score,
    };
    if (includeAvatar || !activeJoin) {
      const avatar = getAvatar();
      if (!avatar || avatar.width < 1 || avatar.height < 1) return;
      const scale = Math.min(1, 640 / Math.max(avatar.width, avatar.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(avatar.width * scale));
      canvas.height = Math.max(1, Math.round(avatar.height * scale));
      canvas.getContext('2d').drawImage(avatar, 0, 0, canvas.width, canvas.height);
      body.avatar = canvas.toDataURL('image/png');
    }
    busy = true;
    try {
      const response = await post('/api/showcase/session', body);
      if (response.ok) {
        const data = await response.json();
        session.publicId = data.publicId;
        activeJoin = true;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    } catch { /* Offline locally; retry on the next heartbeat. */ }
    finally { busy = false; }
  }

  function stopFrameCapture() {
    clearInterval(frameTimer); frameTimer = 0;
    clearInterval(frameDemandTimer); frameDemandTimer = 0;
    cancelAnimationFrame(frameRaf); frameRaf = 0;
    frameDemandUntil = 0;
  }

  function startHeartbeat() {
    clearTimeout(heartbeat);
    const tick = async () => {
      if (!optedIn) return;
      await sendPresence(!session.publicId);
      heartbeat = window.setTimeout(tick, status === 'traveling' ? 350 : status === 'playing' ? 1000 : 5000);
    };
    void tick();
  }

  function setParticipation(enabled) {
    optedIn = Boolean(enabled);
    try { sessionStorage.setItem(PREF_KEY, optedIn ? '1' : '0'); } catch {}
    if (!optedIn) {
      clearTimeout(heartbeat); stopFrameCapture();
      if (session) void post('/api/showcase/session/leave', { sessionId: session.sessionId }, true).catch(() => {});
      session = null;
      activeJoin = false;
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      return;
    }
    session ||= { sessionId: crypto.randomUUID() };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {}
    if (getState().tourEntered) startHeartbeat();
  }

  function tourReady() { if (optedIn) startHeartbeat(); }
  function tourEnded() {
    clearTimeout(heartbeat); stopFrameCapture(); activeJoin = false;
    if (session) void post('/api/showcase/session/leave', { sessionId: session.sessionId }, true).catch(() => {});
    if (session) { delete session.publicId; try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {} }
  }
  function update(nextStatus, details = {}) {
    const statusChanged = status !== nextStatus;
    status = nextStatus;
    if ('gameTitle' in details) gameTitle = String(details.gameTitle || '').slice(0, 50);
    if ('score' in details) score = Number.isFinite(details.score) ? details.score : null;
    if (optedIn && getState().tourEntered) {
      if (statusChanged) startHeartbeat();
      else void sendPresence();
    }
  }
  function startGame(title) {
    status = 'playing'; gameTitle = String(title || '冰雪挑战').slice(0, 50); score = null;
    if (!optedIn) return;
    startHeartbeat();
    clearInterval(frameTimer);
    clearInterval(frameDemandTimer);
    frameDemandUntil = 0;
    frameDemandTimer = window.setInterval(async () => {
      if (!session || !optedIn || status !== 'playing') return;
      try {
        const response = await fetch('/api/showcase/frame-demand', { headers:{ 'X-Showcase-Session':session.sessionId }, cache:'no-store' });
        if (response.ok && (await response.json()).needed) {
          frameDemandUntil = performance.now() + 1200;
          if (!frameRaf) frameRaf = requestAnimationFrame(capture);
        }
      } catch { /* Retry when the next demand check runs. */ }
    }, 500);
    const capture = now => {
      if (!optedIn || status !== 'playing') return;
      if (frameDemandUntil <= now) { frameRaf = 0; return; }
      if (frameDemandUntil > now && !busy && !frameBusy && now - lastCaptureAt >= 1000 / 60) {
        lastCaptureAt = now;
        frameBusy = true;
        void frameData().then(frame => frame && optedIn && session ? fetch('/api/showcase/frame', {
          method:'POST', headers:{ 'Content-Type':'image/webp', 'X-Showcase-Session':session.sessionId }, body:frame,
        }) : null).catch(() => {}).finally(() => { frameBusy = false; });
      }
      frameRaf = requestAnimationFrame(capture);
    };
    cancelAnimationFrame(frameRaf);
    frameRaf = requestAnimationFrame(capture);
  }
  function finishGame(finalScore) {
    score = Number.isFinite(finalScore) ? Math.max(0, Math.floor(finalScore)) : null;
    stopFrameCapture();
    status = 'finished';
    if (optedIn) void sendPresence();
  }
  function endGame() { stopFrameCapture(); gameTitle = ''; score = null; update('roaming'); }
  function shutdown() {
    clearTimeout(heartbeat); stopFrameCapture();
    if (session) navigator.sendBeacon('/api/showcase/session/leave', new Blob([JSON.stringify({ sessionId: session.sessionId })], { type: 'application/json' }));
  }
  window.addEventListener('pagehide', shutdown);
  return { setParticipation, isParticipationEnabled: () => optedIn, tourReady, tourEnded, update, startGame, finishGame, endGame };
}
