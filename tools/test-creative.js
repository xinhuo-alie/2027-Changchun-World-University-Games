import assert from 'node:assert/strict';
import { buildPrompt, describeFigurineCreative, describeFigurineSelection } from '../server/styles.js';
import {
  CREATIVE_GROUPS, CREATIVE_GENDER_OPTIONS, CREATIVE_PRESETS, DEFAULT_CREATIVE, normalizeCreative,
  applyCreativePreset, randomCreative, recommendCreativeForSport, clearCreativeDetails,
} from '../web/creative-config.js';
import { buildCreativePrompt, resolveCreativeGender } from '../web/creative-prompt.js';
import { randomizeCreative, createSeededRandom } from '../web/avatar-randomizer.js';
import { SECRET_AVATAR_CHANCE, SECRET_AVATARS, drawSecret } from '../web/secret-avatars.js';

// 旧版 cc2027:creative 结构读取时保留主题别名并填入新选项默认值。
const legacy = normalizeCreative({ vibe:'retro', sport:'curling', scene:'aurora', details:'白色波点发饰，挥手微笑' });
assert.equal(legacy.theme, 'retro'); assert.equal(legacy.vibe, 'retro'); assert.equal(legacy.sport, 'curling');
assert.equal(legacy.scene, 'aurora'); assert.equal(legacy.details, '白色波点发饰，挥手微笑');
assert.equal(normalizeCreative(JSON.parse(JSON.stringify(legacy))).details, legacy.details, '新结构可序列化并重新读取');
assert.deepEqual(CREATIVE_GENDER_OPTIONS.map((item) => item.id), ['male','female','random']);
assert.equal(normalizeCreative({gender:'other'}).gender, 'random', '未支持的性别值回退为随机');
assert.equal(resolveCreativeGender({gender:'male'}), 'male');
assert.equal(resolveCreativeGender({gender:'female'}), 'female');
const randomGenderA = resolveCreativeGender({gender:'random',metadata:{randomSeed:72}});
const randomGenderB = resolveCreativeGender({gender:'random',metadata:{randomSeed:72}});
assert.equal(randomGenderA, randomGenderB, '随机性别由本次生成种子稳定确定');
assert.ok(['male','female'].includes(randomGenderA), '随机性别会在生成前确定为男或女');
assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,gender:'male'}).includes('不得生成女性角色'));
assert.ok(buildCreativePrompt({...DEFAULT_CREATIVE,gender:'female'}).includes('不得生成男性角色'));
const randomSeededCreative = {...DEFAULT_CREATIVE,gender:'random',metadata:{randomSeed:72}};
const randomSeededPrompt = buildCreativePrompt(randomSeededCreative);
assert.ok(randomSeededPrompt.includes(randomGenderA === 'male' ? '不得生成女性角色' : '不得生成男性角色'), '随机性别提示与本次生成种子一致');
const maleFinalPrompt = buildPrompt({styleId:'avatar',purpose:'figurine',creative:{...DEFAULT_CREATIVE,gender:'male'},extra:buildCreativePrompt({...DEFAULT_CREATIVE,gender:'male'})});
assert.ok(maleFinalPrompt.includes('最终性别检查：角色整体必须呈现为男性') && maleFinalPrompt.includes('不得生成女性角色'), '最终生成请求重复确认用户选择的男性性别');
const femaleFinalPrompt = buildPrompt({styleId:'avatar',purpose:'figurine',creative:{...DEFAULT_CREATIVE,gender:'female'},extra:buildCreativePrompt({...DEFAULT_CREATIVE,gender:'female'})});
assert.ok(femaleFinalPrompt.includes('最终性别检查：角色整体必须呈现为女性') && femaleFinalPrompt.includes('不得生成男性角色'), '最终生成请求重复确认用户选择的女性性别');

const unsafe = normalizeCreative({ style:'invalid', sport:'bad', theme:'bad', scene:'bad', accessories:['scarf','gloves','ice-pin','medal'], effects:['snowflakes','mist','trail','none'], details:'<script>\n' + 'x'.repeat(500) });
assert.equal(unsafe.style, DEFAULT_CREATIVE.style); assert.equal(unsafe.sport, DEFAULT_CREATIVE.sport);
assert.equal(unsafe.accessories.length, 3, '配饰最多三项'); assert.deepEqual(unsafe.effects, ['none'], '无特效与其他特效互斥');
assert.ok(!unsafe.details.includes('<') && unsafe.details.length <= 240, '自定义细节安全截断至 240 字');
assert.deepEqual(normalizeCreative({ accessories:['none','scarf'], effects:['none','mist'] }).accessories, ['none']);
assert.deepEqual(normalizeCreative({ accessories:['none','scarf'], effects:['none','mist'] }).effects, ['none']);

