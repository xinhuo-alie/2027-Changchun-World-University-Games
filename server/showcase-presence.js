import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const SESSION_RE = /^[a-f0-9-]{36}$/i;
const PUBLIC_RE = /^[a-f0-9-]{36}$/i;
const STATUSES = new Set(['roaming', 'traveling', 'reading', 'playing', 'finished']);
const AVATAR_MAX = 512 * 1024;
const FRAME_MAX = 220 * 1024;
const ONLINE_TTL = 35_000;
const AVATAR_RETENTION = 24 * 60 * 60 * 1000;

function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }

function decodeImage(dataUrl, mime, maxBytes) {
  if (typeof dataUrl !== 'string' || dataUrl.length > Math.ceil(maxBytes * 1.5) + 128) fail('图片数据无效或过大', 413);
  const match = new RegExp(`^data:${mime};base64,([A-Za-z0-9+/]+={0,2})$`).exec(dataUrl);
  if (!match) fail('图片格式无效');
  const buffer = Buffer.from(match[1], 'base64');
  if (!buffer.length || buffer.length > maxBytes) fail('图片数据无效或过大', 413);
  return buffer;
}

async function atomicWrite(file, buffer) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, buffer, { flag: 'wx' });
  await fs.rename(temp, file);
}

export function createShowcasePresence({ directory, places }) {
  const placeIds = new Set(places.map(place => place.id));
  const players = new Map();
  const listeners = new Set();
  const frameTimes = new Map();
  let pruneBusy = false;

  function cleanExpired() {
    const now = Date.now();
    let changed = false;
    for (const [id, player] of players) {
      if (now - player.lastSeen > ONLINE_TTL) {
        players.delete(id); frameTimes.delete(id); changed = true;
      }
    }
    if (changed) publish();
  }

  function snapshot() {
    cleanExpired();
    return { online: [...players.values()].map(({ sessionId, avatarFile, frame, frameAt, frameDemandUntil, lastAvatarTouch, lastSeen, ...publicPlayer }) => publicPlayer)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)) };
  }

  function publish() {
    const data = snapshot();
    for (const listener of listeners) { try { listener(data); } catch {} }
  }

  async function pruneFiles() {
    if (pruneBusy) return;
    pruneBusy = true;
    try {
      await fs.mkdir(directory, { recursive: true });
      const files = await fs.readdir(directory, { withFileTypes: true });
      const now = Date.now();
      const activeFiles = new Set([...players.values()].map(player => player.avatarFile));
      for (const entry of files) {
        if (!entry.isFile() || !/^[a-f0-9-]{36}\.(png|webp)$/.test(entry.name)) continue;
        if (activeFiles.has(entry.name)) continue;
        const file = path.join(directory, entry.name);
        const stat = await fs.stat(file).catch(() => null);
        if (stat && now - stat.mtimeMs > AVATAR_RETENTION) await fs.unlink(file).catch(() => {});
      }
    } catch {} finally { pruneBusy = false; }
  }

  async function join(body) {
    const sessionId = body.sessionId;
    if (typeof sessionId !== 'string' || !SESSION_RE.test(sessionId)) fail('会话编号无效');
    let player = players.get(sessionId);
    let avatar = null;
    if (body.avatar !== undefined) {
      avatar = decodeImage(body.avatar, 'image/png', AVATAR_MAX);
      if (avatar.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail('角色图像不是有效 PNG');
      const width = avatar.readUInt32BE(16); const height = avatar.readUInt32BE(20);
      if (!width || !height || width > 1024 || height > 1024 || width * height > 700000) fail('角色图像尺寸无效');
    }
    if (!player && !avatar) fail('请先准备好角色图像');
    if (!player && players.size >= 200) fail('现场人数已满，请稍后再试', 503);

    const currentPlaceId = placeIds.has(body.currentPlaceId) ? body.currentPlaceId : null;
    const targetPlaceId = placeIds.has(body.targetPlaceId) ? body.targetPlaceId : null;
    const status = STATUSES.has(body.status) ? body.status : 'roaming';
    const position = body.position && Number.isFinite(body.position.x) && Number.isFinite(body.position.z)
      && Math.abs(body.position.x) <= 1000 && Math.abs(body.position.z) <= 1000
      ? { x: Math.round(body.position.x * 10) / 10, z: Math.round(body.position.z * 10) / 10 } : null;
    const gameTitle = typeof body.gameTitle === 'string' ? body.gameTitle.slice(0, 50) : '';
    const score = Number.isFinite(body.score) ? Math.max(0, Math.min(100000, Math.floor(body.score))) : null;
    const displayName = typeof body.displayName === 'string'
      ? body.displayName.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16) : '';

    if (!player) {
      const publicId = randomUUID();
      player = { sessionId, publicId, alias: displayName || `旅人·${publicId.slice(0, 4).toUpperCase()}`,
        joinedAt: new Date().toISOString(), lastSeen: Date.now(), status: 'roaming', currentPlaceId: null,
        targetPlaceId: null, position: null, gameTitle: '', score: null, avatarUrl: null,
        avatarFile: `${publicId}.png`, frame: null, frameAt: 0 };
      players.set(sessionId, player);
    }

    if (displayName) player.alias = displayName;

    if (avatar) {
      await fs.mkdir(directory, { recursive: true });
      await atomicWrite(path.join(directory, player.avatarFile), avatar);
      player.lastAvatarTouch = Date.now();
      player.avatarUrl = `/data/showcase-avatars/${player.publicId}.png`;
    }
    if (!player.avatarUrl) fail('请先准备好角色图像');
    player.lastSeen = Date.now();
    if (Date.now() - (player.lastAvatarTouch || 0) > 60_000) {
      await fs.utimes(path.join(directory, player.avatarFile), new Date(), new Date()).catch(() => {});
      player.lastAvatarTouch = Date.now();
    }
    player.status = status;
    player.currentPlaceId = currentPlaceId;
    player.targetPlaceId = targetPlaceId;
    player.position = position;
    player.gameTitle = status === 'playing' ? gameTitle : '';
    player.score = score;
    publish();
    return { ok: true, publicId: player.publicId, player: snapshot().online.find(item => item.publicId === player.publicId) };
  }

  function findSession(sessionId) {
    if (typeof sessionId !== 'string' || !SESSION_RE.test(sessionId)) fail('会话不存在', 404);
    const player = players.get(sessionId);
    if (!player || Date.now() - player.lastSeen > ONLINE_TTL) fail('会话已离线', 404);
    return player;
  }

  async function leave(sessionId) {
    const player = players.get(sessionId);
    if (!player) return false;
    await fs.utimes(path.join(directory, player.avatarFile), new Date(), new Date()).catch(() => {});
    players.delete(sessionId); frameTimes.delete(sessionId); publish();
    return true;
  }

  async function updateFrame(body) {
    const player = findSession(body.sessionId);
    if (player.status !== 'playing') fail('当前没有进行中的挑战', 409);
    if (Date.now() - (frameTimes.get(player.sessionId) || 0) < 10) fail('画面更新过快', 429);
    const frame = Buffer.isBuffer(body.frame) ? body.frame : decodeImage(body.frame, 'image/webp', FRAME_MAX);
    if (!frame.length || frame.length > FRAME_MAX) fail('挑战画面无效或过大', 413);
    if (frame.subarray(0, 4).toString('ascii') !== 'RIFF' || frame.subarray(8, 12).toString('ascii') !== 'WEBP') fail('挑战画面无效');
    player.frame = frame; player.frameAt = Date.now(); player.lastSeen = Date.now();
    frameTimes.set(player.sessionId, Date.now());
    return { ok: true };
  }

  function getFrame(publicId) {
    cleanExpired();
    if (typeof publicId !== 'string' || !PUBLIC_RE.test(publicId)) return null;
    const player = [...players.values()].find(item => item.publicId === publicId && item.status === 'playing' && item.frame && Date.now() - item.frameAt < 5000);
    const activePlayer = [...players.values()].find(item => item.publicId === publicId && item.status === 'playing');
    if (activePlayer) activePlayer.frameDemandUntil = Date.now() + 1200;
    return player ? { data: player.frame, updatedAt: player.frameAt } : null;
  }

  function needsFrame(sessionId) {
    const player = players.get(sessionId);
    return Boolean(player && player.status === 'playing' && Date.now() - player.lastSeen <= ONLINE_TTL && player.frameDemandUntil > Date.now());
  }

  const pruneTimer = setInterval(() => { cleanExpired(); void pruneFiles(); }, 10 * 60 * 1000);
  pruneTimer.unref();
  void pruneFiles();
  return { snapshot, join, leave, findSession, updateFrame, getFrame, needsFrame,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    close() { clearInterval(pruneTimer); listeners.clear(); } };
}
