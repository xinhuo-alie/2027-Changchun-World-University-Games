// 城市地标独立插画；保留可识别的建筑或空间特征。
export function drawLandmark(ctx,id,{transparent=false}={}) {
  if(!transparent) {
    ctx.fillStyle='#e9f5f9';ctx.fillRect(0,0,160,110);
    ctx.fillStyle='#daeae9';ctx.beginPath();ctx.ellipse(80,103,95,26,0,0,7);ctx.fill();
  }
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const roof=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+w*.18,y+h*.35);ctx.lineTo(x+w*.5,y);ctx.lineTo(x+w*.82,y+h*.35);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill();};
  const windows=(x,y,n,color='#c0e4ef')=>{for(let i=0;i<n;i++)rect(x+i*13,y,7,10,color);};
  if(id==='palace'){
    rect(21,54,118,43,'#e0c6a4');roof(13,28,134,29,'#9a8057');roof(37,15,86,22,'#96734d');
    rect(37,58,86,5,'#fff8e4');windows(30,68,8,'#7e9d9d');rect(70,78,20,22,'#795f50');
    rect(10,98,140,5,'#c2ced0');rect(24,93,5,7,'#eff6f7');rect(131,93,5,7,'#eff6f7');
  } else if(id==='film'){
    rect(13,48,134,48,'#b77b66');rect(23,38,114,12,'#e8b49c');rect(9,93,142,7,'#e5d4c7');
    windows(26,57,9);windows(26,74,9);rect(70,67,20,29,'#5d6f7c');
    ctx.fillStyle='#3e6479';ctx.beginPath();ctx.arc(126,29,19,0,7);ctx.fill();
    for(let i=0;i<4;i++){ctx.fillStyle='#d7eef3';ctx.beginPath();ctx.arc(126+Math.cos(i*1.57)*10,29+Math.sin(i*1.57)*10,4,0,7);ctx.fill();}
  } else if(id==='mountainmall'){
    rect(9,16,142,83,'#adcbd3');rect(14,20,132,73,'#eff8f8');
    for(let i=0;i<4;i++){const x=20+i*18,y=79-i*16;rect(x,y,118-i*27,19,'#bf9464');rect(x+3,y+3,111-i*27,3,'#f4deb9');windows(x+5,y+8,Math.max(1,7-i*2),'#ffe2a0');}
    ctx.strokeStyle='#faf5df';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(18,95);ctx.lineTo(42,78);ctx.lineTo(58,66);ctx.lineTo(77,51);ctx.lineTo(85,33);ctx.stroke();
    rect(5,98,150,5,'#d7e9ec');
  } else if(id==='nanhu'){
    ctx.fillStyle='#9bd2e5';ctx.beginPath();ctx.ellipse(80,85,79,22,0,0,7);ctx.fill();
    for(const x of [24,109]){rect(x,55,27,28,'#d5b69a');roof(x-8,38,43,22,'#5f8b99');rect(x+5,63,6,19,'#7a6257');rect(x+18,63,5,19,'#7a6257');}
    ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(47,82);ctx.quadraticCurveTo(80,48,113,82);ctx.stroke();
  } else if(id==='culture'){
    ctx.fillStyle='#d9e6ec';ctx.beginPath();ctx.ellipse(80,97,62,8,0,0,7);ctx.fill();
    rect(65,89,30,8,'#a1b4c7');rect(76,52,8,38,'#9d829a');
    ctx.strokeStyle='#a18c9b';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(79,64);ctx.lineTo(53,42);ctx.moveTo(80,64);ctx.lineTo(109,42);ctx.stroke();
    ctx.fillStyle='#ba967d';ctx.beginPath();ctx.arc(80,42,9,0,7);ctx.fill();ctx.strokeStyle='#d8bb80';ctx.lineWidth=3;ctx.beginPath();ctx.arc(80,30,24,Math.PI,Math.PI*2);ctx.stroke();
    rect(8,73,30,23,'#bcccd5');rect(121,73,30,23,'#bcccd5');
  } else {
    rect(28,58,104,41,'#c5b4da');rect(16,47,23,52,'#ad9bc5');rect(122,47,23,52,'#ad9bc5');rect(64,33,33,66,'#d3c6e2');
    roof(11,27,33,22,'#7c8cba');roof(117,27,33,22,'#7c8cba');roof(58,9,45,28,'#879dc3');
    windows(41,69,6,'#f7e6b7');rect(72,76,18,23,'#5f7fa2');
  }
  if(!transparent) { ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(9,99,142,4); }
}
