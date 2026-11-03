import assert from 'node:assert/strict';
import { buildBookManifest, getPageForPlace, resolveAdjacentPage } from '../web/book-navigation.js';
import { PROGRESS_KEY } from '../web/progress.js';
import { buildVisitMemorialData, clearVisitSessionStorage, createVisitSessionEpoch, VISIT_SESSION_TEMP_KEYS } from '../web/visit-session.js';
import { config } from '../server/env.js';
import { cancelJob, createJob, getJob, queueSnapshot } from '../server/store.js';
import { ARTWORK_GALLERY_KEY, readArtworkGallery, rememberArtwork } from '../web/artwork-gallery.js';

const places = [{ id:'v1', kind:'venue', name:'冰雪场馆' }, { id:'a1', kind:'attraction', name:'城市景点' }];
const manifest = buildBookManifest(places, { orderedPlaceIds:['v1','a1'], source:'route' });
assert.equal(resolveAdjacentPage(manifest, getPageForPlace('a1'), 1).id, 'recap');
assert.equal(resolveAdjacentPage(manifest, 'recap', 1), null, '终章没有下一页，不会回到地图/首页');
assert.equal(resolveAdjacentPage(manifest, 'recap', -1).id, getPageForPlace('a1'), '终章上一页是最后实际地点');
const noRoute = buildBookManifest(places, { orderedPlaceIds:[], source:'recommended' });
assert.equal(resolveAdjacentPage(noRoute, 'recap', -1).id, 'world-map');

const entries = new Map([
  [PROGRESS_KEY, JSON.stringify({ version:2, explored:['v1'], medals:['v1'], bestScores:{v1:850}, goalieBest:4, quizBest:5, quizBadge:true, route:{ ids:['v1'], completed:[] }, claimedQuests:['explore-first'] })],
  ...VISIT_SESSION_TEMP_KEYS.map((key) => [key, 'temporary']),
  ['cc2027:game-results:local', 'global history'],
  ['cc2027:secret-collection:v1', 'shared unlocks'],
  ['cc2027:places:v1', 'place data'],
  [ARTWORK_GALLERY_KEY, JSON.stringify([{ url:'/data/results/11111111-1111-4111-8111-111111111111.png', name:'雪道伙伴', createdAt:'2026-10-26T00:00:00.000Z' }])],
]);
const storage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
  removeItem: (key) => entries.delete(key),
};
clearVisitSessionStorage(storage);
clearVisitSessionStorage(storage); // Repeated end clicks/cleanup are safe.
for (const key of VISIT_SESSION_TEMP_KEYS) assert.equal(entries.has(key), false, `${key} is visit-scoped`);
const kept = JSON.parse(entries.get(PROGRESS_KEY));
assert.deepEqual(kept.bestScores, { v1:850 });
assert.equal(kept.goalieBest, 4);
assert.equal(kept.quizBadge, undefined, '本次知识徽章随临时成就清理');
assert.equal(kept.explored, undefined);
assert.equal(kept.medals, undefined);
assert.equal(kept.claimedQuests, undefined);
assert.equal(entries.get('cc2027:game-results:local'), 'global history');
assert.equal(entries.get('cc2027:secret-collection:v1'), 'shared unlocks');
assert.equal(entries.get('cc2027:places:v1'), 'place data');
assert.ok(entries.has(ARTWORK_GALLERY_KEY), '历史角色图库在结束游览后保留');

const galleryStorage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
};
assert.equal(readArtworkGallery(galleryStorage).length, 1);
rememberArtwork(galleryStorage, '/data/results/22222222-2222-4222-8222-222222222222.webp', { name:'星光角色' });
assert.deepEqual(readArtworkGallery(galleryStorage).map((item)=>item.name), ['星光角色','雪道伙伴']);
assert.equal(readArtworkGallery(galleryStorage, '/data/results/33333333-3333-4333-8333-333333333333.jpg').length, 3, '旧版最近作品自动补入历史图库');

const epoch = createVisitSessionEpoch();
const oldRequest = epoch.current();
assert.equal(epoch.isCurrent(oldRequest), true);
epoch.invalidate();
assert.equal(epoch.isCurrent(oldRequest), false, 'a slow pre-end request cannot write after session end');
assert.equal(epoch.isCurrent(epoch.current()), true, 'the next session gets a fresh request generation');

const empty = buildVisitMemorialData();
assert.deepEqual(empty.visitedPlaces, []);
assert.deepEqual(empty.medals, []);
assert.deepEqual(empty.gameResults, []);
assert.equal(empty.role, null);
assert.equal(empty.video.status, 'not-available');
assert.equal(empty.knowledgeBadge, false);
const memorial = buildVisitMemorialData({ places, visited:['v1','unknown'], medals:['v1'], knowledgeBadge:true, role:{ name:'我的角色' }, gameResults:[{ name:'冰球', score:24, won:true }, { name:'坏数据', score:NaN }] });
assert.deepEqual(memorial.visitedPlaces, [{ id:'v1', name:'冰雪场馆' }]);
assert.equal(memorial.medals.length, 1);
assert.equal(memorial.gameResults.length, 1);
assert.equal(memorial.role.name, '我的角色');
assert.equal(memorial.knowledgeBadge, true);

const maxJobs = config.maxConcurrentJobs;
config.maxConcurrentJobs = 0; // Hold one task in the queue to verify end-session cancellation.
const beforeQueue = queueSnapshot().queued;
const jobId = createJob({ imageDataUrl:'data:image/png;base64,AA==', styleId:'avatar', purpose:'figurine' });
assert.equal(queueSnapshot().queued, beforeQueue + 1);
assert.equal(cancelJob(jobId), true);
assert.equal(getJob(jobId).status, 'cancelled');
assert.equal(queueSnapshot().queued, beforeQueue);
assert.equal(cancelJob(jobId), false, 'repeated cancellation cannot restart or mutate a finished job');
config.maxConcurrentJobs = maxJobs;
console.log('终章边界、回退页、会话清理白名单、长期成绩保留和纪念页空状态检查通过');
