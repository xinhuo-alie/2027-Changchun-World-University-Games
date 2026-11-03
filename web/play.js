import { connectStats, recordVisit } from '/visit-client.js';
import { createShowcaseParticipation } from '/showcase-presence-client.js';
import { keyFigureBackground, figureCutoutHasBackground } from '/avatar-face.js';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
/**
 * 2D 云游览主控。
 *
 * 页面就两件事，代码也照着分成两块：
 *   左半边「工坊」——拍照/上传 → 抠头像 → 拼衣服，产出 cfg（形象配置）
 *   右半边「地图」——点场馆 → 小人走过去 → 弹介绍 → 进小游戏
 *
 * 两块之间只有一个数据流：cfg。左半边改它就重画，右半边拿它当小人的样子。
 * 所有画布都是现画的（没有图片素材），所以"改一下立刻看到"是免费的。
 */

import { applyMapLayout, createMapView, drawVenueIcon } from '/venues2d.js';
import { fetchMapLayout } from '/map-layout-client.js';
import { drawVenueIllustration } from '/venue-art.js';
import { createMinigameHost } from '/minigames.js';
import { createSoundscape } from '/soundscape.js';
import { createProgressStore } from '/progress.js';
import { createGuideUI } from '/guide-ui.js';
import { createMascotGuide } from '/mascot-guide.js';
import { buildPassport } from '/passport.js';
import { createQuiz } from '/quiz.js';
import {
  CREATIVE_GROUPS, CREATIVE_GENDER_OPTIONS, DEFAULT_CREATIVE, normalizeCreative,
  recommendCreativeForSport, recommendCreativeForTheme, clearCreativeDetails,
} from '/creative-config.js';
import { randomizeCreative, randomizeCompanion, getVariationSummary, createRandomSeed } from '/avatar-randomizer.js';
import { buildCreativePrompt } from '/creative-prompt.js';
import { SECRET_AVATARS, drawSecret, applySecretCreative } from '/secret-avatars.js';
import { getSecretCollection, collectSecret } from '/secret-collection.js';
import { readArtworkGallery, rememberArtwork } from '/artwork-gallery.js';
import { createPlaceGallery } from '/place-gallery.js';
import { journeyForPlace } from '/journey-flow.js';
import { QUESTS } from '/quests.js';
import { recommendItinerary } from '/itinerary.js';
import { buildBookManifest, getPageForPlace, loadBookSession, resolveAdjacentPage, saveBookSession } from '/book-navigation.js';
import { buildVisitMemorialData, clearVisitSessionStorage, createVisitSessionEpoch, VISIT_SESSION_KEY } from '/visit-session.js';
import {
  defaultConfig,
  presetConfig,
  randomConfig,
  saveConfig,
  loadConfig,
  resolveFaceImage,
  drawCharacter,
  drawCharacterAt,
  drawFacePreview,
  fitToSquare,
  removeBackground,
  keyFlatBackground,
  dropSpecks,
  keepLargestComponent,
  isSkin,
  contentBounds,
  guessFaceBox,
  clamp,
  makeFaceSticker,
  normalizeFaceFit,
  FACE_SIZE,
  PARTS,
  PALETTES,
  CATEGORY_LABEL,
  PRESETS,
  LOOKS,
  applyLook,
  outfitKey,
} from '/avatar.js';

const $ = (id) => document.getElementById(id);
let activeGalleryVenue = null;
const placeGallery = createPlaceGallery($('placeGallery'), () => {
  $('detailArt').hidden = false;
  const art = $('detailArt');
  const context = art.getContext('2d');
  context.clearRect(0, 0, art.width, art.height);
  if (activeGalleryVenue) drawVenueIllustration(context, activeGalleryVenue, 0, 0, art.width, art.height);
  $('detailArtCaption').textContent = '实景照片暂时无法加载，先看这幅地点手绘插画。';
});
// 编辑工作区的边长。取 640 而不是 384：全身照里脸只占画面一成多，
// 工作区分辨率太低，抠出来的脸放大到 256 就糊了。泛洪在 640² 上仍是几十毫秒级。
const EDITOR_SIZE = 640;
const CREATIVE_KEY = 'cc2027:creative';
const ARTWORK_KEY = 'cc2027:last-artwork';
const GENERATION_INTENT_KEY = 'cc2027:secret-generation-intent:v1';
const BONUS_STICKER_KEY='cc2027:attraction-stickers:v1';
function loadBonusStickers(){try{const values=JSON.parse(localStorage.getItem(BONUS_STICKER_KEY)||'[]');return new Set(Array.isArray(values)?values.filter(id=>['palace','film','mountainmall','nanhu','culture','century'].includes(id)):[])}catch{return new Set()}}
function loadArtworkUrl() {
  try {
    const url = localStorage.getItem(ARTWORK_KEY);
    return /^\/data\/results\/[a-f0-9-]+\.(png|jpe?g|webp)$/.test(url || '') ? url : null;
  } catch { return null; }
}
function loadCreative() {
  try {
    return normalizeCreative(JSON.parse(localStorage.getItem(CREATIVE_KEY) || '{}'));
  } catch { return normalizeCreative(DEFAULT_CREATIVE); }
}
function saveCreative() {
  state.creative.metadata = { ...(state.creative.metadata||{}), manualLocks:[...new Set(state.randomLocks)] };
  state.creative = normalizeCreative(state.creative);
  try { localStorage.setItem(CREATIVE_KEY, JSON.stringify(state.creative)); } catch { /* private browsing: keep this session usable */ }
}
const soundscape = createSoundscape();
let tourEntered = false;
let entering = null;
let visitPending = false;
let liveStats = null;
let showcasePresence;
let bookManifest = null;
let bookSession = null;
let bookNavigationBusy = false;
let generationController = null;
let activeGenerationJobId = null;
const visitEpoch = createVisitSessionEpoch();
let visitEnding = false;
let visitStartedAt = null;
let visitEndTrigger = null;

const state = {
  cfg: applyLook(defaultConfig(), LOOKS[0]),
  venues: [],
  styles: [],
  providers: [],
  providerId: null,
  styleId: 'avatar',
  creative: loadCreative(),
  workshopOpen: { advanced: false, presets: false, base: false, personality: false, visual: false, custom: false },
  workshopGroupOpen: { style: true },
  workshopMessage: '',
  randomLocks: loadCreative().metadata?.manualLocks || [],
  workshopVariationReady: false,
  pendingGeneration: (()=>{try{const value=JSON.parse(localStorage.getItem(GENERATION_INTENT_KEY)||'null');return value?.creative&&Number.isFinite(value.seed)?value:null;}catch{return null;}})(),
  generatedArtworkUrl: loadArtworkUrl(),
  tab: 'photo',
  activeId: null,
  visited: new Set(),
  medals: new Set(),
  bonusStickers: loadBonusStickers(),
  bestScores: {},
  goalieBest: 0,
  quizBest: 0,
  quizBadge: false,
  guideMode: 'relaxed',
  route: null,
  readNotes: new Set(),
  observedPlaces: new Set(),
  knowledgeSources: new Set(),
  claimedQuests: new Set(),
  gameResults: [],
  photo: null, // 见 openEditor
  pendingVenue: null,
};

/* ------------------------------------------------------------------ */
/* 进度存取                                                            */
/* ------------------------------------------------------------------ */

let progressStore = null;
let guideUI = null;
let mascotGuide = null;
function currentProgress() {
  return {
    explored: [...state.visited], medals: [...state.medals], bestScores: state.bestScores,
    goalieBest: state.goalieBest, quizBest: state.quizBest, quizBadge: state.quizBadge,
    guideMode: state.guideMode, route: state.route, readNotes: [...state.readNotes], observedPlaces: [...state.observedPlaces],
    knowledgeSources: [...state.knowledgeSources], claimedQuests: [...state.claimedQuests],
  };
}
function loadProgress() {
  progressStore = createProgressStore({
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
  }, state.venues.map((place) => place.id), state.venues.filter((place) => place.kind === 'venue').map((place) => place.id));
  const saved = progressStore.load();
  state.visited = new Set(saved.explored);
  state.medals = new Set(saved.medals);
  state.bestScores = saved.bestScores;
  state.goalieBest = saved.goalieBest;
  state.quizBest = saved.quizBest;
  state.quizBadge = saved.quizBadge;
  state.guideMode = saved.guideMode;
  state.route = saved.route;
  state.readNotes = new Set(saved.readNotes);
  state.observedPlaces = new Set(saved.observedPlaces);
  state.knowledgeSources = new Set(saved.knowledgeSources);
  state.claimedQuests = new Set(saved.claimedQuests);
}

function saveProgress() {
  if (visitEnding) return;
  progressStore?.save(currentProgress());
  guideUI?.render();
  if (state.pendingVenue) {
    renderDetailJourney(state.pendingVenue);
    if (!$('journeyContinue').hidden) renderJourneyContinue(state.pendingVenue);
  }
}

function setGuideProgress(patch) {
  if (visitEnding) return;
  if (Object.hasOwn(patch, 'guideMode')) state.guideMode = patch.guideMode;
  if (Object.hasOwn(patch, 'route')) state.route = patch.route;
  if (Object.hasOwn(patch, 'claimedQuests')) state.claimedQuests = new Set(patch.claimedQuests || []);
  if (Object.hasOwn(patch, 'route')) rebuildBookManifest();
  saveProgress();
}

function rebuildBookManifest() {
  if (!state.venues.length) return;
  const route = state.route;
  let orderedPlaceIds;
  let source;
  const completedRoute = route?.ids?.length && route.completed?.length === route.ids.length;
  if (route?.status === 'active' || route?.status === 'paused' || (completedRoute && bookSession?.source !== 'all')) {
    orderedPlaceIds = route.ids;
    source = 'route';
  } else if (bookSession?.source === 'all') {
    orderedPlaceIds = state.venues.map((place) => place.id);
    source = 'all';
  } else {
    const recommendation = recommendItinerary(state.venues, { mode: state.guideMode, time:'60' }, currentProgress());
    orderedPlaceIds = recommendation.ids;
    source = 'recommended';
  }
  const previousPage = bookSession?.currentPageId;
  bookManifest = buildBookManifest(state.venues, { orderedPlaceIds, source });
  bookSession = saveBookSession(localStorage, { ...(bookSession || {}), viewMode: bookSession?.viewMode || 'guided', currentPageId: previousPage || 'intro', orderedPlaceIds: bookManifest.orderedPlaceIds, source }, state.venues.map((place) => place.id), bookManifest);
  renderBookContents();
  syncBookNavigation();
}

function saveCurrentBookPage(pageId, placeId = null) {
  if (!bookManifest) return;
  bookSession = saveBookSession(localStorage, { ...(bookSession || {}), currentPageId: pageId, lastReadPlaceId: placeId || bookSession?.lastReadPlaceId || null }, state.venues.map((place) => place.id), bookManifest);
  syncBookNavigation();
}

function syncBookNavigation() {
  if (!bookManifest || !$('bookProgress')) return;
  const currentId = bookSession?.currentPageId;
  const placeId = currentId?.startsWith('place:') ? currentId.slice(6) : null;
  const index = bookManifest.orderedPlaceIds.indexOf(placeId);
  const total = bookManifest.orderedPlaceIds.length;
  $('bookProgress').textContent = placeId && index >= 0 ? `本次旅程 ${index + 1} / ${total} 站` : '';
  $('bookPrevious').disabled = index <= 0;
  const nextId = index >= 0 ? bookManifest.orderedPlaceIds[index + 1] : null;
  $('bookNext').hidden = !placeId || !nextId;
  $('bookRecap').hidden = !placeId || Boolean(nextId);
  if (nextId) $('bookNext').textContent = `下一页 · ${state.venues.find((place) => place.id === nextId)?.name || '下一站'} →`;
  const routeCount = bookManifest.orderedPlaceIds.length;
  if (placeId && index === routeCount - 1) $('bookNext').hidden = true;
}

/* ------------------------------------------------------------------ */
/* 左半边：预览台                                                      */
/* ------------------------------------------------------------------ */

const stage = $('stage');
const stageCtx = stage.getContext('2d');
const heroAvatar = $('heroAvatar');
const heroCtx = heroAvatar.getContext('2d');

function fitCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h, changed: true };
  }
  return { w, h, changed: false };
}

function drawStage(t) {
  const { w, h } = fitCanvas(stage, stageCtx);
  // 每帧都从绝对变换开始，不依赖上一帧留下的状态：
  // 万一某处的 save/restore 漏了对，也只会多占一个栈位，不会逐帧叠加把页面拖死
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  stageCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  stageCtx.clearRect(0, 0, w, h);
  if (state.showFace && state.cfg.face.canvas) {
    // 自检用：把贴纸脸原样放大，方便看清抠图到底抠出了什么
    const s = Math.min(w, h) * 0.92;
    stageCtx.fillStyle = '#F3F7FB';
    stageCtx.fillRect((w - s) / 2, (h - s) / 2, s, s);
    stageCtx.drawImage(state.cfg.face.canvas, (w - s) / 2, (h - s) / 2, s, s);
    const c = state.cfg.face.content;
    if (c) {
      stageCtx.strokeStyle = '#ff6b4a';
      stageCtx.lineWidth = 2;
      stageCtx.strokeRect((w - s) / 2 + (c.x / 256) * s, (h - s) / 2 + (c.y / 256) * s, (c.w / 256) * s, (c.h / 256) * s);
    }
    return;
  }
  if (state.cfg.face.kind === 'none' && !state.cfg.face.canvas && !state.cfg.figure?.canvas) {
    // 还没脸的时候画一个淡淡的空位，让人知道"这里会站一个小人"
    stageCtx.strokeStyle = 'rgba(143, 195, 230, 0.5)';
    stageCtx.setLineDash([7, 7]);
    stageCtx.lineWidth = 2;
    stageCtx.beginPath();
    stageCtx.arc(w / 2, h * 0.42, Math.min(w, h) * 0.16, 0, Math.PI * 2);
    stageCtx.stroke();
    stageCtx.setLineDash([]);
  }
  // 底部留出名字输入条的高度，不然小人的脚会被压在输入框底下
  // 留出上方空间：AI 头像的头发会往外冒一点，贴到画面顶端会被切平
  drawCharacter(stageCtx, state.cfg, { x: w * 0.08, y: h * 0.02, w: w * 0.84, h: h * 0.80 }, { t, moving: false });
}

function drawHero(t) {
  const showStylePreview = state.cfg.face.kind === 'none' && !state.cfg.face.canvas && !state.cfg.figure?.canvas;
  $('heroStylePreview').hidden = !showStylePreview;
  heroAvatar.hidden = showStylePreview;
  $('heroAvatarLabel').textContent = showStylePreview ? '角色风格示意' : '我的游览角色';
  if (showStylePreview) return;
  const { w, h } = fitCanvas(heroAvatar, heroCtx);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  heroCtx.clearRect(0, 0, w, h);
  const cfg = state.cfg.face.kind === 'none' && !state.cfg.face.canvas
    ? { ...state.cfg, face: { kind: 'preset', canvas: presetConfigCache(PRESETS[1]), skin: PRESETS[1].skin } }
    : state.cfg;
  drawCharacter(heroCtx, cfg, { x: 0, y: -h * 0.12, w, h: h * 1.13 }, { t, moving: false, ski: true });
}

function renderLooks() {
  const grid = $('lookGrid');
  if (!grid) return;
  grid.replaceChildren();
  for (const look of LOOKS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'look-card';
    button.dataset.look = look.id;
    button.style.setProperty('--look-accent', look.accent);
    button.innerHTML = `<span class="look-orb" aria-hidden="true">✦</span><b>${look.label}</b><small>${look.mood}</small>`;
    button.addEventListener('click', () => {
      state.cfg = applyLook(state.cfg, look);
      applyChange();
      renderTabBody();
    });
    button.setAttribute('aria-pressed', 'false');
    grid.appendChild(button);
  }
  syncLookSelection();
}

function syncLookSelection() {
  const grid = $('lookGrid');
  const note = $('lookNote');
  if (!grid || !note) return;
  const needsRegenerate = state.cfg.figure?.canvas && state.cfg.figure.outfitKey !== outfitKey(state.cfg);
  note.textContent = needsRegenerate ? '造型已改变，重新生成后更新整身手办' : '保留你的头像与校准位置';
  for (const button of grid.children) {
    const look = LOOKS.find((item) => item.id === button.dataset.look);
    const matches = look && Object.entries(look.parts).every(([key, value]) => state.cfg.parts[key] === value)
      && Object.entries(look.colors).every(([key, value]) => state.cfg.colors[key] === value);
    button.setAttribute('aria-pressed', String(Boolean(matches)));
  }
}

function exportPassport() {
  const passport = buildPassport(currentProgress(), state.venues);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 1080, 1440);
  bg.addColorStop(0, '#092e4c');
  bg.addColorStop(1, '#16687c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1440);
  ctx.fillStyle = '#9ee9e1';
  ctx.font = '24px "Microsoft YaHei", sans-serif';
  ctx.fillText('CHANGCHUN 2027 · 我的冰雪纪念', 72, 94);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px "Microsoft YaHei", sans-serif';
  ctx.fillText('冰雪之约，有我一份', 72, 184);
  ctx.fillStyle = '#e8f4fd';
  ctx.beginPath();
  ctx.roundRect(60, 238, 960, 850, 40);
  ctx.fill();
  ctx.fillStyle = '#d0e9f4';
  ctx.beginPath();
  ctx.ellipse(540, 930, 255, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCharacter(ctx, state.cfg, { x: 200, y: 270, w: 680, h: 710 }, { t: 0, moving: false });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f3555';
  ctx.font = 'bold 40px "Microsoft YaHei", sans-serif';
  ctx.fillText(`${state.cfg.name || '冰雪旅行者'}的冰雪分身`, 540, 1040);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
  ctx.fillText(`已探索 ${passport.explored} / ${passport.placeTotal} 个地点 · 场馆挑战奖章 ${passport.medals} / ${passport.venueTotal}`, 540, 1160);
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(153 + i * 86, 1235, 25, 0, Math.PI * 2);
    ctx.fillStyle = i < state.medals.size ? '#9ee9e1' : '#ffffff26';
    ctx.fill();
    ctx.fillStyle = i < state.medals.size ? '#0f3555' : '#bdd7e0';
    ctx.font = '20px sans-serif';
    ctx.fillText(i < state.medals.size ? '★' : '·', 153 + i * 86, 1242);
  }
  ctx.fillStyle = '#c3e5ee';
  ctx.font = '24px "Microsoft YaHei", sans-serif';
  ctx.fillText(state.quizBadge ? '冰雪知识徽章 · 已收入手册' : `知识快问快答 · 最佳 ${state.quizBest} / 5`, 540, 1305);
  ctx.font = '22px "Microsoft YaHei", sans-serif';
  ctx.fillText(`护照任务章 ${passport.claimed} / ${passport.questTotal} · ${new Date().toLocaleDateString('zh-CN')} · 仅本地生成`, 540, 1365);
  const url = canvas.toDataURL('image/png');
  const sheet = document.createElement('div');
  sheet.className = 'sheet passport-card-preview-sheet';
  const panel = document.createElement('div');
  panel.className = 'sheet-panel passport-preview';
  const image = document.createElement('img');
  image.src = url;
  image.alt = '我的冰雪纪念卡';
  const actions = document.createElement('div');
  actions.className = 'sheet-actions';
  const save = document.createElement('a');
  save.className = 'primary';
  save.href = url;
  save.download = '我的冰雪纪念卡.png';
  save.textContent = '保存纪念卡';
  const close = document.createElement('button');
  close.className = 'ghost';
  close.textContent = '继续游览';
  close.onclick = () => sheet.remove();
  actions.append(close, save);
  panel.append(image, actions);
  sheet.appendChild(panel);
  document.body.appendChild(sheet);
}

function refreshStageHint() {
  const done = state.cfg.face.kind !== 'none' || Boolean(state.cfg.face.canvas) || Boolean(state.cfg.figure?.canvas);
  $('stageHint').hidden = done;
  if (!done) {
    $('stageHint').innerHTML = photo.source
      ? '照片已就位，点<b>「生成我的冰雪角色」</b>开始制作全身形象。'
      : '先用<b>摄像头拍一张</b>或<b>上传一张单人照片</b>，再生成全身冰雪角色。';
  }
  $('faceNote').textContent = state.cfg.figure?.canvas ? '完整冰雪角色' : '等待生成角色';
  $('enterTour').disabled = !state.cfg.figure?.canvas || Boolean(entering);
}

/* ------------------------------------------------------------------ */
/* 左半边：选项卡                                                      */
/* ------------------------------------------------------------------ */

function buildTabs() {
  /*
   * AI 生成的头像自带发型，眼镜（如果有）也已经画在脸上，再叠一层矢量头发/眼镜只会打架
   * ——"配不上"就是这个意思。所以用生成头像时，这两个选项卡直接不出现，少两个坑。
   */
  state.tab = 'photo';
  const tabs = [{ id: 'photo', label: '照片' }];
  const root = $('tabs');
  root.innerHTML = '';
  for (const tab of tabs) {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.type = 'button';
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(tab.id === state.tab));
    btn.addEventListener('click', () => selectTab(tab.id));
    root.appendChild(btn);
  }
}

