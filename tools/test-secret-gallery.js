import assert from 'node:assert/strict';
import { SECRET_AVATARS, LEGACY_SECRET_AVATARS, SECRET_AVATAR_CHANCE, drawSecret } from '../web/secret-avatars.js';
import { collectSecret, getSecretCollection } from '../web/secret-collection.js';
import { secretAchievements, secretMilestone, secretRank } from '../web/secret-gallery.js';

const values=new Map();
globalThis.localStorage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
values.set('cc2027:secret-collection:v1',JSON.stringify({version:1,items:[{id:'old-saved-secret',title:'旧存档角色',seed:88,artworkUrl:'/data/results/abc-123.png'}]}));
let collection=getSecretCollection();
assert.equal(collection.items.length,1,'旧版收藏记录保留');
assert.equal(collection.items[0].seed,88);
assert.equal(SECRET_AVATARS.length,10);
assert.equal(LEGACY_SECRET_AVATARS.length,8,'旧版图鉴定义保留供历史档案兼容');
assert.deepEqual(LEGACY_SECRET_AVATARS.map((item)=>item.id),['dunhuang-star-messenger','neon-nian-beast','deepsea-whale-post','clockwork-cloud-runner','moon-palace-rabbit','pocket-dino-archivist','candy-comet-idol','mushroom-night-oracle']);
assert.equal(SECRET_AVATAR_CHANCE,.05);

const first=SECRET_AVATARS[0];
collection=collectSecret(first,{artworkUrl:'/data/results/abc-123.png',seed:314});
assert.equal(collection.items.length,2);
assert.equal(collection.items[1].secretId,first.id);
assert.equal(collection.items[1].seed,314);
assert.equal(collection.items[1].artworkUrl,'/data/results/abc-123.png');
assert.equal(collection.items[1].rarity,first.rarity);
assert.equal(collectSecret(first,{seed:999}).items.length,2,'重复获得不重复计数，也不覆盖首获信息');
assert.equal(collectSecret(SECRET_AVATARS[1],{artworkUrl:'https://example.invalid/x.png'}).items[2].artworkUrl,null,'不接受外部作品地址');

assert.equal(secretRank(0),'初入秘藏');
assert.equal(secretRank(3),'奇遇收藏家');
assert.equal(secretRank(6),'雪域寻宝者');
assert.equal(secretRank(9),'传说追寻者');
assert.equal(secretRank(10),'秘藏大师');
assert.equal(secretMilestone(1),'初见奇遇！第一款隐藏角色已入藏。');
assert.equal(secretMilestone(3),'三款秘藏集结，收藏家之路开始发光。');
assert.equal(secretMilestone(10),'图鉴圆满！十款秘藏已全部集齐。');
assert.equal(secretMilestone(4),null);
let achievements=secretAchievements([],SECRET_AVATARS);
assert.equal(achievements.filter((item)=>item.done).length,0);
achievements=secretAchievements([first.id,'snowball-magician','mirror-sea-singer'],SECRET_AVATARS);
assert.equal(achievements.find((item)=>item.id==='first').done,true);
assert.equal(achievements.find((item)=>item.id==='double').done,true);
assert.equal(achievements.find((item)=>item.id==='legendary').done,true);

let seed=20261026;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
const totals={rare:0,epic:0,legendary:0};
for(let i=0;i<10000;i++){const secret=drawSecret({random});if(secret)totals[secret.rarity]++;}
assert.ok(totals.rare>totals.epic&&totals.epic>totals.legendary,`稀有度权重不递减：${JSON.stringify(totals)}`);

console.log('隐藏角色十款目录、旧存档兼容、收藏元数据、成就和稀有度权重检查通过');
