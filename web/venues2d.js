import { drawCityMap } from '/city-map.js';
/**
 * 场馆地图（2D）：一张"示意地图"，不是导航图。
 *
 * 三条设计决定：
 *  1. **不按真实比例画**。吉林市离长春 160 公里，照实画地图上就是一片空白，
 *     点个场馆得等它走十分钟。所以距离压缩、方位保留——看得懂"谁在东北、谁在东南"就够了。
 *  2. **图标和文字不跟着缩放**。地图能缩，徽章始终是同一个屏幕尺寸，手机上字才不会糊成一团；
 *     代价是缩得很小时图标会互相压，所以缩放下限被钳住了（见 minScale）。
 *  3. **点击即出发**。不做寻路、不做碰撞，点哪个场馆小人就沿"路"走过去——
 *     这是云游览里最省事也最不出错的交互：用户永远知道自己在去哪。
 */

import { drawCharacterAt } from '/avatar-parts.js';
import { drawVenueIllustration } from '/venue-art.js';



/* ------------------------------------------------------------------ */
/* 专属图标：每座场馆一套矢量画法（不依赖字体和图片）                  */
/* ------------------------------------------------------------------ */

const glyph = {
  /** 五环体育馆：圆顶 + 火炬 */
  wuhuan(ctx, s) {
    const r = s * 0.5;
    ctx.beginPath();
    ctx.arc(0, r * 0.16, r * 0.74, Math.PI, Math.PI * 2);
    ctx.lineTo(r * 0.74, r * 0.42);
    ctx.lineTo(-r * 0.74, r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.3);
    ctx.lineTo(0, r * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.86);
    ctx.quadraticCurveTo(r * 0.44, -r * 0.58, 0, -r * 0.34);
    ctx.quadraticCurveTo(-r * 0.34, -r * 0.58, 0, -r * 0.86);
    ctx.fill();
  },
  /** 速滑馆：冰刀 + 跑道 */
  speed(ctx, s) {
    const r = s * 0.5;
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.34, r * 0.82, r * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.64);
    ctx.lineTo(r * 0.34, -r * 0.24);
    ctx.lineTo(-r * 0.36, -r * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.16);
    ctx.lineTo(r * 0.5, -r * 0.16);
    ctx.stroke();
  },
  /** 市滑冰馆：冰壶 */
  cityhall(ctx, s) {
    const r = s * 0.5;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.26, r * 0.8, r * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.24, -r * 0.22);
    ctx.lineTo(r * 0.24, -r * 0.22);
    ctx.lineTo(r * 0.32, r * 0.12);
    ctx.lineTo(-r * 0.32, r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, -r * 0.22);
    ctx.lineTo(-r * 0.58, -r * 0.6);
    ctx.stroke();
  },
  /** 省滑冰馆：冰球杆 + 冰球 */
  provhall(ctx, s) {
    const r = s * 0.5;
    ctx.lineWidth = s * 0.11;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.72);
    ctx.lineTo(r * 0.16, r * 0.3);
    ctx.quadraticCurveTo(r * 0.5, r * 0.52, r * 0.72, r * 0.26);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-r * 0.4, r * 0.52, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  },
  /** 奥体公园：看台环绕的体育场 */
  olympic(ctx, s) {
    const r = s * 0.5;
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.84, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.44, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.3, -r * 0.58);
      ctx.lineTo(i * r * 0.3, -r * 0.82);
      ctx.stroke();
    }
  },
  /** 净月潭：松树 + 雪道 */
  jingyue(ctx, s) {
    const r = s * 0.5;
    for (const [dx, k] of [[-0.42, 0.68], [0.18, 0.84]]) {
      ctx.beginPath();
      ctx.moveTo(r * dx, -r * k);
      ctx.lineTo(r * (dx + 0.34), r * 0.32);
      ctx.lineTo(r * (dx - 0.34), r * 0.32);
      ctx.closePath();
      ctx.fill();
    }
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, r * 0.54);
    ctx.quadraticCurveTo(0, r * 0.26, r * 0.74, r * 0.58);
    ctx.stroke();
  },
  /** 莲花山：空中技巧跳台 */
  lianhua(ctx, s) {
    const r = s * 0.5;
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.76, r * 0.58);
    ctx.quadraticCurveTo(-r * 0.1, r * 0.48, r * 0.48, -r * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.36, -r * 0.68, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, r * 0.62);
    ctx.lineTo(r * 0.7, r * 0.62);
    ctx.stroke();
  },
  /** 雕塑园：抽象雕塑 + 基座 */
  sculpture(ctx, s) {
    const r = s * 0.5;
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.5);
    ctx.quadraticCurveTo(-r * 0.78, r * 0.06, 0, -r * 0.34);
    ctx.quadraticCurveTo(r * 0.78, -r * 0.72, r * 0.16, -r * 0.74);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, r * 0.62, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  },
  /** 松花湖：单板 */
  songhuahu(ctx, s) {
    const r = s * 0.5;
    ctx.save();
    ctx.rotate(-0.34);
    ctx.beginPath();
    ctx.roundRect(-r * 0.24, -r * 0.76, r * 0.48, r * 1.5, r * 0.24);
    ctx.fill();
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.46);
    ctx.lineTo(0, r * 0.44);
    ctx.stroke();
    ctx.restore();
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.82, r * 0.66);
    ctx.quadraticCurveTo(0, r * 0.88, r * 0.82, r * 0.66);
    ctx.stroke();
  },
  /** 北大湖：山峰 + U 型池 */
  beidahu(ctx, s) {
    const r = s * 0.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.86, r * 0.2);
    ctx.lineTo(-r * 0.32, -r * 0.68);
    ctx.lineTo(r * 0.08, r * 0.04);
    ctx.lineTo(r * 0.42, -r * 0.4);
    ctx.lineTo(r * 0.86, r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, r * 0.68);
    ctx.quadraticCurveTo(0, r * 0.26, r * 0.62, r * 0.68);
    ctx.stroke();
  },
};

