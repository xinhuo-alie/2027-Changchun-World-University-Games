import assert from 'node:assert/strict';
import { goalieEngine } from '../web/minigame-redesign.js';
import { createQuizSession, QUIZ_QUESTIONS } from '../web/quiz-questions.js';
import { listPlaces } from '../server/places.js';

function runGoalie(sequence, choose, duration = 12) {
  let outcome = null;
  let hits = 0;
  const game = goalieEngine(null, { sequence }, {
    hit() { hits += 1; }, miss() {}, finish(won, result) { outcome = { won, result }; },
  });
  for (let tick = 0; tick < duration * 60 && !outcome; tick += 1) {
    const time = tick / 60;
    for (let shot = 0; shot < sequence.length; shot += 1) {
      const actionAt = .84 + shot * 1.45;
      if (Math.abs(time - actionAt) < 1 / 120) {
        const action = choose(sequence[shot], shot);
        game.onAction(action);
        game.onAction('left'); // A second input in the same shot must not score twice.
      }
    }
    game.update(1 / 60);
  }
  return { outcome, hits };
}

const lanes = [0, 2, 1, 1, 0];
const perfect = runGoalie(lanes, (lane) => ['left', 'center', 'right'][lane]);
assert.equal(perfect.outcome?.won, true, 'five readable matching saves should beat the three-save target');
assert.equal(perfect.outcome.result.score, 5);
assert.equal(perfect.hits, 5, 'repeated input must not score twice within one shot');
assert.match(perfect.outcome.result.detail, /5 \/ 5 次扑出/);

const miss = runGoalie(lanes, (lane) => ['right', 'left', 'left'][lane]);
assert.equal(miss.outcome?.won, false, 'fewer than three saves should fail the reaction challenge');
assert.equal(miss.outcome.result.score, 0);

let timedOut = null;
const timeoutGame = goalieEngine(null, { sequence: [2] }, { hit() {}, miss() {}, finish(won, result) { timedOut = { won, result }; } });
for (let tick = 0; tick < 1300 && !timedOut; tick += 1) timeoutGame.update(1 / 60);
assert.equal(timedOut?.won, false, 'waiting through the save window should count as a miss');
assert.equal(timedOut.result.score, 0);

const placeIds = new Set(listPlaces().map((place) => place.id));
assert.ok(QUIZ_QUESTIONS.length >= 15, 'quiz bank should contain enough variety for replay');
assert.ok(new Set(QUIZ_QUESTIONS.map((question) => question.answer)).size >= 4, 'correct options must be spread across the answer positions');
for (const question of QUIZ_QUESTIONS) {
  assert.equal(question.options.length, 4);
  assert.ok(question.answer >= 0 && question.answer < question.options.length);
  assert.ok(question.explanation.length > 12);
  assert.ok(placeIds.has(question.sourceId), `quiz fact source ${question.sourceId} must match a current place record`);
  assert.match(question.sourceUrl, /^https:\/\//, `quiz answer must have its own source: ${question.question}`);
  assert.ok(question.sourceTitle.length > 3, `quiz answer must identify its source: ${question.question}`);
}
const quiz = createQuizSession(QUIZ_QUESTIONS, Math.random, QUIZ_QUESTIONS.length);
assert.equal(quiz.choose(-1), null, 'invalid answer indices must be ignored');
assert.ok(quiz.question.options.length === 4);
assert.equal(quiz.choose(quiz.question.answer).correct, true);
assert.equal(quiz.choose(quiz.question.answer), null, 'one question must accept only one answer');
let quizScore = 1;
for (let question = 1; question < quiz.state.total; question += 1) {
  quiz.next();
  quiz.choose(quiz.question.answer);
  quizScore += 1;
}
assert.equal(quiz.state.score, quizScore);
assert.equal(quiz.next(), false);
assert.equal(quiz.state.finished, true);
assert.equal(quiz.choose(0), null, 'finished rounds must reject further answers');
const randomizedQuiz = createQuizSession(QUIZ_QUESTIONS, Math.random);
assert.equal(randomizedQuiz.state.total, 5, 'each replay should stay a quick five-question round');
assert.ok(QUIZ_QUESTIONS.some((question) => question.answer !== 0), 'bank itself must not place every answer in A');
console.log('门神反应挑战与五题知识问答胜负、边界、重复输入和地点来源检查通过');
