// 城市导览示意底图：道路、街区与公园使用同一世界坐标，随地图平移缩放。
export function drawCityMap(ctx, project, scale, size) {
  ctx.fillStyle = '#e9f1eb'; ctx.fillRect(0, 0, size.w, size.h);
  const box = (x,z,w,h,color,r=12) => { const p=project(x,z); ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(p.x,p.y,w*scale,h*scale,r*scale); ctx.fill(); };
  for(let row=-5;row<8;row++) for(let col=-5;col<9;col++) {
    const x=col*110,z=row*105;
    const park=(row+col)%5===0;
    box(x+9,z+9,92,87,park?'#d8eadd':(row-col)%3===0?'#e8e6dc':'#dce8e6',9);
    if(!park) {
      box(x+18,z+18,28+(col+12)%3*7,20,'#f8f6eb',3);
      if((row-col)%3===0) box(x+62,z+45,23,27,'#f8f6eb',3);
    }
  }
  box(-290,125,175,160,'#cbe4d2',32);
  box(210,150,175,300,'#c8e2d1',42);
  box(420,-180,180,200,'#d4e8d5',35);
  const lake=(x,z,rx,ry)=>{const p=project(x,z);ctx.fillStyle='#b6deee';ctx.strokeStyle='#96ccdf';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*scale,ry*scale,-.3,0,Math.PI*2);ctx.fill();ctx.stroke();};
  lake(-210,205,62,46); lake(325,260,40,80); lake(690,320,57,34);
  // 冬日手绘地图的松树与脚印：固定坐标绘制，缩放时仍贴着街区。
  const fir=(x,z,k=1)=>{const p=project(x,z);const h=18*scale*k;if(h<2||h>90)return;
    ctx.fillStyle='#8fb9a3';ctx.strokeStyle='#6c9b8c';ctx.lineWidth=Math.max(.6,scale*.7);
    ctx.beginPath();ctx.moveTo(p.x,p.y-h*.9);ctx.lineTo(p.x-h*.38,p.y+h*.1);ctx.lineTo(p.x+h*.38,p.y+h*.1);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x,p.y-h*.55);ctx.lineTo(p.x-h*.5,p.y+h*.36);ctx.lineTo(p.x+h*.5,p.y+h*.36);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#78988a';ctx.beginPath();ctx.moveTo(p.x,p.y+h*.34);ctx.lineTo(p.x,p.y+h*.65);ctx.stroke();};
  for(let row=-5;row<8;row++)for(let col=-5;col<9;col++)if((row+col)%5===0){
    const x=col*110,z=row*105;
    fir(x+35,z+34,.78);fir(x+68,z+56,.6);if((row-col)%2===0)fir(x+70,z+25,.48);
  }
  for(const [x,z] of [[-270,170],[-170,155],[-285,275],[245,180],[355,195],[230,330],[365,415],[445,-145],[565,-80]])fir(x,z,1.15);
  const line=(points,width,color)=>{ctx.beginPath();points.forEach(([x,z],i)=>{const p=project(x,z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,width*scale);ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();};
  for(let x=-550;x<1000;x+=110)line([[x,-650],[x,850]],12,'#fffdf5');
  for(let z=-525;z<850;z+=105)line([[-550,z],[1000,z]],12,'#fffdf5');
  const roads=[{p:[[-105,-600],[-105,-190],[-35,40],[20,250],[95,720]],n:'人民大街',x:-100,z:-360},
    {p:[[-550,-210],[-120,-210],[180,-150],[550,-130],[950,-120]],n:'解放大路',x:-390,z:-220},
    {p:[[-550,10],[-150,10],[200,70],[540,140],[950,180]],n:'自由大路',x:-220,z:12},
    {p:[[190,-550],[190,-220],[265,50],[390,280],[520,620]],n:'净月大街',x:376,z:115}];
  for(const road of roads){line(road.p,20,'#bfcec8');line(road.p,15,'#fffdf5');}
  line([[460,-170],[570,-60],[650,120],[760,300],[780,620]],13,'#c7d5e3');
  line([[460,-170],[570,-60],[650,120],[760,300],[780,620]],8,'#fffdf5');
  ctx.save();ctx.setLineDash([5,5]);line([[-440,-300],[-320,-60],[-190,40],[80,180],[300,350]],2,'#95bab5');ctx.restore();
  ctx.textAlign='center';ctx.font='11px system-ui';ctx.fillStyle='#849aa6';
  for(const road of roads){const p=project(road.x,road.z);ctx.fillText(road.n,p.x,p.y);}
  for(const [name,x,z] of [['朝阳区',-330,290],['南关区',90,170],['净月片区',420,420],['宽城区',10,-350],['吉林市分区',720,80]]){
    const p=project(x,z);ctx.fillStyle='#91a7b4';ctx.font='600 14px system-ui';ctx.fillText(name,p.x,p.y);
  }
  // 少量雪粒只作为底图质感，保持街道与标记清晰。
  ctx.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<45;i++){const p=project((i*193)%1500-500,(i*137)%1200-500);ctx.beginPath();ctx.arc(p.x,p.y,1.2,0,7);ctx.fill();}
}
