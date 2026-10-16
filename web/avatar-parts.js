/**
 * 矢量零件：把"人"拆成头发/帽子/围巾/上衣/裤子/鞋/手套/眼镜/道具九层，逐层画出来。
 *
 * 两条贯穿全文件的规矩：
 *  1. **所有零件都按 420 × 640 的设计单位画**，最后统一缩放，改一个数全身都跟着变。
 *  2. **一律"先描墨线再填色"**，墨线色固定 INK。这是拼装看起来像一整套的唯一原因——
 *     任何一件衣服如果不用同一支笔描边，立刻就会露出"素材拼贴"的痕迹。
 *
 * 零件都是函数，不是图片：不用下载任何素材、没有图片请求、放大不糊，
 * 而且"走路"这件事只要给四肢传一个旋转角就够了，不需要骨骼和动画文件。
 */

import { faceFeatures, cartoonize } from './avatar-face.js';

export const CANVAS = { w: 420, h: 640 };

export const INK = '#263D70';

const CX = 210;
/*
 * 比例（决定"卡通不卡通"的第一件事）。
 *
 * 上一版头小、身体宽，穿厚外套时整个人像一只杯子。现在让头、肩和短腿
 * 共用一套柔软比例，衣服贴着身体轮廓画，抬手和走路时也不会散架。
 * 顺带把外套缩短、下摆放窄，让胳膊和腿能露出来；看不见手脚的角色是最不生动的。
 */
// 头的大小与位置：这套画里最敏感的两个数。
// r 大一点更可爱，但太大就变成"气球人"；y 往下挪一点会更稳（头贴着肩膀，不像飘着）
// 运动手办比例：脸是视觉主角，身体短而灵活，四肢圆润但不盖住脸。
const HEAD = { x: CX, y: 244, r: 103 };
const SHOULDER_Y = 348;
const SHOULDER_X = 69;
const TORSO_HALF = 66;
const HEM_HALF = 61;
const HIP_Y = 448;
const HIP_X = 32;
const FOOT_Y = 567;
const ARM_LEN = 87;
const LEG_LEN = 108;

export const PALETTES = {
  hair: ['#2E2A2A', '#5B3A21', '#A8672F', '#E0B76A', '#C25B8A', '#8FA9D6', '#8C97A3', '#F5F7FA'],
  coat: ['#7667E9', '#41C5CF', '#FF799B', '#FFC74F', '#A287F2', '#FF9868', '#355CAB', '#F2F7FF'],
  pants: ['#3B5A99', '#6B83BD', '#A287F2', '#FF92AB', '#48BFC2', '#F7CA70'],
  boots: ['#7E63A8', '#324F89', '#FF86A0', '#47C5BB', '#E7ECF7'],
  gear: ['#FF799B', '#5A91E9', '#FFC74F', '#56D4CA', '#A287F2'],
};

/** 分类 → 可选零件。UI 直接读这张表渲染，加零件不用改前端代码。 */
export const PARTS = {
  hair: [
    { id: 'none', label: '不换' },
    { id: 'short', label: '短发' },
    { id: 'bob', label: '齐肩' },
    { id: 'ponytail', label: '马尾' },
    { id: 'bun', label: '丸子头' },
    { id: 'curly', label: '卷发' },
  ],
  hat: [
    { id: 'none', label: '不戴' },
    { id: 'beanie', label: '雪团帽' },
    { id: 'earflap', label: '小熊护耳帽' },
    { id: 'cap', label: '运动鸭舌帽' },
    { id: 'helmet', label: '竞速头盔' },
  ],
  scarf: [
    { id: 'none', label: '不戴' },
    { id: 'scarf', label: '极光围巾' },
    { id: 'snood', label: '暖暖脖套' },
  ],
  coat: [
    { id: 'down', label: '糖果羽绒服' },
    { id: 'jacket', label: '雪线冲锋衣' },
    { id: 'hoodie', label: '云朵卫衣' },
    { id: 'team', label: '冬运队服' },
    { id: 'sweater', label: '雪花毛衣' },
  ],
  pants: [
    { id: 'snow', label: '极地雪裤' },
    { id: 'sports', label: '运动束脚裤' },
    { id: 'skirt', label: '冰晶短裙' },
    { id: 'tight', label: '速滑紧身裤' },
  ],
  boots: [
    { id: 'snow', label: '雪地靴' },
    { id: 'skate', label: '冰鞋' },
    { id: 'board', label: '单板靴' },
  ],
  gloves: [
    { id: 'none', label: '不戴' },
    { id: 'mitten', label: '连指手套' },
    { id: 'glove', label: '分指手套' },
  ],
  glasses: [
    { id: 'none', label: '不戴' },
    { id: 'round', label: '圆框' },
    { id: 'square', label: '方框' },
    { id: 'goggle', label: '雪镜' },
  ],
  gear: [
    { id: 'none', label: '空手' },
    { id: 'board', label: '单板' },
    { id: 'stick', label: '冰球杆' },
    { id: 'flag', label: '小旗' },
  ],
};

export const CATEGORY_PALETTE = {
  hair: 'hair',
  hat: 'coat',
  scarf: 'gear',
  coat: 'coat',
  pants: 'pants',
  boots: 'boots',
  gloves: 'gear',
  glasses: 'gear',
  gear: 'gear',
};

export const CATEGORY_LABEL = {
  hair: '发型',
  hat: '帽子',
  scarf: '围巾',
  coat: '上衣',
  pants: '下装',
  boots: '鞋',
  gloves: '手套',
  glasses: '眼镜',
  gear: '道具',
};