function selectTab(id) {
  state.tab = 'photo';
  for (const btn of document.querySelectorAll('.tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.tab === id));
  }
  renderTabBody();
}

/* ------------------------------------------------------------------ */
/* 左半边：照片 → 调 API 画成卡通头像 → 抠出人脸                        */
/* ------------------------------------------------------------------ */

/**
 * 照片页。
 *
 * 主路只有三步：上传 → 挑画风 → 生成。生成走服务端已有的 /api/generate
 * （豆包/通义/fal 任选，没配 key 自动降级到本地模拟），前端只负责轮询进度。
 * 另外保留一条"本地手动抠图"的备用路：接口挂了、或者不想等的时候还能玩。
 */
function renderPhotoTab(body) {
  const has = Boolean(photo.source);
  const importCard = document.createElement('section');
  importCard.className = 'role-import-card';
  const importHeading = document.createElement('div');
  importHeading.className = 'role-import-heading';
  importHeading.innerHTML = `<span class="role-import-step">01</span><span><b>${has ? '照片已就位' : '导入或选择角色'}</b><small>${has ? '点击生成后才会将照片发送给所选模型' : '上传照片、摄像头拍摄，或直接使用冰雪伙伴'}</small></span>`;
  importCard.appendChild(importHeading);
  const row = document.createElement('div');
  row.className = 'row role-import-actions';
  const cam = document.createElement('button');
  cam.className = 'opt';
  cam.type = 'button';
  cam.textContent = '用摄像头拍';
  cam.addEventListener('click', openCamera);
  const upload = document.createElement('button');
  upload.className = 'opt';
  upload.type = 'button';
  upload.textContent = has ? '换一张照片' : '上传照片';
  upload.addEventListener('click', () => $('fileInput').click());
  row.append(cam, upload);
  importCard.appendChild(row);

  if (has && photo.thumb) {
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = photo.thumb;
    thumb.alt = '已选照片';
    thumb.classList.add('role-photo-thumb');
    importCard.appendChild(thumb);
  }

  const guide = document.createElement('small');
  guide.className = 'role-import-guide';
  guide.textContent = has ? '建议使用单人、正面、全身清晰的照片。' : '直接试玩无需照片或生图服务。';
  importCard.appendChild(guide);
  if (state.styleId === 'avatar') {
    const preview = document.createElement('div');
    preview.className = 'figure-style-preview';
    const caption = document.createElement('div');
    caption.className = 'figure-style-copy';
    const heading = document.createElement('b');
    heading.textContent = '冰雪伙伴 · 直接试玩';
    const description = document.createElement('small');
    description.textContent = has ? '保留照片角色；也可切换为预设伙伴。' : '不上传照片、不调用图片模型，角色即刻进入地图。';
    caption.append(heading, description);
    const useReference = document.createElement('button');
    useReference.className = 'opt reference-avatar-button';
    useReference.type = 'button';
    useReference.textContent = has ? '改用冰雪伙伴' : '使用这位角色';
    useReference.addEventListener('click', () => useReferenceCharacter(useReference));
    caption.appendChild(useReference);
    preview.append(caption);
    importCard.appendChild(preview);
    if (state.generatedArtworkUrl) {
      const artwork = document.createElement('div');
      artwork.className = 'generated-artwork generated-artwork-link';
      const info = document.createElement('div');
      const heading = document.createElement('b');
      heading.textContent = '已生成的角色';
      const hint = document.createElement('small');
      hint.textContent = '作品已显示在左侧预览，可调整设定后重新生成。';
      const open = document.createElement('a');
      open.href = state.generatedArtworkUrl;
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      open.textContent = '查看原图 ↗';
      const useGenerated = document.createElement('button');
      useGenerated.className = 'opt reference-avatar-button';
      useGenerated.type = 'button';
      useGenerated.textContent = '使用这位角色';
      useGenerated.addEventListener('click', async () => {
        useGenerated.disabled = true;
        useGenerated.textContent = '正在准备角色…';
        try {
          await applyGeneratedFigure(state.generatedArtworkUrl);
          await enterTour();
        } catch {
          useGenerated.disabled = false;
          useGenerated.textContent = '使用这位角色';
          $('departureNote').textContent = '已生成的角色载入失败，请重新生成后再试。';
        }
      });
      info.append(heading, hint, open, useGenerated);
      artwork.append(info);
      importCard.appendChild(artwork);
    }
    const galleryItems=readArtworkGallery(localStorage,state.generatedArtworkUrl);
    const gallery=document.createElement('details');gallery.className='role-history';gallery.open=galleryItems.length>0;
    const gallerySummary=document.createElement('summary');gallerySummary.textContent=`历史角色图库 · ${galleryItems.length}`;
    const galleryGrid=document.createElement('div');galleryGrid.className='role-history-grid';
    if(galleryItems.length){
      for(const item of galleryItems){
        const card=document.createElement('article');card.className='role-history-card';
        const image=document.createElement('img');image.src=item.url;image.alt=`${item.name||'历史角色'}预览`;image.loading='lazy';
        const name=document.createElement('span');name.textContent=item.name||'历史角色';
        const choose=document.createElement('button');choose.type='button';choose.className='opt';choose.textContent='设为本次角色';
        choose.addEventListener('click',async()=>{
          choose.disabled=true;choose.textContent='正在载入…';
          const previousUrl=state.generatedArtworkUrl;
          try{
            if(item.name){state.cfg.name=item.name;$('nameInput').value=item.name;saveConfig(state.cfg);}
            await applyGeneratedFigure(item.url);
            state.generatedArtworkUrl=item.url;
            try{localStorage.setItem(ARTWORK_KEY,item.url);}catch{/* The figure remains usable for this visit. */}
            renderTabBody();
            await enterTour();
          }catch{
            state.generatedArtworkUrl=previousUrl;
            choose.disabled=false;choose.textContent='设为本次角色';
            $('departureNote').textContent='这张历史形象载入失败，请换一张或重新生成。';
          }
        });
        card.append(image,name,choose);galleryGrid.appendChild(card);
      }
    }else{
      const empty=document.createElement('p');empty.className='role-history-empty';empty.textContent='生成过的角色会保存在这里，结束游览后仍可再次使用。';galleryGrid.appendChild(empty);
    }
    gallery.append(gallerySummary,galleryGrid);importCard.appendChild(gallery);
  }
  const photoControls = $('rolePhotoControls');
  if (photoControls) {
    photoControls.replaceChildren(importCard);
    renderGenerationControls(photoControls, has);
  } else {
    body.appendChild(importCard);
    renderGenerationControls(body, has);
  }
  if (state.styleId === 'avatar') renderCreativeControls(body);
}

function renderGenerationControls(body, has) {
  const generation = document.createElement('section');
  generation.className = 'workshop-generation';
  generation.setAttribute('aria-label', '生成我的冰雪角色');
  if (state.providers.length) {
    const label = document.createElement('label');label.className = 'field model-choice';
    const title = document.createElement('span');title.textContent = '生成模型';
    const select = document.createElement('select');select.setAttribute('aria-label','生成模型');
    for (const provider of state.providers) {
      if (!['doubao', state.providerId].includes(provider.id)) continue;
      const option = document.createElement('option');option.value = provider.id;
      option.textContent = provider.label + (provider.available ? '' : '（未配置）');option.disabled = !provider.available;
      select.append(option);
    }
    select.value = state.providerId;
    select.disabled = Boolean(state.generating);
    select.addEventListener('change', () => { if(state.providerId!==select.value)invalidatePendingGeneration();state.providerId = select.value; });
    label.append(title,select);generation.append(label);
  }
    const gen = document.createElement('button');
  gen.className = 'primary wide';
  gen.type = 'button';
  gen.disabled = !has;
  gen.textContent = has ? '✦ 生成我的冰雪角色' : '先上传一张照片';
  gen.addEventListener('click', () => {
    startGenerate().catch(reportGenerateError);
  });
  generation.appendChild(gen);

  const bar = document.createElement('div');
  bar.className = 'gen-bar';
  bar.id = 'genBar';
  bar.hidden = true;
  const fill = document.createElement('div');
  fill.className = 'gen-fill';
  fill.id = 'genFill';
  bar.appendChild(fill);
  generation.appendChild(bar);

  const status = document.createElement('p');
  status.className = 'note';
  status.id = 'genNote';
  status.textContent = '生成后会直接用完整角色游览场馆、参加小游戏。等待时也可以先看看场馆。';
  generation.appendChild(status);

  const clear = document.createElement('button');
  clear.className = 'opt';
  clear.type = 'button';
  clear.textContent = '清空重做';
  clear.addEventListener('click', () => {
    state.cfg = defaultConfig();
    state.generatedArtworkUrl = null;
    try { localStorage.removeItem(ARTWORK_KEY); } catch { /* private browsing */ }
    void useReferenceCharacter(clear);
  });
  clear.className = 'opt workshop-clear';
  const clearWrap = document.createElement('div'); clearWrap.className = 'workshop-clear-wrap'; clearWrap.appendChild(clear);
  generation.appendChild(clearWrap);
  body.appendChild(generation);
}

async function useReferenceCharacter(button) {
  if (state.loadingReference) return;
  state.loadingReference = true;
  button.disabled = true;
  button.textContent = '正在准备角色…';
  try {
    const figure = await createReferenceFigure();
    state.cfg.face = defaultConfig().face;
    state.cfg.figure = { canvas: figure, outfitKey: outfitKey(state.cfg) };
    state.cfg.name = state.cfg.name || '雪道伙伴';
    $('nameInput').value = state.cfg.name;
    tourEntered = false;
    showcasePresence?.tourEnded();
    map?.setHeroVisible(false);
    applyChange();
    $('departureNote').textContent = '已使用风格参考人物，无需照片或生图 API。点击「带我去游览」即可出发。';
    renderTabBody();
    $('enterTour').focus();
  } catch {
    button.disabled = false;
    button.textContent = '重新载入参考角色';
    $('departureNote').textContent = '参考人物载入失败，请检查网络后重试。';
  } finally {
    state.loadingReference = false;
  }
}

async function createReferenceFigure() {
  const image = await loadImage('/assets/ski-figurine-style-preview.png');
  const scale = Math.min(1, 640 / Math.max(image.width, image.height));
  const figure = document.createElement('canvas');
  figure.width = Math.max(1, Math.round(image.width * scale));
  figure.height = Math.max(1, Math.round(image.height * scale));
  figure.getContext('2d').drawImage(image, 0, 0, figure.width, figure.height);
  return figure;
}

function renderCreativeControls(body) {
  const identity = document.createElement('div');
  identity.className = 'identity-promise';
  identity.innerHTML = '<span>i</span><div><b>关于照片</b><small>提示词会参考脸部辨识特征；角色性别以这里的选择为准。生成效果会因照片与模型而变化。</small></div>';
  body.appendChild(identity);
  const heading = document.createElement('div');
  heading.className = 'workshop-heading';
  heading.innerHTML = '<div><span class="workshop-kicker">YOUR AVATAR</span><h3>异想角色创造实验室</h3><p>打造一个既像你、又拥有奇幻想象力的专属角色。</p></div>';
  body.appendChild(heading);

  const advanced=document.createElement('details'); advanced.className='workshop-section workshop-advanced'; advanced.open=Boolean(state.workshopOpen.advanced);
  advanced.addEventListener('toggle',()=>{state.workshopOpen.advanced=advanced.open;});
  const advancedSummary=document.createElement('summary'); advancedSummary.innerHTML='<span><b>其他可调整细节</b><small>角色类型、服装、伙伴与精细设定</small></span><i aria-hidden="true">⌄</i>';
  advanced.appendChild(advancedSummary);
  const addSelect=(key,label,items,value,parent=advanced)=>{const wrap=document.createElement('label');wrap.className='workshop-quick-pick';const caption=document.createElement('span');caption.textContent=label;const select=document.createElement('select');select.setAttribute('aria-label',label);for(const item of items){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;select.append(option);}select.value=value;select.addEventListener('change',()=>{state.creative=key==='theme'?recommendCreativeForTheme(state.creative,select.value):{...state.creative,[key]:select.value};markCreativeManual(key);invalidatePendingGeneration();state.workshopVariationReady=false;saveCreative();renderTabBody();});wrap.append(caption,select);parent.append(wrap);};
  const primaryOptions=document.createElement('div');primaryOptions.className='workshop-quick-picks workshop-primary-options';body.appendChild(primaryOptions);
  addSelect('stylePreset','角色风格基调',[{id:'event-showcase',label:'亲和展示'},{id:'fantasy-explorer',label:'奇幻探索'}],state.creative.stylePreset,primaryOptions);
  addSelect('world','奇幻世界',CREATIVE_GROUPS.world,state.creative.world,primaryOptions);
  addSelect('faceStyle','面部风格',[{id:'natural-stylized',label:'自然亲和'},{id:'refined-3d',label:'细腻五官'},{id:'animation',label:'生动表情'}],state.creative.faceStyle,primaryOptions);
  addSelect('style','画风',CREATIVE_GROUPS.style,state.creative.style,primaryOptions);
  addSelect('theme','角色主题',CREATIVE_GROUPS.theme,state.creative.theme,primaryOptions);
  const genderField=document.createElement('fieldset');genderField.className='workshop-gender';
  const genderLegend=document.createElement('legend');genderLegend.textContent='角色性别';
  const genderOptions=document.createElement('div');genderOptions.className='workshop-gender-options';
  for(const item of CREATIVE_GENDER_OPTIONS){const label=document.createElement('label');const input=document.createElement('input');input.type='radio';input.name='creativeGender';input.value=item.id;input.checked=state.creative.gender===item.id;input.addEventListener('change',()=>{state.creative.gender=item.id;markCreativeManual('gender');state.workshopVariationReady=false;invalidatePendingGeneration();saveCreative();renderTabBody();});const text=document.createElement('span');text.textContent=item.label;label.append(input,text);genderOptions.appendChild(label);}
  const genderNote=document.createElement('small');genderNote.textContent='随机会在生成前确定为男或女，并写入明确限制。';genderField.append(genderLegend,genderOptions,genderNote);body.appendChild(genderField);
  const blueprintControls=document.createElement('div'); blueprintControls.className='workshop-quick-picks workshop-fantasy-primary';
  const levelWrap=document.createElement('label');levelWrap.className='workshop-quick-pick workshop-fantasy-level';const levelCaption=document.createElement('span');levelCaption.textContent=`整体奇幻程度 ${state.creative.fantasyLevel}/5`;const slider=document.createElement('input');slider.type='range';slider.min='1';slider.max='5';slider.value=state.creative.fantasyLevel;slider.setAttribute('aria-label','整体奇幻程度');slider.addEventListener('input',()=>{state.creative.fantasyLevel=Number(slider.value);levelCaption.textContent=`整体奇幻程度 ${slider.value}/5`;markCreativeManual('fantasyLevel');saveCreative();});slider.addEventListener('change',()=>{invalidatePendingGeneration();state.workshopVariationReady=false;promptText.textContent='奇幻程度已调整，点击随机按钮重新生成匹配的提示词。';});levelWrap.append(levelCaption,slider);blueprintControls.append(levelWrap);body.appendChild(blueprintControls);
  const randomPrompt=document.createElement('section');randomPrompt.className='workshop-random-prompt';
  const randomButton=document.createElement('button');randomButton.type='button';randomButton.className='workshop-action workshop-random-prompt-button';randomButton.textContent='🎲 随机生成提示词';randomButton.dataset.workshopFocus='random-prompt';
  const promptText=document.createElement('pre');promptText.className='workshop-random-prompt-text';promptText.setAttribute('aria-live','polite');promptText.textContent=state.workshopVariationReady?buildCreativePrompt(state.creative):'点击按钮，随机组合角色细节并查看本次生成提示词。';
  randomButton.addEventListener('click',()=>{invalidatePendingGeneration();const before=state.creative;state.creative=randomizeCreative(before,{mode:'details-only',lockKeys:[...new Set(['style','theme','sport','outfit',...state.randomLocks])],seed:createDesignSeed()});state.workshopVariationReady=true;state.workshopMessage=getVariationSummary(before,state.creative);saveCreative();renderTabBody();});
  randomPrompt.append(randomButton,promptText);body.appendChild(randomPrompt);
  const companionPanel=document.createElement('section');companionPanel.className='workshop-companion';
  const companionToggle=document.createElement('label');companionToggle.className='workshop-companion-toggle';const companionCheck=document.createElement('input');companionCheck.type='checkbox';companionCheck.checked=state.creative.companion.enabled;const companionText=document.createElement('span');companionText.textContent=companionCheck.checked?'添加一个幻想伙伴':'不添加伙伴（默认）';companionCheck.addEventListener('change',()=>{invalidatePendingGeneration();state.creative.companion=companionCheck.checked?{enabled:true,locked:false,type:null,archetype:null,blueprint:null}:{enabled:false,locked:false,type:null,archetype:null,blueprint:null};markCreativeManual('companion');saveCreative();renderTabBody();});companionToggle.append(companionCheck,companionText);companionPanel.append(companionToggle);
  if(state.creative.companion.enabled){const typeLabel=document.createElement('label');typeLabel.className='workshop-quick-pick';const typeCaption=document.createElement('span');typeCaption.textContent='伙伴类型';const typeSelect=document.createElement('select');typeSelect.setAttribute('aria-label','伙伴类型');typeSelect.innerHTML='<option value="">请选择伙伴类型</option>'+['机械生命','毛绒异兽','液态玩偶','水晶生物','星云幼体','折纸精灵','影子伙伴','悬浮符号生命','奇幻昆虫/多足萌怪','混合型未知生命'].map((name)=>`<option value="${name}">${name}</option>`).join('');typeSelect.value=state.creative.companion.type||'';typeSelect.addEventListener('change',()=>{invalidatePendingGeneration();const type=typeSelect.value;state.creative.companion={...state.creative.companion,type,blueprint:type?randomizeCompanion(type,createDesignSeed()):null};state.creative.companion.archetype=state.creative.companion.blueprint?.archetype||null;markCreativeManual('companion');saveCreative();renderTabBody();});typeLabel.append(typeCaption,typeSelect);companionPanel.append(typeLabel);if(!state.creative.companion.type){const empty=document.createElement('p');empty.className='workshop-quick-summary';empty.textContent='已开启伙伴功能，请选择伙伴类型；当前没有伙伴蓝图。';companionPanel.append(empty);}else{const controls=document.createElement('div');controls.className='workshop-actions';const reroll=document.createElement('button');reroll.type='button';reroll.className='workshop-action';reroll.textContent='随机伙伴';reroll.addEventListener('click',()=>{const type=state.creative.companion.type;state.creative.companion={...state.creative.companion,blueprint:randomizeCompanion(type,createDesignSeed())};state.creative.companion.archetype=state.creative.companion.blueprint.archetype;markCreativeManual('companion');invalidatePendingGeneration();saveCreative();renderTabBody();});const lock=document.createElement('button');lock.type='button';lock.className='workshop-action';lock.textContent=state.creative.companion.locked?'已锁定伙伴':'锁定伙伴';lock.setAttribute('aria-pressed',String(state.creative.companion.locked));lock.addEventListener('click',()=>{state.creative.companion.locked=!state.creative.companion.locked;saveCreative();renderTabBody();});controls.append(reroll,lock);companionPanel.append(controls);const bp=document.createElement('p');bp.className='workshop-quick-summary';bp.textContent=`文字蓝图预览：${state.creative.companion.blueprint?.silhouette||''} · ${state.creative.companion.blueprint?.material||''} · ${state.creative.companion.blueprint?.signatureFeature||''}`;companionPanel.append(bp);}}
  advanced.appendChild(companionPanel);
  const promptPreview=document.createElement('details');promptPreview.className='workshop-section workshop-prompt-preview';const previewSummary=document.createElement('summary');previewSummary.textContent='完整生图蓝图预览（可选）';const previewBody=document.createElement('div');previewBody.className='workshop-prompt-preview-body';const previewButton=document.createElement('button');previewButton.type='button';previewButton.className='workshop-action';previewButton.textContent='查看本次角色蓝图';const previewText=document.createElement('pre');previewText.className='workshop-prompt-text';previewText.textContent='查看当前选择将如何组合；预览不会调用图片模型。';previewButton.addEventListener('click',async()=>{previewButton.disabled=true;previewButton.textContent='正在编译…';try{if(!state.pendingGeneration||state.pendingGeneration.secretRolled!==true){state.pendingGeneration=createPendingGeneration();persistPendingGeneration();}const pending=state.pendingGeneration;const creative=normalizeCreative(pending.creative);let prompt=buildCreativePrompt(creative);let providerLabel=pending.provider||'当前默认模型';let fallback=false;try{const response=await fetch('/api/creative-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:pending.provider||undefined,creative})});if(response.ok){const result=await response.json();prompt=result.prompt;providerLabel=result.provider||providerLabel;}else if(response.status===404){fallback=true;}else{const result=await response.json().catch(()=>({}));throw new Error(result.error||`服务返回 ${response.status}`);}}catch(error){if(error instanceof TypeError)fallback=true;else throw error;}previewText.textContent=[fallback?'服务端蓝图接口暂不可用，以下为本地工坊蓝图文本（生图请求仍会使用服务端完整提示词）。':'本次生成将使用以下固定蓝图。',`模型：${providerLabel}`,pending.secretId?'✦ 本次抽中隐藏珍藏款，生成后会加入角色收藏。':'本次为常规角色；隐藏款仅在每次新生成时按概率抽取。','',prompt].join(String.fromCharCode(10));}catch(error){previewText.textContent=`预览失败：${error.message}`;}finally{previewButton.disabled=false;previewButton.textContent='重新查看蓝图';}});previewBody.append(previewButton,previewText);promptPreview.append(previewSummary,previewBody);advanced.appendChild(promptPreview);

  const quick = document.createElement('div'); quick.className = 'workshop-quick-picks';
  for (const [key,label] of [['sport','角色类型'],['outfit','服装']]) {
    const wrapper=document.createElement('label'); wrapper.className='workshop-quick-pick';
    const caption=document.createElement('span'); caption.textContent=label;
    const select=document.createElement('select'); select.setAttribute('aria-label',label);
    for(const item of CREATIVE_GROUPS[key]){ const option=document.createElement('option'); option.value=item.id; option.textContent=item.label; select.appendChild(option); }
    select.value=state.creative[key];
    select.addEventListener('change',()=>{ invalidatePendingGeneration(); state.workshopMessage=''; state.creative=key==='theme'?recommendCreativeForTheme(state.creative,select.value):key==='sport'?recommendCreativeForSport(state.creative,select.value):{...state.creative,[key]:select.value}; markCreativeManual(key); state.workshopVariationReady=false; saveCreative(); renderTabBody(); });
    wrapper.append(caption,select); quick.appendChild(wrapper);
  }
  const legacyHeading=document.createElement('p');legacyHeading.className='workshop-quick-summary';legacyHeading.textContent='旧工坊选项保留为辅助参考；与上方奇幻世界和角色基调冲突时，以新工坊为准。';advanced.append(legacyHeading,quick);
  addSelect('silhouette','主体轮廓',[{id:'dynamic-elegant',label:'灵动优雅'},{id:'layered-orbit',label:'层叠环绕'},{id:'soft-organic',label:'柔和有机'},{id:'angular-paper',label:'折面几何'},{id:'flowing-asymmetric',label:'流动不对称'},{id:'compact-heroic',label:'紧凑英雄感'}],state.creative.silhouette);
  addSelect('bodyStructure','身体结构',[{id:'human-proportions',label:'自然人体比例'},{id:'athletic-natural',label:'轻运动体态'},{id:'soft-stylized',label:'柔和卡通比例'}],state.creative.bodyStructure);
  addSelect('faceDesign','面部设计',[{id:'natural-friendly',label:'自然亲和'},{id:'clear-glasses',label:'保留眼镜特征'},{id:'soft-lighting',label:'柔和面部光影'}],state.creative.faceDesign);
  addSelect('power','核心能力',[{id:'soft-aurora-aura',label:'柔和极光'},{id:'gravity-orbit',label:'重力环绕'},{id:'crystal-resonance',label:'水晶共鸣'},{id:'time-ripple',label:'时间涟漪'},{id:'shadow-ribbon',label:'影子缎带'},{id:'nebula-glow',label:'星云微光'}],state.creative.power);
  const identityNote=document.createElement('p');identityNote.className='workshop-quick-summary';identityNote.textContent='当前生图服务均需要参考照片，真人幻想化可用；完全原创非人形模式会在服务支持文生图后开放。';advanced.appendChild(identityNote);
  renderCreativeOptionGroup(advanced,'palette');
  renderCreativeOptionGroup(advanced,'accessory');

  const customSection=document.createElement('label'); customSection.className='creative-custom workshop-custom';
  const customTitle=document.createElement('span'); customTitle.innerHTML='<b>再加一个特别元素</b><small>只写最想保留的一点，其他造型由工坊自动协调。</small>';
  const custom=document.createElement('textarea'); custom.maxLength=120; custom.rows=2; custom.placeholder='例如：披风边缘像一圈细小星轨'; custom.value=state.creative.details;
  custom.addEventListener('input',()=>{invalidatePendingGeneration();state.creative.details=custom.value.slice(0,120);markCreativeManual('details');state.workshopVariationReady=false;saveCreative();});
  customSection.append(customTitle,custom); advanced.appendChild(customSection);

  const actions=document.createElement('div'); actions.className='workshop-actions';
  const reset=document.createElement('button'); reset.type='button'; reset.className='workshop-action'; reset.textContent='恢复默认';
  reset.addEventListener('click',()=>{invalidatePendingGeneration();state.randomLocks=[];state.creative=normalizeCreative(DEFAULT_CREATIVE);state.workshopVariationReady=false;saveCreative();renderTabBody();});
  const clear=document.createElement('button'); clear.type='button'; clear.className='workshop-action'; clear.textContent='清空自定义元素';
  clear.addEventListener('click',()=>{invalidatePendingGeneration();state.creative=clearCreativeDetails(state.creative);state.workshopVariationReady=false;saveCreative();renderTabBody();});
  actions.append(reset,clear); advanced.appendChild(actions);

  const selected=summarizeCreative(state.creative);
  const summary=document.createElement('div'); summary.className='workshop-summary';
  summary.innerHTML=`<b>当前搭配</b><p>${escapeHtml(selected.join(' · '))}</p><small>画风决定画面表现；主题、角色类型与服装决定角色造型。面部倾向不会覆盖画风。</small>`;
  advanced.appendChild(summary);
  const status=document.createElement('p'); status.className='workshop-status'; status.setAttribute('role','status'); status.textContent=state.workshopMessage||'';
  advanced.appendChild(status); body.appendChild(advanced);
}

function createDesignSeed() {
  return createRandomSeed();
}

function markCreativeManual(key) { state.randomLocks=[...new Set([...state.randomLocks,key])]; const {randomSeed,...metadata}=state.creative.metadata||{}; state.creative.metadata={...metadata,manualLocks:state.randomLocks}; }

function invalidatePendingGeneration() {
  state.pendingGeneration = null;
  try { localStorage.removeItem(GENERATION_INTENT_KEY); } catch { /* optional persistence */ }
}

function createPendingGeneration() {
  const collection=getSecretCollection();
  const secret=drawSecret({excludedIds:collection.items.map((item)=>item.id)});
  const seed=Number.isFinite(state.creative.metadata?.randomSeed)?state.creative.metadata.randomSeed:createDesignSeed();
  const base=normalizeCreative({...state.creative,metadata:{...(state.creative.metadata||{}),randomSeed:seed}});
  state.workshopVariationReady=false;
  state.creative=base;
  saveCreative();
  return {seed,secretId:secret?.id||null,secretRolled:true,provider:state.providerId||null,creative:secret?applySecretCreative(base,secret):base};
}

function persistPendingGeneration() {
  try { localStorage.setItem(GENERATION_INTENT_KEY,JSON.stringify(state.pendingGeneration)); } catch { /* optional persistence */ }
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }

function summarizeCreative(creative) {
  const labels = [CREATIVE_GENDER_OPTIONS.find((option) => option.id === creative.gender)?.label || '随机'];
  for (const key of ['style','theme','sport','outfit','palette']) {
    const item=CREATIVE_GROUPS[key].find((option)=>option.id===creative[key]); if(item)labels.push(item.label);
  }
  for(const id of creative.accessories.slice(0,2)){const item=CREATIVE_GROUPS.accessory.find((option)=>option.id===id);if(item&&id!=='none')labels.push(item.label);}
  if (creative.details) labels.push('自定义细节');
  return labels;
}

function renderCreativeOptionGroup(parent, key) {
  const options = CREATIVE_GROUPS[key];
  const multi = key === 'accessory' || key === 'effect';
  const selectedIds = key === 'accessory' ? state.creative.accessories : key === 'effect' ? state.creative.effects : [state.creative[key]];
  const block = document.createElement('details'); block.className = 'workshop-option-group';
  block.open = Boolean(state.workshopGroupOpen[key]);
  block.addEventListener('toggle', () => { state.workshopGroupOpen[key] = block.open; });
  const head = document.createElement('summary'); head.className = 'workshop-option-head';
  const label = ({ style:'艺术风格',theme:'角色主题',sport:'角色类型',outfit:'服装',hairstyle:'发型',headwear:'头部装饰',accessory:'配饰',expression:'表情',pose:'动作与姿势',scene:'场景氛围',palette:'主色调',material:'材质质感',effect:'特效与氛围',composition:'镜头与构图' })[key];
  const chosenOptions = selectedIds.map((id) => options.find((item) => item.id === id)?.label).filter(Boolean);
  const selectionSummary = multi
    ? `已选 ${selectedIds.filter((id) => id !== 'none').length}/2${chosenOptions.length ? ` · ${chosenOptions.join('、')}` : ''}`
    : chosenOptions[0] || '请选择';
  head.innerHTML = `<span><b>${label}</b><small>${escapeHtml(selectionSummary)}</small></span><i aria-hidden="true">⌄</i>`;
  block.appendChild(head);
  const grid = document.createElement('div'); grid.className = `workshop-options${multi ? ' is-multi' : ''}`;
  for (const option of options) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'workshop-option';
    button.dataset.workshopFocus = `option:${key}:${option.id}`;
    const chosen = selectedIds.includes(option.id); button.setAttribute('aria-pressed', String(chosen));
    button.innerHTML = `<span class="workshop-option-check" aria-hidden="true">${chosen ? '✓' : '+'}</span><b>${escapeHtml(option.label)}</b><small>${escapeHtml(option.description)}</small>`;
    button.addEventListener('click', () => {
      state.workshopMessage = '';
      invalidatePendingGeneration();
      if (!multi) {
        state.workshopVariationReady=false;
        if (key === 'sport') state.creative = recommendCreativeForSport(state.creative, option.id);
        else state.creative[key] = option.id;
        markCreativeManual(key);
      } else {
        state.workshopVariationReady=false;
        const field = key === 'accessory' ? 'accessories' : 'effects';
        let values = [...state.creative[field]];
        if (option.id === 'none') values = chosen ? [] : ['none'];
        else {
          values = values.filter((id) => id !== 'none');
          values = chosen ? values.filter((id) => id !== option.id) : values;
          if (!chosen && values.length >= 2) {
            state.workshopMessage = `最多选择 2 项${key === 'accessory' ? '随身小物' : '特效'}，请先取消一项。`;
            saveCreative(); renderTabBody(); return;
          }
          if (!chosen) values.push(option.id);
        }
        state.creative[field] = values;
        markCreativeManual(field);
      }
      saveCreative(); renderTabBody();
    });
    grid.appendChild(button);
  }
  block.appendChild(grid); parent.appendChild(block);
}

function setGenStatus(text, progress) {
  const note = $('genNote');
  if (note) note.textContent = text;
  const bar = $('genBar');
  if (!bar) return;
  bar.hidden = progress === undefined;
  const fill = $('genFill');
  if (fill && progress !== undefined) fill.style.width = `${Math.round(progress * 100)}%`;
}

async function startGenerate() {
  if (state.generating) return;
  if (state.pendingGeneration && ['style','theme','sport','outfit','gender','details'].some((key) => state.pendingGeneration.creative?.[key] !== state.creative?.[key])) {
    invalidatePendingGeneration();
  }
  state.generating = true;
  try {
    if (!state.pendingGeneration || state.pendingGeneration.secretRolled!==true) {
      state.pendingGeneration=createPendingGeneration();
      persistPendingGeneration();
    }
    await runGenerate();
  } finally {
    state.generating = false;
  }
}

async function runGenerate() {
  if (!photo.source) return;
  const generation = visitEpoch.current();
  generationController = new AbortController();
  const signal = generationController.signal;
  const isCurrentVisit = () => visitEpoch.isCurrent(generation) && !visitEnding && !signal.aborted;
  const selectedOutfit = { parts: { ...state.cfg.parts }, colors: { ...state.cfg.colors } };
  const requestedCreative = { ...state.pendingGeneration.creative };
  const requestedProvider = state.pendingGeneration?.provider || state.providerId;
  setGenStatus('正在压缩照片…', 0.06);
  const image = await downscaleToDataUrl(photo.source, 1024, 'image/jpeg', 0.92);
  if (!isCurrentVisit()) return;

  setGenStatus('已提交，等模型接单…', 0.15);
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, styleId: 'avatar', purpose: 'figurine', provider: requestedProvider || undefined, outfit: selectedOutfit, creative: requestedCreative }),
  });
  if (!isCurrentVisit()) return;
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `服务返回 ${res.status}`);
  }
  const { jobId } = await res.json();
  activeGenerationJobId = jobId;
  if (!isCurrentVisit()) {
    void fetch(`/api/jobs/${jobId}`, { method:'DELETE', keepalive:true }).catch(() => {});
    activeGenerationJobId = null;
    return;
  }

  // 生图很慢，只能轮询。界面上的进度条是"阶段感"，不是真实百分比——
  // 与其给一个乱跳的假数字，不如告诉用户现在卡在哪一步
  const startedAt = Date.now();
  for (;;) {
    await sleep(1500);
    if (!isCurrentVisit()) return;
    if (Date.now() - startedAt > 6 * 60 * 1000) throw new Error('等太久了，等会儿再试一次');
    const response = await fetch(`/api/jobs/${jobId}`, { signal });
    if (!isCurrentVisit()) return;
    const job = await response.json();
    if (job.status === 'succeeded' && job.resultUrl) {
      setGenStatus('画好了，正在整理完整角色…', 0.92);
      await applyGeneratedFigure(job.resultUrl, { isCurrentVisit });
      if (!isCurrentVisit()) return;
      state.generatedArtworkUrl = job.resultUrl;
      try { localStorage.setItem(ARTWORK_KEY, job.resultUrl); } catch { /* private browsing */ }
      rememberArtwork(localStorage,job.resultUrl,{name:state.cfg.name||'我的角色'});
      if(state.pendingGeneration?.secretId){
        const secret=SECRET_AVATARS.find(x=>x.id===state.pendingGeneration.secretId);
        if(secret){
          const previousCollection=getSecretCollection();
          const alreadyOwned=previousCollection.items.some((item)=>item.id===secret.id);
          const beforeCount=SECRET_AVATARS.filter((item)=>previousCollection.items.some((owned)=>owned.id===item.id)).length;
          collectSecret(secret,{artworkUrl:job.resultUrl,seed:state.pendingGeneration.seed});
          if(!alreadyOwned){state.discoveredSecret=secret; mascotGuide?.notify('secret_unlocked',{title:secret.title}); showSecretReveal(secret,job.resultUrl,{milestoneCount:beforeCount+1});}
        }
      }
      state.pendingGeneration=null; try{localStorage.removeItem(GENERATION_INTENT_KEY);}catch{/* optional persistence */}
      activeGenerationJobId = null;
      renderTabBody();
      mascotGuide?.notify('avatar');
      return;
    }
    if (job.status === 'failed') { activeGenerationJobId = null; throw new Error(job.error || '生成失败'); }
    if (job.status === 'queued') {
      setGenStatus(`排队中${job.queuePosition ? ` · 前面还有 ${job.queuePosition} 个` : ''}…`, 0.25);
    } else {
      // 把"已经等了多久"写出来：干等最难受，有数字反而踏实
      const waited = Math.round((Date.now() - startedAt) / 1000);
      setGenStatus(`模型正在画…已等 ${waited} 秒（通常 10~20 秒）`, 0.55);
    }
  }
}

