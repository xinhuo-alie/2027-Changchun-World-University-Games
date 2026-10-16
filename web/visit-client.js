const KEY = 'cc2027:pending-visits:v1';
let pending = [];
try { pending = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
let sending = false;
const subscribers = new Set();
const statuses = new Set();
let latest = null;
function status(text) { for (const fn of statuses) fn(text); }
function publish(data) {
  if (latest && data.revision < latest.revision) return;
  latest = data;
  for (const fn of subscribers) fn(data);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(pending)); } catch {} }
async function flush() {
  if (sending || !pending.length) return;
  sending = true;
  try {
    while (pending.length) {
      const response = await fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending[0]), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('游览记录暂未同步');
      publish(await response.json());
      pending.shift(); save();
    }
    status('实时同步中');
  } catch { status('游览记录待同步 · 联网后自动重试'); }
  finally { sending = false; }
}
export function recordVisit(placeId) {
  // 局域网 HTTP 页面也能记录；randomUUID 仅在安全上下文可用。
  const eventId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  pending.push({ placeId, eventId }); save(); void flush();
}
export function connectStats(onData, onStatus = () => {}) {
  subscribers.add(onData); statuses.add(onStatus);
  if (latest) onData(latest);
  const stream = new EventSource('/api/visits/stream');
  stream.addEventListener('stats', event => {
    try { publish(JSON.parse(event.data)); status(pending.length ? '游览记录待同步' : '实时同步中'); } catch {}
  });
  stream.onerror = () => status('连接中断 · 正在重连');
  // SSE 不可用时保底轮询；重连后服务器会发送完整快照。
  const timer = setInterval(() => {
    void flush();
    if (stream.readyState !== EventSource.OPEN) fetch('/api/visits').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(publish).catch(() => {});
  }, 5000);
  const online = () => void flush(); window.addEventListener('online', online);
  void flush();
  return () => { stream.close();clearInterval(timer);subscribers.delete(onData);statuses.delete(onStatus);window.removeEventListener('online',online); };
}
