/**
 * Sport-specific mini-games. Each engine has a distinct decision loop:
 * cadence and timing, curling placement, goalie reads, slalom routing,
 * aerial timing, or cross-country pacing.
 */
import { CANDY, bgScene, playerBall, obstacle, hud } from './minigame-engines.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const rand = (min, max) => min + Math.random() * (max - min);
const ease = (from, to, amount) => from + (to - from) * clamp(amount, 0, 1);

function text(ctx, value, x, y, size = 14, color = CANDY.ink, weight = 700, align = 'center') {
  ctx.save();
  ctx.font = `${weight} ${size}px system-ui, "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
  ctx.restore();
}

function bar(ctx, x, y, width, value, color, label = '') {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.86)';
  ctx.beginPath(); ctx.roundRect(x, y, width, 10, 5); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, width * clamp(value, 0, 1), 10, 5); ctx.fill();
  if (label) text(ctx, label, x, y - 8, 10, CANDY.ink, 700, 'left');
  ctx.restore();
}

function scoreHeader(ctx, w, left, right, accent) {
  ctx.save();
  ctx.font = '700 12px system-ui, "Microsoft YaHei", sans-serif';
  const leftW = ctx.measureText(left).width + 20;
  const rightW = ctx.measureText(right).width + 20;
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  ctx.beginPath(); ctx.roundRect(12, 10, leftW, 25, 13); ctx.fill();
  ctx.beginPath(); ctx.roundRect(w - rightW - 12, 10, rightW, 25, 13); ctx.fill();
  ctx.fillStyle = accent || CANDY.blue; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(left, 22, 23);
  ctx.fillStyle = CANDY.ink; ctx.textAlign = 'right';
  ctx.fillText(right, w - 22, 23);
  ctx.restore();
}

function puck(ctx, x, y, radius, fill, outline = '#fff') {
  ctx.save();
  ctx.fillStyle = 'rgba(46,78,107,.18)';
  ctx.beginPath(); ctx.ellipse(x, y + radius * .62, radius * 1.15, radius * .42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = outline; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.ellipse(x - radius * .25, y - radius * .32, radius * .24, radius * .13, -.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function rhythmEngine(canvas, params, api) {
  let elapsed = 0;
  let timeLeft = params.duration ?? 18;
  let distance = 0;
  let rival = 0;
  let speed = 0;
  let beat = 0;
  let lastSide = '';
  let combo = 0;
  let bestCombo = 0;
  let perfect = 0;
  let lastFeedback = 0;
  let feedbackText = '准备';
  let finished = false;
  const period = params.period ?? .62;
  const window = params.window ?? .16;
  const target = params.target ?? 500;

  function onAction(action) {
    if (finished || !['left', 'right'].includes(action)) return;
    const phase = elapsed % period;
    const delta = Math.min(phase, period - phase);
    const inTime = delta <= window;
    const alternating = action !== lastSide;
    lastSide = action;
    if (!inTime || !alternating) {
      speed = Math.max(0, speed - .65);
      combo = 0;
      lastFeedback = .72;
      feedbackText = !alternating ? '左右脚要交替' : '慢半拍，跟上节奏';
      api.miss?.();
      return;
    }
    const quality = 1 - delta / window;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    if (quality > .72) perfect += 1;
    lastFeedback = .72;
    feedbackText = quality > .72 ? '踩准了！' : '不错，继续';
    speed = Math.min(2.8, speed + .62 + quality * .34 + Math.min(.2, combo * .008));
    api.hit?.();
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    lastFeedback = Math.max(0, lastFeedback - dt);
    timeLeft -= dt;
    const decay = speed > 0 ? .42 : 0;
    speed = Math.max(0, speed - decay * dt);
    distance += (0.28 + speed * .55) * dt / 17;
    rival += (params.rival ?? .68) * dt / 19;
    if (distance >= 1 || timeLeft <= 0) {
      finished = true;
      const won = distance >= rival;
      api.finish(won, {
        score: Math.round(Math.min(1, distance) * target), unit: params.unit || '米',
        detail: `${won ? '冲线领先' : '对手先到'} · 完美节拍 ${perfect} 次 · 最长连击 ${bestCombo}`,
      });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#A9DCFF', skyMid: '#DFF1FF', skyBottom: '#F2FAFF', venueId: params.venueId });
    const cx = w * .5;
    const cy = h * .52;
    const phase = (elapsed % period) / period;
    const pulse = Math.cos(phase * Math.PI * 2) * .5 + .5;
    const onBeat = phase <= window / period || phase >= 1 - window / period;
    const ring = 23 + pulse * 18;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${.45 + pulse * .5})`;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy, ring, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = onBeat ? '#FFD166' : 'rgba(255,255,255,.72)';
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const trackY = h * .78;
    ctx.fillStyle = 'rgba(255,255,255,.68)';
    ctx.beginPath(); ctx.roundRect(18, trackY - 8, w - 36, 16, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(122,174,207,.65)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.moveTo(18, trackY); ctx.lineTo(w - 18, trackY); ctx.stroke(); ctx.setLineDash([]);
    const rivalX = 24 + clamp(rival, 0, 1) * (w - 48);
    const playerX = 24 + clamp(distance, 0, 1) * (w - 48);
    playerBall(ctx, playerX, trackY + 22, 14, params.accent || CANDY.blue, api, { t: elapsed, moving: true, ski: true });
    puck(ctx, rivalX, trackY - 1, 8, '#9DB6C7');
    bar(ctx, 18, h - 18, w - 36, speed / 2.8, params.accent || CANDY.blue);
    hud(ctx, w, `${Math.round(distance * target)} / ${target} ${params.unit || '米'} · ${combo} 连拍`, timeLeft, params.accent);
    const nextSide = lastSide === 'left' ? '右脚 →' : '← 左脚';
    text(ctx, onBeat ? `${nextSide} · 现在踩！` : `${nextSide} · 等金圈收缩`, cx, h * .29, 18, onBeat ? '#A85C1A' : CANDY.ink, 900);
    if (lastFeedback > 0) text(ctx, feedbackText, cx, h * .41, 17, feedbackText.includes('准') || feedbackText.includes('不错') ? '#22866E' : '#BA553E', 900);
  }

  return { onAction, update, draw, getState: () => ({ elapsed, combo, distance, lastSide, feedbackText }) };
}

