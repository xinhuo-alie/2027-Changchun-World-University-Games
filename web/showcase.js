import { applyMapLayout, createMapView } from '/venues2d.js';
import { fetchMapLayout } from '/map-layout-client.js';
import { drawVenueIllustration } from '/venue-art.js';
import { connectStats } from '/visit-client.js';
import { QUESTS } from '/quests.js';
import { QUIZ_QUESTIONS } from '/quiz-questions.js';

const $ = id => document.getElementById(id);
const number = value => Number(value || 0).toLocaleString('zh-CN');
const formatTime = value => new Date(value).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' });
const panelIds = ['quest', 'story', 'quiz', 'characters'];
let places = [];
let map;
let onlinePlayers = [];
let activePanel = 'quest';
let panelBag = [];
let gamePlayerIndex = 0;
let panelTimer;
let gameImageTimer;
let latestArrivalKey = '';
let autoRotate = true;
let quizIndex = 0;
let quizAnswered = false;
let bags = new Map();
let loadedAvatars = new Map();
let visualPositions = new Map();
let lastOverlayFrame = 0;
let gameFrameBusy = false;
let gameFrameObjectUrl = '';
let gameFramePublicId = '';

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const $el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function setClock() { $('clock').textContent = `${new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })} 北京时间`; }
function mapById(id) { return places.find(place => place.id === id); }
function cycleWithoutRepeats(key, values) {
  if (!values.length) return null;
  let bag = bags.get(key);
  if (!bag || !bag.remaining.length) {
    const shuffled = shuffle(values);
    if (shuffled.length > 1 && shuffled[0] === bag?.last) shuffled.push(shuffled.shift());
    bag = { remaining: shuffled, last: bag?.last };
    bags.set(key, bag);
  }
  const value = bag.remaining.shift();
  bag.last = value;
  return value;
}

function selectPlace(id, openStory = true) {
  const place = mapById(id);
  if (!place) return;
  map?.setActive(id);
  $('mapCaption').textContent = `${place.name} · ${place.teaser}`;
  $('footerFact').textContent = place.highlights?.[0] || place.teaser;
  if (openStory) showPanel('story', place);
}

function renderQuest() {
  const quest = cycleWithoutRepeats('quest', QUESTS);
  if (!quest) return;
  const panel = $('discoveryPanel'); panel.replaceChildren();
  const copy = $el('div', 'discovery-copy');
  copy.append($el('p', 'eyebrow', 'A MISSION FOR EVERY EXPLORER'), $el('h3', '', quest.title), $el('p', 'panel-description', quest.description));
  const route = $el('div', 'quest-route');
  quest.steps.forEach((step, index) => {
    const label = mapById(step.id)?.name || step.ids?.map(id => mapById(id)?.name).filter(Boolean).join(' / ') || '知识挑战';
    route.append($el('span', 'quest-stop', label));
    if (index < quest.steps.length - 1) route.append($el('i', 'quest-arrow', '→'));
  });
  copy.append(route);
  const footer = $el('div', 'micro-proof'); footer.append($el('b', '', `${QUESTS.length}`), $el('span', '', '条旅行任务 · 每轮内容不重复')); panel.append(copy, footer);
}

function renderStory(preferred) {
  const choices = places.filter(place => place.kind === 'attraction');
  const place = preferred || cycleWithoutRepeats('story', choices) || places[0];
  if (!place) return;
  const panel = $('discoveryPanel'); panel.replaceChildren();
  const art = $el('canvas', 'story-art'); art.width = 600; art.height = 160;
  drawVenueIllustration(art.getContext('2d'), place, 0, 0, art.width, art.height);
  const copy = $el('div', 'story-copy');
  copy.append($el('p', 'eyebrow', place.kind === 'venue' ? 'ICE ARENA · FIELD NOTES' : 'CHANGCHUN · CITY NOTES'), $el('h3', '', place.name), $el('p', 'panel-description', place.teaser), $el('span', 'story-hook', place.highlights?.[0] || place.desc));
  panel.append(art, copy);
}

