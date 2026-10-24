/**
 * 纯文案选择器，不触碰 DOM、本地存储或服务器。由现有 mascot-guide.js 调用。
 * 所有输入来自真实游戏事件与真实进度，绝不伪造获奖/在线/隐藏款。
 */
import { SCENE_DIALOGUES } from './mascot-dialogues.js';
import { PLACE_DIALOGUES } from './mascot-place-lines.js';
import { MASCOT_FUN_FACTS } from './mascot-fun-facts.js';
import { MISSION_DIALOGUES } from './mascot-missions.js';
import { MASCOT_REACTIONS } from './mascot-reactions.js';
import { GAME_INTROS } from './mascot-game-lines.js';
import { ROUTE_DIALOGUES } from './mascot-routes.js';

export const GUIDE_EVENTS = Object.freeze({
  COVER_FIRST:'cover_first', COVER_OPEN:'cover_open', COVER_RETURN:'cover_return',
  WORKSHOP_FIRST:'workshop_first', WORKSHOP_OPEN:'workshop_open', AVATAR_RANDOMIZED:'avatar_randomized',
  AVATAR_READY:'avatar_ready', AVATAR_GENERATE_FAILED:'avatar_generate_failed', MAP_FIRST:'map_first',
  MAP_OPEN:'map_open', ROUTE_PAUSE:'route_pause', ROUTE_COMPLETE:'route_complete', ROUTE_RECOMMENDED:'route_recommended',
  PASSPORT_FIRST:'passport_first', PASSPORT_OPEN:'passport_open', MEDAL_FIRST:'medal_first',
  EXPLORE_MILESTONE:'explore_milestone', ALL_PLACES_EXPLORED:'all_places_explored',
  PLACE_ARRIVED:'place_arrived', PLACE_REVISIT:'place_revisit', PLACE_NOTE_OPEN:'place_note_open', PLACE_FACT:'place_fact',
  GAME_FIRST:'game_first', GAME_START:'game_start', GAME_WIN:'game_win', GAME_LOSE:'game_lose',
  GAME_NEW_BEST:'game_new_best', GAME_MEDAL:'game_medal', QUIZ_CORRECT:'quiz_correct', QUIZ_WRONG:'quiz_wrong',
  QUIZ_DONE:'quiz_done', QUEST_READY:'quest_ready', QUEST_CLAIMED:'quest_claimed',
  SECRET_HINT:'secret_hint', SECRET_UNLOCKED:'secret_unlocked', RETURN_FROM_GAME:'return_from_game', DISPLAY_OPEN:'display_open',
});

const arr = v => Array.isArray(v) ? v : [];
const count = (progress,key) => Array.isArray(progress?.[key]) ? progress[key].length : progress?.[key] instanceof Set ? progress[key].size : 0;
const allowed = (cue, progress) => {
  const r=cue.requires || {};
  const explored=count(progress,'explored'), medals=count(progress,'medals');
  return !((r.exploredMax!==undefined && explored>r.exploredMax) ||
    (r.exploredMin!==undefined && explored<r.exploredMin) ||
    (r.medalsMax!==undefined && medals>r.medalsMax) ||
    (r.medalsMin!==undefined && medals<r.medalsMin));
};
const normalizeSpeaker = value => value === 'jixue' ? 'jixue' : 'jibing';
const result = (data,event) => data ? {...data, event, cooldownSec:data.cooldownSec ?? 35, priority:data.priority ?? 10} : null;

