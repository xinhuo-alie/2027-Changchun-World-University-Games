import assert from 'node:assert/strict';
import { enduranceEngine } from '../web/minigame-redesign.js';
const game=enduranceEngine(null,{duration:20,target:100000},{hit(){},finish(){}});
const gradient={addColorStop(){}};
const ctx=new Proxy({measureText:value=>({width:String(value).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient}, {get(target,key){if(key in target)return target[key];return ()=>{}},set(target,key,value){target[key]=value;return true}});
const observed=new Map();
for(let i=0;i<1100;i++){
  game.update(.01);
  assert.doesNotThrow(()=>game.draw(ctx,700,420),`赛道绘制不能在第 ${i} 帧抛错`);
  const state=game.getState();
  if(!observed.has(state.terrainType)) observed.set(state.terrainType,state);
}
assert.deepEqual([...observed.keys()],['flat','uphill','downhill']);
assert.ok(observed.get('uphill').terrain>.45);
assert.ok(observed.get('downhill').terrain<-.45);
assert.ok(observed.get('flat').terrain>=-.45 && observed.get('flat').terrain<=.45);
console.log('耐力赛平路、上坡和下坡状态检查通过');
