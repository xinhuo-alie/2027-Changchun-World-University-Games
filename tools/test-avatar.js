/**
 * 抠图/卡通化管线的离线断言：不需要浏览器、不需要图片文件，全部是合成像素。
 *
 * 为什么这些逻辑值得单独测：它跑在用户设备上、失败时用户只会看到"抠出来一团糟"，
 * 而我们在服务端看不到任何日志。所以每个关键行为都在这里钉死一个断言，
 * 改算法的时候先跑这个，别靠"看着还行"。
 *
 * 用法：node tools/test-avatar.js
 */

import {
  removeBackground,
  cartoonize,
  addOutline,
  dropSpecks,
  sampleColor,
  guessFaceBox,
  keyFlatBackground,
  contentBounds,
  keepLargestComponent,
} from '../web/avatar-face.js';

const BG = [238, 242, 246];
const SKIN = [232, 180, 140];

let failed = 0;

function check(name, ok, detail = '') {
  const mark = ok ? '  ✓' : '  ✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed += 1;
}

const alphaAt = (img, x, y) => img.data[(y * img.width + x) * 4 + 3];
const rgbAt = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

/** 一张 side×side 的合成"人像"：单调背景 + 中间一个圆形色块 */
function makePortrait(side, opts = {}) {
  const data = new Uint8ClampedArray(side * side * 4);
  const cx = side / 2;
  const cy = side / 2;
  const r = side * (opts.radius ?? 0.3);
  for (let y = 0; y < side; y += 1) {
    for (let x = 0; x < side; x += 1) {
      const i = (y * side + x) * 4;
      // 背景可以是渐变（模拟墙面阴影），也可以按左右分区上色（模拟花背景）
      const t = opts.gradient ? y / side : 0;
      const noise = opts.noise ? (Math.random() - 0.5) * opts.noise : 0;
      const isFace = (x - cx) ** 2 + (y - cy) ** 2 < r * r;
      const busy = opts.wood
        ? [201, 168, 130] // 木门/木地板：会骗过肤色判据，但面积太大，应该被"紧凑度"挡掉
        : opts.busy && x > side / 2
          ? [122, 168, 216]
          : BG;
      const base = isFace ? SKIN : busy;
      for (let c = 0; c < 3; c += 1) {
        const grad = opts.gradient && !isFace ? -t * 26 : 0;
        data[i + c] = base[c] + grad + noise;
      }
      data[i + 3] = 255;
    }
  }
  return { data, width: side, height: side };
}

console.log('\n抠背景');
{
  const img = makePortrait(96);
  const out = removeBackground(img, { tolerance: 40 });
  check('单调背景：判定为背景的比例 > 0.5', out.removed > 0.5, `removed=${out.removed.toFixed(3)}`);
  check('四角被抠掉', alphaAt(out, 0, 0) < 20 && alphaAt(out, 95, 95) < 20);
  check('人脸中心保留', alphaAt(out, 48, 48) > 230);
  check('不修改原数组', img.data[3] === 255, '调用方的像素必须原样');
}

{
  const img = makePortrait(96, { gradient: true });
  const out = removeBackground(img, { tolerance: 40 });
  check('渐变背景也能抠（区域生长跟着走）', out.removed > 0.5 && alphaAt(out, 48, 48) > 230, `removed=${out.removed.toFixed(3)}`);
}

{
  const img = makePortrait(96, { busy: true });
  const out = removeBackground(img, { tolerance: 40 });
  check('花背景抠不动（<0.5 才不误判成"抠好了"）', out.removed < 0.5, `removed=${out.removed.toFixed(3)}`);
  check('花背景不会把人脸也吃掉', alphaAt(out, 48, 48) > 230);
}

// 没有 drift 闸门时，网格纹理/噪点会让泛洪"小步快跑"吃穿整张图
{
  const img = makePortrait(96, { noise: 70 });
  const out = removeBackground(img, { tolerance: 40 });
  check('随机噪点背景不会把整张图吃空', out.removed < 0.92, `removed=${out.removed.toFixed(3)}`);
}

{
  const img = makePortrait(96);
  const out = removeBackground(img, { tolerance: 40, softness: 2 });
  // 羽化过的边界应该有中间值，而不是非 0 即 255
  let soft = 0;
  for (let p = 3; p < out.data.length; p += 4) {
    const a = out.data[p];
    if (a > 30 && a < 225) soft += 1;
  }
  check('边缘有羽化过渡', soft > 20, `${soft} 个半透明像素`);
}

