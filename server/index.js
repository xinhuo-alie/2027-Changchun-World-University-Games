import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { config, WEB_DIR, RESULT_DIR, DATA_DIR } from './env.js';
import { listStyles } from './styles.js';
import { listPlaces } from './places.js';
import { createVisitStore } from './visits.js';
import { createShowcasePresence } from './showcase-presence.js';
import { createLeaderboardStore } from './leaderboards.js';
import { createOnlineRace } from './online-race.js';
import { providerStatus, listProviders } from './providers/index.js';
import { createJob, getJob, queueSnapshot } from './store.js';
import { parseDataUrl } from './http.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const places = listPlaces();
const visitStore = await createVisitStore(process.env.VISITS_FILE || path.join(RESULT_DIR, '..', 'visits.json'), places);
const leaderboardStore = await createLeaderboardStore(path.join(DATA_DIR, 'game-results.json'));
const onlineRace = createOnlineRace();
const showcase = createShowcasePresence({ directory: path.join(DATA_DIR, 'showcase-avatars'), places });
const editorSessions = new Map();
const editorAttempts = new Map();
const gameResultAttempts = new Map();
const editorSessionMs = 8 * 60 * 60 * 1000;
const mapLayoutFile = path.join(DATA_DIR, 'map-layout.json');
const placeIds = places.map(place => place.id).sort();

function validateMapLayout(input) {
  if (!input || typeof input !== 'object' || !input.points || typeof input.points !== 'object') return null;
  if (JSON.stringify(Object.keys(input.points).sort()) !== JSON.stringify(placeIds)) return null;
  const points = {};
  for (const id of placeIds) {
    const point = input.points[id];
    if (!Array.isArray(point) || point.length !== 2 || !point.every(value => Number.isFinite(value) && value >= 0 && value <= 1)) return null;
    points[id] = point;
  }
  const iconSizes = {};
  if (input.iconSizes !== undefined) {
    if (!input.iconSizes || typeof input.iconSizes !== 'object' || Array.isArray(input.iconSizes)) return null;
    for (const [id, value] of Object.entries(input.iconSizes)) {
      if (!placeIds.includes(id) || !Number.isFinite(value) || value < .55 || value > 1.5) return null;
      iconSizes[id] = value;
    }
  }
  const heroSize = input.heroSize === undefined ? 1 : input.heroSize;
  if (!Number.isFinite(heroSize) || heroSize < .5 || heroSize > 2) return null;
  return { points, iconSizes, heroSize };
}

async function readMapLayout() {
  return validateMapLayout(JSON.parse(await fs.readFile(mapLayoutFile, 'utf8')));
}

function editorToken(req) {
  const cookie = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('map_editor_session='));
  return cookie?.slice('map_editor_session='.length) || '';
}
function editorAuthenticated(req) {
  const token = editorToken(req);
  const expires = editorSessions.get(token);
  if (!expires) return false;
  if (expires < Date.now()) { editorSessions.delete(token); return false; }
  return true;
}
function equalPassword(input) {
  if (!config.mapEditorPassword || typeof input !== 'string') return false;
  const actual = createHash('sha256').update(input).digest();
  const expected = createHash('sha256').update(config.mapEditorPassword).digest();
  return timingSafeEqual(actual, expected);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

async function readJsonBody(req, maxBytes = config.maxUploadBytes * 1.6) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw Object.assign(new Error('请求体过大，请压缩图片后重试'), { status: 413 });
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('请求体不是合法 JSON');
  }
}

