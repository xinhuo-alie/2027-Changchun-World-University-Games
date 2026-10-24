import { normalizeCreative } from './creative-config.js';

export const SECRET_AVATAR_CHANCE = .02;
export const SECRET_AVATARS = Object.freeze([
  { id:'aurora-fox', title:'极光狐', theme:'aurora-spirit', sport:'snow-adventure', outfit:'animal-hood', headwear:'cat-ears', accessories:['ice-cape','ice-pin'], expression:'surprised', pose:'wave', palette:'blue-purple', material:'translucent-ice', effects:['aurora-ring','starlight'], tagline:'极光沿着雪原留下了闪烁的足迹。' },
  { id:'crystal-knight', title:'冰晶骑士', theme:'guardian', sport:'short-track', outfit:'champion-uniform', headwear:'helmet', accessories:['ice-cape','snow-badge'], expression:'focus', pose:'champion', palette:'black-silver', material:'crystal', effects:['starlight'], tagline:'冰晶护甲映出坚定的赛场目光。' },
  { id:'snowfield-guardian', title:'雪域守护灵', theme:'polar', sport:'snow-adventure', outfit:'polar-suit', headwear:'hood', accessories:['backpack','ice-cape'], expression:'gentle', pose:'wave', palette:'mint', material:'knit', effects:['snowflakes','mist'], tagline:'林海深处，守护雪原的伙伴现身了。' },
  { id:'snowball-magician', title:'雪团魔法师', theme:'fairytale', sport:'leisure', outfit:'plush-suit', headwear:'bear-ears', accessories:['plush-toy','ice-pin'], expression:'wink', pose:'snowball', palette:'cream', material:'plush', effects:['snowflakes','starlight'], tagline:'一团轻盈的雪花变成了魔法礼物。' },
].map((item)=>Object.freeze({...item, creative:normalizeCreative({...item,style:'game-chibi',scene:'crystal-palace',composition:'full-body'})})));

export function drawSecret({random=Math.random, chance=SECRET_AVATAR_CHANCE, excludedIds=[]}={}) {
  const excluded=new Set(excludedIds);
  const available=SECRET_AVATARS.filter((item)=>!excluded.has(item.id));
  if(!available.length||random()>=chance)return null;
  return available[Math.floor(random()*available.length)];
}
export function applySecretCreative(base, secret) {
  if(!secret)return normalizeCreative(base);
  return normalizeCreative({...base,...secret.creative,metadata:base?.metadata,details:[base?.details,`原创隐藏主题「${secret.title}」：${secret.tagline}。保持用户本人身份特征、全身 Q 版角色与原纯色抠图幕，不绘制官方吉祥物或赛事标识。`].filter(Boolean).join(' ')});
}
