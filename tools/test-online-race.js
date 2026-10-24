import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { randomBytes } from 'node:crypto';
import { createOnlineRace } from '../server/online-race.js';

const race=createOnlineRace();
const server=http.createServer(async(req,res)=>{if(req.method!=='POST'){res.writeHead(404).end();return;}let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body||'{}');if(input.action==='create'){res.writeHead(201,{'Content-Type':'application/json'}).end(JSON.stringify(race.create(input.name)));return;}const joined=race.join(input.roomCode,input.name,input.playerToken);res.writeHead(joined.error?joined.status:200,{'Content-Type':'application/json'}).end(JSON.stringify(joined.error?{error:joined.error}:{roomCode:joined.room.code,playerToken:joined.player.token,slot:joined.slot}));});
server.on('upgrade',(req,socket,head)=>race.upgrade(req,socket,head));
const clients=new Set();

function client(port,room){return new Promise((resolve,reject)=>{const socket=net.connect(port,'127.0.0.1');clients.add(socket);socket.once('close',()=>clients.delete(socket));let raw=Buffer.alloc(0),handshake=false,frames=Buffer.alloc(0);const messages=[];const waiters=[];const push=message=>{messages.push(message);for(let i=waiters.length-1;i>=0;i--){if(waiters[i].test(message)){const [waiter]=waiters.splice(i,1);waiter.resolve(message);}}};const parse=()=>{while(frames.length>=2){const opcode=frames[0]&15;const second=frames[1];let size=second&127,offset=2;if(size===126){if(frames.length<4)return;size=frames.readUInt16BE(2);offset=4;}if(frames.length<offset+size)return;const data=frames.subarray(offset,offset+size);frames=frames.subarray(offset+size);if(opcode===8)continue;try{push(JSON.parse(data.toString()));}catch{}}};socket.on('error',reject);socket.on('data',chunk=>{if(!handshake){raw=Buffer.concat([raw,chunk]);const boundary=raw.indexOf('\r\n\r\n');if(boundary<0)return;const response=raw.subarray(0,boundary).toString();if(!response.includes('101 Switching Protocols')){reject(new Error(response));return;}handshake=true;frames=raw.subarray(boundary+4);raw=Buffer.alloc(0);parse();resolve({socket,messages,waitFor(test,timeout=3000){const existing=messages.find(test);if(existing)return Promise.resolve(existing);return new Promise((ok,no)=>{const waiter={test,resolve:ok};waiters.push(waiter);setTimeout(()=>{const i=waiters.indexOf(waiter);if(i>=0)waiters.splice(i,1);no(new Error('Timed out waiting for WebSocket state'));},timeout).unref();});},send(value){const payload=Buffer.from(JSON.stringify(value));const mask=randomBytes(4);const head=Buffer.from([0x81,0x80|payload.length]);const masked=Buffer.from(payload);for(let i=0;i<masked.length;i++)masked[i]^=mask[i%4];socket.write(Buffer.concat([head,mask,masked]));}});}else{frames=Buffer.concat([frames,chunk]);parse();}});socket.on('connect',()=>socket.write(`GET /api/online-race/socket?room=${room.roomCode}&token=${room.playerToken} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${randomBytes(16).toString('base64')}\r\nSec-WebSocket-Version: 13\r\n\r\n`));});}

let port;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));port=server.address().port;
 const created=await (await fetch(`http://127.0.0.1:${port}/api/rooms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:'<小冰雪选手>123456789'})})).json();
 assert.equal(created.roomCode.length,6);assert.equal(created.slot,0);
 const joinedResponse=await fetch(`http://127.0.0.1:${port}/api/rooms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'join',roomCode:created.roomCode,name:'第二位',})});
 assert.equal(joinedResponse.status,200);const joined=await joinedResponse.json();assert.equal(joined.slot,1);
 const first=await client(port,created);const other=await client(port,joined);
 await Promise.all([first.waitFor(message=>message.type==='state'&&message.players.length===2),other.waitFor(message=>message.type==='state'&&message.players.length===2)]);
 first.send({type:'start'});
 const [a,b]=await Promise.all([first.waitFor(message=>message.phase==='running'),other.waitFor(message=>message.phase==='running')]);
 assert.equal(a.durationSeconds,20);assert.equal(b.players.length,2);
 first.send({type:'action',action:'left'});first.send({type:'action',action:'right'});
 await new Promise(resolve=>setTimeout(resolve,350));first.socket.destroy();
 const reconnected=await client(port,created);await reconnected.waitFor(message=>message.phase==='running');
 const startedAt=Date.now();const result=await other.waitFor(message=>message.phase==='finished',22000);
 assert.ok(Date.now()-startedAt>=19000,'round should last about 20 seconds');assert.equal(result.durationSeconds,20);assert.equal(result.players.length,2);
 reconnected.socket.destroy();other.socket.destroy();console.log('Online room, two-player WebSocket sync, reconnect, and 20-second server settlement passed.');
}finally{race.close();await Promise.all([...clients].map(socket=>new Promise(resolve=>{if(socket.closed)return resolve();socket.once('close',resolve);socket.destroy();})));server.close();}
