export const GUIDE_MODES = {
  relaxed: { label: '轻松漫游', interest: 'mixed', goal: 'stories' },
  sport: { label: '冰雪运动挑战', interest: 'sport', goal: 'games' },
  city: { label: '城市探索之旅', interest: 'culture', goal: 'stories' },
};

const TIME_LIMITS = { '30': { minutes: 30, stops: 3 }, '60': { minutes: 60, stops: 5 }, halfday: { minutes: 180, stops: 8 } };
const INTERESTS = new Set(['mixed', 'sport', 'culture']);
const PACES = new Set(['relaxed', 'balanced', 'challenge']);
const GOALS = new Set(['stamps', 'games', 'stories', 'first']);
const STATUSES = new Set(['idle', 'active', 'paused']);

export function normalizePreferences(raw = {}) {
  const mode = Object.hasOwn(GUIDE_MODES, raw.mode) ? raw.mode : 'relaxed';
  const defaults = GUIDE_MODES[mode];
  return {
    mode,
    time: Object.hasOwn(TIME_LIMITS, raw.time) ? raw.time : '60',
    interest: INTERESTS.has(raw.interest) ? raw.interest : defaults.interest,
    pace: PACES.has(raw.pace) ? raw.pace : 'balanced',
    goal: GOALS.has(raw.goal) ? raw.goal : defaults.goal,
  };
}

export function cloudMinutes(place) {
  if (Number.isFinite(place?.cloudMinutes)) return Math.max(2, Math.min(30, Math.round(place.cloudMinutes)));
  // 景点原有 duration 是线下参观建议，不能拿来推导云游时长。
  return place?.kind === 'venue' ? 5 : 8;
}

function scorePlace(place, prefs, progress, variant) {
  const venue = place.kind === 'venue';
  let score = 10;
  if (prefs.interest === 'sport') score += venue ? 20 : -5;
  if (prefs.interest === 'culture') score += venue ? -5 : 20;
  if (prefs.mode === 'sport') score += venue ? 9 : 0;
  if (prefs.mode === 'city') score += venue ? 0 : 9;
  if (prefs.mode === 'relaxed') score += venue ? 0 : 4;
  if (prefs.goal === 'games') score += place.game ? 13 : -2;
  if (prefs.goal === 'stories') score += Array.isArray(place.highlights) && place.highlights.length ? 6 : 0;
  if (prefs.goal === 'stamps') score += progress.explored?.includes(place.id) ? -13 : 12;
  if (prefs.goal === 'first') score += progress.explored?.includes(place.id) ? -18 : 10;
  if (prefs.pace === 'relaxed') score -= Math.max(0, cloudMinutes(place) - 6);
  if (prefs.pace === 'challenge' && place.game) score += 6;
  if (progress.explored?.includes(place.id)) score -= 6;
  if (venue && !progress.medals?.includes(place.id)) score += 3;
  // 可重复生成不同但稳定的候选；不使用随机数，便于测试与刷新恢复。
  score += ((place.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + variant * 7) % 11) - 5;
  return score;
}

export function explainStop(place, prefs, progress) {
  const reasons = [];
  if (!progress.explored?.includes(place.id)) reasons.push('尚未收集地点印章');
  if (place.kind === 'venue' && prefs.goal === 'games') reasons.push('可体验对应场馆挑战');
  if (place.kind === 'attraction' && (prefs.interest === 'culture' || prefs.mode === 'city')) reasons.push('符合城市文化兴趣');
  if (place.kind === 'venue' && (prefs.interest === 'sport' || prefs.mode === 'sport')) reasons.push('符合冰雪运动兴趣');
  if (prefs.goal === 'stories') reasons.push('可阅读地点手记');
  return reasons.slice(0, 2).join(' · ') || '适合当前云游节奏';
}

export function recommendItinerary(places, rawPreferences = {}, progress = {}, variant = 0) {
  const preferences = normalizePreferences(rawPreferences);
  const unique = [...new Map((Array.isArray(places) ? places : [])
    .filter((place) => place && typeof place.id === 'string' && ['venue', 'attraction'].includes(place.kind))
    .map((place) => [place.id, place])).values()];
  const ranked = unique.map((place) => ({ place, score: scorePlace(place, preferences, progress, variant) }))
    .sort((a, b) => b.score - a.score || a.place.id.localeCompare(b.place.id));
  const limit = TIME_LIMITS[preferences.time];
  const stops = [];
  let minutes = 0;
  for (const item of ranked) {
    const duration = cloudMinutes(item.place);
    if (stops.length >= limit.stops || minutes + duration > limit.minutes) continue;
    stops.push({
      id: item.place.id,
      reason: explainStop(item.place, preferences, progress),
      cloudMinutes: duration,
    });
    minutes += duration;
  }
  return { ids: stops.map((stop) => stop.id), stops, completed: [], status: 'idle', preferences, variant: Math.max(0, Math.floor(variant) || 0) };
}

export function normalizeRoute(raw, allowedIds) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const allowed = new Set(allowedIds);
  const ids = [...new Set((Array.isArray(raw.ids) ? raw.ids : []).filter((id) => typeof id === 'string' && allowed.has(id)))];
  if (!ids.length) return null;
  const completed = [...new Set((Array.isArray(raw.completed) ? raw.completed : []).filter((id) => ids.includes(id)))];
  const status = STATUSES.has(raw.status) ? raw.status : 'idle';
  return { ids, completed, status: completed.length === ids.length ? 'idle' : status,
    preferences: normalizePreferences(raw.preferences), variant: Number.isInteger(raw.variant) && raw.variant >= 0 ? raw.variant : 0 };
}

export function routePosition(route) {
  if (!route?.ids?.length) return { current: null, next: null, completed: 0, total: 0 };
  const remaining = route.ids.filter((id) => !route.completed.includes(id));
  return { current: remaining[0] || null, next: remaining[1] || null, completed: route.completed.length, total: route.ids.length };
}

export function advanceRoute(route, arrivedId) {
  if (!route || route.status !== 'active' || !route.ids.includes(arrivedId) || route.completed.includes(arrivedId)) return route;
  // 只有当前站到达才推进；手动探索其它地点不跳过路线站点。
  if (routePosition(route).current !== arrivedId) return route;
  const completed = [...route.completed, arrivedId];
  return { ...route, completed, status: completed.length === route.ids.length ? 'idle' : 'active' };
}

export function editRoute(route, action, id, otherId) {
  if (!route || route.status === 'active') return route;
  const ids = [...route.ids];
  const index = ids.indexOf(id);
  if (index < 0) return route;
  if (action === 'remove') ids.splice(index, 1);
  if (action === 'up' && index > 0) [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
  if (action === 'down' && index < ids.length - 1) [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
  if (action === 'replace' && typeof otherId === 'string' && !ids.includes(otherId)) ids[index] = otherId;
  if (!ids.length) return null;
  return { ...route, ids, completed: route.completed.filter((completedId) => ids.includes(completedId)) };
}