console.log('\n去碎点');
{
  const img = makePortrait(96);
  const cut = removeBackground(img, { tolerance: 40 });
  const stray = { data: cut.data, width: 96, height: 96 };
  // 背景里塞一个孤立像素：模拟抠图残留的头发渣
  const p = (10 * 96 + 10) * 4;
  stray.data[p + 3] = 255;
  dropSpecks(stray, { minNeighbors: 3 });
  check('孤立像素被抹掉', stray.data[p + 3] === 0);
  check('脸部没被误伤', stray.data[(48 * 96 + 48) * 4 + 3] > 230);
}

console.log('\n卡通化');
{
  const img = makePortrait(96, { noise: 18 });
  const out = cartoonize(img, { edge: 0 });
  // 平坦区（脸上）噪点的抖动程度
  const spread = (src) => {
    const lums = [];
    for (let y = 40; y < 56; y += 1) {
      for (let x = 40; x < 56; x += 1) {
        const i = (y * 96 + x) * 4;
        lums.push(0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2]);
      }
    }
    const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
    return Math.sqrt(lums.reduce((a, b) => a + (b - mean) ** 2, 0) / lums.length);
  };
  const lum = (src, x, y) => {
    const i = (y * 96 + x) * 4;
    return 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
  };
  check('平坦区噪点被压掉一半以上', spread(out) < spread(img) * 0.5, `σ ${spread(img).toFixed(1)} → ${spread(out).toFixed(1)}`);
  // 方差闸门的意义就在这里：脸上那些"平坦"的地方可以糊，边界一刀都不能糊
  const edgeBefore = Math.abs(lum(img, 48, 48) - lum(img, 48, 18));
  const edgeAfter = Math.abs(lum(out, 48, 48) - lum(out, 48, 18));
  check('人脸/背景的边界没有被糊掉', edgeAfter > edgeBefore * 0.7, `${edgeBefore.toFixed(0)} → ${edgeAfter.toFixed(0)}`);
  check('alpha 原样带过来', out.data[3] === img.data[3]);
}

console.log('\n勾墨线');
{
  const img = makePortrait(96);
  const cut = removeBackground(img, { tolerance: 40 });
  const lined = addOutline({ data: cut.data, width: 96, height: 96 }, { width: 2 });
  const edge = rgbAt(lined, 48 - 28, 48);
  check('轮廓内侧被上墨色', edge[0] < 90 && edge[2] > 80, `rgb=${edge.join(',')}`);
  check('轮廓中心没被污染', Math.abs(rgbAt(lined, 48, 48)[0] - SKIN[0]) < 24);
}

console.log('\n取主色');
{
  const img = makePortrait(96);
  const cut = removeBackground(img, { tolerance: 40 });
  const color = sampleColor({ data: cut.data, width: 96, height: 96 }, { x: 34, y: 34, w: 28, h: 28 });
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(color.slice(k, k + 2), 16));
  check('取到的是肤色而不是背景色', Math.abs(r - SKIN[0]) < 26 && r > g && g > b, `${color}`);
  check('返回标准十六进制', /^#[0-9a-f]{6}$/.test(color));
}

console.log('\n空图 / 极端参数');
{
  const flat = { data: new Uint8ClampedArray(16 * 16 * 4).fill(255), width: 16, height: 16 };
  const out = removeBackground(flat, { tolerance: 4 });
  check('纯色图不会崩，且几乎全被抠掉', out.removed > 0.95, `removed=${out.removed.toFixed(3)}`);
  const tiny = removeBackground({ data: new Uint8ClampedArray(4), width: 1, height: 1 }, {});
  check('1×1 图不会崩', tiny.width === 1 && tiny.removed >= 0);
}

console.log('\n抠掉生成图的纯色背景（偏蓝判据）');
{
  // 模拟模型出图最容易踩的坑：浅冰蓝背景 + 白 T 恤，两者在 RGB 上只差十几个数
  const side = 128;
  const data = new Uint8ClampedArray(side * side * 4);
  const put = (x, y, rgb, a = 255) => {
    const i = (y * side + x) * 4;
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
    data[i + 3] = a;
  };
  const BG = [214, 233, 247];
  const SHIRT = [232, 232, 236];
  const SKIN = [232, 180, 140];
  const HAIR = [30, 30, 34];
  for (let y = 0; y < side; y += 1) {
    for (let x = 0; x < side; x += 1) {
      // 背景带一点渐变，模拟模型的暗角
      const t = (x + y) / (side * 2);
      put(x, y, BG.map((c) => c - t * 26));
    }
  }
  for (let y = 40; y < 128; y += 1) {
    for (let x = 20; x < 108; x += 1) put(x, y, SHIRT); // 衣服
  }
  for (let y = 8; y < 56; y += 1) {
    for (let x = 40; x < 88; x += 1) put(x, y, y < 18 ? HAIR : SKIN); // 头发 + 脸
  }
  const img = { data, width: side, height: side };
  const out = keyFlatBackground(img, {});
  const alphaAt = (x, y) => out.data[(y * side + x) * 4 + 3];
  check('背景被抠掉', alphaAt(2, 2) < 20 && alphaAt(125, 125) < 20, `removed=${out.removed.toFixed(2)}`);
  check('白 T 恤保住了（泛洪那条路会连它一起吃掉）', alphaAt(64, 100) > 230);
  check('脸保住了', alphaAt(64, 34) > 230);
  check('头发保住了', alphaAt(64, 12) > 230);
  check('不修改原数组', img.data[3] === 255);
}

