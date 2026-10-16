/**
 * 头像模块：把一张照片变成"贴纸脸"。
 *
 * 这里是整个 2D 方案里唯一有可能失败的一步（抠图质量取决于背景），所以它的设计原则是：
 * **每一步都返回可量化的指标，让人和 UI 都能判断"这步干得怎么样"**，
 * 而不是丢一个黑盒结果出来。抠不动的时候用户有容差滑杆和橡皮擦，比一句"AI 抠图失败"有用。
 *
 * 纯函数居多（不碰 DOM 之外的东西），因此 tools/test-avatar.js 能在 Node 里直接跑断言。
 */

export const FACE_SIZE = 256;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * 肤色判据。刻意"宽进"：宁可多认一点，也不要漏掉偏暖或偏暗的肤色。
 * 代价是木门、木地板也会通过，所以用它的地方必须再叠一道闸门
 * （比如"必须同时被抠图保留下来"，见 contentBounds 的 skinOnly）。
 */
export function isSkin(r, g, b) {
  return (
    r > 70 &&
    g > 32 &&
    b > 16 &&
    r > g &&
    g >= b * 0.72 &&
    r - Math.min(g, b) > 12 &&
    Math.abs(r - g) > 6 &&
    r - b > 22
  );
}

const maxDiff = (r, g, b, ref) =>
  Math.max(Math.abs(r - ref[0]), Math.abs(g - ref[1]), Math.abs(b - ref[2]));

function median(values) {
  if (!values.length) return 0;
  const sorted = Array.from(values).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * 抠背景：从画面四边洪水填充。
 *
 * 为什么不用模型：不用联网、不用 key、几十毫秒出结果，而且**失败模式可预期**——
 * 背景越单调效果越好（白墙、纯色幕布几乎完美），背景越花越抠不动。
 *
 * 泛洪规则：一个像素被判成背景，只要它和"四边种子色"够像，**或者**和相邻的已判定背景
 * 像素够像。后一条让算法能顺着渐变走（亮墙 → 阴影墙），前一条防止它顺着头发缝漏进脸里。
 *
 * @param {{data: Uint8ClampedArray, width: number, height: number}} img
 * @param {{tolerance?: number, softness?: number}} opts
 * @returns {{data: Uint8ClampedArray, width: number, height: number, removed: number}}
 *          removed = 被判成背景的像素比例，用来提示"抠干净了 / 几乎没抠动"
 */
export function removeBackground(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = new Uint8ClampedArray(img.data);
  const tol = clamp(opts.tolerance ?? 40, 4, 160);

  const edge = [];
  const stepX = Math.max(1, Math.round(w / 32));
  const stepY = Math.max(1, Math.round(h / 32));
  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    edge.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = 0; x < w; x += stepX) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y += stepY) {
    sample(0, y);
    sample(w - 1, y);
  }
  const bg = [
    median(edge.map((c) => c[0])),
    median(edge.map((c) => c[1])),
    median(edge.map((c) => c[2])),
  ];

  const isBg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let tail = 0;
  const seed = (x, y) => {
    const p = y * w + x;
    if (isBg[p]) return;
    const i = p * 4;
    if (maxDiff(data[i], data[i + 1], data[i + 2], bg) > tol) return;
    isBg[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < w; x += 1) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    seed(0, y);
    seed(w - 1, y);
  }

  /**
   * 两道闸门缺一不可：
   *  local（跟邻居比）让算法能跟着渐变走，亮墙→阴影墙不会被拦腰截断；
   *  drift（跟四边种子色比）防止它"一路小步"溜进完全不同的区域——
   *  照片的噪点、毛衣的纹理都是一小步一小步的，没有这道闸门，泛洪会从背景
   *  顺着纹理一路吃进人身上，把整张照片抠成空白。
   */
  const local = tol * 0.7;
  const drift = tol * clamp(opts.drift ?? 1.9, 1, 4);
  const grow = (from, to) => {
    if (isBg[to]) return;
    const i = from * 4;
    const j = to * 4;
    if (maxDiff(data[j], data[j + 1], data[j + 2], bg) > drift) return;
    if (maxDiff(data[j], data[j + 1], data[j + 2], [data[i], data[i + 1], data[i + 2]]) > local) return;
    isBg[to] = 1;
    queue[tail++] = to;
  };
  for (let head = 0; head < tail; head += 1) {
    const p = queue[head];
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) grow(p, p - 1);
    if (x < w - 1) grow(p, p + 1);
    if (y > 0) grow(p, p - w);
    if (y < h - 1) grow(p, p + w);
  }

  const alpha = new Float32Array(w * h);
  let removed = 0;
  for (let p = 0; p < w * h; p += 1) {
    if (isBg[p]) removed += 1;
    alpha[p] = isBg[p] ? 0 : 255;
  }
  // 二值 mask 会有台阶，做一两遍 3×3 平均把它变成半透明过渡，边缘就不"割手"了
  const passes = clamp(Math.round(opts.softness ?? 1), 0, 3);
  for (let pass = 0; pass < passes; pass += 1) {
    const tmp = Float32Array.from(alpha);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            sum += tmp[yy * w + xx];
            n += 1;
          }
        }
        alpha[y * w + x] = sum / n;
      }
    }
  }
  for (let p = 0; p < w * h; p += 1) data[p * 4 + 3] = alpha[p];

  return { data, width: w, height: h, removed: removed / (w * h) };
}