function curlingEngine(canvas, params, api) {
  let round = 0;
  let score = 0;
  let phase = 'power';
  let elapsed = 0;
  let power = 0;
  let powerDirection = 1;
  let angle = 0;
  let angleDirection = 1;
  let lockedPower = 0;
  let lockedAngle = 0;
  let flight = 0;
  let lockedTarget = 0;
  let targetOffset = 0;
  let finished = false;
  let lastPoints = 0;
  let resultHold = 0;
  const stones = [
    { x: -.31, y: .405, team: 'opponent' },
    { x: .27, y: .475, team: 'opponent' },
  ];
  const rounds = params.rounds ?? 3;

  function onAction(action) {
    if (finished || action !== 'primary' || phase === 'flight' || phase === 'result') return;
    if (phase === 'power') {
      lockedPower = power;
      phase = 'angle';
      api.hit?.();
    } else {
      lockedAngle = angle;
      lockedTarget = targetOffset;
      flight = 0;
      phase = 'flight';
      api.hit?.();
    }
  }

  function settle() {
    if (finished) return;
    finished = true;
    const won = score >= (params.goal ?? 7);
    api.finish(won, { score, unit: '分', detail: `${round} 壶 · ${stones.filter((stone) => stone.team === 'player').length} 壶留在营内` });
  }

  function resolveShot() {
    const targetX = clamp(lockedAngle * .8 + lockedTarget, -1, 1);
    const targetY = .40 + (.78 - lockedPower) * .9;
    const hit = stones.find((stone) => Math.hypot(stone.x - targetX, stone.y - targetY) < .17);
    if (hit) {
      hit.team = 'cleared';
      hit.x = clamp(hit.x + Math.sign(hit.x - targetX || 1) * .32, -1.4, 1.4);
      api.hit?.();
    }
    const distance = Math.hypot(targetX - lockedTarget, targetY - .4);
    lastPoints = clamp(5 - Math.floor(distance * 8), 0, 5);
    score += lastPoints;
    stones.push({ x: targetX, y: clamp(targetY, .2, .75), team: 'player' });
    round += 1;
    if (round >= rounds) settle();
    else { phase = 'result'; resultHold = .72; }
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    targetOffset = Math.sin(elapsed * .8) * .2;
    if (phase === 'power') {
      power += powerDirection * dt * .8;
      if (power >= 1) { power = 1; powerDirection = -1; }
      if (power <= 0) { power = 0; powerDirection = 1; }
    } else if (phase === 'angle') {
      angle += angleDirection * dt * .9;
      if (angle >= .75) { angle = .75; angleDirection = -1; }
      if (angle <= -.75) { angle = -.75; angleDirection = 1; }
    } else if (phase === 'flight') {
      flight += dt;
      if (flight >= .85) { resolveShot(); }
    } else if (phase === 'result') {
      resultHold -= dt;
      if (resultHold <= 0) {
        phase = 'power';
        power = 0;
        powerDirection = 1;
      }
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#BFE6FF', skyMid: '#EAF6FF', skyBottom: '#FFF6FA', venueId: params.venueId });
    const cx = w * .5;
    const cy = h * .39;
    const radius = Math.min(w, h) * .24;
    ctx.save();
    for (const [r, color] of [[radius, '#E5F6FF'], [radius * .69, '#82C9ED'], [radius * .39, '#F9FFFF'], [radius * .14, '#FF9EBE']]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + targetOffset * radius, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(73,132,169,.38)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
    for (const stone of stones) {
      if (stone.team === 'cleared') continue;
      puck(ctx, cx + stone.x * radius, cy + (stone.y - .4) * h * .56, 8, stone.team === 'player' ? params.accent || CANDY.pink : '#7C8790');
    }
    playerBall(ctx, cx, h * .93, 16, params.accent || CANDY.pink, api, { t: elapsed, moving: phase === 'flight' });
    const phaseLabel = phase === 'power' ? '① 选力度' : phase === 'angle' ? '② 选路线' : phase === 'flight' ? '冰壶出手' : `+${lastPoints} 分`;
    text(ctx, phaseLabel, cx, h * .69, 14, phase === 'flight' ? '#5794B3' : CANDY.ink, 800);
    bar(ctx, 18, h - 56, w - 36, phase === 'power' ? power : (lockedPower || .1), '#FFD166', '力度');
    bar(ctx, 18, h - 24, w - 36, (phase === 'angle' ? angle : lockedAngle) / 1.5 + .5, params.accent || CANDY.pink, '路线');
    scoreHeader(ctx, w, `${Math.min(round + 1, rounds)} / ${rounds} 壶`, `${score} 分`, params.accent);
    if (phase === 'flight') {
      const t = clamp(flight / .85, 0, 1);
      puck(ctx, cx + lockedAngle * radius * t, h * .88 - (h * .47 * t), 9, params.accent || CANDY.pink);
    }
  }
  return { onAction, update, draw };
}

function hockeyEngine(canvas, params, api) {
  let elapsed = 0;
  let aim = 0;
  let keeper = 0;
  let shots = 0;
  let goals = 0;
  let phase = 'ready';
  let flight = 0;
  let shotAim = 0;
  let finished = false;
  let lastResult = '';
  const total = params.shots ?? 5;

  function onAction(action) {
    if (finished) return;
    if (phase === 'flight' || phase === 'result') return;
    if (action === 'left') aim = clamp(aim - .22, -.9, .9);
    if (action === 'right') aim = clamp(aim + .22, -.9, .9);
    if (action === 'primary') {
      shotAim = aim;
      phase = 'flight';
      flight = 0;
      api.hit?.();
    }
  }

  function finishShot() {
    const gap = Math.abs(shotAim - keeper);
    const won = gap > .3 && Math.abs(shotAim) < .95;
    if (won) { goals += 1; lastResult = '进球！'; api.hit?.(); }
    else { lastResult = gap <= .3 ? '被守门员挡住' : '擦柱而过'; api.miss?.(); }
    shots += 1;
    phase = 'result';
    flight = 0;
    if (shots >= total) {
      finished = true;
      api.finish(goals >= Math.ceil(total * .6), { score: goals, unit: '球', detail: `${total} 次射门 · ${goals} 次破门` });
    }
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    keeper = Math.sin(elapsed * (params.goalieSpeed ?? 1.25)) * .58;
    if (phase === 'flight') {
      flight += dt;
      if (flight > .55) finishShot();
    } else if (phase === 'result') {
      flight += dt;
      if (flight > .48) {
        phase = 'ready';
        aim = clamp(aim * .35, -.6, .6);
        flight = 0;
      }
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#BFE6FF', skyMid: '#EAF6FF', skyBottom: '#F8FFFF', venueId: params.venueId });
    const goalX = w * .5;
    const goalY = h * .37;
    const goalW = w * .56;
    const goalH = h * .3;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(goalX - goalW / 2, goalY - goalH / 2, goalW, goalH);
    ctx.strokeStyle = '#7DABC3'; ctx.lineWidth = 4; ctx.strokeRect(goalX - goalW / 2, goalY - goalH / 2, goalW, goalH);
    ctx.strokeStyle = 'rgba(108,160,188,.38)'; ctx.lineWidth = 1;
    for (let i = 1; i < 8; i += 1) { const x = goalX - goalW / 2 + goalW * i / 8; ctx.beginPath(); ctx.moveTo(x, goalY - goalH / 2); ctx.lineTo(x, goalY + goalH / 2); ctx.stroke(); }
    for (let i = 1; i < 4; i += 1) { const y = goalY - goalH / 2 + goalH * i / 4; ctx.beginPath(); ctx.moveTo(goalX - goalW / 2, y); ctx.lineTo(goalX + goalW / 2, y); ctx.stroke(); }
    ctx.restore();
    const keeperX = goalX + keeper * goalW * .42;
    ctx.fillStyle = '#42A899'; ctx.beginPath(); ctx.roundRect(keeperX - 12, goalY - 17, 24, 38, 10); ctx.fill();
    ctx.fillStyle = '#274E68'; ctx.beginPath(); ctx.arc(keeperX, goalY - 19, 8, 0, Math.PI * 2); ctx.fill();
    const aimX = goalX + aim * goalW * .42;
    ctx.strokeStyle = '#FF9E75'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(aimX, goalY - goalH * .35); ctx.lineTo(aimX, goalY + goalH * .35); ctx.stroke(); ctx.setLineDash([]);
    if (phase === 'flight') {
      const t = clamp(flight / .55, 0, 1);
      puck(ctx, goalX + shotAim * goalW * .42 * t, h * .86 - t * h * .48, 8, '#252F38');
    } else if (phase === 'ready') puck(ctx, goalX + aim * goalW * .42, goalY + goalH * .47, 7, '#252F38');
    playerBall(ctx, goalX, h * .95, 16, params.accent || CANDY.mint, api, { t: elapsed, moving: phase === 'flight' });
    text(ctx, phase === 'result' ? lastResult : '左右瞄准 · 抓住守门员移动的空档', goalX, h * .72, 13, CANDY.ink, 800);
    scoreHeader(ctx, w, `${shots} / ${total} 次射门`, `${goals} 球`, params.accent);
  }
  return { onAction, update, draw };
}

export function aimEngine(canvas, params, api) {
  if (params.mode === 'hockey') return hockeyEngine(canvas, params, api);
  return curlingEngine(canvas, params, api);
}

export function dodgeEngine(canvas, params, api) {
  const lanes = 3;
  let lane = 1;
  let laneVisual = 1;
  let travel = 0;
  let elapsed = 0;
  let timeLeft = params.duration ?? 17;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let energy = 1;
  let boost = 0;
  let rocksDodged = 0;
  let finished = false;
  const gateCount = params.gates ?? 8;
  const gates = [];
  const rocks = [];
  for (let i = 0; i < gateCount; i += 1) {
    const gap = Math.floor(rand(0, lanes));
    gates.push({ x: 190 + i * 135, lane: gap, passed: false });
    rocks.push({ x: 265 + i * 135, lane: (gap + 1 + Math.floor(rand(0, 2))) % lanes, hit: false });
  }

  function onAction(action) {
    if (finished) return;
    if (action === 'left') lane = Math.max(0, lane - 1);
    if (action === 'right') lane = Math.min(lanes - 1, lane + 1);
    if (action === 'primary' && energy >= .34 && boost <= 0) {
      energy -= .34;
      boost = 1.05;
      api.hit?.();
    }
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    timeLeft -= dt;
    boost = Math.max(0, boost - dt);
    if (boost <= 0) energy = Math.min(1, energy + dt * .105);
    laneVisual = ease(laneVisual, lane, dt * 8);
    travel += dt * (params.speed ?? 1.15) * (boost > 0 ? 116 : 76);
    for (const gate of gates) {
      if (!gate.passed && travel >= gate.x) {
        gate.passed = true;
        if (gate.lane === lane) {
          streak += 1; bestStreak = Math.max(bestStreak, streak);
          score += 3 + (streak >= 3 ? 2 : 0);
          api.hit?.();
        } else { streak = 0; score += 1; }
      }
    }
    for (const rock of rocks) {
      if (!rock.hit && travel >= rock.x) {
        rock.hit = true;
        if (rock.lane === lane) { score = Math.max(0, score - 3); streak = 0; api.miss?.(); }
        else rocksDodged += 1;
      }
    }
    if (timeLeft <= 0) {
      finished = true;
      api.finish(score >= (params.goal ?? gateCount * 2), { score, unit: '分', detail: `连穿最佳 ${bestStreak} 门 · 躲开 ${rocksDodged} 块雪堆` });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#B2DFFF', skyMid: '#E6F5FF', skyBottom: '#FFFFFF', venueId: params.venueId });
    const center = w * .5;
    const horizon = h * .27;
    const nearWidth = w * .76;
    const farWidth = w * .14;
    const curve = Math.sin(travel * .0023) * w * .055;
    ctx.fillStyle = '#FBFEFF'; ctx.beginPath();
    ctx.moveTo(center - farWidth, horizon); ctx.lineTo(center + farWidth, horizon);
    ctx.lineTo(center + nearWidth, h); ctx.lineTo(center - nearWidth, h); ctx.closePath(); ctx.fill();
    for (let i = 1; i < lanes; i += 1) {
      const t = i / lanes * 2 - 1;
      ctx.strokeStyle = 'rgba(134,185,213,.62)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(center + curve + t * farWidth, horizon); ctx.lineTo(center + curve * 1.4 + t * nearWidth, h); ctx.stroke();
    }
    const laneX = (n) => center + curve * .7 + ((n + .5) / lanes * 2 - 1) * nearWidth * .84;
    const drawObject = (item, type) => {
      const d = item.x - travel;
      if (d < -30 || d > 360) return;
      const z = Math.pow(clamp(1 - d / 360, 0, 1), 1.55);
      const y = horizon + (h - horizon) * z;
      const x = center + curve * z + ((item.lane + .5) / lanes * 2 - 1) * (farWidth + (nearWidth - farWidth) * z);
      const size = 5 + 18 * z;
      if (type === 'gate') {
        ctx.strokeStyle = '#F28C76'; ctx.lineWidth = Math.max(2, size * .22); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x - size, y - size * 2.3); ctx.moveTo(x + size, y); ctx.lineTo(x + size, y - size * 2.3); ctx.moveTo(x - size, y - size * 1.8); ctx.lineTo(x + size, y - size * 1.8); ctx.stroke();
      } else obstacle(ctx, x, y, size * .85, 0);
    };
    for (const gate of gates) if (!gate.passed) drawObject(gate, 'gate');
    for (const rock of rocks) if (!rock.hit) drawObject(rock, 'rock');
    playerBall(ctx, laneX(laneVisual), h - 39, 17, params.accent || CANDY.coral, api, { t: elapsed, moving: true, ski: true });
    if (boost > 0) text(ctx, '雪板冲刺！', center, h * .4, 16, '#C26D4C', 900);
    bar(ctx, 18, h - 16, w - 36, energy, '#F0A67A', '冲刺能量');
    hud(ctx, w, `${score} 分 · 连穿 ${streak}`, timeLeft, params.accent);
  }
  return { onAction, update, draw };
}

export function jumpEngine(canvas, params, api) {
  let elapsed = 0;
  let phase = 'approach';
  let approach = 0;
  let flight = 0;
  let balance = 0;
  let launchQuality = 0;
  let tucked = false;
  let score = 0;
  let completed = 0;
  let misses = 0;
  let finished = false;
  let landing = 0;
  let resultHold = 0;
  let lastInput = 0;
  let balancePulse = 0;
  const jumps = params.jumps ?? 3;
  const rampAt = .76;

  function nextJump() {
    completed += 1;
    if (completed >= jumps) {
      finished = true;
      const won = score >= (params.goal ?? jumps * 4);
      api.finish(won, { score, unit: '分', detail: `${completed} 次飞跃 · ${misses} 次失误 · ${won ? '稳稳落地' : '还差一点完美姿势'}` });
    } else { phase = 'approach'; approach = 0; balance = 0; flight = 0; tucked = false; }
  }

  function onAction(action) {
    if (finished) return;
    if (phase === 'approach' && action === 'primary') {
      if (approach < .58) { api.miss?.(); return; }
      launchQuality = clamp(1 - Math.abs(approach - rampAt) / .22, 0, 1);
      if (launchQuality < .12) { misses += 1; api.miss?.(); nextJump(); return; }
      phase = 'flight'; flight = 0; balance = (Math.random() - .5) * .32; api.hit?.();
      return;
    }
    if (phase === 'flight' && (action === 'left' || action === 'right')) {
      const direction = action === 'left' ? -1 : 1;
      balance = clamp(balance + direction * .12, -1, 1);
      lastInput = direction;
      balancePulse = .55;
      api.hit?.();
      return;
    }
    if (phase === 'flight' && action === 'primary') {
      if (!tucked && flight < .65) { tucked = true; balance = clamp(balance * 1.08, -1, 1); return; }
      if (flight >= 2.0 && flight <= 2.65) {
        landing = clamp(1 - Math.abs(flight - 2.3) / .35, 0, 1);
        const form = clamp(1 - Math.abs(balance), 0, 1);
        const points = Math.round(launchQuality * 3 + form * 2 + landing * 2 + (tucked ? 1 : 0));
        score += points; phase = 'result'; flight = 0; api.hit?.();
        resultHold = .68;
      } else if (flight < 2.0) api.miss?.();
    }
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    balancePulse = Math.max(0, balancePulse - dt);
    if (phase === 'approach') {
      approach += dt / (params.approachSeconds ?? 2.5);
      if (approach >= .98) { misses += 1; api.miss?.(); nextJump(); }
    } else if (phase === 'flight') {
      flight += dt;
      balance = clamp(balance + Math.sin(elapsed * 2.7) * dt * .13, -1.2, 1.2);
      if (flight > 2.8 || Math.abs(balance) > 1.12) { misses += 1; api.miss?.(); nextJump(); }
    } else if (phase === 'result') {
      resultHold -= dt;
      if (resultHold <= 0) nextJump();
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#99D0F6', skyMid: '#DDF1FF', skyBottom: '#F7FCFF', venueId: params.venueId });
    const ground = h * .8;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(0, ground + 15); ctx.lineTo(w * .25, ground + 12); ctx.lineTo(w * .43, ground - 4); ctx.lineTo(w * .58, ground + 2); ctx.lineTo(w, ground + 42); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8BC7E9'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * .11, ground + 8); ctx.quadraticCurveTo(w * .34, ground + 7, w * .48, ground - 3); ctx.lineTo(w * .7, ground + 23); ctx.stroke();
    const rampX = w * .4;
    const runwayStart = w * .06;
    const runwayEnd = w * .91;
    const rampY = ground - h * .19;
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.beginPath(); ctx.moveTo(runwayStart, ground - h * .13); ctx.lineTo(rampX, rampY); ctx.lineTo(rampX + 18, rampY + 8); ctx.lineTo(runwayStart + 10, ground - h * .1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7AB8DE'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(runwayStart, ground - h * .13); ctx.lineTo(rampX, rampY); ctx.lineTo(rampX + 26, rampY + 12); ctx.stroke();
    ctx.fillStyle = '#FFB56E'; ctx.beginPath(); ctx.arc(rampX, rampY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.86)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(rampX + 30, rampY + 18); ctx.quadraticCurveTo(w * .64, ground - h * .22, runwayEnd, ground - 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(96,148,181,.48)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rampX + 30, rampY + 30); ctx.quadraticCurveTo(w * .67, ground - h * .08, runwayEnd, ground + 3); ctx.stroke();
    const barX = w * .08;
    ctx.fillStyle = 'rgba(255,255,255,.76)'; ctx.beginPath(); ctx.roundRect(barX, h * .38, w * .84, 11, 6); ctx.fill();
    ctx.fillStyle = approach > .58 && approach < .96 ? '#FFD166' : params.accent || CANDY.blue;
    ctx.beginPath(); ctx.roundRect(barX, h * .38, w * .84 * clamp(approach, 0, 1), 11, 6); ctx.fill();
    const px = phase === 'approach' ? w * (.1 + approach * .3) : phase === 'flight' ? ease(rampX, runwayEnd, clamp(flight / 2.8, 0, 1)) : runwayEnd;
    const py = phase === 'approach' ? ground - h * (.13 + approach * .11) : phase === 'flight' ? ground - 18 - Math.sin(Math.PI * clamp(flight / 2.8, 0, 1)) * h * .48 : ground - 18;
    const lean = phase === 'flight' ? balance * .55 : 0;
    ctx.save(); ctx.translate(px, py); ctx.rotate(lean);
    playerBall(ctx, 0, 0, 21, params.accent || CANDY.blue, api, { t: elapsed, moving: phase !== 'result', ski: true, cheer: phase === 'result' ? 1 : 0 });
    ctx.restore();
    if (phase === 'flight') {
      const centerX = w * .5;
      const barY = h * .82;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.roundRect(centerX - w * .23, barY, w * .46, 15, 8); ctx.fill();
      ctx.fillStyle = '#4D9E88'; ctx.beginPath(); ctx.roundRect(centerX - w * .23 + w * .46 * (balance + 1) / 2 - 8, barY - 5, 16, 25, 8); ctx.fill();
      ctx.fillStyle = '#D7794D'; ctx.beginPath(); ctx.moveTo(centerX, barY - 10); ctx.lineTo(centerX - 7, barY - 20); ctx.lineTo(centerX + 7, barY - 20); ctx.fill();
      if (balancePulse > 0) text(ctx, lastInput < 0 ? '← 向左修正' : '向右修正 →', centerX, barY + 31, 14, '#277B70', 900);
    }
    const cue = phase === 'approach' ? (approach < .58 ? '沿长助滑道加速' : approach < .93 ? '起跳区亮起 · 按起跳' : '错过跳台')
      : phase === 'flight' ? (flight < .65 ? '按一次收板，开始空中转体' : flight < 2.0 ? '轻点 ← → 修正平衡' : '落地窗口将至 · 按落地')
        : `漂亮！ +${score} 分`;
    text(ctx, cue, w * .5, h * .36, 14, phase === 'approach' && approach >= .58 && approach < .93 ? '#B87921' : CANDY.ink, 850);
    scoreHeader(ctx, w, `${Math.min(completed + 1, jumps)} / ${jumps} 跳`, `${score} 分`, params.accent);
  }
  return { onAction, update, draw, getState: () => ({ phase, approach, flight, balance, tucked, completed }) };
}

export function enduranceEngine(canvas, params, api) {
  let elapsed = 0;
  let timeLeft = params.duration ?? 20;
  let distance = 0;
  let stamina = .78;
  let effort = 1;
  let sprint = 0;
  let finished = false;
  let lastTerrain = 0;
  const target = params.target ?? 1180;
  const speeds = [.58, 1, 1.31];

  function onAction(action) {
    if (finished) return;
    if (action === 'left') effort = Math.max(0, effort - 1);
    if (action === 'right') effort = Math.min(2, effort + 1);
    if (action === 'primary' && stamina > .2 && sprint <= 0) { sprint = 1.1; stamina -= .2; api.hit?.(); }
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt; timeLeft -= dt;
    const terrain = Math.sin(elapsed * .48);
    const uphill = terrain > .45;
    const downhill = terrain < -.45;
    sprint = Math.max(0, sprint - dt);
    const effortRate = [-.16, .035, .18][effort];
    stamina = clamp(stamina - effortRate * dt + (downhill ? .13 : 0) * dt - (uphill ? .09 : 0) * dt - (sprint > 0 ? .18 : 0) * dt, 0, 1);
    if (stamina < .08 && effort === 2) effort = 1;
    const slope = uphill ? .78 : downhill ? 1.16 : 1;
    const burst = sprint > 0 ? 1.55 : 1;
    const fatigue = stamina < .15 ? .68 : 1;
    distance += 73 * speeds[effort] * slope * burst * fatigue * dt;
    lastTerrain = terrain;
    if (distance >= target || timeLeft <= 0) {
      finished = true;
      const won = distance >= target;
      api.finish(won, { score: Math.round(distance), unit: '米', detail: `${won ? '抵达终点' : '离终点还差 ' + Math.max(0, Math.round(target - distance)) + ' 米'} · 终点体力 ${Math.round(stamina * 100)}%` });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#A9DCFF', skyMid: '#DFF1FF', skyBottom: '#F2FAFF', venueId: params.venueId });
    const ground = h * (.61 + lastTerrain * .06);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(0, ground); ctx.quadraticCurveTo(w * .48, ground - lastTerrain * 22, w, ground + 6); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 9; i += 1) {
      const x = (i * 81 - elapsed * 35 % 81 + w) % w;
      ctx.fillStyle = i % 2 ? '#548C82' : '#80A99C';
      ctx.beginPath(); ctx.moveTo(x, ground + 12); ctx.lineTo(x + 17, ground - 24); ctx.lineTo(x + 34, ground + 12); ctx.fill();
    }
    playerBall(ctx, w * .28, ground - 25 - Math.sin(elapsed * 7) * 3, 17, params.accent || CANDY.mint, api, { t: elapsed, moving: true, ski: true });
    const condition = lastTerrain > .45 ? '上坡：稳住体力' : lastTerrain < -.45 ? '下坡：恢复体力' : '平地：把握冲刺';
    text(ctx, condition, w * .72, h * .4, 14, CANDY.ink, 800);
    const effortName = ['轻松滑', '稳定滑', '强力蹬'][effort];
    bar(ctx, 18, h - 48, w - 36, stamina, stamina < .25 ? '#F28C76' : '#77C8A9', `体力 · ${effortName}`);
    hud(ctx, w, `${Math.round(distance)} / ${target} 米`, timeLeft, params.accent);
  }
  return { onAction, update, draw };
}

export function goalieEngine(canvas, params, api) {
  const sequence = Array.isArray(params.sequence) && params.sequence.length
    ? params.sequence.map((lane) => clamp(Math.floor(lane), 0, 2)) : null;
  const total = 5;
  let elapsed = 0;
  let phase = 'preview';
  let phaseTime = 0;
  let shotLane = sequence ? sequence[0] : Math.floor(rand(0, 3));
  let shots = 0;
  let saves = 0;
  let streak = 0;
  let bestStreak = 0;
  let lastResult = '';
  let finished = false;

  function nextShot() {
    if (shots >= total) {
      finished = true;
      const won = saves >= 3;
      api.finish(won, { score: saves, unit: '次扑救', detail: `${saves} / ${total} 次扑出 · 最长连扑 ${bestStreak} 次` });
      return;
    }
    phase = 'preview';
    phaseTime = 0;
    shotLane = sequence ? (sequence[shots % sequence.length]) : Math.floor(rand(0, 3));
  }

  function resolve(action) {
    const lane = action === 'left' ? 0 : action === 'center' ? 1 : action === 'right' ? 2 : -1;
    if (lane < 0) return;
    shots += 1;
    if (lane === shotLane) {
      saves += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      lastResult = '扑救成功！';
      api.hit?.();
    } else {
      lastResult = `球射向${['左侧', '中路', '右侧'][shotLane]}，这次没扑到。`;
      streak = 0;
      api.miss?.();
    }
    phase = 'result';
    phaseTime = 0;
  }

  function onAction(action) {
    if (finished || phase !== 'save') return;
    resolve(action);
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    phaseTime += dt;
    if (phase === 'preview' && phaseTime >= .78) { phase = 'save'; phaseTime = 0; }
    else if (phase === 'save' && phaseTime >= 1.45) {
      shots += 1;
      streak = 0;
      lastResult = `反应慢了，球射向${['左侧', '中路', '右侧'][shotLane]}。`;
      api.miss?.();
      phase = 'result';
      phaseTime = 0;
    } else if (phase === 'result' && phaseTime >= .62) nextShot();
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#A9DCFF', skyMid: '#DFF1FF', skyBottom: '#F8FFFF', venueId: params.venueId });
    const goalX = w * .5;
    const goalY = h * .44;
    const goalW = w * .68;
    const goalH = h * .43;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.beginPath(); ctx.roundRect(goalX - goalW / 2, goalY - goalH / 2, goalW, goalH, 9); ctx.fill();
    ctx.strokeStyle = '#6C9EB9'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(goalX - goalW / 2, goalY - goalH / 2, goalW, goalH, 9); ctx.stroke();
    ctx.strokeStyle = 'rgba(104,159,185,.42)'; ctx.lineWidth = 1;
    for (let i = 1; i < 8; i += 1) {
      const x = goalX - goalW / 2 + goalW * i / 8;
      ctx.beginPath(); ctx.moveTo(x, goalY - goalH / 2); ctx.lineTo(x, goalY + goalH / 2); ctx.stroke();
    }
    for (let i = 1; i < 4; i += 1) {
      const y = goalY - goalH / 2 + goalH * i / 4;
      ctx.beginPath(); ctx.moveTo(goalX - goalW / 2, y); ctx.lineTo(goalX + goalW / 2, y); ctx.stroke();
    }
    ctx.restore();
    const laneX = goalX + (shotLane - 1) * goalW * .29;
    const targetY = goalY - goalH * .22;
    if (phase === 'preview' || phase === 'save') {
      ctx.save();
      ctx.strokeStyle = '#E78C6B'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(goalX, h * .16); ctx.quadraticCurveTo(goalX + (laneX - goalX) * .46, h * .23, laneX, targetY); ctx.stroke();
      ctx.setLineDash([]);
      const progress = phase === 'preview' ? clamp(phaseTime / .78, 0, 1) : 1;
      const ballX = ease(goalX, laneX, progress);
      const ballY = ease(h * .16, targetY, progress);
      puck(ctx, ballX, ballY, 8, '#233D50', '#fff');
      ctx.beginPath(); ctx.arc(laneX, targetY, phase === 'save' ? 14 + Math.sin(elapsed * 12) * 2 : 13, 0, Math.PI * 2);
      ctx.strokeStyle = '#E78C6B'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    const keeperX = phase === 'result' && lastResult === '扑救成功！' ? laneX : goalX;
    playerBall(ctx, keeperX, h * .93, 19, params.accent || CANDY.mint, api, { t: elapsed, moving: phase === 'save' || (phase === 'result' && lastResult === '扑救成功！'), cheer: phase === 'result' && lastResult === '扑救成功！' ? .2 : 0 });
    const cue = phase === 'preview' ? '看清冰球轨迹' : phase === 'save' ? '现在扑救：← 左　S 中　右 →' : lastResult;
    text(ctx, cue, goalX, h * .76, 14, phase === 'save' ? '#AD694F' : CANDY.ink, 850);
    if (phase === 'save') bar(ctx, 18, h - 18, w - 36, 1 - phaseTime / 1.45, '#E78C6B', '扑救时机');
    scoreHeader(ctx, w, `${Math.min(shots + (phase === 'result' ? 0 : 1), total)} / ${total} 次射门`, `${saves} 次扑救`, params.accent);
  }

  return { onAction, update, draw };
}

export const ENGINES = {
  rhythm: rhythmEngine,
  aim: aimEngine,
  dodge: dodgeEngine,
  jump: jumpEngine,
  endurance: enduranceEngine,
  goalie: goalieEngine,
};
