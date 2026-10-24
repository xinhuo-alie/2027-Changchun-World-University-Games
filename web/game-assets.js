import { GAME_REGISTRY } from './game-registry.js';

const keys=[...new Set(Object.values(GAME_REGISTRY).flatMap(game=>game.assetKeys))];
const cache=new Map();
const pending=new Map();
export function loadGameAsset(key) {
  if (!keys.includes(key)) return Promise.resolve(null);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (!pending.has(key)) pending.set(key,new Promise(resolve=>{const image=new Image();image.onload=()=>{cache.set(key,image);pending.delete(key);resolve(image)};image.onerror=()=>{pending.delete(key);resolve(null)};image.src=`/assets/games/${key}.png`;}));
  return pending.get(key);
}
export async function preloadGameAssets(venueId) { const game=GAME_REGISTRY[venueId]; if(!game)return {}; const values=await Promise.all(game.assetKeys.map(async key=>[key,await loadGameAsset(key)])); return Object.fromEntries(values); }
export function drawGameAsset(ctx,key,x,y,w,h) { const image=cache.get(key); if(image?.complete&&image.naturalWidth){ctx.drawImage(image,x,y,w,h);return true;} return false; }