/**
 * 抠掉"整片纯色背景"——生成图专用。
 *
 * 为什么不用 removeBackground 那套泛洪：模型画的图里，**白 T 恤和浅冰蓝背景在 RGB 上
 * 只差十几个数**，泛洪会顺着"背景 → 衣服"一路爬过去，把整个人吃掉
 * （实测过一次：结果就是"头全灰"，圆里只剩胸口那片衣服）。
 *
 * 改用**偏蓝程度**判定背景：背景是提示词里写死的浅冰蓝（蓝通道明显高于红通道），
 * 而皮肤、白衣服、深色头发都不满足这一条。不生长、不扩散，边界反而更干净。
 * 亮度只用来兜住背景上的暗角/阴影，保护主体靠的是"偏蓝"这一条，不是亮度。
 */
export function keyFlatBackground(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = new Uint8ClampedArray(img.data);

  const rs = [];
  const gs = [];
  const bs = [];
  const stepX = Math.max(1, Math.round(w / 32));
  const stepY = Math.max(1, Math.round(h / 32));
  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    rs.push(data[i]);
    gs.push(data[i + 1]);
    bs.push(data[i + 2]);
  };
  for (let x = 0; x < w; x += stepX) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y += stepY) {
    sample(0, y);
    sample(w - 1, y);
  }
  const ref = [median(rs), median(gs), median(bs)];
  // 新版全身角色使用高对比色幕；浅蓝旧作品继续使用原判据。
  // 饱和背景用色度区分，保留白衣、肤色和蓝色器材，并柔化混色边缘。
  if (Math.max(...ref) - Math.min(...ref) > 100) {
    const low = ref.indexOf(Math.min(...ref));
    const high = [0, 1, 2].filter((channel) => ref[channel] - ref[low] > 100);
    if (high.length) {
      let removed = 0;
      for (let i = 0; i < data.length; i += 4) {
        const strength = Math.min(...high.map((channel) => data[i + channel] - data[i + low]));
        const coverage = Math.max(0, Math.min(1, (strength - 30) / 100));
        if (!coverage) continue;
        data[i + 3] = Math.round(data[i + 3] * (1 - coverage));
        // 去掉半透明边缘中混入的色幕颜色，避免粉色光边。
        if (coverage < 1) {
          for (let channel = 0; channel < 3; channel += 1) {
            data[i + channel] = Math.max(0, Math.min(255,
              (data[i + channel] - coverage * ref[channel]) / (1 - coverage)));
          }
        }
        if (data[i + 3] < 32) removed += 1;
      }
      return { data, width: w, height: h, removed: removed / (w * h) };
    }
  }
  const blueRef = ref[2] - ref[0];
  const lumRef = 0.299 * ref[0] + 0.587 * ref[1] + 0.114 * ref[2];

  // 20：模型在人物周围常画一圈偏灰蓝的过渡，给 18 时它会被判成"不是背景"留下来
  // （贴到头上就是一道白线）；给到 26 又会把白衣服的边缘一起带走——20 是实测的中间值。
  const blueSlack = opts.blueSlack ?? 20;
  const lumSlack = opts.lumSlack ?? 88; // 允许更暗（暗角、投影）
  const dist = opts.distance ?? 130; // 颜色距离上限：离参考色太远就肯定不是背景

  let removed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const near = Math.max(Math.abs(r - ref[0]), Math.abs(g - ref[1]), Math.abs(b - ref[2])) < dist;
    if (!near) continue;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (b - r >= blueRef - blueSlack && lum >= lumRef - lumSlack) {
      data[i + 3] = 0;
      removed += 1;
    }
  }
  return { data, width: w, height: h, removed: removed / (w * h) };
}

/** 从左右边缘估计每行底色，去掉色幕及模型误画的地面；仅沿背景连通扩展。 */
export function keyFigureBackground(img) {
  const { width: w, height: h } = img;
  const keyed = keyFlatBackground(img);
  const data = keyed.data;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  const rows = [];
  for (let y = 0; y < h; y++) {
    const samples = [[], [], []];
    for (let dy = -2; dy <= 2; dy++) {
      const sy = Math.max(0, Math.min(h - 1, y + dy));
      for (const x of [0, 1, w - 2, w - 1]) {
        const i = (sy * w + x) * 4;
        for (let c = 0; c < 3; c++) samples[c].push(img.data[i + c]);
      }
    }
    rows.push(samples.map(median));
  }
  let head = 0, tail = 0;
  const visit = (p) => {
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * 4;
    const ref = rows[Math.floor(p / w)];
    const distance = Math.max(...ref.map((v, c) => Math.abs(img.data[i + c] - v)));
    if (data[i + 3] > 32 && distance > 65) return;
    data[i + 3] = 0;
    queue[tail++] = p;
  };
  for (let y = 0; y < h; y++) { visit(y * w); visit(y * w + w - 1); }
  for (let x = 0; x < w; x++) { visit(x); visit((h - 1) * w + x); }
  while (head < tail) {
    const p = queue[head++], x = p % w;
    if (x) visit(p - 1);
    if (x < w - 1) visit(p + 1);
    if (p >= w) visit(p - w);
    if (p < w * (h - 1)) visit(p + w);
  }
  keepLargestComponent({ data, width: w, height: h });
  return { data, width: w, height: h };
}

/**
 * 只保留最大的一块前景，其余全部清掉。
 *
 * 生成图抠完常留下细长的残渣（背景与人物交界处的暗边、飘出去的发丝）：它们又细又长，
 * 能通过"去碎点"的邻域检查，贴到头上就是一道莫名其妙的白线。按连通块只取最大的一块，
 * 一步就干净了。
 */