/** 兜底图标：以后加了场馆没来得及画图标，也不至于是一片空白 */
function fallbackGlyph(ctx, s) {
  const r = s * 0.5;
  ctx.lineWidth = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.5);
  ctx.lineTo(0, -r * 0.58);
  ctx.lineTo(r * 0.7, r * 0.5);
  ctx.closePath();
  ctx.stroke();
}

export function drawVenueIcon(ctx, id, size, color) {
  const painter = glyph[id] || fallbackGlyph;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  painter(ctx, size);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 路网：主城到每座场馆一条弧线，既是"公路"也是小人的行走轨迹          */
/* ------------------------------------------------------------------ */

const HUB = { x: 0, z: 0 }; // 五环体育馆所在的长春主城区

function buildRoute(venue) {
  return buildRouteFrom(HUB, venue);
}

/**
 * 从任意起点到场馆的一条弧线。
 *
 * 之前每次出发都从主城（五环体育馆）算路线：逛到第三个场馆的人，点下一个场馆时
 * 小人会**先瞬移回起点再走**——因为路线是死的，而人是活的。
 * 现在按当前位置现算，走哪算哪。
 */
function buildRouteFrom(from, venue) {
  const to = venue.mapPos;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  // 控制点往垂直方向偏一点，路线就弯了；全是直线会变成星形放射图
  const bend = venue.isCeremony && from === HUB ? 0 : 0.14;
  const cx = from.x + dx * 0.5 - (dz / len) * len * bend;
  const cz = from.z + dz * 0.5 + (dx / len) * len * bend;
  const points = [];
  const steps = 26;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push({
      x: mt * mt * from.x + 2 * mt * t * cx + t * t * to.x,
      z: mt * mt * from.z + 2 * mt * t * cz + t * t * to.z,
    });
  }
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  }
  return { points, total };
}

/* ------------------------------------------------------------------ */
/* 地图视图                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{venues: Array, onPick?: (venueId: string) => void}} opts
 */
