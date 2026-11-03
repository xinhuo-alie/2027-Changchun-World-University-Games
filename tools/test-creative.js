import assert from 'node:assert/strict';
import { buildPrompt, describeFigurineCreative, describeFigurineSelection } from '../server/styles.js';
import {
  CREATIVE_GROUPS, CREATIVE_GENDER_OPTIONS, DEFAULT_CREATIVE, normalizeCreative,
  recommendCreativeForSport, recommendCreativeForTheme, clearCreativeDetails,
} from '../web/creative-config.js';
import { buildCreativePrompt, resolveCreativeGender } from '../web/creative-prompt.js';
import { randomizeCreative, randomizeCompanion, createSeededRandom, getVariationSummary } from '../web/avatar-randomizer.js';
import { SECRET_AVATAR_CHANCE, SECRET_AVATARS, drawSecret, applySecretCreative } from '../web/secret-avatars.js';

const legacy = normalizeCreative({ vibe:'retro', sport:'curling', scene:'aurora', details:'白色波点发饰，挥手微笑' });
assert.equal(legacy.theme,'retro'); assert.equal(legacy.vibe,'retro'); assert.equal(legacy.sport,'curling');
assert.equal(legacy.details,'白色波点发饰，挥手微笑');
assert.equal(normalizeCreative(JSON.parse(JSON.stringify(legacy))).details,legacy.details);
assert.deepEqual(CREATIVE_GENDER_OPTIONS.map((item)=>item.id),['male','female','random']);
assert.equal(DEFAULT_CREATIVE.version,3); assert.equal(DEFAULT_CREATIVE.stylePreset,'event-showcase');
assert.equal(DEFAULT_CREATIVE.facePreservation,'high'); assert.equal(DEFAULT_CREATIVE.companion.enabled,false);
assert.equal(normalizeCreative({...DEFAULT_CREATIVE,stylePreset:'hidden-collectible'}).stylePreset,'event-showcase','隐藏款不能通过风格选项直接选择');
assert.equal(normalizeCreative({style:'watercolor',outfit:'hanfu'}).outfit,'hanfu','旧用户服装选择在迁移后保留');
assert.equal(normalizeCreative({companion:{type:'机器人'}}).companion.enabled,false,'旧存档不会自动开启伙伴');
assert.equal(normalizeCreative({...DEFAULT_CREATIVE,companion:{enabled:true}}).companion.blueprint,null,'伙伴开关允许先处于空状态');
assert.equal(normalizeCreative({...DEFAULT_CREATIVE,companion:{enabled:true,type:'<script>',blueprint:{signatureFeature:'<script>'}}}).companion.type,null,'伙伴类型需验证');
assert.ok(!normalizeCreative({...DEFAULT_CREATIVE,companion:{enabled:true,type:'水晶生物',blueprint:{signatureFeature:'<script>'}}}).companion.blueprint.signatureFeature.includes('<'));
assert.equal(normalizeCreative(normalizeCreative({world:'dream-fracture'})).world,'dream-fracture','迁移重复执行保持一致');
assert.deepEqual([DEFAULT_CREATIVE.style,DEFAULT_CREATIVE.theme,DEFAULT_CREATIVE.sport,DEFAULT_CREATIVE.outfit],['anime','anime','character','anime-school']);
assert.ok(CREATIVE_GROUPS.style.length>=25 && CREATIVE_GROUPS.theme.length>=30,'主题目录覆盖多种非冰雪题材');
assert.equal(CREATIVE_GROUPS.theme.filter((item)=>/冬日|雪域|冰雪|极地|极光/.test(item.label)).length,1,'冰雪主题保留一个主选项');

assert.equal(normalizeCreative({gender:'other'}).gender,'random');
assert.equal(resolveCreativeGender({gender:'male'}),'male');
assert.equal(resolveCreativeGender({gender:'female'}),'female');
assert.equal(resolveCreativeGender({gender:'random',metadata:{randomSeed:72}}),resolveCreativeGender({gender:'random',metadata:{randomSeed:72}}));
assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,gender:'male'}).includes('不得生成女性角色'));
assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,gender:'female'}).includes('不得生成男性角色'));