export function keepLargestComponent(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = img.data;
  const thr = opts.threshold ?? 96;
  const solid = new Uint8Array(w * h);
  for (let p = 0; p < solid.length; p += 1) {
    if (data[p * 4 + 3] >= thr) solid[p] = 1;
  }

  const seen = new Uint8Array(w * h);
  let best = null;
  for (let start = 0; start < solid.length; start += 1) {
    if (!solid[start] || seen[start]) continue;
    const queue = [start];
    const pixels = [start];
    seen[start] = 1;
    for (let head = 0; head < queue.length; head += 1) {
      const cur = queue[head];
      const x = cur % w;
      const y = (cur - x) / w;
      const push = (np) => {
        if (!solid[np] || seen[np]) return;
        seen[np] = 1;
        queue.push(np);
        pixels.push(np);
      };
      if (x > 0) push(cur - 1);
      if (x < w - 1) push(cur + 1);
      if (y > 0) push(cur - w);
      if (y < h - 1) push(cur + w);
    }
    if (!best || pixels.length > best.length) best = pixels;
  }
  if (!best) return { removed: 0, kept: 0 };

  const keep = new Uint8Array(w * h);
  for (const p of best) keep[p] = 1;
  let removed = 0;
  for (let p = 0; p < solid.length; p += 1) {
    if (solid[p] && !keep[p]) {
      data[p * 4 + 3] = 0;
      removed += 1;
    }
  }
  return { removed, kept: best.length };
}

/** 抹掉孤立碎点：抠完后背景里残留的几撮头发、噪点，比边缘不齐更显脏 */
export function dropSpecks(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = img.data;
  const minNeighbors = clamp(Math.round(opts.minNeighbors ?? 3), 0, 8);
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = (y * w + x) * 4;
      if (copy[i + 3] < 128) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          if (copy[((y + dy) * w + (x + dx)) * 4 + 3] >= 128) n += 1;
        }
      }
      if (n < minNeighbors) data[i + 3] = 0;
    }
  }
  return img;
}

/**
 * 卡通化：平坦区平滑 → 色调分离 → 提饱和 → 边缘压深。
 *
 * 光做色调分离，皮肤会出现色块、照片噪点会变成脏点，所以先来一遍**只在平坦区生效**的
 * 模糊（局部方差大的地方是五官，原样保留），再分离色调，最后沿边缘混入墨色。
 * 目的不是"变成插画"，而是把噪点和渐变压掉，让它和矢量衣服看起来是一套东西。
 */
export function cartoonize(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = img.data;
  const levels = clamp(Math.round(opts.levels ?? 7), 3, 16);
  const blend = clamp(opts.blend ?? 0.7, 0, 1);
  const sat = opts.saturation ?? 1.16;
  const edgeStrength = clamp(opts.edge ?? 0.55, 0, 1);
  const varianceGate = (opts.varianceGate ?? 26) ** 2;

  const flat = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      let sum = 0;
      let sum2 = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        const yy = clamp(y + dy, 0, h - 1);
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = clamp(x + dx, 0, w - 1);
          const j = (yy * w + xx) * 4;
          r += data[j];
          g += data[j + 1];
          b += data[j + 2];
          const lum = (data[j] + data[j + 1] + data[j + 2]) / 3;
          sum += lum;
          sum2 += lum * lum;
          n += 1;
        }
      }
      const mean = sum / n;
      const variance = sum2 / n - mean * mean;
      if (variance < varianceGate) {
        flat[i] = r / n;
        flat[i + 1] = g / n;
        flat[i + 2] = b / n;
      } else {
        flat[i] = data[i];
        flat[i + 1] = data[i + 1];
        flat[i + 2] = data[i + 2];
      }
      flat[i + 3] = data[i + 3];
    }
  }

  const step = 255 / (levels - 1);
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (flat[i + 3] === 0) continue;
    let r = flat[i];
    let g = flat[i + 1];
    let b = flat[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    r = luma + (r - luma) * sat;
    g = luma + (g - luma) * sat;
    b = luma + (b - luma) * sat;
    const q = (v) => v + (Math.round(v / step) * step - v) * blend;
    out[i] = q(r);
    out[i + 1] = q(g);
    out[i + 2] = q(b);
    out[i + 3] = flat[i + 3];
  }

  if (edgeStrength > 0) {
    const at = (x, y) => {
      const xx = clamp(x, 0, w - 1);
      const yy = clamp(y, 0, h - 1);
      const i = (yy * w + xx) * 4;
      return 0.299 * out[i] + 0.587 * out[i + 1] + 0.114 * out[i + 2];
    };
    const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    const ink = [51, 82, 110];
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const i = (y * w + x) * 4;
        if (out[i + 3] < 40) continue;
        let sx = 0;
        let sy = 0;
        let k = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const l = at(x + dx, y + dy);
            sx += l * gx[k];
            sy += l * gy[k];
            k += 1;
          }
        }
        const mag = Math.sqrt(sx * sx + sy * sy) / 1020;
        const t = clamp((mag - 0.05) * 2.6, 0, 1) * edgeStrength;
        if (t > 0.02) {
          out[i] += (ink[0] - out[i]) * t;
          out[i + 1] += (ink[1] - out[i + 1]) * t;
          out[i + 2] += (ink[2] - out[i + 2]) * t;
        }
      }
    }
  }

  return { data: out, width: w, height: h };
}