function revealQuiz(answered = false, selectedIndex = -1) {
  const q = QUIZ_QUESTIONS[quizIndex % QUIZ_QUESTIONS.length];
  const panel = $('discoveryPanel'); panel.replaceChildren();
  const copy = $el('div', 'quiz-copy');
  copy.append($el('p', 'eyebrow', `CITY QUIZ · ${String(quizIndex + 1).padStart(2, '0')}`), $el('h3', '', q.question));
  const options = $el('div', 'quiz-options');
  q.options.forEach((option, index) => {
    const button = $el('button', 'quiz-option'); button.type = 'button'; button.disabled = answered;
    button.append($el('b', '', String.fromCharCode(65 + index)), document.createTextNode(option));
    if (answered && index === q.answer) button.classList.add('correct');
    if (answered && index === selectedIndex && selectedIndex !== q.answer) button.classList.add('incorrect');
    button.addEventListener('click', () => { quizAnswered = true; revealQuiz(true, index); });
    options.append(button);
  });
  copy.append(options);
  if (answered) copy.append($el('p', 'quiz-explanation', q.explanation));
  panel.append(copy);
}

function avatarImage(player) {
  if (!player.avatarUrl) return null;
  let img = loadedAvatars.get(player.publicId);
  if (!img) {
    img = new Image(); img.src = player.avatarUrl; img.onload = () => drawPlayers();
    loadedAvatars.set(player.publicId, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

function renderCharacters() {
  const panel = $('discoveryPanel'); panel.replaceChildren();
  const playerId = cycleWithoutRepeats('character-player', onlinePlayers.map(player => player.publicId));
  const player = onlinePlayers.find(item => item.publicId === playerId);
  const copy = $el('div', 'character-copy');
  copy.append($el('p', 'eyebrow', 'LIVE CHARACTER GALLERY'), $el('h3', '', `现场角色轮播 · ${onlinePlayers.length} 位`), $el('p', 'panel-description', player ? `${player.alias} 正在${player.status === 'playing' ? `挑战「${player.gameTitle || '冰雪项目'}」` : player.status === 'traveling' ? '前往下一处地点' : '漫游城市地图'}。` : '等待玩家加入现场大屏；加入后会同步角色、行进位置和挑战画面。'));
  const row = $el('div', 'character-previews live-character-previews');
  if (player) {
    const figure = $el('figure', 'character-preview active-character-preview');
    const img = $el('img', 'live-character'); img.src = player.avatarUrl; img.alt = `${player.alias} 的游览角色`;
    figure.append(img, $el('figcaption', '', player.alias)); row.append(figure);
  }
  const footer = $el('div', 'secret-note');
  footer.append($el('b', '', `${onlinePlayers.length} 位在线`), $el('span', '', '角色图片在玩家离线 24 小时后自动清理'));
  panel.append(copy, row, footer);
}

function showPanel(id, preferredPlace) {
  if (!panelIds.includes(id)) return;
  activePanel = id;
  document.querySelectorAll('.discovery-tabs [role="tab"]').forEach(button => {
    const selected = button.dataset.panel === id;
    button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
  });
  if (id === 'quest') renderQuest();
  if (id === 'story') renderStory(preferredPlace);
  if (id === 'quiz') revealQuiz(quizAnswered);
  if (id === 'characters') renderCharacters();
}

function renderMetrics(data) {
  map?.setCounts(data.places);
  $('totalVisits').textContent = number(data.total);
  $('todayVisits').textContent = number(data.todayTotal);
  $('exploredCount').textContent = `${data.places.filter(place => place.count > 0).length} / ${data.places.length}`;
  $('placeCount').textContent = data.places.length;
  const latest = data.recent?.[0];
  if (latest) {
    const key = `${latest.placeId}|${latest.at}`;
    $('latestArrival').textContent = `${mapById(latest.placeId)?.name || '一处新地点'} 刚刚迎来一位旅行者`;
    $('arrivalTime').textContent = formatTime(latest.at);
    if (latestArrivalKey && latestArrivalKey !== key) {
      $('latestArrival').classList.remove('arrival-in'); requestAnimationFrame(() => $('latestArrival').classList.add('arrival-in'));
    }
    latestArrivalKey = key;
  }
}

function renderPlayers(payload) {
  const next = Array.isArray(payload?.online) ? payload.online : [];
  const oldIds = new Set(onlinePlayers.map(player => player.publicId));
  const newPlayers = next.filter(player => !oldIds.has(player.publicId));
  onlinePlayers = next;
  const activeIds = new Set(onlinePlayers.map(player => player.publicId));
  for (const id of visualPositions.keys()) if (!activeIds.has(id)) visualPositions.delete(id);
  const playing = onlinePlayers.filter(player => player.status === 'playing');
  $('onlineCount').textContent = number(onlinePlayers.length);
  $('onlineMapLabel').textContent = `在线旅人 ${onlinePlayers.length} 位 · 地图实时同步`;
  $('connection').textContent = '实时连接';
  $('connection').parentElement.classList.toggle('has-players', onlinePlayers.length > 0);
  if (newPlayers.length) {
    const newest = newPlayers[newPlayers.length - 1];
    $('latestArrival').textContent = `${newest.alias} 加入现场漫游`;
    $('arrivalTime').textContent = formatTime(Date.now());
    $('latestArrival').classList.remove('arrival-in'); requestAnimationFrame(() => $('latestArrival').classList.add('arrival-in'));
  } else if (!onlinePlayers.length && !$('arrivalTime').textContent) $('latestArrival').textContent = '等候旅行者主动加入现场大屏';
  if (newPlayers.length || oldIds.size !== onlinePlayers.length) bags.delete('character-player');
  if (playing.length) gamePlayerIndex %= playing.length;
  else gamePlayerIndex = 0;
  renderGamePlayer(); drawPlayers();
}

function resizeOverlay() {
  const canvas = $('travelerLayer'); const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2); const w = Math.round(rect.width * dpr); const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
}

function drawPlayers(now = performance.now()) {
  if (!map) return;
  const dt = lastOverlayFrame ? Math.min(.08, (now - lastOverlayFrame) / 1000) : 1 / 60;
  lastOverlayFrame = now;
  const canvas = $('travelerLayer'); resizeOverlay();
  const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, rect.width, rect.height);
  const scale = Math.max(.82, Math.min(1.3, rect.width / 980));
  for (const player of onlinePlayers) {
    const target = player.position || mapById(player.currentPlaceId || player.targetPlaceId)?.mapPos;
    if (!target) continue;
    let world = visualPositions.get(player.publicId);
    if (!world) { world = { x: target.x, z: target.z }; visualPositions.set(player.publicId, world); }
    else {
      const catchup = 1 - Math.exp(-dt * 2.6);
      world.x += (target.x - world.x) * catchup;
      world.z += (target.z - world.z) * catchup;
      if (Math.hypot(target.x - world.x, target.z - world.z) < .6) { world.x = target.x; world.z = target.z; }
    }
    const point = map.project(world.x, world.z); const image = avatarImage(player);
    const h = 46 * scale; const w = h * .72;
    ctx.save();
    ctx.fillStyle = '#153a4b66'; ctx.beginPath(); ctx.ellipse(point.x, point.y + 2, w * .45, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
    if (image) {
      ctx.save(); roundedRect(ctx, point.x - w / 2, point.y - h, w, h, 8 * scale); ctx.drawImage(image, point.x - w / 2, point.y - h, w, h); ctx.restore();
    } else {
      ctx.fillStyle = '#f3dfb8'; ctx.beginPath(); ctx.arc(point.x, point.y - h * .65, 11 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#285663'; ctx.font = `700 ${10 * scale}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('❄', point.x, point.y - h * .56);
    }
    const label = player.alias; ctx.font = `700 ${10 * scale}px "Microsoft YaHei", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const labelWidth = ctx.measureText(label).width + 12 * scale;
    ctx.fillStyle = player.status === 'playing' ? '#c87a58' : '#f8f2e0';
    ctx.beginPath(); ctx.roundRect(point.x - labelWidth / 2, point.y - h - 18 * scale, labelWidth, 16 * scale, 7 * scale); ctx.fill();
    ctx.fillStyle = player.status === 'playing' ? '#fff9e8' : '#204b56'; ctx.fillText(label, point.x, point.y - h - 10 * scale);
    ctx.restore();
  }
}

function renderGamePlayer() {
  const playing = onlinePlayers.filter(player => player.status === 'playing');
  const empty = !playing.length;
  $('gameEmpty').hidden = !empty; $('gameScene').hidden = empty;
  if (empty) {
    $('gameEmpty').querySelector('b').textContent = '第一位挑战者即将登场';
    $('gameEmpty').querySelector('small').textContent = '加入现场大屏的玩家开始游戏后，这里会同步实时画面';
    $('gameTitle').textContent = '等待挑战开始'; $('gameSubtitle').textContent = '加入现场的游客会出现在地图与实时挑战中。';
    $('gameCategory').textContent = 'LIVE · REAL PLAYERS'; $('gameBadge').textContent = '❄'; $('gameLiveTag').textContent = '等待玩家加入'; $('gameDots').replaceChildren();
    cancelAnimationFrame(gameImageTimer); gameImageTimer = 0; return;
  }
  const player = playing[gamePlayerIndex % playing.length];
  $('gameEmpty').hidden = Boolean(gameFrameObjectUrl && gameFramePublicId === player.publicId);
  $('gameEmpty').querySelector('b').textContent = '正在连接挑战画面';
  $('gameEmpty').querySelector('small').textContent = `${player.alias} 已开始挑战，实时画面正在同步。`;
  if (gameFramePublicId !== player.publicId) $('gameScene').hidden = true;
  else $('gameScene').hidden = false;
  $('gameTitle').textContent = player.gameTitle || '冰雪挑战';
  const place = mapById(player.currentPlaceId || player.targetPlaceId);
  $('gameSubtitle').textContent = `${player.alias}${place ? ` · ${place.name}` : ''}${player.score !== null ? ` · 当前 ${player.score} 分` : ' · 正在挑战'}`;
  $('gameCategory').textContent = player.score !== null ? `LIVE CHALLENGE · ${player.score} 分` : 'LIVE CHALLENGE · 实时游戏画面';
  $('gameBadge').textContent = '●'; $('gameLiveTag').textContent = `${playing.length} 位正在挑战`;
  const dots = $('gameDots'); dots.replaceChildren();
  playing.forEach((item, index) => { const dot = $el('button', index === gamePlayerIndex ? 'active' : ''); dot.type = 'button'; dot.title = item.alias; dot.setAttribute('aria-label', `查看${item.alias}的实时挑战`); dot.addEventListener('click', () => { gamePlayerIndex = index; renderGamePlayer(); }); dots.append(dot); });
  cancelAnimationFrame(gameImageTimer); gameImageTimer = 0;
  const refresh = async () => {
    if (gameFrameBusy) { gameImageTimer = requestAnimationFrame(refresh); return; }
    const selected = onlinePlayers.filter(item => item.status === 'playing')[gamePlayerIndex];
    if (!selected) return;
    gameFrameBusy = true;
    try {
      const response = await fetch(`/api/showcase/players/${selected.publicId}/frame?t=${Date.now()}`, { cache:'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        const stillSelected = onlinePlayers.filter(item => item.status === 'playing')[gamePlayerIndex];
        if (stillSelected?.publicId === selected.publicId) {
          const nextUrl = URL.createObjectURL(blob);
          const image = $('gameScene'); image.src = nextUrl;
          await image.decode();
          if (gameFrameObjectUrl) URL.revokeObjectURL(gameFrameObjectUrl);
          gameFrameObjectUrl = nextUrl; gameFramePublicId = selected.publicId;
          image.hidden = false; $('gameEmpty').hidden = true;
        }
      }
    } catch { /* Keep the last complete frame visible during brief network delays. */ }
    finally {
      gameFrameBusy = false;
      const stillSelected = onlinePlayers.filter(item => item.status === 'playing')[gamePlayerIndex];
      if (stillSelected?.publicId === selected.publicId) gameImageTimer = requestAnimationFrame(refresh);
    }
  };
  gameImageTimer = requestAnimationFrame(refresh);
}

async function connectPlayers() {
  try {
    const response = await fetch('/api/showcase/players');
    if (!response.ok) throw new Error('presence');
    renderPlayers(await response.json());
    const stream = new EventSource('/api/showcase/stream');
    stream.addEventListener('players', event => { try { renderPlayers(JSON.parse(event.data)); } catch {} });
    stream.onopen = () => { $('connection').textContent = '实时连接'; };
    stream.onerror = () => { $('connection').textContent = '重连中'; };
  } catch { $('connection').textContent = '实时服务暂不可用'; }
}

function boot() {
  return fetch('/api/places').then(async response => {
    if (!response.ok) throw new Error('地点加载失败');
    places = (await response.json()).places;
    $('placeCount').textContent = places.length;
    try { applyMapLayout(await fetchMapLayout()); } catch { /* use the built in map layout */ }
    map = createMapView($('showcaseMap'), { venues: places, onPick: id => selectPlace(id), heroVisible: false });
    map.fit(); selectPlace(places[0]?.id, false);
    connectStats(renderMetrics, status => { if (status !== '已连接') $('connection').textContent = status; });
    void connectPlayers();
    $('zoomIn').addEventListener('click', () => map.zoomBy(1.2));
    $('zoomOut').addEventListener('click', () => map.zoomBy(1 / 1.2));
    $('fitMap').addEventListener('click', () => map.fit());
    document.querySelectorAll('.discovery-tabs [role="tab"]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
    $('cycleToggle').addEventListener('click', () => {
      autoRotate = !autoRotate; $('cycleToggle').setAttribute('aria-pressed', String(autoRotate));
      $('cycleToggle').textContent = autoRotate ? '自动轮播中 · 暂停' : '轮播已暂停 · 继续';
    });
    $('fullscreen').addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
      catch { $('fullscreen').textContent = '请使用浏览器全屏'; }
    });
    document.addEventListener('fullscreenchange', () => { $('fullscreen').innerHTML = document.fullscreenElement ? '退出全屏 <span>⤡</span>' : '进入全屏 <span>⤢</span>'; });
    window.addEventListener('resize', () => { resizeOverlay(); drawPlayers(); });
    new ResizeObserver(() => { resizeOverlay(); drawPlayers(); }).observe($('travelerLayer'));
    showPanel('quest'); setClock(); setInterval(setClock, 1000);
    panelTimer = setInterval(() => {
      if (!autoRotate || document.hidden) return;
      if (!panelBag.length) panelBag = shuffle(panelIds);
      let next = panelBag.shift();
      if (next === activePanel && panelBag.length) { panelBag.push(next); next = panelBag.shift(); }
      if (next === 'quiz') { quizIndex = cycleWithoutRepeats('quiz-index', QUIZ_QUESTIONS.map((_, index) => index)); quizAnswered = false; }
      showPanel(next);
    }, 10500);
    let last = performance.now();
    function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (!document.hidden) { map.update(dt); map.draw(); drawPlayers(now); } requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  });
}

boot().catch(error => { $('connection').textContent = error.message || '连接失败'; $('latestArrival').textContent = '实时内容暂不可用，请检查漫游服务'; });
