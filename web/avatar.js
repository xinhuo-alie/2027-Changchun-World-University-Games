/**
 * 形象配置：把"脸 + 零件 + 配色"打包成一个可存可取的对象。
 *
 * 这一层只做三件事：默认值、随机、存取。绘制和抠图分别在同目录的
 * avatar-parts.js / avatar-face.js 里，这里统一再导出一次，
 * 页面只要 `import { ... } from '/avatar.js'` 就够了。
 */

import { makePresetFace, FACE_SIZE, canvasContent } from './avatar-face.js';
import { PARTS, PALETTES, normalizeFaceFit } from './avatar-parts.js';

export * from './avatar-face.js';
export * from './avatar-parts.js';

/** 四套模板形象：不想上传照片、或者上传的照片抠不出来时，直接选一个开始 */
export const PRESETS = [
  { id: 'snow', label: '雪宝', skin: '#F6D2B4', hair: '#5B3A21', coat: '#4FA8E8', pants: '#33526E', boots: '#33526E' },
  { id: 'girl', label: '小樱', skin: '#FBDCC4', hair: '#C25B8A', coat: '#FF9EBE', pants: '#FFD166', boots: '#E4E9EF' },
  { id: 'cool', label: '阿冰', skin: '#F0C6A2', hair: '#2E2A2A', coat: '#2F5D8A', pants: '#33526E', boots: '#8A5A3B' },
  { id: 'sun', label: '阳阳', skin: '#F3C9A8', hair: '#E0B76A', coat: '#7FE0C4', pants: '#6B8299', boots: '#FF9EBE' },
];

/** 经过配色与轮廓统一设计的成套造型；换装只替换服饰，不碰照片头像和校准值。 */
export const LOOKS = [
  { id: 'aurora', label: '雪道追风手', mood: '冰蓝头盔 · 动感滑行', accent: '#69dce6', parts: { hat: 'helmet', scarf: 'none', coat: 'jacket', pants: 'tight', boots: 'snow', gloves: 'mitten', gear: 'none' }, colors: { hat: '#67d6e5', scarf: '#ffe38d', coat: '#f46570', pants: '#d94f69', boots: '#315b93', gloves: '#ffbd67' } },
  { id: 'berry', label: '莓果雪团', mood: '珊瑚粉 · 软萌出镜', accent: '#ff98aa', parts: { hat: 'earflap', scarf: 'snood', coat: 'down', pants: 'snow', boots: 'snow', gloves: 'mitten', gear: 'none' }, colors: { hat: '#ff98aa', scarf: '#fff1b4', coat: '#ff899f', pants: '#746bb3', boots: '#634e9c', gloves: '#fff1b4' } },
  { id: 'champion', label: '冰场新星', mood: '冰晶白 · 运动闪耀', accent: '#9bd9f6', parts: { hat: 'cap', scarf: 'none', coat: 'team', pants: 'tight', boots: 'skate', gloves: 'glove', gear: 'none' }, colors: { hat: '#6a70d9', scarf: '#d9edff', coat: '#eef7ff', pants: '#5270bc', boots: '#5666aa', gloves: '#d0e8f8' } },
];

export function applyLook(base, look) {
  const cfg = cloneConfig(base);
  Object.assign(cfg.parts, look.parts);
  Object.assign(cfg.colors, look.colors);
  return cfg;
}

export function defaultConfig() {
  return {
    name: '',
    // face.kind: 'none' 还没做 / 'photo' 照片抠的 / 'preset' 模板脸
    face: { kind: 'none', canvas: null, skin: '#F3C9A8', preset: null },
    figure: null,
    parts: {
      hair: 'short',
      hat: 'none',
      scarf: 'scarf',
      coat: 'down',
      pants: 'snow',
      boots: 'snow',
      gloves: 'mitten',
      glasses: 'none',
      gear: 'none',
    },
    colors: {
      hair: '#5B3A21',
      hat: '#4FA8E8',
      scarf: '#FF8F7A',
      coat: '#4FA8E8',
      pants: '#33526E',
      boots: '#8A5A3B',
      gloves: '#FF8F7A',
      glasses: '#33526E',
      gear: '#FF8F7A',
    },
  };
}

/**
 * 拷一份配置。
 *
 * 千万别用 structuredClone：`face.canvas` 是 HTMLCanvasElement，克隆会直接抛
 * DataCloneError（"手气不错"和模板脸按钮在有头像之后全部失灵，就是这个原因）。
 * 配置只有三层、字段都是扁平的，浅拷贝一层足够。
 */
export function cloneConfig(cfg) {
  return {
    name: cfg.name,
    face: { ...cfg.face },
    figure: cfg.figure ? { ...cfg.figure } : null,
    parts: { ...cfg.parts },
    colors: { ...cfg.colors },
  };
}

