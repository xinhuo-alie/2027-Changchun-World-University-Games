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
  let mapGuideStep = 0;
  let coachStep = null;
  let popoverOpen = false;
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
  document.body.append(box);
  const reopen = document.createElement('button'); reopen.className = 'mascot-guide-reopen'; reopen.type = 'button';
  reopen.setAttribute('aria-label', '唤醒吉冰吉雪导航');
  const reopenPortrait = document.createElement('img'); reopenPortrait.alt = ''; reopenPortrait.setAttribute('aria-hidden','true');
  const reopenLabel = document.createElement('span'); reopenLabel.textContent = '问问吉冰';
  reopen.append(reopenPortrait,reopenLabel);
  document.body.append(reopen);
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(preference)); localStorage.setItem(SEEN_KEY, JSON.stringify(seenStore)); } catch { /* private browsing */ }
  }
  function clearCue() { activeCue = null; actionCue = null; lines.replaceChildren(); answer.hidden = true; actions.replaceChildren(); if (box._coachPointer) { box._coachPointer.remove(); box._coachPointer = null; } }
  function character(speaker = SPEAKER[preference.identity]) { return MASCOT_ASSETS[speaker] ? speaker : 'jibing'; }
  function setPortrait(speaker, mood = 'idle') {
    const who = character(speaker); const asset = MASCOT_ASSETS[who];
    const src = asset?.image?.[mood] || asset?.image?.idle;
    mark.textContent = asset?.fallback?.emoji || (who === 'jibing' ? '◇' : '✳');
    mark.hidden = false; portrait.hidden = true;
    if (!src) return;
    portrait.onload = () => { portrait.hidden = false; mark.hidden = true; };
    portrait.src = src;
    reopenPortrait.src = MASCOT_ASSETS[character(SPEAKER[preference.identity])]?.image?.happy || MASCOT_ASSETS[character(SPEAKER[preference.identity])]?.image?.idle || '';
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
      button.addEventListener('click', () => {
        if (item.type === 'enter_tour') { popoverOpen = false; render(); }
        act(item);
      }); actions.append(button);
    }
    if (chapter === 'map') {
      const more = document.createElement('button'); more.type = 'button'; more.className = 'mascot-guide-next'; more.textContent = '下一步 →';
      more.addEventListener('click', () => { activeCue = null; render(); });
      actions.append(more);
    }
    box.classList.toggle('is-game-reaction', chapter === 'game');
    positionPopover(cue.targetSelector || cueAnchorForEvent(cue.event));
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
  function cueAnchorForEvent(name) {
    if (name === GUIDE_EVENTS.COVER_FIRST || name === GUIDE_EVENTS.COVER_RETURN) return '#openBook';
    if (name === GUIDE_EVENTS.PLACE_ARRIVED || name === GUIDE_EVENTS.PLACE_FACT || name === GUIDE_EVENTS.PLACE_NOTE_OPEN) return '#detailJourney';
    return '';
  }
  function positionPopover(selector = '', attempt = 0) {
    box.dataset.anchor = selector;
    box.classList.remove('has-anchor','anchor-above','anchor-below');
    if (box._coachTarget) box._coachTarget.classList.remove('mascot-coach-target');
    box._coachTarget = null;
    if (!selector || box.hidden || chapter === 'game') return;
    const target = document.querySelector(selector);
    if (!target) return;
    if (target.getClientRects().length === 0 || !target.getBoundingClientRect().width || !target.getBoundingClientRect().height) {
      if (attempt < 10) window.setTimeout(() => positionPopover(selector, attempt + 1), 90);
      return;
    }
    box._coachTarget = target;
    target.classList.add('mascot-coach-target');
    box.classList.add('has-anchor');
    requestAnimationFrame(() => {
      if (box.hidden || !box.classList.contains('has-anchor')) return;
      const anchor = target.getBoundingClientRect();
      const card = box.getBoundingClientRect();
      if ((!anchor.width || !anchor.height) && attempt < 10) { window.setTimeout(() => positionPopover(selector, attempt + 1), 90); return; }
      const margin = 14;
      const gap = 18;
      const below = anchor.bottom + card.height + gap <= innerHeight - margin;
      const above = anchor.top - card.height - gap >= margin;
      const placeBelow = below || !above;
      const top = placeBelow
        ? Math.min(innerHeight - card.height - margin, anchor.bottom + gap)
        : Math.max(margin, anchor.top - card.height - gap);
      let preferredLeft = anchor.left + anchor.width / 2 - card.width / 2;
      if (anchor.width >= card.width * 1.2) {
        if (anchor.left >= innerWidth * .42) preferredLeft = anchor.left - card.width - gap;
        else preferredLeft = anchor.right + gap;
      }
      const left = Math.max(margin, Math.min(innerWidth - card.width - margin, preferredLeft));
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.right = 'auto';
      box.style.bottom = 'auto';
      box.style.setProperty('--coach-arrow-x', `${Math.max(20, Math.min(card.width - 20, anchor.left + anchor.width / 2 - left))}px`);
      if (box._coachPointer) {
        const dx = anchor.left + anchor.width / 2 - (left + card.width / 2);
        const dy = anchor.top + anchor.height / 2 - (top + card.height / 2);
        const arrow = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '→' : '←') : (dy > 0 ? '↓' : '↑');
        box._coachPointer.textContent = `${arrow} 看这里`;
      }
      box.classList.toggle('anchor-below', placeBelow);
      box.classList.toggle('anchor-above', !placeBelow);
    });
  }
  function coachCopy(key) {
    return {
      'creator-choose': { target:'#rolePhotoControls', title:'第 1 步 · 选一个角色', body:'可以直接挑一位冰雪伙伴，也可以上传照片创建自己的角色。选好后，我会接着告诉你下一步。', button:'我先去选角色' },
      'creator-depart': { target:'#enterTour', title:'第 2 步 · 带角色出发', body:'你的冰雪分身已经准备好了。点击「带我去游览」，角色就会跃入赛事地图。', button:'带我去游览 →', action:'enter_tour' },
      'map-select': { target:'#map', title:'第 3 步 · 选一处目的地', body:'点击地图上的场馆或景点标记，角色会沿路线抵达。到站后我会带你看手记，再介绍这里的挑战。', button:'我知道了，去选地点' },
    }[key];
  }
  function drawCoachStep() {
    const step = coachCopy(coachStep);
    if (!step) return;
    clearCue();
    box.classList.remove('is-game-reaction');
    title.textContent = step.title;
    message.textContent = step.body;
    const pointer = document.createElement('span'); pointer.className='mascot-guide-pointer'; pointer.textContent='↗ 看这里'; pointer.setAttribute('aria-hidden','true');
    content.insertBefore(pointer,lines); box._coachPointer=pointer;
    const action = document.createElement('button'); action.type='button'; action.className='mascot-guide-step-action'; action.textContent=step.button;
    action.addEventListener('click', () => {
      if (step.action === 'enter_tour') { popoverOpen=false; render(); onAction({type:'enter_tour'}); return; }
      if (coachStep === 'creator-choose') {
        const first = document.querySelector('#rolePhotoControls button:not(:disabled)');
        first?.focus({ preventScroll:true });
      }
      popoverOpen=false; render();
    });
    actions.append(action);
    const target = step.target;
    box.dataset.coachStep = coachStep;
    const targetNode = document.querySelector(target);
    targetNode?.scrollIntoView({ behavior:'smooth', block:'center', inline:'nearest' });
    positionPopover(target);
  }
  function drawMapGuide() {
    const places = getPlaces();
    const currentPlace = places.find((place) => place.id === (detail.placeId || getProgress().pendingVenueId));
    const steps = [
      { title: '① 先选一个地点', body: '点地图上的场馆或景点标记，角色会走过去；抵达后会打开地点手记。', action: { type: 'open_route' }, label: '规划游览路线 →' },
      { title: '② 到站后做什么', body: '读地点手记、按提示记录一个观察发现；有小游戏的场馆还能赢取专属奖章。', action: currentPlace?.game ? { type: 'start_current_game', placeId: currentPlace.id } : { type: 'open_passport' }, label: currentPlace?.game ? '挑战当前场馆 →' : '查看探索记录 →' },
      { title: '③ 完成后继续逛', body: '回到地图再点下一个标记。印章、挑战奖章和任务进度会自动记入冰雪护照。', action: { type: 'open_passport' }, label: '打开冰雪护照 →' },
      { title: '④ 不知道去哪一站', body: '路线规划会按轻松漫游、运动挑战或城市探索，排出一条可逐站游玩的顺序。', action: { type: 'open_route' }, label: '选择路线偏好 →' },
    ];
    const step = steps[mapGuideStep % steps.length];
    const card = document.createElement('div'); card.className = 'mascot-guide-step';
    const heading = document.createElement('strong'); heading.textContent = step.title;
    const copy = document.createElement('p'); copy.textContent = step.body;
    const next = document.createElement('button'); next.type = 'button'; next.className = 'mascot-guide-next'; next.textContent = '下一步 →';
    next.setAttribute('aria-label', `导览第 ${mapGuideStep % steps.length + 1} 步，点击查看下一条`);
    next.addEventListener('click', () => { mapGuideStep = (mapGuideStep + 1) % steps.length; render(); });
    card.append(heading, copy, next);
    const go = document.createElement('button'); go.type = 'button'; go.className = 'mascot-guide-step-action'; go.textContent = step.label;
    go.addEventListener('click', () => act(step.action));
    lines.replaceChildren(card); actions.replaceChildren(go);
  }
  function cueFor(name, extra = {}, { force = false } = {}) {
    if ((preference.closed || preference.auto === false) && !force) return null;
    const progress = getProgress();
    const cue = picker.pick({ event: name, mascot: SPEAKER[preference.identity], progress, ...extra }, { force });
    if (cue) { coachStep = null; popoverOpen = true; activeCue = cue; render(); persist(); }
    return cue;
  }
  function render() {
    box.hidden = preference.closed || !popoverOpen;
    reopen.hidden = chapter === 'game' || (!preference.closed && popoverOpen);
    toggleMode.textContent = preference.auto === false ? '开启自动提示' : '关闭自动提示';
    switcher.textContent = preference.identity === 'jiBing' ? '切换到吉雪' : '切换到吉冰';
    box.dataset.coachStep = coachStep || '';
    if (activeCue && !preference.closed && popoverOpen) displayCue(activeCue);
    else if (coachStep && !preference.closed && popoverOpen) drawCoachStep();
    else {
      clearCue(); setPortrait(SPEAKER[preference.identity], 'idle');
      title.textContent = event === 'identity_switch'
        ? (preference.identity === 'jiBing' ? '吉冰 · 赛事搭档' : '吉雪 · 城市观察员')
        : preference.identity === 'jiBing' ? '吉冰 · 冰上挑战' : '吉雪 · 雪上与城市探索';
      const value = COPY[event]?.[preference.identity] || COPY.welcome[preference.identity];
      message.textContent = typeof value === 'function' ? value(detail) : value;
      if (chapter === 'map') drawMapGuide();
      positionPopover(chapter === 'cover' ? '#openBook' : chapter === 'creator' ? '#enterTour' : '');
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
  close.addEventListener('click', () => { preference.closed = true; popoverOpen = false; persist(); render(); });
  reopen.addEventListener('click', () => {
    preference.closed = false; popoverOpen = true;
    if (!activeCue && !coachStep) {
      if (chapter === 'creator') coachStep = document.getElementById('enterTour')?.disabled ? 'creator-choose' : 'creator-depart';
      else if (chapter === 'map') coachStep = 'map-select';
    }
    persist(); render();
  });
  window.addEventListener('resize', () => positionPopover(box.dataset.anchor));
  window.addEventListener('scroll', () => positionPopover(box.dataset.anchor), true);
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
      if (value === 'creator') {
        coachStep = document.getElementById('enterTour')?.disabled ? 'creator-choose' : 'creator-depart';
        activeCue = null;
        if (!preference.closed && preference.auto !== false) popoverOpen = true;
      }
      if (value === 'map') {
        coachStep = 'map-select'; activeCue = null;
        if (!preference.closed && preference.auto !== false) popoverOpen = true;
        seenStore.mapSeen = true; persist();
      }
      if (value === 'cover' && previous !== 'cover') notify(GUIDE_EVENTS.COVER_RETURN);
      render();
    },
    initialCover,
    notify(name, extra = {}, options) {
      if (name === 'avatar' || name === GUIDE_EVENTS.AVATAR_READY) {
        event = GUIDE_EVENTS.AVATAR_READY; detail = extra; coachStep = 'creator-depart'; activeCue = null;
        if (!preference.closed && preference.auto !== false) popoverOpen = true;
        render(); return true;
      }
      return notify(name, extra, options);
    },
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
