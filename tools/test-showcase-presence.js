import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createShowcasePresence } from '../server/showcase-presence.js';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'showcase-presence-'));
const png = Buffer.alloc(24);
Buffer.from('89504e470d0a1a0a', 'hex').copy(png);
png.writeUInt32BE(32, 16); png.writeUInt32BE(48, 20);
const webp = Buffer.alloc(16);
webp.write('RIFF', 0); webp.write('WEBP', 8);
const store = createShowcasePresence({ directory, places: [{ id: 'venue-a', name: '测试场馆' }] });
const sessionId = '12b45882-9899-4311-8d34-b57b94460d8f';
const avatar = `data:image/png;base64,${png.toString('base64')}`;
const frame = `data:image/webp;base64,${webp.toString('base64')}`;

try {
  let eventCount = 0;
  const unsubscribe = store.subscribe(() => eventCount++);
  const joined = await store.join({ sessionId, avatar, displayName: '冰雪小嘉', status: 'roaming', currentPlaceId: 'venue-a', position: { x: 12, z: 30 } });
  assert.equal(joined.ok, true);
  assert.equal(joined.player.alias, '冰雪小嘉');
  assert.equal(joined.player.currentPlaceId, 'venue-a');
  assert.equal('sessionId' in joined.player, false);
  assert.equal(store.snapshot().online.length, 1);
  assert.equal(eventCount, 1);
  const imagePath = path.join(directory, `${joined.publicId}.png`);
  assert.equal((await fs.readFile(imagePath)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');

  const invalidSession = 'eea8e11c-e7a8-4125-ad13-27931c7056d9';
  await assert.rejects(() => store.join({ sessionId: invalidSession, avatar: 'data:image/png;base64,not-valid!' }), error => error.status === 400);
  assert.equal(store.snapshot().online.length, 1, 'invalid joins do not create placeholder sessions');

  await store.join({ sessionId, status: 'playing', displayName: '冰雪小嘉', currentPlaceId: 'venue-a', gameTitle: '冰壶挑战' });
  assert.equal(store.needsFrame(sessionId), false);
  assert.equal(store.getFrame(joined.publicId), null, 'a viewer requests a frame before the sender starts streaming');
  assert.equal(store.needsFrame(sessionId), true);
  await store.updateFrame({ sessionId, frame });
  const currentFrame = store.getFrame(joined.publicId);
  assert.equal(currentFrame.data.toString('ascii', 0, 4), 'RIFF');
  await assert.rejects(() => store.updateFrame({ sessionId, frame }), error => error.status === 429);
  assert.equal(store.snapshot().online[0].gameTitle, '冰壶挑战');
  assert.equal(store.snapshot().online[0].alias, '冰雪小嘉');
  assert.equal('frame' in store.snapshot().online[0], false);

  await assert.rejects(() => store.join({ sessionId, avatar: 'data:image/png;base64,not-valid!' }), error => error.status === 400);
  await store.leave(sessionId);
  assert.equal(store.snapshot().online.length, 0);
  assert.equal(await fs.stat(imagePath).then(stat => stat.isFile()), true);
  unsubscribe();
  console.log('showcase presence: named join, viewer frame demand, live frame, throttling, and leave passed');
} finally {
  store.close();
  await fs.rm(directory, { recursive: true, force: true });
}
