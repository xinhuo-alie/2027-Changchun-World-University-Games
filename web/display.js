import { applyMapLayout, createMapView } from '/venues2d.js';
import { fetchMapLayout } from '/map-layout-client.js';
import { drawVenueIllustration } from '/venue-art.js';
import { connectStats } from '/visit-client.js';
const $ = id => document.getElementById(id);
const number = value => Number(value || 0).toLocaleString('zh-CN');
const time = value => new Date(value).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
let places = [], map, stats, selected, rotating = true, lastFrame = performance.now();
function select(id) {
  selected = places.find(p => p.id === id); if(!selected) return;
  map.setActive(id);
  $('placeType').textContent=selected.kind==='attraction'?'城市景点 · 长春':'冰雪竞赛场馆 · '+selected.city;
  $('placeName').textContent=selected.name;$('placeTeaser').textContent=selected.teaser;
  $('placeStory').textContent=selected.highlights?.[0] || selected.desc;
  drawVenueIllustration($('placeArt').getContext('2d'),selected,0,0,640,360);
  $('spotlightCount').textContent=number(stats?.places.find(p=>p.id===id)?.count);
  for(const row of document.querySelectorAll('.rank-row')) row.classList.toggle('selected',row.dataset.id===id);
}
function update(data) {
  stats=data;map.setCounts(data.places);
  $('total').textContent=number(data.total);$('today').textContent=number(data.todayTotal);
  $('venueTotal').textContent=number(data.places.filter(p=>p.kind==='venue').reduce((s,p)=>s+p.count,0));
  $('attractionTotal').textContent=number(data.places.filter(p=>p.kind==='attraction').reduce((s,p)=>s+p.count,0));
  $('empty').hidden=data.total>0;
  $('updated').textContent=data.updatedAt?'最近记录 '+time(data.updatedAt)+' · 已同步':'数据已连接 · 等待第一条游览';
  const rows=[...data.places].sort((a,b)=>b.count-a.count);
  const max=Math.max(1,...rows.map(p=>p.count));const list=$('ranking');list.replaceChildren();
  rows.forEach((p,i)=>{
    const row=document.createElement('button');row.type='button';row.className='rank-row';row.dataset.id=p.id;row.dataset.kind=p.kind;
    const index=document.createElement('span');index.className='rank-index';index.textContent=String(i+1).padStart(2,'0');
    const name=document.createElement('span');name.className='rank-name';name.append(document.createTextNode(p.name));
    const bar=document.createElement('i');bar.className='rank-bar';bar.style.width=`${p.count/max*100}%`;name.append(bar);
    const counts=document.createElement('span');counts.className='rank-values';const today=document.createElement('small');today.textContent=number(p.today)+' / ';counts.append(today,document.createTextNode(number(p.count)));
    row.append(index,name,counts);row.onclick=()=>select(p.id);list.append(row);
  });
  const recent=$('recent');recent.replaceChildren();
  if(!data.recent.length){const p=document.createElement('p');p.className='empty';p.textContent='暂时还没有游览记录';recent.append(p);}
  for(const event of data.recent.slice(0,3)){
    const row=document.createElement('div');row.className='recent-row';const name=document.createElement('span');name.textContent=places.find(p=>p.id===event.placeId)?.name || event.placeId;
    const stamp=document.createElement('time');stamp.textContent=time(event.at);stamp.dateTime=event.at;row.append(name,stamp);recent.append(row);
  }
  if(selected) select(selected.id);
}
async function boot(){
  const response=await fetch('/api/places');if(!response.ok) throw new Error('地点加载失败');
  places=(await response.json()).places;
  try { applyMapLayout(await fetchMapLayout()); } catch { /* map defaults stay available */ }
  map=createMapView($('displayMap'),{venues:places,onPick:select,heroVisible:false});map.fit();
  select(places[0].id);connectStats(update,text=>$('connection').textContent=text);
  $('zoomIn').onclick=()=>map.zoomBy(1.2);$('zoomOut').onclick=()=>map.zoomBy(1/1.2);$('fit').onclick=()=>map.fit();
  $('rotate').onclick=()=>{rotating=!rotating;$('rotate').textContent=rotating?'暂停轮播 Ⅱ':'继续轮播 ▷';$('rotate').setAttribute('aria-pressed',String(rotating));};
  setInterval(()=>{if(rotating){const index=places.findIndex(p=>p.id===selected?.id);select(places[(index+1)%places.length].id);}},12000);
  function draw(now){const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;map.update(dt);map.draw();requestAnimationFrame(draw);}requestAnimationFrame(draw);
}
function clock(){ $('clock').textContent=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' 北京时间'; }clock();setInterval(clock,1000);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement) await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').textContent='请使用浏览器全屏';}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏 ⤡':'进入全屏 ⤢';});
boot().catch(error=>{$('connection').textContent=error.message;});
