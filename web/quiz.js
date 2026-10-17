import { QUIZ_QUESTIONS, createQuizSession } from '/quiz-questions.js';

const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

export function createQuiz(root, options = {}) {
  let opener = null;
  let session = null;

  function close() {
    if (root.open) root.close();
    root.replaceChildren();
    if (opener?.isConnected) opener.focus();
    options.onClose?.();
  }

  function renderIntro() {
    const panel = node('section', 'quiz-panel');
    const eyebrow = node('p', 'quiz-eyebrow', 'BONUS · 冰雪知识');
    const title = node('h2', '', '冰雪知识快问快答');
    title.id = 'quizTitle';
    const poolSize = (options.questions || QUIZ_QUESTIONS).length;
    const roundSize = Math.min(options.roundSize || 5, poolSize);
    const copy = node('p', 'quiz-copy', `每轮随机抽 ${roundSize} 题，题目来自 ${poolSize} 道大运会场馆、冰雪运动和长春地标题库。每题答完都会说明答案来源，答对 4 题可以获得独立的知识徽章。`);
    const actions = node('div', 'quiz-actions');
    const start = node('button', 'quiz-primary', '开始答题');
    start.type = 'button';
    const back = node('button', 'quiz-secondary', '返回地图');
    back.type = 'button';
    start.addEventListener('click', () => { session = createQuizSession(options.questions || QUIZ_QUESTIONS, Math.random, options.roundSize || 5); renderQuestion(); });
    back.addEventListener('click', close);
    actions.append(start, back);
    panel.append(eyebrow, title, copy, actions);
    root.replaceChildren(panel);
    start.focus();
  }

  function renderResult() {
    const { score, total } = session.state;
    const earned = score >= 4;
    const panel = node('section', 'quiz-panel quiz-result');
    panel.setAttribute('aria-labelledby', 'quizTitle');
    const eyebrow = node('p', 'quiz-eyebrow', '答题完成');
    const title = node('h2', '', `${score} / ${total} 题答对`);
    title.id = 'quizTitle';
    const copy = node('p', 'quiz-copy', earned ? '知识徽章已收入旅行手册。' : '再读读地点手记，下一轮试着拿下知识徽章。');
    const badge = node('p', earned ? 'quiz-badge earned' : 'quiz-badge', earned ? '✦ 冰雪知识徽章' : '徽章目标：答对 4 题');
    badge.setAttribute('aria-live', 'polite');
    const actions = node('div', 'quiz-actions');
    const replay = node('button', 'quiz-primary', '再答一轮');
    replay.type = 'button';
    replay.addEventListener('click', () => { session = createQuizSession(options.questions || QUIZ_QUESTIONS, Math.random, options.roundSize || 5); renderQuestion(); });
    const back = node('button', 'quiz-secondary', '返回地图');
    back.type = 'button'; back.addEventListener('click', close);
    actions.append(replay, back);
    panel.append(eyebrow, title, copy, badge, actions);
    root.replaceChildren(panel);
    replay.focus();
  }

  function renderQuestion() {
    const { index, score, total, answer } = session.state;
    if (index >= total) { renderResult(); return; }
    const question = session.question;
    const panel = node('section', 'quiz-panel');
    panel.setAttribute('aria-labelledby', 'quizTitle');
    const head = node('div', 'quiz-head');
    const eyebrow = node('p', 'quiz-eyebrow', `冰雪知识 · ${String(index + 1).padStart(2, '0')} / ${total}`);
    const scoreNode = node('span', 'quiz-score', `答对 ${score}`);
    const title = node('h2', '', question.question);
    title.id = 'quizTitle';
    const answers = node('div', 'quiz-answers');
    answers.setAttribute('role', 'group');
    answers.setAttribute('aria-label', `第 ${index + 1} 题答案`);
    const feedback = node('div', 'quiz-feedback');
    feedback.id = 'quizFeedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    question.options.forEach((label, optionIndex) => {
      const button = node('button', 'quiz-answer', label);
      button.type = 'button';
      button.setAttribute('aria-describedby', 'quizFeedback');
      button.addEventListener('click', () => {
        const result = session.choose(optionIndex);
        if (!result) return;
        for (const item of answers.querySelectorAll('button')) item.disabled = true;
        button.classList.add(result.correct ? 'is-correct' : 'is-wrong');
        answers.querySelectorAll('button')[question.answer]?.classList.add('is-correct');
        feedback.textContent = `${result.correct ? '答对了。' : `正确答案：${question.options[question.answer]}。`}${result.explanation}`;
        const sourceUrl = options.getSourceUrl?.(question.sourceId);
        if (sourceUrl) {
          const link = node('a', 'quiz-source', '查看地点资料 ↗');
          link.href = sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
          feedback.append(' ', link);
        }
        next.hidden = false;
        next.focus();
      });
      answers.append(button);
    });
    const next = node('button', 'quiz-primary quiz-next', index === total - 1 ? '查看结果' : '下一题 →');
    next.type = 'button'; next.hidden = !answer;
    next.addEventListener('click', () => {
      const hasNext = session.next();
      if (!hasNext) {
        const { score: finalScore, total: finalTotal } = session.state;
        options.onFinish?.({ score: finalScore, total: finalTotal, earnedBadge: finalScore >= 4 });
        renderResult();
      } else renderQuestion();
    });
    const closeButton = node('button', 'quiz-close', '关闭');
    closeButton.type = 'button'; closeButton.addEventListener('click', close);
    head.append(eyebrow, scoreNode);
    panel.append(closeButton, head, title, answers, feedback, next);
    root.replaceChildren(panel);
    answers.querySelector('button')?.focus();
  }

  function onCancel(event) { event.preventDefault(); close(); }
  root.addEventListener('cancel', onCancel);

  return {
    open(trigger) {
      opener = trigger || document.activeElement;
      if (!root.open) root.showModal();
      renderIntro();
    },
    close,
    destroy() { root.removeEventListener('cancel', onCancel); close(); },
  };
}