function reportGenerateError(error) {
  if (visitEnding || error?.name === 'AbortError') return;
  const backgroundError = /场景或地面/.test(error.message);
  setGenStatus(`生成没成功：${error.message}。${backgroundError ? '这张图不会用于角色预览，请点击重新生成。' : '请稍后重试，或换一张人物轮廓清晰的照片。'}`, undefined);
  mascotGuide?.notify('avatar_generate_failed', {}, { force: true });
}

function showSecretReveal(secret, artworkUrl = state.generatedArtworkUrl, {milestoneCount=0}={}) {
  const existing=document.getElementById('secretReveal'); existing?.remove();
  const rarity=secret.rarity||'rare';
  const dialog=document.createElement('dialog'); dialog.id='secretReveal'; dialog.className=`secret-reveal rarity-${rarity}`; dialog.dataset.soundSlot=`secret-${rarity}-reveal`;
  if(/^\/data\/results\/[a-f0-9-]+\.(png|jpe?g|webp)$/i.test(artworkUrl||'')){
    const artwork=document.createElement('img'); artwork.src=artworkUrl; artwork.alt=`${secret.title}角色作品`; dialog.append(artwork);
  }
  const title=document.createElement('h2'); title.textContent=rarity==='legendary'?`传说降临 · ${secret.title}`:(secret.revealTitle||`隐藏款揭晓 · ${secret.title}`);
  const rarityLabel=document.createElement('span'); rarityLabel.className=`secret-reveal-rarity rarity-${rarity}`; rarityLabel.textContent=rarity==='legendary'?'LEGENDARY':rarity.toUpperCase();
  const copy=document.createElement('p'); copy.textContent=secret.tagline;
  const milestone=({1:'初见奇遇！第一款隐藏角色已入藏。',3:'三款秘藏集结，收藏家之路开始发光。',5:'五重秘藏达成，你已成为雪域寻宝者。',8:'八款珍藏到手，传说已经近在眼前。',10:'图鉴圆满！十款秘藏已全部集齐。'})[milestoneCount];
  const notice=milestone?document.createElement('p'):null;
  if(notice){notice.className='secret-reveal-milestone';notice.textContent=milestone;}
  const actions=document.createElement('div'); actions.className='secret-reveal-actions';
  const keep=document.createElement('button'); keep.type='button'; keep.textContent='打开珍藏图鉴'; keep.addEventListener('click',()=>{dialog.close();openPassportCollection();});
  const close=document.createElement('button'); close.type='button'; close.textContent='继续体验'; close.addEventListener('click',()=>dialog.close());
  actions.append(keep,close); dialog.append(rarityLabel,title,copy); if(notice)dialog.append(notice); dialog.append(actions); document.body.append(dialog); dialog.addEventListener('close',()=>dialog.remove(),{once:true}); dialog.showModal();
}

function openPassportCollection() {
  guideUI?.openPassport();
  window.setTimeout(()=>{
    const epic=state.discoveredSecret?.rarity==='epic'&&document.querySelector(`[data-secret-id="${state.discoveredSecret.id}"]`);
    (epic||document.getElementById('secretCollection'))?.scrollIntoView({behavior:'smooth',block:'center'});
  },0);
}

/**
 * 生成结果 → 贴纸脸。
 *
 * 这一步不需要任何猜测，因为**背景是提示词里写死的纯色**（#E8F4FD）：
 * 按背景色泛洪抠掉 → 去碎点 → 裁到内容（头肩）→ 补一圈墨线。
 * 这正是"生成时就用纯色背景"的意义——抠图问题在生成阶段就解决掉了。
 */
