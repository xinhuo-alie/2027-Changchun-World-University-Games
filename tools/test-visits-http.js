import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dir = await fs.mkdtemp(path.join(os.tmpdir(),'cc-visits-http-'));
const file = path.join(dir,'visits.json');
const child = spawn(process.execPath,['server/index.js'],{cwd:process.cwd(),env:{...process.env,PORT:'5181',VISITS_FILE:file},stdio:'ignore',windowsHide:true});
const base='http://127.0.0.1:5181';let reader;
try {
  let ready=false;
  for(let i=0;i<40;i++){try{ready=(await fetch(base+'/api/visits')).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'测试服务器启动');
  const places=await (await fetch(base+'/api/places')).json();assert.equal(places.places.length,16);
  for(const url of ['/','/display','/display.js','/city-map.js'])assert.equal((await fetch(base+url)).status,200);
  const stream=await fetch(base+'/api/visits/stream');assert.match(stream.headers.get('content-type'),/event-stream/);
  reader=stream.body.getReader();const decoder=new TextDecoder();
  assert.match(decoder.decode((await reader.read()).value),/"total":0/);
  const eventId=randomUUID();const body=JSON.stringify({placeId:'palace',eventId});
  const post=()=>fetch(base+'/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body});
  assert.equal((await post()).status,200);
  const pushed=decoder.decode((await reader.read()).value);assert.match(pushed,/"total":1/);
  assert.equal((await (await post()).json()).total,1);
  const invalid=await fetch(base+'/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeId:'unknown',eventId:randomUUID()})});
  assert.equal(invalid.status,400);
  const reconnected=await fetch(base+'/api/visits/stream');const second=reconnected.body.getReader();
  assert.match(decoder.decode((await second.read()).value),/"total":1/);await second.cancel();
  console.log('通过：地点与大屏路由、SSE 即时推送及重连快照、HTTP 重试去重、无效事件校验。独立测试端口与临时统计文件。');
} finally {
  await reader?.cancel();child.kill();await new Promise(r=>child.once('exit',r));
  await fs.unlink(file).catch(()=>{});await fs.rmdir(dir);
}
