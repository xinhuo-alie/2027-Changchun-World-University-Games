/**
 * 小游戏引擎（四套）。
 *
 * rhythm 节奏加速 —— 左右交替点击，速度掉得比你按得快。（速滑、短道速滑）
 * aim    精准瞄准 —— 力度与方向两条摆动条，抓时机锁定。（冰壶、冰球）
 * dodge  变道闪避 —— 俯视雪道，左右变道躲障碍、贴旗门得分。（单板、高山滑雪）
 * jump   跳跃越障 —— 侧视，一键起跳跨过雪堆岩石。（越野跑、越野滑雪、空中技巧）
 *
 * 大多数关卡约 10 秒；需要三次投掷的精准关卡给足 18 秒。
 * 画风全部走圆润卡通 + 糖果色，和主场景一致。
 */

import { drawVenueIllustration } from './venue-art.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rand = (a, b) => a + Math.random() * (b - a);
const outdoorVenues = new Set(['jingyue', 'lianhua', 'sculpture', 'songhuahu', 'beidahu']);
const gameBackdrops = {
  outdoor: typeof Image === 'undefined' ? {} : new Image(),
  indoor: typeof Image === 'undefined' ? {} : new Image(),
};
gameBackdrops.outdoor.src = '/assets/map-winter-world.png';
gameBackdrops.indoor.src = '/assets/arena-winter-interior.png';

function drawCover(ctx, image, w, h) {
  const ratio = w / h;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const sw = imageRatio > ratio ? image.naturalHeight * ratio : image.naturalWidth;
  const sh = imageRatio > ratio ? image.naturalHeight : image.naturalWidth / ratio;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
}

export const CANDY = {
  pink: '#FF9EBE',
  blue: '#6BC0F5',
  mint: '#7FE0C4',
  yellow: '#FFD166',
  coral: '#FF8F7A',
  purple: '#B79BE8',
  ink: '#33526E',
  snow: '#FFFFFF',
};

/* ---------------- 共用画法 ---------------- */

/** 渐变天空 + 圆润远景山，所有引擎都用它打底 */
export function bgScene(ctx, w, h, opts = {}) {
  const outdoor = outdoorVenues.has(opts.venueId);
  const backdrop = outdoor ? gameBackdrops.outdoor : gameBackdrops.indoor;
  const textured = backdrop.complete && backdrop.naturalWidth;
  if (textured) {
    drawCover(ctx, backdrop, w, h);
    ctx.fillStyle = outdoor ? 'rgba(242,250,255,.16)' : 'rgba(224,244,255,.21)';
    ctx.fillRect(0, 0, w, h);
  } else {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, opts.skyTop || '#B7E2FF');
  g.addColorStop(0.7, opts.skyMid || '#E4F4FF');
  g.addColorStop(1, opts.skyBottom || '#FFF3F8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const layers = [
    { y: h * 0.46, r: h * 0.30, color: 'rgba(178, 216, 245, 0.75)' },
    { y: h * 0.54, r: h * 0.24, color: 'rgba(206, 233, 250, 0.85)' },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.color;
    ctx.beginPath();
    for (let x = -L.r; x < w + L.r; x += L.r * 1.5) {
      ctx.moveTo(x, L.y + L.r);
      ctx.arc(x, L.y + L.r, L.r, Math.PI, 0);
    }
    ctx.fill();
  }
  }

  const forestVenues = ['jingyue', 'lianhua', 'songhuahu', 'beidahu'];
  if (textured) {
    // 场馆贴图保持在玩耍区边缘，不遮挡人物和目标。
    const artW = Math.min(112, w * .23);
    const artH = artW * .69;
    const artX = w - artW - 18;
    const artY = Math.max(48, h * .16);
    ctx.save();
    ctx.shadowColor = 'rgba(34,74,105,.2)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.beginPath(); ctx.roundRect(artX - 4, artY - 4, artW + 8, artH + 8, 9); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(artX, artY, artW, artH, 6); ctx.clip();
    drawVenueIllustration(ctx, opts.venueId, artX, artY, artW, artH);
    ctx.restore();
  } else if (forestVenues.includes(opts.venueId)) {
    const horizon = h * 0.55;
    ctx.fillStyle = 'rgba(45, 111, 108, 0.32)';
    for (let i = 0; i < 11; i += 1) {
      const x = (i / 10) * w;
      const size = h * (0.10 + (i % 3) * 0.025);
      ctx.beginPath(); ctx.moveTo(x, horizon + size * 0.8); ctx.lineTo(x + size * 0.42, horizon - size); ctx.lineTo(x + size * 0.84, horizon + size * 0.8); ctx.fill();
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.62)' : 'rgba(76, 145, 128, .36)';
    }
    ctx.strokeStyle = 'rgba(255,255,255,.76)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w * 0.08, horizon + h * 0.1); ctx.quadraticCurveTo(w * 0.5, horizon - h * 0.05, w * 0.92, horizon + h * 0.08); ctx.stroke();
  } else if (opts.venueId === 'sculpture') {
    ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, h * 0.018);
    for (const [x, high, color] of [[.18,.14,'rgba(187,155,232,.58)'],[.72,.18,'rgba(255,158,190,.55)'],[.88,.1,'rgba(95,211,232,.58)']]) {
      ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(w * x, h * .62); ctx.bezierCurveTo(w * (x - .08), h * (.5 - high), w * (x + .09), h * (.43 - high), w * x, h * .62); ctx.stroke();
    }
  } else {
    // 冰上场馆的拱形屋顶、玻璃分格和看台灯带，给速滑、冰壶与冰球关卡室内感。
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .49, w * .56, h * .26, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.43)'; ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i += 1) { ctx.beginPath(); ctx.moveTo(w * (.5 + i * .11), h * .49); ctx.lineTo(w * (.5 + i * .045), h * .25); ctx.stroke(); }
    ctx.fillStyle = 'rgba(96,169,204,.18)'; ctx.fillRect(0, h * .52, w, h * .05);
  }
}

