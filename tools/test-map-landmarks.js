import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listPlaces } from '../server/places.js';
import { MAP_LANDMARKS, imagePointToWorld, worldPointToImage } from '../web/map-landmarks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imagePath = path.join(root, 'web', 'assets', MAP_LANDMARKS.source);
const image = fs.readFileSync(imagePath);
assert.equal(image.toString('hex', 0, 8), '89504e470d0a1a0a', 'panorama asset is a PNG');
assert.equal(image.readUInt32BE(16), MAP_LANDMARKS.image.width, 'configured panorama width matches file');
assert.equal(image.readUInt32BE(20), MAP_LANDMARKS.image.height, 'configured panorama height matches file');

const placeIds = listPlaces().map((place) => place.id).sort();
const landmarkIds = Object.keys(MAP_LANDMARKS.points).sort();
assert.deepEqual(landmarkIds, placeIds, 'each of the 16 places has exactly one panorama anchor');

for (const [id, point] of Object.entries(MAP_LANDMARKS.points)) {
  assert.equal(point.length, 2, `${id} anchor is an x/y pair`);
  assert.ok(point.every((value) => Number.isFinite(value) && value >= 0 && value <= 1), `${id} anchor is normalized`);
  const recovered = worldPointToImage(imagePointToWorld(point));
  assert.ok(Math.abs(recovered[0] - point[0]) < 1e-10 && Math.abs(recovered[1] - point[1]) < 1e-10, `${id} camera projection round-trips`);
}

assert.ok(MAP_LANDMARKS.futureSlots.length >= 11, 'map reserves more than ten expansion slots');
for (const slot of MAP_LANDMARKS.futureSlots) {
  assert.ok(slot.every((value) => Number.isFinite(value) && value >= 0 && value <= 1), 'future slot is normalized');
  for (const point of Object.values(MAP_LANDMARKS.points)) {
    const distance = Math.hypot((slot[0] - point[0]) * MAP_LANDMARKS.image.width, (slot[1] - point[1]) * MAP_LANDMARKS.image.height);
    assert.ok(distance >= 145, 'future slot stays clear of current landmark anchors');
  }
}

console.log('通过：新地图 PNG 尺寸、16 个地点锚点、12 个扩展空位及图片/世界坐标互换。');
