import { ENGINES } from '/minigame-redesign.js';
import { drawCharacter } from '/avatar-parts.js';
import { gameForVenue, GAME_MODES } from '/game-registry.js';
import { submitGameResult, saveLocalResult, fetchLeaderboard, fetchOverallLeaderboard, fetchGameHistory } from '/leaderboard-client.js';
import { drawGameAsset, preloadGameAssets } from '/game-assets.js';

function normalizeScore(venue,params,result){
  const raw=Number(result.score)||0;let scale=1000;
  if(venue.id==='olympic')return Math.round(Math.max(0,Math.min(1000,500+(Number(result.metrics?.goalsFor||0)-Number(result.metrics?.goalsAgainst||0))*100)));
  if(params.engine==='rhythm')scale=params.target||500;
  else if(params.engine==='endurance')scale=params.target||1180;
  else if(params.engine==='jump')scale=params.goal||12;
  else if(params.engine==='dodge')scale=params.goal||15;
  else if(params.engine==='aim'&&params.gameMode==='curling')scale=(params.rounds||3)*5;
  else if(params.engine==='aim')scale=params.shots||5;
  return Math.round(Math.max(0,Math.min(1000,raw/Math.max(1,scale)*1000)));
}

/**
 * 小游戏外壳：叠加层、按钮与键盘输入、主循环。
 *
 * 具体玩法在 minigame-redesign.js 里，这里只负责：
 *   · 按场馆配置挑引擎、配按钮文案
 *   · 驱动 update/draw
 *   · 结算界面
 *   · 音效
 */

/**
 * @param {{avatar?: object, onStart?: (venue: object) => void, onStop?: () => void,
 *          onFinish?: (won: boolean, result: object, venue: object) => void}} options
 *        avatar  形象配置：传进来之后，游戏里跑的球就是用户自己的脸
 *        onFinish 结算回调：场馆页用它盖章计进度；不传就当纯独立小游戏
 */