// 每种主要组选项的视觉提示都必须进入统一生成 prompt。
for (const [group, options] of Object.entries(CREATIVE_GROUPS)) {
  if (group === 'accessory' || group === 'effect') continue;
  for (const item of options) {
    const value = normalizeCreative({ ...DEFAULT_CREATIVE, [group]:item.id });
    assert.ok(buildCreativePrompt(value).includes(item.prompt), `提示词缺少 ${group}/${item.id}`);
  }
}
for (const group of ['accessory','effect']) for (const item of CREATIVE_GROUPS[group].filter((entry) => entry.id !== 'none')) {
  const field = group === 'accessory' ? 'accessories' : 'effects';
  assert.ok(buildCreativePrompt({ ...DEFAULT_CREATIVE, [field]:[item.id] }).includes(item.prompt), `提示词缺少 ${group}/${item.id}`);
}

const creative = describeFigurineCreative({ ...legacy, pose:'curling-throw', outfit:'academy-uniform', palette:'mint', material:'plush', accessories:['mini-curling'] });
for (const phrase of ['复古运动', '冰壶', '极光', '波点发饰', '冰壶投掷', '冰雪学院运动制服', '薄荷绿', '短绒']) assert.ok(creative.includes(phrase), `缺少选择：${phrase}`);
const oldOutfit = { parts:{ coat:'down' }, colors:{ hat:'#123456', coat:'#123456', pants:'#123456', boots:'#123456' } };
const selected = describeFigurineSelection({ ...DEFAULT_CREATIVE, outfit:'street-hoodie', palette:'berry', style:'watercolor' }, oldOutfit);
assert.ok(selected.includes('宽松街头运动卫衣') && selected.includes('莓果红') && selected.includes('儿童绘本水彩插画'));
assert.ok(!selected.includes('#123456') && !selected.includes('短款蓬松羽绒服'), '工坊配置不能被旧换装颜色和服装覆盖');
assert.ok(describeFigurineSelection(null, oldOutfit).includes('#123456'), '旧客户端仍可使用原换装配置');
assert.equal(CREATIVE_PRESETS.length, 8, '应包含八个一键预设');
for (const preset of CREATIVE_PRESETS) assert.notDeepEqual(applyCreativePreset(preset.id), DEFAULT_CREATIVE, `${preset.label}应有真实配置组合`);
assert.equal(applyCreativePreset('champion').sport, 'short-track');
assert.equal(applyCreativePreset('champion',{gender:'male'}).gender, 'male', '切换造型预设保留性别选择');
assert.equal(recommendCreativeForSport(DEFAULT_CREATIVE, 'hockey').outfit, 'hockey-kit');
assert.equal(recommendCreativeForSport(DEFAULT_CREATIVE, 'skate').pose, 'spin');
for (const theme of ['anime','halloween','punk','gothic','idol','space','hanfu-illusionist','cosplay-hero','dream-career','animal-guardian','deep-sea-mail','cloud-chef','mecha-pilot','magical-idol','time-runner','dino-pal']) assert.ok(CREATIVE_GROUPS.theme.some((item)=>item.id===theme), `缺少扩展主题 ${theme}`);
assert.deepEqual(clearCreativeDetails({ ...DEFAULT_CREATIVE, details:'x', accessories:['scarf'], effects:['mist'] }).accessories, []);
for (let i=0;i<100;i++) { const random = randomCreative(() => (i * 0.137 + 0.119) % 1); assert.ok(random.accessories.length <= 3 && random.effects.length <= 2); assert.ok(!(random.accessories.includes('none') && random.accessories.length > 1)); assert.ok(!(random.effects.includes('none') && random.effects.length > 1)); }