export function outfitKey(cfg) {
  return JSON.stringify([cfg.parts, cfg.colors]);
}

/* ------------------------------------------------------------------ */
/* 画图小工具                                                          */
/* ------------------------------------------------------------------ */

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 每张照片单独保存的微调量；用设计单位表示位移，地图小头像也会按比例缩放。
export function normalizeFaceFit(value) {
  const safe = (number, fallback, min, max) => number != null && Number.isFinite(Number(number)) ? clamp(Number(number), min, max) : fallback;
  return {
    scale: safe(value?.scale, 1, 0.7, 1.45),
    dx: safe(value?.dx, 0, -55, 55),
    dy: safe(value?.dy, 0, -55, 55),
    angle: safe(value?.angle, 0, -25, 25),
  };
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
}

/** 圆头胶囊：四肢、围巾、帽子边都用它，保证全市都是圆角 */
export function capsule(ctx, x1, y1, x2, y2, r, fill, opts = {}) {
  ctx.lineCap = 'round';
  if (opts.line !== 0) {
    ctx.strokeStyle = opts.color || INK;
    ctx.lineWidth = r * 2 + (opts.line ?? 3.5);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.strokeStyle = fill;
  ctx.lineWidth = r * 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** 提亮/压暗一个颜色：整套零件的明暗都从主色推出来，换主色不会留下不搭的旧阴影 */
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const to = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  const mix = (c) => Math.round(c + (to - c) * k);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

/* ------------------------------------------------------------------ */
/* 头                                                                */
/* ------------------------------------------------------------------ */

export function drawHead(ctx, cfg) {
  const { x, y, r } = HEAD;
  const face = cfg.face || {};
  const skin = face.skin || '#F3C9A8';

  /*
   * AI 生成的头像直接贴，不裁圆。
   *
   * 模型画的是"头肩特写"，头发、耳朵、下颌线都是它自己画的——再套一个圆去裁，
   * 等于把它画的头型切掉一圈，看着还是"塞进圆框里"，不像贴进画面。
   * 所以这一路：不裁圆、不补耳朵、不描圆边，只按脸的实际范围缩放。
   */
  if (face.kind === 'api' && face.canvas) {
    drawFaceInto(ctx, face, x, y, r);
    return;
  }

  // 耳朵先画，让它从圆外面露一点点，头才不像一颗球
  ctx.fillStyle = shade(skin, -0.04);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + sx * r * 0.96, y + r * 0.12, r * 0.13, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = skin;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (face.canvas) {
    drawFaceInto(ctx, face, x, y, r);
  } else {
    faceFeatures(ctx, r, { hair: cfg.colors.hair });
  }
  ctx.restore();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * 把贴纸脸画进头圆。
 *
 * 关键在"按内容自适应"，不是把整张图硬塞进圆：
 * 贴纸里往往带着一点背景、头发、脖子，如果直接铺满，脸就会缩成圆中间的一小团
 * （用户看到的就是"我的头只有指甲盖大，外面一圈木头色"）。
 * 所以量出人脸的实际范围，按**宽度**铺满直径，并让"大概的眼睛位置"落在圆心——
 * 上面那层矢量眼镜（画在圆心附近）才能正好压在眼睛上。
 */
function drawFaceInto(ctx, face, x, y, r) {
  // 旧缓存里的头像也在本地做轻度插画化，不必让用户重新付费生成。
  // 原始 canvas 保留用于存档；处理图只缓存于本次页面内。
  if (face.kind === 'api' && face.canvas && !face.stylizedCanvas) {
    const source = face.canvas;
    const sctx = source.getContext('2d');
    const pixels = sctx.getImageData(0, 0, source.width, source.height);
    const rendered = cartoonize(pixels, { levels: 5, blend: 0.82, saturation: 1.12, edge: 0.22 });
    const styled = document.createElement('canvas');
    styled.width = source.width;
    styled.height = source.height;
    styled.getContext('2d').putImageData(new ImageData(rendered.data, styled.width, styled.height), 0, 0);
    face.stylizedCanvas = styled;
  }
  const canvas = face.stylizedCanvas || face.canvas;
  const c = face.content;
  const fitAdjust = normalizeFaceFit(face.fit);
  ctx.save();
  // 先在身体坐标里限制肩膀残片，再移动头像本身；调位置时衣领边界不跟着跑。
  if (face.kind === 'api') {
    ctx.beginPath();
    ctx.moveTo(x - r * 2, y - r * 2);
    ctx.lineTo(x + r * 2, y - r * 2);
    ctx.lineTo(x + r * 2, y + r * 0.55);
    ctx.quadraticCurveTo(x + r * 0.46, y + r * 0.62, x + r * 0.35, y + r * 0.78);
    ctx.lineTo(x + r * 0.31, y + r * 1.12);
    ctx.lineTo(x - r * 0.31, y + r * 1.12);
    ctx.lineTo(x - r * 0.35, y + r * 0.78);
    ctx.quadraticCurveTo(x - r * 0.46, y + r * 0.62, x - r * 2, y + r * 0.55);
    ctx.closePath();
    ctx.clip();
  }
  ctx.translate(x + fitAdjust.dx * r / HEAD.r, y + fitAdjust.dy * r / HEAD.r);
  ctx.rotate(fitAdjust.angle * Math.PI / 180);
  ctx.scale(fitAdjust.scale, fitAdjust.scale);
  ctx.translate(-x, -y);
  if (!c || c.w < 8 || c.h < 8) {
    const s = r * 2 * (face.kind === 'api' ? 1.18 : 1.06);
    ctx.drawImage(canvas, x - s / 2, y - s / 2 + r * 0.04, s, s);
    ctx.restore();
    return;
  }
  /*
   * AI 头像：按**脸的皮肤范围**缩放，不是按"整个头（含头发）"。
   *
   * 用整个头的方框去缩放时，头发占掉的高度会把脸压小；头发的顶端还会把头发带得飘在头外。
   * 按脸缩放之后：脸铺满圆，头发自然往上溢出（这就是"头发在圆外面"的正确样子），
   * 下巴落在圆下方一点，围巾正好盖住脖子而不是盖住嘴。
   */
  if (face.kind === 'api') {
    /*
     * 两个约束一起用：
     *  1) 脸的宽度铺到约 2.1r，让真人头像比模板脸更醒目；
     *  2) 整个头（含头发）的高度不超过 2.55r —— 模型画的头发常常又高又炸，
     *     只按脸宽缩放的话，头发会一路顶到画面外（实测过，头顶直接飞出画布）。
     * 锚点取"皮肤框的上半部分"：皮肤框里下面那截是脖子，用几何中心会把脸顶高。
     */
    const skinH = c.h * 0.75;
    let fit = (r * 2) / (c.w * 0.94);
    if (face.headH > 4) fit = Math.min(fit, (r * 2.55) / face.headH);
    ctx.drawImage(
      canvas,
      x - (c.x + c.w / 2) * fit,
      // 0.45 而不是 0.375：脸往圆心的上方再挪一点，下巴不至于被围巾切掉
      y - (c.y + skinH * 0.6) * fit,
      canvas.width * fit,
      canvas.height * fit,
    );
    ctx.restore();
    return;
  }
  // 1.0 / 0.5：把脸铺到接近整个头圆。上一版留了 15% 余量，头看起来比身体小一圈
  const fit = (r * 2) / Math.max(c.w, c.h * 0.5);
  const anchorX = c.x + c.w / 2;
  const anchorY = c.y + c.h * 0.42; // 头+脖子时，眼睛大约在内容高度的 42% 处
  ctx.drawImage(
    canvas,
    x - anchorX * fit,
    y - anchorY * fit,
    canvas.width * fit,
    canvas.height * fit,
  );
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 后层：长发、卫衣帽、单板                                          */
/* ------------------------------------------------------------------ */

function drawBackHair(ctx, cfg) {
  // AI 生成的头像自带头发：矢量头发一律不画。
  // 只藏选项卡是不够的——"手气不错"或旧的本地存档仍可能把 hair 设成 curly/bob，
  // 那顶假发就会扣在模型画的头上（用户截图里那团黑球就是这么来的）。
  if (cfg.face.kind === 'api') return;
  const kind = cfg.parts.hair;
  if (kind !== 'ponytail' && kind !== 'bob') return;
  const { x, y, r } = HEAD;
  const color = shade(cfg.colors.hair, -0.1);
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  if (kind === 'bob') {
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.12, r * 1.06, r * 1.1, 0, Math.PI * 0.94, Math.PI * 2.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x - r * 0.1, y - r * 0.9);
  ctx.quadraticCurveTo(x + r * 1.5, y - r * 0.4, x + r * 1.25, y + r * 1.5);
  ctx.quadraticCurveTo(x + r * 1.05, y + r * 2.2, x + r * 0.5, y + r * 1.9);
  ctx.quadraticCurveTo(x + r * 0.8, y + r * 0.6, x + r * 0.2, y - r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBackHood(ctx, cfg) {
  if (cfg.parts.coat !== 'hoodie') return;
  const color = shade(cfg.colors.coat, -0.14);
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CX - 78, SHOULDER_Y + 26);
  ctx.quadraticCurveTo(CX - 96, HEAD.y + 54, CX, HEAD.y + 48);
  ctx.quadraticCurveTo(CX + 96, HEAD.y + 54, CX + 78, SHOULDER_Y + 26);
  ctx.quadraticCurveTo(CX, SHOULDER_Y + 4, CX - 78, SHOULDER_Y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBackBoard(ctx, cfg) {
  if (cfg.parts.gear !== 'board') return;
  const color = cfg.colors.gear;
  ctx.save();
  ctx.translate(CX - 10, HIP_Y - 120);
  ctx.rotate(-0.4);
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  roundRect(ctx, -24, -160, 48, 330, 24);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, -136);
  ctx.lineTo(0, 136);
  ctx.stroke();
  ctx.strokeStyle = shade(color, -0.42);
  ctx.lineWidth = 7;
  for (const y of [-46, 38]) {
    ctx.beginPath();
    ctx.moveTo(-22, y);
    ctx.lineTo(22, y);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 躯干与四肢                                                          */
/* ------------------------------------------------------------------ */

function drawTorso(ctx, cfg) {
  const kind = cfg.parts.coat;
  const color = cfg.colors.coat;
  const dark = shade(color, -0.16);
  const light = shade(color, 0.28);
  const top = SHOULDER_Y - 8;
  const hem = HIP_Y + 13;
  const puff = kind === 'down' ? 10 : 0;
  const half = TORSO_HALF + puff;

  /*
   * 蛋形轮廓：肩窄、肚子圆、下摆收。
   * 直上直下会像一块广告牌，收到"上宽下窄"又像灯罩；中间鼓一点才像穿着衣服的小人。
   */
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(CX - half, top + 6);
    ctx.quadraticCurveTo(CX, top - 19, CX + half, top + 6);
    ctx.quadraticCurveTo(CX + half + 20, (top + hem) / 2, CX + HEM_HALF, hem - 8);
    ctx.quadraticCurveTo(CX, hem + 17, CX - HEM_HALF, hem - 8);
    ctx.quadraticCurveTo(CX - half - 20, (top + hem) / 2, CX - half, top + 6);
    ctx.closePath();
  };

  const bodyLight = ctx.createLinearGradient(CX - half, top, CX + half, hem);
  bodyLight.addColorStop(0, light);
  bodyLight.addColorStop(0.43, color);
  bodyLight.addColorStop(1, dark);
  ctx.fillStyle = bodyLight;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  path();
  ctx.fill();
  ctx.stroke();

  // 衣服上的细节全部裁在轮廓里：下摆收窄之后，直的绗缝线会戳到衣服外面
  ctx.save();
  path();
  ctx.clip();

  // 右半边压一层淡暗面，衣服才有厚度（没有光照也能看出体积）
  ctx.fillStyle = 'rgba(51, 82, 110, 0.09)';
  ctx.fillRect(CX + 10, top - 40, 200, hem - top + 80);

  if (kind === 'down') {
    ctx.strokeStyle = 'rgba(38, 61, 112, 0.3)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 2; i += 1) {
      const y = top + 46 + i * 33;
      ctx.beginPath();
      ctx.moveTo(CX - half - 10, y);
      ctx.quadraticCurveTo(CX, y + 13, CX + half + 10, y);
      ctx.stroke();
    }
    // 每一层填充都是独立软鼓包，穿在身上有棉服的体积。
    ctx.fillStyle = 'rgba(255,255,255,.17)';
    for (const sy of [top + 24, top + 67, top + 103]) {
      ctx.beginPath();
      ctx.ellipse(CX - 37, sy, 27, 9, -.13, 0, Math.PI * 2);
      ctx.fill();
    }
    // 两侧弧形口袋让棉服更像真正穿在身上的衣服，而不是色块。
    ctx.strokeStyle = 'rgba(255,255,255,.78)';
    ctx.lineWidth = 5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(CX + side * 39, hem - 54);
      ctx.quadraticCurveTo(CX + side * 62, hem - 48, CX + side * 57, hem - 25);
      ctx.stroke();
    }
  } else if (kind === 'jacket') {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(CX, top + 10);
    ctx.lineTo(CX, hem - 4);
    ctx.stroke();
    ctx.fillStyle = '#fff6d8';
    roundRect(ctx, CX - 53, top + 76, 27, 14, 7);
    ctx.fill();
    ctx.fillStyle = light;
    roundRect(ctx, CX + 14, top + 84, 40, 24, 8);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (kind === 'hoodie') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.fillStyle = dark;
    roundRect(ctx, CX - 42, hem - 58, 84, 44, 16);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.lineWidth = 4;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(CX + sx * 16, top + 10);
      ctx.quadraticCurveTo(CX + sx * 24, top + 44, CX + sx * 17, top + 64);
      ctx.stroke();
    }
  } else if (kind === 'team') {
    ctx.fillStyle = light;
    for (let i = 0; i < 2; i += 1) {
      ctx.fillRect(CX - half, top + 52 + i * 26, half * 2, 10);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    roundRect(ctx, CX - 24, top + 92, 48, 52, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.font = 'bold 38px system-ui, "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('27', CX, top + 119);
  } else if (kind === 'sweater') {
    ctx.strokeStyle = 'rgba(51, 82, 110, 0.22)';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(CX + i * 20, top + 48);
      ctx.lineTo(CX + i * 20, hem - 6);
      ctx.stroke();
    }
    ctx.fillStyle = light;
    roundRect(ctx, CX - 34, top + 4, 68, 20, 10);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 31px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', CX, top + 100);
  }

  // 下摆的一条浅色包边：卡通衣服几乎都有这道边，没有就"少一口气"
  ctx.fillStyle = light;
  ctx.fillRect(CX - half - 14, hem - 16, (half + 14) * 2, 16);
  ctx.strokeStyle = 'rgba(51, 82, 110, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CX - half - 14, hem - 16);
  ctx.lineTo(CX + half + 14, hem - 16);
  ctx.stroke();

  // 拉链：一条细线 + 一个圆拉头，小朋友一眼就知道这是外套
  if (kind !== 'team' && kind !== 'sweater') {
    ctx.strokeStyle = 'rgba(51, 82, 110, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(CX, top + 16);
    ctx.lineTo(CX, hem - 20);
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(CX, top + 16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  if (kind === 'jacket') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(CX - half, top + 58);
    ctx.lineTo(CX - 18, top + 98);
    ctx.lineTo(CX + half, top + 42);
    ctx.stroke();
  }

  if (kind === 'down' || kind === 'hoodie') {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CX + 43, top + 54, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFB95E';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', CX + 43, top + 60);
  }

  ctx.restore();

  if (cfg.parts.pants === 'skirt') {
    // 短 A 字裙：上一版做得又长又宽，像灯罩；现在只到胯下一点，带一道压边
    const skirtHalf = half + 4;
    ctx.fillStyle = cfg.colors.pants;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(CX - skirtHalf, HIP_Y - 6);
    ctx.lineTo(CX + skirtHalf, HIP_Y - 6);
    ctx.lineTo(CX + skirtHalf + 16, HIP_Y + 44);
    ctx.quadraticCurveTo(CX, HIP_Y + 58, CX - skirtHalf - 16, HIP_Y + 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = shade(cfg.colors.pants, 0.45);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(CX - skirtHalf - 10, HIP_Y + 36);
    ctx.quadraticCurveTo(CX, HIP_Y + 48, CX + skirtHalf + 10, HIP_Y + 36);
    ctx.stroke();
  }
}

function drawArm(ctx, cfg, side, angle, front) {
  const color = front ? cfg.colors.coat : shade(cfg.colors.coat, -0.14);
  ctx.save();
  ctx.translate(CX + side * (SHOULDER_X + 2), SHOULDER_Y + 8);
  ctx.rotate(angle);
  capsule(ctx, 0, 0, side * 9, ARM_LEN - 6, 19, color, { line: 5 });
  // 袖口：一条浅色带子，胳膊才有"手在哪儿"的提示
  ctx.strokeStyle = shade(color, 0.3);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(side * 9 - 17, ARM_LEN - 25);
  ctx.lineTo(side * 9 + 17, ARM_LEN - 25);
  ctx.stroke();
  const handY = ARM_LEN - 1;
  ctx.translate(side * 9, 0);
  const gloves = cfg.parts.gloves;
  if (gloves === 'none') {
    ctx.fillStyle = cfg.face.skin || '#F3C9A8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, handY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const gc = cfg.colors.gloves;
    ctx.fillStyle = gc;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, handY + 4, 16, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 大拇指：一个小鼓包，手套立刻不像"鸡蛋"
    ctx.beginPath();
    ctx.ellipse(side * -13, handY - 2, 7, 9, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (gloves === 'glove') {
      ctx.strokeStyle = shade(gc, -0.3);
      ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 7, handY - 8);
        ctx.lineTo(i * 7, handY + 10);
        ctx.stroke();
      }
    }
    ctx.fillStyle = shade(gc, -0.3);
    roundRect(ctx, -16, handY - 17, 32, 11, 5.5);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 一条腿。
 *
 * lift 是"抬起来多少"：正面视角的走路不是左右摆腿（那是侧视的走法，正面摆会看起来
 * 像两腿打架），而是**交替抬脚**——所以这里是缩短腿长，而不是旋转。
 */
function drawLeg(ctx, cfg, side, angle, lift = 0) {
  const pants = cfg.parts.pants;
  const boots = cfg.parts.boots;
  const color = cfg.colors.pants;
  const wide = pants === 'snow' ? 23 : pants === 'sports' ? 21 : 18;
  const len = LEG_LEN - lift;
  ctx.save();
  ctx.translate(CX + side * HIP_X, HIP_Y);
  ctx.rotate(angle);

  if (pants === 'skirt') {
    capsule(ctx, 0, 6, 0, 44, 11, '#E9EEF3', { line: 4 });
  }
  capsule(ctx, 0, 0, 0, len - 26, wide, color, { line: 4 });

  // 膝盖的一道横线：腿一弯就能看出来，不然两条腿就是两根棍子
  ctx.strokeStyle = shade(color, -0.28);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-wide + 2, len * 0.52);
  ctx.quadraticCurveTo(0, len * 0.52 + 5, wide - 2, len * 0.52);
  ctx.stroke();

  if (pants === 'snow') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.fillStyle = shade(color, 0.22);
    roundRect(ctx, -wide - 3, len - 58, wide * 2 + 6, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 0, len * 0.35);
  } else if (pants === 'sports') {
    ctx.fillStyle = shade(color, 0.42);
    ctx.fillRect(-wide, 6, wide * 0.4, len - 44);
    ctx.fillStyle = shade(color, -0.25);
    roundRect(ctx, -wide - 1, len - 44, wide * 2 + 2, 12, 6);
    ctx.fill();
  } else if (pants === 'tight') {
    ctx.strokeStyle = shade(color, 0.6);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-wide + 5, 12);
    ctx.lineTo(-wide + 5, len - 48);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, -wide + 2, len - 53, wide * 2 - 4, 7, 3);
    ctx.fill();
  } else if (pants === 'skirt') {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✧', 0, len * 0.6);
  }

  const bootY = len - 35;
  const bootColor = cfg.colors.boots;
  ctx.fillStyle = bootColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  if (boots === 'skate') {
    roundRect(ctx, -wide - 2, bootY, wide * 2 + 4, 44, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shade(bootColor, 0.35);
    roundRect(ctx, -wide - 2, bootY, wide * 2 + 4, 13, 6);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-wide - 10, bootY + 52);
    ctx.lineTo(wide + 10, bootY + 52);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-wide + 4, bootY + 44);
    ctx.lineTo(-wide + 4, bootY + 52);
    ctx.moveTo(wide - 4, bootY + 44);
    ctx.lineTo(wide - 4, bootY + 52);
    ctx.stroke();
  } else if (boots === 'board') {
    roundRect(ctx, -wide - 3, bootY - 6, wide * 2 + 6, 50, 12);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = shade(bootColor, -0.35);
    ctx.lineWidth = 6;
    for (const dy of [10, 28]) {
      ctx.beginPath();
      ctx.moveTo(-wide - 5, bootY + dy);
      ctx.lineTo(wide + 5, bootY + dy - 3);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, bootY + 19, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 雪地靴：短粗、鞋口有一圈白毛，这是最能出卖"卡通感"的一件小东西
    roundRect(ctx, -wide - 10, bootY - 6, wide * 2 + 20, 48, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    roundRect(ctx, -wide - 10, bootY - 6, wide * 2 + 20, 15, 7.5);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = shade(bootColor, -0.3);
    roundRect(ctx, -wide - 10, bootY + 31, wide * 2 + 20, 12, 6);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 前层零件                                                            */
/* ------------------------------------------------------------------ */

function drawFrontHair(ctx, cfg) {
  if (cfg.face.kind === 'api') return; // 同 drawBackHair：生成的头像有头发，不再叠矢量发型
  const kind = cfg.parts.hair;
  if (kind === 'none') return;
  const { x, y, r } = HEAD;
  const color = cfg.colors.hair;
  const dark = shade(color, -0.14);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;

  // 刘海：一块盖住额头和两侧的"帽子"，弧度按头圆推，任何脸型都贴得住
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.99, y - r * 0.08);
  ctx.quadraticCurveTo(x - r * 1.14, y - r * 1.18, x, y - r * 1.12);
  ctx.quadraticCurveTo(x + r * 1.14, y - r * 1.18, x + r * 0.99, y - r * 0.08);
  ctx.quadraticCurveTo(x + r * 0.72, y - r * 0.5, x + r * 0.2, y - r * 0.44);
  ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.32, x - r * 0.99, y - r * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = dark;
  if (kind === 'bun') {
    ctx.beginPath();
    ctx.arc(x, y - r * 1.24, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'ponytail') {
    ctx.beginPath();
    ctx.ellipse(x + r * 1.02, y - r * 0.44, r * 0.21, r * 0.27, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'curly') {
    for (let i = 0; i < 6; i += 1) {
      const ang = Math.PI * (1.08 - (i / 5) * 1.16);
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * r * 1.0, y + Math.sin(ang) * r * 1.0, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (kind === 'short') {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * r * 0.95, y - r * 0.2);
      ctx.quadraticCurveTo(x + sx * r * 1.02, y + r * 0.36, x + sx * r * 0.78, y + r * 0.52);
      ctx.quadraticCurveTo(x + sx * r * 0.84, y - r * 0.1, x + sx * r * 0.68, y - r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawHat(ctx, cfg) {
  const kind = cfg.parts.hat;
  if (kind === 'none' || cfg.face?.fromFigure) return;
  const { x, y, r } = HEAD;
  const color = cfg.colors.hat;
  const dark = shade(color, -0.18);
  const light = shade(color, 0.32);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;

  // AI 头像的眼睛比模板脸更靠上。帽子只占头顶上三分之一，
  // 统一把帽沿停在眼睛上方，不再以整张头贴纸的中心来定位。
  const brimY = y - r * (cfg.face.kind === 'api' ? 0.57 : 0.46);
  const crownY = y - r * 0.91;
  const hatWidth = r * 0.88;

  if (kind === 'cap') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, crownY, hatWidth, r * 0.51, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(x + hatWidth, brimY);
    ctx.lineTo(x - hatWidth, brimY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(x + 15, brimY, r * .95, r * .11, -.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, crownY - 11, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', x, crownY - 5);
    return;
  }

  if (kind === 'helmet') {
    const shell = ctx.createLinearGradient(x - 60, crownY - 38, x + 65, brimY);
    shell.addColorStop(0, light);
    shell.addColorStop(1, color);
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(x, crownY, hatWidth + 3, r * .55, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(x + hatWidth + 3, brimY);
    ctx.quadraticCurveTo(x, brimY + 7, x - hatWidth - 3, brimY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 42, crownY - 20);
    ctx.quadraticCurveTo(x, crownY - 38, x + 42, crownY - 20);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x - 27, brimY - 25, 54, 18, 9);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('27', x, brimY - 11);
    return;
  }

  // 雪团帽与小熊护耳帽共用柔软帽体，护耳朵垂在脸两侧。
  const hatLight = ctx.createLinearGradient(x - hatWidth, crownY - 50, x + hatWidth, brimY);
  hatLight.addColorStop(0, light);
  hatLight.addColorStop(0.55, color);
  hatLight.addColorStop(1, dark);
  ctx.fillStyle = hatLight;
  ctx.beginPath();
  ctx.ellipse(x, crownY, hatWidth, r * .56, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(x + hatWidth, brimY);
  ctx.lineTo(x - hatWidth, brimY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = light;
  roundRect(ctx, x - hatWidth - 3, brimY - 15, (hatWidth + 3) * 2, 23, 11);
  ctx.fill();
  ctx.stroke();
  if (kind === 'beanie') {
    ctx.beginPath();
    ctx.arc(x, crownY - r * .57, r * .19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.72)';
  ctx.lineWidth = 3;
  for (const sx of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + sx * 24, crownY - 24);
    ctx.lineTo(x + sx * 24, brimY - 24);
    ctx.stroke();
  }
  if (kind === 'earflap') {
    // 小熊的圆耳朵从帽顶冒出，成为大头像里一眼能认出的轮廓。
    ctx.fillStyle = color;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + sx * 48, crownY - 43, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe3da';
      ctx.beginPath();
      ctx.arc(x + sx * 48, crownY - 43, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
    }
    ctx.fillStyle = light;
    ctx.strokeStyle = INK;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * (hatWidth - 4), brimY - 14);
      ctx.quadraticCurveTo(x + sx * (hatWidth + 20), brimY + 15, x + sx * (hatWidth + 2), brimY + 58);
      ctx.quadraticCurveTo(x + sx * (hatWidth - 16), brimY + 46, x + sx * (hatWidth - 18), brimY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FFF6EC';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + sx * (hatWidth + 1), brimY + 31, 10, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGlasses(ctx, cfg) {
  if (cfg.face.kind === 'api') return; // 眼镜同理：模型画的脸已经戴着了
  const kind = cfg.parts.glasses;
  if (kind === 'none') return;
  const { x, y, r } = HEAD;
  const color = cfg.colors.glasses;
  const eyeY = y + r * 0.02;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';

  if (kind === 'goggle') {
    ctx.fillStyle = color;
    roundRect(ctx, x - r * 0.94, eyeY - r * 0.3, r * 1.88, r * 0.6, r * 0.28);
    ctx.fill();
    ctx.strokeStyle = shade(color, -0.35);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.74, eyeY - r * 0.14);
    ctx.lineTo(x - r * 0.28, eyeY - r * 0.14);
    ctx.lineTo(x - r * 0.5, eyeY + r * 0.2);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const lensR = r * 0.28;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    if (kind === 'round') {
      ctx.arc(x + sx * r * 0.38, eyeY, lensR, 0, Math.PI * 2);
    } else {
      ctx.roundRect(x + sx * r * 0.38 - lensR, eyeY - lensR * 0.86, lensR * 2, lensR * 1.72, r * 0.08);
    }
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - r * 0.1, eyeY);
  ctx.lineTo(x + r * 0.1, eyeY);
  ctx.stroke();
}

function drawScarf(ctx, cfg) {
  const kind = cfg.parts.scarf;
  if (kind === 'none') return;
  const color = cfg.colors.scarf;
  const neckY = HEAD.y + HEAD.r * 1.13;

  if (kind === 'snood') {
    capsule(ctx, CX - 53, neckY, CX + 53, neckY, 18, color);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 4;
    for (const i of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.ellipse(CX + i * 30, neckY, 8, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }

  // 围巾：脖子一圈 + 两条垂下来的尾巴，尾巴先画，免得挡住领口
  ctx.fillStyle = shade(color, -0.18);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(CX + 3, neckY + 4);
  ctx.quadraticCurveTo(CX + 11, neckY + 35, CX + 28, neckY + 77);
  ctx.quadraticCurveTo(CX + 47, neckY + 79, CX + 54, neckY + 64);
  ctx.quadraticCurveTo(CX + 32, neckY + 28, CX + 28, neckY + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 收紧一点：太大条会把下巴整个盖住，脸就"陷进围巾里"了
  capsule(ctx, CX - 53, neckY, CX + 53, neckY - 2, 18, color);
  // 围巾尾巴上的绒球：纯装饰，但这一颗特别"卡通"
  ctx.fillStyle = shade(color, 0.2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(CX + 42, neckY + 73, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 4; i += 1) {
    const t = -30 + i * 20;
    ctx.beginPath();
    ctx.moveTo(CX + t, neckY - 12);
    ctx.lineTo(CX + t + 4, neckY + 10);
    ctx.stroke();
  }
}

function drawFrontGear(ctx, cfg) {
  const kind = cfg.parts.gear;
  if (kind !== 'stick' && kind !== 'flag') return;
  const color = cfg.colors.gear;
  ctx.save();
  ctx.translate(CX + SHOULDER_X + 18, SHOULDER_Y + ARM_LEN + 16);
  ctx.rotate(kind === 'stick' ? -0.22 : 0.1);
  if (kind === 'stick') {
    ctx.strokeStyle = '#C89A67';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -150);
    ctx.lineTo(6, 60);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -150);
    ctx.lineTo(6, 60);
    ctx.stroke();
    ctx.fillStyle = '#3E4A57';
    ctx.beginPath();
    ctx.moveTo(6, 54);
    ctx.quadraticCurveTo(46, 66, 52, 76);
    ctx.lineTo(42, 86);
    ctx.quadraticCurveTo(28, 76, 2, 68);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#2C333D';
    ctx.beginPath();
    ctx.ellipse(62, 96, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 这里**必须**先 restore 再 return：漏掉一次 restore，这个 translate+rotate 就会
    // 在画布状态栈里越积越多，每帧叠加一次，几秒后坐标涨到天文数字、页面直接卡死。
    // （点"道具 → 冰球杆"就卡死，就是这一行漏了。）
    ctx.restore();
    return;
  }
  ctx.strokeStyle = '#9AA7B2';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -64);
  ctx.lineTo(0, 80);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, -62);
  ctx.quadraticCurveTo(84, -48, 70, 10);
  ctx.lineTo(2, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px system-ui, "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2027', 34, -28);
  ctx.restore();
}

/** 展示海报里的滑行装备：与角色同一套坐标，不靠预渲染图片拼贴。 */
function drawSkiKit(ctx, cfg, t) {
  const accent = cfg.colors.hat || '#68d8df';
  ctx.save();
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2] of [[20, 558, 225, 570], [196, 570, 404, 552]]) {
    ctx.strokeStyle = '#385889';
    ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = '#eefaff';
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x1 + 15, y1); ctx.lineTo(x2 - 15, y2); ctx.stroke();
  }
  for (const side of [-1, 1]) {
    const handX = CX + side * 148;
    const handY = SHOULDER_Y + 58 + Math.sin(t * 1.6) * 2;
    ctx.strokeStyle = '#496d91';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(handX + side * 27, 558); ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(handX - side * 4, handY + 7); ctx.lineTo(handX + side * 21, 539); ctx.stroke();
    ctx.strokeStyle = '#496d91';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(handX + side * 9, 556); ctx.lineTo(handX + side * 45, 556); ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 主绘制                                                              */
/* ------------------------------------------------------------------ */

/**
 * 把整套形象画进目标框。
 *
 * 走路的三个动作（腿摆、手摆、身体起伏）全部从同一个相位推出来——
 * 分别用各自的相位就会变成"手脚各走各的"，一看就假。
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} cfg 形象配置
 * @param {{x:number,y:number,w:number,h:number}} box 目标框（CSS 像素，人物贴底居中）
 * @param {{t?:number, moving?:boolean, cheer?:number, shadow?:boolean, ski?:boolean}} pose
 */
export function drawCharacter(ctx, cfg, box, pose = {}) {
  if (cfg.figure?.canvas) {
    const picture = cfg.figure.canvas;
    const factor = Math.min(box.w / picture.width, box.h / picture.height);
    const width = picture.width * factor;
    const height = picture.height * factor;
    const bob = pose.moving ? Math.abs(Math.sin((pose.t || 0) * 4.6)) * 2 : Math.sin((pose.t || 0) * 1.6) * 1.5;
    ctx.drawImage(picture, box.x + (box.w - width) / 2, box.y + box.h - height - bob, width, height);
    return;
  }
  const scale = Math.min(box.w / CANVAS.w, box.h / CANVAS.h);
  const offX = box.x + (box.w - CANVAS.w * scale) / 2;
  const offY = box.y + box.h - CANVAS.h * scale;
  const t = pose.t ?? 0;
  const walking = pose.moving ? 1 : 0;
  const cheer = pose.cheer ?? 0;
  // 正面视角的走路：交替抬腿 + 身体起伏，两条腿不会左右打架。
  // 手臂从正面看不见前后摆，所以只做"随步伐小幅张合"。
  const phase = t * 4.6;
  const step = Math.sin(phase);
  const liftA = walking ? Math.max(0, step) * 30 : 0;
  const liftB = walking ? Math.max(0, -step) * 30 : 0;
  const bob = walking ? Math.abs(step) * 4 : Math.sin(t * 1.6) * 2.2 + 1.2;
  // -0.22 是手臂外张的基准角：不外张的话，手会整条埋在自己的衣服里，看不出有胳膊
  const armAngle = (side) => pose.ski ? (side < 0 ? 1.02 : -0.74) : -0.22 * side - (walking ? step * 0.09 * side : 0) - cheer * 2.5 * side;

  ctx.save();
  ctx.translate(offX, offY - bob);
  ctx.scale(scale, scale);

  if (pose.shadow !== false) {
    ctx.fillStyle = 'rgba(51, 82, 110, 0.16)';
    ctx.beginPath();
    ctx.ellipse(CX, FOOT_Y + 14, 118, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (pose.ski) drawSkiKit(ctx, cfg, t);
  else drawBackBoard(ctx, cfg);
  if (pose.ski) {
    ctx.translate(CX, HIP_Y);
    ctx.rotate(-0.17);
    ctx.translate(-CX, -HIP_Y);
  }
  drawBackHair(ctx, cfg);
  drawBackHood(ctx, cfg);
  drawLeg(ctx, cfg, -1, pose.ski ? 0.34 : -0.06, liftA);
  drawLeg(ctx, cfg, 1, pose.ski ? -0.08 : 0.06, pose.ski ? 11 : liftB);
  drawTorso(ctx, cfg);
  drawArm(ctx, cfg, -1, armAngle(-1), false);
  drawArm(ctx, cfg, 1, armAngle(1), true);
  drawHead(ctx, cfg);
  drawFrontHair(ctx, cfg);
  drawScarf(ctx, cfg);
  drawHat(ctx, cfg);
  drawGlasses(ctx, cfg);
  if (!pose.ski) drawFrontGear(ctx, cfg);

  ctx.restore();
}

/** 画到"以 (x, y) 为底、高 height"的位置（地图上的小人用它） */
export function drawCharacterAt(ctx, cfg, x, y, height, pose = {}) {
  const w = (height / CANVAS.h) * CANVAS.w;
  drawCharacter(ctx, cfg, { x: x - w / 2, y: y - height, w, h: height }, pose);
}

/**
 * 小游戏里的"头像球"：圆形裁切 + 帽子。
 * 整身在 20 像素的尺寸下会糊成一坨，所以小游戏里只留脸——但那张脸是你自己的。
 */
export function drawHeadBadge(ctx, x, y, r, cfg) {
  const face = cfg.face || {};
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(70, 110, 150, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.12, r * 0.92, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = face.skin || '#F3C9A8';
  ctx.fillRect(-r, -r, r * 2, r * 2);
  if (face.canvas) {
    drawFaceInto(ctx, face, 0, 0, r);
  } else if (cfg.figure?.canvas) {
    const figure = cfg.figure.canvas;
    ctx.drawImage(figure, figure.width * 0.18, 0, figure.width * 0.64, figure.height * 0.47, -r, -r, r * 2, r * 2);
  } else {
    ctx.save();
    ctx.scale(r / 104, r / 104);
    faceFeatures(ctx, 104, { hair: cfg.colors.hair });
    ctx.restore();
  }
  ctx.restore();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.6, r * 0.14);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  if (cfg.parts.hat !== 'none') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = cfg.colors.hat;
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 1.08, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(cfg.colors.hat, 0.34);
    ctx.fillRect(-r * 1.06, -r * 0.42, r * 2.12, r * 0.28);
    ctx.restore();
  }
  ctx.restore();
}