const unsafe=normalizeCreative({style:'invalid',sport:'bad',theme:'bad',accessories:['scarf','gloves','ice-pin'],effects:['snowflakes','mist','none'],details:'<script>\n'+'x'.repeat(500)});
assert.equal(unsafe.style,DEFAULT_CREATIVE.style); assert.equal(unsafe.sport,DEFAULT_CREATIVE.sport);
assert.equal(unsafe.accessories.length,2,'随身小物最多两项'); assert.deepEqual(unsafe.effects,['none']);
assert.ok(!unsafe.details.includes('<') && unsafe.details.length<=180);

// Only the selected core fields and small optional accents reach the prompt.
for(const group of ['style','theme','sport','outfit','palette']) for(const item of CREATIVE_GROUPS[group]) {
  const prompt=buildCreativePrompt({...DEFAULT_CREATIVE,[group]:item.id});
  assert.ok(prompt.includes(item.prompt),`核心提示词缺少 ${group}/${item.id}`);
  if(group==='style') assert.ok(prompt.startsWith(`最高优先级的艺术表现：${item.label}。${item.prompt}`),`画风应主导整体表现 ${item.id}`);
}
for(const group of ['scene','hairstyle','headwear','expression','material','effect','composition']) {
  const item=CREATIVE_GROUPS[group][0];
  const prompt=buildCreativePrompt({...DEFAULT_CREATIVE,[group]:item.id});
  if(group==='hairstyle'||group==='expression') assert.ok(prompt.includes(item.prompt),`随机造型应采用适中细节 ${group}/${item.id}`);
  else assert.ok(!prompt.includes(item.prompt),`精简提示词不应额外加入 ${group}/${item.id}`);
}
const accessory=CREATIVE_GROUPS.accessory.find((item)=>item.id==='camera');
assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,accessories:['camera']}).includes(accessory.prompt));
assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,accessories:['camera','plush-cat','scarf']}).includes(accessory.prompt));
assert.ok(!buildCreativePrompt({...DEFAULT_CREATIVE,accessories:['camera','plush-cat','scarf']}).includes(CREATIVE_GROUPS.accessory.find((item)=>item.id==='scarf').prompt));

const defaultPrompt=buildCreativePrompt({...DEFAULT_CREATIVE,metadata:{randomSeed:100}});
assert.ok(!defaultPrompt.includes('雪花')&&!defaultPrompt.includes('冰晶')&&!defaultPrompt.includes('围巾'),'普通动漫主题不应继承冰雪模板');
assert.match(defaultPrompt,/保留参考照片中可辨认的身份特征/);
assert.match(defaultPrompt,/不要额外生成第二角色、伙伴、宠物、机器人、玩偶或漂浮生物/);
assert.doesNotMatch(defaultPrompt,/小型伙伴从|机器人花篮|迷你萌物/);
for(const item of CREATIVE_GROUPS.world) assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,world:item.id}).includes(item.prompt),`奇幻世界进入提示词：${item.id}`);
const companionCreative={...DEFAULT_CREATIVE,companion:{enabled:true,type:'水晶生物',archetype:'守护者',blueprint:{silhouette:'多面晶体',bodyStructure:'无头悬浮结构',material:'水晶玻璃',signatureFeature:'环形晶冠'}}};
assert.match(buildCreativePrompt(companionCreative),/用户主动选择的伙伴：水晶生物/);
assert.doesNotMatch(buildCreativePrompt({...companionCreative,companion:{enabled:false}}),/多面晶体|环形晶冠/);
assert.equal(buildCreativePrompt({...DEFAULT_CREATIVE,gender:'male'}).includes('不得生成女性角色'),true);

assert.equal(normalizeCreative({...DEFAULT_CREATIVE,theme:'cosplay-hero'}).theme,DEFAULT_CREATIVE.theme,'旧存档中的已移除主题安全回退');
assert.ok(!Object.hasOwn(normalizeCreative({cosplayCharacter:'原神·胡桃'}),'cosplayCharacter'),'旧指定角色文本不再进入新配置');