console.log('\n从"头肩特写"里切出头（脖颈线）');
{
  // 一张合成的"头肩像"：头 60×80，肩膀 200×60 —— 切完必须只剩头
  const side = 320;
  const data = new Uint8ClampedArray(side * side * 4);
  const fill = (x0, y0, x1, y1, rgb) => {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * side + x) * 4;
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = 255;
      }
    }
  };
  fill(130, 40, 190, 120, [232, 180, 140]); // 头
  fill(60, 120, 260, 180, [232, 232, 236]); // 肩膀
  const img = { data, width: side, height: side };
  const box = contentBounds(img, { threshold: 96, rejectBorder: false });
  check('找到整块人', Boolean(box) && box.h > 130, box ? `h=${box.h}` : 'null');
  check('脖颈线把头切了出来', Boolean(box && box.head) && box.head.h < 110, box && box.head ? `head.h=${box.head.h}` : 'null');
  check('头的宽度不含肩膀', Boolean(box && box.head) && box.head.w < 100, box && box.head ? `head.w=${box.head.w}` : 'null');
}

console.log('\n只留最大的一块（清掉细长残渣）');
{
  const side = 64;
  const data = new Uint8ClampedArray(side * side * 4);
  const put = (x, y) => {
    const i = (y * side + x) * 4;
    data[i] = 200;
    data[i + 1] = 180;
    data[i + 2] = 160;
    data[i + 3] = 255;
  };
  for (let y = 20; y < 44; y += 1) {
    for (let x = 20; x < 44; x += 1) put(x, y); // 主体
  }
  for (let x = 6; x < 58; x += 1) put(x, 8); // 一道细长的白线（背景暗边）
  const img = { data, width: side, height: side };
  const res = keepLargestComponent(img, {});
  const alphaAt = (x, y) => img.data[(y * side + x) * 4 + 3];
  check('细长残渣被清掉', alphaAt(30, 8) === 0 && alphaAt(8, 8) === 0, `removed=${res.removed}`);
  check('主体完整保留', alphaAt(32, 32) === 255 && alphaAt(20, 20) === 255);
}

console.log('\n猜脸（给取景框找初始位置）');
{
  const img = makePortrait(384);
  const box = guessFaceBox(img);
  check('单调背景里能找到脸', Boolean(box), box ? JSON.stringify(box) : 'null');
  if (box) {
    check('水平位置基本正确', Math.abs(box.cx - 0.5) < 0.12, `cx=${box.cx.toFixed(2)}`);
    // 合成图里的圆脸是画在画面正中的，连通块给的框本来就该落在中间偏上一点
    check('框落在人脸上而不是画面角落', box.cy < 0.6, `cy=${box.cy.toFixed(2)}`);
    check('取景半径在合理区间', box.r >= 0.04 && box.r < 0.43, `r=${box.r.toFixed(2)}`);
  }
}

{
  const img = makePortrait(384, { wood: true });
  const box = guessFaceBox(img);
  // 木门和脸同属"暖色"，会被合并成一大块；此时正确行为是**放弃猜测**（页面退回默认位置），
  // 而不是把整张照片当成一张脸
  check('木色背景不会整个被判成脸', !box || box.r < 0.43, box ? `r=${box.r.toFixed(2)}` : 'null（放弃猜测）');
}

{
  // 只有背景、没有人：允许猜不出来（页面退回默认位置）
  const barren = makePortrait(64, { radius: 0 });
  let crashed = false;
  let box = null;
  try {
    box = guessFaceBox(barren);
  } catch {
    crashed = true;
  }
  check('没有脸时不会崩', !crashed, box ? '猜到了（可接受，用户可拖）' : '返回 null');
}

console.log(failed === 0 ? '\n全部通过\n' : `\n${failed} 条断言失败\n`);
process.exit(failed === 0 ? 0 : 1);