/**
 * 沿轮廓内侧勾一道墨线。
 *
 * 注意是"向内"勾：只给已经有内容、且附近有透明像素的像素上色，所以轮廓不会因此胖一圈。
 * 这一笔是照片脸和矢量衣服之间唯一的风格桥——没有它，照片头像永远像是贴上去的。
 */
export function addOutline(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = new Uint8ClampedArray(img.data);
  const width = clamp(Math.round(opts.width ?? 2), 1, 5);
  const rgb = opts.rgb || [51, 82, 110];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 170) continue;
      let boundary = false;
      for (let dy = -width; dy <= width && !boundary; dy += 1) {
        for (let dx = -width; dx <= width; dx += 1) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          if (data[(yy * w + xx) * 4 + 3] < 90) {
            boundary = true;
            break;
          }
        }
      }
      if (boundary) {
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = 255;
      }
    }
  }
  return { data, width: w, height: h };
}

/** 取一块区域的主色（按 16 级分桶投票），用来把发色/肤色默认成"你自己的颜色" */
export function sampleColor(img, box) {
  const w = img.width;
  const data = img.data;
  const x0 = clamp(Math.round(box.x), 0, w - 1);
  const y0 = clamp(Math.round(box.y), 0, img.height - 1);
  const x1 = clamp(Math.round(box.x + box.w), 0, w);
  const y1 = clamp(Math.round(box.y + box.h), 0, img.height);
  const buckets = new Map();
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 160) continue;
      const key = `${data[i] >> 4}-${data[i + 1] >> 4}-${data[i + 2] >> 4}`;
      const hit = buckets.get(key);
      if (hit) {
        hit.n += 1;
        hit.r += data[i];
        hit.g += data[i + 1];
        hit.b += data[i + 2];
      } else {
        buckets.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }
  let best = null;
  for (const hit of buckets.values()) if (!best || hit.n > best.n) best = hit;
  if (!best) return null;
  const hex = (v) => Math.round(v / best.n).toString(16).padStart(2, '0');
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}

/**
 * 找前景（留下来的像素）的包围盒。
 *
 * 它是"贴纸脸"最后一道保险：用户的取景框松一点没关系，但**头必须填满最终那张 256×256**，
 * 否则圆脸盘里会挤着一张小脸、四周全是残留的背景色。
 * 所以拿到抠图结果后先量一下内容在哪、多大，再按内容重新取一次。
 *
 * 孤立点不计入：抠图残留的碎屑会把包围盒撑到整张图，量出来的尺寸就没意义了。
 */
export function contentBounds(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = img.data;
  const thr = opts.threshold ?? 96;
  const solid = new Uint8Array(w * h);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x;
      const i = p * 4 + 3;
      if (data[i] < thr) continue;
      // skinOnly：只要肤色像素。单用会把木门也收进来（木门同样是暖色），
      // 但配上"必须被抠图保留下来"（alpha 够大）就只剩脸了——木门早被抠掉了
      if (opts.skinOnly && !isSkin(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])) continue;
      // 孤立点不算：抠图残留的碎屑会把包围盒撑到整张图
      let neighbours = 0;
      if (x > 0 && data[i - 4] >= thr) neighbours += 1;
      if (x < w - 1 && data[i + 4] >= thr) neighbours += 1;
      if (y > 0 && data[i - w * 4] >= thr) neighbours += 1;
      if (y < h - 1 && data[i + w * 4] >= thr) neighbours += 1;
      if (neighbours >= 2) solid[p] = 1;
    }
  }

  /*
   * 找连通的块，而不是把所有前景像素一锅端。
   *
   * 关键的一招是**丢掉贴着边的块**：取景框通常比头松，框边上那圈没被抠干净的背景
   * （门框阴影、地板）必然贴着边，而人的头在中间、不碰边。
   * 之前用整体包围盒，那个阴影带直接把盒子撑成了整块框，收紧这一步等于没做。
   */
  const seen = new Uint8Array(w * h);
  // 逐行的左右边界：用来找"脖颈线"——头在上面，过了脖子会突然变宽（肩膀）
  const rowMin = new Int32Array(h).fill(w);
  const rowMax = new Int32Array(h).fill(-1);
  let best = null;
  for (let start = 0; start < solid.length; start += 1) {
    if (!solid[start] || seen[start]) continue;
    const queue = [start];
    seen[start] = 1;
    let area = 0;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;
    let touchesBorder = false;
    for (let head = 0; head < queue.length; head += 1) {
      const cur = queue[head];
      const x = cur % w;
      const y = (cur - x) / w;
      area += 1;
      if (x < rowMin[y]) rowMin[y] = x;
      if (x > rowMax[y]) rowMax[y] = x;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
      const push = (np) => {
        if (!solid[np] || seen[np]) return;
        seen[np] = 1;
        queue.push(np);
      };
      if (x > 0) push(cur - 1);
      if (x < w - 1) push(cur + 1);
      if (y > 0) push(cur - w);
      if (y < h - 1) push(cur + w);
    }
    if (touchesBorder && opts.rejectBorder !== false) continue;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const fill = area / (bw * bh);
    // 太散的不算（比如一片碎屑拼出来的"虚"块）
    if (fill < (opts.minFill ?? 0.35)) continue;
    if (!best || area > best.area) {
      best = { area, x: minX, y: minY, w: bw, h: bh, cx: minX + bw / 2, cy: minY + bh / 2, fill };
      best.head = headBoxFromRows(rowMin, rowMax, minY, maxY);
    }
    // 换下一块前把逐行统计清掉
    for (let y = minY; y <= maxY; y += 1) {
      rowMin[y] = w;
      rowMax[y] = -1;
    }
  }
  if (!best) return null;
  return {
    x: best.x,
    y: best.y,
    w: best.w,
    h: best.h,
    cx: best.cx,
    cy: best.cy,
    fill: best.fill,
    area: best.area,
    head: best.head,
  };
}

