import assert from 'node:assert/strict';
import { rhythmEngine, dodgeEngine, jumpEngine, enduranceEngine, aimEngine } from '../web/minigame-redesign.js';

function simulate(factory, params, drive, duration = 24) {
  let outcome = null;
  const game = factory(null, params, {
    hit() {}, miss() {}, finish(won, result) { outcome = { won, result }; },
  });
  for (let tick = 0; tick < duration * 60 && !outcome; tick += 1) {
    const time = tick / 60;
    for (const action of drive(time, tick)) game.onAction(action);
    game.update(1 / 60);
  }
  return { game, outcome };
}

const rhythm = simulate(rhythmEngine, { duration: 12, target: 500, rival: .3, period: .6 },
  (time) => Math.abs((time % .6)) < 1 / 120 ? [Math.floor(time / .6) % 2 ? 'right' : 'left'] : []);
assert.equal(rhythm.outcome?.won, true, 'well-timed alternating skating should beat a slower rival');
assert.match(rhythm.outcome.result.detail, /完美节拍/);

const repeatedFoot = simulate(rhythmEngine, { duration: 5, target: 500, rival: .68, period: .6 },
  (time) => Math.abs(time % .6) < 1 / 120 ? ['left'] : []);
assert.ok(repeatedFoot.outcome, 'the rhythm race should finish');
assert.equal(repeatedFoot.outcome.won, false, 'repeating one foot should fail to build race speed');

const curling = simulate(aimEngine, { mode: 'curling', rounds: 2, goal: 99 },
  (time) => [0, .75, 2.5, 3.25].some((at) => Math.abs(time - at) < 1 / 120) ? ['primary'] : [], 8);
assert.ok(curling.outcome, 'curling should resolve each two-stage throw and end after its configured rounds');
assert.match(curling.outcome.result.detail, /2 壶/);

const hockey = simulate(aimEngine, { mode: 'hockey', shots: 2, goalieSpeed: 0 },
  (time) => [0, 1.2].some((at) => Math.abs(time - at) < 1 / 120) ? ['left', 'primary'] : [], 5);
assert.ok(hockey.outcome, 'hockey should complete the configured shootout');
assert.match(hockey.outcome.result.detail, /2 次射门/);

const slalom = simulate(dodgeEngine, { duration: 17, gates: 7, goal: 0 },
  (time) => Math.abs(time % 1.3) < 1 / 120 ? [time % 2 < 1 ? 'left' : 'right'] : []);
assert.ok(slalom.outcome, 'slalom should resolve its timed course');
assert.match(slalom.outcome.result.detail, /连穿最佳/);

const endurance = simulate(enduranceEngine, { duration: 20, target: 100000 },
  (time) => Math.abs(time % 2) < 1 / 120 ? [time % 4 < 2 ? 'left' : 'right'] : []);
assert.equal(endurance.outcome?.won, false, 'an unreachable endurance target should end on the timer');
assert.match(endurance.outcome.result.detail, /终点体力/);

let jumpOutcome = null;
const jump = jumpEngine(null, { jumps: 3, goal: 0 }, {
  hit() {}, miss() {}, finish(won, result) { jumpOutcome = { won, result }; },
});
const jumpStarts = [0, 4.88, 9.76];
for (let tick = 0; tick < 1700 && !jumpOutcome; tick += 1) {
  const time = tick / 60;
  for (const start of jumpStarts) {
    if ([1.9, 2.1, 4.2].some((offset) => Math.abs(time - start - offset) < 1 / 120)) jump.onAction('primary');
  }
  jump.update(1 / 60);
}
assert.equal(jumpOutcome?.won, true, 'three timed jumps with a tuck and landing should complete the aerial event');
assert.match(jumpOutcome.result.detail, /3 次飞跃/);

let feedbackJump;
feedbackJump = jumpEngine(null, { jumps: 2 }, { hit() {}, miss() {}, finish() {} });
for (let tick = 0; tick < 114; tick += 1) feedbackJump.update(1 / 60);
feedbackJump.onAction('primary');
assert.equal(feedbackJump.getState().phase, 'flight', 'takeoff should enter a distinct aerial phase');
const balanceBeforeTap = feedbackJump.getState().balance;
feedbackJump.onAction('left');
assert.ok(feedbackJump.getState().balance < balanceBeforeTap, 'a left tap must visibly correct balance left');
assert.ok(feedbackJump.getState().flight < 2.8, 'the aerial phase should remain open long enough to control and land');

console.log('六类运动小游戏的节奏、回合和结算测试通过');
