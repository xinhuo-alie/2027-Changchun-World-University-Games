import { GUIDE_MODES, advanceRoute, cloudMinutes, editRoute, explainStop, normalizePreferences, recommendItinerary, routePosition } from './itinerary.js';
import { claimQuest, questStepLabel, stepDone } from './quests.js';
import { buildPassport } from './passport.js';
import { getSecretCollection } from '/secret-collection.js';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (text, action, className = '') => {
  const node = make('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
};
const select = (label, values, current, onChange) => {
  const field = make('label', 'guide-field');
  field.append(make('span', '', label));
  const control = make('select');
  for (const [value, text] of values) {
    const option = make('option', '', text);
    option.value = value;
    control.append(option);
  }
  control.value = current;
  control.addEventListener('change', () => onChange(control.value));
  field.append(control);
  return field;
};

export function createGuideUI({ places, getProgress, setProgress, onNavigate, onQuiz, onCard }) {
  const byId = new Map(places.map((place) => [place.id, place]));
  const routeDialog = document.getElementById('routeDialog');
  const passportDialog = document.getElementById('passportDialog');
  const routeBar = document.getElementById('guideRouteBar');
  let preferences = normalizePreferences({ mode: getProgress().guideMode });
  let variant = 0;

  function close(dialog) { if (dialog.open) dialog.close(); }
  function goTo(id) {
    close(routeDialog); close(passportDialog);
    if (byId.has(id)) onNavigate(id);
  }
  function saveRoute(route) { setProgress({ route }); render(); options.onRouteChange?.(route); }

  function renderModes() {
    const mode = getProgress().guideMode;
    for (const control of document.querySelectorAll('[name="guideMode"]')) control.checked = control.value === mode;
  }

  function renderRouteBar() {
    routeBar.replaceChildren();
    const progress = getProgress();
    const route = progress.route;
    const position = routePosition(route);
    const copy = make('div', 'guide-route-copy');
    copy.append(make('strong', '', route ? route.status === 'paused' ? '路线已暂停' :
      position.current ? `当前站 · ${byId.get(position.current)?.name || '下一站'}` : '这条路线已走完' : '想从哪里开始？'));
    copy.append(make('small', '', route ?
      `已完成 ${position.completed} / ${position.total} 站${position.next ? ` · 下一站 ${byId.get(position.next)?.name || ''}` : ''}` :
      '先选目标，再获取可编辑的云游顺序'));
    routeBar.append(copy);
    if (route?.status === 'active' && position.current) routeBar.append(button('前往当前站 →', () => goTo(position.current), 'guide-primary'));
    routeBar.append(button(route ? '查看路线' : '规划云游路线', openRoute, 'guide-quiet'));
  }

  function renderRoute() {
    routeDialog.replaceChildren();
    const progress = getProgress();
    const route = progress.route;
    const position = routePosition(route);
    const head = make('div', 'guide-dialog-head');
    const copy = make('div');
    copy.append(make('p', 'guide-kicker', '旅行手册 · 路线规划'));
    const title = make('h2', '', '安排一段冰雪云游');
    title.id = 'routeTitle';
    copy.append(title);
    head.append(copy, button('关闭', () => close(routeDialog), 'guide-close'));
    routeDialog.append(head);
    routeDialog.append(make('p', 'guide-note', '推荐的是站点顺序与互动体验估时；城市地图为示意图，不提供实际道路、交通时间或导航。'));
    const fields = make('div', 'guide-fields');
    fields.append(
      select('游览时间', [['30', '30 分钟'], ['60', '1 小时'], ['halfday', '半天']], preferences.time, (value) => { preferences.time = value; }),
      select('兴趣', [['mixed', '场馆与城市都看看'], ['sport', '冰雪运动 / 场馆'], ['culture', '城市景点 / 文化']], preferences.interest, (value) => { preferences.interest = value; }),
      select('节奏', [['relaxed', '轻松'], ['balanced', '均衡'], ['challenge', '挑战']], preferences.pace, (value) => { preferences.pace = value; }),
      select('本次目标', [['first', '初次探索'], ['stamps', '收集印章'], ['games', '玩小游戏'], ['stories', '读地点故事']], preferences.goal, (value) => { preferences.goal = value; }),
    );
    routeDialog.append(fields);
    const actions = make('div', 'guide-actions');
    actions.append(button(route ? '重新生成路线' : '生成推荐路线', () => {
      variant += 1;
      saveRoute(recommendItinerary(places, { ...preferences, mode: progress.guideMode }, progress, variant));
    }, 'guide-primary'));
    if (route && position.current) {
      if (route.status === 'active') actions.append(button('暂停路线', () => saveRoute({ ...route, status: 'paused' }), 'guide-quiet'));
      else actions.append(button(route.status === 'paused' ? '继续路线' : '开始路线', () => {
        saveRoute({ ...route, status: 'active' });
        goTo(position.current);
      }, 'guide-primary'));
      if (route.status === 'paused') actions.append(button('前往当前站', () => goTo(position.current), 'guide-quiet'));
    }
    if (route) actions.append(button('退出路线', () => saveRoute(null), 'guide-danger'));
    routeDialog.append(actions);
    if (!route) {
      routeDialog.append(make('p', 'guide-empty', places.length ? '选择上面的偏好，生成第一条云游路线。' : '地点暂时不可用，请稍后刷新页面。'));
      return;
    }
    const totalMinutes = route.ids.reduce((sum, id) => sum + cloudMinutes(byId.get(id)), 0);
    routeDialog.append(make('p', 'guide-route-summary', `推荐 ${route.ids.length} 站 · 云游互动体验约 ${totalMinutes} 分钟 · 已完成 ${position.completed} 站`));
    const list = make('ol', 'guide-stop-list');
    route.ids.forEach((id, index) => {
      const place = byId.get(id);
      if (!place) return;
      const row = make('li', 'guide-stop');
      if (route.completed.includes(id)) row.classList.add('is-done');
      if (position.current === id && route.status === 'active') row.classList.add('is-current');
      const main = make('div', 'guide-stop-main');
      main.append(make('b', '', `${String(index + 1).padStart(2, '0')} · ${place.name}`));
      main.append(make('small', '', `${place.kind === 'venue' ? '竞赛场馆' : '城市景点'} · 云游互动约 ${cloudMinutes(place)} 分钟${place.game ? ' · 场馆挑战' : ' · 地点故事'}`));
      main.append(make('p', '', explainStop(place, route.preferences, progress)));
      row.append(main);
      const controls = make('div', 'guide-stop-actions');
      if (route.status !== 'active') {
        const up = button('上移', () => saveRoute(editRoute(route, 'up', id)), 'guide-mini');
        const down = button('下移', () => saveRoute(editRoute(route, 'down', id)), 'guide-mini');
        up.disabled = index === 0; down.disabled = index === route.ids.length - 1;
        controls.append(up, down, button('移除', () => saveRoute(editRoute(route, 'remove', id)), 'guide-mini'));
        const alternatives = places.filter((candidate) => !route.ids.includes(candidate.id));
        if (alternatives.length) controls.append(select('替换', [['', '选地点替换'], ...alternatives.map((candidate) => [candidate.id, candidate.name])], '', (other) => {
          if (other) saveRoute(editRoute(route, 'replace', id, other));
        }));
      } else if (position.current === id) controls.append(button('出发', () => goTo(id), 'guide-mini guide-primary'));
      row.append(controls);
      list.append(row);
    });
    routeDialog.append(list);
  }

  function openRoute() {
    const progress = getProgress();
    preferences = normalizePreferences(progress.route?.preferences || { mode: progress.guideMode });
    variant = progress.route?.variant || 0;
    renderRoute();
    if (!routeDialog.open) routeDialog.showModal();
  }

  function actOnQuest(quest) {
    const step = quest.nextStep;
    if (!step) return;
    if (step.type === 'knowledgeAny') {
      close(passportDialog);
      onQuiz(step.ids);
    } else goTo(step.id);
  }

  function renderPassport() {
    passportDialog.replaceChildren();
    const progress = getProgress();
    const passport = buildPassport(progress, places);
    const head = make('div', 'guide-dialog-head');
    const copy = make('div');
    copy.append(make('p', 'guide-kicker', '我的冰雪护照'));
    const title = make('h2', '', '每一步，都留在手册里');
    title.id = 'passportTitle';
    copy.append(title);
    head.append(copy, button('关闭', () => close(passportDialog), 'guide-close'));
    passportDialog.append(head);
    const metrics = make('div', 'guide-passport-metrics');
    for (const [value, label] of [
      [`${passport.explored} / ${passport.placeTotal}`, '地点印章'],
      [`${passport.medals} / ${passport.venueTotal}`, '场馆奖章'],
      [`${passport.claimed} / ${passport.questTotal}`, '任务章'],
      [`${passport.completion}%`, '旅行完成度'],
    ]) {
      const cell = make('div');
      cell.append(make('strong', '', value), make('span', '', label));
      metrics.append(cell);
    }
    passportDialog.append(metrics);
    const collection=getSecretCollection();
    const secretSection=make('section'); secretSection.id='secretCollection'; secretSection.className='guide-secret-collection';
    secretSection.append(make('h3','','珍藏角色图鉴'));
    if(collection.items.length){
      const list=make('div','guide-secret-grid');
      for(const item of collection.items){const card=make('article','guide-secret-card');
        if(item.artworkUrl){const image=document.createElement('img');image.src=item.artworkUrl;image.alt=`${item.title}角色作品`;card.append(image);}
        card.append(make('b','',item.title),make('p','',item.tagline),make('small','',`发现于 ${new Date(item.discoveredAt).toLocaleDateString('zh-CN')}`));list.append(card);}
      secretSection.append(list);
    }else secretSection.append(make('p','guide-note','隐藏角色可能在正式生成时出现；目前还没有收藏记录。'));
    passportDialog.append(secretSection);
    if (passport.nextQuest) passportDialog.append(make('p', 'guide-next-quest',
      passport.nextQuest.status === 'claimable' ? `下一步：领取「${passport.nextQuest.title}」任务章` :
        `推荐下一步：${passport.nextQuest.nextLabel}，推进「${passport.nextQuest.title}」`));
    passportDialog.append(make('p', 'guide-note', `知识徽章：${passport.quizBadge ? '已获得' : '未获得'}（最佳 ${passport.quizBest} / 5） · 冰球门神：最佳扑救 ${passport.goalieBest} / 5。记录来自当前浏览器，不代表线下签到或真实客流。`));
    const stampTitle = make('h3', '', '地点探索印章');
    passportDialog.append(stampTitle);
    const stamps = make('div', 'guide-stamp-grid');
    for (const stamp of passport.stamps) {
      const item = make('span', stamp.collected ? 'guide-stamp is-earned' : 'guide-stamp', `${stamp.collected ? '✦' : '○'} ${stamp.name}`);
      stamps.append(item);
    }
    passportDialog.append(stamps);
    const best = Object.entries(passport.bestScores).filter(([id]) => byId.has(id))
      .map(([id, score]) => `${byId.get(id).name} ${score}`);
    passportDialog.append(make('p', 'guide-note', best.length ? `个人最佳：${best.join(' · ')}` : '个人最佳：完成一场挑战后会记录在这里。'));
    if (progress.route) {
      const route = passport.route;
      const section = make('div', 'guide-passport-route');
      section.append(make('b', '', `当前路线 · 已完成 ${route.completed} / ${route.total} 站`));
      section.append(make('span', '', route.current ? `下一目标：${byId.get(route.current)?.name || '下一站'}` : '路线已走完'));
      section.append(button('查看路线', () => { close(passportDialog); openRoute(); }, 'guide-quiet'));
      passportDialog.append(section);
    }
    passportDialog.append(make('h3', '', '跨地点任务'));
    const groups = make('div', 'guide-quest-list');
    for (const quest of passport.quests) {
      const card = make('article', 'guide-quest');
      card.append(make('small', '', `${quest.categoryLabel} · ${quest.done} / ${quest.total}`));
      card.append(make('h4', '', quest.title));
      card.append(make('p', '', quest.description));
      const steps = make('ul', 'guide-quest-steps');
      quest.steps.forEach((step) => {
        const done = stepDone(step, progress);
        steps.append(make('li', done ? 'is-done' : '', `${done ? '✓' : '○'} ${questStepLabel(step, places)}`));
      });
      card.append(steps);
      card.append(make('span', 'guide-quest-state', quest.claimed ? '已领取护照任务章' : quest.completed ? '可领取护照任务章' : `下一步：${quest.nextLabel}`));
      if (quest.status === 'claimable') card.append(button('领取任务章', () => {
        setProgress({ claimedQuests: claimQuest(getProgress(), quest.id, places).claimedQuests });
        options.onQuestClaimed?.(quest.id);
        render();
      }, 'guide-primary'));
      if (quest.status === 'incomplete') card.append(button(quest.nextLabel + ' →', () => actOnQuest(quest), 'guide-quiet'));
      groups.append(card);
    }
    passportDialog.append(groups);
    const foot = make('div', 'guide-actions');
    foot.append(button('制作旅行纪念卡', () => { close(passportDialog); onCard(); }, 'guide-primary'));
    foot.append(button('返回地图', () => close(passportDialog), 'guide-quiet'));
    passportDialog.append(foot);
  }

  function openPassport() {
    renderPassport();
    if (!passportDialog.open) passportDialog.showModal();
  }

  for (const input of document.querySelectorAll('[name="guideMode"]')) {
    input.addEventListener('change', () => {
      if (!input.checked || !Object.hasOwn(GUIDE_MODES, input.value)) return;
      const current = getProgress();
      setProgress({ guideMode: input.value, route: current.route?.status === 'active' ? current.route : null });
      preferences = normalizePreferences({ mode: input.value });
      render();
    });
  }
  document.getElementById('passportBtn').addEventListener('click', () => { options.onPassportOpen?.(); openPassport(); });

  function render() {
    renderModes();
    renderRouteBar();
    if (routeDialog.open) renderRoute();
    if (passportDialog.open) renderPassport();
  }
  render();
  return { render, openRoute, openPassport, advanceOnArrival(id) {
    const current = getProgress();
    const next = advanceRoute(current.route, id);
    if (next !== current.route) setProgress({ route: next });
    render();
  } };
}