/**
 * 从逐行宽度里切出"头"。
 *
 * 为什么需要这一步：人的头、脖子、肩膀是连在一起的一整块，直接用包围盒量出来的
 * 是**上半身**的宽度，取景框就会松成"圈住胸"。而头在上、肩膀在下，
 * 逐行看宽度会在脖颈处突然变宽——在那个突变处切开，上面那段就是头。
 *
 * 这是纯几何的，不依赖颜色，所以木门、暖色墙都骗不了它。
 */
function headBoxFromRows(rowMin, rowMax, minY, maxY) {
  const rows = [];
  for (let y = minY; y <= maxY; y += 1) {
    if (rowMax[y] < rowMin[y]) continue;
    rows.push({ y, x0: rowMin[y], x1: rowMax[y], w: rowMax[y] - rowMin[y] + 1 });
  }
  if (rows.length < 6) return null;
  /*
   * 脖颈线用"最宽处"来找，而不是"比头部基准宽 1.5 倍"。
   *
   * 后者被头发的形状骗过：模型画的头发是一撮一撮的，顶部那几行很窄，
   * 基准一旦偏小，颧骨那一行就会被误判成脖颈——下巴直接被切掉（实测）。
   * 而人身上最宽的一段几乎总是肩膀，所以：从上往下找第一行宽度达到全局最宽 72% 的位置。
   */
  let maxW = 0;
  for (const r of rows) if (r.w > maxW) maxW = r.w;
  let cut = rows.length;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].w >= maxW * 0.72) {
      cut = i;
      break;
    }
  }
  // 切得太狠说明这张图里根本没有肩膀（本来就是张头像），那就别切
  let head = rows.slice(0, Math.max(3, cut));
  if (head.length < rows.length * 0.55) head = rows;
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const r of head) {
    if (r.x0 < x0) x0 = r.x0;
    if (r.x1 > x1) x1 = r.x1;
  }
  return {
    x: x0,
    y: head[0].y,
    w: x1 - x0 + 1,
    h: head[head.length - 1].y - head[0].y + 1,
    cx: (x0 + x1) / 2,
    cy: (head[0].y + head[head.length - 1].y) / 2,
  };
}

/**
 * 把肤色掩码膨胀后找连通块，返回"不贴边"的最大块。
 *
 * 膨胀用两遍一维最大滤波（横向一遍、纵向一遍），比二维卷积快得多，效果一样。
 * 膨胀的理由：眉毛、眼睛、嘴唇在肤色掩码上都是洞，会把一张脸切成额头、左脸、右脸，
 * 任何一块的包围盒都不是脸；糊上之后脸就是一整块了。
 *
 * "不贴边"是这里最值钱的一条：整块都符合肤色的背景（木门、木地板、暖色墙）必然贴着画面边，
 * 人脸不会。光这一条就能挡掉最常见的一类误判。
 */
