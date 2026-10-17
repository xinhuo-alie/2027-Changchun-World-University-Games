import assert from 'node:assert/strict';
import { buildPrompt, describeFigurineCreative, describeFigurineSelection } from '../server/styles.js';
import {
  CREATIVE_GROUPS, CREATIVE_PRESETS, DEFAULT_CREATIVE, normalizeCreative,
  applyCreativePreset, randomCreative, recommendCreativeForSport, clearCreativeDetails,
} from '../web/creative-config.js';
import { buildCreativePrompt } from '../web/creative-prompt.js';

// 旧版 cc2027:creative 结构读取时保留主题别名并填入新选项默认值。
const legacy = normalizeCreative({ vibe:'retro', sport:'curling', scene:'aurora', details:'白色波点发饰，挥手微笑' });
assert.equal(legacy.theme, 'retro'); assert.equal(legacy.vibe, 'retro'); assert.equal(legacy.sport, 'curling');
assert.equal(legacy.scene, 'aurora'); assert.equal(legacy.details, '白色波点发饰，挥手微笑');
assert.equal(normalizeCreative(JSON.parse(JSON.stringify(legacy))).details, legacy.details, '新结构可序列化并重新读取');

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
assert.equal(recommendCreativeForSport(DEFAULT_CREATIVE, 'hockey').outfit, 'hockey-kit');
assert.equal(recommendCreativeForSport(DEFAULT_CREATIVE, 'skate').pose, 'spin');
assert.deepEqual(clearCreativeDetails({ ...DEFAULT_CREATIVE, details:'x', accessories:['scarf'], effects:['mist'] }).accessories, []);
for (let i=0;i<100;i++) { const random = randomCreative(() => (i * 0.137 + 0.119) % 1); assert.ok(random.accessories.length <= 3 && random.effects.length <= 2); assert.ok(!(random.accessories.includes('none') && random.accessories.length > 1)); assert.ok(!(random.effects.includes('none') && random.effects.length > 1)); }

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
assert.ok(unsafePrompt.includes('冰雪潮玩') && unsafePrompt.includes('双板滑雪') && unsafePrompt.includes('收藏级摄影棚'));
assert.ok(!unsafePrompt.includes('<') && !unsafePrompt.includes('\n<script>'));
assert.ok(!unsafePrompt.includes('x'.repeat(241)), '补充创意最多 240 字');
console.log('造型工坊存档兼容、选项提示词、预设、推荐、随机、多选规则和身份约束检查通过');
