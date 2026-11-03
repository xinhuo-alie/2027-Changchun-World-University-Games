import { PROGRESS_KEY } from './progress.js';
import { BOOK_SESSION_KEY } from './book-navigation.js';

export const VISIT_SESSION_KEY = 'cc2027:visit-session:v1';
export const VISIT_SESSION_TEMP_KEYS = Object.freeze([
  BOOK_SESSION_KEY,
  'cc2027:creative',
  'cc2027:avatar',
  'cc2027:last-artwork',
  'cc2027:secret-generation-intent:v1',
  'cc2027:attraction-stickers:v1',
]);

export function createVisitSessionEpoch() {
  let value = 0;
  return {
    current: () => value,
    isCurrent: (token) => token === value,
    invalidate: () => ++value,
  };
}

export function buildVisitMemorialData({ places = [], visited = [], medals = [], stickers = [], claimedQuests = [], knowledgeBadge = false, role = null, gameResults = [], startedAt = null, endedAt = null } = {}) {
  const byId = new Map((Array.isArray(places) ? places : []).filter((place) => place && typeof place.id === 'string').map((place) => [place.id, place]));
  const names = (ids) => [...new Set(ids)].filter((id) => byId.has(id)).map((id) => ({ id, name: byId.get(id).name || id }));
  const safeDates = [startedAt, endedAt].every((value) => value == null || (typeof value === 'string' && Number.isFinite(Date.parse(value))));
  return {
    startedAt: safeDates ? startedAt : null,
    endedAt: safeDates ? endedAt : null,
    visitedPlaces: names(visited),
    medals: names(medals),
    stickers: names(stickers),
    claimedQuests: [...new Set(claimedQuests.filter((id) => typeof id === 'string'))],
    knowledgeBadge: knowledgeBadge === true,
    role: role && (role.previewUrl || role.name) ? { name: role.name || '', previewUrl: role.previewUrl || null } : null,
    gameResults: gameResults.filter((result) => result && typeof result.name === 'string' && Number.isFinite(result.score)).map((result) => ({ name: result.name, score: Math.floor(result.score), unit: result.unit || '分', won: result.won === true })),
    video: { status: 'not-available' },
  };
}

export function clearVisitSessionStorage(storage) {
  let progress = {};
  try { progress = JSON.parse(storage.getItem(PROGRESS_KEY) || '{}') || {}; } catch { /* Preserve whichever durable records can be read. */ }
  // Keep all-time personal records and badges; clear visit-specific exploration and tasks.
  const retained = {
    version: 2,
    bestScores: progress.bestScores || {},
    goalieBest: progress.goalieBest || 0,
    quizBest: progress.quizBest || 0,
    guideMode: 'relaxed',
  };
  for (const key of VISIT_SESSION_TEMP_KEYS) {
    try { storage.removeItem(key); } catch { /* Continue clearing other explicitly scoped keys. */ }
  }
  try { storage.setItem(PROGRESS_KEY, JSON.stringify(retained)); } catch { /* In-memory reset still works. */ }
}