async function applyGeneratedFace(url, { skipAlignment = false } = {}) {
  const img = await loadImage(url);
  const k = Math.min(1, 768 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  src.getContext('2d').drawImage(img, 0, 0, w, h);

  // 生成图的背景是提示词里写死的浅冰蓝，用"偏蓝判据"抠：
  // 泛洪那条路会被白 T 恤带跑，把整个人一起吃掉（见 keyFlatBackground 的说明）
  const cut = keyFlatBackground(src.getContext('2d').getImageData(0, 0, w, h), {});
  const cutImg = { data: cut.data, width: w, height: h };
  dropSpecks(cutImg, { minNeighbors: 3 });
  // 细长残渣（背景暗边、飘出去的发丝）能骗过"去碎点"，但会被这一刀清掉
  // 阈值给到 128：抗锯齿轮廓的"半透明桥"会把一小撮残渣连到头上，抬高阈值就断了
  keepLargestComponent(cutImg, { threshold: 128 });

  /*
   * 只取头，不取整个人。
   *
   * 生成图是"头肩特写"，画面里除了头还有肩膀和胸口的 T 恤。上一版按整块人的包围盒
   * 取图，结果塞进头圆的正好是胸口那片灰白——用户看到的就是"头是全灰色"。
   * 现在用逐行宽度找脖颈突变点（contentBounds 已经算好了 head），只截头。
   */
  const all = contentBounds(cutImg, { threshold: 96, rejectBorder: false }) || { x: 0, y: 0, w, h };
  const head = all.head && all.head.h > all.h * 0.15 ? all.head : all;
  // 脸（皮肤范围）：只用来当缩放锚点，取景范围还是按"头"（要包含头发）
  const skin = contentBounds(cutImg, { threshold: 96, rejectBorder: false, skinOnly: true });
  const faceBox = skin && skin.w > w * 0.08 && skin.h > h * 0.06 ? skin : null;
  state.genDebug = {
    all: { x: all.x, y: all.y, w: all.w, h: all.h },
    head: all.head ? { x: all.head.x, y: all.head.y, w: all.head.w, h: all.head.h } : null,
    face: faceBox ? { x: faceBox.x, y: faceBox.y, w: faceBox.w, h: faceBox.h } : null,
    used: head === all ? 'all' : 'head',
    side: 0,
    cutRow: 0,
  };
  // 1.06：够把头（含头发）圈住就行。给大了会把肩膀一起框进来
  const side = Math.max(64, Math.round(Math.max(head.w, head.h) * 1.06));
  const cx = head.x + head.w / 2;
  const cy = head.y + head.h * 0.52; // 往上取一点，别让脖子占掉一半

  const cutCanvas = document.createElement('canvas');
  cutCanvas.width = w;
  cutCanvas.height = h;
  cutCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(cut.data), w, h), 0, 0);
  const out = document.createElement('canvas');
  out.width = side;
  out.height = side;
  const octx = out.getContext('2d');
  octx.drawImage(cutCanvas, cx - side / 2, cy - side / 2, side, side, 0, 0, side, side);

  /*
   * 底部渐隐，而不是硬切。
   *
   * 方形的下半部分可能还带着脖子和一点肩膀，直接画出来就是两片白"翅膀"；
   * 但硬切一条直线会在下巴/脖子处留一道生硬的边。渐隐两头都躲开：
   * 脖子自然融进围巾和领口，肩膀也不会露出来。
   */
  /*
   * 在"脸的底边"（下巴→脖子的尽头，也就是衣领处）硬切。
   *
   * 之前按"头的底边"（脖颈线）切，还是会多一点脖子以下的肩膀：那条线的位置是估的。
   * 现在用**皮肤范围的底边**——它是量出来的，而且皮肤到衣领就断了，天生长在正确的位置。
   * 硬切之外只留 2% 渐隐，纯粹是为了别切出一条整齐的锯齿。
   */
  const cutSource = faceBox ? faceBox.y + faceBox.h : head.y + head.h;
  const headBottomInCrop = Math.round(cutSource - (cy - side / 2));
  const fadeFrom = Math.max(1, Math.round(headBottomInCrop * 0.98));
  state.genDebug.side = side;
  state.genDebug.fadeFrom = fadeFrom;
  state.genDebug.cutAt = headBottomInCrop;
  const frameData = octx.getImageData(0, 0, side, side);
  /*
   * 下巴以下只留皮肤。
   *
   * 肩膀是切不干净的：它和脖子在**同一高度**，只是在脖子两侧，横向切一刀切不掉它。
   * 但肩膀（衣服）不是肤色，脖子是——所以下巴以下凡是"不是皮肤"的像素全部清掉，
   * 肩膀、衣领、袖子在同一刀里同时消失，而脖子完整保留（围巾正好接在这里）。
   */
  const chinRow = Math.round(
    (faceBox ? faceBox.y + faceBox.h * 0.66 : head.y + head.h * 0.78) - (cy - side / 2),
  );
  for (let y = Math.max(0, chinRow); y < side; y += 1) {
    for (let x = 0; x < side; x += 1) {
      const i = (y * side + x) * 4;
      if (frameData.data[i + 3] === 0) continue;
      if (!isSkin(frameData.data[i], frameData.data[i + 1], frameData.data[i + 2])) {
        frameData.data[i + 3] = 0;
      }
    }
  }
  for (let y = fadeFrom; y < side; y += 1) {
    const k = y >= headBottomInCrop ? 0 : 1 - (y - fadeFrom) / Math.max(1, headBottomInCrop - fadeFrom);
    for (let x = 0; x < side; x += 1) {
      const i = (y * side + x) * 4 + 3;
      frameData.data[i] = Math.round(frameData.data[i] * k);
    }
  }
  octx.putImageData(frameData, 0, 0);

  const sticker = makeFaceSticker(out.getContext('2d').getImageData(0, 0, side, side).data, side, {
    alreadyCut: true, // 已经抠好了
    cartoon: false, // 模型给的就是卡通，再"卡通化"一遍只会把它揉糊
    outline: true, // 但补一圈墨线，和矢量衣服才像一套
  });
  /*
   * 在**最终那张 256 贴纸**上再量一次脸。
   *
   * 注意必须在贴纸（256）上量，不能在前面那张 side×side 的中间画布上量——
   * 两者差 256/side 倍（这里是 2.3 倍），绘制端按 256 用，锚点会整个偏掉，
   * 表现就是"头飞到画面外面去"。
   */
  const stickerSide = sticker.canvas.width;
  const faceInSticker = contentBounds(
    {
      data: sticker.canvas.getContext('2d').getImageData(0, 0, stickerSide, stickerSide).data,
      width: stickerSide,
      height: stickerSide,
    },
    { threshold: 90, rejectBorder: false, skinOnly: true, minFill: 0.15 },
  );
  state.genDebug.stickerFace = faceInSticker;
  state.genDebug.stickerHeadH = sticker.content ? sticker.content.h : null;
  state.cfg.face = {
    kind: 'api',
    fromFigure: skipAlignment,
    canvas: sticker.canvas,
    content: faceInSticker && faceInSticker.w > 12 ? faceInSticker : sticker.content,
    // 整个头（含头发）在贴纸里有多高：绘制端用它给缩放设上限，免得头发飞出画面
    headH: sticker.content ? sticker.content.h : null,
    fit: normalizeFaceFit(null),
    skin: sticker.stats.skin || '#F3C9A8',
    preset: null,
  };
  state.cfg.figure = null;
  // 生成的头像自带头发和（可能的）眼镜：把矢量那两件关掉，选项卡也会跟着收起来
  state.cfg.parts.hair = 'none';
  state.cfg.parts.glasses = 'none';
  // 发色取自生成图，避免"黑头发配棕眉毛"这种拼装感
  if (sticker.stats.hair) state.cfg.colors.hair = sticker.stats.hair;
  applyChange();
  saveConfig(state.cfg);
  setGenStatus('完整角色处理中…', undefined);
  buildTabs();
  renderTabBody();
}

async function applyGeneratedFigure(url, { isCurrentVisit = () => true } = {}) {
  const img = await loadImage(url);
  if (!isCurrentVisit()) return false;
  const k = Math.min(1, 768 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  src.getContext('2d').drawImage(img, 0, 0, w, h);
  const pixels = src.getContext('2d').getImageData(0, 0, w, h);
  const cut = keyFigureBackground(pixels);
  if (figureCutoutHasBackground(cut)) throw new Error('模型仍画出了场景或地面，无法干净抠图；请重新生成');
  let transparent = 0;
  for (let i = 3; i < cut.data.length; i += 4) if (cut.data[i] < 32) transparent++;
  if (transparent < w * h * 0.08) throw new Error('未能分离人物背景，请重新生成纯色背景角色');
  const cutImg = { data: cut.data, width: w, height: h };
  dropSpecks(cutImg, { minNeighbors: 3 });
  // 扫描所有保留下来的不透明像素，避免人脸框或连通块把身体排除在外。
  let minX = w; let minY = h; let maxX = -1; let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (cut.data[(y * w + x) * 4 + 3] < 48) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  const bounds = maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
  if (!bounds || bounds.w < 40 || bounds.h < 80) throw new Error('人物抠图不完整，请重新生成');
  const cutCanvas = document.createElement('canvas');
  cutCanvas.width = w;
  cutCanvas.height = h;
  cutCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(cut.data), w, h), 0, 0);
  const pad = Math.round(Math.max(bounds.w, bounds.h) * 0.05);
  const sx = Math.max(0, bounds.x - pad);
  const sy = Math.max(0, bounds.y - pad);
  const sw = Math.min(w - sx, bounds.w + pad * 2);
  const sh = Math.min(h - sy, bounds.h + pad * 2);
  const scale = Math.min(1, 640 / Math.max(sw, sh));
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(sw * scale));
  out.height = Math.max(1, Math.round(sh * scale));
  out.getContext('2d').drawImage(cutCanvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
  if (!isCurrentVisit()) return false;
  finishGeneratedFigure(out, true);
  return true;
}

function finishGeneratedFigure(canvas, transparentBackground) {
  state.cfg.face = defaultConfig().face;
  state.cfg.figure = { canvas, outfitKey: outfitKey(state.cfg) };
  tourEntered = false;
  showcasePresence?.tourEnded();
  map?.setHeroVisible(false);
  $('departureNote').textContent = '角色已准备好！点击「带我去游览」，跃入右侧赛事地图。';
  applyChange();
  renderTabBody();
  setGenStatus(transparentBackground
    ? '全身冰雪角色完成！现在可以带着完整角色去游览和挑战小游戏。'
    : '完整角色已显示。旧作品含场景背景，可重新生成一版透明人物。', undefined);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('结果图片打不开'));
    img.src = url;
  });
}

/** 压到长边 max 再上传：传得小=快、省流量，对生成质量几乎没影响 */
function downscaleToDataUrl(source, max, mime = 'image/jpeg', quality = 0.9) {
  const sw = source.width || source.naturalWidth;
  const sh = source.height || source.naturalHeight;
  const k = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * k));
  canvas.height = Math.max(1, Math.round(sh * k));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(mime, quality);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const group = (title) => {
  const p = document.createElement('p');
  p.className = 'group-title';
  p.textContent = title;
  return p;
};

function optionRow(options, current, onPick) {
  const row = document.createElement('div');
  row.className = 'row';
  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.type = 'button';
    btn.textContent = opt.label;
    btn.setAttribute('aria-pressed', String(opt.id === current));
    btn.addEventListener('click', () => onPick(opt.id));
    row.appendChild(btn);
  }
  return row;
}

function swatchRow(key, current, onPick) {
  const row = document.createElement('div');
  row.className = 'row';
  for (const color of PALETTES[key] || []) {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.type = 'button';
    btn.style.background = color;
    btn.title = color;
    btn.setAttribute('aria-pressed', String(color === current));
    btn.addEventListener('click', () => onPick(color));
    row.appendChild(btn);
  }
  return row;
}

function renderTabBody() {
  const body = $('tabBody');
  const controlsColumn = body.closest('.creator-controls-column');
  const controlsScrollTop = controlsColumn?.scrollTop || 0;
  const previousScroll = window.scrollY;
  const focusedWorkshopControl = document.activeElement?.dataset?.workshopFocus || '';
  body.innerHTML = '';
  const restoreViewport = () => requestAnimationFrame(() => {
    if (controlsColumn) controlsColumn.scrollTop = controlsScrollTop;
    if (window.scrollY !== previousScroll) window.scrollTo({ top: previousScroll, behavior: 'instant' });
    if (focusedWorkshopControl) {
      const target = [...body.querySelectorAll('[data-workshop-focus]')].find((node) => node.dataset.workshopFocus === focusedWorkshopControl);
      target?.focus({ preventScroll:true });
    }
  });

  if (state.tab === 'photo') {
    renderPhotoTab(body);
    restoreViewport();
    return;
  }

  const key = state.tab;
  body.appendChild(group(`${CATEGORY_LABEL[key]}样式`));
  body.appendChild(
    optionRow(PARTS[key], state.cfg.parts[key], (id) => {
      state.cfg.parts[key] = id;
      applyChange();
      renderTabBody();
    }),
  );

  const palette = { hair: 'hair', hat: 'coat', scarf: 'gear', coat: 'coat', pants: 'pants', boots: 'boots', gloves: 'gear', glasses: 'gear', gear: 'gear' }[key];
  if (palette) {
    body.appendChild(group('颜色'));
    body.appendChild(
      swatchRow(palette, state.cfg.colors[key], (color) => {
        state.cfg.colors[key] = color;
        applyChange();
        renderTabBody();
      }),
    );
  }

  if (key === 'gear') {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = '单板是背在背后的，冰球杆和小旗拿在手上——小游戏里只用得到脸，道具是给你在地图上看的。';
    body.appendChild(note);
  }
  restoreViewport();
}

/** 模板脸的画布只生成一次，五个按钮共用 */
const presetCache = new Map();
function presetConfigCache(preset) {
  if (!presetCache.has(preset.id)) presetCache.set(preset.id, presetConfig(preset).face.canvas);
  return presetCache.get(preset.id);
}

/** 任何一次改动都走这里：存盘 + 刷新提示 + 同步给地图 */
function applyChange() {
  refreshStageHint();
  syncLookSelection();
  // 选项卡跟着"脸的来源"变（AI 头像不给发型/眼镜），所以每次改动都重建一次
  buildTabs();
  saveConfig(state.cfg);
  map.setCharacter(state.cfg);
}

/* ------------------------------------------------------------------ */
/* 左半边：照片编辑器（取景 + 抠图 + 橡皮）                            */
/* ------------------------------------------------------------------ */

const editor = $('editor');
const editorCtx = editor.getContext('2d');
const previewCanvas = $('editorPreview');
const previewCtx = previewCanvas.getContext('2d');

const photo = {
  canvas: null, // 原图（已 cover 裁成正方形）
  side: 0,
  cut: null, // 抠完的像素（带 alpha）
  cutCanvas: null,
  tintCanvas: null,
  frame: { cx: 0.5, cy: 0.44, r: 0.36 },
  tolerance: 40,
  face: null,
  brush: null, // 'erase' | 'restore' | null
  brushSize: 16,
  dragging: null,
  stats: null,
};

/** 记下用户选的照片（不立刻处理：生成还是手动抠图由用户下一步决定） */
async function setPhotoSource(source) {
  photo.source = source;
  photo.thumb = await downscaleToDataUrl(source, 240);
  renderTabBody();
  refreshStageHint();
}

/** 手动抠图：把照片装进方形工作区，开取景/橡皮编辑器 */
function openEditor() {
  const source = photo.source;
  if (!source) return;
  const side = EDITOR_SIZE;
  const { imageData, mapping } = fitToSquare(source, side);
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  canvas.getContext('2d').putImageData(imageData, 0, 0);

  photo.source = source; // 最终那一刀要回原图去取（分辨率高得多）
  photo.map = mapping;
  photo.canvas = canvas;
  photo.side = side;
  // 先把取景框放到"猜出来的脸"上：身份证照、自拍、全身照都能落在大概位置，
  // 剩下那点偏差用户拖一下就正了
  photo.guess = guessFaceBox(imageData, {}) || { cx: 0.5, cy: 0.2, r: 0.19 };
  photo.frame = { ...photo.guess };
  photo.tolerance = 40;
  photo.face = null;
  photo.brush = null;
  // 手动修补存成"补丁列表"，叠在自动抠图之上（见 runCut）：
  // 这样调容差重跑自动抠图时，擦过的痕迹不会被冲掉
  photo.strokes = [];
  $('tolRange').value = '40';
  $('radiusRange').value = String(Math.round(photo.frame.r * 100));
  photo.brushSize = 16;
  $('brushRange').value = '16';
  setBrush(null);
  $('photoSheet').hidden = false;
  runCut();
}

/** 重跑抠图：编辑器的"原始素材"永远是原图，所以调容差是可逆的 */
function runCut() {
  const { canvas, side } = photo;
  const src = canvas.getContext('2d').getImageData(0, 0, side, side);
  const out = removeBackground(src, { tolerance: photo.tolerance, softness: 1 });
  photo.cut = out.data;
  photo.stats = { removed: out.removed };
  for (const stamp of photo.strokes || []) applyStamp(stamp);
  syncCutCanvas();
  refreshPreview();
  renderEditor();
  const tip = $('editorTip');
  if (out.removed > 0.86) {
    tip.textContent = '几乎全被当成背景了 —— 把容差调小一点';
  } else if (out.removed < 0.06) {
    tip.textContent = '没怎么抠动 —— 背景太花，调大容差或用橡皮手动擦';
  } else {
    tip.textContent = `背景去掉 ${Math.round(out.removed * 100)}% · 可以手动修补`;
  }
}

function syncCutCanvas() {
  const { side } = photo;
  if (!photo.cutCanvas || photo.cutCanvas.width !== side) {
    photo.cutCanvas = document.createElement('canvas');
    photo.cutCanvas.width = side;
    photo.cutCanvas.height = side;
    photo.tintCanvas = document.createElement('canvas');
    photo.tintCanvas.width = side;
    photo.tintCanvas.height = side;
  }
  photo.cutCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(photo.cut), side, side), 0, 0);

  // 单独留一张"只有 alpha"的遮罩：回原图取高分辨率那一刀时，用它把背景收掉
  if (!photo.maskCanvas) {
    photo.maskCanvas = document.createElement('canvas');
    photo.maskCanvas.width = side;
    photo.maskCanvas.height = side;
  }
  const mask = new Uint8ClampedArray(side * side * 4);
  for (let i = 0; i < mask.length; i += 4) {
    mask[i] = 255;
    mask[i + 1] = 255;
    mask[i + 2] = 255;
    mask[i + 3] = photo.cut[i + 3];
  }
  photo.maskCanvas.getContext('2d').putImageData(new ImageData(mask, side, side), 0, 0);

  // 被抠掉的区域涂一层淡红，用户一眼看出"这张脸要保留什么、丢掉什么"
  const tint = new Uint8ClampedArray(side * side * 4);
  for (let i = 0; i < tint.length; i += 4) {
    if (photo.cut[i + 3] < 140) {
      tint[i] = 255;
      tint[i + 1] = 143;
      tint[i + 2] = 122;
      tint[i + 3] = 96;
    }
  }
  photo.tintCanvas.getContext('2d').putImageData(new ImageData(tint, side, side), 0, 0);
}

function renderEditor() {
  const { canvas, side, frame, tintCanvas } = photo;
  if (!canvas) return;
  // 画布必须是正方形，而且边长要跟着 CSS 尺寸和 dpr 走。
  // （之前直接读 getBoundingClientRect 的宽高，而 canvas 的 height:auto 会沿用
  //  初始 2:1 的固有比例，于是只画出了上半张，取景框全被裁在画面外。）
  const rect = editor.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssSide = Math.max(1, Math.round(rect.width));
  const target = Math.max(2, Math.round(cssSide * dpr));
  if (editor.width !== target) {
    editor.width = target;
    editor.height = target;
  }
  editorCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = cssSide / side;
  editorCtx.clearRect(0, 0, cssSide, cssSide);
  editorCtx.drawImage(canvas, 0, 0, side, side, 0, 0, cssSide, cssSide);

  const cx = frame.cx * side * scale;
  const cy = frame.cy * side * scale;
  const r = frame.r * side * scale;
  // 抠图提示只画在取景圈里：圈外那部分反正不用，涂上反而看不清人在哪
  editorCtx.save();
  editorCtx.beginPath();
  editorCtx.arc(cx, cy, r, 0, Math.PI * 2);
  editorCtx.clip();
  editorCtx.drawImage(tintCanvas, 0, 0, side, side, 0, 0, cssSide, cssSide);
  editorCtx.restore();

  // 框外压暗：取景框里才是要用的部分
  editorCtx.save();
  editorCtx.fillStyle = 'rgba(9, 33, 53, 0.42)';
  editorCtx.beginPath();
  editorCtx.rect(0, 0, cssSide, cssSide);
  editorCtx.arc(cx, cy, r, 0, Math.PI * 2, true);
  editorCtx.fill();
  editorCtx.restore();

  editorCtx.strokeStyle = 'rgba(255,255,255,0.95)';
  editorCtx.lineWidth = 3;
  editorCtx.beginPath();
  editorCtx.arc(cx, cy, r, 0, Math.PI * 2);
  editorCtx.stroke();
  editorCtx.strokeStyle = 'rgba(15, 53, 85, 0.35)';
  editorCtx.lineWidth = 1.5;
  editorCtx.setLineDash([6, 6]);
  editorCtx.beginPath();
  editorCtx.moveTo(cx - r, cy);
  editorCtx.lineTo(cx + r, cy);
  editorCtx.moveTo(cx, cy - r);
  editorCtx.lineTo(cx, cy + r);
  editorCtx.stroke();
  editorCtx.setLineDash([]);
}