function largestInsetBlob(mask, G, radius = 3) {
  const tmp = new Uint8Array(G * G);
  const dil = new Uint8Array(G * G);
  for (let y = 0; y < G; y += 1) {
    for (let x = 0; x < G; x += 1) {
      for (let d = -radius; d <= radius; d += 1) {
        const xx = x + d;
        if (xx < 0 || xx >= G) continue;
        if (mask[y * G + xx]) {
          tmp[y * G + x] = 1;
          break;
        }
      }
    }
  }
  for (let x = 0; x < G; x += 1) {
    for (let y = 0; y < G; y += 1) {
      for (let d = -radius; d <= radius; d += 1) {
        const yy = y + d;
        if (yy < 0 || yy >= G) continue;
        if (tmp[yy * G + x]) {
          dil[y * G + x] = 1;
          break;
        }
      }
    }
  }

  const seen = new Uint8Array(G * G);
  let best = null;
  for (let p = 0; p < dil.length; p += 1) {
    if (!dil[p] || seen[p]) continue;
    const queue = [p];
    seen[p] = 1;
    let area = 0;
    let minX = G;
    let maxX = -1;
    let minY = G;
    let maxY = -1;
    let touchesBorder = false;
    for (let head = 0; head < queue.length; head += 1) {
      const cur = queue[head];
      const x = cur % G;
      const y = (cur - x) / G;
      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x <= radius || y <= radius || x >= G - 1 - radius || y >= G - 1 - radius) touchesBorder = true;
      const push = (np) => {
        if (!dil[np] || seen[np]) return;
        seen[np] = 1;
        queue.push(np);
      };
      if (x > 0) push(cur - 1);
      if (x < G - 1) push(cur + 1);
      if (y > 0) push(cur - G);
      if (y < G - 1) push(cur + G);
    }
    if (touchesBorder) continue;
    if (!best || area > best.area) {
      best = { area, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
  }
  return best;
}

/**
 * 猜脸在哪 —— 只为了给取景框一个像样的初始位置。
 *
 * 这里刻意不引入任何人脸识别：桌面 Chrome 没有 FaceDetector（实测 undefined），
 * 引模型又要联网、要几百 KB。所以用三个便宜线索挑"最像头"的色块：
 *   肤色（红通道明显高于蓝通道，且不是灰白墙）→ 紧凑（长宽比接近）→ 靠上。
 * 猜错的代价很小——用户拖一下圆圈就行；猜对的收益很大——大部分人就不用拖了。
 *
 * 会被后颈和手干扰，所以中心点取色块靠上的 40% 处，而不是几何中心。
 */
export function guessFaceBox(img, opts = {}) {
  const w = img.width;
  const h = img.height;
  const data = img.data;
  const G = 128;
  const stepX = w / G;
  const stepY = h / G;
  const lum = new Float32Array(G * G);
  const skin = new Float32Array(G * G);

  for (let gy = 0; gy < G; gy += 1) {
    for (let gx = 0; gx < G; gx += 1) {
      // 块平均：单像素判肤色噪声太大
      const x0 = Math.floor(gx * stepX);
      const x1 = Math.max(x0 + 1, Math.min(w, Math.floor((gx + 1) * stepX)));
      const y0 = Math.floor(gy * stepY);
      const y1 = Math.max(y0 + 1, Math.min(h, Math.floor((gy + 1) * stepY)));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * w + x) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n += 1;
        }
      }
      if (!n) continue;
      r /= n;
      g /= n;
      b /= n;
      const p = gy * G + gx;
      lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      skin[p] = isSkin(r, g, b) ? 1 : 0;
    }
  }

  /**
   * 边缘强度。
   *
   * 只靠肤色是不够的：暖色木门、木地板、暖黄墙面都会整块通过肤色判据（实测踩过），
   * 结果取景框落在门板上。而脸上一定有眼睛、眼镜、发际线这些高频结构，
   * 光滑的木板墙没有。所以"是不是脸"= 肤色 **且** 附近有纹理。
   */
  const edge = new Float32Array(G * G);
  for (let y = 1; y < G - 1; y += 1) {
    for (let x = 1; x < G - 1; x += 1) {
      const p = y * G + x;
      const dx = Math.abs(lum[p + 1] - lum[p - 1]);
      const dy = Math.abs(lum[p + G] - lum[p - G]);
      edge[p] = Math.min(1, Math.max(dx, dy) / 38);
    }
  }
  const density = new Float32Array(G * G);
  for (let y = 1; y < G - 1; y += 1) {
    for (let x = 1; x < G - 1; x += 1) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) sum += edge[(y + dy) * G + (x + dx)];
      }
      density[y * G + x] = sum / 9;
    }
  }

  const like = new Float32Array(G * G);
  for (let p = 0; p < like.length; p += 1) {
    like[p] = skin[p] ? 0.25 + Math.min(1, density[p] * 3.2) : 0;
  }
  // 暗部图：真人脸上一定有深色（眼睛、眼镜、头发、眉毛），木门、墙面没有。
  // 这是唯一能把"暖色木门"和"暖色皮肤"分开的线索，光靠色相它们是同一个颜色。
  const dark = new Float32Array(G * G);
  for (let p = 0; p < dark.length; p += 1) dark[p] = lum[p] < 92 ? 1 : 0;

  /*
   * 路线 A（首选）：把肤色掩码"膨一下"再找连通块。
   *
   * 为什么必须膨胀：眉毛、眼睛、嘴唇在肤色掩码上都是洞，会把一张脸切成额头、左脸、
   * 右脸好几块，任何一块的包围盒都不是脸。膨胀 3 格把洞糊上，脸就是一整块了。
   * 为什么贴边的块直接丢：木门、木地板、暖色墙这些"整块都符合肤色"的东西必然贴着画面边，
   * 而人的脸在画面里、不碰边——这一条顺手解决了最难缠的木门误判。
   */
  const blob = largestInsetBlob(skin, G, 3);
  if (blob) {
    const shrink = 3 / G; // 膨胀量要从包围盒里减掉
    const x0 = blob.x / G + shrink;
    const x1 = (blob.x + blob.w) / G - shrink;
    const y0 = blob.y / G + shrink;
    const y1 = (blob.y + blob.h) / G - shrink;
    const bw = Math.max(0.02, x1 - x0);
    const bh = Math.max(0.02, y1 - y0);
    // 宽高比像脸、尺寸也合理才敢用；否则交给路线 B
    if (bw > 0.06 && bw < 0.75 && bh > 0.06 && bh < 0.85 && bw / bh > 0.4 && bw / bh < 1.9) {
      return {
        cx: clamp((x0 + x1) / 2, 0.1, 0.9),
        // 块里含着脖子，锚点往上取一点，落在脸上
        cy: clamp(y0 + bh * 0.45, 0.06, 0.9),
        r: clamp(Math.max(bw, bh) * 0.58, opts.minR ?? 0.05, opts.maxR ?? 0.42),
      };
    }
  }

  // 积分图：滑窗统计靠它。不然 96² 格子 × 三种尺度做暴力求和会明显卡一下
  const integral = (arr) => {
    const S = new Float64Array((G + 1) * (G + 1));
    for (let y = 0; y < G; y += 1) {
      for (let x = 0; x < G; x += 1) {
        S[(y + 1) * (G + 1) + x + 1] =
          arr[y * G + x] + S[y * (G + 1) + x + 1] + S[(y + 1) * (G + 1) + x] - S[y * (G + 1) + x];
      }
    }
    return S;
  };
  const boxSum = (S, x, y, w, h = w) => {
    // 越界就夹到边界：这是启发式打分，不需要严谨的边界条件
    const x0 = Math.max(0, Math.min(G, Math.floor(x)));
    const y0 = Math.max(0, Math.min(G, Math.floor(y)));
    const x1 = Math.max(x0, Math.min(G, Math.ceil(x + w)));
    const y1 = Math.max(y0, Math.min(G, Math.ceil(y + h)));
    return S[y1 * (G + 1) + x1] - S[y0 * (G + 1) + x1] - S[y1 * (G + 1) + x0] + S[y0 * (G + 1) + x0];
  };

  const likeSum = integral(like);
  const skinSum = integral(skin);
  const darkSum = integral(dark);
  /**
   * 滑窗打分。
   *
   * 分数由三块拼起来，缺一不可（三块都是被具体的坏照片逼出来的）：
   *
   *  1. **紧致度**：窗口里是肤色、窗口外圈不是。这一条解决"自拍/证件照"——
   *     脸占了画面一半时，只在脸上取一块 8% 的小窗口也满足"里面全是肤色"，
   *     结果框会缩到颧骨上。要求"外圈不是肤色"，框就会自动张到脸的边界。
   *  2. **暗部**：真人脸上一定有深色（眼睛、眼镜、头发、眉毛）。这一条解决"木门"——
   *     暖色木门整块都符合肤色判据，但它的暗部只是木纹渐变，没有五官那种深色结构。
   *  3. **先验**：人一般站在画面中间、脸在上半部分。打破平局用，也是"别乱跑"的保险。
   *
   * 尺度必须铺得够开：自拍的脸占四成，全身照的脸占半成，差八倍。
   */
  const scan = (scales) => {
    let found = null;
    for (const fraction of scales) {
      const size = Math.max(3, Math.round(fraction * G));
      for (let y = 0; y + size <= G; y += 1) {
        for (let x = 0; x + size <= G; x += 1) {
          const skinCount = boxSum(skinSum, x, y, size, size);
          // 0.45：一个"贴着脸的框"里必然混着头发、眉毛、嘴唇这些非肤色格子，
          // 门槛设到 0.6 就会把整张脸的大框筛掉，只剩脸颊上那种全肤色的小框
          if (skinCount / (size * size) < 0.45) continue;
          const cxn = (x + size / 2) / G;
          const cyn = (y + size / 2) / G;
          if (cyn > 0.62 || cxn < 0.12 || cxn > 0.88) continue;
          const outer = boxSum(skinSum, x - 1, y - 1, size + 2, size + 2);
          const tight = (skinCount - (outer - skinCount) * 0.8) / (size * size);
          // 只在肤色格子上取均值：否则"戴眼镜、刘海厚"的脸会被自己的非肤色像素拖低分
          const mean = boxSum(likeSum, x, y, size, size) / skinCount;
          const darkShare = boxSum(darkSum, x, y, size, size) / (size * size);
          const score =
            tight +
            (mean - 0.25) * 0.6 +
            darkShare * 0.4 -
            0.3 * Math.abs(cxn - 0.5) -
            0.15 * cyn;
          if (!found || score > found.score) found = { score, cxn, cyn, size, x, y };
        }
      }
    }
    return found;
  };

  const best = scan([0.09, 0.13, 0.18, 0.25, 0.34]);
  if (!best) return null;
  const minR = opts.minR ?? 0.05;
  const maxR = opts.maxR ?? 0.42;
  return {
    cx: clamp(best.cxn, 0.1, 0.9),
    cy: clamp(best.cyn, 0.08, 0.9),
    // 窗口当"脸"看，取景圈再放大一半：给头发、耳朵留余量
    r: clamp((best.size / G) * 0.75, minR, maxR),
  };
}

