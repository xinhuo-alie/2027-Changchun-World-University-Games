import assert from 'node:assert/strict';
import { GAME_REGISTRY, gameForVenue } from '../web/game-registry.js';
import { listVenues } from '../server/venues.js';
import { dodgeEngine, ENGINES } from '../web/minigame-redesign.js';
import { listPlaces } from '../server/places.js';

const venues=listVenues();
assert.equal(Object.keys(GAME_REGISTRY).length,10);
for(const venue of venues){const game=gameForVenue(venue);assert.ok(game,`registry entry missing: ${venue.id}`);assert.ok(['practice','ranked-solo','local-2p'].every(mode=>game.modes.includes(mode)));assert.equal(game.legacy.engine,venue.game.engine)}
function runCourse(seed){let result=null;const game=dodgeEngine({getBoundingClientRect:()=>({height:360})},{seed,duration:17,gates:8,goal:999,venueId:'beidahu'},{hit(){},miss(){},finish(won,value){result={won,value}}});for(let i=0;i<17*60&&!result;i++)game.update(1/60);return result}
assert.deepEqual(runCourse(927),runCourse(927),'seeded course should replay identical hazards and outcome');
assert.notDeepEqual(runCourse(927),runCourse(928),'a different seed should create a different course');
function checkGateCrossing(seed,lane){let result=null;const game=dodgeEngine({getBoundingClientRect:()=>({height:360})},{seed,duration:20,gates:5,goal:999,venueId:'sculpture'},{hit(){},miss(){},finish(won,value){result={won,value}}});const first=game.getState().gates[0];while(lane<1){game.onAction('left');lane+=1}while(lane>1){game.onAction('right');lane-=1}if(first.lane<1)game.onAction('left');else if(first.lane>1)game.onAction('right');const targetLead=360*(1-Math.pow((360-39-360*.27)/(360-360*.27),1/1.55));for(let i=0;i<500&&!game.getState().gates[0].passed;i++)game.update(1/100);const state=game.getState();assert.ok(state.gates[0].passed,'first gate should score at the character crossing point');assert.ok(state.travel<first.x,'gate should score before its world position has moved behind the character');assert.equal(state.score,3,'a clean gate pass should award three points immediately');assert.equal(state.collectibles,1,'sculpture course should award its first inspiration badge without a runtime error');assert.ok(state.travel>=first.x-targetLead-2,'score time should align with the projected gate crossing');return result}
const sculptureCourse=checkGateCrossing(927,1);assert.equal(sculptureCourse,null,'short gate-crossing check should not wait for end-of-round settlement');
assert.equal(typeof ENGINES.shootout,'function','Olympic venue must have alternating attack/defense engine');
const attractions=listPlaces().filter(place=>place.kind==='attraction');assert.equal(attractions.length,6);for(const place of attractions){assert.equal(place.game.engine,'attraction');let outcome=null;const bonus=ENGINES.attraction(null,{...place.game.params,seed:123},{hit(){},miss(){},finish(won,result){outcome={won,result}}});for(let tick=0;tick<15*60&&!outcome;tick++){bonus.update(1/60);bonus.onAction('right');bonus.onAction('primary')}assert.ok(outcome,`${place.id} bonus challenge should reach a result`);assert.ok(outcome.result.metrics.rounds>=3)}
console.log('第六阶段十场馆注册、旧引擎兼容、固定种子赛道、点球攻防与六处景点彩蛋测试通过');
