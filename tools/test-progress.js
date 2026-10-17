import assert from 'node:assert/strict';
import { createProgressStore, LEGACY_PROGRESS_KEY, PROGRESS_KEY } from '../web/progress.js';

const placeIds = ['wuhuan', 'jingyue', 'palace', 'film'];
const venueIds = ['wuhuan', 'jingyue'];
const data = new Map([[LEGACY_PROGRESS_KEY, JSON.stringify({
  visited: ['wuhuan', 'unknown'], stamps: ['wuhuan', 'palace', 'film', 'bad'],
})]]);
const storage = {
  getItem(key) { return data.get(key) ?? null; },
  setItem(key, value) { data.set(key, value); },
};
const store = createProgressStore(storage, placeIds, venueIds);
const migrated = store.load();
assert.deepEqual(migrated.explored.sort(), ['film', 'palace', 'wuhuan']);
assert.deepEqual(migrated.medals, ['wuhuan']);
assert.equal(data.has(LEGACY_PROGRESS_KEY), true, 'migration must preserve the original recoverable key');
assert.equal(JSON.parse(data.get(PROGRESS_KEY)).version, 2);

store.save({ explored: ['film', 'invalid'], medals: ['jingyue', 'palace'], bestScores: { wuhuan: 18, palace: 999 }, goalieBest: 7, quizBest: 99, quizBadge: true });
const restored = createProgressStore(storage, placeIds, venueIds).load();
assert.deepEqual(restored.explored, ['film']);
assert.deepEqual(restored.medals, ['jingyue']);
assert.deepEqual(restored.bestScores, { wuhuan: 18 });
assert.equal(restored.goalieBest, 5, 'goalie best scores must stay within the five-shot range');
assert.equal(restored.quizBest, 5, 'quiz records must stay within the five-question score range');
assert.equal(restored.quizBadge, true);

const unavailable = createProgressStore({
  getItem(key) { if (key === LEGACY_PROGRESS_KEY) return JSON.stringify({ visited: ['film'], stamps: ['wuhuan'] }); throw new Error('storage denied'); },
  setItem() { throw new Error('storage denied'); },
}, placeIds, venueIds);
assert.deepEqual(unavailable.load().explored, ['film'], 'blocked writes should keep readable legacy exploration in memory');
assert.deepEqual(unavailable.load().medals, ['wuhuan'], 'blocked writes should keep readable legacy medals in memory');
console.log('进度迁移、数据校验、保留旧键与存储不可用检查通过');
