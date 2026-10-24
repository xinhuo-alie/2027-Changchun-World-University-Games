export const QUESTS = [
  { id: 'explore-first', category: 'explore', title: '赛场遇见城市', description: '探索五环体育馆、伪满皇宫博物院与长影旧址博物馆。',
    steps: [{ type: 'explored', id: 'wuhuan' }, { type: 'explored', id: 'palace' }, { type: 'explored', id: 'film' }] },
  { id: 'explore-winter', category: 'explore', title: '从雪道到湖畔', description: '探索净月潭滑雪场、南湖公园与文化广场。',
    steps: [{ type: 'explored', id: 'jingyue' }, { type: 'explored', id: 'nanhu' }, { type: 'explored', id: 'culture' }] },
  { id: 'sport-speed', category: 'sport', title: '冰上速度双章', description: '赢得五环体育馆与吉林省速滑馆的挑战奖章。',
    steps: [{ type: 'medal', id: 'wuhuan' }, { type: 'medal', id: 'speed' }] },
  { id: 'sport-skill', category: 'sport', title: '冰面技巧双章', description: '赢得冰壶与冰球场馆的挑战奖章。',
    steps: [{ type: 'medal', id: 'cityhall' }, { type: 'medal', id: 'provhall' }] },
  { id: 'story-film', category: 'story', title: '长春的电影记忆', description: '阅读长影旧址与长影世纪城手记，并答对一道相关题。',
    steps: [{ type: 'read', id: 'film' }, { type: 'read', id: 'century' }, { type: 'knowledgeAny', ids: ['film', 'century'] }] },
  { id: 'story-snow', category: 'story', title: '读懂冰雪赛场', description: '阅读五环与净月潭手记，并答对一道相关题。',
    steps: [{ type: 'read', id: 'wuhuan' }, { type: 'read', id: 'jingyue' }, { type: 'knowledgeAny', ids: ['wuhuan', 'jingyue'] }] },
  { id: 'explore-snow-cities', category: 'explore', title: '双城雪迹', description: '探索松花湖和北大湖，在北大湖完成观察，再走进雕塑园。',
    steps: [{ type: 'explored', id: 'songhuahu' }, { type: 'explored', id: 'beidahu' }, { type: 'observed', id: 'beidahu' }, { type: 'explored', id: 'sculpture' }] },
  { id: 'story-city-parks', category: 'story', title: '城市里的冬日风景', description: '阅读南湖、文化广场与雕塑园手记，在南湖完成观察，并答对一道相关题。',
    steps: [{ type: 'read', id: 'nanhu' }, { type: 'observed', id: 'nanhu' }, { type: 'read', id: 'culture' }, { type: 'read', id: 'sculpture' }, { type: 'knowledgeAny', ids: ['nanhu', 'culture', 'sculpture'] }] },
];

const CATEGORY = { explore: '探索任务', sport: '运动挑战', story: '城市故事' };

export function stepDone(step, progress) {
  if (step.type === 'explored') return progress.explored?.includes(step.id) || false;
  if (step.type === 'medal') return progress.medals?.includes(step.id) || false;
  if (step.type === 'read') return progress.readNotes?.includes(step.id) || false;
  if (step.type === 'observed') return progress.observedPlaces?.includes(step.id) || false;
  if (step.type === 'knowledgeAny') return step.ids.some((id) => progress.knowledgeSources?.includes(id));
  return false;
}

export function questStepLabel(step, places = []) {
  const names = new Map(places.map((place) => [place.id, place.name]));
  if (step.type === 'knowledgeAny') return `答对 ${step.ids.map(id => names.get(id) || id).join(' / ')} 的相关题目`;
  const place = names.get(step.id) || '指定地点';
  if (step.type === 'medal') return `赢得${place}挑战奖章`;
  if (step.type === 'read') return `阅读${place}手记`;
  if (step.type === 'observed') return `完成${place}观察发现`;
  return `探索${place}`;
}

export function evaluateQuests(progress = {}, places = []) {
  const names = new Map(places.map((place) => [place.id, place.name]));
  return QUESTS.map((quest) => {
    const done = quest.steps.map((step) => stepDone(step, progress));
    const completed = done.every(Boolean);
    const claimed = completed && (progress.claimedQuests || []).includes(quest.id);
    const nextStep = quest.steps[done.findIndex((value) => !value)] || null;
    return { ...quest, categoryLabel: CATEGORY[quest.category], done: done.filter(Boolean).length,
      total: done.length, completed, claimed, status: claimed ? 'claimed' : completed ? 'claimable' : 'incomplete',
      nextStep, nextLabel: nextStep ? (nextStep.type === 'knowledgeAny' ? '去答相关知识题' :
        nextStep.type === 'medal' ? `挑战${names.get(nextStep.id) || '下一座场馆'}` :
          `${nextStep.type === 'read' ? '阅读' : nextStep.type === 'observed' ? '观察' : '探索'}${names.get(nextStep.id) || '下一站'}`) : '任务已完成' };
  });
}

export function recommendQuests(progress = {}, places = []) {
  const priority = progress.guideMode === 'sport' ? ['sport', 'explore', 'story'] :
    progress.guideMode === 'city' ? ['story', 'explore', 'sport'] : ['explore', 'story', 'sport'];
  return evaluateQuests(progress, places).sort((a, b) => {
    const stateRank = { claimable: 0, incomplete: 1, claimed: 2 };
    return stateRank[a.status] - stateRank[b.status] ||
      priority.indexOf(a.category) - priority.indexOf(b.category);
  });
}

export function claimQuest(progress, questId, places = []) {
  const quest = evaluateQuests(progress, places).find((item) => item.id === questId);
  if (!quest?.completed || quest.claimed) return progress;
  return { ...progress, claimedQuests: [...new Set([...(progress.claimedQuests || []), questId])] };
}