async function readBinaryBody(req, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('挑战画面过大'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function serveFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    // 代码类文件一律不缓存：开发时改了代码刷新就该生效，
    // 否则浏览器会拿着旧 JS 跑，出现"改了没反应"甚至"人物消失"这类假故障。
    // 模型和图片是重资源，允许缓存。
    const noStore = ['.html', '.js', '.css', '.json'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': noStore ? 'no-store, must-revalidate' : 'public, max-age=86400',
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

/** 防目录穿越：解析后必须仍在允许的根目录内 */
function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const resolved = path.resolve(root, `.${path.posix.normalize(decoded)}`);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/map-layout') {
      const layout = await readMapLayout();
      const origin = req.headers.origin;
      const headers = /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin || '') ? { 'Access-Control-Allow-Origin': origin } : {};
      return layout ? sendJson(res, 200, layout, headers) : sendJson(res, 500, { error: '地图配置无效' }, headers);
    }
    if (req.method === 'POST' && pathname === '/api/map-layout') {
      if (!editorAuthenticated(req)) return sendJson(res, 401, { error: '请先登录地图编辑器' });
      const layout = validateMapLayout(await readJsonBody(req));
      if (!layout) return sendJson(res, 400, { error: '地图坐标或大小无效' });
      await fs.mkdir(DATA_DIR, { recursive: true });
      const temporary = `${mapLayoutFile}.${randomBytes(6).toString('hex')}.tmp`;
      await fs.writeFile(temporary, `${JSON.stringify(layout, null, 2)}\n`, 'utf8');
      await fs.rename(temporary, mapLayoutFile);
      return sendJson(res, 200, { ok: true });
    }
    if (req.method === 'GET' && pathname === '/api/map-editor/session') {
      return sendJson(res, 200, { authenticated: editorAuthenticated(req) });
    }
    if (req.method === 'POST' && pathname === '/api/map-editor/login') {
      if (!config.mapEditorPassword) return sendJson(res, 503, { error: '地图编辑器密码未配置' });
      const ip = req.socket.remoteAddress || 'unknown';
      const recent = (editorAttempts.get(ip) || []).filter(time => Date.now() - time < 10 * 60 * 1000);
      if (recent.length >= 5) return sendJson(res, 429, { error: '尝试次数过多，请十分钟后重试' });
      const body = await readJsonBody(req);
      if (!equalPassword(body.password)) {
        recent.push(Date.now()); editorAttempts.set(ip, recent);
        return sendJson(res, 401, { error: '密码不正确' });
      }
      editorAttempts.delete(ip);
      const token = randomBytes(32).toString('hex');
      editorSessions.set(token, Date.now() + editorSessionMs);
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `map_editor_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
    }
    if (req.method === 'POST' && pathname === '/api/map-editor/logout') {
      editorSessions.delete(editorToken(req));
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'map_editor_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (req.method === 'GET' && (pathname === '/map-editor.html' || pathname === '/map-editor')) {
      const file = editorAuthenticated(req) ? 'map-editor.html' : 'map-editor-login.html';
      if (await serveFile(res, path.join(WEB_DIR, file))) return undefined;
      return sendJson(res, 404, { error: 'Not Found' });
    }
    if (req.method === 'GET' && pathname === '/map-editor.js' && !editorAuthenticated(req)) {
      return sendJson(res, 401, { error: '请先登录地图编辑器' });
    }
    if (req.method === 'GET' && pathname === '/api/places') {
      return sendJson(res, 200, { places });
    }
    if (req.method === 'POST' && pathname === '/api/online-race/rooms') {
      const body=await readJsonBody(req, 4096);
      if(body.action==='create')return sendJson(res,201,onlineRace.create(body.name));
      if(body.action==='join'){
        const joined=onlineRace.join(body.roomCode,body.name,body.playerToken);
        if(joined.error)return sendJson(res,joined.status,{error:joined.error});
        return sendJson(res,200,{roomCode:joined.room.code,playerToken:joined.player.token,slot:joined.slot,phase:joined.room.phase});
      }
      return sendJson(res,400,{error:'房间操作无效'});
    }
    if (req.method === 'GET' && pathname === '/api/leaderboards') {
      const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 20)));
      if (url.searchParams.get('view') === 'overall') return sendJson(res, 200, leaderboardStore.overall({ period: url.searchParams.get('period') || 'all-time', limit, playerId: url.searchParams.get('playerId') || '' }));
      return sendJson(res, 200, leaderboardStore.list({ gameId: url.searchParams.get('gameId'), mode: url.searchParams.get('mode') || 'ranked-solo', period: url.searchParams.get('period') || 'all-time', limit, playerId: url.searchParams.get('playerId') || '' }));
    }
    if (req.method === 'GET' && pathname === '/api/game-history') {
      const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 20)));
      return sendJson(res, 200, { ok: true, entries: leaderboardStore.history({ playerId: url.searchParams.get('playerId'), gameId: url.searchParams.get('gameId') || undefined, limit }) });
    }
    if (req.method === 'POST' && pathname === '/api/game-results') {
      const ip = req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const recent = (gameResultAttempts.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
      if (recent.length >= 30) return sendJson(res, 429, { error: '提交频率过高，请稍后再试' });
      recent.push(now); gameResultAttempts.set(ip, recent);
      try { return sendJson(res, 201, await leaderboardStore.submit(await readJsonBody(req, 16 * 1024))); }
      catch (error) { if (error.status) return sendJson(res, error.status, { error: error.message }); throw error; }
    }
    if (req.method === 'GET' && pathname === '/api/visits') {
      return sendJson(res, 200, visitStore.snapshot());
    }
    if (req.method === 'POST' && pathname === '/api/visits') {
      const body = await readJsonBody(req);
      try { return sendJson(res, 200, await visitStore.record(body)); }
      catch (error) { if (error.status) return sendJson(res, error.status, { error: error.message }); throw error; }
    }
    if (req.method === 'GET' && pathname === '/api/visits/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders();
      const send = (data) => res.write(`event: stats\ndata: ${JSON.stringify(data)}\n\n`);
      send(visitStore.snapshot());
      const unsubscribe = visitStore.subscribe(send);
      const pulse = setInterval(() => send(visitStore.snapshot()), 20000);
      pulse.unref();
      res.on('close', () => { clearInterval(pulse); unsubscribe(); });
      return;
    }
    if (req.method === 'GET' && pathname === '/api/showcase/players') {
      return sendJson(res, 200, showcase.snapshot());
    }
    if (req.method === 'GET' && pathname === '/api/showcase/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders();
      const send = data => res.write(`event: players\ndata: ${JSON.stringify(data)}\n\n`);
      send(showcase.snapshot());
      const unsubscribe = showcase.subscribe(send);
      const pulse = setInterval(() => send(showcase.snapshot()), 10000);
      pulse.unref();
      res.on('close', () => { clearInterval(pulse); unsubscribe(); });
      return;
    }
    if (req.method === 'POST' && pathname === '/api/showcase/session') {
      try { return sendJson(res, 200, await showcase.join(await readJsonBody(req, 1024 * 1024))); }
      catch (error) { if (error.status) return sendJson(res, error.status, { error: error.message }); throw error; }
    }
    if (req.method === 'POST' && pathname === '/api/showcase/session/leave') {
      try { return sendJson(res, 200, { ok: true, left: await showcase.leave((await readJsonBody(req, 1024)).sessionId) }); }
      catch (error) { if (error.status) return sendJson(res, error.status, { error: error.message }); throw error; }
    }
    if (req.method === 'POST' && pathname === '/api/showcase/frame') {
      try {
        const body = req.headers['content-type'] === 'image/webp'
          ? { sessionId: req.headers['x-showcase-session'], frame: await readBinaryBody(req, 220 * 1024) }
          : await readJsonBody(req, 512 * 1024);
        return sendJson(res, 200, await showcase.updateFrame(body));
      }
      catch (error) { if (error.status) return sendJson(res, error.status, { error: error.message }); throw error; }
    }
    if (req.method === 'GET' && pathname === '/api/showcase/frame-demand') {
      return sendJson(res, 200, { needed: showcase.needsFrame(req.headers['x-showcase-session']) });
    }
    const frameMatch = /^\/api\/showcase\/players\/([a-f0-9-]{36})\/frame$/.exec(pathname);
    if (req.method === 'GET' && frameMatch) {
      const frame = showcase.getFrame(frameMatch[1]);
      if (!frame) return sendJson(res, 404, { error: '当前没有可用的实时挑战画面' });
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Content-Length': frame.data.length, 'Cache-Control': 'no-store', 'X-Frame-Updated-At': String(frame.updatedAt) });
      res.end(frame.data);
      return;
    }
    if (req.method === 'GET' && pathname === '/api/config') {
      return sendJson(res, 200, {
        styles: listStyles(),
        provider: providerStatus(),
        providers: listProviders(),
        queue: queueSnapshot(),
      });
    }

    if (req.method === 'POST' && pathname === '/api/generate') {
      const body = await readJsonBody(req);
      if (!body.image || typeof body.image !== 'string') {
        return sendJson(res, 400, { error: '缺少 image 字段（data URL）' });
      }
      const { buffer } = parseDataUrl(body.image);
      if (buffer.length > config.maxUploadBytes) {
        return sendJson(res, 413, { error: '图片太大，请压缩到 8MB 以内' });
      }
      const purpose = body.purpose === 'figurine' ? 'figurine' : body.purpose === 'avatar2d' ? 'avatar2d' : undefined;
      const providerId = body.provider;
      if (providerId !== undefined && !listProviders().some(p => p.id === providerId && p.available)) {
        return sendJson(res, 400, { error: '所选生图模型不可用，请选择已配置的模型' });
      }
      const jobId = createJob({ imageDataUrl: body.image, styleId: body.styleId || 'q3d', purpose, providerId, outfit: purpose === 'figurine' ? body.outfit : undefined, creative: purpose === 'figurine' ? body.creative : undefined });
      return sendJson(res, 202, { jobId, queue: queueSnapshot() });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/jobs/')) {
      const id = pathname.slice('/api/jobs/'.length);
      const job = getJob(id);
      if (!job) return sendJson(res, 404, { error: '任务不存在或已过期' });
      return sendJson(res, 200, job);
    }

    if (req.method === 'GET' && pathname.startsWith('/data/results/')) {
      const filePath = safeJoin(RESULT_DIR, pathname.slice('/data/results'.length));
      if (filePath && (await serveFile(res, filePath))) return undefined;
      return sendJson(res, 404, { error: '文件不存在' });
    }
    if (req.method === 'GET' && pathname.startsWith('/data/showcase-avatars/')) {
      const name = pathname.slice('/data/showcase-avatars/'.length);
      if (!/^[a-f0-9-]{36}\.png$/.test(name)) return sendJson(res, 404, { error: '文件不存在' });
      const filePath = safeJoin(path.join(DATA_DIR, 'showcase-avatars'), `/${name}`);
      if (filePath && (await serveFile(res, filePath))) return undefined;
      return sendJson(res, 404, { error: '文件不存在' });
    }

    if (req.method === 'GET') {
      const rel = pathname === '/' ? '/play.html' : pathname;
      const filePath = safeJoin(WEB_DIR, rel);
      if (filePath && (await serveFile(res, filePath))) return undefined;

      // 无扩展名的页面路径，例如 /display。
      if (!path.extname(rel)) {
        const pagePath = safeJoin(WEB_DIR, `${rel}.html`);
        if (pagePath && (await serveFile(res, pagePath))) return undefined;
      }
    }

    return sendJson(res, 404, { error: 'Not Found' });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : '服务器内部错误',
    });
  }
});

await fs.mkdir(RESULT_DIR, { recursive: true });
await fs.mkdir(path.join(DATA_DIR, 'showcase-avatars'), { recursive: true });

server.on('close', () => showcase.close());
server.on('upgrade',(req,socket,head)=>onlineRace.upgrade(req,socket,head));

server.listen(config.port, () => {
  const status = providerStatus();
  console.log('');
  console.log('  长春 2027 大冬会云游览 · 形象生成服务');
  console.log(`  http://localhost:${config.port}`);
  console.log(`  当前服务商: ${status.activeLabel} (${status.active})`);
  if (status.fellBackToMock) {
    console.log(`  ⚠️  配置里指定的是 "${status.requested}"，但缺少 API key，已自动降级为本地模拟`);
  }
  console.log(`  并发上限: ${config.maxConcurrentJobs} · 原图落盘: ${config.saveUploads ? '是' : '否（推荐）'}`);
  console.log('');
});
