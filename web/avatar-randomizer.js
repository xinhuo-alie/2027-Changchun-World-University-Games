import { CREATIVE_GROUPS, DEFAULT_CREATIVE, normalizeCreative } from './creative-config.js';

const RECENT_KEY = 'cc2027:avatar-randomizer-recent:v1';
const RECENT_COMPANION_KEY = 'cc2027:companion-randomizer-recent:v1';
const OMIT = new Set(['preserve', 'none', 'random', 'custom-outfit', 'plush-hug']);
const BONUS = {
  outfit: {
    'hanfu-illusionist':['hanfu','wuxia-traveler','stage-magician'], 'moon-rabbit':['hanfu','mascot-kigurumi'],
'dream-career':['field-researcher','dream-chef','astronaut-coverall'],
    'cloud-chef':['dream-chef','mascot-kigurumi'], 'deep-sea-mail':['astronaut-coverall','tech-suit'], 'mecha-pilot':['astronaut-coverall','tech-suit'],
    'magical-idol':['idol-stage','stage-magician'], 'time-runner':['field-researcher','tech-suit'], 'dino-pal':['mascot-kigurumi','animal-hood'],
    'animal-guardian':['mascot-kigurumi','royal-cape'], 'tiny-villain':['witch-cape','gothic-dress'], 'forest-mushroom':['mascot-kigurumi','plush-suit'],
    'heroic-fantasy':['wuxia-traveler','cosplay-armor','royal-cape'], 'cyber-detective':['retro-jacket','tech-suit'],
    streamer:['street-hoodie','idol-stage','holo-fashion'], 'vampire-royal':['gothic-dress','royal-cape'],
    'potion-maker':['dream-chef','field-researcher'], 'urban-legend':['retro-jacket','gothic-dress'],
    'racing-star':['retro-jacket','ski-suit'], 'magical-girl':['royal-cape','idol-stage'],
    'creature-pal':['mascot-kigurumi','animal-hood'],
  },
  accessories: {
    'hanfu-illusionist':['jade-fan','brush-talisman','hanfu-hairpin'], 'moon-rabbit':['jade-fan','plush-rabbit','tiny-bouquet'],
'dream-career':['camera','stethoscope','chef-whisk'],
    'cloud-chef':['chef-whisk','cloud-companion','tiny-bouquet'], 'deep-sea-mail':['shell-mailbag','plush-penguin','crystal-orb'],
    'mecha-pilot':['gear-drone','toy-robot','light-band'], 'magical-idol':['mini-guitar','moon-wand','light-band'],
    'time-runner':['camera','magic-book','gear-drone'], 'dino-pal':['dino-buddy','plush-toy'], 'animal-guardian':['plush-fox','plush-cat','dino-buddy'],
    'tiny-villain':['plush-bat','magic-book','crystal-orb'], 'forest-mushroom':['cloud-companion','tiny-bouquet','plush-fox'],
    'heroic-fantasy':['magic-book','crystal-orb','brush-talisman'], 'cyber-detective':['camera','gear-drone','light-band'],
    streamer:['headphones','mini-guitar','tiny-bouquet'], 'vampire-royal':['plush-bat','moon-wand','crystal-orb'],
    'potion-maker':['crystal-orb','tiny-bouquet','shell-mailbag'], 'urban-legend':['camera','plush-bat','magic-book'],
    'racing-star':['headphones','camera','toy-robot'], 'magical-girl':['moon-wand','crystal-orb','tiny-bouquet'],
    'creature-pal':['dino-buddy','plush-fox','plush-cat'],
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
  character:['standing','peace','wave','plush-hug','champion','jump','thumbs-up','trophy'],
};
const STYLE_IDS = new Set(CREATIVE_GROUPS.style.map((item) => item.id));
const COMPANION_ACCESSORY_IDS = new Set(['plush-toy','plush-bear','plush-fox','plush-cat','plush-rabbit','plush-penguin','plush-bat','toy-robot','dino-buddy','cloud-companion','gear-drone']);

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
function readRecent() {
  try { const value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function signature(config) {
  return ['world','lifeform','silhouette','bodyStructure','faceDesign','power','material','style','sport','theme','outfit','palette','pose','hairstyle','expression']
    .map((key) => config[key]).join('|') + '|' + [...(config.accessories || [])].sort().join(',') + '|' + [...(config.effects||[])].sort().join(',');
}
const eligible = (group) => CREATIVE_GROUPS[group].filter((item) => !OMIT.has(item.id) && !(group==='accessory'&&COMPANION_ACCESSORY_IDS.has(item.id)));
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
  const history = recent.slice(-12);
  const recentValues = (key) => new Set(history.flatMap((item) => Array.isArray(item[key]) ? item[key] : [item[key]]).filter(Boolean));
  let next = { ...original, metadata: { ...(original.metadata || {}), randomSeed: Number(seed) >>> 0 } };
  const choose = (key, group = key, options = {}) => {
    if (!locks.has(key)) next[key] = pick(group, random, { current: original[key], recentValues: recentValues(group), ...options });
  };
  if (mode === 'all') {
    choose('style', 'style'); choose('sport', 'sport'); choose('theme', 'theme');
    choose('outfit', 'outfit');
  }
  choose('world','world');
  choose('palette', 'palette');
  choose('material','material');
  if (!locks.has('silhouette')) next.silhouette = ['dynamic-elegant','layered-orbit','soft-organic','angular-paper','flowing-asymmetric','compact-heroic'][Math.floor(random()*6)];
  if (!locks.has('bodyStructure')) next.bodyStructure = ['human-proportions','athletic-natural','soft-stylized'][Math.floor(random()*3)];
  if (!locks.has('faceDesign')) next.faceDesign = 'natural-friendly';
  if (!locks.has('power')) next.power = ['soft-aurora-aura','gravity-orbit','crystal-resonance','time-ripple','shadow-ribbon','nebula-glow'][Math.floor(random()*6)];

  const themeOutfits = BONUS.outfit[next.theme] || [];
  const sportOutfits = next.sport === 'character' ? [] : (next.sport === 'hockey' ? ['hockey-kit','champion-uniform'] : next.sport === 'skate' ? ['skating-dress','idol-stage'] : ['ski-suit','puffer','polar-suit']);
  if (!locks.has('outfit')) next.outfit = pick('outfit', random, { current: original.outfit, recentValues: recentValues('outfit'), prefer: [...themeOutfits, ...sportOutfits] });
  const posePool = SPORT_POSES[next.sport] || SPORT_POSES.character;
  if (!locks.has('pose')) next.pose = pick('pose', random, { current: original.pose, recentValues: recentValues('pose'), prefer: posePool });
  if (!locks.has('hairstyle')) next.hairstyle = pick('hairstyle', random, { current: original.hairstyle, recentValues: recentValues('hairstyle') });
  if (!locks.has('expression')) next.expression = pick('expression', random, { current: original.expression, recentValues: recentValues('expression') });
  if (!locks.has('accessories')) {
    const desired = random() < .16 ? 0 : random() < .7 ? 1 : 2;
    next.accessories = pickMany('accessory', desired, random, { recentValues: recentValues('accessories'), preferred: [...(BONUS.accessories[next.theme] || []), ...(SPORT_GEAR[next.sport] || [])] });
  }
  next.details = original.details;
  next = normalizeCreative(next);

  // Retry whole unlocked designs against the recent set so rerolls change a full look, not just one field.
  const recentSignatures = new Set(recent.slice(-12).map((item) => item.signature).filter(Boolean));
  for (let attempt = 0; attempt < 7 && recentSignatures.has(signature(next)); attempt++) {
    if (!locks.has('world')) next.world = pick('world', random, { current:next.world, recentValues:recentValues('world') });
    if (mode === 'all' && !locks.has('theme')) next.theme = pick('theme', random, { recentValues: recentValues('theme') });
    if (mode === 'all' && !locks.has('sport')) next.sport = pick('sport', random, { recentValues: recentValues('sport') });
    if (mode === 'all' && !locks.has('outfit')) next.outfit = pick('outfit', random, { recentValues: recentValues('outfit'), prefer: themeOutfits });
    if (mode === 'all' && !locks.has('style')) next.style = pick('style', random, { recentValues: recentValues('style') });
    if (!locks.has('pose')) next.pose = pick('pose', random, { recentValues: recentValues('pose'), prefer: posePool });
    if (!locks.has('hairstyle')) next.hairstyle = pick('hairstyle', random, { recentValues: recentValues('hairstyle') });
    if (!locks.has('expression')) next.expression = pick('expression', random, { recentValues: recentValues('expression') });
    if (!locks.has('palette')) next.palette = pick('palette', random, { recentValues: recentValues('palette') });
    if (!locks.has('material')) next.material = pick('material', random, { current:next.material, recentValues:recentValues('material') });
    if (!locks.has('accessories')) next.accessories = pickMany('accessory', Math.floor(random() * 3), random, { recentValues: recentValues('accessories'), preferred: BONUS.accessories[next.theme] || [] });
    next = normalizeCreative(next);
  }
  const updated = [...recent, { ...next, signature: signature(next) }].slice(-12);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch { /* local storage is optional */ }
  return next;
}

export function getVariationSummary(before, after) {
  const chosen = (group, id) => CREATIVE_GROUPS[group].find((item) => item.id === id)?.label;
  const labels = [chosen('palette', after.palette), ...after.accessories.slice(0,2).map((id) => chosen('accessory', id)), chosen('pose', after.pose), chosen('hairstyle', after.hairstyle), chosen('expression', after.expression)].filter(Boolean);
  const seed = Number(after.metadata?.randomSeed) >>> 0;
  return `灵感号 ${seed.toString(16).toUpperCase().padStart(8, '0')} · ${labels.slice(0, 4).join(' / ') || '已换新搭配'}`;
}

const COMPANION_SHAPES = ['环形核心与四条细长肢体','不对称三角躯干与六足','无头部的漂浮晶簇','叶片状躯干与两条飘带肢体','水滴主体与可伸缩短肢','折纸多面体与纸翼','柔软云团与一对长耳状触须','细长甲壳与四对短足'];
const COMPANION_MATERIALS = ['雾面陶瓷与细金属接缝','半透明水晶与柔和内光','短绒织物与刺绣纹理','液态珠光表面','折纸纤维与清晰折面','星云渐层与微弱闪点'];
export function randomizeCompanion(type, seed = createRandomSeed()) {
  let recent=[];try{const stored=JSON.parse(localStorage.getItem(RECENT_COMPANION_KEY)||'[]');if(Array.isArray(stored))recent=stored.slice(-12);}catch{/* local storage is optional */}
  const stable=recent.find((item)=>item?.seed===(Number(seed)>>>0)&&item.type===type);if(stable)return stable.blueprint;
  const signature=(blueprint)=>[blueprint.type,blueprint.silhouette,blueprint.bodyStructure,blueprint.faceDesign,blueprint.limbs,blueprint.material,blueprint.movement,blueprint.signatureFeature].join('|');
  const signatures=new Set(recent.map((item)=>item.signature));
  const create=(attempt)=>{const random=createSeededRandom((Number(seed)+Math.imul(attempt,0x9e3779b9))>>>0);const pick=(items)=>items[Math.floor(random()*items.length)];return {type,archetype:pick(['灵巧引路者','安静观察者','活泼采集者','守护型小精灵','好奇的异界访客']),silhouette:pick(COMPANION_SHAPES),bodyStructure:pick(COMPANION_SHAPES),faceDesign:pick(['无面部，仅以光点表达情绪','两枚细长眼点与小型发光口器','一枚中央复眼，不拟人化','简洁的面罩形光纹']),limbs:pick(['四条细长肢体','六足结构','两条飘带状附肢','无肢体，悬浮移动']),material:pick(COMPANION_MATERIALS),palette:pick(['暖金与深紫','珊瑚橙与青绿','珍珠白与电光蓝','莓果红与浅银','嫩绿与焦糖棕','深蓝与柠檬黄']),movement:pick(['轻盈悬浮','弹跳移动','折叠展开','缓慢旋转']),personality:pick(['友善好奇','安静可靠','活泼调皮','温和沉稳']),signatureFeature:pick(['背部环形晶冠','可展开的折面翼','三段式发光尾鳍','不对称花蕊触角','胸前悬浮小型星核','多层透明外壳']),size:pick(['约主角头部的三分之一','约主角头部的一半','不超过主角肩宽的四分之一']),attachment:pick(['悬浮在主角左肩旁','停在主角背包侧边','站在主角脚边并完整入镜']),seed:Number(seed)>>>0};};
  let blueprint;for(let attempt=0;attempt<8;attempt++){const candidate=create(attempt);if(!signatures.has(signature(candidate))||attempt===7){blueprint=candidate;break;}}
  const updated=[...recent,{type,seed:Number(seed)>>>0,blueprint,signature:signature(blueprint)}].slice(-12);try{localStorage.setItem(RECENT_COMPANION_KEY,JSON.stringify(updated));}catch{/* local storage is optional */}
  return blueprint;
}

export function randomizeWithSecret(base, options = {}) {
  const creative = randomizeCreative(base, options);
  return { creative, seed: creative.metadata?.randomSeed, secretId: null };
}

export { STYLE_IDS };
