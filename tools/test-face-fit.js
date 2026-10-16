import assert from 'node:assert/strict';
import { defaultConfig, saveConfig, loadConfig, normalizeFaceFit, applyLook, LOOKS, outfitKey } from '../web/avatar.js';

assert.deepEqual(normalizeFaceFit(null), { scale: 1, dx: 0, dy: 0, angle: 0 });
assert.deepEqual(
  normalizeFaceFit({ scale: 2, dx: 999, dy: null, angle: -40 }),
  { scale: 1.45, dx: 55, dy: 0, angle: -25 },
);

const values = new Map();
globalThis.localStorage = {
  setItem(key, value) { values.set(key, value); },
  getItem(key) { return values.get(key) ?? null; },
};

const current = defaultConfig();
current.face.kind = 'photo';
current.face.fit = { scale: 1.19, dx: 13, dy: -8, angle: 7 };
assert.equal(saveConfig(current), true);
assert.deepEqual(loadConfig().face.fit, current.face.fit, 'the current photo alignment must survive reload');
const dressed = applyLook(current, LOOKS[0]);
assert.deepEqual(dressed.face, current.face, 'changing the outfit must preserve the uploaded face and its alignment');
assert.equal(dressed.parts.coat, LOOKS[0].parts.coat);
assert.equal(current.parts.coat, 'down', 'choosing a look must not mutate the previous configuration');

current.figure = { canvas: { toDataURL: () => 'data:image/png;base64,preview' }, outfitKey: outfitKey(current) };
assert.equal(saveConfig(current), true);
assert.equal(loadConfig().figure.outfitKey, current.figure.outfitKey, 'generated full-body image must retain its selected outfit');
assert.equal(loadConfig().figure.pendingImage, 'data:image/png;base64,preview');
current.figure = null;

// A newly captured face starts with a fresh transform; the previous photo's position is not reused.
current.face = { kind: 'photo', canvas: null, fit: normalizeFaceFit(null) };
assert.equal(saveConfig(current), true);
assert.deepEqual(loadConfig().face.fit, { scale: 1, dx: 0, dy: 0, angle: 0 });

console.log('头像校准参数边界与本地存档测试通过');
