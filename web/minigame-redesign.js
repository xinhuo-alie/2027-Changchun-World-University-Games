/**
 * Sport-specific mini-games. Each engine has a distinct decision loop:
 * cadence and timing, curling placement, goalie reads, slalom routing,
 * aerial timing, or cross-country pacing.
 */
import { CANDY, bgScene, playerBall, obstacle, hud, drawPine } from './minigame-engines.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const rand = (min, max) => min + Math.random() * (max - min);
function seededRandom(seed = 1) { let state=(Number(seed)>>>0)||1; return ()=>{state=(state+0x6D2B79F5)|0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}; }
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

function drawSkater(ctx, x, bottom, height, color = '#ed7868') {
  const width=height*.72;ctx.save();ctx.translate(x,bottom);ctx.fillStyle='rgba(42,83,112,.2)';ctx.beginPath();ctx.ellipse(0,2,width*.48,height*.055,0,0,Math.PI*2);ctx.fill();
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(2,height*.035);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-width*.19,-height*.69,width*.38,height*.43,width*.12);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f4d6bd';ctx.beginPath();ctx.arc(0,-height*.79,height*.13,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#28516a';ctx.beginPath();ctx.arc(0,-height*.83,height*.145,Math.PI,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#324e67';ctx.lineWidth=Math.max(3,height*.055);ctx.beginPath();ctx.moveTo(-width*.07,-height*.28);ctx.lineTo(-width*.18,-height*.08);ctx.moveTo(width*.07,-height*.28);ctx.lineTo(width*.18,-height*.08);ctx.stroke();
  ctx.strokeStyle='#5d8295';ctx.lineWidth=Math.max(2,height*.025);ctx.beginPath();ctx.moveTo(-width*.32,-height*.035);ctx.lineTo(width*.32,-height*.035);ctx.moveTo(-width*.28,0);ctx.lineTo(width*.28,0);ctx.stroke();ctx.restore();
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
  let stamina = 1;
  let sprint = 0;
  let sprintWindows = 0;
  let lastSprintSection = -1;
  let curveIndex = 0;
  let successfulOvertakes = 0;
  let finished = false;
  const period = params.period ?? .62;
  const window = params.window ?? .16;
  const target = params.target ?? 500;

  function onAction(action) {
    if (finished) return;
    if (action === 'primary' && params.venueId === 'speed') {
      const segment=Math.max(1,(params.duration||55)/3);const section=Math.min(2,Math.floor(elapsed/segment));const within=elapsed%segment;
      if(section!==lastSprintSection&&within>segment*.52&&within<segment*.84&&stamina>.22){lastSprintSection=section;sprintWindows+=1;sprint=2.8;stamina=Math.max(0,stamina-.25);feedbackText='冲刺窗口抓住了！';lastFeedback=.9;api.hit?.()}else{feedbackText='等风速窗口开启';lastFeedback=.65;api.miss?.()}
      return;
    }
    if (action === 'primary' && params.venueId === 'wuhuan') {
      const bend=[.27,.55,.82][curveIndex];
      if(bend!==undefined&&Math.abs(distance-bend)<.12){successfulOvertakes+=1;speed=Math.min(2.8,speed+.8);curveIndex+=1;feedbackText='内线超越！';lastFeedback=.9;api.hit?.()}else{feedbackText='弯道还没到，先跟住节拍';lastFeedback=.65;api.miss?.()}
      return;
    }
    if (!['left', 'right'].includes(action)) return;
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
    sprint=Math.max(0,sprint-dt);
    if(params.venueId==='speed')stamina=clamp(stamina+(sprint>0?-.12:.018)*dt,0,1);
    distance += (0.28 + speed * .55) * (sprint>0?1.42:1) * dt / 20;
    rival += (params.rival ?? .68) * dt / 19;
    if (distance >= 1 || timeLeft <= 0) {
      finished = true;
      const won = distance >= rival;
      api.finish(won, {
        score: Math.round(Math.min(1, distance) * target), unit: params.unit || '米',
        detail: `${won ? '冲线领先' : '对手先到'} · 完美节拍 ${perfect} 次 · 最长连击 ${bestCombo}${params.venueId==='wuhuan'?` · 弯道超越 ${successfulOvertakes} 次`:''}${params.venueId==='speed'?` · 冲刺窗 ${sprintWindows}/3 · 剩余体力 ${Math.round(stamina*100)}%`:''}`,
        metrics: { perfectBeats: perfect, bestCombo, successfulOvertakes, sprintWindows, staminaRemaining: Math.round(stamina*100) },
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

    const trackX=cx,trackY=h*.63,rx=w*.405,ry=h*.235;
    ctx.save();
    ctx.shadowColor='rgba(32,77,104,.22)';ctx.shadowBlur=20;ctx.shadowOffsetY=8;
    ctx.fillStyle='rgba(255,255,255,.88)';ctx.beginPath();ctx.ellipse(trackX,trackY,rx+15,ry+15,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    const ice=ctx.createLinearGradient(0,trackY-ry,0,trackY+ry);ice.addColorStop(0,'#8fc8df');ice.addColorStop(.17,'#eefaff');ice.addColorStop(.55,'#c5e8f2');ice.addColorStop(1,'#78b4ce');
    ctx.fillStyle=ice;ctx.beginPath();ctx.ellipse(trackX,trackY,rx,ry,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(45,101,126,.16)';ctx.beginPath();ctx.ellipse(trackX,trackY,rx*.59,ry*.48,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(trackX,trackY,rx*.80,ry*.76,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(57,123,151,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(trackX,trackY,rx*.59,ry*.48,0,0,Math.PI*2);ctx.stroke();
    // A checkered finish arch and lane markers make the oval read as a race venue.
    const finishX=trackX+rx*.89,finishY=trackY;
    ctx.save();ctx.translate(finishX,finishY);ctx.fillStyle='#f7fbfc';ctx.fillRect(-8,-31,16,62);ctx.fillStyle='#2d6f86';
    for(let row=0;row<4;row++)for(let col=0;col<2;col++)if((row+col)%2===0)ctx.fillRect(-8+col*8,-31+row*8,8,8);
    ctx.restore();
    const skaterAt=(progress,laneOffset)=>{const angle=clamp(progress,0,1)*Math.PI*2-Math.PI/2;return {x:trackX+Math.cos(angle)*(rx*.70+laneOffset),y:trackY+Math.sin(angle)*(ry*.65+laneOffset*.6)};};
    const rivalPos=skaterAt(rival,-8),playerPos=skaterAt(distance,8);
    const leader=distance>=rival;
    ctx.save();ctx.fillStyle=leader?'rgba(68,160,139,.22)':'rgba(233,143,114,.2)';ctx.beginPath();ctx.ellipse(playerPos.x,playerPos.y+20,30,10,0,0,Math.PI*2);ctx.fill();ctx.restore();
    playerBall(ctx,playerPos.x,playerPos.y+20,14,params.accent||CANDY.blue,api,{t:elapsed,moving:true,ski:true});
    if(!api.drawSprite?.(ctx,'speed-skater-red',rivalPos.x-31,rivalPos.y-61,62,82))drawSkater(ctx,rivalPos.x,rivalPos.y+20,82,'#e97862');
    const ribbonY=h*.94;
    ctx.fillStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.roundRect(24,ribbonY-7,w-48,14,7);ctx.fill();
    const progress=clamp(distance,0,1);const ribbon=ctx.createLinearGradient(24,0,w-24,0);ribbon.addColorStop(0,'#66b8d1');ribbon.addColorStop(1,'#2c827f');ctx.fillStyle=ribbon;ctx.beginPath();ctx.roundRect(24,ribbonY-7,(w-48)*progress,14,7);ctx.fill();
    bar(ctx, 18, h - 18, w - 36, speed / 2.8, params.accent || CANDY.blue);
    hud(ctx, w, `${Math.round(distance * target)} / ${target} ${params.unit || '米'} · ${combo} 连拍`, timeLeft, params.accent);
    const nextSide = lastSide === 'left' ? '右脚 →' : '← 左脚';
    const pacing=params.venueId==='speed'?`冲刺窗口 ${sprintWindows}/3 · ${sprint>0?'冲刺中':'体力 '+Math.round(stamina*100)+'%'}`:params.venueId==='wuhuan'?`弯道 ${Math.min(curveIndex+1,3)}/3 · 按空格抢内线`:`${nextSide} · ${onBeat?'现在踩！':'等金圈收缩'}`;
    text(ctx, params.venueId==='speed'?pacing:onBeat?`${nextSide} · 现在踩！`:pacing, cx, h * .29, 18, onBeat ? '#A85C1A' : CANDY.ink, 900);
    if (lastFeedback > 0) text(ctx, feedbackText, cx, h * .41, 17, feedbackText.includes('准') || feedbackText.includes('不错') ? '#22866E' : '#BA553E', 900);
  }

  return { onAction, update, draw, getState: () => ({ elapsed, combo, distance, lastSide, feedbackText }) };
}

function curlingEngine(canvas, params, api) {
  const random=seededRandom(params.seed);
  let round = 0;
  let score = 0;
  let opponentScore=0,effectiveCollisions=0,closestPlayer=Infinity;
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
    const playerStones=stones.filter(stone=>stone.team==='player');const rivalStones=stones.filter(stone=>stone.team==='opponent');
    const targetDistance=stone=>Math.hypot(stone.x,stone.y-.4);const playerBest=Math.min(Infinity,...playerStones.map(targetDistance));const rivalBest=Math.min(Infinity,...rivalStones.map(targetDistance));
    const won = playerBest < rivalBest;
    api.finish(won, { score, unit: '分', detail: `${round} 壶 · 你 ${score} : ${opponentScore} 对手 · 最近壶 ${Math.round(playerBest*1000)} mm`, metrics:{wins:won?1:0,endScore:score,closestStoneMm:Math.round(playerBest*1000),effectiveCollisions,opponentScore} });
  }

  function resolveShot() {
    const targetX = clamp(lockedAngle * .8 + lockedTarget, -1, 1);
    const targetY = .40 + (.78 - lockedPower) * .9;
    const hit = stones.find((stone) => Math.hypot(stone.x - targetX, stone.y - targetY) < .17);
    if (hit) {
      if(hit.team==='opponent')effectiveCollisions+=1;
      hit.team = 'cleared';
      hit.x = clamp(hit.x + Math.sign(hit.x - targetX || 1) * .32, -1.4, 1.4);
      api.hit?.();
    }
    // Score from the stone's final distance to the centre of the house.
    const distance = Math.hypot(targetX, targetY - .4);
    lastPoints = clamp(5 - Math.floor(distance * 8), 0, 5);
    score += lastPoints;
    closestPlayer=Math.min(closestPlayer,distance);
    stones.push({ x: targetX, y: clamp(targetY, .2, .75), team: 'player' });
    round += 1;
    const spread=params.difficulty==='easy'?.52:params.difficulty==='challenge'?.12:.28;
    const aiX=clamp((random()-.5)*spread,-.28,.28),aiY=.34+random()*(params.difficulty==='challenge'?.08:.18);
    stones.push({x:aiX,y:aiY,team:'opponent'});opponentScore+=clamp(5-Math.floor(Math.hypot(aiX,aiY-.4)*8),0,5);
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
    api.drawSprite?.(ctx,'curling-house',cx-radius,cy-radius,radius*2,radius*2);
    ctx.save();
    for (const [r, color] of [[radius, '#E5F6FF'], [radius * .69, '#82C9ED'], [radius * .39, '#F9FFFF'], [radius * .14, '#FF9EBE']]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + targetOffset * radius, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(73,132,169,.38)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
    for (const stone of stones) {
      if (stone.team === 'cleared') continue;
      const sx=cx+stone.x*radius,sy=cy+(stone.y-.4)*h*.56;
      if(!api.drawSprite?.(ctx,'curling-stone',sx-10,sy-10,20,20))puck(ctx,sx,sy,8,stone.team==='player'?params.accent||CANDY.pink:'#7C8790');
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
  return { onAction, update, draw, getState:()=>({score,round,phase}) };
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
  let fakeUsed=false,shotFake=false,fakeSuccess=0,shotsOnTarget=0,saves=0;
  const total = params.shots ?? 5;

  function onAction(action) {
    if (finished) return;
    if (phase === 'flight' || phase === 'result') return;
    if (action === 'left') aim = clamp(aim - .22, -.9, .9);
    if (action === 'right') aim = clamp(aim + .22, -.9, .9);
    if(action==='center'&&!fakeUsed){fakeUsed=true;shotFake=true;const prior=aim;aim=clamp(aim===0?.32:-aim,-.9,.9);keeper=prior;fakeSuccess+=1;api.hit?.()}
    if (action === 'primary') {
      if(Math.abs(aim)<.9)shotsOnTarget+=1;
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
    else { saves+=1;lastResult = gap <= .3 ? '被守门员挡住' : '擦柱而过'; api.miss?.(); }
    shotFake=false;
    shots += 1;
    phase = 'result';
    flight = 0;
    if (shots >= total) {
      finished = true;
      api.finish(goals >= Math.ceil(total * .6), { score: goals, unit: '球', detail: `${total} 次射门 · ${goals} 次破门 · 假动作${fakeUsed?'已使用':'未使用'} · ${saves} 次被挡`,metrics:{goals,shotsOnTarget,fakeoutSuccess:fakeSuccess,saves} });
    }
  }

  function update(dt) {
    if (finished) return;
    elapsed += dt;
    if(!shotFake)keeper = Math.sin(elapsed * (params.goalieSpeed ?? 1.25)) * .58;
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
    if(!api.drawSprite?.(ctx,'hockey-goalie',keeperX-35,goalY-64,70,88))drawSkater(ctx,keeperX,goalY+24,88,'#42a899');
    const aimX = goalX + aim * goalW * .42;
    ctx.strokeStyle = '#FF9E75'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(aimX, goalY - goalH * .35); ctx.lineTo(aimX, goalY + goalH * .35); ctx.stroke(); ctx.setLineDash([]);
    if (phase === 'flight') {
      const t = clamp(flight / .55, 0, 1);
      const px=goalX+shotAim*goalW*.42*t,py=h*.86-t*h*.48;if(!api.drawSprite?.(ctx,'hockey-puck',px-10,py-8,20,16))puck(ctx,px,py,8,'#252F38');
    } else if (phase === 'ready') {const px=goalX+aim*goalW*.42,py=goalY+goalH*.47;if(!api.drawSprite?.(ctx,'hockey-puck',px-9,py-7,18,14))puck(ctx,px,py,7,'#252F38');}
    playerBall(ctx, goalX, h * .95, 16, params.accent || CANDY.mint, api, { t: elapsed, moving: phase === 'flight' });
    text(ctx, phase === 'result' ? lastResult : '左右瞄准 · 抓住守门员移动的空档', goalX, h * .72, 13, CANDY.ink, 800);
    scoreHeader(ctx, w, `${shots} / ${total} 次射门`, `${goals} 球`, params.accent);
  }
  return { onAction, update, draw, getState:()=>({score:goals,goals,shots,phase}) };
}

export function aimEngine(canvas, params, api) {
  if ((params.gameMode || params.mode) === 'hockey') return hockeyEngine(canvas, params, api);
  return curlingEngine(canvas, params, api);
}

function shootoutEngine(canvas,params,api){
  const random=seededRandom(params.seed);let round=0,phase='ready',elapsed=0,phaseTime=0,aim=1,shotLane=0,keeperLane=1,goalsFor=0,goalsAgainst=0,saves=0,finished=false,lastResult='';
  function next(){if(round>=5){finished=true;const won=goalsFor>goalsAgainst;api.finish(won,{score:goalsFor,unit:'球',detail:`进球 ${goalsFor} · 失球 ${goalsAgainst} · 扑救 ${saves}`,metrics:{goalsFor,goalsAgainst,saves}});return}aim=1;shotLane=Math.floor(random()*3);keeperLane=Math.floor(random()*3);phase=round%2===0?'attack':'preview';phaseTime=0}
  function onAction(action){if(finished)return;if(phase==='attack'){if(action==='left')aim=Math.max(0,aim-1);if(action==='right')aim=Math.min(2,aim+1);if(action==='primary'){const goal=aim!==keeperLane;if(goal)goalsFor++;lastResult=goal?'射门破网！':'门将判断正确，封住近角';phase='result';phaseTime=0;api[goal?'hit':'miss']?.()}return}if(phase==='save'&&['left','center','right'].includes(action)){const lane=action==='left'?0:action==='center'?1:2;const saved=lane===shotLane;if(saved)saves++;else goalsAgainst++;lastResult=saved?'判断正确，扑救成功！':`射门落在${['左侧','中路','右侧'][shotLane]}`;phase='result';phaseTime=0;api[saved?'hit':'miss']?.()}}
  function update(dt){if(finished)return;elapsed+=dt;phaseTime+=dt;if(phase==='preview'&&phaseTime>.9){phase='save';phaseTime=0}else if(phase==='result'&&phaseTime>.72){round++;next()}}
  function draw(ctx,w,h){bgScene(ctx,w,h,{skyTop:'#BFE6FF',skyMid:'#EAF6FF',skyBottom:'#F8FFFF',venueId:'olympic'});const gx=w*.5,gy=h*.42,gw=w*.68,gh=h*.37;ctx.fillStyle='rgba(255,255,255,.84)';ctx.fillRect(gx-gw/2,gy-gh/2,gw,gh);ctx.strokeStyle='#6C9EB9';ctx.lineWidth=4;ctx.strokeRect(gx-gw/2,gy-gh/2,gw,gh);for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(gx-gw/2+gw*i/3,gy-gh/2);ctx.lineTo(gx-gw/2+gw*i/3,gy+gh/2);ctx.stroke()}const lane=phase==='attack'?aim:shotLane;const x=gx+(lane-1)*gw*.3; if(phase==='preview'||phase==='save'||phase==='attack'){ctx.beginPath();ctx.arc(x,gy,phase==='save'?18+Math.sin(elapsed*12)*3:13,0,Math.PI*2);ctx.strokeStyle='#E78C6B';ctx.lineWidth=4;ctx.stroke()}if(!api.drawSprite?.(ctx,'hockey-goalie',gx-38,gy-57,76,88))drawSkater(ctx,gx,gy+31,88,'#42a899');playerBall(ctx,gx,h*.92,16,params.accent||CANDY.blue,api,{t:elapsed,moving:phase==='result'});const role=phase==='attack'?'你的进攻回合：瞄准并射门':phase==='preview'?'观察对手射门方向':phase==='save'?'你的防守回合：选择扑救方向':lastResult;text(ctx,role,gx,h*.73,15,CANDY.ink,850);scoreHeader(ctx,w,`第 ${Math.min(round+1,5)} / 5 轮`,`${goalsFor} : ${goalsAgainst}`,params.accent)}
  next();return {onAction,update,draw,getRole:()=>phase==='save'?'defend':phase==='preview'?'defend':'attack',getState:()=>({score:goalsFor,goalsFor,goalsAgainst,round,phase})};
}

export function dodgeEngine(canvas, params, api) {
  const random=seededRandom(params.seed);
  const lanes = params.venueId==='songhuahu'?2:3;
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
  let missedGates=0,collisions=0,collectibles=0,riskBonus=0;
  let gateFeedback=0,gateMessage='';
  let finished = false;
  const gateCount = params.gates ?? (params.venueId==='sculpture'?5:params.venueId==='beidahu'?10:8);
  const gates = [];
  const rocks = [];
  for (let i = 0; i < gateCount; i += 1) {
    const gap = Math.floor(random() * lanes);
    gates.push({ x: 190 + i * 135, lane: gap, index:i, passed: false });
    rocks.push({ x: 265 + i * 135, lane: (gap + 1 + Math.floor(random() * 2)) % lanes, hit: false });
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
    gateFeedback=Math.max(0,gateFeedback-dt);
    if (boost <= 0) energy = Math.min(1, energy + dt * .105);
    laneVisual = ease(laneVisual, lane, dt * 8);
    travel += dt * (params.speed ?? 1.15) * (boost > 0 ? 116 : 76) * 17 / Math.max(17,timeLeft+elapsed);
    // The gate's base reaches the skier at y = h - 39. Score when that
    // projected crossing happens, not when the gate's world x falls behind.
    const viewH=canvas?.getBoundingClientRect?.().height||360;
    const horizon=viewH*.27;
    const crossingZ=clamp((viewH-39-horizon)/(viewH-horizon),.6,.99);
    const passLead=360*(1-Math.pow(crossingZ,1/1.55));
    for (const gate of gates) {
      if (!gate.passed && travel >= gate.x-passLead) {
        gate.passed = true;
        if (gate.lane === lane) {
          streak += 1; bestStreak = Math.max(bestStreak, streak);
          score += 3 + (streak >= 3 ? 2 : 0);
          gateMessage=`旗门通过 +${3 + (streak >= 3 ? 2 : 0)}`;
          api.hit?.();
          if(params.venueId==='sculpture'&&gate.index%2===0)collectibles+=1;
          if(params.venueId==='beidahu'&&lane===0)riskBonus+=1;
        } else { streak = 0; missedGates+=1;gateMessage='错过旗门 · 继续找准雪道'; }
        gateFeedback=.9;
      }
    }
    for (const rock of rocks) {
      if (!rock.hit && travel >= rock.x-passLead) {
        rock.hit = true;
        if (rock.lane === lane) { score = Math.max(0, score - 3); streak = 0;collisions+=1; api.miss?.(); }
        else rocksDodged += 1;
      }
    }
    if (timeLeft <= 0) {
      finished = true;
      api.finish(score >= (params.goal ?? gateCount * 2), { score, unit: '分', detail: params.venueId==='sculpture'?`通过 ${gateCount-missedGates}/${gateCount} 旗门 · 收集 ${collectibles} 枚灵感章 · 躲开 ${rocksDodged} 块雪堆`:params.venueId==='beidahu'?`漏门 ${missedGates} · 碰撞 ${collisions} · 冒险线收益 ${riskBonus}`:`连穿最佳 ${bestStreak} 门 · 漏门 ${missedGates} · 躲开 ${rocksDodged} 块雪堆`,metrics:{missedGates,collisions,collectibles,riskBonus,rocksDodged,bestStreak} });
    }
  }

  function draw(ctx, w, h) {
    bgScene(ctx, w, h, { skyTop: '#B2DFFF', skyMid: '#E6F5FF', skyBottom: '#FFFFFF', venueId: params.venueId });
    const center = w * .5;
    const horizon = h * .27;
    const nearWidth = w * .68;
    const farWidth = w * .14;
    const curve = Math.sin(travel * .0023) * w * .045;
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
        if(api.drawSprite?.(ctx,'slalom-gate',x-size,y-size*2.2,size*2,size*2.4))return;
        ctx.strokeStyle = '#F28C76'; ctx.lineWidth = Math.max(2, size * .22); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x - size, y - size * 2.3); ctx.moveTo(x + size, y); ctx.lineTo(x + size, y - size * 2.3); ctx.moveTo(x - size, y - size * 1.8); ctx.lineTo(x + size, y - size * 1.8); ctx.stroke();
      } else obstacle(ctx, x, y, size * .85, 0);
    };
    for (const gate of gates) if (!gate.passed) drawObject(gate, 'gate');
    for (const rock of rocks) if (!rock.hit) drawObject(rock, 'rock');
    playerBall(ctx, laneX(laneVisual), h - 39, 17, params.accent || CANDY.coral, api, { t: elapsed, moving: true, ski: true });
    if (boost > 0) text(ctx, '雪板冲刺！', center, h * .4, 16, '#C26D4C', 900);
    if(gateFeedback>0){ctx.save();const alpha=Math.min(1,gateFeedback*2);ctx.globalAlpha=alpha;ctx.fillStyle='rgba(255,255,255,.94)';ctx.beginPath();ctx.roundRect(center-112,h*.53,224,36,18);ctx.fill();ctx.strokeStyle=gateMessage.includes('+')?'rgba(67,171,141,.55)':'rgba(223,134,105,.45)';ctx.lineWidth=1.5;ctx.stroke();text(ctx,gateMessage,center,h*.53+18,14,gateMessage.includes('+')?'#287c68':'#a55b4c',850);ctx.restore();}
    bar(ctx, 18, h - 16, w - 36, energy, '#F0A67A', '冲刺能量');
    hud(ctx, w, `${score} 分 · 连穿 ${streak}`, timeLeft, params.accent);
  }
  return { onAction, update, draw, getState:()=>({travel,score,gates:gates.map(({x,lane,index,passed})=>({x,lane,index,passed})),missedGates,collectibles}) };
}

export function jumpEngine(canvas, params, api) {
  const random=seededRandom(params.seed);
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
      phase = 'flight'; flight = 0; balance = (random() - .5) * .32; api.hit?.();
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
      ctx.fillStyle = '#D7794D'; ctx.beginPath();ctx.arc(centerX,barY-15,4.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.roundRect(centerX-2,barY-11,4,8,2);ctx.fill();
      if (balancePulse > 0) text(ctx, lastInput < 0 ? '← 向左修正' : '向右修正 →', centerX, barY + 31, 14, '#277B70', 900);
    }
    const cue = phase === 'approach' ? (approach < .58 ? '沿长助滑道加速' : approach < .93 ? '起跳区亮起 · 按起跳' : '错过跳台')
      : phase === 'flight' ? (flight < .65 ? '按一次收板，开始空中转体' : flight < 2.0 ? '轻点 ← → 修正平衡' : '落地窗口将至 · 按落地')
        : `漂亮！ +${score} 分`;
    text(ctx, cue, w * .5, h * .36, 14, phase === 'approach' && approach >= .58 && approach < .93 ? '#B87921' : CANDY.ink, 850);
    scoreHeader(ctx, w, `${Math.min(completed + 1, jumps)} / ${jumps} 跳`, `${score} 分`, params.accent);
  }
  return { onAction, update, draw, getState: () => ({ score,misses,phase,approach,flight,balance,tucked,completed }) };
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
      const size=31+(i%3)*6;
      drawPine(ctx,x+17,ground+13,size,i%2?'#548C82':'#80A99C');
    }
    playerBall(ctx, w * .28, ground - 25 - Math.sin(elapsed * 7) * 3, 17, params.accent || CANDY.mint, api, { t: elapsed, moving: true, ski: true });
    const condition = lastTerrain > .45 ? '上坡：稳住体力' : lastTerrain < -.45 ? '下坡：恢复体力' : '平地：把握冲刺';
    text(ctx, condition, w * .72, h * .4, 14, CANDY.ink, 800);
    const effortName = ['轻松滑', '稳定滑', '强力蹬'][effort];
    bar(ctx, 18, h - 48, w - 36, stamina, stamina < .25 ? '#F28C76' : '#77C8A9', `体力 · ${effortName}`);
    hud(ctx, w, `${Math.round(distance)} / ${target} 米`, timeLeft, params.accent);
  }
  return { onAction, update, draw, getState:()=>({distance,score:Math.round(distance),stamina,effort,timeLeft}) };
}

export function goalieEngine(canvas, params, api) {
  const random=seededRandom(params.seed);
  const sequence = Array.isArray(params.sequence) && params.sequence.length
    ? params.sequence.map((lane) => clamp(Math.floor(lane), 0, 2)) : null;
  const total = 5;
  let elapsed = 0;
  let phase = 'preview';
  let phaseTime = 0;
  let shotLane = sequence ? sequence[0] : Math.floor(random() * 3);
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
    shotLane = sequence ? (sequence[shots % sequence.length]) : Math.floor(random() * 3);
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

  return { onAction, update, draw, getState:()=>({score:saves,saves,shots,phase,lastResult}) };
}

function attractionEngine(canvas,params,api){
  const random=seededRandom(params.seed);const placeId=params.placeId;const symbolSet=['✦','❄','◆'];
  const story={
    palace:[
      ['先从哪类线索建立背景？',['历史背景','建筑细节','游览路线'],0],
      ['接下来观察什么？',['电影制作','宫廷旧址','雪道设计'],1],
      ['最后回看哪条线索？',['历史影响','商店布局','湖岸景色'],0],
    ],
    film:[
      ['第一张剪辑卡应当做什么？',['建立场景','动作','反应'],0],
      ['场景建立后接哪张？',['反应','动作','片尾'],1],
      ['动作之后怎样收束？',['建立场景','反应','空镜'],1],
    ],
    mountainmall:[
      ['先从哪里进入室内山城？',['山脚入口','高处观景','特色店铺'],0],
      ['沿路接下来停在哪里？',['回到入口','山间步道','离开园区'],1],
      ['最后在哪处换个视角？',['山脚入口','山间步道','高处观景'],2],
    ],
    culture:[
      ['第一处剪影差异在什么位置？',['左侧轮廓','中央雕塑','右侧建筑'],null],
      ['第二处差异换到另一处地标。',['左侧轮廓','中央雕塑','右侧建筑'],null],
      ['最后找出剩下的变化。',['左侧轮廓','中央雕塑','右侧建筑'],null],
    ],
    century:[
      ['导演提示：先交代观众身处何处。',['镜头','音效','特效'],0],
      ['动作出现时，哪项最能强调节奏？',['音效','镜头','字幕'],0],
      ['场景转换时，用什么制造视觉惊喜？',['音效','镜头','特效'],2],
      ['人物反应镜头后，选哪种声音收尾？',['音效','特效','镜头'],0],
      ['最后用哪项定格精彩瞬间？',['镜头','音效','特效'],0],
    ],
  };
  const cards=story[placeId]||[];let sequence=[];if(placeId==='nanhu')sequence=Array.from({length:4},()=>Math.floor(random()*3));
  if(placeId==='culture'){const pool=[0,1,2];for(const card of cards)card[2]=pool.splice(Math.floor(random()*pool.length),1)[0]}
  if(placeId==='century'){for(let i=0;i<cards.length;i++)if(i===2||i===4)cards[i][2]=Math.floor(random()*3)}
  let index=0,selection=1,score=0,phase=placeId==='nanhu'?'preview':'choose',phaseTime=0,feedback='',finished=false,correct=0;
  const rounds=placeId==='nanhu'?sequence.length:cards.length;
  function select(action){if(action==='left')selection=0;else if(action==='center')selection=1;else if(action==='right')selection=2}
  function submit(){if(placeId==='nanhu'){if(selection===sequence[index]){score+=25;correct++;feedback='记对了！冰晶连成一串';api.hit?.()}else{feedback=`这枚是 ${symbolSet[sequence[index]]}，再记住下一个`;api.miss?.()}}else if(selection===cards[index][2]){score+=Math.round(100/rounds);correct++;feedback='线索接上了！';api.hit?.()}else{feedback=`再观察一下：${cards[index][0]}`;api.miss?.()}phase='feedback';phaseTime=0}
  function next(){index++;selection=1;if(index>=rounds){finished=true;const won=correct>=Math.ceil(rounds*.6);api.finish(won,{score,unit:'分',detail:`答对 ${correct} / ${rounds} 项 · ${placeId==='palace'?'认识历史线索，不把沉重历史娱乐化。':'城市彩蛋挑战完成'}`,metrics:{correct,rounds}});return}phase=placeId==='nanhu'&&index===0?'preview':'choose';phaseTime=0}
  function onAction(action){if(finished)return;if(phase==='preview')return;if(phase==='choose'){if(['left','center','right'].includes(action)){select(action);return}if(action==='primary')submit()}}
  function update(dt){if(finished)return;phaseTime+=dt;if(phase==='preview'&&phaseTime>=sequence.length*.72+1){phase='choose';phaseTime=0}else if(phase==='feedback'&&phaseTime>.58)next()}
  function draw(ctx,w,h){bgScene(ctx,w,h,{skyTop:'#BFE6FF',skyMid:'#EAF6FF',skyBottom:'#F8FFFF',venueId:placeId});const cx=w*.5;
    const prompt=placeId==='nanhu'?(phase==='preview'?'记住冰晶出现的顺序':`回忆第 ${index+1} 枚冰晶`):cards[Math.min(index,rounds-1)]?.[0]||'彩蛋完成';
    text(ctx,placeId==='palace'?'历史线索 · 阅读与理解':placeId==='film'?'剪辑台 · 建立场景 / 动作 / 反应':placeId==='mountainmall'?'室内山城 · 规划不回头路线':placeId==='nanhu'?'南湖冰晶 · 顺序记忆':placeId==='culture'?'城市观察 · 找到剪影差异':'导演快反 · 镜头 / 音效 / 特效',cx,h*.2,13,'#68859A',800);
    text(ctx,prompt,cx,h*.32,18,CANDY.ink,900);
    if(placeId==='nanhu'&&phase==='preview'){const shown=Math.min(sequence.length,Math.floor(phaseTime/.72)+1);sequence.slice(0,shown).forEach((value,i)=>text(ctx,symbolSet[value],cx+(i-(shown-1)/2)*54,h*.52,30,['#4E9DCE','#64BFA5','#9B83D1'][value],900))}
    else {const options=placeId==='nanhu'?symbolSet:cards[Math.min(index,rounds-1)]?.[1]||['左侧','中间','右侧'];for(let i=0;i<3;i++){const x=cx+(i-1)*Math.min(170,w*.32),y=h*.53;ctx.save();ctx.fillStyle=i===selection?'#DDF4F4':'rgba(255,255,255,.92)';ctx.strokeStyle=i===selection?'#58AAB6':'#D0E5EC';ctx.lineWidth=i===selection?3:1;ctx.beginPath();ctx.roundRect(x-68,y-32,136,64,15);ctx.fill();ctx.stroke();ctx.restore();text(ctx,options[i],x,y,13,CANDY.ink,800)}}
    if(phase==='feedback')text(ctx,feedback,cx,h*.72,15,feedback.includes('记对')||feedback.includes('接上')?'#26866D':'#BA634B',900);
    playerBall(ctx,cx,h*.9,16,CANDY.blue,api,{t:phaseTime,moving:false});scoreHeader(ctx,w,`线索 ${Math.min(index+1,rounds)} / ${rounds}`,`${score} 分`,CANDY.blue);
  }
  return {onAction,update,draw,getState:()=>({score,correct,rounds,index,phase})};
}

export const ENGINES = {
  rhythm: rhythmEngine,
  aim: aimEngine,
  dodge: dodgeEngine,
  jump: jumpEngine,
  endurance: enduranceEngine,
  goalie: goalieEngine,
  shootout: shootoutEngine,
  attraction: attractionEngine,
};
