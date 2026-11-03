import assert from 'node:assert/strict';
import { GAME_REGISTRY, gameForVenue } from '../web/game-registry.js';
import { listVenues } from '../server/venues.js';
import { dodgeEngine, ENGINES } from '../web/minigame-redesign.js';
import { listPlaces } from '../server/places.js';
import { bgScene } from '../web/minigame-engines.js';

const venues=listVenues();
assert.equal(Object.keys(GAME_REGISTRY).length,10);
for(const venue of venues){const game=gameForVenue(venue);assert.ok(game,`registry entry missing: ${venue.id}`);assert.ok(['practice','ranked-solo','local-2p'].every(mode=>game.modes.includes(mode)));assert.equal(game.legacy.engine,venue.game.engine)}
function runCourse(seed){let result=null;const game=dodgeEngine({getBoundingClientRect:()=>({height:360})},{seed,duration:17,gates:8,goal:999,venueId:'beidahu'},{hit(){},miss(){},finish(won,value){result={won,value}}});for(let i=0;i<17*60&&!result;i++)game.update(1/60);return result}
assert.deepEqual(runCourse(927),runCourse(927),'seeded course should replay identical hazards and outcome');
assert.notDeepEqual(runCourse(927),runCourse(928),'a different seed should create a different course');
function checkGateCrossing(seed,lane){let result=null;const game=dodgeEngine({getBoundingClientRect:()=>({height:360})},{seed,duration:20,gates:5,goal:999,venueId:'sculpture'},{hit(){},miss(){},finish(won,value){result={won,value}}});const first=game.getState().gates[0];while(lane<1){game.onAction('left');lane+=1}while(lane>1){game.onAction('right');lane-=1}if(first.lane<1)game.onAction('left');else if(first.lane>1)game.onAction('right');for(let i=0;i<500&&!game.getState().gates[0].passed;i++){if(first.x-game.getState().travel<=95)game.onAction('primary');game.update(1/100);}const state=game.getState();assert.ok(state.gates[0].passed,'first inspiration badge should be marked complete when picked up');assert.ok(state.travel<first.x,'pickup should be accepted before the badge passes the character');assert.equal(state.score,3,'a successful pickup should award three points immediately');assert.equal(state.collectibles,1,'sculpture course should award its first inspiration badge');assert.equal(state.missedGates,0,'a collected badge must not later be counted as missed');return result}
const sculptureCourse=checkGateCrossing(927,1);assert.equal(sculptureCourse,null,'short gate-crossing check should not wait for end-of-round settlement');
const sceneCalls=[];const gradient={addColorStop(){}};const sceneCtx=new Proxy({createLinearGradient(){return gradient}},{get(target,key){if(key in target)return target[key];return (...args)=>{sceneCalls.push([key,...args])}},set(target,key,value){target[key]=value;return true}});bgScene(sceneCtx,800,420,{venueId:'mountainmall',scene:'city'});assert.ok(sceneCalls.some(call=>call[0]==='fillRect'),'city fallback should draw its own street scene');assert.equal(sceneCalls.filter(call=>call[0]==='ellipse').length,0,'city scene must not draw the generic indoor arena arch');
assert.equal(typeof ENGINES.shootout,'function','Olympic venue must have alternating attack/defense engine');
const attractions=listPlaces().filter(place=>place.kind==='attraction');assert.equal(attractions.length,6);for(const place of attractions){assert.equal(place.game.engine,'attraction');let outcome=null;const bonus=ENGINES.attraction(null,{...place.game.params,seed:123},{hit(){},miss(){},finish(won,result){outcome={won,result}}});for(let tick=0;tick<15*60&&!outcome;tick++){bonus.update(1/60);bonus.onAction('right');bonus.onAction('primary')}assert.ok(outcome,`${place.id} bonus challenge should reach a result`);assert.ok(outcome.result.metrics.rounds>=3)}
console.log('第六阶段十场馆注册、旧引擎兼容、固定种子赛道、点球攻防与六处景点彩蛋测试通过');