/** 抠好的方形素材 → 贴纸脸（预览和确认共用这一条路径，避免"预览好看、用了变样"） */
function buildFace() {
  const { frame, side } = photo;
  if (!photo.cutCanvas) return null;

  /**
   * 最终那一刀：**回原图按原始分辨率取**，再把抠好的 alpha 贴上去。
   *
   * 全身照的头在方形工作区里可能只剩三十几像素，从工作区取等于"先缩小再放大"，
   * 出来必然是糊的。回原图取，才能拿到这张照片里真实存在的那些像素。
   * alpha 从工作分辨率放大过来，边缘本来就是软的，正好当羽化用。
   */
  const grabSource = (cx2, cy2, half2) => {
    const wRect = half2 * 2;
    const sRect = wRect / photo.map.scale;
    const outSide = Math.max(64, Math.min(640, Math.round(sRect)));
    const c = document.createElement('canvas');
    c.width = outSide;
    c.height = outSide;
    const cctx = c.getContext('2d');
    cctx.imageSmoothingQuality = 'high';
    // 注意 x 和 y 的偏移是**两个**值：竖构图的照片左右留白、上下不留，
    // 都用 ox 的话裁切矩形会跑到画面外，取回来是一张空图（踩过）
    const toSourceX = (v) => (v - photo.map.ox) / photo.map.scale;
    const toSourceY = (v) => (v - photo.map.oy) / photo.map.scale;
    const sx = toSourceX(cx2 - half2);
    const sy = toSourceY(cy2 - half2);
    cctx.drawImage(
      photo.source,
      sx,
      sy,
      sRect,
      sRect,
      0,
      0,
      outSide,
      outSide,
    );
    cctx.globalCompositeOperation = 'destination-in';
    cctx.drawImage(photo.maskCanvas, cx2 - half2, cy2 - half2, wRect, wRect, 0, 0, outSide, outSide);
    return { pixels: cctx.getImageData(0, 0, outSide, outSide).data, side: outSide };
  };

  let cx = frame.cx * side;
  let cy = frame.cy * side;
  let half = frame.r * side;

  /*
   * 取景框直接就是裁切范围，这里**不做自动收紧**。
   *
   * 试过三种收紧办法，都倒在同一个前提上：抠图在花背景上本来就不准，而它们全都拿它当输入。
   *   · 抠图后的连通块 → 被肩膀和门框阴影撑成一大块；
   *   · "被保留 ⨯ 肤色" → 木门在框里没被抠掉时，量到的是门不是脸；
   *   · 逐行宽度找脖颈线 → 同样依赖那个不可靠的 alpha，切出来偏到头发上。
   * 所以最终交给三件事兜底：
   *   1) 取景框的默认位置由"粗搜 + 细搜"的脸部定位给出，用户可以拖、可以缩放；
   *   2) 绘制端（avatar-parts.js 的 drawFaceInto）按内容自适应缩放，框松一点也不会只剩一张小脸；
   *   3) 抠不干净的地方用橡皮/补回手动修——这是唯一真正可靠的兜底。
   */
  const cxFinal = clamp(cx, half, side - half);
  const cyFinal = clamp(cy, half, side - half);
  const crop = grabSource(cxFinal, cyFinal, half);
  const sticker = makeFaceSticker(crop.pixels, crop.side, {
    alreadyCut: true, // 已经抠过了，这里只做去碎点 + 卡通化 + 勾墨线
    cartoonize: { levels: 7, blend: 0.7, saturation: 1.16, edge: 0.5 },
    outline: true,
  });
  sticker.stats = { ...sticker.stats, ...photo.stats };
  return sticker;
}

let previewTimer = 0;
function refreshPreview(immediate = false) {
  const run = () => {
    const sticker = buildFace();
    if (!sticker) return;
    photo.face = sticker;
    drawFacePreview(previewCtx, sticker.canvas, previewCanvas.width, { background: '#e8f4fd' });
  };
  if (immediate) {
    run();
    return;
  }
  clearTimeout(previewTimer);
  previewTimer = setTimeout(run, 180);
}

function setBrush(mode) {
  photo.brush = mode;
  for (const btn of document.querySelectorAll('.brush-row .chip')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
  }
  $('editorTip').dataset.brush = mode || '';
}

/** 把指针位置换算到原图坐标 */
function editorPointer(event) {
  const rect = editor.getBoundingClientRect();
  const side = photo.side;
  return {
    x: ((event.clientX - rect.left) / rect.width) * side,
    y: ((event.clientY - rect.top) / rect.height) * side,
    rx: (event.clientX - rect.left) / rect.width,
    ry: (event.clientY - rect.top) / rect.height,
  };
}

function paintBrush(pt) {
  const { side, cut, brush } = photo;
  if (!brush || !cut) return;
  const radius = photo.brushSize * (side / editor.getBoundingClientRect().width);
  const stamp = { x: pt.x, y: pt.y, r: radius, mode: brush };
  photo.strokes.push(stamp);
  applyStamp(stamp);
  syncCutCanvas();
}

/** 把一笔"橡皮/补回"落到当前抠图结果上 */
function applyStamp(stamp) {
  const { side, cut } = photo;
  const { x: sx, y: sy, r: radius, mode } = stamp;
  const x0 = Math.max(0, Math.floor(sx - radius));
  const x1 = Math.min(side - 1, Math.ceil(sx + radius));
  const y0 = Math.max(0, Math.floor(sy - radius));
  const y1 = Math.min(side - 1, Math.ceil(sy + radius));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.hypot(x - sx, y - sy);
      if (d > radius) continue;
      const i = (y * side + x) * 4 + 3;
      // 边缘 30% 做羽化，擦出来的边界才不是一圈硬齿
      const k = d > radius * 0.7 ? 1 - (d - radius * 0.7) / (radius * 0.3) : 1;
      if (mode === 'erase') cut[i] = Math.min(cut[i], Math.round(255 * (1 - k)));
      else cut[i] = Math.max(cut[i], Math.round(255 * k));
    }
  }
}

editor.addEventListener('pointerdown', (event) => {
  editor.setPointerCapture(event.pointerId);
  const pt = editorPointer(event);
  const { frame } = photo;
  const dist = Math.hypot(pt.rx - frame.cx, pt.ry - frame.cy);
  if (photo.brush) {
    paintBrush(pt);
    photo.dragging = { mode: 'brush' };
    renderEditor();
    refreshPreview();
    return;
  }
  // 点在圈内 → 拖框；点在圈外 → 跳到那儿（省得非要按住中心才能拖）
  if (dist < frame.r) {
    photo.dragging = { mode: 'move', dx: frame.cx - pt.rx, dy: frame.cy - pt.ry, edge: Math.abs(dist - frame.r) < 0.06 };
  } else {
    photo.dragging = { mode: 'move', dx: 0, dy: 0, edge: false };
    moveFrameTo(pt);
  }
  renderEditor();
});

function moveFrameTo(pt) {
  const { frame } = photo;
  if (photo.dragging && photo.dragging.edge) {
    frame.r = Math.max(0.22, Math.min(0.48, Math.hypot(pt.rx - frame.cx, pt.ry - frame.cy)));
  } else {
    frame.cx = Math.max(0.05, Math.min(0.95, pt.rx + (photo.dragging ? photo.dragging.dx : 0)));
    frame.cy = Math.max(0.05, Math.min(0.95, pt.ry + (photo.dragging ? photo.dragging.dy : 0)));
  }
  $('radiusRange').value = String(Math.round(frame.r * 100));
}

editor.addEventListener('pointermove', (event) => {
  if (!photo.dragging) return;
  const pt = editorPointer(event);
  if (photo.dragging.mode === 'brush') {
    paintBrush(pt);
    renderEditor();
    refreshPreview();
    return;
  }
  if (photo.dragging.edge) {
    moveFrameTo(pt);
  } else {
    photo.frame.cx = Math.max(0.05, Math.min(0.95, pt.rx + photo.dragging.dx));
    photo.frame.cy = Math.max(0.05, Math.min(0.95, pt.ry + photo.dragging.dy));
  }
  renderEditor();
  refreshPreview();
});

const endEditorDrag = () => {
  if (!photo.dragging) return;
  photo.dragging = null;
  refreshPreview();
};
editor.addEventListener('pointerup', endEditorDrag);
editor.addEventListener('pointercancel', endEditorDrag);

/* ------------------------------------------------------------------ */
/* 右半边：地图、行走、场馆卡                                          */
/* ------------------------------------------------------------------ */

const mapCanvas = $('map');
let map = null;
let walkVenueId = null;

function buildChips() {
  const root = $('chips');
  root.innerHTML = '';
  for (const venue of state.venues) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.dataset.id = venue.id;
    btn.dataset.kind = venue.kind;
    const dot = document.createElement('i');
    dot.style.background = venue.color;
    const label = document.createElement('span');
    label.textContent = venue.name.replace(/^长春|^吉林/, '');
    btn.append(dot, label);
    btn.addEventListener('click', () => inspectPlace(venue.id));
    root.appendChild(btn);
  }
  syncChips();
}

function syncChips() {
  for (const btn of document.querySelectorAll('.chip[data-id]')) {
    btn.classList.toggle('active', btn.dataset.id === state.activeId);
    btn.classList.toggle('explored', state.visited.has(btn.dataset.id));
    btn.classList.toggle('done', state.medals.has(btn.dataset.id));
  }
  for (const dot of document.querySelectorAll('.stamp')) {
    dot.classList.toggle('on', state.medals.has(dot.dataset.id));
  }
  $('stampText').textContent = `已集 ${state.medals.size} / ${state.venues.filter((place) => place.kind === 'venue').length} 枚挑战奖章`;
  $('explorationProgress').textContent = `${state.visited.size} / ${state.venues.length}`;
  $('medalProgress').textContent = `${state.medals.size} / ${state.venues.filter((place) => place.kind === 'venue').length}`;
  $('quizBadgeStatus').textContent = state.quizBadge ? '已获得' : '未获得';
  $('quizBestStatus').textContent = `最佳 ${state.quizBest} / 5 · 答对 4 题可获得`;
  $('goalieBest').textContent = `最佳扑救 ${state.goalieBest} / 5`;
}

function buildStamps() {
  const row = $('stampRow');
  row.innerHTML = '';
  for (const venue of state.venues.filter((place) => place.kind === 'venue')) {
    const dot = document.createElement('span');
    dot.className = 'stamp';
    dot.dataset.id = venue.id;
    dot.title = venue.name;
    dot.setAttribute('aria-hidden', 'true');
    row.appendChild(dot);
  }
  syncChips();
}

function renderBookContents() {
  const root = $('bookContents');
  root.replaceChildren();
  const renderRow = (parent, venue, index, mode) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'contents-row';
    row.dataset.placeId = venue.id;
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('b');
    name.textContent = venue.name;
    const kind = document.createElement('small');
    kind.textContent = `${venue.kind === 'attraction' ? '城市景点' : '冰雪场馆'} · ${state.readNotes.has(venue.id) ? '已读' : '未读'} · ${state.visited.has(venue.id) ? '已到达' : '未抵达'}${state.medals.has(venue.id) ? ' · 已获奖章' : ''}`;
    row.append(number, name, kind);
    row.addEventListener('click', () => { $('bookContentsDialog').close(); previewBookPlace(venue.id); });
    parent.append(row);
  };
  if ($('bookRouteContents')) {
    const routeRoot = $('bookRouteContents'); routeRoot.replaceChildren();
    const routeIds = bookManifest?.orderedPlaceIds || [];
    routeIds.forEach((id, index) => { const venue = state.venues.find((place) => place.id === id); if (venue) renderRow(routeRoot, venue, index, 'route'); });
    if (!routeIds.length) routeRoot.textContent = '规划或选择一条路线后，这里会显示本次旅程。';
    const allRoot = $('bookAllContents'); allRoot.replaceChildren();
    const routeSet = new Set(routeIds);
    const otherPlaces = state.venues.filter((venue) => !routeSet.has(venue.id));
    $('bookOtherPlacesSection').hidden = otherPlaces.length === 0;
    $('bookOtherPlacesTitle').textContent = routeIds.length ? '其他地点' : '全部地点';
    otherPlaces.forEach((venue) => renderRow(allRoot, venue, state.venues.indexOf(venue), 'all'));
    return;
  }
  state.venues.forEach((venue, index) => {
    const row = document.createElement('div');
    row.className = 'contents-row';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('b');
    name.textContent = venue.name;
    const kind = document.createElement('small');
    kind.textContent = venue.kind === 'attraction' ? '城市景点' : '冰雪场馆';
    row.append(number, name, kind);
    root.append(row);
  });
}

function openBookContents() {
  renderBookContents();
  const dialog = $('bookContentsDialog');
  if (!dialog.open) dialog.showModal();
}

function inspectPlace(id) {
  startWalk(id);
}

function previewBookPlace(id) {
  const venue = state.venues.find((place) => place.id === id);
  if (!venue || bookNavigationBusy || bookTurning || map?.walkInfo || visitPending) return;
  if (!tourEntered) {
    if (state.cfg.figure?.canvas) void enterTour().then((ok) => { if (ok) previewBookPlace(id); });
    else { $('departureNote').textContent = '先选择或生成角色，再打开地点手记。'; }
    return;
  }
  state.pendingVenue = venue;
  state.activeId = venue.id;
  map.setActive(venue.id);
  showCard(venue, false, { arrival:false });
  void openDetailPage(venue, { intent:'preview' });
}

let bookTurning = false;
let chapterArrivalTimer = 0;
let detailOpening = 0;
const PAGE_FLIP_KEY = 'changchun-full-page-flips-v1';
let fullPageFlips = false;
try { fullPageFlips = localStorage.getItem(PAGE_FLIP_KEY) === 'true'; } catch { /* private browsing */ }

function syncPageFlipToggle() {
  // The legacy preference controls animation strength only; page order is shared.
  $('pageFlipToggle').setAttribute('aria-pressed', String(fullPageFlips));
  $('pageFlipToggle').setAttribute('aria-label', `翻页动效：${fullPageFlips ? '完整' : '轻量'}`);
}

function syncMapSidebar() {
  const info = $('mapSidebarInfo');
  const selectors = [
    '#mapPanel > .panel-head', '#mapPanel > .explore-tools', '#mapPanel > #mascotGuideMap',
    '#mapPanel > #mascotPlaceCard', '#mapPanel > #guideRouteBar', '#mapPanel > #journeyContinue', '#mapPanel > .progress-summary',
    '#mapPanel > .bonus-challenges', '#mapPanel > .live-summary', '#mapPanel > .stats-caption', '#mapPanel > .chips',
  ];
  const shouldMove = document.body.dataset.book === 'map' && matchMedia('(min-width: 900px)').matches;
  if (shouldMove) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element || info.contains(element)) continue;
      const anchor = document.createComment('map-sidebar-position');
      element.before(anchor);
      element._mapSidebarAnchor = anchor;
      info.append(element);
    }
  } else {
    for (const element of [...info.children]) {
      const anchor = element._mapSidebarAnchor;
      if (anchor?.parentNode) anchor.replaceWith(element);
      delete element._mapSidebarAnchor;
    }
  }
}

function setBookChapter(chapter) {
  const previousChapter = document.body.dataset.book;
  document.body.dataset.book = chapter;
  if (previousChapter && previousChapter !== chapter && previousChapter !== 'cover' && chapter !== 'cover' && !bookTurning && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const spread = $('bookSpread');
    document.body.classList.remove('chapter-arrival');
    clearTimeout(chapterArrivalTimer);
    void spread.offsetWidth;
    document.body.classList.add('chapter-arrival');
    chapterArrivalTimer = window.setTimeout(() => document.body.classList.remove('chapter-arrival'), 600);
  }
  mascotGuide?.setChapter(chapter);
  syncMapSidebar();
  const blocked = chapter === 'cover' || chapter === 'detail';
  $('bookSpread').inert = blocked;
  $('bookChapterBar').inert = blocked;
  // The passport is a global utility and must remain available from the cover
  // and the place-note page. Block only the non-navigation header content.
  $('top').inert = blocked;
  $('stampBox').inert = blocked;
  for (const selector of ['#mapPanel .explore-tools','#mapSidebarInfo .explore-tools','#mapPanel .map-wrap','.live-summary','#mapPanel .chips','#mapSidebarInfo .chips']) {
    const element = document.querySelector(selector);
    if (element) element.inert = chapter === 'creator';
  }
  if (chapter === 'creator') {
    $('workshopPanel').querySelector('.panel-head h2').textContent = '做一个自己的冰雪角色';
    $('faceNote').textContent = state.cfg.figure?.canvas ? '完整冰雪角色' : '等待生成角色';
    map?.setHeroVisible(false);
  } else if (chapter === 'map') {
    $('workshopPanel').querySelector('.panel-head h2').textContent = '我的旅行伙伴';
    $('faceNote').textContent = '已准备出发';
  }
}

function setMapExpanded(expanded) {
  const wrap = document.querySelector('#mapPanel .map-wrap');
  wrap.classList.toggle('map-expanded', expanded);
  $('fitBtn').textContent = expanded ? '⤡' : '⤢';
  $('fitBtn').title = expanded ? '退出全图' : '看全图';
  $('fitBtn').setAttribute('aria-label', $('fitBtn').title);
  $('fitBtn').setAttribute('aria-pressed', String(expanded));
  requestAnimationFrame(() => { map.resize(); map.fit(); });
}

async function turnBookPage(label, halfway, direction = 'forward') {
  if (bookTurning) return false;
  bookTurning = true;
  const layer = $('bookFlip');
  const volume = layer.querySelector('.book-flip-volume');
  const leaf = layer.querySelector('.book-flip-leaf');
  const shade = layer.querySelector('.book-flip-shade');
  const current = document.body.dataset.book;
  const names = { creator:'01 · 我的角色', map:'02 · 赛事地图', detail:'03 · 地点手记' };
  layer.dataset.direction = direction;
  $('bookFlipFrom').textContent = names[current] || '长春 2027 大冬会冰雪漫游';
  $('bookFlipFromNumber').textContent = current === 'detail' ? '03 / PLACE NOTES' : current === 'map' ? '02 / CITY MAP' : '01 / CHARACTER';
  $('bookFlipLabel').textContent = label;
  $('bookFlipToNumber').textContent = label.startsWith('03') ? '03 / PLACE NOTES' : label.startsWith('02') ? '02 / CITY MAP' : '01 / CHARACTER';
  $('bookFlipLeafTitle').textContent = names[current] || '长春 2027 大冬会冰雪漫游';
  $('bookFlipLeafNumber').textContent = $('bookFlipFromNumber').textContent;
  $('bookFlipCaption').textContent = label.startsWith('03') ? '抵达之后，读一页关于赛场与城市的故事。' : label.startsWith('02') ? '让角色走进冰雪赛场，继续这段大冬会旅程。' : '重新整理你的旅行伙伴，再一起出发。';
  layer.hidden = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const oldPage = current === 'detail' ? document.querySelector('.book-detail-spread') : $('bookSpread');
  const animations = [];
  let switched = false;
  const switchPage = () => { if (!switched) { switched = true; halfway?.(); } };
  let timer;
  try {
    if (reduced) { switchPage(); return true; }
    const collect = animation => { animations.push(animation); return animation.finished; };
    await Promise.all([
      collect(oldPage.animate([
        { transform:'scale(1)', opacity:1 },
        { transform:'scale(.955)', opacity:.52 },
      ], { duration:260, easing:'cubic-bezier(.32,0,.6,1)', fill:'forwards' })),
      collect(shade.animate([{ opacity:0 },{ opacity:1 }], { duration:300, fill:'forwards' })),
      collect(volume.animate([
        { transform:'scale(1.13) translateY(13px)', opacity:0 },
        { transform:'scale(.84) translateY(0)', opacity:1 },
      ], { duration:300, easing:'cubic-bezier(.25,.05,.28,1)', fill:'forwards' })),
    ]);
    const sign = direction === 'back' ? 1 : -1;
    const duration = 760;
    timer = setTimeout(switchPage, duration * .5);
    await collect(leaf.animate([
      { transform:'rotateY(0deg)', offset:0, easing:'cubic-bezier(.35,.02,.72,.48)' },
      { transform:`rotateY(${sign * 89}deg)`, offset:.5, easing:'cubic-bezier(.26,.58,.35,1)' },
      { transform:`rotateY(${sign * 180}deg)`, offset:1 },
    ], { duration, fill:'forwards' }));
    switchPage();
    oldPage.getAnimations().forEach(animation => { if (animations.includes(animation)) animation.cancel(); });
    const nextPage = document.body.dataset.book === 'detail' ? document.querySelector('.book-detail-spread') : $('bookSpread');
    await Promise.all([
      collect(volume.animate([
        { transform:'scale(.84)', opacity:1 },
        { transform:'scale(1.06)', opacity:0 },
      ], { duration:340, easing:'cubic-bezier(.2,.65,.35,1)', fill:'forwards' })),
      collect(shade.animate([{ opacity:1 },{ opacity:0 }], { duration:340, easing:'ease-out', fill:'forwards' })),
      collect(nextPage.animate([
        { transform:'scale(.955)', opacity:.55 },
        { transform:'scale(1)', opacity:1 },
      ], { duration:340, easing:'cubic-bezier(.16,.73,.32,1)', fill:'forwards' })),
    ]);
    return true;
  } finally {
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    layer.hidden = true;
    bookTurning = false;
  }
}

async function softlyChangeBookPage(target, halfway) {
  if (bookTurning) return false;
  bookTurning = true;
  const current = document.body.dataset.book;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animations = [];
  const play = (element, frames, duration) => {
    const animation = element.animate(frames, { duration, easing:'cubic-bezier(.22,.7,.32,1)', fill:'forwards' });
    animations.push(animation);
    return animation.finished;
  };
  try {
    if (reduced) { halfway(); return true; }
    if (target === 'detail') {
      halfway();
      await play($('bookDetail'), [
        { opacity:0, transform:'translateY(15px) scale(.975)' },
        { opacity:1, transform:'translateY(0) scale(1)' },
      ], 360);
    } else if (current === 'detail') {
      await play($('bookDetail'), [
        { opacity:1, transform:'translateY(0) scale(1)' },
        { opacity:0, transform:'translateY(12px) scale(.98)' },
      ], 250);
      halfway();
    } else {
      const spread = $('bookSpread');
      await play(spread, [
        { opacity:1, transform:'scale(1)' },
        { opacity:.15, transform:'scale(.985)' },
      ], 170);
      halfway();
      animations[0].cancel();
      await play(spread, [
        { opacity:.15, transform:'scale(.985)' },
        { opacity:1, transform:'scale(1)' },
      ], 270);
    }
    return true;
  } finally {
    animations.forEach(animation => animation.cancel());
    bookTurning = false;
  }
}

