import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const stored = new Map([
  ['cc2027:showcase-session:v1', JSON.stringify({ sessionId: '11111111-1111-4111-8111-111111111111', publicId: 'stale-public-id' })],
]);
const timers = [];
const requests = [];
globalThis.crypto ||= webcrypto;
globalThis.sessionStorage = {
  getItem: key => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: key => stored.delete(key),
};
globalThis.window = {
  setTimeout: callback => (timers.push(callback), timers.length), clearTimeout() {},
  setInterval: () => 1, clearInterval() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  addEventListener() {},
};
globalThis.document = {
  getElementById: () => null,
  createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/png;base64,ZmFrZQ==' }),
  addEventListener() {},
};
globalThis.fetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  requests.push(body);
  const attempt = requests.length;
  return attempt === 1 || attempt === 3
    ? { ok: false, status: 404 }
    : { ok: true, json: async () => ({ publicId: '22222222-2222-4222-8222-222222222222' }) };
};

const { createShowcaseParticipation } = await import('../web/showcase-presence-client.js');
const client = createShowcaseParticipation({
  getState: () => ({ tourEntered: true, currentPlaceId: null, targetPlaceId: null, position: { x: 0, z: 0 }, displayName: '测试玩家' }),
  getAvatar: () => ({ width: 100, height: 100 }),
});

client.tourReady();
await new Promise(resolve => setImmediate(resolve));
assert.ok(requests[0].avatar, 'initial join uploads the avatar');
await timers[0]();
assert.ok(requests[1].avatar, 'a rejected stale session retries with its avatar');
client.update('traveling');
await new Promise(resolve => setImmediate(resolve));
assert.equal(requests[2].avatar, undefined, 'known live sessions can heartbeat without re-uploading the avatar');
await timers.at(-1)();
assert.ok(requests[3].avatar, 'the next heartbeat restores the expired session with its avatar');
console.log('showcase session recovery check passed');
