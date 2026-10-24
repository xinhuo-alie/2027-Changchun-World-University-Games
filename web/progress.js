export const LEGACY_PROGRESS_KEY = 'cc2027:progress';
export const PROGRESS_KEY = 'cc2027:progress:v2';
import { GUIDE_MODES, normalizeRoute } from './itinerary.js';
import { QUESTS } from './quests.js';

function strings(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function cleanIds(values, allowed) {
  return [...new Set(strings(values).filter((id) => allowed.has(id)))];
}

function cleanScores(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([id, score]) => allowed.has(id) && Number.isFinite(score) && score >= 0)
    .map(([id, score]) => [id, Math.floor(score)]));
}

export function normalizeProgress(raw, placeIds, venueIds) {
  const places = new Set(placeIds);
  const venues = new Set(venueIds);
  const questIds = new Set(QUESTS.map((quest) => quest.id));
  return {
    version: 2,
    explored: cleanIds(raw?.explored, places),
    medals: cleanIds(raw?.medals, venues),
    bestScores: cleanScores(raw?.bestScores, venues),
    goalieBest: Number.isFinite(raw?.goalieBest) && raw.goalieBest >= 0 ? Math.min(5, Math.floor(raw.goalieBest)) : 0,
    quizBest: Number.isFinite(raw?.quizBest) && raw.quizBest >= 0 ? Math.min(5, Math.floor(raw.quizBest)) : 0,
    quizBadge: raw?.quizBadge === true,
    guideMode: Object.hasOwn(GUIDE_MODES, raw?.guideMode) ? raw.guideMode : 'relaxed',
    route: normalizeRoute(raw?.route, places),
    readNotes: cleanIds(raw?.readNotes, places),
    observedPlaces: cleanIds(raw?.observedPlaces, places),
    knowledgeSources: cleanIds(raw?.knowledgeSources, places),
    claimedQuests: cleanIds(raw?.claimedQuests, questIds),
  };
}

export function createProgressStore(storage, placeIds, venueIds) {
  const places = new Set(placeIds);
  const venues = new Set(venueIds);

  function load() {
    let current = null;
    try {
      current = JSON.parse(storage.getItem(PROGRESS_KEY) || 'null');
    } catch { /* A malformed current save can still be recovered from the untouched legacy key. */ }
    if (current?.version === 2) return normalizeProgress(current, places, venues);

    let legacy = {};
    try {
      legacy = JSON.parse(storage.getItem(LEGACY_PROGRESS_KEY) || '{}');
    } catch { /* The current session can still run with empty in-memory progress. */ }
    const oldVisited = strings(legacy?.visited);
    const oldStamps = strings(legacy?.stamps);
    const migrated = normalizeProgress({
      explored: [...oldVisited, ...oldStamps.filter((id) => places.has(id) && !venues.has(id))],
      medals: oldStamps.filter((id) => venues.has(id)),
    }, places, venues);
    // Keep the legacy key untouched so users can recover or inspect their original data.
    try { storage.setItem(PROGRESS_KEY, JSON.stringify(migrated)); } catch { /* Keep the migrated state for this session. */ }
    return migrated;
  }

  function save(value) {
    const normalized = normalizeProgress(value, places, venues);
    try { storage.setItem(PROGRESS_KEY, JSON.stringify(normalized)); } catch { /* Storage can be unavailable in private browsing. */ }
    return normalized;
  }

  return { load, save };
}