export function createMinigameHost(options = {}) {
  const root = document.getElementById('mg');
  if (!root) return null;

  const els = {
    title: document.getElementById('mgTitle'),
    sub: document.getElementById('mgSub'),
    canvas: document.getElementById('mgCanvas'),
    hint: document.getElementById('mgHint'),
    controls: document.getElementById('mgControls'),
    result: document.getElementById('mgResult'),
    resultText: document.getElementById('mgResultText'),
    reward: document.getElementById('mgReward'),
    leaderboard: document.getElementById('mgLeaderboard'),
    close: document.getElementById('mgClose'),
    again: document.getElementById('mgAgain'),
    exit: document.getElementById('mgExit'),
    left: root.querySelector('[data-act="left"]'),
    center: root.querySelector('[data-act="center"]'),
    right: root.querySelector('[data-act="right"]'),
    primary: root.querySelector('[data-act="primary"]'),
    options: document.getElementById('mgStage6Options'), mode: document.getElementById('mgMode'),
    difficulty: document.getElementById('mgDifficulty'), difficultyWrap: document.getElementById('mgDifficultyWrap'),
    recordHint: document.getElementById('mgRecordHint'),
  };

  const ctx = els.canvas.getContext('2d');
  let engine = null;
  let raf = 0;
  let last = 0;
  let current = null;
  let size = { w: 320, h: 220 };
  let audio = null;
  let roundId = 0;
  let lastOpener = null;
  const intro = document.createElement('div');
  intro.className = 'mg-intro';
  intro.innerHTML = '<span class="mg-intro-icon"></span><strong></strong><p></p><button type="button" class="primary">开始挑战 →</button>';
  root.querySelector('.mg-panel').appendChild(intro);
  intro.insertBefore(els.options, intro.querySelector('button'));
  let countdownTimer = null;
  let mode = 'practice';
  let localTurn = 0;
  let localScores = [];
  let roundStartedAt = 0;
  let gameSeed = 0;
  let paused = false;
  let forceTimer = null;
  let onlineSocket = null;
  let onlineState = null;
  let onlineSlot = 0;
  let onlineAvatar = null;
  const onlineVisualDistance = [0,0];
  let onlineRaf = 0;
  const onlineForm = document.createElement('div');
  onlineForm.className = 'mg-online-room';
  onlineForm.hidden = true;
  onlineForm.innerHTML = '<label>昵称<input data-online-name maxlength="12" value="冰雪选手" autocomplete="nickname"></label><label>房间码<input data-online-code maxlength="6" placeholder="对方提供的 6 位码"></label><div><button type="button" data-online-create>创建房间</button><button type="button" data-online-join>加入房间</button></div><p data-online-status role="status">创建房间后把房间码发给同伴。</p>';
  intro.insertBefore(onlineForm, intro.querySelector('button'));
  const onlineName=onlineForm.querySelector('[data-online-name]');
  const onlineCode=onlineForm.querySelector('[data-online-code]');
  const onlineStatus=onlineForm.querySelector('[data-online-status]');
  onlineForm.querySelector('[data-online-create]').onclick=()=>createOnlineRoom();
  onlineForm.querySelector('[data-online-join]').onclick=()=>joinOnlineRoom();

  const goals = {
    rhythm: '跟着冰面节拍左右交替踩拍。踩准拍点会更快，连着完美节拍就能追上对手。',
    curling: '先选力度，再选路线。撞开对手的壶，或把自己的壶送到营心附近。',
    hockey: '左右移动瞄准点，观察守门员的方向，在他移动到另一侧时射门。',
    dodge: '左右切换雪道穿过旗门，躲开雪堆；攒够能量后点冲刺。',
    jump: '沿助滑道加速，在黄色起跳区按起跳；腾空后按一次收板，再轻点左右让平衡标记回到中间，看到落地提示后按落地。每次点按只修正一点，连续乱按会失衡。',
    endurance: '上坡省体力，下坡顺势恢复。用左右调整滑行强度，冲刺留给关键路段。',
  };

  function beep(freq = 660, dur = 0.05, vol = 0.035) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    } catch {
      /* 没有音频环境就算了 */
    }
  }

  async function createOnlineRoom(){
    try{const response=await fetch('/api/online-race/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:onlineName.value})});const data=await response.json();if(!response.ok)throw new Error(data.error||'创建房间失败');onlineCode.value=data.roomCode;localStorage.setItem('cc-online-race',JSON.stringify(data));connectOnlineRoom(data);onlineStatus.textContent=`房间码 ${data.roomCode} 已创建，把房间码发给同伴。`;}catch(error){onlineStatus.textContent=error.message;}
  }
  async function joinOnlineRoom(){
    const code=onlineCode.value.trim().toUpperCase();if(!code){onlineStatus.textContent='先输入对方的房间码。';return;}
    try{let saved={};try{saved=JSON.parse(localStorage.getItem('cc-online-race')||'{}')}catch{}const token=saved.roomCode===code?saved.playerToken:'';const response=await fetch('/api/online-race/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'join',roomCode:code,name:onlineName.value,playerToken:token})});const data=await response.json();if(!response.ok)throw new Error(data.error||'加入房间失败');localStorage.setItem('cc-online-race',JSON.stringify(data));connectOnlineRoom(data);onlineStatus.textContent=`已进入房间 ${data.roomCode}，等待两位选手就绪。`;}catch(error){onlineStatus.textContent=error.message;}
  }
  function connectOnlineRoom(room){
    onlineSocket?.close();onlineSlot=room.slot;onlineAvatar=options.getAvatar?options.getAvatar():options.avatar;onlineVisualDistance[0]=0;onlineVisualDistance[1]=0;const protocol=location.protocol==='https:'?'wss:':'ws:';onlineSocket=new WebSocket(`${protocol}//${location.host}/api/online-race/socket?room=${encodeURIComponent(room.roomCode)}&token=${encodeURIComponent(room.playerToken)}`);
    onlineSocket.onopen=()=>{onlineStatus.textContent=`已连接房间 ${room.roomCode}。两位选手都连接后，任一方点击“开始挑战”。`;};
    onlineSocket.onmessage=event=>{try{onlineState=JSON.parse(event.data);if(onlineState.type==='state'){if(onlineState.phase==='running'){size=resizeCanvas();intro.hidden=true;els.result.hidden=true;els.controls.hidden=false;last=performance.now();cancelAnimationFrame(onlineRaf);onlineRaf=requestAnimationFrame(drawOnlineRace);}else if(onlineState.phase==='finished'){cancelAnimationFrame(onlineRaf);els.controls.hidden=true;els.result.hidden=false;const mine=onlineState.players[room.slot];const heading=document.createElement('strong');heading.textContent=onlineState.winner==='平局'?'平局！':onlineState.winner===mine?.name?'你赢了！':'对手领先';const score=document.createElement('span');score.className='mg-score';score.textContent=`${mine?.score||0} 分`;const detail=document.createElement('span');detail.className='mg-detail';detail.textContent=`完美节拍 ${mine?.perfect||0} 次 · 获胜者：${onlineState.winner}`;els.resultText.replaceChildren(heading,document.createElement('br'),score,detail);els.reward.textContent=`房间 ${onlineState.roomCode} · 在线对战结果由服务端结算`; }else{onlineStatus.textContent=onlineState.players.length<2?'等待第二位选手加入…':'两位选手已就绪，点击“开始挑战”开始 20 秒比赛。';if(onlineState.players.length===2)intro.querySelector('.primary').textContent='开始 20 秒对战 →';}}
      }catch{}};
    onlineSocket.onclose=()=>{if(root.hidden)return;onlineStatus.textContent='连接中断。重新输入房间码并加入，可在 30 秒内恢复连接。';};
    onlineSocket.onerror=()=>{onlineStatus.textContent='无法连接联机服务，请确认两台设备访问同一个服务器地址。';};
  }
  function sendOnlineAction(action){if(onlineSocket?.readyState===WebSocket.OPEN&&onlineState?.phase==='running')onlineSocket.send(JSON.stringify({type:'action',action}));}
  function drawOnlineSkater(c,x,bottom,height){const width=height*.72;c.save();c.translate(x,bottom);c.fillStyle='rgba(42,83,112,.2)';c.beginPath();c.ellipse(0,2,width*.48,height*.055,0,0,Math.PI*2);c.fill();c.lineCap='round';c.lineJoin='round';c.strokeStyle='#fff';c.lineWidth=3;c.fillStyle='#ed7868';c.beginPath();c.roundRect(-width*.19,-height*.69,width*.38,height*.43,width*.12);c.fill();c.stroke();c.fillStyle='#f4d6bd';c.beginPath();c.arc(0,-height*.79,height*.13,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#28516a';c.beginPath();c.arc(0,-height*.83,height*.145,Math.PI,Math.PI*2);c.fill();c.strokeStyle='#324e67';c.lineWidth=4;c.beginPath();c.moveTo(-width*.07,-height*.28);c.lineTo(-width*.18,-height*.08);c.moveTo(width*.07,-height*.28);c.lineTo(width*.18,-height*.08);c.stroke();c.strokeStyle='#5d8295';c.lineWidth=2;c.beginPath();c.moveTo(-width*.32,-height*.035);c.lineTo(width*.32,-height*.035);c.moveTo(-width*.28,0);c.lineTo(width*.28,0);c.stroke();c.restore();}
  function drawOnlineRace(now){
    if(root.hidden||!onlineState||onlineState.phase!=='running')return;const dt=Math.min((now-last)/1000,.05);last=now;const w=size.w,h=size.h;ctx.clearRect(0,0,w,h);const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#bde8fa');grad.addColorStop(1,'#f8fdff');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#fff';ctx.font='800 18px system-ui';ctx.textAlign='center';ctx.fillText(`弯道超越战 · ${Math.ceil((onlineState.remainingMs||0)/1000)} 秒`,w/2,31);
    const elapsed=20-(onlineState.remainingMs||0)/1000;const beat=(elapsed%0.76)/0.76;ctx.beginPath();ctx.arc(w/2,h*.34,22+beat*12,0,Math.PI*2);ctx.strokeStyle=beat<.28||beat>.72?'#f4c85b':'#ffffffb0';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#355c76';ctx.font='700 11px system-ui';ctx.fillText(beat<.28||beat>.72?'现在踩拍！':'左右交替踩拍',w/2,h*.34);
    for(const player of onlineState.players){const y=h*(player.slot===0 ? .53 : .82),left=28,right=w-28;onlineVisualDistance[player.slot]+=(player.distance-onlineVisualDistance[player.slot])*Math.min(1,dt*12);const x=left+onlineVisualDistance[player.slot]*(right-left);ctx.strokeStyle='#ffffffc9';ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.strokeStyle='#82b9d6';ctx.lineWidth=2;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#34536a';ctx.font='700 12px system-ui';ctx.textAlign='left';ctx.fillText(player.name+(player.slot===onlineSlot?'（你）':''),left,y-19);if(player.slot===onlineSlot&&onlineAvatar){const height=Math.max(84,Math.min(112,h*.26));drawCharacter(ctx,onlineAvatar,{x:x-height*.39,y:y-height*.86,w:height*.78,h:height},{t:now/1000,moving:true,ski:true,shadow:false});}else if(!drawGameAsset(ctx,'speed-skater-red',x-31,y-85,62,82))drawOnlineSkater(ctx,x,y+1,82);ctx.fillStyle='#2a7792';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}
    ctx.textAlign='center';ctx.fillStyle='#33526e';ctx.font='700 12px system-ui';ctx.fillText('← / A 左脚　　右脚 D / →　　空格短冲刺',w/2,h-15);onlineRaf=requestAnimationFrame(drawOnlineRace);
  }

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.canvas.width = Math.max(1, rect.width * dpr);
    els.canvas.height = Math.max(1, rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: rect.width, h: rect.height };
  }

  function tick(now) {
    if (!engine || paused) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    engine.update(dt);
    if(current?.id==='olympic')els.primary.textContent=engine.getRole?.()==='defend'?'扑中 S':'射门';
    engine.draw(ctx, size.w, size.h);
    if (!engine.done) raf = requestAnimationFrame(tick);
  }

  /** 按引擎类型配置界面文案与可见按钮 */
  function setupControls(kind, params = {}) {
    const hasSides = ['rhythm', 'dodge', 'jump', 'endurance', 'goalie', 'shootout', 'attraction'].includes(kind) || (kind === 'aim' && params.mode === 'hockey');
    const hasPrimary = kind !== 'rhythm' || ['speed','wuhuan'].includes(params.venueId);
    els.left.hidden = !hasSides;
    els.right.hidden = !hasSides;
    els.primary.hidden = !hasPrimary;
    els.center.hidden = !(kind==='aim'&&params.mode==='hockey')&&kind!=='attraction';

    if (kind === 'rhythm') {
      els.hint.textContent = params.venueId === 'speed' ? '左右交替维持步频；每段冲刺窗按空格冲刺，体力不足会拖慢后程。' : '看提示交替踩：左脚 A / ←，右脚 D / →；弯道按空格选内线超越。';
      els.left.textContent = '左脚踩拍';
      els.right.textContent = '右脚踩拍';
    } else if (kind === 'dodge') {
      els.hint.textContent = '左右切换雪道，点冲刺消耗能量（键盘 ← → / 空格）';
      els.left.textContent = '← 左刃';
      els.right.textContent = '右刃 →';
      els.primary.textContent = '短冲刺';
    } else if (kind === 'jump') {
      els.hint.textContent = '黄色区按起跳 → 空中按一次收板 → 轻点左右修正平衡 → 落地窗口按落地。每次点按修正一点；按住方向不累计。';
      els.left.textContent = '重心 ←';
      els.right.textContent = '重心 →';
      els.primary.textContent = '起跳 / 收板 / 落地';
    } else if (kind === 'endurance') {
      els.hint.textContent = '左键降强度恢复体力，右键加力，空格短冲刺';
      els.left.textContent = '轻松滑';
      els.right.textContent = '强力蹬';
      els.primary.textContent = '蓄力冲刺';
    } else if (kind === 'shootout') {
      els.hint.textContent = '进攻时左右瞄准并射门；防守时观察提示，按 ← / S / → 扑救。';
      els.left.textContent='← 左';els.right.textContent='右 →';els.primary.textContent='射门 / 扑中';
    } else if(kind==='attraction') {
      els.hint.textContent='用左、中、右选择卡片，再按确认；键盘 ← / S / → 选择，回车确认。';
      els.left.textContent='← 左项';els.center.textContent='中间项';els.right.textContent='右项';els.primary.textContent='确认选择';
    } else if (kind === 'aim' && params.mode === 'hockey') {
      els.hint.textContent = '读守门员移动，左右调整射门方向；整场可按一次假动作骗开门将。';
      els.center.textContent='假动作';
      els.left.textContent = '← 瞄左';
      els.right.textContent = '瞄右 →';
      els.primary.textContent = '射门';
    } else if (kind === 'goalie') {
      els.hint.textContent = '看清冰球轨迹，再按 A / S / D 或 ← / 空格 / → 扑左、中、右';
      els.left.textContent = '← 扑左';
      els.right.textContent = '扑右 →';
      els.primary.textContent = '扑中 S';
    } else {
      els.hint.textContent = '点一次锁定力度，再点一次选择路线；观察冰壶间的空位';
      els.primary.textContent = '锁定';
    }
  }

  function start(venue) {
    roundId += 1;
    clearTimeout(countdownTimer);
    clearTimeout(forceTimer);forceTimer=null;
    cancelAnimationFrame(raf);
    engine = null;
    current = venue;
    if (onlineSocket) { onlineSocket.close(); onlineSocket = null; }
    cancelAnimationFrame(onlineRaf); onlineState = null;
    if (root.hidden) lastOpener = document.activeElement;
    const cfg = venue.game;
    const registered = gameForVenue(venue);
    mode = registered ? els.mode.value : 'practice';
    const onlineOption=els.mode.querySelector('option[value="online-2p"]');
    onlineOption.disabled=venue.id!=='wuhuan';
    if(venue.id!=='wuhuan'&&mode==='online-2p'){els.mode.value='practice';mode='practice';}
    localTurn = 0; localScores = [];
    paused = false;
    gameSeed = Math.floor(Math.random() * 2147483647);
    els.options.hidden = !registered;
    onlineForm.hidden=mode!=='online-2p';
    intro.classList.toggle('online-mode',mode==='online-2p');
    if(mode==='online-2p'){try{const saved=JSON.parse(localStorage.getItem('cc-online-race')||'{}');if(saved.roomCode&&!onlineCode.value)onlineCode.value=saved.roomCode;}catch{}}
    els.difficultyWrap.hidden = mode !== 'practice';
    els.recordHint.textContent = mode === 'ranked-solo' ? '排名赛固定标准规则；使用标准场馆赛道' : mode === 'local-2p' ? '同一设备轮流操作，两位选手依次完成挑战' : mode==='online-2p'?'两台设备需访问同一个运行中的服务地址。每局 20 秒。':'练习成绩保存在本机，不进入公开榜';
    if (!cfg) return;
    els.title.textContent = registered?.title || cfg.title;
    els.sub.textContent = cfg.subtitle;
    els.result.hidden = true;
    els.controls.hidden = false;
    root.hidden = false;
    root.classList.add('open');
    setupControls(venue.id==='olympic'?'shootout':cfg.engine, { ...(cfg.params || {}), venueId: venue.id });
    intro.querySelector('.mg-intro-icon').textContent = cfg.icon || '❄';
    intro.querySelector('strong').textContent = registered?.title || cfg.title;
    const goalKey = cfg.engine === 'aim' && cfg.params?.mode === 'hockey' ? 'hockey'
      : cfg.engine === 'aim' ? 'curling' : cfg.engine;
    intro.querySelector('p').textContent = goals[goalKey] || cfg.subtitle;
    intro.hidden = false;
    const startButton = intro.querySelector('.primary');
    startButton.disabled = false;
    startButton.textContent=mode==='online-2p'?'创建联机房间 →':'开始挑战 →';
    els.controls.hidden = true;
    startButton.focus();
    els.reward.textContent = '';
    els.leaderboard.hidden = true;

    // 先把玩法交代清楚；倒数结束后才开始计时和生成障碍。
    startButton.onclick = () => {
      if(mode==='online-2p'){
        if(onlineSocket?.readyState===WebSocket.OPEN){onlineSocket.send(JSON.stringify({type:'start'}));onlineStatus.textContent='正在请求开赛；两位选手都已连接时立即开始。';}
        else if(onlineCode.value.trim())joinOnlineRoom();else createOnlineRoom();
        return;
      }
      if (options.onStart) options.onStart(venue);
      const button = startButton;
      button.disabled = true;
      let count = 3;
      const step = () => {
        if (root.hidden) return;
        if (count > 0) {
          intro.querySelector('strong').textContent = String(count--);
          countdownTimer = window.setTimeout(step, 620);
        } else {
          intro.hidden = true;
          button.disabled = false;
          options.onRoundStart?.(venue);
          beginRound(venue);
        }
      };
      step();
    };
  }

  function beginRound(venue) {
    const thisRound = ++roundId;
    const cfg = venue.game;
    const registered = gameForVenue(venue);
    mode = registered ? els.mode.value : 'practice';
    const factory = ENGINES[cfg.engine] || ENGINES.rhythm;
    els.controls.hidden = false;

    // 每局开始时取一次形象：用户可能刚换过脸或换过帽子
    const avatar = options.getAvatar ? options.getAvatar() : options.avatar;
    size = resizeCanvas();
    let gameParams = { ...(cfg.params || {}), venueId: venue.id, seed: gameSeed, variant: registered?.variant, gameMode: cfg.params?.mode, mode, difficulty: mode === 'ranked-solo' ? 'standard' : els.difficulty.value };
    if (registered && ['rhythm','dodge','endurance'].includes(cfg.engine)) gameParams.duration=registered.durationSeconds;
    if (venue.id==='jingyue') gameParams.target=Math.round(1400*(gameParams.difficulty==='easy' ? .8 : gameParams.difficulty==='challenge' ? 1.2 : 1));
    if (venue.id==='lianhua') gameParams.approachSeconds=3.2;
    if(venue.id==='olympic')gameParams.rounds=5;
    if (mode === 'practice' && gameParams.difficulty === 'easy') gameParams = { ...gameParams, goal: Math.round((gameParams.goal || 12) * .72), rival: (gameParams.rival || .68) * .86, goalieSpeed: (gameParams.goalieSpeed || 1.1) * .82 };
    if (mode === 'practice' && gameParams.difficulty === 'challenge') gameParams = { ...gameParams, goal: Math.round((gameParams.goal || 12) * 1.2), rival: (gameParams.rival || .68) * 1.12, goalieSpeed: (gameParams.goalieSpeed || 1.1) * 1.2 };
    void preloadGameAssets(venue.id);
    roundStartedAt = performance.now();
    const activeFactory=venue.id==='olympic' ? ENGINES.shootout : factory;
    engine = activeFactory(els.canvas, gameParams, {
      hit: () => beep(780, 0.03),
      miss: () => beep(220, 0.09, 0.03),
      drawSprite: (ctx,key,x,y,w,h) => drawGameAsset(ctx,key,x,y,w,h),
      // 小游戏也直接画完整角色，避免人物在关卡中退化为头像球。
      avatarFigure: avatar ? (c, x, y, r, pose = {}) => {
        const scale = Number.isFinite(pose.avatarScale) ? pose.avatarScale : 1;
        const height = Math.max(84, Math.min(112, size.h * 0.26)) * scale;
        const width = height * 0.78;
        // y 是旧球形角色的中心；脚底仍落在原赛道附近，向上扩展完整人物。
        drawCharacter(c, avatar,
          { x: x - width / 2, y: y - height * 0.86, w: width, h: height },
          { t: pose.t || 0, moving: Boolean(pose.moving), ski: Boolean(pose.ski), cheer: pose.cheer || 0, shadow: false });
      } : null,
      finish: (won, result) => gameFinish(won, result),
    });
    let gameFinish = (won, result) => {
        if (thisRound !== roundId || root.hidden) return;
        clearTimeout(forceTimer);forceTimer=null;
        if (engine) engine.done = true;
        cancelAnimationFrame(raf);
        beep(won ? 880 : 320, 0.18);
        els.controls.hidden = true;
        els.result.hidden = false;
        if (mode === 'local-2p' && localTurn === 0) {
          localScores[0] = { won, ...result };
          localTurn = 1;
          els.resultText.textContent = '第一位选手完成！请把设备交给第二位选手。';
          els.reward.textContent = `选手 1：${result.score} ${result.unit}。两位选手将按同一套规则比较成绩。`;
          els.again.textContent = '第二位选手开始';
          els.again.focus();
          return;
        }
        if (mode === 'local-2p') {
          localScores[1] = { won, ...result };
          const first = localScores[0];
          const winner = result.score === first.score ? '平局！' : result.score > first.score ? '选手 2 获胜！' : '选手 1 获胜！';
          result = { ...result, score: Math.max(result.score, first.score), unit: result.unit, detail: `${winner} 选手 1：${first.score} · 选手 2：${localScores[1].score}` };
          won = localScores.some(item => item.won);
        }
        let rankSync=null;
        const durationMs = Math.max(1000, Math.round(performance.now() - roundStartedAt));
        if (registered) {
          const resultId = crypto.randomUUID();
          const normalizedScore=normalizeScore(venue,{...gameParams,engine:cfg.engine},result);
          const payload = { resultId, gameId: registered.gameId, venueId: venue.id, mode, score: normalizedScore, durationMs, seed: gameSeed, displayName: avatar?.name || undefined, metrics: { ...(result.metrics||{}), won: Boolean(won) } };
          if (mode === 'ranked-solo') {
            rankSync=submitGameResult(payload);
            result.saveMessage='成绩已在本机保存，正在同步排行榜';
          } else {
            saveLocalResult({ ...payload, playerId: 'local-player-1', displayName: '本机选手', achievedAt: new Date().toISOString() });
            result.saveMessage = '成绩已保存在本机';
          }
        }
        options.onFinish?.(won, result, current);
        const heading = document.createElement('strong');
        heading.textContent = won ? '挑战完成' : '再试一次';
        const score = document.createElement('span');
        score.className = 'mg-score';
        score.textContent = `${result.score} ${result.unit}`;
        const detail = document.createElement('span');
        detail.className = 'mg-detail';
        detail.textContent = result.detail || '';
        els.resultText.replaceChildren(heading, document.createElement('br'), score, detail);
        els.reward.textContent = result.rewardText || '';
        if (result.saveMessage) els.reward.textContent = [els.reward.textContent,result.saveMessage].filter(Boolean).join(' · ');
        els.again.focus();
        if(rankSync){
          rankSync.then(async saved=>{
            if(thisRound!==roundId||root.hidden)return;
            result.saveMessage=saved.ok?'已提交单项排行榜':saved.message;
            els.reward.textContent=[result.rewardText||'',result.saveMessage].filter(Boolean).join(' · ');
            els.leaderboard.replaceChildren();
            const title=document.createElement('strong');title.textContent='单项排名 · 最近成绩';els.leaderboard.append(title);
            if(saved.ok){
              const [board,overall]=await Promise.all([fetchLeaderboard(registered.gameId),fetchOverallLeaderboard()]);
              const history=await fetchGameHistory(registered.gameId);
              const list=document.createElement('ol');const rows=board.entries.slice(0,5);const own=board.entries.find(item=>item.isYou);if(own&&!rows.some(item=>item.isYou))rows.push(own);for(const item of rows){const li=document.createElement('li');li.textContent=`${item.rank}. ${item.displayName} · ${item.score} 分${item.isYou?'（你）':''}`;list.append(li)}
              const overallLabel=document.createElement('p');const overallYou=overall.entries.find(item=>item.isYou);overallLabel.textContent=overallYou?`十场馆总积分：${overallYou.score} / 1000 · 第 ${overallYou.rank} 名`:'十场馆总积分：完成更多场馆排名赛后生成';
              const recent=document.createElement('small');recent.textContent=`本机最近 ${history.slice(0,3).map(item=>`${item.score}分`).join('、')||'暂无'} · 排行榜仅共享同一运行服务器上的排名赛成绩`;
              els.leaderboard.append(list,overallLabel,recent);
            }else{const offline=document.createElement('small');offline.textContent=result.saveMessage;els.leaderboard.append(offline)}
            els.leaderboard.hidden=false;
          }).catch(()=>{});
        }
      };
    forceTimer=setTimeout(()=>{
      if(!engine||engine.done)return;
      if(['rhythm','dodge','endurance'].includes(cfg.engine))engine.update(.05);
      if(engine&&!engine.done){
        const state=engine.getState?.()||{};
        const score=Number(state.score??state.distance??state.goals??state.saves??state.goalsFor)||0;
        const unit=venue.id==='provhall'||venue.id==='olympic'?'球':venue.id==='jingyue'||venue.id==='speed'||venue.id==='wuhuan'?'米':venue.id==='goalie'?'次扑救':'分';
        gameFinish(false,{score,unit,detail:`20 秒结束 · 当前成绩 ${score} ${unit}`});
      }
    },20_000);
    engine.done = false;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    roundId += 1;
    clearTimeout(countdownTimer);
    clearTimeout(forceTimer);forceTimer=null;

    cancelAnimationFrame(onlineRaf);
    if(onlineSocket){onlineSocket.close();onlineSocket=null;}
    onlineState=null;
    engine = null;
    paused = false;
    root.hidden = true;
    root.classList.remove('open');
    if (options.onStop) options.onStop();
    if (lastOpener?.isConnected) lastOpener.focus();
  }

  const pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.className='mg-pause mg-btn';pauseButton.textContent='暂停';pauseButton.setAttribute('aria-pressed','false');els.controls.appendChild(pauseButton);
  pauseButton.addEventListener('click',()=>{if(!engine)return;paused=!paused;pauseButton.textContent=paused?'继续':'暂停';pauseButton.setAttribute('aria-pressed',String(paused));if(paused)cancelAnimationFrame(raf);else{last=performance.now();raf=requestAnimationFrame(tick)}});

  els.controls.addEventListener('click', (event) => {
    const rawAction = event.target && event.target.dataset ? event.target.dataset.act : null;
    if(rawAction&&mode==='online-2p'){sendOnlineAction(rawAction==='left'?'left':rawAction==='right'?'right':rawAction==='primary'?'boost':'center');return;}
    if (rawAction && engine) engine.onAction(rawAction === 'primary' && (current?.game?.engine === 'goalie' || (current?.id === 'olympic' && engine.getRole?.() === 'defend')) ? 'center' : rawAction);
  });

  const keyMap = {
    a: 'left',
    arrowleft: 'left',
    d: 'right',
    arrowright: 'right',
    s: 'center',
    p: 'pause',
    ' ': 'primary',
    enter: 'primary',
  };
  window.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    if (event.key === 'Tab') {
      const focusable = [...root.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hidden && element.getClientRects().length > 0);
      const first = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); lastFocusable?.focus(); }
      else if (!event.shiftKey && document.activeElement === lastFocusable) { event.preventDefault(); first?.focus(); }
      else if (!root.contains(document.activeElement)) { event.preventDefault(); first?.focus(); }
      return;
    }
    const act = keyMap[event.key.toLowerCase()];
    if (act === 'pause') { if(!root.hidden)pauseButton.click(); return; }
    if (act) {
      if (event.repeat && current?.game?.engine === 'jump' && ['left', 'right'].includes(act)) return;
      event.preventDefault();
      if(mode==='online-2p')sendOnlineAction(act==='primary'?'boost':act);else if (engine) engine.onAction(act === 'primary' && (current?.game?.engine === 'goalie' || (current?.id === 'olympic' && engine.getRole?.() === 'defend')) ? 'center' : act);
    }
    if (event.key === 'Escape') stop();
  });

  els.close.addEventListener('click', stop);
  els.exit.addEventListener('click', stop);
  els.again.addEventListener('click', () => {
    if (current && mode === 'local-2p' && localTurn === 1) { els.again.textContent='再来一次'; els.result.hidden=true; beginRound(current); }
    else if (current) start(current);
  });

  els.mode.addEventListener('change', () => {
    els.difficultyWrap.hidden = els.mode.value !== 'practice';
    onlineForm.hidden=els.mode.value!=='online-2p';
    const hint = {practice:'练习成绩保存在本机，不进入公开榜','ranked-solo':'排名赛固定标准规则；使用标准场馆赛道','local-2p':'同一设备轮流操作，两位选手依次完成挑战','online-2p':'两台设备访问同一服务地址，房间码联机，每局 20 秒'};
    els.recordHint.textContent = hint[els.mode.value];
  });
  window.addEventListener('resize', () => {
    if (!root.hidden) size = resizeCanvas();
  });

  return { start, stop, isOpen: () => !root.hidden };
}
