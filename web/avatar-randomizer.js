import { CREATIVE_GROUPS, DEFAULT_CREATIVE, normalizeCreative } from './creative-config.js';

const RECENT_KEY = 'cc2027:avatar-randomizer-recent:v1';
const OMIT = new Set(['preserve', 'none', 'random', 'custom-outfit']);
const BONUS = {
  outfit: {
    'hanfu-illusionist':['hanfu','wuxia-traveler','stage-magician'], 'moon-rabbit':['hanfu','mascot-kigurumi'],
    'cosplay-hero':['cosplay-armor','stage-magician','idol-stage'], 'dream-career':['field-researcher','dream-chef','astronaut-coverall'],
    'cloud-chef':['dream-chef','mascot-kigurumi'], 'deep-sea-mail':['polar-suit','tech-suit'], 'mecha-pilot':['astronaut-coverall','tech-suit'],
    'magical-idol':['idol-stage','stage-magician'], 'time-runner':['field-researcher','tech-suit'], 'dino-pal':['mascot-kigurumi','animal-hood'],
    'animal-guardian':['mascot-kigurumi','royal-cape'], 'tiny-villain':['witch-cape','gothic-dress'], 'forest-mushroom':['mascot-kigurumi','plush-suit'],
  },
  accessories: {
    'hanfu-illusionist':['jade-fan','brush-talisman','hanfu-hairpin'], 'moon-rabbit':['jade-fan','plush-rabbit','tiny-bouquet'],
    'cosplay-hero':['crystal-orb','toy-robot','gear-drone'], 'dream-career':['camera','stethoscope','chef-whisk'],
    'cloud-chef':['chef-whisk','cloud-companion','tiny-bouquet'], 'deep-sea-mail':['shell-mailbag','plush-penguin','crystal-orb'],
    'mecha-pilot':['gear-drone','toy-robot','light-band'], 'magical-idol':['mini-guitar','moon-wand','light-band'],
    'time-runner':['camera','magic-book','gear-drone'], 'dino-pal':['dino-buddy','plush-toy'], 'animal-guardian':['plush-fox','plush-cat','dino-buddy'],
    'tiny-villain':['plush-bat','magic-book','crystal-orb'], 'forest-mushroom':['cloud-companion','tiny-bouquet','plush-fox'],
  },
};
const SPORT_GEAR = {
  ski:['mini-skis'], 'cross-country':['mini-skis'], snowboard:[], skate:[], 'short-track':[], 'speed-skating':[],
  hockey:['mini-stick'], curling:['mini-curling'], freestyle:['mini-skis'], aerials:['mini-skis'],
  'winter-run':['backpack'], 'snow-adventure':['backpack'], leisure:[], 'custom-sport':[], character:[],
};
const SPORT_POSES = {
  ski:['ski-sprint','jump','champion','wave'], snowboard:['jump','peace','champion','wave'], skate:['spin','jump','champion','wave'],
  hockey:['hockey-shot','champion','thumbs-up','wave'], curling:['curling-throw','wave','champion','peace'],
  'short-track':['ski-sprint','jump','champion'], 'speed-skating':['ski-sprint','jump','champion'],
  'cross-country':['ski-sprint','wave','champion'], freestyle:['jump','ski-sprint','champion'], aerials:['jump','champion'],
  'winter-run':['standing','wave','peace','jump'], 'snow-adventure':['wave','snowball','peace','plush-hug'],
  leisure:['standing','peace','wave','snowball'], 'custom-sport':['standing','wave','peace','jump'],
  character:['standing','peace','wave','plush-hug','champion','snowball'],
};
const STYLE_IDS = new Set(CREATIVE_GROUPS.style.map((item) => item.id));

export function createSeededRandom(seed = 1) {
  let state = Number(seed) >>> 0;
  const splitmix = () => {
    let z = (state += 0x9e3779b9) >>> 0;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  };
  let a = splitmix(), b = splitmix(), c = splitmix(), d = splitmix();
  return () => {
    const result = Math.imul(((Math.imul(b, 5) << 7) | (Math.imul(b, 5) >>> 25)), 9) >>> 0;
    const t = b << 9;
    c ^= a; d ^= b; b ^= c; a ^= d; c ^= t; d = ((d << 11) | (d >>> 21)) >>> 0;
    return result / 4294967296;
  };
}

