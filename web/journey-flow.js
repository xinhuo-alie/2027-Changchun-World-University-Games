import { recommendQuests } from './quests.js';
import { routePosition } from './itinerary.js';

const has = (items, id) => Array.isArray(items) && items.includes(id);
const relatedTo = (quest, placeId) => quest.steps.some(step => step.id === placeId || step.ids?.includes(placeId));

export function journeyForPlace(place, progress, places) {
  const quests = recommendQuests(progress, places);
  const related = quests.filter(quest => relatedTo(quest, place.id) && !quest.claimed);
  const localQuest = related.find(quest => quest.status === 'claimable') || related.find(quest => quest.status === 'incomplete') || null;
  const medalNeeded = Boolean(place.game && !has(progress.medals, place.id));
  const observationNeeded = !has(progress.observedPlaces, place.id);
  const quizStep = related.find(quest => quest.nextStep?.type === 'knowledgeAny' && quest.nextStep.ids.includes(place.id))?.nextStep;
  const quizNeeded = Boolean(quizStep);
  // Prefer a claimable quest connected to this place so the call to action and
  // the quest shown in the field note always refer to the same reward.
  const claimable = localQuest?.status === 'claimable' ? localQuest : quests.find(quest => quest.status === 'claimable');
  const routeId = progress.route?.status === 'active' ? routePosition(progress.route).current : null;
  const quest = quests.find(item => item.status === 'incomplete');
  const step = quest?.nextStep;
  let next;

  if (claimable) next = { type: 'passport', label: `领取「${claimable.title}」任务章`, reason: '任务已完成，去护照收下纪念章。' };
  else if (medalNeeded) next = { type: 'game', label: `挑战${place.name}`, reason: '赢得这一站的场馆奖章，再继续出发。' };
  else if (observationNeeded) next = { type: 'observe', label: '完成这一站的观察', reason: '根据手记提示找一个细节，记录后继续旅程。' };
  else if (quizNeeded) next = { type: 'quiz', ids: quizStep.ids, label: '答一道相关知识题', reason: '读过手记了，用知识题推进故事任务。' };
  else if (routeId && routeId !== place.id) {
    const target = places.find(item => item.id === routeId);
    if (target) next = { type: 'place', id: target.id, label: `前往${target.name}`, reason: '按已规划的云游路线继续。' };
  }
  if (!next && step?.type === 'knowledgeAny') next = { type: 'quiz', ids: step.ids, label: '完成相关知识题', reason: `推进「${quest.title}」任务。` };
  if (!next && step?.id && step.id !== place.id) {
    const target = places.find(item => item.id === step.id);
    if (target) next = { type: 'place', id: target.id, label: `前往${target.name}`, reason: `推进「${quest.title}」任务：${quest.nextLabel}。` };
  }
  if (!next) {
    const unseen = places.filter(item => item.id !== place.id && !has(progress.explored, item.id));
    const preferred = unseen.find(item => progress.guideMode === 'sport' ? item.kind === 'venue' :
      progress.guideMode === 'city' ? item.kind === 'attraction' : item.kind !== place.kind);
    const target = preferred || unseen[0];
    next = target ? { type: 'place', id: target.id, label: `前往${target.name}`, reason: '探索一处尚未到达的地点，收集新印章。' } :
      { type: 'passport', label: '查看冰雪护照', reason: '所有地点都已探索，回顾这一趟旅程。' };
  }
  return { localQuest, claimableQuest: claimable || null, medalNeeded, observationNeeded, quizNeeded, quizIds: quizStep?.ids || [], next };
}
