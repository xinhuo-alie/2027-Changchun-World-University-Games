export const BOOK_SESSION_KEY = 'cc2027:book-session:v1';
const MODES = new Set(['guided', 'free-map']);
const SOURCES = new Set(['route', 'recommended', 'all']);

export const getPageForPlace = (placeId) => `place:${placeId}`;

export function buildBookManifest(places, { orderedPlaceIds = [], source = 'recommended' } = {}) {
  const valid = new Map((Array.isArray(places) ? places : [])
    .filter((place) => place && typeof place.id === 'string' && ['venue', 'attraction'].includes(place.kind))
    .map((place) => [place.id, place]));
  const ids = [...new Set((Array.isArray(orderedPlaceIds) ? orderedPlaceIds : []).filter((id) => valid.has(id)))];
  const ordered = source === 'all' ? [
    ...[...valid.values()].filter((place) => place.kind === 'venue').map((place) => place.id),
    ...[...valid.values()].filter((place) => place.kind === 'attraction').map((place) => place.id),
  ] : ids;
  const pages = [
    { id: 'intro', type: 'cover', chapter: 'intro' },
    { id: 'avatar', type: 'creator', chapter: 'identity' },
    { id: 'world-map', type: 'map', chapter: 'world' },
    ...ordered.map((placeId) => ({ id: getPageForPlace(placeId), type: 'place', chapter: valid.get(placeId).kind === 'venue' ? 'sports' : 'city', placeId })),
    { id: 'recap', type: 'recap', chapter: 'ending' },
  ];
  return { pages, orderedPlaceIds: ordered, source: SOURCES.has(source) ? source : 'recommended' };
}

export function normalizeBookSession(raw, allowedIds, manifest) {
  const allowed = new Set(allowedIds);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) return null;
  const orderedPlaceIds = [...new Set((Array.isArray(raw.orderedPlaceIds) ? raw.orderedPlaceIds : [])
    .filter((id) => typeof id === 'string' && allowed.has(id)))].slice(0, 16);
  const validPageIds = new Set(manifest.pages.map((page) => page.id));
  let currentPageId = typeof raw.currentPageId === 'string' && validPageIds.has(raw.currentPageId) ? raw.currentPageId : 'intro';
  const previousPageId = typeof raw.previousPageId === 'string' && validPageIds.has(raw.previousPageId) ? raw.previousPageId : null;
  if (currentPageId.startsWith('place:') && !orderedPlaceIds.includes(currentPageId.slice(6))) currentPageId = 'world-map';
  return {
    version: 1,
    viewMode: MODES.has(raw.viewMode) ? raw.viewMode : 'guided',
    currentPageId,
    previousPageId,
    orderedPlaceIds,
    source: SOURCES.has(raw.source) ? raw.source : 'recommended',
    lastReadPlaceId: typeof raw.lastReadPlaceId === 'string' && allowed.has(raw.lastReadPlaceId) ? raw.lastReadPlaceId : null,
    updatedAt: Number.isFinite(raw.updatedAt) && raw.updatedAt >= 0 ? Math.floor(raw.updatedAt) : 0,
  };
}

export function resolveAdjacentPage(manifest, currentPageId, direction) {
  const index = manifest.pages.findIndex((page) => page.id === currentPageId);
  if (index < 0) return null;
  return manifest.pages[index + (direction < 0 ? -1 : 1)] || null;
}

export function nextRecommendedPlace(orderedIds, currentPlaceId) {
  const index = orderedIds.indexOf(currentPlaceId);
  return index >= 0 ? orderedIds[index + 1] || null : null;
}

export function loadBookSession(storage, allowedIds, manifest) {
  try { return normalizeBookSession(JSON.parse(storage.getItem(BOOK_SESSION_KEY) || 'null'), allowedIds, manifest); }
  catch { return null; }
}

export function saveBookSession(storage, session, allowedIds, manifest) {
  const normalized = normalizeBookSession({ ...session, version: 1, updatedAt: Date.now() }, allowedIds, manifest);
  if (!normalized) return null;
  try { storage.setItem(BOOK_SESSION_KEY, JSON.stringify(normalized)); } catch { /* Reading remains available without storage. */ }
  return normalized;
}