const randomBase = { ...DEFAULT_CREATIVE, accessories:['scarf'], details:'保留这句描述' };
const lockedRandom = randomizeCreative(randomBase,{mode:'details-only',lockKeys:['style','sport','theme','accessories'],seed:17,recent:[]});
assert.equal(lockedRandom.style,randomBase.style,'保留画风随机不能改变画风');
assert.equal(lockedRandom.sport,randomBase.sport,'锁定运动不能被装备推荐覆盖');
assert.deepEqual(lockedRandom.accessories,randomBase.accessories,'锁定配饰不能被运动推荐覆盖');
assert.equal(lockedRandom.details,randomBase.details,'随机搭配保留用户补充描述');
assert.equal(lockedRandom.theme,randomBase.theme,'锁定主题在随机搭配中保持不变');
assert.deepEqual(randomizeCreative(randomBase,{mode:'all',seed:22,recent:[]}),randomizeCreative(randomBase,{mode:'all',seed:22,recent:[]}),'相同种子得到一致搭配');
const varied = [101,202,303,404,505].map((seed)=>randomizeCreative(DEFAULT_CREATIVE,{lockKeys:['style','theme','sport'],seed,recent:[]}));
assert.ok(new Set(varied.map((item)=>`${item.outfit}|${item.headwear}|${item.accessories.join(',')}|${item.pose}|${item.palette}`)).size>1,'相同主要选择应能生成不同服装、伙伴和视觉细节');
const seededPromptA=buildCreativePrompt(varied[0]);
const seededPromptB=buildCreativePrompt(varied[1]);
assert.ok(seededPromptA.includes(`设计种子 ${varied[0].metadata.randomSeed}`),'种子方向写入最终生成提示');
assert.notEqual(seededPromptA,seededPromptB,'不同种子应向模型提供不同的角色设计方向');
assert.equal(createSeededRandom(1234)(),createSeededRandom(1234)(),'同一个灵感号产生稳定随机序列');
const coverage = Array.from({length:120},(_,index)=>randomizeCreative(DEFAULT_CREATIVE,{seed:index*7919+17,recent:[]}));
for (const group of ['outfit','hairstyle','headwear','expression','pose','palette','material']) {
  const optionCount = CREATIVE_GROUPS[group].filter((item)=>!['preserve','none','random','custom-outfit'].includes(item.id)).length;
  const allowance = group === 'outfit' ? 8 : 3;
  assert.ok(new Set(coverage.map((item)=>item[group])).size >= optionCount - allowance, `${group}随机覆盖应触达大部分选项`);
}
assert.ok(new Set(coverage.flatMap((item)=>item.accessories)).size >= CREATIVE_GROUPS.accessory.length - 4, '配饰随机覆盖应触达大部分目录');
const recentChoice = randomizeCreative(DEFAULT_CREATIVE,{seed:43210,recent:[{style:DEFAULT_CREATIVE.style,outfit:'puffer',hairstyle:'short-fluffy',headwear:'beanie',expression:'wink',pose:'jump',palette:'mint',material:'plush',accessories:['plush-cat','moon-wand'],effects:['mist','neon']}]});
assert.ok(!['plush-cat','moon-wand'].some((id)=>recentChoice.accessories.includes(id)), '配饰会避开上一轮的重复选择');
assert.ok(!['mist','neon'].some((id)=>recentChoice.effects.includes(id)), '特效会避开上一轮的重复选择');
const hanfuLooks = Array.from({length:80},(_,index)=>randomizeCreative({...DEFAULT_CREATIVE,theme:'hanfu-illusionist',sport:'character'},{lockKeys:['theme','sport'],seed:index+901,recent:[]}));
assert.ok(hanfuLooks.filter((item)=>['hanfu','wuxia-traveler'].includes(item.outfit)).length > 25, '古风主题应明显提高古风穿搭出现率');
assert.ok(hanfuLooks.some((item)=>item.accessories.some((id)=>['jade-fan','brush-talisman'].includes(id))), '古风主题可以抽到对应道具');
assert.equal(SECRET_AVATAR_CHANCE,.02,'隐藏款保持 2% 抽取概率');
assert.ok(drawSecret({random:()=>.019})?.id,'低于概率阈值时可抽到未拥有隐藏款');
assert.equal(drawSecret({random:()=>.02}),null,'达到概率阈值时不触发隐藏款');
assert.equal(drawSecret({random:()=>0,excludedIds:SECRET_AVATARS.map((item)=>item.id)}),null,'集齐隐藏款后不再重复打扰');

const prompt = buildPrompt({ styleId: 'avatar', purpose: 'figurine', extra: creative });
assert.ok(prompt.includes('人物面部身份必须保持'));
assert.ok(prompt.includes('脸必须仍然像上传照片中的本人'));
assert.ok(!prompt.includes('脚踩两条独立短滑雪板'), '旧版固定滑雪姿势不应覆盖运动选择');
assert.ok(prompt.includes('#FF00FF'), '全身角色采用高对比纯色幕');
const watercolor = buildPrompt({ styleId:'avatar', purpose:'figurine', extra:buildCreativePrompt({ ...DEFAULT_CREATIVE, style:'watercolor', composition:'half', effects:['snowflakes'] }) });
assert.ok(watercolor.includes('儿童绘本水彩插画'), '用户所选艺术风格进入最终请求');
assert.ok(watercolor.includes('半身潮玩肖像'), '用户所选镜头构图进入最终请求');
assert.ok(!watercolor.includes('高质量三维动画手办质感'), '固定三维描述不能覆盖水彩选择');
assert.ok(!watercolor.includes('精致卡通材质') && !watercolor.includes('原创、精致的冰雪运动潮玩'), '通用身份提示不能覆盖所选画风');
assert.ok(!watercolor.includes('禁止地面、接地阴影、光晕、背景反光、飘雪'), '特效选择不应与抠图规则矛盾');

const unsafePrompt = describeFigurineCreative({ vibe:'unknown', sport:'unknown', scene:'unknown', details:'<script>\n' + 'x'.repeat(500) });
assert.ok(unsafePrompt.includes('冰雪潮玩') && unsafePrompt.includes('双板滑雪') && unsafePrompt.includes('柔和中性主光'));
assert.ok(!unsafePrompt.includes('<') && !unsafePrompt.includes('\n<script>'));
assert.ok(!unsafePrompt.includes('x'.repeat(241)), '补充创意最多 240 字');
console.log('造型工坊存档兼容、选项提示词、预设、推荐、随机、多选规则和身份约束检查通过');
