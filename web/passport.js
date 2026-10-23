import { recommendQuests } from './quests.js';
import { routePosition } from './itinerary.js';

export function buildPassport(progress, places) {
  const venues = places.filter((place) => place.kind === 'venue');
  const explored = new Set(progress.explored || []);
  const medals = new Set(progress.medals || []);
  const quests = recommendQuests(progress, places);
  const route = routePosition(progress.route);
  const collected = [...explored].filter((id) => places.some((place) => place.id === id)).length;
  const awarded = [...medals].filter((id) => venues.some((place) => place.id === id)).length;
  const claimed = quests.filter((quest) => quest.claimed).length;
  const total = places.length + venues.length + 1 + quests.length;
  const earned = collected + awarded + Number(Boolean(progress.quizBadge)) + claimed;
  const nextQuest = quests.find((quest) => quest.status === 'claimable') || quests.find((quest) => !quest.completed);
  return {
    explored: collected, placeTotal: places.length, medals: awarded, venueTotal: venues.length,
    quizBadge: Boolean(progress.quizBadge), quizBest: progress.quizBest || 0, goalieBest: progress.goalieBest || 0,
    bestScores: progress.bestScores || {}, claimed, questTotal: quests.length, quests,
    completion: total ? Math.round(earned / total * 100) : 0,
    route, nextQuest, stamps: places.map((place) => ({ id: place.id, name: place.name, kind: place.kind, collected: explored.has(place.id) })),
  };
}