/**
 * 把照片装进一个正方形工作区（contain 而不是 cover）。
 *
 * 一度用的是 cover，结果**全身照的头直接被裁掉了**——竖构图的照片按宽度铺满，
 * 上下各裁掉四分之一，正好把脑袋切走，取景框自然找不到脸。
 * 改成 contain：照片完整装进方形，多出来的地方留底色。代价是两侧有空白，
 * 换来的是"任何构图的照片都不会被裁掉关键部位"。
 */
export function toSquarePixels(source, side, background = '#F3F7FB') {
  return fitToSquare(source, side, background).imageData;
}

/**
 * 同上的完整版：除了方形像素，还告诉你**原图是怎么摆进来的**。
 *
 * 为什么需要这个映射：全身照里的脸在方形工作区里只剩几十像素，
 * 如果最终的头像也从工作区里取，就是"先缩小再放大"，糊上加糊。
 * 有了映射，最终那一刀可以直接回原图按原始分辨率裁——
 * 这是画质和"能不能做出干净的贴纸脸"的分界线。
 */
export function fitToSquare(source, side, background = '#F3F7FB') {
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  const sw = source.width || source.naturalWidth;
  const sh = source.height || source.naturalHeight;
  const scale = Math.min(side / sw, side / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const ox = (side - dw) / 2;
  const oy = (side - dh) / 2;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, side, side);
  ctx.drawImage(source, ox, oy, dw, dh);
  return {
    imageData: ctx.getImageData(0, 0, side, side),
    mapping: { ox, oy, scale, sw, sh },
  };
}

/**
 * 量一张贴纸脸里"人"的实际范围。
 *
 * 用途见 avatar-parts.js 的 drawHead：画头的时候要按这个范围做自适应缩放，
 * 而不是把整张图硬塞进圆里——不然取景框一松，圆里就是一张小脸配一圈背景。
 */
