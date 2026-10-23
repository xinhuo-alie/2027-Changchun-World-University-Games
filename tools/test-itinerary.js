import assert from 'node:assert/strict';
import { listPlaces } from '../server/places.js';
import { advanceRoute, cloudMinutes, editRoute, normalizePreferences, normalizeRoute, recommendItinerary, routePosition } from '../web/itinerary.js';

const places = listPlaces();
assert.equal(places.length, 16);
const empty = recommendItinerary([], {}, {});
assert.deepEqual(empty.ids, []);
assert.equal(normalizePreferences({ nope: true }).mode, 'relaxed');
assert.equal(cloudMinutes(places.find((place) => place.id === 'palace')), 8, 'offline visit duration must not be used as cloud duration');

const sport = recommendItinerary(places, { mode: 'sport', time: '30', interest: 'sport', goal: 'games' }, {}, 0);
const city = recommendItinerary(places, { mode: 'city', time: '30', interest: 'culture', goal: 'stories' }, {}, 0);
const long = recommendItinerary(places, { mode: 'sport', time: 'halfday', interest: 'sport', goal: 'games' }, {}, 0);
assert.ok(sport.ids.length > 0 && sport.ids.length <= 3);
assert.ok(long.ids.length > sport.ids.length, 'available time changes the number of stops');
assert.ok(sport.ids.every((id) => places.find((place) => place.id === id)?.kind === 'venue'));
assert.ok(city.ids.every((id) => places.find((place) => place.id === id)?.kind === 'attraction'));
assert.notDeepEqual(sport.ids, city.ids, 'interest and mode change recommendations');
assert.ok(sport.stops.every((stop) => stop.reason && stop.cloudMinutes > 0));
assert.ok(sport.stops.reduce((sum, stop) => sum + stop.cloudMinutes, 0) <= 30);

const edited = editRoute(sport, 'remove', sport.ids[1]);
assert.equal(edited.ids.length, sport.ids.length - 1);
const replacement = places.find((place) => !edited.ids.includes(place.id)).id;
assert.equal(editRoute(edited, 'replace', edited.ids[0], replacement).ids[0], replacement);
assert.equal(editRoute(edited, 'up', edited.ids[1]).ids[0], edited.ids[1]);
const cleaned = normalizeRoute({ ...sport, ids: [sport.ids[0], sport.ids[0], 'invalid'], completed: ['invalid', sport.ids[0]] }, places.map((place) => place.id));
assert.deepEqual(cleaned.ids, [sport.ids[0]]);
assert.deepEqual(cleaned.completed, [sport.ids[0]]);
assert.equal(normalizeRoute({ ids: ['invalid'] }, places.map((place) => place.id)), null);

const active = { ...sport, status: 'active' };
assert.equal(advanceRoute(active, active.ids[1]), active, 'a later stop cannot skip the current stop');
const after = advanceRoute(active, active.ids[0]);
assert.equal(routePosition(after).completed, 1);
assert.equal(routePosition(after).current, active.ids[1]);
assert.equal(advanceRoute(after, active.ids[0]), after, 'repeat arrival cannot advance twice');
assert.equal(advanceRoute({ ...after, status: 'paused' }, active.ids[1]).completed.length, 1);
console.log('路线偏好、云游估时、编辑、到达推进与恢复校验通过');