const selected=describeFigurineCreative({...legacy,pose:'curling-throw',outfit:'academy-uniform',palette:'mint',accessories:['mini-curling']});
for(const phrase of ['复古运动','冰壶','现代学院制服','以明亮酸橙绿']) assert.ok(selected.includes(phrase),`缺少主要选择：${phrase}`);
const oldOutfit={parts:{coat:'down'},colors:{hat:'#123456',coat:'#123456',pants:'#123456',boots:'#123456'}};
assert.ok(describeFigurineSelection({...DEFAULT_CREATIVE,outfit:'street-hoodie',palette:'berry',style:'watercolor'},oldOutfit).includes('宽松街头运动卫衣'));
assert.ok(describeFigurineSelection(null,oldOutfit).includes('#123456'));
assert.equal(recommendCreativeForSport(DEFAULT_CREATIVE,'hockey').outfit,DEFAULT_CREATIVE.outfit,'运动切换保留手动服装');
assert.equal(recommendCreativeForSport(DEFAULT_CREATIVE,'skate').pose,DEFAULT_CREATIVE.pose,'运动切换保留手动动作');
assert.equal(recommendCreativeForTheme(DEFAULT_CREATIVE,'streamer').outfit,DEFAULT_CREATIVE.outfit,'主题切换保留手动服装');
assert.deepEqual(recommendCreativeForTheme({...DEFAULT_CREATIVE,accessories:['scarf']},'dream-career').accessories,['scarf']);
assert.equal(recommendCreativeForSport({...DEFAULT_CREATIVE,theme:'mecha-pilot'},'character').outfit,DEFAULT_CREATIVE.outfit);
for(const theme of ['anime','halloween','punk','gothic','idol','space','hanfu-illusionist','dream-career','animal-guardian','deep-sea-mail','cloud-chef','mecha-pilot','magical-idol','time-runner','dino-pal','cyber-detective','streamer','urban-legend','magical-girl']) assert.ok(CREATIVE_GROUPS.theme.some((item)=>item.id===theme),`缺少主题 ${theme}`);

const randomBase={...DEFAULT_CREATIVE,accessories:['scarf'],details:'保留这句描述'};
const locked=randomizeCreative(randomBase,{mode:'details-only',lockKeys:['style','sport','theme','outfit','accessories'],seed:17,recent:[]});
for(const key of ['style','sport','theme','outfit']) assert.equal(locked[key],randomBase[key],`${key}主要选择被保留`);
assert.deepEqual(locked.accessories,randomBase.accessories); assert.equal(locked.details,randomBase.details);
assert.deepEqual(randomizeCreative(randomBase,{mode:'all',seed:22,recent:[]}),randomizeCreative(randomBase,{mode:'all',seed:22,recent:[]}));
assert.deepEqual(randomizeCompanion('机械生命',321),randomizeCompanion('机械生命',321));
assert.ok(randomizeCompanion('机械生命',321).silhouette&&randomizeCompanion('机械生命',321).bodyStructure&&randomizeCompanion('机械生命',321).signatureFeature);
const variants=[101,202,303,404,505].map((seed)=>randomizeCreative(DEFAULT_CREATIVE,{lockKeys:['style','theme','sport','outfit'],seed,recent:[]}));
assert.ok(new Set(variants.map((item)=>`${item.palette}|${item.accessories.join(',')}|${item.pose}|${item.hairstyle}|${item.expression}`)).size>1,'随机搭配会变化适中数量的提示词细节');
assert.ok(new Set(variants.map((item)=>item.hairstyle)).size>1&&new Set(variants.map((item)=>item.expression)).size>1,'随机发型和表情具有变化');
assert.ok(variants.every((item)=>item.accessories.length<=2));
assert.ok(variants.every((item)=>buildCreativePrompt(item).includes(`灵感号 ${item.metadata.randomSeed}`)));
assert.ok(getVariationSummary(DEFAULT_CREATIVE,variants[0]).includes('灵感号'));
assert.equal(createSeededRandom(1234)(),createSeededRandom(1234)());
for(let seed=1;seed<=100;seed++){
  const first=randomizeCreative({...DEFAULT_CREATIVE,companion:{enabled:false}}, {lockKeys:['style','theme','sport','outfit'],seed,recent:[]});
  const same=randomizeCreative({...DEFAULT_CREATIVE,companion:{enabled:false}}, {lockKeys:['style','theme','sport','outfit'],seed,recent:[]});
  assert.deepEqual(first,same,`seed ${seed} 蓝图应可复现`);
  assert.equal(first.companion.enabled,false,`seed ${seed} 不得自动打开伙伴`);
  assert.ok(!first.accessories.some((id)=>['plush-toy','plush-bear','plush-fox','plush-cat','plush-rabbit','plush-penguin','plush-bat','toy-robot','dino-buddy','cloud-companion','gear-drone'].includes(id)),`seed ${seed} 不得随机伙伴配件`);
}