export function createRandomSeed() {
  try {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0];
  } catch {
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }
}

const randomUnit = (random) => Math.min(.999999999, Math.max(0, Number(random()) || 0));
const shuffled = (items, random) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomUnit(random) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const sample = (items, count, random) => shuffled(items, random).slice(0, count);
function readRecent() {
  try { const value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function signature(config) {
  return ['style','sport','theme','scene','outfit','hairstyle','headwear','expression','pose','palette','material','composition']
    .map((key) => config[key]).join('|') + '|' + [...(config.accessories || [])].sort().join(',') + '|' + [...(config.effects || [])].sort().join(',');
}
const eligible = (group) => CREATIVE_GROUPS[group].filter((item) => !OMIT.has(item.id));
function pick(group, random, { current, recentValues = new Set(), prefer = [], all = false } = {}) {
  let options = eligible(group);
  if (!all && options.length > 4) {
    const fresh = options.filter((item) => !recentValues.has(item.id));
    if (fresh.length >= Math.min(4, options.length)) options = fresh;
  }
  if (options.length > 1 && current) {
    const alternatives = options.filter((item) => item.id !== current);
    if (alternatives.length) options = alternatives;
  }
  // Keep themed options in the full catalog: a theme adds a noticeable chance, not a tiny closed pool.
  const preferred = options.filter((item) => prefer.includes(item.id));
  if (preferred.length && randomUnit(random) < (group === 'outfit' ? .72 : .52)) options = preferred;
  return options[Math.floor(randomUnit(random) * options.length)]?.id || eligible(group)[0]?.id;
}
function pickMany(group, count, random, { recentValues = new Set(), preferred = [] } = {}) {
  let options = eligible(group);
  if (options.length > 5) {
    const fresh = options.filter((item) => !recentValues.has(item.id));
    if (fresh.length >= count) options = fresh;
  }
  const selected = [];
  for (let i = 0; i < count && options.length; i++) {
    const pool = options.filter((item) => !selected.includes(item.id));
    const themed = pool.filter((item) => preferred.includes(item.id));
    const choicePool = themed.length && randomUnit(random) < .55 ? themed : pool;
    const choice = choicePool[Math.floor(randomUnit(random) * choicePool.length)];
    selected.push(choice.id);
  }
  return selected;
}

export function weightedPick(items, { random = Math.random, weight = () => 1, score = () => 0, current } = {}) {
  const candidates = items.filter((item) => item.id !== current);
  const source = candidates.length ? candidates : items;
  if (!source.length) return undefined;
  const ranked = source.map((item) => ({ item, weight: Math.max(.001, Number(weight(item)) || 1) * Math.max(.1, 1 + Number(score(item) || 0)) }));
  const total = ranked.reduce((sum, item) => sum + item.weight, 0);
  let cursor = randomUnit(random) * total;
  for (const item of ranked) { cursor -= item.weight; if (cursor <= 0) return item.item; }
  return ranked.at(-1)?.item;
}

export function randomizeCreative(base = DEFAULT_CREATIVE, { mode = 'details-only', lockKeys = [], seed = createRandomSeed(), recent = readRecent() } = {}) {
  const original = normalizeCreative(base);
  const random = createSeededRandom(seed);
  const locks = new Set(lockKeys);
  const history = recent.filter((item) => item?.style === original.style).slice(-5);
  const recentValues = (key) => new Set(history.flatMap((item) => Array.isArray(item[key]) ? item[key] : [item[key]]).filter(Boolean));
  let next = { ...original, metadata: { ...(original.metadata || {}), randomSeed: Number(seed) >>> 0 } };
  const choose = (key, group = key, options = {}) => {
    if (!locks.has(key)) next[key] = pick(group, random, { current: original[key], recentValues: recentValues(group), ...options });
  };
  if (mode === 'all') choose('style', 'style');
  choose('sport', 'sport'); choose('theme', 'theme'); choose('scene', 'scene');
  choose('hairstyle', 'hairstyle'); choose('headwear', 'headwear'); choose('expression', 'expression');
  choose('palette', 'palette'); choose('material', 'material'); choose('composition', 'composition');

  const themeOutfits = BONUS.outfit[next.theme] || [];
  const sportOutfits = next.sport === 'character' ? [] : (next.sport === 'hockey' ? ['hockey-kit','champion-uniform'] : next.sport === 'skate' ? ['skating-dress','idol-stage'] : ['ski-suit','puffer','polar-suit']);
  if (!locks.has('outfit')) next.outfit = pick('outfit', random, { current: original.outfit, recentValues: recentValues('outfit'), prefer: [...themeOutfits, ...sportOutfits] });
  const posePool = SPORT_POSES[next.sport] || SPORT_POSES.character;
  if (!locks.has('pose')) next.pose = pick('pose', random, { current: original.pose, recentValues: recentValues('pose'), prefer: posePool });
  if (!locks.has('accessories')) {
    const desired = random() < .24 ? 1 : random() < .72 ? 2 : 3;
    next.accessories = pickMany('accessory', desired, random, { recentValues: recentValues('accessories'), preferred: [...(BONUS.accessories[next.theme] || []), ...(SPORT_GEAR[next.sport] || [])] });
  }
  if (!locks.has('effects')) {
    let effects = eligible('effect').filter((item) => !recentValues('effects').has(item.id));
    if (effects.length < 2) effects = eligible('effect');
    const desired = random() < .14 ? 0 : random() < .72 ? 1 : 2;
    next.effects = sample(effects, desired, random).map((item) => item.id);
  }
  next.details = original.details;
  next = normalizeCreative(next);

  // Retry whole unlocked designs against the recent set so rerolls change a full look, not just one field.
  const recentSignatures = new Set(recent.slice(-5).map((item) => item.signature).filter(Boolean));
  for (let attempt = 0; attempt < 7 && recentSignatures.has(signature(next)); attempt++) {
    if (!locks.has('outfit')) next.outfit = pick('outfit', random, { recentValues: recentValues('outfit'), prefer: themeOutfits });
    if (!locks.has('hairstyle')) next.hairstyle = pick('hairstyle', random, { recentValues: recentValues('hairstyle') });
    if (!locks.has('headwear')) next.headwear = pick('headwear', random, { recentValues: recentValues('headwear') });
    if (!locks.has('pose')) next.pose = pick('pose', random, { recentValues: recentValues('pose'), prefer: posePool });
    if (!locks.has('palette')) next.palette = pick('palette', random, { recentValues: recentValues('palette') });
    if (!locks.has('accessories')) next.accessories = pickMany('accessory', 1 + Math.floor(random() * 3), random, { recentValues: recentValues('accessories'), preferred: BONUS.accessories[next.theme] || [] });
    next = normalizeCreative(next);
  }
  const updated = [...recent, { ...next, signature: signature(next) }].slice(-5);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch { /* local storage is optional */ }
  return next;
}

export function getVariationSummary(before, after) {
  const chosen = (group, id) => CREATIVE_GROUPS[group].find((item) => item.id === id)?.label;
  const labels = [chosen('outfit', after.outfit), chosen('hairstyle', after.hairstyle), chosen('headwear', after.headwear), chosen('pose', after.pose), chosen('palette', after.palette), ...after.accessories.map((id) => chosen('accessory', id))].filter(Boolean);
  const seed = Number(after.metadata?.randomSeed) >>> 0;
  return `灵感号 ${seed.toString(16).toUpperCase().padStart(8, '0')} · ${labels.slice(0, 4).join(' / ') || '已换新搭配'}`;
}

export function randomizeWithSecret(base, options = {}) {
  const creative = randomizeCreative(base, options);
  return { creative, seed: creative.metadata?.randomSeed, secretId: null };
}

export { STYLE_IDS };
