// 纸雕城市示意图；世界坐标与场馆路径仍由 venues2d.js 管理。
import { MAP_LANDMARKS, imagePointToWorld } from './map-landmarks.js';
export const MAP_BOUNDS = { x: -535, z: -350, w: 1423, h: 800 };
const shore = [[-535,-350],[-383,-393],[-189,-370],[4,-412],[207,-379],[414,-337],[617,-287],[847,-223],[868,-16],[832,180],[888,334],[790,480],[560,480],[356,477],[152,489],[-91,486],[-320,449],[-506,321],[-563,129]];
let panorama = null;
let panoramaFailed = false;
export function loadCityPanorama(url = `/assets/${MAP_LANDMARKS.source}`) {
  if (panorama || panoramaFailed || typeof Image === 'undefined') return panorama;
  const image = new Image();
  image.onload = () => { panorama = image; window.dispatchEvent(new Event('citymap:loaded')); };
  image.onerror = () => { panoramaFailed = true; window.dispatchEvent(new Event('citymap:error')); };
  image.src = url;
  panorama = image;
  return panorama;
}
export function getPanoramaWorldPoints() {
  return Object.fromEntries(Object.entries(MAP_LANDMARKS.points).map(([id, point]) => [id, imagePointToWorld(point, MAP_BOUNDS)]));
}