export function createMapView(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const venues = opts.venues || [];
  const routes = new Map(venues.map((v) => [v.id, buildRoute(v)]));
  const onPick = opts.onPick || (() => {});

  let size = { w: 300, h: 300 };
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let minScale = 0.6;
  let cfg = null;
  let heroVisible = opts.heroVisible !== false;
  let filter = 'all';
  let counts = new Map();
  let landedAt = -10;
  let visited = new Set();
  let activeId = null;
  let walk = null;
  let followHero = true;
  let time = 0;
  const snow = Array.from({ length: 42 }, (_, i) => ({
    x: ((i * 83) % 997) / 997,
    y: ((i * 137) % 991) / 991,
    r: 1.2 + (i % 4) * 0.55,
    speed: 5 + (i % 5) * 2.2,
  }));
  // roadVenue：小人现在在哪座场馆（自检时能一眼看出路径是不是从当前位置出发的）
  const hero = { pos: { x: HUB.x, z: HUB.z }, facing: 1, moving: false, roadVenue: 'wuhuan' };
  let bounds = { x: -260, z: -280, w: 960, h: 660 };

  const project = (x, z) => ({ x: panX + x * scale, y: panY + z * scale });
  const unproject = (sx, sy) => ({ x: (sx - panX) / scale, z: (sy - panY) / scale });

  function computeBounds() {
    let minX = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxZ = -Infinity;
    for (const v of venues) {
      minX = Math.min(minX, v.mapPos.x);
      minZ = Math.min(minZ, v.mapPos.z);
      maxX = Math.max(maxX, v.mapPos.x);
      maxZ = Math.max(maxZ, v.mapPos.z);
    }
    if (!Number.isFinite(minX)) {
      bounds = { x: -260, z: -280, w: 960, h: 660 };
      return;
    }
    // 留白给徽章和文字，以及东部那两座跨城的场馆
    const pad = 150;
    bounds = {
      x: minX - pad,
      z: minZ - pad,
      w: maxX - minX + pad * 2,
      h: maxZ - minZ + pad * 2,
    };
  }

  function clampPan() {
    const bw = bounds.w * scale;
    const bh = bounds.h * scale;
    const left = -bounds.x * scale;
    const top = -bounds.z * scale;
    if (bw <= size.w) panX = left + (size.w - bw) / 2;
    else panX = Math.min(left, Math.max(size.w - bw + left, panX));
    if (bh <= size.h) panY = top + (size.h - bh) / 2;
    else panY = Math.min(top, Math.max(size.h - bh + top, panY));
  }

  function fit() {
    computeBounds();
    const fitScale = Math.min(size.w / bounds.w, size.h / bounds.h);
    // 缩放下限按面板宽度给：桌面能看到全图，手机至少保证图标不叠在一起
    minScale = Math.max(0.28, Math.min(fitScale, 1.05));
    scale = Math.max(fitScale, minScale);
    const cx = bounds.x + bounds.w / 2;
    const cz = bounds.z + bounds.h / 2;
    panX = size.w / 2 - cx * scale;
    panY = size.h / 2 - cz * scale;
    clampPan();
  }

  function centerOn(x, z) {
    const tx = size.w / 2 - x * scale;
    const tz = size.h / 2 - z * scale;
    panX += (tx - panX) * 0.09;
    panY += (tz - panY) * 0.09;
    clampPan();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
  }

  /**
   * 尺寸变了就重算。
   *
   * 为什么要 ResizeObserver 而不是只听 window.resize：
   * 页面首屏布局是异步落定的（字体、面板、flex 分配），canvas 的 CSS 尺寸往往在
   * 第一次 resize() 之后还会再变一次；只监听窗口的话不会收到通知，
   * 结果就是**画布被浏览器拉伸**——图标、文字全部放大几倍，还糊。
   */
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (Math.abs(rect.width - size.w) > 1 || Math.abs(rect.height - size.h) > 1) resize();
    });
    ro.observe(canvas);
  }

  /* ---------------- 绘制 ---------------- */

  function drawBackdrop() { drawCityMap(ctx, project, scale, size); }
  function drawTerrain() {}

  function traceRoute(route) {
    ctx.beginPath();
    route.points.forEach((pt, i) => {
      const p = project(pt.x, pt.z);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
  }

  function drawRoutes() {
    ctx.lineCap = 'round';
    for (const v of venues) {
      const route = routes.get(v.id);
      const crossCity = v.city === '吉林市';
      ctx.strokeStyle = crossCity ? 'rgba(150, 170, 190, 0.55)' : 'rgba(170, 200, 225, 0.7)';
      ctx.lineWidth = Math.max(1.6, (crossCity ? 6 : 4) * scale);
      traceRoute(route);
      ctx.stroke();
      if (crossCity) {
        // 跨城段加一条白色中线，一眼看出"这段是走高速"
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(1, 1.6 * scale);
        ctx.setLineDash([8, 8]);
        traceRoute(route);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawRegionLabels() {
    ctx.save();
    ctx.font = '600 12px system-ui, "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(95, 125, 151, 0.85)';
    ctx.textAlign = 'center';
    const a = project(-210, -460);
    ctx.fillText('长春 · 城市与冰雪', a.x, a.y);
    const b = project(720, -10);
    ctx.fillText('吉林市分赛区 · 约 160 公里', b.x, b.y);
    ctx.restore();
  }

  const badgeRadius = () => Math.max(16, Math.min(26, size.w / 30));

  function drawVenues() {
    const r = badgeRadius();
    const artW = Math.max(43, Math.min(62, size.w / 15));
    const artH = artW * .69;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 12.5px system-ui, "Microsoft YaHei", sans-serif';
    for (const v of venues) {
      if (filter !== 'all' && v.kind !== filter) continue;
      const p = project(v.mapPos.x, v.mapPos.z);
      const isActive = v.id === activeId;
      const done = visited.has(v.id);
      if (isActive) {
        const pulse = 1 + Math.sin(time * 3.4) * 0.12;
        ctx.strokeStyle = 'rgba(255, 143, 122, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.5 * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
      const artX = p.x - artW / 2;
      const artY = p.y - artH * .7;
      ctx.save();
      ctx.shadowColor = 'rgba(37,75,114,.22)';
      ctx.shadowBlur = 13;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.roundRect(artX - 4, artY - 4, artW + 8, artH + 8, 11); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.roundRect(artX, artY, artW, artH, 7); ctx.clip();
      drawVenueIllustration(ctx, v, artX, artY, artW, artH);
      ctx.restore();
      ctx.strokeStyle = isActive ? '#ef8d7c' : '#fff';
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.beginPath(); ctx.roundRect(artX, artY, artW, artH, 7); ctx.stroke();

      if (done) {
        ctx.fillStyle = '#7FE0C4';
        ctx.beginPath();
        ctx.arc(artX + artW - 3, artY + 3, r * 0.31, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = '#1F6B57';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(artX + artW - 9, artY + 3);
        ctx.lineTo(artX + artW - 4, artY + 8);
        ctx.lineTo(artX + artW + 5, artY - 3);
        ctx.stroke();
      }

      const count = counts.get(v.id) || 0;
      if (count > 0) {
        ctx.font = '700 10px system-ui';
        const text = count >= 10000 ? (count / 10000).toFixed(1) + '万' : String(count);
        const cw = ctx.measureText(text).width + 12;
        ctx.fillStyle = v.kind === 'attraction' ? '#b77c44' : '#167f9b';
        ctx.beginPath();ctx.roundRect(artX + artW - cw + 4, artY - 9, cw, 16, 8);ctx.fill();
        ctx.fillStyle = '#fff';ctx.fillText(text,artX + artW - cw / 2 + 4,artY - 1);
      }
      ctx.font = '600 11px system-ui, "Microsoft YaHei", sans-serif';
      const label = v.name.replace(/^长春|^吉林/, '');
      const textW = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.roundRect(p.x - textW / 2 - 7, artY + artH + 6, textW + 14, 20, 10);
      ctx.fill();
      ctx.fillStyle = isActive ? '#C0432B' : '#33526E';
      ctx.fillText(label, p.x, artY + artH + 17);
    }
  }

  function drawHero() {
    if (!heroVisible || !cfg) return;
    const p = project(hero.pos.x, hero.pos.z);
    const h = Math.max(64, Math.min(100, size.w / 8));
    ctx.save();
    const age = time - landedAt;
    if (age >= 0 && age < .65) {
      const bounce = Math.sin(age / .65 * Math.PI * 2) * Math.exp(-age * 5) * .18;
      ctx.translate(p.x, p.y);ctx.scale(1 + bounce, 1 - bounce);ctx.translate(-p.x, -p.y);
    }
    if (hero.facing < 0) {
      ctx.translate(p.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-p.x, 0);
    }
    if (cfg) drawCharacterAt(ctx, cfg, p.x, p.y + h * 0.1, h, { t: time, moving: hero.moving });
    ctx.restore();

    const name = (cfg && cfg.name) || '我';
    ctx.font = '700 11.5px system-ui, "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(name).width + 16;
    const tagY = p.y - h - 2;
    ctx.fillStyle = 'rgba(15, 53, 85, 0.82)';
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, tagY - 11, w, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(name, p.x, tagY);
  }

  function drawWalkProgress() {
    if (!walk) return;
    const route = walk.route;
    const t = Math.min(1, walk.traveled / route.total);
    // 还没走的那一段画成浅色虚线：让人知道"接下来往哪走"，而不是凭空冒出来
    const totalPoints = route.points.length - 1;
    const fromIndex = Math.max(1, Math.round(t * totalPoints));
    ctx.strokeStyle = 'rgba(255, 143, 122, 0.35)';
    ctx.lineWidth = Math.max(1.8, 3.5 * scale);
    ctx.setLineDash([6, 7]);
    ctx.beginPath();
    route.points.slice(fromIndex).forEach((pt, i) => {
      const p = project(pt.x, pt.z);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    const upto = Math.max(1, Math.round(t * (route.points.length - 1)));
    ctx.strokeStyle = 'rgba(255, 143, 122, 0.85)';
    ctx.lineWidth = Math.max(2.4, 5 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    route.points.slice(0, upto + 1).forEach((pt, i) => {
      const p = project(pt.x, pt.z);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  function drawFooter() {
    ctx.save();
    ctx.font = '11px system-ui, "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(95, 125, 151, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('城市导览示意图 · 位置与距离经概括，不用于导航', 12, size.h - 12);
    // 指北针：地图 z 轴是"南正北负"，所以北在上
    ctx.translate(size.w - 26, 34);
    ctx.fillStyle = 'rgba(15, 53, 85, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(6, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 9);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, 22);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, size.w, size.h);
    drawBackdrop();
    drawTerrain();
    drawRoutes();
    drawRegionLabels();
    drawWalkProgress();
    drawVenues();
    drawHero();
    drawFooter();
  }

  /* ---------------- 交互 ---------------- */

  const pointers = new Map();
  let panning = false;
  let pinchStart = null;
  let downAt = null;

  function pickAt(sx, sy) {
    const reach = badgeRadius() + 30;
    let best = null;
    let bestD = Infinity;
    for (const v of venues) {
      if (filter !== 'all' && v.kind !== filter) continue;
      const p = project(v.mapPos.x, v.mapPos.z);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < reach && d < bestD) {
        best = v;
        bestD = d;
      }
    }
    return best;
  }

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.offsetX, y: event.offsetY });
    if (pointers.size === 1) {
      panning = true;
      downAt = { x: event.offsetX, y: event.offsetY, t: performance.now() };
    } else if (pointers.size === 2) {
      panning = false;
      const [a, b] = [...pointers.values()];
      pinchStart = {
        dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        scale,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    const prev = pointers.get(event.pointerId);
    if (!prev) return;
    pointers.set(event.pointerId, { x: event.offsetX, y: event.offsetY });
    if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const anchor = unproject(pinchStart.mid.x, pinchStart.mid.y);
      scale = Math.max(minScale, Math.min(2.6, (pinchStart.scale * dist) / pinchStart.dist));
      panX = mid.x - anchor.x * scale;
      panY = mid.y - anchor.z * scale;
      clampPan();
      return;
    }
    if (panning) {
      panX += event.offsetX - prev.x;
      panY += event.offsetY - prev.y;
      clampPan();
    }
  });

  const endPointer = (event) => {
    const start = downAt;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) panning = false;
    if (!start) return;
    const moved = Math.hypot(event.offsetX - start.x, event.offsetY - start.y);
    if (moved < 9 && performance.now() - start.t < 600) {
      const hit = pickAt(event.offsetX, event.offsetY);
      if (hit) onPick(hit.id);
    }
    downAt = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const anchor = unproject(event.offsetX, event.offsetY);
      scale = Math.max(minScale, Math.min(2.6, scale * (event.deltaY < 0 ? 1.12 : 0.89)));
      panX = event.offsetX - anchor.x * scale;
      panY = event.offsetY - anchor.z * scale;
      clampPan();
    },
    { passive: false },
  );

  /* ---------------- 对外 API ---------------- */

  function pointAt(route, distance) {
    let acc = 0;
    for (let i = 1; i < route.points.length; i += 1) {
      const a = route.points[i - 1];
      const b = route.points[i];
      const seg = Math.hypot(b.x - a.x, b.z - a.z);
      if (acc + seg >= distance) {
        const t = seg === 0 ? 0 : (distance - acc) / seg;
        return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, dx: b.x - a.x };
      }
      acc += seg;
    }
    const last = route.points[route.points.length - 1];
    return { x: last.x, z: last.z, dx: 0 };
  }

  function walkTo(venueId, options = {}) {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return null;
    activeId = venueId;
    if (options.instant) {
      hero.pos = { ...venue.mapPos };
      hero.moving = false;
      hero.roadVenue = venueId;
      walk = null;
      return { duration: 0, venue };
    }
    /*
     * 从当前位置直奔目的地。
     *
     * 中间试过"沿地图上画的路网走"（先沿来路退回主城、再拐上目标那条路），
     * 语义上更"讲道理"，但实际看下来是**绕远**：逛第三四个场馆时，小人先往回跑一大段，
     * 观感上像是卡了一下。所以改回直连——弧线本身的弯曲已经足够自然，
     * 而且起点仍然是"当前位置"，不会瞬移回起点。
     */
    const route = buildRouteFrom(hero.pos, venue);
    const speed = 175; // 世界单位 / 秒：近的场馆一两秒就到，远的五六秒，别让人干等
    walk = {
      venueId,
      route,
      traveled: 0,
      total: route.total,
      duration: Math.max(0.8, route.total / speed),
      elapsed: 0,
    };
    hero.moving = true;
    hero.roadVenue = venueId;
    return { duration: walk.duration, venue };
  }

  /** 每帧推进；返回 true 表示这一帧刚刚到达目的地 */
  function update(dt) {
    time += dt;
    if (!walk) return false;
    walk.elapsed += dt;
    const route = walk.route;
    walk.traveled = Math.min(route.total, (walk.elapsed / walk.duration) * route.total);
    const pt = pointAt(route, walk.traveled);
    if (Math.abs(pt.dx) > 0.2) hero.facing = pt.dx > 0 ? -1 : 1;
    hero.pos = { x: pt.x, z: pt.z };
    if (followHero) centerOn(hero.pos.x, hero.pos.z);
    if (walk.traveled >= route.total) {
      hero.moving = false;
      walk = null;
      return true;
    }
    return false;
  }

  return {
    resize,
    draw,
    update,
    walkTo,
    cancelWalk() { walk = null; hero.moving = false; },
    fit,
    project,
    hero,
    get walking() {
      return Boolean(walk);
    },
    get walkInfo() {
      return walk ? { venueId: walk.venueId, progress: walk.traveled / walk.total } : null;
    },
    setHeroVisible(value) { heroVisible = Boolean(value); if(value) landedAt = time; },
    setFilter(value) { filter = value; },
    setCounts(rows) { counts = new Map(rows.map(r => [r.id, r.count])); },
    heroScreen() { return { ...project(hero.pos.x, hero.pos.z), height: Math.max(64, Math.min(100, size.w / 8)) }; },
    setCharacter(next) {
      cfg = next;
    },
    setVisited(set) {
      visited = set;
    },
    setActive(id) {
      activeId = id;
    },
    setFollow(value) {
      followHero = value;
    },
    zoomBy(factor) {
      const anchor = unproject(size.w / 2, size.h / 2);
      scale = Math.max(minScale, Math.min(2.6, scale * factor));
      panX = size.w / 2 - anchor.x * scale;
      panY = size.h / 2 - anchor.z * scale;
      clampPan();
    },
    debug() {
      return {
        scale: Number(scale.toFixed(3)),
        minScale: Number(minScale.toFixed(3)),
        hero: { x: Math.round(hero.pos.x), z: Math.round(hero.pos.z) },
        road: hero.roadVenue,
        walking: Boolean(walk),
        visited: [...visited],
      };
    },
  };
}
