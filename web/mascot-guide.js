import { MASCOT_ASSETS } from '/mascot-assets.js';
import { GUIDE_EVENTS, createMascotCuePicker } from '/mascot-content-engine.js';
import { evaluateQuests } from '/quests.js';

const KEY = 'cc2027:mascot-guide:v1';
const SEEN_KEY = 'cc2027:mascot-guide-seen:v1';
const IDENTITY = { jibing: 'jiBing', jixue: 'jiXue' };
const SPEAKER = { jiBing: 'jibing', jiXue: 'jixue' };
const COPY = {
  welcome: { jiBing: '我是吉冰。先创造冰雪分身，或直接出发；冰上挑战等你来试。', jiXue: '我是吉雪。城市与雪上路线都在地图里，选一站慢慢逛。' },
  avatar: { jiBing: '分身就位。去地图挑一座冰上场馆，抵达后可以参加挑战。', jiXue: '分身准备好了。先看看雪上场馆和城市景点吧。' },
  arrival: { jiBing: ({ place }) => `抵达${place}。打开地点手记，看看这里有什么挑战。`, jiXue: ({ place }) => `抵达${place}。读读手记，再决定下一站。` },
  medal: { jiBing: ({ place }) => `${place}的挑战奖章已收入冰雪护照，继续向下一座场馆出发。`, jiXue: '新奖章到手。护照里能看到你的探索和收藏。' },
  identity_switch: { jiBing: ({ place }) => place ? `现在由吉冰陪你逛${place}。读完手记，可以去参加这里的冰雪挑战。` : '现在由吉冰带路。地图上的场馆挑战和冰雪游戏等你来试。', jiXue: ({ place }) => place ? `现在由吉雪陪你逛${place}。看看地点故事，也可以收藏喜欢的照片。` : '现在由吉雪带路。选一处城市景点，看看长春的冬日故事。' },
};
function readObject(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
function readPreference() {
  const saved = readObject(KEY);
  return { ...saved, identity: saved.identity === 'jiXue' ? 'jiXue' : 'jiBing', closed: saved.closed === true };
}

export function createMascotGuide({ mount, getProgress = () => ({}), getPlaces = () => [], onAction = () => {} }) {
  const preference = readPreference();
  const seenStore = readObject(SEEN_KEY);
  const picker = createMascotCuePicker({ store: seenStore });
  const placeCard = document.getElementById('mascotPlaceCard');
  const detailCard = document.getElementById('mascotDetailCard');
  let chapter = 'cover';
  let event = 'welcome';
  let detail = {};
  let activeCue = null;
  let actionCue = null;
  const box = document.createElement('aside');
  box.className = 'mascot-guide';
  box.setAttribute('aria-label', '吉冰吉雪导览');
  const portrait = document.createElement('img');
  portrait.className = 'mascot-guide-portrait';
  portrait.alt = '';
  portrait.hidden = true;
  portrait.addEventListener('error', () => { portrait.hidden = true; mark.hidden = false; });
  const mark = document.createElement('span');
  mark.className = 'mascot-guide-mark';
  mark.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  content.className = 'mascot-guide-content';
  const controls = document.createElement('div');
  controls.className = 'mascot-guide-controls';
  const title = document.createElement('strong');
  const switcher = document.createElement('button'); switcher.type = 'button'; switcher.setAttribute('aria-label', '切换导览角色');
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '关闭导览';
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  const lines = document.createElement('div'); lines.className = 'mascot-guide-lines';
  const answer = document.createElement('details'); answer.className = 'mascot-guide-answer';
  const answerSummary = document.createElement('summary'); answerSummary.textContent = '揭晓答案';
  const answerBody = document.createElement('p'); answer.append(answerSummary, answerBody);
  const actions = document.createElement('div'); actions.className = 'mascot-guide-actions';
  const mode = document.createElement('span'); mode.className = 'mascot-guide-mode';
  mode.textContent = '自动导览开启';
  const toggleMode = document.createElement('button'); toggleMode.type = 'button';
  toggleMode.addEventListener('click', () => { preference.auto = preference.auto === false; mode.textContent = preference.auto ? '自动导览开启' : '仅手动查看'; persist(); });
  controls.append(title, switcher, close, mode, toggleMode);
  content.append(controls, message, lines, answer, actions);
  box.append(portrait, mark, content);
  mount.append(box);
  const reopen = document.createElement('button'); reopen.className = 'mascot-guide-reopen'; reopen.type = 'button'; reopen.textContent = '吉冰 / 吉雪导览';
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(preference)); localStorage.setItem(SEEN_KEY, JSON.stringify(seenStore)); } catch { /* private browsing */ }
  }
  function clearCue() { activeCue = null; actionCue = null; lines.replaceChildren(); answer.hidden = true; actions.replaceChildren(); }
  function character(speaker = SPEAKER[preference.identity]) { return MASCOT_ASSETS[speaker] ? speaker : 'jibing'; }
  function setPortrait(speaker, mood = 'idle') {
    const who = character(speaker); const asset = MASCOT_ASSETS[who];
    const src = asset?.image?.[mood] || asset?.image?.idle;
    mark.textContent = asset?.fallback?.emoji || (who === 'jibing' ? '◇' : '✳');
    mark.hidden = false; portrait.hidden = true;
    if (!src) return;
    portrait.onload = () => { portrait.hidden = false; mark.hidden = true; };
    portrait.src = src;
  }
  function act(action) { if (!action) return; if (action.type === 'reveal_answer') { answer.open = true; return; } onAction(action); }
  function displayCue(cue) {
    clearCue(); activeCue = cue;
    const who = cue.speaker === 'duo' ? (cue.lines?.[0]?.speaker || 'jibing') : cue.speaker || SPEAKER[preference.identity];
    setPortrait(who, cue.mood || 'idle');
    title.textContent = cue.title || MASCOT_ASSETS[who]?.displayName || '导览提示';
    message.textContent = cue.body || '';
    if (Array.isArray(cue.lines) && cue.lines.length) {
      let index = 0;
      const drawLine = () => {
        lines.replaceChildren();
        const line = cue.lines[index];
        const row = document.createElement('p'); row.className = 'mascot-guide-dialogue';
        const speaker = document.createElement('b'); speaker.textContent = MASCOT_ASSETS[line.speaker]?.displayName || line.speaker;
        const text = document.createElement('span'); text.textContent = line.text;
        row.append(speaker, text); lines.append(row); setPortrait(line.speaker, line.mood || cue.mood || 'idle');
        if (index + 1 < cue.lines.length) {
          const next = document.createElement('button'); next.type = 'button'; next.textContent = `下一句（${index + 1}/${cue.lines.length}）`;
          next.addEventListener('click', () => { index += 1; drawLine(); }); lines.append(next);
        }
      }; drawLine();
    }
    if (cue.revealText) { answerBody.textContent = cue.revealText; answer.hidden = false; }
    for (const item of [cue.primaryAction, cue.secondaryAction]) if (item) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = item.label;
      button.addEventListener('click', () => act(item)); actions.append(button);
    }
    box.classList.toggle('is-game-reaction', chapter === 'game');
    if (placeCard && cue.kind === 'fact' && cue.placeId) {
      const place = getPlaces().find((item) => item.id === cue.placeId);
      if (place) {
        const heading = document.createElement('h3'); heading.textContent = place.name;
        const copy = document.createElement('p'); copy.textContent = cue.title;
        const reveal = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = '揭晓趣味答案';
        const response = document.createElement('p'); response.textContent = cue.revealText || cue.body;
        reveal.append(summary, response); placeCard.replaceChildren(heading, copy, reveal); placeCard.hidden = false;
      }
    }
  }
  function cueFor(name, extra = {}, { force = false } = {}) {
    if ((preference.closed || preference.auto === false) && !force) return null;
    const progress = getProgress();
    const cue = picker.pick({ event: name, mascot: SPEAKER[preference.identity], progress, ...extra }, { force });
    if (cue) { displayCue(cue); persist(); }
    return cue;
  }
  function render() {
    box.hidden = preference.closed; reopen.hidden = !preference.closed;
    toggleMode.textContent = preference.auto === false ? '开启自动提示' : '关闭自动提示';
    switcher.textContent = preference.identity === 'jiBing' ? '切换到吉雪' : '切换到吉冰';
    const target = document.getElementById(chapter === 'cover' ? 'mascotGuideCover' : chapter === 'creator' ? 'mascotGuideCreator' : chapter === 'detail' ? 'mascotDetailCard' : 'mascotGuideMap') || mount;
    target.append(box, reopen);
    if (activeCue && !preference.closed) displayCue(activeCue);
    else {
      clearCue(); setPortrait(SPEAKER[preference.identity], 'idle');
      title.textContent = event === 'identity_switch'
        ? (preference.identity === 'jiBing' ? '吉冰 · 赛事搭档' : '吉雪 · 城市观察员')
        : preference.identity === 'jiBing' ? '吉冰 · 冰上挑战' : '吉雪 · 雪上与城市探索';
      const value = COPY[event]?.[preference.identity] || COPY.welcome[preference.identity];
      message.textContent = typeof value === 'function' ? value(detail) : value;
    }
  }
  switcher.addEventListener('click', () => {
    const currentPlaceId = activeCue?.placeId || detail.placeId;
    const currentPlace = getPlaces().find((item) => item.id === currentPlaceId);
    preference.identity = preference.identity === 'jiBing' ? 'jiXue' : 'jiBing';
    event = 'identity_switch';
    detail = { ...detail, placeId: currentPlaceId, place: currentPlace?.name || detail.placeName || '' };
    clearCue();
    persist();
    render();
  });
  close.addEventListener('click', () => { preference.closed = true; persist(); render(); });
  reopen.addEventListener('click', () => { preference.closed = false; persist(); render(); });
  function showArrival(place, first) {
    const cue = cueFor(first ? GUIDE_EVENTS.PLACE_ARRIVED : GUIDE_EVENTS.PLACE_REVISIT, { placeId: place.id, placeName: place.name });
    if (cue) {
      detail = { placeId: place.id, placeName: place.name };
      if (placeCard) { placeCard.hidden = false; placeCard.replaceChildren(); placeCard.append(box); }
      const fact = cueFor(GUIDE_EVENTS.PLACE_FACT, { placeId: place.id });
      if (fact) { if (placeCard) placeCard.append(createFactCard(place, fact)); displayCue(fact); }
    }
    return cue;
  }
  function createFactCard(place, cue) {
    const card = document.createElement('article'); card.className = 'mascot-fun-fact';
    const heading = document.createElement('h3'); heading.textContent = `${place.name} · 趣味卡`;
    const question = document.createElement('p'); question.textContent = cue.title || '';
    const answer = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = '揭晓答案';
    const body = document.createElement('p'); body.textContent = cue.revealText || '';
    answer.append(summary, body); card.append(heading, question, answer); return card;
  }
  function notify(name, extra = {}, options) { event = name; detail = extra; return cueFor(name, extra, options); }
  function placeNote(place) {
    if (!detailCard) return cueFor(GUIDE_EVENTS.PLACE_NOTE_OPEN, { placeId: place.id });
    chapter = 'detail';
    event = 'place_note_open';
    detail = { placeId: place.id, placeName: place.name, place: place.name };
    detailCard.hidden = false; detailCard.replaceChildren();
    const cue = cueFor(GUIDE_EVENTS.PLACE_FACT, { placeId: place.id }, { force: true }) || cueFor(GUIDE_EVENTS.PLACE_NOTE_OPEN, { placeId: place.id }, { force: true });
    if (!cue || preference.closed) { detailCard.hidden = true; return cue; }
    detailCard.append(box);
    return cue;
  }
  function checkQuests() {
    const progress = getProgress(); const quests = evaluateQuests(progress, getPlaces());
    for (const q of quests) if (q.status === 'claimable' && !(progress.claimedQuests || []).includes(q.id)) {
      cueFor(GUIDE_EVENTS.QUEST_READY, { questId: q.id }); break;
    }
  }
  function initialCover() {
    const first = !seenStore.coverSeen;
    seenStore.coverSeen = true; persist();
    cueFor(first ? GUIDE_EVENTS.COVER_FIRST : GUIDE_EVENTS.COVER_RETURN);
  }
  render();
  return {
    setChapter(value) {
      const previous = chapter; chapter = value;
      if (value === 'creator') notify(previous === 'cover' ? GUIDE_EVENTS.WORKSHOP_FIRST : GUIDE_EVENTS.WORKSHOP_OPEN);
      if (value === 'map') { notify(seenStore.mapSeen ? GUIDE_EVENTS.MAP_OPEN : GUIDE_EVENTS.MAP_FIRST); seenStore.mapSeen = true; persist(); }
      if (value === 'cover' && previous !== 'cover') notify(GUIDE_EVENTS.COVER_RETURN);
      render();
    },
    initialCover,
    notify,
    showArrival,
    placeNote,
    gameStart(place) { chapter = 'game'; return notify(GUIDE_EVENTS.GAME_START, { placeId: place.id }); },
    gameFinish(won, place, result) {
      chapter = 'game'; const progress = getProgress();
      const priorBest = progress.bestScores?.[place.id];
      const bestBefore = Number.isFinite(priorBest) ? priorBest : -Infinity;
      const isNewBest = Number.isFinite(result?.score) && result.score > bestBefore;
      const eventName = isNewBest ? GUIDE_EVENTS.GAME_NEW_BEST : won ? GUIDE_EVENTS.GAME_WIN : GUIDE_EVENTS.GAME_LOSE;
      const cue = notify(eventName, { placeId: place.id });
      if (won && place.kind === 'venue' && !progress.medals?.includes?.(place.id)) return notify(GUIDE_EVENTS.GAME_MEDAL, { placeId: place.id }) || cue;
      return cue;
    },
    quizFinish({ score, total }) { return notify(GUIDE_EVENTS.QUIZ_DONE, { score, total }); },
    passportOpen() { const cue = notify(seenStore.passportSeen ? GUIDE_EVENTS.PASSPORT_OPEN : GUIDE_EVENTS.PASSPORT_FIRST); seenStore.passportSeen = true; persist(); return cue; },
    questClaimed(questId) { return notify(GUIDE_EVENTS.QUEST_CLAIMED, { questId }); },
    routeChanged(route) {
      if (!route) return;
      const previous = seenStore.lastRouteStatus;
      seenStore.lastRouteStatus = route.status;
      if (route.status === 'paused' && previous !== 'paused') notify(GUIDE_EVENTS.ROUTE_PAUSE);
      else if (route.status === 'finished' && previous !== 'finished') notify(GUIDE_EVENTS.ROUTE_COMPLETE);
      checkQuests(); persist();
    },
    checkQuests,
  };
}