async function openBook() {
  if (bookTurning || $('bookCover').hidden) return;
  bookTurning = true;
  setBookChapter('creator');
  const cover = $('bookCover');
  const front = cover.querySelector('.cover-leaf');
  const spread = $('bookSpread');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reveal;
  try {
    if (!reduced) {
      await front.animate([
        { transform:'rotateY(0deg)', easing:'cubic-bezier(.32,.03,.7,.43)' },
        { transform:'rotateY(-92deg)', offset:.55, easing:'cubic-bezier(.22,.62,.32,1)' },
        { transform:'rotateY(-165deg)' },
      ], { duration:1050, fill:'forwards' }).finished;
      reveal = spread.animate([
        { transform:'scale(.96)', opacity:.48 },
        { transform:'scale(1)', opacity:1 },
      ], { duration:330, easing:'cubic-bezier(.16,.73,.32,1)', fill:'forwards' });
      await Promise.all([
        cover.animate([{ opacity:1 },{ opacity:0 }],
          { duration:330, easing:'ease-in-out', fill:'forwards' }).finished,
        reveal.finished,
      ]);
    }
    cover.hidden = true;
    window.scrollTo({ top:0, behavior:'instant' });
    map?.resize();
  } finally {
    front.getAnimations().forEach(animation => animation.cancel());
    cover.getAnimations().forEach(animation => animation.cancel());
    reveal?.cancel();
    bookTurning = false;
  }
}

async function startDemo() {
  const button = $('coverDemo');
  const heroButton = $('heroDemo');
  if (button.disabled || heroButton.disabled) return;
  button.disabled = true;
  heroButton.disabled = true;
  try {
    const demo = defaultConfig();
    demo.name = state.cfg.name || '雪道伙伴';
    demo.figure = { canvas: await createReferenceFigure(), outfitKey: outfitKey(demo) };
    state.cfg = demo;
    $('nameInput').value = demo.name;
    applyChange();
    tourEntered = false;
    showcasePresence?.tourEnded();
    map.setHeroVisible(false);
    refreshStageHint();
    renderTabBody();
    mascotGuide?.notify('avatar');
    $('departureNote').textContent = '已选用本地预设角色，无需照片或生图服务。';
    if (!bookCover.hidden) await openBook();
    const entered = await enterTour();
    if (!entered) $('departureNote').textContent = '试玩角色已准备好，点击「带我去游览」即可继续。';
  } catch {
    $('departureNote').textContent = '试玩角色没有加载成功，请刷新页面后重试。';
  } finally {
    button.disabled = false;
    heroButton.disabled = false;
  }
}

function showCover() {
  if (entering || bookTurning) return;
  cancelPendingWalk();
  hideCard();
  tourEntered = false;
  showcasePresence?.tourEnded();
  map?.setHeroVisible(false);
  setBookChapter('cover');
  $('bookCover').hidden = false;
  window.scrollTo({ top:0, behavior:'instant' });
  $('openBook').focus();
}

async function returnToCreator() {
  if (entering || bookTurning || document.body.dataset.book !== 'map') return;
  cancelPendingWalk();
  const switchChapter = () => {
    tourEntered = false;
    showcasePresence?.tourEnded();
    setBookChapter('creator');
    map?.resize();
    $('workshopPanel').scrollIntoView({ behavior:'instant', block:'start' });
  };
  if (fullPageFlips) await turnBookPage('01 · 我的角色', switchChapter, 'back');
  else await softlyChangeBookPage('creator', switchChapter);
}

function cancelPendingWalk() {
  if (!map?.walking) return;
  map.cancelWalk();
  visitPending = false;
  walkVenueId = null;
  $('walkBar').hidden = true;
}

function journeyButton(label, action, primary = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = primary ? 'journey-primary' : 'journey-secondary';
  button.addEventListener('click', action);
  return button;
}

async function followJourney(action, trigger) {
  if (!action) return;
  if (action.type === 'game') { playVenue(state.pendingVenue); return; }
  if (action.type === 'observe') {
    if ($('bookDetail').hidden && state.pendingVenue) {
      $('venueCard').hidden = false;
      await openDetailPage(state.pendingVenue);
    }
    $('detailJourney').querySelector('.detail-journey-observation button')?.focus();
    $('detailJourney').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    return;
  }
  if (action.type === 'quiz') { quiz?.open(trigger || $('quizOpen'), action.ids); return; }
  if (action.type === 'passport') { guideUI?.openPassport(); return; }
  if (action.type === 'place') {
    await turnToPlace(action.id, { travel:true });
  }
}

function renderDetailJourney(venue) {
  const root = $('detailJourney');
  if (!root || !venue) return;
  const plan = journeyForPlace(venue, currentProgress(), state.venues);
  root.replaceChildren();
  const kicker = document.createElement('small');
  kicker.textContent = '吉冰吉雪 · 这一站怎么玩';
  const heading = document.createElement('h3');
  heading.textContent = `${venue.name}的游览清单`;
  const steps = document.createElement('ol');
  const read = document.createElement('li');
  read.textContent = `${state.readNotes.has(venue.id) ? '✓' : '○'} 阅读手记与趣味卡${state.readNotes.has(venue.id) ? ' · 已记录' : ''}`;
  const observe = document.createElement('li');
  observe.textContent = `${state.observedPlaces.has(venue.id) ? '✓' : '○'} ${state.observedPlaces.has(venue.id) ? '观察发现已记录' : '对照照片或插画完成观察发现'}`;
  const activity = document.createElement('li');
  activity.textContent = venue.game ? `${state.medals.has(venue.id) ? '✓' : '○'} ${state.medals.has(venue.id) ? '挑战奖章已收入护照' : '参加场馆挑战，赢取奖章'}` :
    `${plan.quizNeeded ? '○ 完成相关知识题，推进故事任务' : '• 可在地图参加冰雪知识问答'}`;
  const routeNextId = bookManifest?.orderedPlaceIds[bookManifest.orderedPlaceIds.indexOf(venue.id) + 1] || null;
  const next = document.createElement('li');
  next.textContent = routeNextId ? `→ 下一页：${state.venues.find((place) => place.id === routeNextId)?.name || '下一站'}` : '→ 本次路线已到终点，可翻到旅行纪念页。';
  steps.append(read, observe, activity, next);
  root.append(kicker, heading, steps);
  const observation = document.createElement('div');
  observation.className = 'detail-journey-observation';
  const prompt = document.createElement('p');
  prompt.textContent = `观察提示：${venue.fieldNote || '从照片或场馆插画中找一个让你印象深刻的细节。'}`;
  observation.append(prompt);
  if (!state.observedPlaces.has(venue.id)) observation.append(journeyButton('我发现了这个细节', () => {
    state.observedPlaces.add(venue.id);
    saveProgress();
    mascotGuide?.checkQuests();
  }));
  else {
    const done = document.createElement('small');
    done.textContent = '✓ 发现已记入本机手册';
    observation.append(done);
  }
  root.append(observation);
  const visibleQuest = plan.claimableQuest || plan.localQuest;
  if (visibleQuest) {
    const quest = document.createElement('p');
    quest.className = 'detail-journey-quest';
    quest.textContent = `${visibleQuest.status === 'claimable' ? '可领取任务' : '关联任务'}「${visibleQuest.title}」 · ${visibleQuest.done} / ${visibleQuest.total}${visibleQuest.status === 'claimable' ? ' · 可领取' : ''}`;
    root.append(quest);
  }
  const actions = document.createElement('div');
  actions.className = 'journey-actions';
  const nextButton = $('bookNext');
  if (routeNextId) {
    nextButton.hidden = false;
    nextButton.textContent = `下一页 · ${state.venues.find((place) => place.id === routeNextId)?.name || '下一站'} →`;
    nextButton.onclick = () => { void turnToPlace(routeNextId, { travel:true }); };
  } else {
    nextButton.hidden = true;
    const recapButton = $('bookRecap'); recapButton.hidden = false; recapButton.onclick = () => void openBookRecap();
  }
  actions.append(journeyButton(plan.next.label, event => void followJourney(plan.next, event.currentTarget), false));
  actions.append(journeyButton('查看任务护照', () => guideUI?.openPassport()));
  root.append(actions);
}

function renderJourneyContinue(venue) {
  const root = $('journeyContinue');
  if (!root || !venue) return;
  const plan = journeyForPlace(venue, currentProgress(), state.venues);
  root.replaceChildren();
  const copy = document.createElement('div');
  const label = document.createElement('small');
  label.textContent = `已读完 ${venue.name} · 接下来`;
  const nextId = bookManifest?.orderedPlaceIds[bookManifest.orderedPlaceIds.indexOf(venue.id) + 1];
  const reason = document.createElement('strong');
  reason.textContent = nextId ? `下一页：${state.venues.find((place) => place.id === nextId)?.name || '下一站'}` : '本次路线已完成';
  copy.append(label, reason);
  root.append(copy, journeyButton(nextId ? `出发并翻到下一页 · ${state.venues.find((place) => place.id === nextId)?.name || '下一站'}` : '翻到旅行纪念页', () => nextId ? void turnToPlace(nextId, { travel:true }) : void openBookRecap(), true),
    journeyButton('查看任务', () => guideUI?.openPassport()));
  root.hidden = false;
}

async function openDetailPage(venue, { intent = 'preview' } = {}) {
  if (bookTurning) return;
  if (bookManifest && !bookManifest.orderedPlaceIds.includes(venue.id)) {
    bookManifest = buildBookManifest(state.venues, { source:'all' });
    bookSession = saveBookSession(localStorage, { ...(bookSession || {}), source:'all', orderedPlaceIds:bookManifest.orderedPlaceIds }, state.venues.map((place) => place.id), bookManifest);
    renderBookContents();
  }
  if (document.querySelector('#mapPanel .map-wrap').classList.contains('map-expanded')) setMapExpanded(false);
  const token = ++detailOpening;
  const art = $('detailArt');
  activeGalleryVenue = venue;
  const hasGallery = placeGallery.render(venue);
  art.hidden = hasGallery;
  $('detailArtCaption').textContent = hasGallery
    ? '翻看照片，发现地标的另一面。'
    : '开放许可的实景图仍在整理，先用原创场馆插画认识这里。';
  const artCtx = art.getContext('2d');
  if (!hasGallery) {
    artCtx.clearRect(0,0,art.width,art.height);
    drawVenueIllustration(artCtx, venue, 0, 0, art.width, art.height);
  }
  $('detailName').textContent = venue.name;
  mascotGuide?.placeNote(venue);
  $('detailKind').textContent = venue.kind === 'attraction' ? '城市景点 · 地点手记' : '冰雪场馆 · 地点手记';
  $('detailNumber').textContent = `地点 ${String(state.venues.findIndex(item => item.id === venue.id) + 1).padStart(2,'0')} / ${state.venues.length}`;
  const switchChapter = () => {
    if (token !== detailOpening) return;
    $('bookDetail').hidden = false;
    setBookChapter('detail');
    $('bookDetailContent').scrollTop = 0;
  };
  if (fullPageFlips) await turnBookPage('03 · 地点手记', switchChapter);
  else await softlyChangeBookPage('detail', switchChapter);
  if (token === detailOpening) saveCurrentBookPage(getPageForPlace(venue.id), venue.id);
  if (token === detailOpening) $('bookPrevious').focus();
  if (token === detailOpening && !state.readNotes.has(venue.id)) {
    state.readNotes.add(venue.id);
    saveProgress();
  }
  if (token === detailOpening) { renderDetailJourney(venue); syncBookNavigation(); }
  if (intent === 'travel' && token === detailOpening) $('bookDetailContent').scrollTop = 0;
}

async function returnToMap() {
  if (bookTurning || $('bookDetail').hidden) return;
  ++detailOpening;
  const switchChapter = () => {
    $('bookDetail').hidden = true;
    $('venueCard').hidden = true;
    $('mascotPlaceCard').hidden = true;
    setBookChapter('map');
    map?.resize();
  };
  if (fullPageFlips) await turnBookPage('02 · 赛事地图', switchChapter, 'back');
  else await softlyChangeBookPage('map', switchChapter);
  saveCurrentBookPage('world-map');
  if (state.pendingVenue) renderJourneyContinue(state.pendingVenue);
  $('mapPanel').focus({ preventScroll:true });
}

async function openBookRecap() {
  if (bookTurning || bookNavigationBusy) return;
  bookNavigationBusy = true;
  try {
    const previousPageId = bookSession?.currentPageId || 'world-map';
    const switched = () => {
      $('bookDetail').hidden = true;
      $('bookRecapPage').hidden = false;
      $('venueCard').hidden = true;
      setBookChapter('recap');
      renderBookRecap();
    };
    if (fullPageFlips) await turnBookPage('旅行纪念页', switched);
    else await softlyChangeBookPage('recap', switched);
    bookSession = saveBookSession(localStorage, { ...(bookSession || {}), currentPageId:'recap', previousPageId }, state.venues.map((place) => place.id), bookManifest);
    syncBookNavigation();
    $('bookRecapPrevious').focus();
  } finally { bookNavigationBusy = false; }
}

function renderMemorialList(root, entries, emptyText, formatter = (item) => item.name) {
  root.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p'); empty.className = 'memorial-empty'; empty.textContent = emptyText; root.append(empty); return;
  }
  for (const item of entries) { const rendered = formatter(item); if (rendered instanceof Node) root.append(rendered); else { const line = document.createElement('p'); line.textContent = rendered; root.append(line); } }
}

function buildCurrentVisitMemorial() {
  let startedAt = null;
  try { startedAt = JSON.parse(localStorage.getItem(VISIT_SESSION_KEY) || 'null')?.startedAt || null; } catch { /* Optional timestamp. */ }
  return buildVisitMemorialData({
    places: state.venues,
    visited: [...state.visited],
    medals: [...state.medals],
    stickers: [...state.bonusStickers],
    claimedQuests: [...state.claimedQuests],
    knowledgeBadge: state.quizBadge,
    role: state.cfg.figure?.canvas ? { name: state.cfg.name, previewUrl: state.generatedArtworkUrl } : null,
    gameResults: state.gameResults,
    startedAt,
    endedAt: new Date().toISOString(),
  });
}

function renderBookRecap() {
  const memorial = buildCurrentVisitMemorial();
  const count = memorial.visitedPlaces.length;
  $('bookRecapSummary').textContent = count
    ? `这次你走过 ${count} 处地点，收下 ${memorial.medals.length} 枚场馆奖章、${memorial.stickers.length} 张城市贴纸，并完成 ${memorial.claimedQuests.length} 项任务。${memorial.startedAt ? ` 开始于 ${new Date(memorial.startedAt).toLocaleString()}。` : ''}`
    : '这趟旅程刚刚开始，走过的地点和收集的纪念会留在这里。';
  renderMemorialList($('bookRecapPlaces'), memorial.visitedPlaces, '还没有地点记录，下一站等你出发。', (place) => `✓ ${place.name} · 已抵达`);
  renderMemorialList($('bookRecapAchievements'), [...(memorial.knowledgeBadge ? [{ label:'冰雪知识徽章' }] : []), ...memorial.medals.map((item) => ({ label:`场馆奖章 · ${item.name}` })), ...memorial.stickers.map((item) => ({ label:`城市贴纸 · ${item.name}` })), ...memorial.claimedQuests.map((id) => ({ label:`已完成任务 · ${QUESTS.find((quest) => quest.id === id)?.title || id}` }))], '印章与任务记录会在收集后显示。', (item) => `✦ ${item.label}`);
  renderMemorialList($('bookRecapRole'), memorial.role ? [memorial.role] : [], '本次还没有创建角色。', (role) => {
    const line = document.createElement('span'); line.textContent = role.name || '本次的冰雪角色';
    if (role.previewUrl) { const image = document.createElement('img'); image.src = role.previewUrl; image.alt = `${role.name || '本次'}的角色作品`; image.loading = 'lazy'; line.prepend(image); }
    return line;
  });
  renderMemorialList($('bookRecapGames'), memorial.gameResults, '本次还没有小游戏成绩。', (result) => `${result.won ? '✓' : '·'} ${result.name} · ${result.score} ${result.unit}`);
}

function endCurrentVisitSession() {
  if (visitEnding) return false;
  visitEnding = true;
  visitEpoch.invalidate();
  generationController?.abort();
  generationController = null;
  if (activeGenerationJobId) void fetch(`/api/jobs/${activeGenerationJobId}`, { method:'DELETE', keepalive:true }).catch(() => {});
  activeGenerationJobId = null;
  state.generating = false;
  if(state.generatedArtworkUrl) rememberArtwork(localStorage,state.generatedArtworkUrl,{name:state.cfg.name||'我的角色'});
  host?.stop();
  quiz?.close?.();
  map?.cancelWalk?.();
  visitPending = false; tourEntered = false; entering = null;
  clearVisitSessionStorage(localStorage);
  state.visited.clear(); state.medals.clear(); state.bonusStickers.clear(); state.readNotes.clear();
  state.observedPlaces.clear(); state.knowledgeSources.clear(); state.claimedQuests.clear(); state.route = null;
  state.gameResults = []; state.pendingVenue = null; state.activeId = null; state.pendingGeneration = null;
  state.quizBadge = false;
  state.generatedArtworkUrl = null; state.creative = normalizeCreative(DEFAULT_CREATIVE); state.randomLocks = [];
  state.cfg = applyLook(defaultConfig(), LOOKS[0]); photo.source = null;
  map?.setCharacter(state.cfg);
  try { localStorage.setItem(VISIT_SESSION_KEY, JSON.stringify({ status:'ended', endedAt:new Date().toISOString() })); } catch { /* The in-memory handoff remains usable. */ }
  if (map) { map.setProgress(state.visited, state.medals); map.setHeroVisible(false); }
  $('bookRecapPage').hidden = true;
  $('bookDetail').hidden = true;
  $('visitHandoff').hidden = false;
  $('bookSpread').inert = true; $('bookChapterBar').inert = true; $('top').inert = true;
  $('startNewVisit').focus();
  return true;
}

function openVisitEndDialog(trigger) {
  const dialog=$('visitEndDialog');
  if(dialog.open||visitEnding)return;
  visitEndTrigger=trigger;
  dialog.showModal();
}

async function returnFromBookRecap() {
  if (bookTurning || bookNavigationBusy) return;
  const previous = bookManifest && (bookManifest.pages.find((page) => page.id === bookSession?.previousPageId) || resolveAdjacentPage(bookManifest, 'recap', -1));
  if (!previous) return;
  if (previous.type === 'place') {
    const place = state.venues.find((item) => item.id === previous.placeId);
    if (place) { $('bookRecapPage').hidden = true; await openDetailPage(place, { intent:'restore' }); }
  } else {
    $('bookRecapPage').hidden = true;
    if (previous.type === 'cover') { $('bookCover').hidden = false; setBookChapter('cover'); }
    else setBookChapter(previous.type === 'creator' ? 'creator' : 'map');
    saveCurrentBookPage(previous.id);
    if (previous.type === 'map') map?.resize();
  }
}

async function turnToPlace(id, { travel = true } = {}) {
  if (bookNavigationBusy || bookTurning || map?.walkInfo || visitPending) return;
  if (!travel) { previewBookPlace(id); return; }
  const venue = state.venues.find((place) => place.id === id);
  if (!venue) return;
  bookNavigationBusy = true;
  try {
    $('bookTravelName').textContent = venue.name;
    $('bookTravelTransition').hidden = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) await $('bookTravelTransition').animate([{ opacity:0 }, { opacity:1 }, { opacity:1 }], { duration:700, easing:'ease-out' }).finished;
    $('bookTravelTransition').hidden = true;
    $('bookRecapPage').hidden = true;
    $('bookDetail').hidden = true;
    setBookChapter('map');
    map.setHeroVisible(true);
    tourEntered = true;
    state.activeId = venue.id;
    state.pendingVenue = venue;
    walkVenueId = venue.id;
    visitPending = true;
    showcasePresence?.update('traveling', { targetPlaceId: venue.id });
    soundscape.playTravel();
    $('walkBar').hidden = false;
    $('walkText').textContent = `正在前往 ${venue.name}`;
    $('walkFill').style.width = '100%';
    completeArrival(venue);
  } finally { $('bookTravelTransition').hidden = true; bookNavigationBusy = false; }
}

