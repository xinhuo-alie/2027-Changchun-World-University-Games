import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cc-showcase-http-'));
const child = spawn(process.execPath, ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: '5182', VISITS_FILE: path.join(dir, 'visits.json') }, stdio: 'ignore', windowsHide: true });
const base = 'http://127.0.0.1:5182';
let reader;
const publicIds = [];
try {
  let ready = false;
  for (let i = 0; i < 50; i++) { try { ready = (await fetch(`${base}/api/showcase/players`)).ok; if (ready) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  assert.ok(ready, 'showcase test server started');
  const decoder = new TextDecoder();
  const stream = await fetch(`${base}/api/showcase/stream`);
  reader = stream.body.getReader();
  assert.match(decoder.decode((await reader.read()).value), /"online":\[\]/);

  const png = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(png);
  png.writeUInt32BE(32, 16); png.writeUInt32BE(48, 20);
  const sessionId = randomUUID();
  const join = await fetch(`${base}/api/showcase/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, displayName: '雪团子', status: 'roaming', currentPlaceId: 'palace', position: { x: 10, z: 20 }, avatar: `data:image/png;base64,${png.toString('base64')}` }) });
  assert.equal(join.status, 200);
  const joinData = await join.json();
  const publicId = joinData.publicId; publicIds.push(publicId);
  assert.equal(joinData.player.alias, '雪团子');
  const event = decoder.decode((await reader.read()).value);
  assert.match(event, /"online":\[\{/);
  assert.doesNotMatch(event, new RegExp(sessionId));
  assert.equal((await fetch(`${base}/data/showcase-avatars/${publicId}.png`)).status, 200);

  assert.equal((await fetch(`${base}/api/showcase/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, status: 'playing', gameTitle: '冰壶挑战' }) })).status, 200);
  assert.equal((await fetch(`${base}/api/showcase/players/${publicId}/frame`)).status, 404);
  assert.deepEqual(await (await fetch(`${base}/api/showcase/frame-demand`, { headers:{ 'X-Showcase-Session':sessionId } })).json(), { needed:true });
  const webp = Buffer.alloc(16); webp.write('RIFF', 0); webp.write('WEBP', 8);
  assert.equal((await fetch(`${base}/api/showcase/frame`, { method: 'POST', headers: { 'Content-Type': 'image/webp', 'X-Showcase-Session': sessionId }, body: webp })).status, 200);
  const frameResponse = await fetch(`${base}/api/showcase/players/${publicId}/frame`);
  assert.equal(frameResponse.status, 200);
  assert.equal(frameResponse.headers.get('content-type'), 'image/webp');
  assert.equal((await fetch(`${base}/api/showcase/session/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })).status, 200);
  assert.deepEqual((await (await fetch(`${base}/api/showcase/players`)).json()).online, []);
  const secondSession = randomUUID();
  const secondJoin = await fetch(`${base}/api/showcase/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: secondSession, status: 'roaming', avatar: `data:image/png;base64,${png.toString('base64')}` }) });
  assert.equal(secondJoin.status, 200); publicIds.push((await secondJoin.json()).publicId);
  const thirdSession = randomUUID();
  const thirdJoin = await fetch(`${base}/api/showcase/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: thirdSession, status: 'roaming', avatar: `data:image/png;base64,${png.toString('base64')}` }) });
  assert.equal(thirdJoin.status, 200); publicIds.push((await thirdJoin.json()).publicId);
  assert.equal((await (await fetch(`${base}/api/showcase/players`)).json()).online.length, 2);
  await fetch(`${base}/api/showcase/session/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: secondSession }) });
  await fetch(`${base}/api/showcase/session/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: thirdSession }) });
  assert.deepEqual((await (await fetch(`${base}/api/showcase/players`)).json()).online, []);
  console.log('showcase HTTP: SSE join, public player name, avatar route, live frame, and leave passed');
} finally {
  await reader?.cancel();
  child.kill();
  await new Promise(resolve => child.once('exit', resolve));
  for (const publicId of publicIds) await fs.unlink(path.join(process.cwd(), 'data', 'showcase-avatars', `${publicId}.png`)).catch(() => {});
  await fs.rm(dir, { recursive: true, force: true });
}