export function canvasContent(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return contentBounds(
    { data: img.data, width: canvas.width, height: canvas.height },
    { threshold: 90, rejectBorder: false, minFill: 0.2 },
  );
}

/**
 * 生成贴纸脸：抠背景 → 去碎点 → 卡通化 → 勾墨线，最后缩放成 256×256。
 *
 * @param {Uint8ClampedArray} pixels 方形像素（长度 = side*side*4）
 * @param {number} side 方形边长
 * @param {object} opts { tolerance, softness, cartoon, outline }
 * @returns {{canvas: HTMLCanvasElement, stats: {removed: number, skin: ?string, hair: ?string}}}
 */
export function makeFaceSticker(pixels, side, opts = {}) {
  let img = { data: pixels, width: side, height: side };
  // alreadyCut：像素已经是编辑器的抠图结果（用户还手动修补过），不能再自动抠一遍，
  // 否则橡皮擦的成果会被重新覆盖掉
  let removed = opts.removed ?? 0;
  if (!opts.alreadyCut) {
    const cut = removeBackground(img, {
      tolerance: opts.tolerance ?? 40,
      softness: opts.softness ?? 1,
    });
    img = { data: cut.data, width: side, height: side };
    removed = cut.removed;
  }
  dropSpecks(img, { minNeighbors: 3 });
  const stats = {
    removed,
    skin: sampleColor(img, {
      x: side * 0.36,
      y: side * 0.63,
      w: side * 0.28,
      h: side * 0.2,
    }),
    // 头顶这块几乎一定是头发，用它当默认发色
    hair: sampleColor(img, { x: side * 0.32, y: side * 0.06, w: side * 0.36, h: side * 0.16 }),
  };

  if (opts.cartoon !== false) {
    const drawn = cartoonize(img, opts.cartoonize || {});
    img = { data: drawn.data, width: side, height: side };
  }
  if (opts.outline !== false) {
    const lined = addOutline(img, { width: Math.max(1, Math.round(side / 128)) });
    img = { data: lined.data, width: side, height: side };
  }

  const src = document.createElement('canvas');
  src.width = side;
  src.height = side;
  src.getContext('2d').putImageData(new ImageData(img.data, side, side), 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = FACE_SIZE;
  canvas.height = FACE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, FACE_SIZE, FACE_SIZE);

  return { canvas, stats, content: canvasContent(canvas) };
}

/** 五张模板脸共用的一副五官，参数化微调 */
export function faceFeatures(ctx, r, opts = {}) {
  const eyeY = -r * 0.06;
  const eyeX = r * 0.34;
  const eyeR = r * 0.13 * (opts.eyeScale ?? 1);
  ctx.fillStyle = '#3A2E2A';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * eyeX, eyeY, eyeR * 0.86, eyeR, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFFFFF';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * eyeX - eyeR * 0.26, eyeY - eyeR * 0.34, eyeR * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = opts.hair || '#3A2E2A';
  ctx.lineWidth = r * 0.075;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * eyeX - r * 0.16, eyeY - r * 0.31);
    ctx.quadraticCurveTo(sx * eyeX, eyeY - r * 0.42, sx * eyeX + r * 0.17, eyeY - r * 0.3);
    ctx.stroke();
  }
  if (opts.blush !== false) {
    ctx.fillStyle = 'rgba(255, 138, 145, 0.3)';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * r * 0.6, r * 0.22, r * 0.17, r * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(214, 140, 120, 0.75)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.16, r * 0.055, r * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8C4B3F';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.arc(0, r * 0.26, r * 0.24, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();
}

/** 模板脸：和照片脸同规格的 256×256 画布，后面的绘制逻辑完全共用 */
export function makePresetFace(preset) {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_SIZE;
  canvas.height = FACE_SIZE;
  const ctx = canvas.getContext('2d');
  const c = FACE_SIZE / 2;
  const r = FACE_SIZE * 0.42;
  const darker = (hex, amount) => {
    const n = parseInt(hex.slice(1), 16);
    const mix = (v) => Math.round(v + (0 - v) * amount);
    return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  };

  ctx.save();
  ctx.translate(c, c);
  ctx.fillStyle = darker(preset.hair, 0.16);
  ctx.beginPath();
  ctx.ellipse(0, r * 1.1, r * 1.02, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = preset.skin;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.06, r * 0.92, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = darker(preset.skin, 0.06);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * r * 0.92, r * 0.12, r * 0.1, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  faceFeatures(ctx, r, { hair: preset.hair });
  ctx.fillStyle = preset.hair;
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, -r * 0.12);
  ctx.quadraticCurveTo(-r, -r * 1.08, 0, -r * 1.02);
  ctx.quadraticCurveTo(r, -r * 1.08, r * 0.95, -r * 0.12);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.52, r * 0.1, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.28, -r * 0.95, -r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  return canvas;
}

/** 圆形预览：编辑器里看到的就是最后贴到脸上的那张，避免"编辑时好好的，用了就歪" */
export function drawFacePreview(ctx, faceCanvas, size, opts = {}) {
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = opts.background || '#E8F4FD';
  ctx.fillRect(0, 0, size, size);
  if (faceCanvas) {
    const zoom = opts.zoom ?? 1;
    ctx.drawImage(
      faceCanvas,
      (size - size * zoom) / 2,
      (size - size * zoom) / 2 + (opts.offsetY ?? 0) * size,
      size * zoom,
      size * zoom,
    );
  }
  ctx.restore();
}