async function animateTourJump(from) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const to = mapCanvas.getBoundingClientRect();
    const landing = map.heroScreen();
    const fly = document.createElement('canvas'); fly.width = 400; fly.height = 520;
    fly.className = 'flight-character'; fly.setAttribute('aria-hidden', 'true');
    const fctx = fly.getContext('2d'); fctx.scale(2,2);
    drawCharacterAt(fctx, state.cfg, 100, 230, 210, { t:0, moving:false });
    const picture = state.cfg.figure.canvas;
    const sourceHeight = Math.min(from.width/picture.width,from.height*1.05/picture.height)*picture.height;
    const initialScale = Math.max(.45,Math.min(1.35,sourceHeight/210));
    const x0 = Math.max(10,Math.min(innerWidth - 210,from.left + from.width/2 - 100));
    const y0 = from.top + from.height*.91 - 230;
    fly.style.left = `${x0}px`; fly.style.top = `${y0}px`;
    fly.style.transform = `scale(${initialScale})`;
    document.body.append(fly);
    const x1 = to.left + landing.x - 100, y1 = to.top + landing.y + landing.height*.1 - 230;
    const dx = x1-x0, dy = y1-y0, endScale = Math.max(.3,landing.height/210);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sourceStage = stage.closest('.stage'); sourceStage.classList.add('departing');
    const shadow = document.createElement('span'); shadow.className = 'flight-shadow';
    shadow.style.left = `${x0+100}px`; shadow.style.top = `${y0+225}px`;
    document.body.append(shadow);
    try {
      const arc = Math.min(160,Math.max(80,Math.abs(dx)*.18+95));
      const scaleAt = p => initialScale+(endScale-initialScale)*p;
      const frames = reduced ? [
        { transform:`translate(0,0) scale(${initialScale})` },
        { transform:`translate(${dx}px,${dy}px) scale(${endScale})` },
      ] : [
        { offset:0, transform:`translate(0,0) scale(${initialScale})`, easing:'cubic-bezier(.24,.8,.28,1)' },
        { offset:.12, transform:`translate(0,9px) scale(${initialScale*1.08},${initialScale*.88})`, easing:'cubic-bezier(.25,.04,.3,1)' },
        { offset:.45, transform:`translate(${dx*.43}px,${dy*.43-arc}px) rotate(-8deg) scale(${scaleAt(.43)})`, easing:'cubic-bezier(.4,0,.68,.55)' },
        { offset:.78, transform:`translate(${dx*.9}px,${dy*.9-arc*.37}px) rotate(5deg) scale(${scaleAt(.9)})`, easing:'cubic-bezier(.22,.75,.3,1)' },
        { offset:.9, transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(${endScale*1.1},${endScale*.83})`, easing:'cubic-bezier(.18,.85,.3,1)' },
        { offset:1, transform:`translate(${dx}px,${dy}px) scale(${endScale})` },
      ];
      const duration = reduced ? 90 : 1110;
      const flight = fly.animate(frames,{ duration, fill:'forwards' });
      const shadowFlight = shadow.animate([
        { offset:0, opacity:.32, transform:'translate(0,0) scale(1)' },
        { offset:.45, opacity:.08, transform:`translate(${dx*.43}px,${dy*.43}px) scale(.55)` },
        { offset:1, opacity:.36, transform:`translate(${dx}px,${dy}px) scale(.8)` },
      ], { duration, easing:'ease-in-out', fill:'forwards' });
      await Promise.all([flight.finished,shadowFlight.finished]);
      tourEntered = true; map.setHeroVisible(true); soundscape.playSuccess();
      showcasePresence?.tourReady();
      const ring = document.createElement('span');ring.className='map-landing-ring';ring.style.left=`${landing.x}px`;ring.style.top=`${landing.y}px`;
      mapCanvas.parentElement.append(ring);setTimeout(()=>ring.remove(),800);
      $('departureNote').textContent = '落地成功！点击右侧地标，角色到达后为你展开介绍。';
      $('mapHint').textContent = '你的分身已就位 · 点击地标开始探索';
      return true;
    } finally { fly.remove();shadow.remove();sourceStage.classList.remove('departing'); }
}

function enterTour() {
  if (entering) return entering;
  if (!state.cfg.figure?.canvas) return Promise.resolve(false);
  entering = (async () => {
    $('enterTour').disabled = true;
    $('departureNote').textContent = '蓄力一下，向长春出发！';
    const from = stage.getBoundingClientRect();
    hideCard(); map.setHeroVisible(false);
    let jump;
    if (document.body.dataset.book !== 'map') {
      await turnBookPage('02 · 赛事地图', () => {
        setBookChapter('map');
        $('mapPanel').scrollIntoView({ behavior:'instant', block:'nearest' });
        map.resize(); map.fit();
        jump = animateTourJump(from);
      });
    } else {
      map.fit();
      jump = animateTourJump(from);
    }
    return await jump;
  })().catch(() => { $('departureNote').textContent = '出发未完成，请再点击一次。'; return false; }).finally(() => { entering = null;refreshStageHint(); });
  return entering;
}

function startWalk(venueId) {
  if (!state.venues.some(v => v.id === venueId)) return;
  if (entering || bookTurning) return;
  $('journeyContinue').hidden = true;
  hideCard();
  if (!tourEntered) {
    if (state.cfg.figure?.canvas) { void enterTour().then(ok => { if(ok) startWalk(venueId); }); }
    else { $('departureNote').textContent = '先在左侧生成你的全身角色，再点击「带我去游览」。'; }
    return;
  }
  const res = map.walkTo(venueId);
  if (!res) return;
  visitPending = true;
  soundscape.playTravel();
  state.activeId = venueId;
  showcasePresence?.update('traveling', { targetPlaceId: venueId });
  walkVenueId = venueId;
  map.setActive(venueId);
  hideCard();
  $('walkBar').hidden = false;
  $('walkText').textContent = `正在前往 ${res.venue.name} · 约 ${Math.ceil(res.duration)} 秒`;
  syncChips();
  if (res.duration === 0) onArrive();
}

function onArrive() {
  const venue = state.venues.find((v) => v.id === walkVenueId);
  if (!venue) return;
  completeArrival(venue);
}

function completeArrival(venue) {
  const firstArrival = !state.visited.has(venue.id);
  showcasePresence?.update('reading', { currentPlaceId: venue.id, targetPlaceId: null });
  if (visitPending) { recordVisit(venue.id); visitPending = false; }
  soundscape.playSuccess();
  $('walkBar').hidden = true;
  state.visited.add(venue.id);
  const exploredCount = state.visited.size;
  guideUI?.advanceOnArrival(venue.id);
  saveProgress();
  map.setProgress(state.visited, state.medals);
  showCard(venue, firstArrival);
  if (exploredCount === state.venues.length) mascotGuide?.notify('all_places_explored');
  else if (exploredCount > 0 && exploredCount % 4 === 0) mascotGuide?.notify('explore_milestone');
  mascotGuide?.checkQuests();
  syncChips();
}

function drawVenueArchitecture(ctx, venue) {
  const w = 128; const h = 128;
  const color = venue.color || '#62B9E8';
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#9BD9F4'); sky.addColorStop(0.68, '#E7F7FF'); sky.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  for (const [x, y, r] of [[18, 18, 1.4], [44, 31, 1], [102, 20, 1.3], [88, 44, 1]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#D9F0FA'; ctx.beginPath();
  ctx.moveTo(0, 78); ctx.lineTo(24, 45); ctx.lineTo(42, 72); ctx.lineTo(72, 38); ctx.lineTo(103, 76); ctx.lineTo(118, 55); ctx.lineTo(128, 68); ctx.lineTo(128, 128); ctx.lineTo(0, 128); ctx.fill();
  ctx.fillStyle = '#F9FDFF'; ctx.fillRect(0, 91, w, 37);
  const type = venue.building?.type;
  ctx.save(); ctx.translate(64, 89);
  const wall = '#D6E8F1';
  if (type === 'ski' || type === 'park') {
    ctx.fillStyle = '#799CB4'; ctx.beginPath(); ctx.moveTo(-59, 17); ctx.lineTo(-38, -10); ctx.lineTo(-18, 8); ctx.lineTo(4, -28); ctx.lineTo(25, 7); ctx.lineTo(44, -15); ctx.lineTo(62, 17); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#F6FCFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-35, 1); ctx.quadraticCurveTo(-2, 15, 8, -20); ctx.stroke();
    for (let i = 0; i < 5; i++) { const x = -51 + i * 25; ctx.fillStyle = i % 2 ? '#397B72' : '#4F9587'; ctx.beginPath(); ctx.moveTo(x, 13); ctx.lineTo(x + 8, -12 - (i % 3) * 4); ctx.lineTo(x + 16, 13); ctx.fill(); }
    if (type === 'park') { ctx.strokeStyle = '#D982A8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-12, -28, 24, -30, 12, 12); ctx.stroke(); }
    else if (venue.building?.lake) { ctx.fillStyle = 'rgba(82,194,216,.8)'; ctx.beginPath(); ctx.ellipse(0, 19, 52, 8, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (type === 'ring' || type === 'stadium') {
    ctx.fillStyle = 'rgba(23,75,105,.2)'; ctx.beginPath(); ctx.ellipse(0, 20, 56, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = wall; ctx.beginPath(); ctx.ellipse(0, 2, 53, 27, 0, 0, Math.PI * 2); ctx.fill();
    const roof = ctx.createLinearGradient(0, -36, 0, 5); roof.addColorStop(0, '#FFFFFF'); roof.addColorStop(1, color);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.ellipse(0, 0, 48, 32, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
    for (let x = -34; x <= 34; x += 17) { ctx.beginPath(); ctx.moveTo(x, -7); ctx.quadraticCurveTo(x * .68, -34, 0, -31); ctx.stroke(); }
    ctx.fillStyle = '#A9D9E8'; ctx.fillRect(-42, 3, 84, 16);
    for (let x = -34; x <= 34; x += 12) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x, 6, 6, 10); }
  } else {
    const rx = type === 'oval-ice' ? 55 : 48; const ry = type === 'oval-ice' ? 24 : 21;
    ctx.fillStyle = wall; ctx.beginPath(); ctx.roundRect(-rx, -2, rx * 2, 34, 8); ctx.fill();
    const roof = ctx.createLinearGradient(0, -ry * 2, 0, 4); roof.addColorStop(0, '#FFFFFF'); roof.addColorStop(1, color);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.ellipse(0, 1, rx, ry, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
    for (let x = -rx + 10; x < rx; x += 12) { ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x * .78, -ry * .75); ctx.stroke(); }
    ctx.fillStyle = 'rgba(85,159,191,.62)'; ctx.fillRect(-rx + 4, 8, rx * 2 - 8, 15);
    for (let x = -rx + 8; x < rx - 4; x += 13) { ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.fillRect(x, 10, 7, 10); }
    if (venue.building?.goals) {
      ctx.strokeStyle = '#E86E68'; ctx.lineWidth = 2.5; ctx.strokeRect(-12, 10, 24, 18);
      ctx.beginPath(); ctx.moveTo(-12, 10); ctx.lineTo(-8, 14); ctx.lineTo(8, 14); ctx.lineTo(12, 10); ctx.stroke();
    } else if (venue.sports?.includes('冰壶')) {
      ctx.strokeStyle = '#E86E68'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 18, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#58B9D2'; ctx.beginPath(); ctx.arc(0, 18, 3.5, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.ellipse(0, 26, 57, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function showCard(venue, firstArrival = !state.visited.has(venue.id), { arrival = true } = {}) {
  $('venueTitle').textContent = venue.name;
  $('venueCity').textContent = `${venue.city} · ${venue.kind === 'attraction' ? '城市景点' : '冰雪场馆'}`;
  const tags = $('venueSport');
  tags.innerHTML = '';
  for (const sport of venue.sports) {
    const span = document.createElement('span');
    span.textContent = sport;
    tags.appendChild(span);
  }
  $('venueAddr').textContent = `📍 ${venue.address}`;
  $('venueTeaser').textContent = venue.teaser || `来到${venue.name}，认识${venue.sports[0]}的魅力。`;
  $('venueDesc').textContent = venue.desc;
  $('placeStory').textContent = venue.story || venue.desc;
  $('placeFieldNote').textContent = `${venue.fieldNote || '留意一个细节，把它收进你的旅行记忆。'}${venue.kind==='attraction'&&state.bonusStickers.has(venue.id)?' ✦ 城市彩蛋贴纸已解锁，记入这页手记。':''}`;
  $('placeCount').textContent = (liveStats?.places.find(p => p.id === venue.id)?.count || 0).toLocaleString();
  const list = $('placeHighlights'); list.replaceChildren();
  for (const text of venue.highlights || []) { const li = document.createElement('li'); li.textContent = text; list.append(li); }
  $('placeArchitecture').textContent = venue.architecture || '';
  $('placeItinerary').textContent = venue.itinerary || '';
  $('placeDuration').textContent = venue.duration || '';
  $('placeSource').href = venue.sourceUrl;
  $('placeSource').textContent = `资料来源 · ${venue.sourceTitle || venue.name} ↗`;
  const icon = $('venueIcon');
  const ictx = icon.getContext('2d');
  drawVenueIllustration(ictx, venue, 0, 0, icon.width, icon.height);
  $('venuePlay').hidden = !venue.game;
  $('venuePlay').textContent = venue.kind==='attraction'?(state.bonusStickers.has(venue.id)?'再玩城市彩蛋':'玩城市彩蛋'):state.medals.has(venue.id) ? '再挑战一次' : '开始场馆挑战';
  $('venueProgress').textContent = venue.kind === 'venue'
    ? (state.medals.has(venue.id) ? '已探索 · 挑战奖章已获得' : '已探索 · 赢得挑战可收集奖章')
    : (state.bonusStickers.has(venue.id)?'已探索 · 城市彩蛋贴纸已收录':'已探索 · 完成城市彩蛋可解锁纪念贴纸');
  $('venuePersonalBest').textContent = venue.kind === 'venue' && state.bestScores[venue.id] !== undefined
    ? `个人最佳：${state.bestScores[venue.id]}` : venue.kind==='attraction'&&state.bonusStickers.has(venue.id)?'✦ 地点纪念贴纸已收入手记':'';
  $('venueCard').hidden = false;
  if (arrival) mascotGuide?.showArrival(venue, firstArrival);
  state.pendingVenue = venue;
  if (document.body.dataset.book === 'map') void openDetailPage(venue);
}

function hideCard() {
  ++detailOpening;
  $('bookDetail').hidden = true;
  if (document.body.dataset.book === 'detail') setBookChapter('map');
  $('venueCard').hidden = true;
  if (tourEntered && !host?.isOpen?.()) showcasePresence?.update('roaming', { targetPlaceId: null });
}

/* ------------------------------------------------------------------ */
/* 摄像头                                                              */
/* ------------------------------------------------------------------ */

let camStream = null;

async function openCamera() {
  $('camSheet').hidden = false;
  $('camTip').textContent = '尽量让背景干净（白墙最好），抠出来更利索';
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    $('camVideo').srcObject = camStream;
  } catch (error) {
    $('camTip').textContent = `打不开摄像头（${error && error.name ? error.name : '被拒绝'}）。用「上传照片」一样能做形象。`;
  }
}

function closeCamera() {
  if (camStream) {
    for (const track of camStream.getTracks()) track.stop();
    camStream = null;
  }
  $('camVideo').srcObject = null;
  $('camSheet').hidden = true;
}

async function shootPhoto() {
  const video = $('camVideo');
  if (!camStream || !video.videoWidth) {
    closeCamera();
    return;
  }
  // 保留摄像头的完整画幅，避免把全身人物裁成头像。
  const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas
    .getContext('2d')
    .drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
  closeCamera();
  await setPhotoSource(canvas);
}

/* ------------------------------------------------------------------ */
/* 小游戏                                                              */
/* ------------------------------------------------------------------ */

let host = null;
let quiz = null;

function initQuiz() {
  quiz = createQuiz($('quizModal'), {
    onFinish: ({ score, total, earnedBadge, correctSources = [] }) => {
      mascotGuide?.quizFinish({ score, total });
      state.quizBest = Math.max(state.quizBest, score);
      state.quizBadge = state.quizBadge || earnedBadge;
      for (const id of correctSources) state.knowledgeSources.add(id);
      saveProgress();
      mascotGuide?.checkQuests();
      syncChips();
    },
  });
}

function initGame() {
  host = createMinigameHost({
    onStart: () => { soundscape.setMode('game'); },
    onRoundStart: (venue) => { showcasePresence?.startGame(venue?.game?.title || venue?.name); },
    onStop: () => { soundscape.setMode('world'); showcasePresence?.endGame(); },
    // 用 getter 而不是直接传 cfg：形象是可以整体替换的（模板脸/清空重做），
    // 传对象会拿到旧的那份，游戏里就还是上一张脸
    getAvatar: () => state.cfg,
    onFinish: (won, result, venue) => {
      showcasePresence?.finishGame(result?.score);
      if (!venue || visitEnding) return;
      if (Number.isFinite(result?.score)) state.gameResults.push({ name:venue.game?.title || venue.name, score:result.score, unit:result.unit || '分', won });
      mascotGuide?.gameFinish(won, venue, result);
      if (venue.id === 'bonus-goalie') {
        state.goalieBest = Math.max(state.goalieBest, Math.floor(result.score || 0));
        result.rewardText = `本局扑救 ${result.score} 次；最佳纪录 ${state.goalieBest} / 5。`;
        saveProgress();
      } else if (won && venue.kind === 'venue') {
        const firstMedal = !state.medals.has(venue.id);
        state.medals.add(venue.id);
        if (Number.isFinite(result.score)) state.bestScores[venue.id] = Math.max(state.bestScores[venue.id] || 0, Math.floor(result.score));
        result.rewardText = firstMedal ? '新的场馆挑战奖章已收入护照。' : '这枚场馆奖章已在护照中；本次最佳成绩也已保存。';
        saveProgress();
        map.setProgress(state.visited, state.medals);
        syncChips();
        $('venuePlay').textContent = '再挑战一次';
        $('venueProgress').textContent = '已探索 · 挑战奖章已获得';
        $('venuePersonalBest').textContent = `个人最佳：${state.bestScores[venue.id]}`;
        soundscape.playSuccess();
      if (firstMedal) { celebrateStamp(venue); mascotGuide?.notify('medal', { place: venue.name }); }
      } else if (venue.kind === 'venue') {
        if (Number.isFinite(result.score)) state.bestScores[venue.id] = Math.max(state.bestScores[venue.id] || 0, Math.floor(result.score));
        result.rewardText = `再试一次，${venue.name}的挑战奖章还等着你。`;
        if (state.bestScores[venue.id] !== undefined) $('venuePersonalBest').textContent = `个人最佳：${state.bestScores[venue.id]}`;
        saveProgress();
      } else if (venue.kind === 'attraction') {
        if(won){state.bonusStickers.add(venue.id);try{localStorage.setItem(BONUS_STICKER_KEY,JSON.stringify([...state.bonusStickers]))}catch{};result.rewardText=`城市彩蛋完成，${venue.name}纪念贴纸已收入地点手记。`;if(state.pendingVenue?.id===venue.id){$('venuePlay').textContent='再玩城市彩蛋';$('venueProgress').textContent='已探索 · 城市彩蛋贴纸已收录';$('venuePersonalBest').textContent='✦ 地点纪念贴纸已收入手记';}}
        else result.rewardText='再观察一次线索；完成后会解锁这处地点的纪念贴纸。';
      }
      soundscape.setMode('world');
      mascotGuide?.checkQuests();
      void result;
    },
  });
  if (!onlineInviteRefresh) {
    void refreshOnlineRaceInvites();
    onlineInviteRefresh = setInterval(() => void refreshOnlineRaceInvites(), 4000);
  }
}

function playVenue(venue) {
  if (!venue || !venue.game || !host) return;
  if (venue.id !== 'bonus-goalie') state.pendingVenue = venue;
  mascotGuide?.gameStart(venue);
  host.start(venue);
}

let onlineInviteRefresh = null;
async function refreshOnlineRaceInvites() {
  const root = $('onlineRaceInvites');
  if (!root) return;
  try {
    const response = await fetch('/api/online-race/rooms');
    if (!response.ok) return;
    const { rooms = [] } = await response.json();
    map?.setOnlineInvites(rooms);
    root.replaceChildren();
    if (!rooms.length) { root.hidden = true; return; }
    const title = document.createElement('h3');
    title.textContent = '⚔ 地图 PK 邀请';
    root.append(title);
    for (const room of rooms) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'online-race-invite';
      const name = document.createElement('span');
      const venueName=state.venues.find((place)=>place.id===(room.venueId||'wuhuan'))?.name||'场馆';
      name.textContent = `${room.hostName} · ${venueName} PK`;
      const join = document.createElement('b');
      join.textContent = '加入 →';
      button.append(name, join);
      button.addEventListener('click', () => joinOnlineRaceInvite(room));
      root.append(button);
    }
    root.hidden = false;
  } catch { /* 联机服务离线时地图照常可用 */ }
}

function joinOnlineRaceInvite(room) {
  const venue=state.venues.find((place)=>place.id===(room?.venueId||'wuhuan'));
  if(!venue||!host||!room?.roomCode)return;
  state.pendingVenue=venue;mascotGuide?.gameStart(venue);host.openOnlineRoom?.(venue,room.roomCode);
}

function initShowcaseParticipation() {
  showcasePresence = createShowcaseParticipation({
    getState: () => ({
      tourEntered,
      currentPlaceId: state.activeId || null,
      targetPlaceId: map?.walkInfo ? state.activeId || null : null,
      position: map?.heroPosition || null,
      displayName: state.cfg.name || $('nameInput')?.value || '',
    }),
    getAvatar: () => state.cfg.figure?.canvas || null,
  });
  const optIn = $('showcaseOptIn');
  if (optIn) {
    optIn.checked = showcasePresence.isParticipationEnabled();
    showcasePresence.setParticipation(optIn.checked);
    optIn.addEventListener('change', (event) => showcasePresence.setParticipation(event.currentTarget.checked));
  }
}

function celebrateStamp(venue) {
  const burst = document.createElement('div');
  burst.className = 'snow-burst';
  burst.setAttribute('aria-label', `获得 ${venue.name} 纪念章`);
  const colors = ['#75e6e3', '#ffe36f', '#ff718c', '#9a7cff', '#ffffff'];
  for (let i = 0; i < 22; i += 1) {
    const flake = document.createElement('i');
    flake.textContent = i % 3 === 0 ? '★' : '❄';
    flake.style.setProperty('--x', `${(i / 21) * 100}%`);
    flake.style.setProperty('--drift', `${-70 + (i * 47) % 140}px`);
    flake.style.setProperty('--delay', `${(i % 7) * 45}ms`);
    flake.style.setProperty('--color', colors[i % colors.length]);
    burst.appendChild(flake);
  }
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 2200);
}

/* ------------------------------------------------------------------ */
/* 主循环                                                              */
/* ------------------------------------------------------------------ */

let clock = 0;
let last = 0;

function updateWalkBar() {
  const info = map.walkInfo;
  if (info) $('walkFill').style.width = `${Math.round(info.progress * 100)}%`;
  // 提示语、行走进度条、场馆卡片都在地图底部，会互相压；同一时刻只留一个
  const overlays = !$('venueCard').hidden ? 'card' : info ? 'walk' : 'hint';
  if (overlays !== lastOverlay) {
    lastOverlay = overlays;
    $('mapHint').hidden = overlays !== 'hint';
  }
}

let lastOverlay = '';

function loop(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  clock += dt;
  drawStage(clock);
  drawHero(clock);
  const arrived = map.update(dt);
  updateWalkBar();
  map.draw();
  if (arrived) onArrive();
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ */
/* 事件接线                                                            */
/* ------------------------------------------------------------------ */

function wireEvents() {
  syncPageFlipToggle();
  $('pageFlipToggle').addEventListener('click', () => {
    fullPageFlips = !fullPageFlips;
    try { localStorage.setItem(PAGE_FLIP_KEY, String(fullPageFlips)); } catch { /* private browsing */ }
    syncPageFlipToggle();
  });
  $('openBook').addEventListener('click', () => void openBook());
  $('coverDemo').addEventListener('click', () => void startDemo());
  $('heroDemo').addEventListener('click', () => void startDemo());
  $('backToCover').addEventListener('click', showCover);
  $('editCharacter').addEventListener('click', () => void returnToCreator());
  $('backToMap').addEventListener('click', () => void returnToMap());
  $('bookContentsOpen').addEventListener('click', openBookContents);
  $('bookContentsClose').addEventListener('click', () => $('bookContentsDialog').close());
  $('mapBookmark').addEventListener('click', () => { bookSession = saveBookSession(localStorage, { ...(bookSession || {}), viewMode:'free-map', currentPageId:'world-map' }, state.venues.map((place) => place.id), bookManifest); $('bookRecapPage').hidden = true; if (!$('bookDetail').hidden) void returnToMap(); else { setBookChapter('map'); map?.resize(); $('mapPanel').focus({ preventScroll:true }); } });
  $('bookContentsOpenDetail').addEventListener('click', openBookContents);
  $('bookPrevious').addEventListener('click', () => {
    const id = bookSession?.currentPageId;
    const placeId = id?.startsWith('place:') ? id.slice(6) : null;
    const index = bookManifest?.orderedPlaceIds.indexOf(placeId) ?? -1;
    if (index > 0) previewBookPlace(bookManifest.orderedPlaceIds[index - 1]);
    else void returnToMap();
  });
  $('bookNext').addEventListener('click', () => {
    const placeId = bookSession?.currentPageId?.slice(6);
    const nextId = bookManifest?.orderedPlaceIds[bookManifest.orderedPlaceIds.indexOf(placeId) + 1];
    if (nextId) void turnToPlace(nextId, { travel:true });
  });
  $('bookRecap').addEventListener('click', () => void openBookRecap());
  $('bookRecapPrevious').addEventListener('click', () => void returnFromBookRecap());
  $('bookEndVisit').addEventListener('click', (event) => openVisitEndDialog(event.currentTarget));
  $('endVisitFromMap').addEventListener('click', () => void openBookRecap());
  $('visitEndDialog').addEventListener('close', () => {
    if ($('visitEndDialog').returnValue === 'confirm') endCurrentVisitSession();
    else if (visitEndTrigger?.isConnected) visitEndTrigger.focus();
    visitEndTrigger=null;
  });
  $('startNewVisit').addEventListener('click', (event) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.disabled = true;
    try { localStorage.setItem(VISIT_SESSION_KEY, JSON.stringify({ status:'active', startedAt:new Date().toISOString() })); } catch { /* Reload still creates an in-memory clean session. */ }
    location.reload();
  });
  $('bookContinueExplore').addEventListener('click', () => {
    bookSession = saveBookSession(localStorage, { ...(bookSession || {}), source:'all', viewMode:'guided', currentPageId:'world-map', orderedPlaceIds:state.venues.map((place) => place.id) }, state.venues.map((place) => place.id), bookManifest);
    $('bookRecapPage').hidden = true; rebuildBookManifest(); setBookChapter('map'); $('mapPanel').focus({ preventScroll:true });
  });
  $('bookRecapMap').addEventListener('click', () => { $('bookRecapPage').hidden = true; $('mapBookmark').click(); });
  $('beginBookJourney').addEventListener('click', () => {
    const firstId = bookManifest?.orderedPlaceIds.find((id) => !state.route?.completed?.includes(id)) || bookManifest?.orderedPlaceIds[0];
    if (firstId) void turnToPlace(firstId, { travel:true });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (document.querySelector('#mapPanel .map-wrap').classList.contains('map-expanded')) setMapExpanded(false);
    else if ($('bookContentsDialog').open) $('bookContentsDialog').close();
    else if (!$('bookDetail').hidden && $('mg').hidden) void returnToMap();
  });
  $('fileInput').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    await setPhotoSource(await readImage(file));
  });

  // 拖拽上传：桌面上比点两次按钮顺手
  const stageEl = document.querySelector('.stage');
  stageEl.addEventListener('dragover', (event) => event.preventDefault());
  stageEl.addEventListener('drop', async (event) => {
    event.preventDefault();
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) await setPhotoSource(await readImage(file));
  });

  $('camShot').addEventListener('click', shootPhoto);
  $('camCancel').addEventListener('click', closeCamera);

  let cutTimer = 0;
  $('tolRange').addEventListener('input', (event) => {
    photo.tolerance = Number(event.target.value);
    clearTimeout(cutTimer);
    cutTimer = setTimeout(runCut, 200);
  });
  $('radiusRange').addEventListener('input', (event) => {
    photo.frame.r = Number(event.target.value) / 100;
    renderEditor();
    refreshPreview();
  });
  $('brushRange').addEventListener('input', (event) => {
    photo.brushSize = Number(event.target.value);
  });
  for (const btn of document.querySelectorAll('.brush-row .chip')) {
    btn.addEventListener('click', () => {
      setBrush(photo.brush === btn.dataset.mode ? null : btn.dataset.mode);
      $('editorTip').textContent = photo.brush
        ? '在照片上涂抹修改，再点一次取消'
        : '拖动圆圈移动取景框，拖边缘缩放';
    });
  }
  $('editorReset').addEventListener('click', () => {
    photo.frame = { ...(photo.guess || { cx: 0.5, cy: 0.2, r: 0.19 }) };
    photo.tolerance = 40;
    $('tolRange').value = '40';
    $('radiusRange').value = String(Math.round(photo.frame.r * 100));
    setBrush(null);
    runCut();
  });
  $('editorRetry').addEventListener('click', () => {
    $('photoSheet').hidden = true;
    $('fileInput').click();
  });
  $('editorCancel').addEventListener('click', () => {
    $('photoSheet').hidden = true;
  });
  $('editorConfirm').addEventListener('click', () => {
    const sticker = photo.face || buildFace();
    if (!sticker) return;
    state.cfg.face = {
      kind: 'photo',
      fromFigure: false,
      canvas: sticker.canvas,
      content: sticker.content, // 脸在贴纸里的实际范围，绘制端按它自适应缩放
      fit: normalizeFaceFit(null),
      skin: sticker.stats.skin || '#F3C9A8',
      preset: null,
    };
    state.cfg.figure = null;
    // 发色也顺手取自照片：否则默认棕色头发和一头黑发的人拼在一起会很怪
    if (sticker.stats.hair) state.cfg.colors.hair = sticker.stats.hair;
    $('photoSheet').hidden = true;
    applyChange();
    renderTabBody();
    selectTab('photo');
  });

  $('nameInput').addEventListener('input', (event) => {
    state.cfg.name = event.target.value.slice(0, 8);
    applyChange();
  });

  $('startBtn').addEventListener('click', () => {
    $('workshopPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('musicBtn').addEventListener('click', async () => {
    const on = await soundscape.setEnabled(!soundscape.enabled);
    const button = $('musicBtn');
    button.setAttribute('aria-pressed', String(on));
    button.innerHTML = on ? '<span>♫</span> 音乐开启' : '<span>♫</span> 开启音乐';
    if (on) soundscape.playSuccess();
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('button, .chip, .preset')) soundscape.playUi();
  });
  $('helpBtn').addEventListener('click', () => {
    $('helpSheet').hidden = false;
  });
  $('helpClose').addEventListener('click', () => {
    $('helpSheet').hidden = true;
  });

  $('zoomIn').addEventListener('click', () => map.zoomBy(1.25));
  $('zoomOut').addEventListener('click', () => map.zoomBy(0.8));
  $('fitBtn').addEventListener('click', () => setMapExpanded(!document.querySelector('#mapPanel .map-wrap').classList.contains('map-expanded')));
  $('venueClose').addEventListener('click', hideCard);
  $('venuePlay').addEventListener('click', () => playVenue(state.pendingVenue));
  $('goalieOpen').addEventListener('click', () => playVenue({
    id: 'bonus-goalie', name: '冰球门神反应挑战', kind: 'bonus',
    game: { engine: 'goalie', title: '冰球门神反应挑战', subtitle: '五次射门，读轨迹并扑救三球即可完成', icon: '🥅', params: {} },
  }));
  $('quizOpen').addEventListener('click', (event) => quiz?.open(event.currentTarget));
  $('enterTour').addEventListener('click', () => void enterTour());
  for (const btn of document.querySelectorAll('[data-filter]')) btn.addEventListener('click', () => {
    const filter = btn.dataset.filter; map.setFilter(filter); hideCard();
    for (const b of document.querySelectorAll('[data-filter]')) b.setAttribute('aria-pressed',String(b === btn));
    for (const chip of document.querySelectorAll('.chip[data-kind]')) chip.hidden = filter !== 'all' && chip.dataset.kind !== filter;
  });

  window.addEventListener('resize', () => {
    syncMapSidebar();
    requestAnimationFrame(() => map.resize());
  });
  window.addEventListener('resize', () => refreshPreview(true));
}

async function readImage(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* 某些格式 createImageBitmap 不认，退回下面那条路 */
    }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* 启动                                                                */
/* ------------------------------------------------------------------ */

async function boot() {
  let storedVisit = null;
  try { storedVisit = JSON.parse(localStorage.getItem(VISIT_SESSION_KEY) || 'null'); } catch { /* Start a clean in-memory visit. */ }
  visitEnding = storedVisit?.status === 'ended';
  visitStartedAt = visitEnding ? null : (typeof storedVisit?.startedAt === 'string' ? storedVisit.startedAt : new Date().toISOString());
  if (!visitEnding && storedVisit?.status !== 'active') {
    try { localStorage.setItem(VISIT_SESSION_KEY, JSON.stringify({ status:'active', startedAt:visitStartedAt })); } catch { /* Optional session timestamp. */ }
  }
  const saved = loadConfig();
  let preparedReferenceByDefault = false;
  if (saved) {
    state.cfg = saved;
    // 旧版缓存里的头像不再作为人物渲染；已有全身作品会在画布就绪后恢复。
    state.cfg.face = defaultConfig().face;
  }

  // 未上传照片、也没有保存的全身角色时，直接把风格参考图作为真实默认角色。
  // 这样舞台、地图、跳转动画与小游戏使用的是同一位冰雪伙伴，而非另画一个简化模板。
  if (!state.cfg.figure && state.cfg.face.kind === 'none' && !state.cfg.face.canvas) {
    try {
      const figure = await createReferenceFigure();
      state.cfg.figure = { canvas: figure, outfitKey: outfitKey(state.cfg) };
      state.cfg.name = state.cfg.name || '雪道伙伴';
      preparedReferenceByDefault = true;
    } catch {
      // 网络或素材暂时不可用时仍保留原有可编辑模板角色。
    }
  }

  previewCanvas.width = 128;
  previewCanvas.height = 128;
  $('nameInput').value = state.cfg.name || '';

  buildTabs();
  renderLooks();
  renderTabBody();
  refreshStageHint();

  const [venuesPayload, appConfig, mapLayout] = await Promise.all([
    fetch('/api/places').then((r) => { if (!r.ok) throw new Error('地点信息加载失败，请检查服务后刷新'); return r.json(); }),
    // 形象是纯本地的，服务端的风格配置只是"有就用"，挂了也不影响
    fetch('/api/config').then((r) => r.json()).catch(() => null),
    fetchMapLayout().catch(() => null),
  ]);
  if (mapLayout) applyMapLayout(mapLayout);
  state.venues = venuesPayload.places || [];
  loadProgress();
  const allowedPlaceIds = state.venues.map((place) => place.id);
  const initialManifest = buildBookManifest(state.venues, { orderedPlaceIds: state.route?.ids || recommendItinerary(state.venues, { mode:state.guideMode, time:'60' }, currentProgress()).ids, source:state.route ? 'route' : 'recommended' });
  bookSession = loadBookSession(localStorage, allowedPlaceIds, initialManifest);
  bookManifest = initialManifest;
  rebuildBookManifest();
  $('mapNote').textContent = '10 座场馆 · 6 处景点';
  $('placeTotal').textContent = state.venues.length;
  state.styles = (appConfig && appConfig.styles) || [];
  state.providers = appConfig?.providers || [];
  state.providerId = appConfig?.provider?.active || null;
  // 当前流程固定生成可抠图的全身冰雪手办，不从旧风格配置切回头像模式。
  state.styleId = 'avatar';
  // 风格配置是异步拿到的；必须在这里重绘照片页，否则首次加载可能只有标题没有风格按钮。
  renderTabBody();

  buildStamps();
  renderBookContents();
  buildChips();
  map = createMapView(mapCanvas, { venues: state.venues, onPick: inspectPlace, onOnlineInvite:joinOnlineRaceInvite, heroVisible: false });
  initShowcaseParticipation();
  $('bookDetailContent').append($('venueCard'));
  map.setCharacter(state.cfg);
  map.setProgress(state.visited, state.medals);
  mascotGuide = createMascotGuide({ mount: document.getElementById('mascotGuideMap'), getProgress: currentProgress,
    getPlaces: () => state.venues, onAction: (action) => {
      if (action.type === 'open_workshop') { if (!document.getElementById('bookCover').hidden) void openBook(); else void returnToCreator(); }
      else if (action.type === 'enter_tour') { if (!state.cfg.figure?.canvas) void startDemo(); else void enterTour(); }
      else if (action.type === 'open_passport') guideUI?.openPassport();
      else if (action.type === 'open_route') guideUI?.openRoute();
      else if (action.type === 'open_place_note' && action.placeId) inspectPlace(action.placeId);
      else if (action.type === 'start_current_game') playVenue(state.venues.find((place) => place.id === action.placeId) || state.pendingVenue);
      else if (action.type === 'randomize_avatar') $('workshopPanel').scrollIntoView({ behavior:'smooth', block:'start' });
      else if (action.type === 'open_secret_collection') openPassportCollection();
    } });
  mascotGuide.initialCover();
  guideUI = createGuideUI({ places: state.venues, getProgress: currentProgress, setProgress: setGuideProgress,
    onNavigate: inspectPlace, onQuiz: (sourceIds) => quiz?.open($('passportBtn'), sourceIds), onCard: exportPassport,
    onRouteChange: (route) => mascotGuide?.routeChanged(route), onPassportOpen: () => mascotGuide?.passportOpen(),
    onQuestClaimed: (questId) => mascotGuide?.questClaimed(questId), onWorkshop: () => {
      if(!$('bookCover').hidden)void openBook(); else void returnToCreator();
    } });
  setBookChapter('cover');
  initGame();
  initQuiz();
  wireEvents();
  $('visitHandoff').hidden = !visitEnding;
  if (visitEnding) {
    $('bookCover').hidden = true;
    $('bookSpread').inert = true; $('bookChapterBar').inert = true; $('top').inert = true;
  }
  connectStats(data => {
    liveStats = data; map.setCounts(data.places);
    $('totalVisits').textContent = data.total.toLocaleString();
    $('todayVisits').textContent = data.todayTotal.toLocaleString();
    if(state.pendingVenue) $('placeCount').textContent = (data.places.find(p => p.id === state.pendingVenue.id)?.count || 0).toLocaleString();
  }, text => { $('statsStatus').textContent = text; });

  resolveFaceImage(state.cfg, () => {
    refreshStageHint();
    map.setCharacter(state.cfg);
    if (state.generatedArtworkUrl) {
      applyGeneratedFigure(state.generatedArtworkUrl).catch(() => {
        state.generatedArtworkUrl = null;
        try { localStorage.removeItem(ARTWORK_KEY); } catch { /* private browsing */ }
        renderTabBody();
        setGenStatus('旧作品带有场景或无法干净抠图，请重新生成完整角色。', undefined);
      });
    }
  });

  const params = new URLSearchParams(location.search);
  const preset = params.get('preset');
  if (preset) {
    const found = PRESETS.find((p) => p.id === preset);
    if (found) {
      state.cfg = presetConfig(found, state.cfg);
      map.setCharacter(state.cfg);
      refreshStageHint();
    }
  }

  $('loading').classList.add('hidden');
  if (preparedReferenceByDefault) $('departureNote').textContent = '已为你准备好风格参考人物，无需照片；点击「带我去游览」即可出发。';
  const restoreId = bookSession?.currentPageId?.startsWith('place:') ? bookSession.currentPageId.slice(6) : null;
  const restorePlace = restoreId && state.venues.find((place) => place.id === restoreId);
  if (restorePlace && state.cfg.figure?.canvas) {
    tourEntered = true;
    state.pendingVenue = restorePlace; state.activeId = restorePlace.id;
    map.setHeroVisible(true); map.setActive(restorePlace.id); setBookChapter('detail'); showCard(restorePlace, false, { arrival:false });
    $('venueCard').hidden = true;
    await openDetailPage(restorePlace, { intent:'restore' });
  }
  if (document.body.dataset.book === 'cover') window.scrollTo({ top:0, behavior:'instant' });
  requestAnimationFrame(loop);

  const venueId = params.get('venue');
  if (state.venues.some(v => v.id === venueId)) {
    state.activeId = venueId; map.setActive(venueId); syncChips();
  }
}

/* 给自检工具用的钩子（tools/browser-check.js 会调） */
window.__play = {
  walkTo: (id, instant) => {
    walkVenueId = id;
    state.activeId = id;
    map.setActive(id);
    if (instant) {
      map.walkTo(id, { instant: true });
      onArrive();
    } else {
      startWalk(id);
    }
  },
  game: () => playVenue(state.pendingVenue),
  closeGame: () => host && host.stop(),
  photo: async (source) => setPhotoSource(source),
  openEditor: () => openEditor(),
  generate: () => startGenerate().catch(reportGenerateError),
  // 自检用：把一个已有结果 URL 当成生成结果走一遍（不重复调 API）
  applyGenerated: (url) => applyGeneratedFigure(url),
  enterTour: () => enterTour(),
  inspect: (id) => inspectPlace(id),
  setTolerance: (value) => {
    photo.tolerance = value;
    $('tolRange').value = String(value);
    runCut();
  },
  confirmPhoto: () => $('editorConfirm').click(),
  showFace: (on) => {
    state.showFace = on !== false;
    return Boolean(state.cfg.face.canvas);
  },
  sticker: () =>
    state.cfg.face.canvas
      ? { content: state.cfg.face.content, side: state.cfg.face.canvas.width, skin: state.cfg.face.skin }
      : null,
  state: () => ({
    venues: state.venues.length,
    tourEntered,
    entering: Boolean(entering),
    figure: Boolean(state.cfg.figure?.canvas),
    totalVisits: liveStats?.total ?? null,
    active: state.activeId,
    visited: [...state.visited],
    medals: [...state.medals],
    stamps: [...state.medals],
    bestScores: { ...state.bestScores },
    guideMode: state.guideMode,
    route: state.route,
    readNotes: [...state.readNotes],
    observedPlaces: [...state.observedPlaces],
    claimedQuests: [...state.claimedQuests],
    face: state.cfg.face.kind,
    hat: state.cfg.parts.hat,
    coat: state.cfg.parts.coat,
    guess: photo.guess || null,
    gen: state.genDebug || null,
    map: map ? map.debug() : null,
  }),
};

boot().catch((error) => {
  $('loadingText').textContent = `启动失败：${error.message}`;
});

