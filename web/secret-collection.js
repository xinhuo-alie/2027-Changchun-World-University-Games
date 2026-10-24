const KEY='cc2027:secret-collection:v1';
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{"version":1,"items":[]}');return {version:1,items:Array.isArray(x.items)?x.items:[]};}catch{return {version:1,items:[]};}}
export function getSecretCollection(){return read();}
export function collectSecret(secret,{artworkUrl=null,seed=null}={}){
  if(!secret?.id)return read();const collection=read();
  if(!collection.items.some((x)=>x.id===secret.id)) collection.items.push({id:secret.id,title:secret.title,tagline:secret.tagline,discoveredAt:new Date().toISOString(),artworkUrl:/^\/data\/results\/[a-f0-9-]+\.(png|jpe?g|webp)$/.test(artworkUrl||'')?artworkUrl:null,seed:Number.isFinite(seed)?seed:null});
  try{localStorage.setItem(KEY,JSON.stringify(collection));}catch{/* session still works */}
  return collection;
}
