import { ENGINES } from '/minigame-redesign.js';
import { drawCharacter } from '/avatar-parts.js';

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
    close: document.getElementById('mgClose'),
    again: document.getElementById('mgAgain'),
    exit: document.getElementById('mgExit'),
    left: root.querySelector('[data-act="left"]'),
    right: root.querySelector('[data-act="right"]'),
    primary: root.querySelector('[data-act="primary"]'),
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
  let countdownTimer = null;

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

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.canvas.width = Math.max(1, rect.width * dpr);
    els.canvas.height = Math.max(1, rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: rect.width, h: rect.height };
  }

  function tick(now) {
    if (!engine) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    engine.update(dt);
    engine.draw(ctx, size.w, size.h);
    if (!engine.done) raf = requestAnimationFrame(tick);
  }

  /** 按引擎类型配置界面文案与可见按钮 */
  function setupControls(kind, params = {}) {
    const hasSides = ['rhythm', 'dodge', 'jump', 'endurance', 'goalie'].includes(kind) || (kind === 'aim' && params.mode === 'hockey');
    const hasPrimary = kind !== 'rhythm';
    els.left.hidden = !hasSides;
    els.right.hidden = !hasSides;
    els.primary.hidden = !hasPrimary;

    if (kind === 'rhythm') {
      els.hint.textContent = '看提示交替踩：左脚 A / ←，右脚 D / →；等金圈亮起再按。踩准会加速，踩错会掉速。';
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
    } else if (kind === 'aim' && params.mode === 'hockey') {
      els.hint.textContent = '左右调整射门方向，避开守门员再出手';
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
    cancelAnimationFrame(raf);
    engine = null;
    current = venue;
    if (root.hidden) lastOpener = document.activeElement;
    const cfg = venue.game;
    if (!cfg) return;
    els.title.textContent = cfg.title;
    els.sub.textContent = cfg.subtitle;
    els.result.hidden = true;
    els.controls.hidden = false;
    root.hidden = false;
    root.classList.add('open');
    setupControls(cfg.engine, cfg.params || {});
    intro.querySelector('.mg-intro-icon').textContent = cfg.icon || '❄';
    intro.querySelector('strong').textContent = cfg.title;
    const goalKey = cfg.engine === 'aim' && cfg.params?.mode === 'hockey' ? 'hockey'
      : cfg.engine === 'aim' ? 'curling' : cfg.engine;
    intro.querySelector('p').textContent = goals[goalKey] || cfg.subtitle;
    intro.hidden = false;
    intro.querySelector('button').disabled = false;
    els.controls.hidden = true;
    intro.querySelector('button').focus();
    els.reward.textContent = '';

    // 先把玩法交代清楚；倒数结束后才开始计时和生成障碍。
    intro.querySelector('button').onclick = () => {
      if (options.onStart) options.onStart(venue);
      const button = intro.querySelector('button');
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
          beginRound(venue);
        }
      };
      step();
    };
  }

  function beginRound(venue) {
    const thisRound = ++roundId;
    const cfg = venue.game;
    const factory = ENGINES[cfg.engine] || ENGINES.rhythm;
    els.controls.hidden = false;

    // 每局开始时取一次形象：用户可能刚换过脸或换过帽子
    const avatar = options.getAvatar ? options.getAvatar() : options.avatar;
    size = resizeCanvas();
    engine = factory(els.canvas, { ...(cfg.params || {}), venueId: venue.id }, {
      hit: () => beep(780, 0.03),
      miss: () => beep(220, 0.09, 0.03),
      // 小游戏也直接画完整角色，避免人物在关卡中退化为头像球。
      avatarFigure: avatar ? (c, x, y, r, pose = {}) => {
        const scale = Number.isFinite(pose.avatarScale) ? pose.avatarScale : 1;
        const height = Math.max(92, Math.min(132, size.h * 0.30)) * scale;
        const width = height * 0.78;
        // y 是旧球形角色的中心；脚底仍落在原赛道附近，向上扩展完整人物。
        drawCharacter(c, avatar,
          { x: x - width / 2, y: y - height * 0.86, w: width, h: height },
          { t: pose.t || 0, moving: Boolean(pose.moving), ski: Boolean(pose.ski), cheer: pose.cheer || 0, shadow: false });
      } : null,
      finish: (won, result) => {
        if (thisRound !== roundId || root.hidden) return;
        if (engine) engine.done = true;
        cancelAnimationFrame(raf);
        beep(won ? 880 : 320, 0.18);
        els.controls.hidden = true;
        els.result.hidden = false;
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
        els.again.focus();
      },
    });
    engine.done = false;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    roundId += 1;
    clearTimeout(countdownTimer);
    cancelAnimationFrame(raf);
    engine = null;
    root.hidden = true;
    root.classList.remove('open');
    if (options.onStop) options.onStop();
    if (lastOpener?.isConnected) lastOpener.focus();
  }

  els.controls.addEventListener('click', (event) => {
    const rawAction = event.target && event.target.dataset ? event.target.dataset.act : null;
    if (rawAction && engine) engine.onAction(rawAction === 'primary' && current?.game?.engine === 'goalie' ? 'center' : rawAction);
  });

  const keyMap = {
    a: 'left',
    arrowleft: 'left',
    d: 'right',
    arrowright: 'right',
    s: 'center',
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
    if (act) {
      if (event.repeat && current?.game?.engine === 'jump' && ['left', 'right'].includes(act)) return;
      event.preventDefault();
      if (engine) engine.onAction(act === 'primary' && current?.game?.engine === 'goalie' ? 'center' : act);
    }
    if (event.key === 'Escape') stop();
  });

  els.close.addEventListener('click', stop);
  els.exit.addEventListener('click', stop);
  els.again.addEventListener('click', () => {
    if (current) start(current);
  });
  window.addEventListener('resize', () => {
    if (!root.hidden) size = resizeCanvas();
  });

  return { start, stop, isOpen: () => !root.hidden };
}
