const KEY='cc2027:secret-collection:v1';
const safeArtwork=(url)=>/^\/data\/results\/[a-f0-9-]+\.(png|jpe?g|webp)$/i.test(url||'')?url:null;

function read(){
  try{
    const value=JSON.parse(localStorage.getItem(KEY)||'{"version":1,"items":[]}');
    return {version:1,items:Array.isArray(value.items)?value.items.filter((item)=>item&&typeof item.id==='string'):[]};
  }catch{return {version:1,items:[]};}
}
export function getSecretCollection(){return read();}

export function collectSecret(secret,{artworkUrl=null,seed=null}={}){
  if(!secret?.id)return read();
  const collection=read();
  if(!collection.items.some((item)=>item.id===secret.id)){
    collection.items.push({
      id:secret.id,secretId:secret.id,title:secret.title,tagline:secret.tagline,
      rarity:secret.rarity||'rare',tags:Array.isArray(secret.tags)?secret.tags:[],
      lore:secret.lore||'',discoveredAt:new Date().toISOString(),
      artworkUrl:safeArtwork(artworkUrl),seed:Number.isFinite(seed)?seed:null,
    });
    try{localStorage.setItem(KEY,JSON.stringify(collection));}catch{/* collection remains available for this session */}
  }
  return collection;
}
