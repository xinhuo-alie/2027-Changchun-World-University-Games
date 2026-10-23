const sprite = typeof Image === 'undefined' ? null : new Image();
let failed = false;
if (sprite) {
  sprite.onload = () => window.dispatchEvent(new Event('landmarks:loaded'));
  sprite.onerror = () => { failed = true; };
  sprite.src = '/assets/winter-landmark-cutouts.png';
}
const CELL = 512;
const ORDER = ['wuhuan','speed','cityhall','provhall','olympic','jingyue','lianhua','sculpture','songhuahu','beidahu','palace','film','mountainmall','nanhu','culture','century'];
export function drawGeneratedLandmark(ctx,id,x,y,width,height) {
  if (!sprite || failed || !sprite.complete || !sprite.naturalWidth) return false;
  const index=ORDER.indexOf(id);if(index<0)return false;
  const col=index%4,row=Math.floor(index/4);
  // 透明图集保留了每格完整的建筑和底部积雪。
  const pad=0,sw=sprite.naturalWidth/4,sh=sprite.naturalHeight/4;
  ctx.drawImage(sprite,col*sw+pad,row*sh+pad,sw-pad*2,sh-pad*2,x,y,width,height);
  return true;
}
