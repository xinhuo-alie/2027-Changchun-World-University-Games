import assert from 'node:assert/strict';
import {
  BOOK_SESSION_KEY, buildBookManifest, getPageForPlace, loadBookSession,
  nextRecommendedPlace, normalizeBookSession, resolveAdjacentPage, saveBookSession,
} from '../web/book-navigation.js';

const places = [
  ...Array.from({ length: 10 }, (_, index) => ({ id:`v${index}`, kind:'venue' })),
  ...Array.from({ length: 6 }, (_, index) => ({ id:`a${index}`, kind:'attraction' })),
  { id:'ignored', kind:'other' },
];
const three = buildBookManifest(places, { orderedPlaceIds:['v0','v1','a0','v1','missing'], source:'recommended' });
assert.deepEqual(three.orderedPlaceIds, ['v0','v1','a0']);
assert.equal(three.pages[3].chapter, 'sports');
assert.equal(three.pages[5].chapter, 'city');
assert.equal(resolveAdjacentPage(three, 'intro', -1), null);
assert.equal(resolveAdjacentPage(three, getPageForPlace('v0'), 1).id, getPageForPlace('v1'));
assert.equal(resolveAdjacentPage(three, 'recap', 1), null);
assert.equal(nextRecommendedPlace(three.orderedPlaceIds, 'v1'), 'a0');
assert.equal(nextRecommendedPlace(three.orderedPlaceIds, 'a0'), null);
const all = buildBookManifest(places, { source:'all' });
assert.equal(all.orderedPlaceIds.length, 16);
assert.deepEqual(all.orderedPlaceIds.slice(0,10), places.slice(0,10).map((place) => place.id));
const five = buildBookManifest(places, { orderedPlaceIds:['v0','v1','v2','a0','a1'], source:'route' });
assert.equal(five.orderedPlaceIds.length, 5);
const session = normalizeBookSession({ version:1, viewMode:'unknown', currentPageId:getPageForPlace('missing'), orderedPlaceIds:['v0','v0','missing'], source:'bad', lastReadPlaceId:'a0', updatedAt:-1 }, places.map((place) => place.id), three);
assert.equal(session.viewMode, 'guided');
assert.equal(session.currentPageId, 'intro');
assert.deepEqual(session.orderedPlaceIds, ['v0']);
assert.equal(session.source, 'recommended');
assert.equal(session.previousPageId, null);
assert.equal(session.updatedAt, 0);
assert.equal(normalizeBookSession({ version:2 }, [], three), null);
assert.equal(loadBookSession({ getItem:() => '{bad' }, [], three), null);
assert.equal(loadBookSession({ getItem:() => { throw new Error('storage blocked'); } }, [], three), null);
const stored = new Map();
const storage = { getItem:(key) => stored.get(key) || null, setItem:(key, value) => stored.set(key, value) };
const saved = saveBookSession(storage, { viewMode:'guided', currentPageId:getPageForPlace('v0'), orderedPlaceIds:['v0','v1','a0'], source:'route' }, places.map((place) => place.id), three);
assert.equal(saved.currentPageId, getPageForPlace('v0'));
assert.equal(JSON.parse(stored.get(BOOK_SESSION_KEY)).version, 1);
assert.equal(loadBookSession(storage, places.map((place) => place.id), three).lastReadPlaceId, null);
const recapSource = saveBookSession(storage, { viewMode:'guided', currentPageId:'recap', previousPageId:'world-map', orderedPlaceIds:['v0','v1','a0'], source:'route' }, places.map((place) => place.id), three);
assert.equal(recapSource.previousPageId, 'world-map', '终章会保存真正的来源页');
assert.equal(saveBookSession({ setItem:() => { throw new Error('quota'); } }, {}, places.map((place) => place.id), three).currentPageId, 'intro');
console.log('书页清单、相邻页、短路线/全本路线和会话容错检查通过');