/** 从真实地点和事件推导一张候选卡；展示频率交给 createMascotCuePicker 管理。 */
export function resolveMascotCue({ event, mascot='jibing', placeId, questId, routeId, progress={}, variant=0 }={}) {
  const who=normalizeSpeaker(mascot);
  if(event==='place_fact'){
    const fact=MASCOT_FUN_FACTS[placeId];if(!fact)return null;
    return result({id:`place_fact.${placeId}`,kind:'fact',speaker:who,mood:'thinking',title:fact.question,
      body:'猜猜答案，再点开看看。',revealText:fact.answer,placeId,
      primaryAction:{type:'reveal_answer',label:'揭晓答案'},priority:12,cooldownSec:40},event);
  }
  if(event==='place_arrived' || event==='place_note_open') {
    const entry=PLACE_DIALOGUES[placeId]; if(!entry)return null;
    const line=entry[who];
    return result({id:`${event}.${placeId}.${who}`,kind:event==='place_arrived'?'arrival':'fact',speaker:who,mood:line.mood,
      title:line.title,body:line.body,miniPrompt:line.miniPrompt,placeId,
      primaryAction:event==='place_arrived'?{type:'open_place_note',label:line.ctaLabel,placeId}:undefined,
      priority:event==='place_arrived'?28:12},event);
  }
  if(event==='game_start'){
    const game=GAME_INTROS[placeId];if(!game)return null;
    const line=game[who];
    return result({id:`game_start.${placeId}.${who}`,kind:'tip',speaker:who,mood:line.mood,
      title:line.title,body:line.body,placeId,priority:12},event);
  }
  if(event==='quest_ready'||event==='quest_claimed'){
    const quest=MISSION_DIALOGUES[questId];if(quest){const line=quest[who];
      return result({id:`${event}.${questId}.${who}`,kind:event==='quest_ready'?'mission':'celebration',speaker:who,
        mood:line.mood,title:line.title,body:line.body,questId,
        primaryAction:quest.action,priority:event==='quest_ready'?55:65,once:event==='quest_claimed'?'session':undefined},event);
    }
  }
  if(event==='route_recommended'){
    const r=ROUTE_DIALOGUES[routeId];if(!r)return null;
    return result({id:`route.${routeId}`,kind:'route',speaker:r.host,mood:'point',title:r.title,
      body:r.intro,placeIds:r.ids,warning:r.warning,
      primaryAction:{type:'open_route',label:r.cta},priority:30,cooldownSec:45},event);
  }
  if(event==='place_revisit') {
    const entry=PLACE_DIALOGUES[placeId]; if(!entry)return null;
    const line=entry[who];
    return result({id:`place_revisit.${placeId}.${who}`,kind:'arrival',speaker:who,mood:line.mood,
      title:line.title,body:line.body,placeId,priority:10,cooldownSec:90},event);
  }
  if(event==='workshop_first' && (progress.explored?.length || progress.explored?.size || progress.medals?.length || progress.medals?.size)) event='workshop_open';
  if(event==='map_first' && (progress.explored?.length || progress.explored?.size)) event='map_open';
  if(event==='passport_first' && (progress.claimedQuests?.length || progress.claimedQuests?.size)) event='passport_open';
  const list=[...SCENE_DIALOGUES,...MASCOT_REACTIONS]
    .filter(c=>c.event===event && allowed(c,progress) && (c.speaker===who || c.speaker==='duo'));
  if(!list.length)return null;
  // 双人剧情优先于单人语句；同级可用变体索引循环，避免完全同句重复。
  list.sort((a,b)=> (b.priority??0)-(a.priority??0));
  const maxPriority=list[0].priority??0;
  const top=list.filter(c=>(c.priority??0)===maxPriority);
  return result(top[Math.abs(Math.trunc(Number(variant)||0))%top.length],event);
}

/**
 * 内存态调度器。页面持久化已有选择 cc2027:mascot-guide:v1 不由此覆盖。
 * 自动消息用 peek；用户主动点吉祥物可 force=true，无条件打开引导卡。
 */
export function createMascotCuePicker({now=()=>Date.now(),store=null}={}){
  const seen=new Set();const lastById=new Map();const rotations=new Map();let lastAny=0;
  const persisted=store&&typeof store==='object'?store:null;
  const seenEver=new Set(Array.isArray(persisted?.seenEver)?persisted.seenEver:[]);
  const persist=()=>{if(persisted)persisted.seenEver=[...seenEver].slice(-100)};
  function pick(input,{force=false}={}) {
    const group=`${input.event}:${input.mascot||'jibing'}:${input.placeId||''}`;
    const cue=resolveMascotCue({...input,variant:input.variant??(rotations.get(group)||0)});if(!cue)return null;
    const t=now();
    if(!force){
      if(cue.once==='session' && seen.has(cue.id))return null;
      if(cue.once==='ever' && seenEver.has(cue.id))return null;
      if(t-lastAny<8000 && cue.priority<60)return null;
      if(t-(lastById.get(cue.id)||-Infinity)<cue.cooldownSec*1000)return null;
    }
    lastAny=t;lastById.set(cue.id,t);seen.add(cue.id);rotations.set(group,(rotations.get(group)||0)+1);
    if(cue.once==='ever'){seenEver.add(cue.id);persist()}
    return cue;
  }
  return {pick};
}