/** 用模板脸生成一份完整配置（颜色跟着模板走，不然会出现"粉头发配棕眉毛"） */
export function presetConfig(preset, base) {
  const cfg = base ? cloneConfig(base) : defaultConfig();
  cfg.figure = null;
  cfg.face = {
    kind: 'preset',
    canvas: makePresetFace(preset),
    skin: preset.skin,
    preset: preset.id,
  };
  cfg.colors.hair = preset.hair;
  cfg.colors.coat = preset.coat;
  cfg.colors.pants = preset.pants;
  cfg.colors.boots = preset.boots;
  cfg.colors.hat = preset.coat;
  return cfg;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * 随机一套搭配。
 *
 * 帽子/眼镜/围巾这类"加件"给的是 50% 概率而不是均匀随机：
 * 全戴上会糊成一团（雪镜 + 护耳帽 + 围巾几乎盖住整张脸），
 * 所以刻意让"什么都不加"也有一半的机会。
 */
export function randomConfig(base) {
  const cfg = base ? cloneConfig(base) : defaultConfig();
  const ids = (key) => PARTS[key].map((p) => p.id).filter((id) => id !== 'none');
  const maybe = (fallback, pool) => (Math.random() < 0.5 ? pick(pool) : fallback);
  // 用 AI 生成头像时，"手气不错"不要碰发型和眼镜：那两件根本不会被画出来，
  // 随机会在配置里留一个改了没反应的假值（下次换成模板脸又会突然冒出一顶假发）
  const isApiFace = Boolean(cfg.face && cfg.face.kind === 'api');
  if (!isApiFace) cfg.parts.hair = maybe('none', ids('hair'));
  cfg.parts.hat = maybe('none', ids('hat'));
  cfg.parts.scarf = maybe('scarf', ids('scarf'));
  cfg.parts.coat = pick(ids('coat'));
  cfg.parts.pants = pick(ids('pants'));
  cfg.parts.boots = pick(ids('boots'));
  cfg.parts.gloves = maybe('mitten', ids('gloves'));
  if (!isApiFace) cfg.parts.glasses = maybe('none', ids('glasses'));
  cfg.parts.gear = maybe('none', ids('gear'));
  for (const key of Object.keys(cfg.colors)) {
    if (PALETTES[key]) cfg.colors[key] = pick(PALETTES[key]);
  }
  return cfg;
}

/* ------------------------------------------------------------------ */
/* 存取                                                                */
/* ------------------------------------------------------------------ */

const STORE_KEY = 'cc2027:avatar';

/**
 * 存到 localStorage。
 *
 * 照片脸会一起存（压到 256×256 的 PNG，几十 KB），所以刷新不用重做——
 * 本地形象配置和裁好的小图保存在浏览器里；用户主动提交生图时，
 * 原始照片另由生成流程发往所选服务商。
 */
export function saveConfig(cfg) {
  try {
    const payload = {
      name: cfg.name,
      parts: cfg.parts,
      colors: cfg.colors,
      figure: cfg.figure?.canvas ? { outfitKey: cfg.figure.outfitKey, canvas: cfg.figure.canvas.toDataURL('image/png') } : null,
      face: {
        kind: cfg.face.kind,
        skin: cfg.face.skin,
        preset: cfg.face.preset,
        fromFigure: Boolean(cfg.face.fromFigure),
        // 缩放要用的两个方框一起存：它们不是能从图片里推出来的
        // （"脸"是按肤色量的，"整头"是按 alpha 量的，恢复时量不到同一套）
        content: cfg.face.content || null,
        headH: cfg.face.headH || null,
        fit: normalizeFaceFit(cfg.face.fit),
        canvas: cfg.face.canvas ? cfg.face.canvas.toDataURL('image/png') : null,
      },
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // 隐私模式下 localStorage 会直接抛异常，存不上不影响玩
    return false;
  }
}

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    const cfg = defaultConfig();
    Object.assign(cfg.parts, payload.parts || {});
    Object.assign(cfg.colors, payload.colors || {});
    cfg.name = payload.name || '';
    cfg.figure = payload.figure?.canvas ? { outfitKey: payload.figure.outfitKey, canvas: null, pendingImage: payload.figure.canvas } : null;
    const face = payload.face || {};
    cfg.face = {
      kind: face.kind || 'none',
      skin: face.skin || cfg.face.skin,
      preset: face.preset || null,
      fromFigure: Boolean(face.fromFigure),
      content: face.content || null,
      headH: face.headH || null,
      fit: normalizeFaceFit(face.fit),
      canvas: null,
    };
    if (face.canvas) {
      // 画布要等图片解码完才有内容，所以这里同步返回配置、异步补上脸
      cfg.face.pendingImage = face.canvas;
    }
    return cfg;
  } catch {
    return null;
  }
}

/** 把 loadConfig 里挂着的图片解码出来（异步，解码完调用 onReady） */
export function resolveFaceImage(cfg, onReady) {
  const done = () => resolveFigureImage(cfg, onReady);
  if (!cfg.face.pendingImage) {
    done();
    return;
  }
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = FACE_SIZE;
    canvas.height = FACE_SIZE;
    canvas.getContext('2d').drawImage(img, 0, 0, FACE_SIZE, FACE_SIZE);
    cfg.face.canvas = canvas;
    // 从浏览器里恢复出来的脸要重新量一次范围：这些信息不会跟着图片一起存
    const measured = canvasContent(canvas);
    if (!cfg.face.content) cfg.face.content = measured;
    if (cfg.face.kind === 'api' && !cfg.face.headH) cfg.face.headH = measured ? measured.h : null;
    delete cfg.face.pendingImage;
    done();
  };
  img.onerror = () => {
    cfg.face.kind = 'none';
    delete cfg.face.pendingImage;
    done();
  };
  img.src = cfg.face.pendingImage;
}

function resolveFigureImage(cfg, onReady) {
  if (!cfg.figure?.pendingImage) {
    if (onReady) onReady();
    return;
  }
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    cfg.figure.canvas = canvas;
    delete cfg.figure.pendingImage;
    if (onReady) onReady();
  };
  img.onerror = () => {
    cfg.figure = null;
    if (onReady) onReady();
  };
  img.src = cfg.figure.pendingImage;
}
