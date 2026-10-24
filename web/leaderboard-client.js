const PLAYER_KEY='cc2027:game-player:v1';
const LOCAL_KEY='cc2027:game-history:v1';
async function request(url,options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2200);try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}}
function identity(){try{let value=JSON.parse(localStorage.getItem(PLAYER_KEY)||'null');if(value?.id&&value?.name)return value;value={id:crypto.randomUUID(),name:`冰雪选手-${Math.random().toString(36).slice(2,6).toUpperCase()}`};localStorage.setItem(PLAYER_KEY,JSON.stringify(value));return value;}catch{return {id:`local-${Date.now()}`,name:'冰雪选手'};}}
const player=identity();
function readLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]')}catch{return []}}
export function saveLocalResult(result){const history=[result,...readLocal()].slice(0,200);try{localStorage.setItem(LOCAL_KEY,JSON.stringify(history))}catch{}return history;}
export function getLocalPlayer(){return {...player};}
export async function submitGameResult(result){const complete={...result,playerId:player.id,displayName:result.displayName||player.name};saveLocalResult(complete);try{const response=await request('/api/game-results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...complete,clientVersion:'stage6-v1'})});if(!response.ok)throw new Error('暂时无法同步');return await response.json()}catch{return {ok:false,local:true,message:'暂时无法同步，成绩已保存在本机'};}}
export async function fetchLeaderboard(gameId,period='all-time'){try{const response=await request(`/api/leaderboards?gameId=${encodeURIComponent(gameId)}&mode=ranked-solo&period=${period}&playerId=${encodeURIComponent(player.id)}`);if(!response.ok)throw new Error();return await response.json()}catch{return {ok:false,entries:[],message:'暂时无法同步'}}}
export async function fetchOverallLeaderboard(period='all-time'){try{const response=await request(`/api/leaderboards?view=overall&period=${period}&playerId=${encodeURIComponent(player.id)}`);if(!response.ok)throw new Error();return await response.json()}catch{return {ok:false,entries:[],message:'暂时无法同步'}}}
export async function fetchGameHistory(gameId){return readLocal().filter(item=>!gameId||item.gameId===gameId).slice(0,20);}