const legacyRole=normalizeCreative({cosplayCharacter:'原神·胡桃',theme:'cosplay-hero'});
assert.equal(legacyRole.theme,DEFAULT_CREATIVE.theme);
assert.ok(!Object.hasOwn(legacyRole,'cosplayCharacter'));
assert.equal(SECRET_AVATARS.length,10); assert.equal(SECRET_AVATAR_CHANCE,.05);
assert.deepEqual(SECRET_AVATARS.map((item)=>item.id),['aurora-fox','snowball-magician','crystal-knight','snowfield-guardian','nebula-dreamweaver','mecha-moon-rabbit','mushroom-forest-sprite','chrono-courier','mirror-sea-singer','crown-comet-dragon']);
assert.deepEqual(SECRET_AVATARS.reduce((out,item)=>(out[item.rarity]=(out[item.rarity]||0)+1,out),{}),{rare:4,epic:4,legendary:2});
for(const secret of SECRET_AVATARS) assert.ok(secret.tags.length&&secret.lore&&secret.silhouetteHint&&secret.revealTitle,`缺少收藏档案字段：${secret.id}`);
assert.equal(drawSecret({random:()=>0,excludedIds:SECRET_AVATARS.map((item)=>item.id)}),null);
assert.ok(drawSecret({random:()=>.049})?.id); assert.equal(drawSecret({random:()=>.05}),null);
const hiddenApplied=applySecretCreative({...DEFAULT_CREATIVE,theme:'streamer',outfit:'hanfu',metadata:{manualLocks:['theme','outfit','details']}},SECRET_AVATARS.find((item)=>item.id==='snowfield-guardian'));
assert.equal(hiddenApplied.theme,'streamer','隐藏款不覆盖用户手动主题'); assert.equal(hiddenApplied.outfit,'hanfu','隐藏款不覆盖用户手动服装');
assert.equal(hiddenApplied.companion.enabled,false); assert.doesNotMatch(buildCreativePrompt(hiddenApplied),/小型伙伴从|跟着围巾云朵精灵|用户主动选择的伙伴/);
for(const secret of SECRET_AVATARS) assert.ok(CREATIVE_GROUPS.theme.some((item)=>item.id===secret.creative.theme),`隐藏角色主题无效：${secret.id}`);

const finalPrompt=buildPrompt({styleId:'avatar',purpose:'figurine',extra:buildCreativePrompt({...DEFAULT_CREATIVE,style:'watercolor'})});
assert.ok(finalPrompt.includes('人物面部身份必须保持'));
assert.ok(finalPrompt.includes('脸必须仍然像上传照片中的本人'));
assert.ok(finalPrompt.includes('儿童绘本水彩插画'));
assert.ok(finalPrompt.includes('#FF00FF'));
assert.ok(!finalPrompt.includes('脚踩两条独立短滑雪板'));
const malformedPartnerPrompt=buildPrompt({styleId:'avatar',purpose:'figurine',creative:{...DEFAULT_CREATIVE,companion:{enabled:true,type:'<script>',blueprint:{signatureFeature:'恶意文本'}}},extra:buildCreativePrompt({...DEFAULT_CREATIVE,companion:{enabled:true,type:'<script>',blueprint:{signatureFeature:'恶意文本'}}})});
assert.match(malformedPartnerPrompt,/不要额外生成第二角色/); assert.doesNotMatch(malformedPartnerPrompt,/用户主动选择的伙伴：<script>/);
console.log('角色工坊核心选项、多领域主题、旧主题兼容、精简提示词、随机锁和隐藏款检查通过');

for (const style of ['portrait-photo','oil-paint','woodblock','comic-pop','pencil-sketch','watercolor','anime']) {
  const creative = {...DEFAULT_CREATIVE, style};
  const finalPrompt = buildPrompt({styleId:'avatar', purpose:'figurine', creative, extra:describeFigurineSelection(creative)});
  assert.ok(finalPrompt.includes(CREATIVE_GROUPS.style.find(item=>item.id===style).prompt), style);
  assert.doesNotMatch(finalPrompt, /旧工坊画风辅助参考|画风、主题、服装、配色和运动选项仅作次要参考|避免出现：写实照片/);
  assert.match(finalPrompt, /纯洋红色|纯色洋红/);
}