function polygon(ctx, project, points, y = 0) {
  ctx.beginPath();
  points.forEach(([x,z],i) => { const p=project(x,z); i ? ctx.lineTo(p.x,p.y+y) : ctx.moveTo(p.x,p.y+y); });
  ctx.closePath();
}
function line(ctx,project,points,width,color,scale) {
  ctx.beginPath();
  points.forEach(([x,z],i)=>{const p=project(x,z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
  ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,width*scale);ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function fir(ctx,project,scale,x,z,k=1) {
  const p=project(x,z),h=22*scale*k;
  if(h<2||h>95)return;
  ctx.fillStyle='#735e4d';ctx.fillRect(p.x-h*.06,p.y-h*.1,h*.12,h*.25);
  ctx.fillStyle='#587e69';ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x-h*.44,p.y+h*.08);ctx.lineTo(p.x+h*.44,p.y+h*.08);ctx.fill();
  ctx.fillStyle='#92b69a';ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x+h*.44,p.y+h*.08);ctx.lineTo(p.x+h*.06,p.y-h*.16);ctx.fill();
  ctx.strokeStyle='#edf5e8';ctx.lineWidth=Math.max(1,2*scale);ctx.beginPath();ctx.moveTo(p.x-h*.19,p.y-h*.46);ctx.quadraticCurveTo(p.x,p.y-h*.53,p.x+h*.21,p.y-h*.43);ctx.stroke();
}
function house(ctx,project,scale,x,z,w,h,warm) {
  const p=project(x,z),a=w*scale,b=h*scale,d=11*scale;
  if(a<3)return;
  ctx.fillStyle='rgba(37,65,61,.13)';ctx.beginPath();ctx.ellipse(p.x+a*.5,p.y+d*.6,a*.8,d*.5,-.17,0,7);ctx.fill();
  ctx.fillStyle=warm?'#dfbea0':'#d0dcd4';ctx.beginPath();ctx.moveTo(p.x,p.y-b);ctx.lineTo(p.x+a,p.y-b-d*.23);ctx.lineTo(p.x+a,p.y+d*.65);ctx.lineTo(p.x,p.y+d*.84);ctx.fill();
  ctx.fillStyle=warm?'#b28e73':'#a6bbb2';ctx.beginPath();ctx.moveTo(p.x+a,p.y-b-d*.23);ctx.lineTo(p.x+a+d*.7,p.y-b+d*.15);ctx.lineTo(p.x+a+d*.7,p.y+d);ctx.lineTo(p.x+a,p.y+d*.65);ctx.fill();
  ctx.fillStyle=warm?'#f4e4cf':'#eaf2e9';ctx.beginPath();ctx.moveTo(p.x,p.y-b);ctx.lineTo(p.x+d*.7,p.y-b-d*.39);ctx.lineTo(p.x+a+d*.7,p.y-b+d*.15);ctx.lineTo(p.x+a,p.y-b-d*.23);ctx.fill();
  ctx.fillStyle='#90acad';for(let i=0;i<2;i++)ctx.fillRect(p.x+a*(.24+i*.42),p.y-b*.66,Math.max(1,a*.12),Math.max(2,b*.19));
}
export function drawCityMap(ctx,project,scale,size) {
  loadCityPanorama();
  if (panorama instanceof Image && panorama.complete && panorama.naturalWidth) {
    const a=project(MAP_BOUNDS.x,MAP_BOUNDS.z),b=project(MAP_BOUNDS.x+MAP_BOUNDS.w,MAP_BOUNDS.z+MAP_BOUNDS.h);
    ctx.save();
    const fittedHeight=MAP_BOUNDS.w*panorama.naturalHeight/panorama.naturalWidth;
    const imageTop=project(MAP_BOUNDS.x,MAP_BOUNDS.z+(MAP_BOUNDS.h-fittedHeight)/2);
    const bottom=project(MAP_BOUNDS.x+MAP_BOUNDS.w,MAP_BOUNDS.z+(MAP_BOUNDS.h+fittedHeight)/2);
    ctx.beginPath();ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.clip();
    ctx.globalAlpha=.96;
    ctx.drawImage(panorama,a.x,imageTop.y,b.x-a.x,bottom.y-imageTop.y);
    // 冰雪色调和边缘柔化覆盖在图片空间内，继续随地图相机一同变换。
    const wash=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
    wash.addColorStop(0,'rgba(213,235,238,.10)');wash.addColorStop(.55,'rgba(236,245,231,.04)');wash.addColorStop(1,'rgba(204,229,226,.16)');
    ctx.fillStyle=wash;ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);
    ctx.restore();
    return;
  }
  if (panoramaFailed) { /* 加载失败后继续使用下方程序绘制底图 */ }
  const sea=ctx.createLinearGradient(0,0,size.w,size.h);
  sea.addColorStop(0,'#d9eae5');sea.addColorStop(1,'#a9cdd4');
  ctx.fillStyle=sea;ctx.fillRect(0,0,size.w,size.h);
  ctx.save();ctx.shadowColor='rgba(28,68,78,.3)';ctx.shadowBlur=23;ctx.shadowOffsetY=13;
  polygon(ctx,project,shore,16*scale);ctx.fillStyle='#799b9c';ctx.fill();ctx.restore();
  polygon(ctx,project,shore,10*scale);ctx.fillStyle='#a7b18e';ctx.fill();
  polygon(ctx,project,shore);
  const land=ctx.createLinearGradient(0,0,size.w,size.h);
  land.addColorStop(0,'#f4efd9');land.addColorStop(.54,'#dde5bb');land.addColorStop(1,'#bed4a2');
  ctx.fillStyle=land;ctx.fill();ctx.strokeStyle='#fdf6e3';ctx.lineWidth=Math.max(1,4*scale);ctx.stroke();
  ctx.save();polygon(ctx,project,shore);ctx.clip();
  // 东南侧低丘与林地：概括地貌，不将示意坐标当作测绘数据。
  for(let i=0;i<18;i++) {
    const x=385+(i%6)*76,z=140+Math.floor(i/6)*100;
    const p=project(x,z),r=(65+(i%3)*19)*scale;
    const hill=ctx.createRadialGradient(p.x-r*.25,p.y-r*.3,0,p.x,p.y,r);
    hill.addColorStop(0,'#b6ca8c');hill.addColorStop(.55,'#8bab79');hill.addColorStop(1,'rgba(135,169,118,0)');
    ctx.fillStyle=hill;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.58,-.3,0,Math.PI*2);ctx.fill();
  }
  const river=[[180,520],[220,370],[168,240],[200,100],[130,-30],[160,-180],[115,-420]];
  line(ctx,project,river,36,'#bed1a9',scale);
  line(ctx,project,river,23,'#68b3c4',scale);
  line(ctx,project,river,12,'#a9d8dc',scale);
  // 两组斜向街巷形成沙盘视角，主干道仍保留概括的方位关系。
  for(let n=-3;n<=3;n++) {
    const a=-580+n*180,b=-385+n*165;
    const roadA=[[a,-475],[a+1250,555]],roadB=[[-650,b+665],[980,b-600]];
    line(ctx,project,roadA,19,'#afc2ae',scale);line(ctx,project,roadA,13,'#f7f1dd',scale);
    line(ctx,project,roadB,18,'#b5c6ae',scale);line(ctx,project,roadB,12,'#faf3df',scale);
  }
  for(const road of [
    [[-480,-99],[-224,-65],[49,26],[301,156],[825,304]],
    [[-343,-382],[-255,-111],[-117,93],[119,299],[472,519]],
    [[105,-430],[112,-170],[169,72],[333,301],[607,504]],
    [[-546,284],[-245,214],[34,183],[374,201],[864,368]]
  ]) {
    line(ctx,project,road,34,'#9baea4',scale);line(ctx,project,road,26,'#f7eedb',scale);
    ctx.setLineDash([8*scale,12*scale]);line(ctx,project,road,1.5,'#fffdf0',scale);ctx.setLineDash([]);
  }
  for(const [x,z,rx,ry] of [[-205,247,68,30],[355,375,49,77],[696,428,85,31]]) {
    const p=project(x,z);ctx.fillStyle='#91c4cd';ctx.strokeStyle='#eaf0da';ctx.lineWidth=Math.max(1,5*scale);
    ctx.beginPath();ctx.ellipse(p.x,p.y,rx*scale,ry*scale,-.2,0,7);ctx.fill();ctx.stroke();
  }
  // 普通街区保持低矮，具体场馆和景点由前景的专属建筑插画呈现。
  for(let row=-3;row<=4;row++)for(let col=-4;col<=6;col++) {
    const x=col*120+(row%2?28:0)+16,z=row*105+17;
    if((row*7+col*11+44)%5===0||(x>220&&z>170))continue;
    if(x>-210&&x<360&&z>-230&&z<320&&(row+col)%3===0)continue;
    house(ctx,project,scale,x,z,21+(col+12)%3*5,13+(row+8)%3*5,(row+col*2+50)%4===0);
    if((row+col)%2===0)fir(ctx,project,scale,x+47,z+17,.77);
  }
  for(const [x,z] of [[-466,-276],[-409,43],[-377,301],[-263,334],[-127,379],[36,399],[187,415],[420,-267],[485,-201],[573,109],[725,181],[786,391]]) {
    fir(ctx,project,scale,x,z,1.2);fir(ctx,project,scale,x+16,z+17,.76);
  }
  for(let i=0;i<65;i++) {
    const x=410+(i*73%390),z=160+(i*47%290);
    fir(ctx,project,scale,x,z,.65+(i%4)*.16);
  }
  ctx.restore();
}
