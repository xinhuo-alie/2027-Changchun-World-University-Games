import { ENGINES } from '/minigame-engines.js';
import { drawCharacter } from '/avatar-parts.js';

/**
 * 小游戏外壳：叠加层、按钮与键盘输入、主循环。
 *
 * 具体玩法在 minigame-engines.js 里，这里只负责：
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
  const intro = document.createElement('div');
  intro.className = 'mg-intro';
  intro.innerHTML = '<span class="mg-intro-icon"></span><strong></strong><p></p><button type="button" class="primary">开始挑战 →</button>';
  root.querySelector('.mg-panel').appendChild(intro);
  let countdownTimer = null;

  const goals = {
    rhythm: '左右交替，保持连击并抢先冲线。速度条越满，跑得越快。',
    aim: '三次机会！先锁力度，再锁方向，尽量把冰壶或球送进靶心。',
    dodge: '提前看准旗门缺口，左右变道；连续穿门加分，撞到岩石连击归零。',
    jump: '障碍靠近时点击起跳；成功跨过 3 个障碍，就能赢得纪念章。',
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
  function setupControls(kind) {
    const twoButton = kind === 'rhythm' || kind === 'dodge';
    els.left.hidden = !twoButton;
    els.right.hidden = !twoButton;
    els.primary.hidden = twoButton;

    if (kind === 'rhythm') {
      els.hint.textContent = '左右交替点击加速（键盘 A / D）';
      els.left.textContent = '← 左腿';
      els.right.textContent = '右腿 →';
    } else if (kind === 'dodge') {
      els.hint.textContent = '左右变道躲岩石、穿过旗门（键盘 ← →）';
      els.left.textContent = '← 变道';
      els.right.textContent = '变道 →';
    } else if (kind === 'jump') {
      els.hint.textContent = '点击起跳，跳过所有障碍（键盘空格）';
      els.primary.textContent = '起跳';
    } else {
      els.hint.textContent = '先锁定力度，再锁定方向（键盘空格）';
      els.primary.textContent = '锁定';
    }
  }

  function start(venue) {
    roundId += 1;
    clearTimeout(countdownTimer);
    cancelAnimationFrame(raf);
    engine = null;
    current = venue;
    const cfg = venue.game;
    if (!cfg) return;
    els.title.textContent = cfg.title;
    els.sub.textContent = cfg.subtitle;
    els.result.hidden = true;
    els.controls.hidden = false;
    root.hidden = false;
    root.classList.add('open');
    setupControls(cfg.engine);
    intro.querySelector('.mg-intro-icon').textContent = cfg.icon || '❄';
    intro.querySelector('strong').textContent = cfg.title;
    intro.querySelector('p').textContent = goals[cfg.engine] || cfg.subtitle;
    intro.hidden = false;
    intro.querySelector('button').disabled = false;
    els.controls.hidden = true;

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
      avatarFigure: avatar ? (c, x, y, r) => drawCharacter(c, avatar,
        { x: x - r * 1.25, y: y - r * 2.1, w: r * 2.5, h: r * 3.2 },
        { t: 0, moving: false, shadow: false }) : null,
      finish: (won, result) => {
        if (thisRound !== roundId || root.hidden) return;
        if (engine) engine.done = true;
        cancelAnimationFrame(raf);
        beep(won ? 880 : 320, 0.18);
        els.controls.hidden = true;
        els.result.hidden = false;
        els.resultText.innerHTML =
          `${won ? '🎉 完成' : '💪 再试一次'}<br>` +
          `<span class="mg-score">${result.score} ${result.unit}</span>` +
          `<span class="mg-detail">${result.detail}</span>`;
        if (options.onFinish) options.onFinish(won, result, current);
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
  }

  els.controls.addEventListener('click', (event) => {
    const act = event.target && event.target.dataset ? event.target.dataset.act : null;
    if (act && engine) engine.onAction(act);
  });

  const keyMap = {
    a: 'left',
    arrowleft: 'left',
    d: 'right',
    arrowright: 'right',
    ' ': 'primary',
    enter: 'primary',
  };
  window.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    const act = keyMap[event.key.toLowerCase()];
    if (act) {
      event.preventDefault();
      if (engine) engine.onAction(act);
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
