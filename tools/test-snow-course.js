import assert from 'node:assert/strict';
import { dodgeEngine } from '../web/minigame-redesign.js';
for(const venueId of ['sculpture','songhuahu','beidahu']){
 let result; const game=dodgeEngine({getBoundingClientRect:()=>({height:360})},{venueId,duration:20,speed:1.08,goal:0,seed:18},{hit(){},miss(){},finish(won,value){result={won,value}}});
 for(let i=0;i<1900;i++) game.update(.01);
 const state=game.getState();
 assert.ok(state.gates.some(g=>!g.passed && g.x-state.travel<360),`${venueId} 后半程仍应有目标`);
 game.finishRound();assert.equal(result.won,true,`${venueId} 达标时外层结束应正常结算`);
 assert.ok(result.value.metrics);
}
console.log('三场馆后半程目标及到时结算通过');