/** 圆滚滚的卡通角色：球 + 高光 + 一张脸，最讨喜的造型 */
export function cuteBlob(ctx, x, y, r, color, opts = {}) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(70, 110, 150, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.08, r * 0.95, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(-r * 0.34, -r * 0.36, r * 0.26, 0, Math.PI * 2);
  ctx.fill();

  if (opts.face !== false) {
    ctx.fillStyle = CANDY.ink;
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.05, r * 0.11, 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.05, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CANDY.ink;
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    ctx.beginPath();
    ctx.arc(0, r * 0.16, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

/** 障碍物：岩石 / 小树 / 雪堆，一律带白描边，保证在雪地上看得清 */
/**
 * 玩家在游戏里的模样。
 *
 * 页面传入完整人物绘制回调；没有形象时才使用默认小球。
 */
export function playerBall(ctx, x, y, r, color, api, opts) {
  if (api && typeof api.avatarFigure === 'function') {
    api.avatarFigure(ctx, x, y, r);
    return;
  }
  cuteBlob(ctx, x, y, r, color, opts);
}

export function obstacle(ctx, x, y, s, kind) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(70, 110, 150, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.44, s * 0.95, s * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = Math.max(2, s * 0.16);
  ctx.strokeStyle = '#FFFFFF';

  if (kind === 0) {
    ctx.fillStyle = '#8FA6B8';
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.35);
    ctx.quadraticCurveTo(-s * 0.7, -s * 0.9, 0, -s * 0.95);
    ctx.quadraticCurveTo(s * 0.75, -s * 0.85, s, s * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 1) {
    ctx.fillStyle = '#7A5A3C';
    ctx.fillRect(-s * 0.16, s * 0.05, s * 0.32, s * 0.4);
    ctx.fillStyle = '#5FC9A6';
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, s * 0.15);
    ctx.quadraticCurveTo(0, -s * 1.5, s * 0.9, s * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#BBD9EE';
    ctx.stroke();
  }
  ctx.restore();
}

/** HUD：圆角胶囊，和整体画风统一 */
export function hud(ctx, w, text, timeLeft, accent) {
  ctx.save();
  ctx.font = 'bold 14px system-ui, "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  // 必须显式设对齐方式：save/restore 之外的绘制可能留下 center，
  // 那样文字会以左边距为中心向两侧摊开，直接跑出胶囊外面。
  ctx.textAlign = 'left';

  const pad = 11;
  const hh = 26;
  const leftW = ctx.measureText(text).width + pad * 2;
  const rightText = `${Math.max(0, timeLeft).toFixed(1)}s`;
  const rightW = ctx.measureText(rightText).width + pad * 2;

  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath();
  ctx.roundRect(14, 12, leftW, hh, hh / 2);
  ctx.fill();
  ctx.fillStyle = accent || CANDY.blue;
  ctx.fillText(text, 14 + pad, 12 + hh / 2 + 1);

  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath();
  ctx.roundRect(w - 14 - rightW, 12, rightW, hh, hh / 2);
  ctx.fill();
  ctx.fillStyle = CANDY.ink;
  ctx.fillText(rightText, w - 14 - rightW + pad, 12 + hh / 2 + 1);
  ctx.restore();
}

/* ---------------- 引擎一：节奏加速 ---------------- */

export function rhythmEngine(canvas, params, api) {
  let progress = 0;
  let rival = 0;
  let speed = 0;
  let combo = 0;
  let bestCombo = 0;
  let side = 0;
  let finished = false;
  let timeLeft = params.duration ?? 10;

  const target = params.target ?? 40;
  const SPEED_CAP = 3.2;
  const PROGRESS_PER_SPEED = 0.045; // 正确保持连击时约 8 秒冲线
  // 难度下调：单次加速更给力、掉速更慢、对手再慢一点
  // （之前一下没跟上速度就掉光，新手很容易垫底）
  const TAP_GAIN = 0.46;
  const DECAY = 0.55;
  const RIVAL_RATE = (params.rival ?? 0.6) * 0.115; // 约 14.5 秒

  function onAction(act) {
    if (finished) return;
    if (act !== 'left' && act !== 'right') return;
    const s = act === 'left' ? 1 : 2;
    if (s === side) {
      speed = Math.max(0, speed - 0.42);
      combo = 0;
      if (api.miss) api.miss();
    }
    else {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      speed += TAP_GAIN + Math.min(0.23, combo * 0.018);
      api.hit();
    }
    side = s;
  }

  function update(dt) {
    if (finished) return;
    timeLeft -= dt;
    speed = Math.max(0, speed - dt * DECAY);
    speed = Math.min(speed, SPEED_CAP);
    progress += speed * dt * PROGRESS_PER_SPEED;
    rival += RIVAL_RATE * dt;

    if (progress >= 1 || rival >= 1 || timeLeft <= 0) {
      finished = true;
      const won = progress >= 1 && progress >= rival;
      api.finish(won, {
        score: Math.round(Math.min(1, progress) * target),
        unit: params.unit || '米',
        detail: `${won ? '率先冲线' : progress >= rival ? '时间到' : '被对手拉开'} · 最佳连击 ${bestCombo}`,
      });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#A9DCFF', skyMid: '#DFF1FF', skyBottom: '#F2FAFF', venueId: params.venueId });

    const laneY = h * 0.5;
    const laneH = h * 0.28;
    ctx.fillStyle = '#CBEBFA';
    ctx.fillRect(0, laneY, w, laneH);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, laneY + laneH / 2);
    ctx.lineTo(w, laneY + laneH / 2);
    ctx.stroke();

    const fx = w - 30;
    ctx.strokeStyle = CANDY.coral;
    ctx.lineWidth = 4;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(fx, laneY - 10);
    ctx.lineTo(fx, laneY + laneH + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    cuteBlob(ctx, 26 + Math.min(1, rival) * (fx - 26), laneY + laneH * 0.28, 11, '#B9CAD8', {
      face: false,
    });
    playerBall(
      ctx,
      26 + Math.min(1, progress) * (fx - 26),
      laneY + laneH * 0.72,
      14,
      params.accent || CANDY.blue,
      api,
    );

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.roundRect(16, h - 30, w - 32, 12, 6);
    ctx.fill();
    ctx.fillStyle = params.accent || CANDY.blue;
    ctx.beginPath();
    ctx.roundRect(16, h - 30, (w - 32) * clamp(speed / SPEED_CAP, 0, 1), 12, 6);
    ctx.fill();

    hud(
      ctx,
      w,
      `${Math.round(Math.min(1, progress) * target)} / ${target} ${params.unit || '米'}`,
      timeLeft,
      params.accent,
    );
    if (combo >= 2) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7656D9';
      ctx.font = 'bold 20px system-ui, "Microsoft YaHei", sans-serif';
      ctx.fillText(`${combo} 连击 ✦`, w / 2, h * 0.38);
    }
  }

  return { onAction, update, draw };
}

/* ---------------- 引擎二：精准瞄准 ---------------- */

export function aimEngine(canvas, params, api) {
  const rounds = 3;
  const rings = params.rings ?? 4;
  let round = 0;
  let score = 0;
  let phase = 'power';
  let power = 0;
  let angle = 0;
  let powerDir = 1;
  let angleDir = 1;
  let lockedPower = 0;
  let lockedAngle = 0;
  let flyT = 0;
  let lastPoints = 0;
  let finished = false;
  let targetOffset = 0;
  let targetDir = 1;
  let shotTargetOffset = 0;
  let timeLeft = Math.max(18, params.duration ?? 18);

  const moving = params.moving;

  function onAction(act) {
    if (finished || act !== 'primary') return;
    if (phase === 'power') {
      lockedPower = power;
      phase = 'angle';
      api.hit();
    } else if (phase === 'angle') {
      lockedAngle = angle;
      shotTargetOffset = targetOffset;
      phase = 'flying';
      flyT = 0;
      api.hit();
    }
  }

  function settle() {
    if (finished) return;
    finished = true;
    api.finish(score >= rounds * (rings - 1) * 0.6, {
      score,
      unit: params.unit || '分',
      detail: `完成 ${round} 投`,
    });
  }

  function update(dt) {
    if (finished) return;
    timeLeft -= dt;

    if (moving) {
      targetOffset += targetDir * dt * 0.7;
      if (targetOffset > 1) targetDir = -1;
      if (targetOffset < -1) targetDir = 1;
    }

    if (phase === 'power') {
      power += powerDir * dt * 1.0;
      if (power > 1) {
        power = 1;
        powerDir = -1;
      }
      if (power < 0) {
        power = 0;
        powerDir = 1;
      }
    } else if (phase === 'angle') {
      angle += angleDir * dt * 1.5;
      if (angle > 1) {
        angle = 1;
        angleDir = -1;
      }
      if (angle < -1) {
        angle = -1;
        angleDir = 1;
      }
    } else if (phase === 'flying') {
      flyT += dt;
      if (flyT > 0.85) {
        const err = Math.abs(lockedPower - 0.78) * 1.5 + Math.abs(lockedAngle - shotTargetOffset * 0.42) * 1.1;
        const ring = clamp(Math.floor(err * rings), 0, rings - 1);
        const points = Math.max(1, rings - ring);
        score += points;
        lastPoints = points;
        round += 1;
        phase = 'result';
        setTimeout(() => {
          if (finished) return;
          if (round >= rounds) settle();
          else {
            phase = 'power';
            power = 0;
            powerDir = 1;
          }
        }, 650);
      }
    }

    if (timeLeft <= 0) settle();
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#BFE6FF', skyMid: '#EAF6FF', skyBottom: '#FFF6FA', venueId: params.venueId });

    const cx = w / 2;
    const cy = h * 0.42;
    const maxR = Math.min(w, h) * 0.27;
    const ringColors = [CANDY.coral, '#FFFFFF', CANDY.blue, '#FFFFFF'];

    for (let i = rings - 1; i >= 0; i -= 1) {
      ctx.beginPath();
      ctx.arc(cx + targetOffset * maxR * 0.38, cy, (maxR * (i + 1)) / rings, 0, Math.PI * 2);
      ctx.fillStyle = ringColors[i % ringColors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(180,210,235,0.8)';
      ctx.stroke();
    }

    if (phase === 'flying') {
      const t = clamp(flyT / 0.85, 0, 1);
      const sx = cx;
      const sy = h - 34;
      const ex = cx + lockedAngle * maxR * 0.9;
      const x = sx + (ex - sx) * t;
      const y = sy + (cy - sy) * t - Math.sin(t * Math.PI) * 18 * (0.4 + lockedPower);
      playerBall(ctx, x, y, 11, params.accent || CANDY.blue, api);
    }

    const bar = (y, label, ratio, active) => {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.roundRect(16, y, w - 32, 12, 6);
      ctx.fill();
      ctx.fillStyle = active ? (label === '力度' ? CANDY.yellow : CANDY.blue) : '#C8D6E2';
      ctx.beginPath();
      ctx.roundRect(16, y, (w - 32) * clamp(ratio, 0, 1), 12, 6);
      ctx.fill();
      ctx.fillStyle = CANDY.ink;
      ctx.font = '12px system-ui, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, 16, y - 6);
    };
    bar(h - 62, '力度', phase === 'power' ? power : lockedPower, phase === 'power');
    bar(h - 30, '方向', (phase === 'angle' ? angle : lockedAngle) / 2 + 0.5, phase === 'angle');
    // 给玩家明确的时机提示：第一条瞄到星星，第二条对准移动靶的投影。
    ctx.fillStyle = '#7D54D9';
    ctx.font = 'bold 17px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 16 + (w - 32) * .78, h - 65);
    ctx.fillText('◆', 16 + (w - 32) * (.5 + targetOffset * .21), h - 33);

    hud(
      ctx,
      w,
      `${Math.min(round + 1, rounds)} / ${rounds} 投 · ${score} ${params.unit || '分'}`,
      timeLeft,
      params.accent,
    );

    if (phase === 'result' && lastPoints) {
      ctx.textAlign = 'center';
      ctx.fillStyle = lastPoints >= rings - 1 ? '#3F9E6A' : '#7A93A8';
      ctx.font = 'bold 22px system-ui, "Microsoft YaHei", sans-serif';
      ctx.fillText(`+${lastPoints}`, cx, cy - maxR - 16);
    }
  }

  return { onAction, update, draw };
}

/* ---------------- 引擎三：变道闪避（俯视） ---------------- */

export function dodgeEngine(canvas, params, api) {
  const LANES = 3;
  let lane = 1;
  let travel = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let finished = false;
  let timeLeft = params.duration ?? 10;
  const speed = params.speed ?? 1;
  const gateCount = params.gates ?? 5;

  const gates = [];
  for (let i = 0; i < gateCount; i += 1) {
    // 10 秒能跑约 860 个单位，5 个旗门按 140 间隔铺开，正好均匀分布在全程
    gates.push({ x: 240 + i * 140, gap: Math.floor(rand(0, LANES)), passed: false });
  }
  const rocks = [];
  for (let i = 0; i < 7; i += 1) {
    rocks.push({ x: 260 + i * 95 + rand(-25, 25), lane: Math.floor(rand(0, LANES)), hit: false });
  }

  function onAction(act) {
    if (finished) return;
    if (act === 'left') lane = Math.max(0, lane - 1);
    if (act === 'right') lane = Math.min(LANES - 1, lane + 1);
    api.hit();
  }

  function update(dt) {
    if (finished) return;
    timeLeft -= dt;
    travel += dt * 72 * speed;

    for (const g of gates) {
      if (!g.passed && travel > g.x) {
        g.passed = true;
        if (g.gap === lane) {
          streak += 1;
          bestStreak = Math.max(bestStreak, streak);
          score += 3 + (streak >= 3 ? 1 : 0);
          api.hit();
        } else {
          streak = 0;
          score += 1;
        }
      }
    }
    for (const o of rocks) {
      if (!o.hit && travel > o.x) {
        o.hit = true;
        if (o.lane === lane) {
          score = Math.max(0, score - 2);
          streak = 0;
          if (api.miss) api.miss();
        }
      }
    }
    if (timeLeft <= 0) {
      finished = true;
      api.finish(score >= gateCount * 2, {
        score,
        unit: params.unit || '分',
        detail: `穿过 ${gates.filter((g) => g.passed).length} 个旗门 · 最佳连穿 ${bestStreak}`,
      });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#B2DFFF', skyMid: '#E6F5FF', skyBottom: '#FFFFFF', venueId: params.venueId });

    // 透视：赛道从地平线的一条窄边向画面底部张开（近大远小）。
    // 关键是**分道线和赛道边缘必须用同一套插值** —— 之前分道线是竖直的，
    // 和斜着的边缘对不上，整条雪道看着就没有纵深、方向也是歪的。
    const VX = w / 2;
    const horizon = h * 0.30;
    const TOP_HALF = w * 0.17;
    const BOT_HALF = w * 0.78;
    const lerp = (a, b, t) => a + (b - a) * t;
    const laneOffset = (i) => ((i + 0.5) / LANES) * 2 - 1; // -1/3, 0, +1/3

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(VX - TOP_HALF, horizon);
    ctx.lineTo(VX + TOP_HALF, horizon);
    ctx.lineTo(VX + BOT_HALF, h);
    ctx.lineTo(VX - BOT_HALF, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(160,205,235,0.9)';
    ctx.lineWidth = 3;
    for (let i = 1; i < LANES; i += 1) {
      const f = (i / LANES) * 2 - 1;
      ctx.beginPath();
      ctx.moveTo(VX + f * TOP_HALF, horizon);
      ctx.lineTo(VX + f * BOT_HALF, h);
      ctx.stroke();
    }

    // 地平线上的一道亮边，强化"赛道伸向远方"的读感
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(VX - TOP_HALF, horizon);
    ctx.lineTo(VX + TOP_HALF, horizon);
    ctx.stroke();

    /**
     * 屏幕位置映射。指数必须**大于 1**，这一点是方向性的，不能调反：
     *
     *   指数 < 1（凹函数）—— 起点涨得最快、后面越来越平。
     *                        屏幕速度变成"地平线附近飞快、越近越慢"，是反的。
     *   指数 = 1（线性）   —— 每段高度花一样的时间，障碍慢悠悠赖在近处堆成团。
     *   指数 > 1（凸函数）—— 远处走得慢、近处加速冲过来 —— 这才是透视该有的样子。
     *
     * 1.5 是在"透视感"和"远处别挤成一条线"之间的折中：
     * 半程时障碍落在画面的 35% 高度，全程落点 0 → 1，越近间距越大。
     */
    const RANGE = 290;
    const nearOf = (d) => Math.pow(clamp(1 - d / RANGE, 0, 1), 1.5);

    const drawAt = (worldX, laneIndex, kind) => {
      const d = worldX - travel;
      if (d < -60 || d > RANGE + 40) return;
      const near = nearOf(d);
      const y = lerp(horizon, h, near);
      // 尺寸直接跟着屏幕位置走，保证"越大 = 越近"这条读感一致
      const s = 5 + 17 * near;
      const x = VX + laneOffset(laneIndex) * lerp(TOP_HALF, BOT_HALF, near);

      if (kind === 'gate') {
        ctx.save();
        ctx.strokeStyle = CANDY.coral;
        ctx.lineWidth = Math.max(3, s * 0.32);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - s * 1.5, y);
        ctx.lineTo(x - s * 1.5, y - s * 2.2);
        ctx.moveTo(x + s * 1.5, y);
        ctx.lineTo(x + s * 1.5, y - s * 2.2);
        ctx.moveTo(x - s * 1.5, y - s * 1.8);
        ctx.lineTo(x + s * 1.5, y - s * 1.8);
        ctx.stroke();
        ctx.restore();
      } else {
        obstacle(ctx, x, y, s * 0.9, 0);
      }
    };

    for (const o of rocks) drawAt(o.x, o.lane, 'rock');
    for (const g of gates) drawAt(g.x, g.gap, 'gate');

    playerBall(ctx, VX + laneOffset(lane) * BOT_HALF * 0.92, h - 42, 17, params.accent || CANDY.blue, api);
    hud(ctx, w, `${score} ${params.unit || '分'} · 连穿 ${streak}`, timeLeft, params.accent);
  }

  return { onAction, update, draw };
}

/* ---------------- 引擎四：跳跃越障（侧视） ---------------- */

/**
 * 为什么改成侧视：
 * 之前运动类小游戏都是"俯视透视"，障碍在远处只有几个像素，看不清要躲什么。
 * 侧视之后障碍大小一致、轮廓清楚，而且只有一个按钮（跳），手机单指就能玩。
 */
export function jumpEngine(canvas, params, api) {
  const GROUND = 0.78;
  let distance = 0;
  let playerY = 0;
  let velY = 0;
  let onGround = true;
  let score = 0;
  let finished = false;
  let timeLeft = params.duration ?? 10;
  let jumped = 0;
  let cleared = 0;
  let nextSpawn = 90;
  let elapsed = 0;
  const speed = params.speed ?? 1;

  const obstacles = [];

  function onAction(act) {
    if (finished || act !== 'primary') return;
    if (onGround) {
      // ⚠️ 这里的单位是**画布像素**，不是世界单位。
      // 之前写成 9.4 / 重力 26，算出来只能跳 1.7 像素高，肉眼根本看不出来。
      // 现在按"跳起约 90 像素、滞空 0.9 秒"反推：v = 4h/t，g = 2v/t。
      velY = 400;
      onGround = false;
      jumped += 1;
      api.hit();
    }
  }

  function update(dt) {
    if (finished) return;
    timeLeft -= dt;
    elapsed += dt;

    velY -= 900 * dt;
    playerY += velY * dt;
    if (playerY <= 0) {
      playerY = 0;
      velY = 0;
      onGround = true;
    }

    const advance = 200 * speed * dt;
    distance += advance;
    nextSpawn -= advance;
    if (nextSpawn <= 0) {
      obstacles.push({ x: canvas.getBoundingClientRect().width + 40, kind: Math.floor(rand(0, 3)), cleared: false });
      // 间隔要大于滞空时间（约 0.9 秒），否则连续两个障碍没法各跳一次
      nextSpawn = rand(215, 255) / speed;
    }

    for (const o of obstacles) {
      o.x -= advance;
      if (!o.cleared && o.x < 92) {
        o.cleared = true;
        // 障碍高约 30 像素，脚离地超过 34 就算跨过去了
        if (playerY > 34) {
          score += 2;
          cleared += 1;
          api.hit();
        } else {
          score = Math.max(0, score - 2);
          if (api.miss) api.miss();
        }
      }
    }
    while (obstacles.length && obstacles[0].x < -80) obstacles.shift();

    if (timeLeft <= 0) {
      finished = true;
      api.finish(score >= 6, {
        score,
        unit: params.unit || '分',
        detail: `跳过 ${cleared} 个障碍`,
      });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#A8DBFF', skyMid: '#E2F3FF', skyBottom: '#FFF4F9', venueId: params.venueId });

    const gy = h * GROUND;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x <= w; x += 40) {
      ctx.lineTo(x, gy + Math.sin((x + distance * 0.5) / 90) * 3);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(190,222,245,0.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      const x = w - (((distance * 1.5 + i * 95) % (w + 140)) - 70);
      ctx.beginPath();
      ctx.moveTo(x, gy + 24 + (i % 3) * 12);
      ctx.lineTo(x + 26, gy + 24 + (i % 3) * 12);
      ctx.stroke();
    }

    for (const o of obstacles) obstacle(ctx, o.x, gy - 12, 15, o.kind);

    const squash = onGround ? 1 : 0.94;
    playerBall(ctx, 92, gy - 30 - playerY, 18 * squash, params.accent || CANDY.mint, api);

    if (onGround && timeLeft > 0.3) {
      ctx.fillStyle = 'rgba(51,82,110,0.55)';
      ctx.font = 'bold 12px system-ui, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击跳跃', 92, gy - 64 - Math.sin(elapsed * 3.6) * 3);
    }

    hud(ctx, w, `${score} ${params.unit || '分'} · 跳过 ${jumped}`, timeLeft, params.accent);
  }

  return { onAction, update, draw };
}

export const ENGINES = {
  rhythm: rhythmEngine,
  aim: aimEngine,
  dodge: dodgeEngine,
  jump: jumpEngine,
};
