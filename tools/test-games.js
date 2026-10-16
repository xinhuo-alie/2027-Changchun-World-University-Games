import assert from 'node:assert/strict';
import { rhythmEngine, jumpEngine } from '../web/minigame-engines.js';

function simulateRhythm(actions) {
  let outcome = null;
  const game = rhythmEngine(null, { duration: 10, target: 500 }, {
    hit() {}, miss() {}, finish(won, result) { outcome = { won, result }; },
  });
  for (let tick = 0; tick < 600 && !outcome; tick += 1) {
    if (tick % 15 === 0) game.onAction(actions(tick));
    game.update(1 / 60);
  }
  return outcome;
}

const fast = simulateRhythm((tick) => tick % 30 === 0 ? 'left' : 'right');
const stalled = simulateRhythm(() => 'left');
assert.equal(fast?.won, true, 'alternating taps should be able to win the race');
assert.match(fast.result.detail, /最佳连击/);
assert.equal(stalled?.won, false, 'repeating one side should break the combo');

let jumpOutcome = null;
const oldRandom = Math.random;
Math.random = () => 0.5;
try {
  const game = jumpEngine({ getBoundingClientRect: () => ({ width: 420 }) }, { duration: 10 }, {
    hit() {}, miss() {}, finish(won, result) { jumpOutcome = { won, result }; },
  });
  for (let tick = 0; tick < 600 && !jumpOutcome; tick += 1) {
    const time = tick / 60;
    if ([2.05, 3.23, 4.4, 5.58, 6.75, 7.93].some((t) => Math.abs(time - t) < 1 / 120)) {
      game.onAction('primary');
    }
    game.update(1 / 60);
  }
} finally {
  Math.random = oldRandom;
}
assert.equal(jumpOutcome?.won, true, 'three correctly timed jumps should be able to win');
console.log('小游戏节奏与跳跃胜负测试通过');
