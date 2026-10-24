import { CREATIVE_GROUPS, normalizeCreative } from './creative-config.js';
import { createRandomSeed, createSeededRandom } from './avatar-randomizer.js';

const labels = Object.fromEntries(Object.entries(CREATIVE_GROUPS).map(([key, options]) => [key, new Map(options.map((item) => [item.id, item]))]));

const SURPRISE_DETAILS = {
  silhouette: [
    '用不对称短披风与一侧高肩饰形成斜向剪影。', '袖口或裤脚采用明显放大的玩偶比例，配紧凑上身。',
    '在腰侧增加一条短飘带和几何拼片，形成轻盈动势。', '让头饰成为一眼记住的夸张焦点，脸部和眼睛完整清晰。',
    '用蓬松外层包住利落内搭，做出软硬材质反差。', '采用短外套、宽下装和醒目鞋型，避免普通制服感。',
    '加入一处巨大的蝴蝶结或围巾结，作为收藏玩具的识别点。', '用左右不对称的袖套、肩章或袜套打破常规套装感。',
  ],
  twist: [
    '加入一件与职业相关的迷你工具，并把它设计成原创魔法道具。', '安排一只小型伙伴从帽檐、背包或披风边探出头。',
    '让某个配件拥有意外的反差功能，例如会发光的玉兔邮筒或小机器人花篮。', '加入一枚无文字的原创徽章，图案表现角色的小秘密。',
    '使用一件看似普通、细看却有奇幻细节的随身收藏物。', '让鞋子或手套采用动物爪、云朵或星星的俏皮轮廓。',
    '安排一颗小型悬浮物围绕人物手边，大小克制，不遮挡身体。', '给角色加入一个与严肃造型形成反差的迷你萌物。',
  ],
  color: [
    '选择一个与主色形成反差的荧光小面积点缀。', '让金属扣、鞋底或耳饰使用同一组亮色，形成呼应。',
    '在冷色服装上加入一处温暖的蜜糖色或珊瑚色细节。', '把透明材质做成柔和虹彩，但保留衣物主色可辨。',
    '采用深浅两个色块形成清晰分区，避免全身颜色平均铺开。', '让伙伴或道具使用与衣服相反的明暗关系，产生可爱反差。',
  ],
};

function getSeededSurprises(seed) {
  const random = createSeededRandom(seed);
  const choose = (items) => items[Math.floor(random() * items.length)];
  return [choose(SURPRISE_DETAILS.silhouette), choose(SURPRISE_DETAILS.twist), choose(SURPRISE_DETAILS.color)];
}

export function resolveCreativeGender(raw = {}) {
  const creative = normalizeCreative(raw);
  if (creative.gender === 'male' || creative.gender === 'female') return creative.gender;
  const seed = Number.isFinite(creative.metadata?.randomSeed) ? creative.metadata.randomSeed : createRandomSeed();
  return createSeededRandom(seed)() < .5 ? 'male' : 'female';
}

export function buildCreativePrompt(raw = {}) {
  const creative = normalizeCreative(raw);
  const ordered = ['style','theme','sport','outfit','hairstyle','headwear','expression','pose','palette','material','composition'];
  const lines = ordered.map((key) => labels[key].get(creative[key])?.prompt).filter(Boolean);
  // Naming a cafe, rink or mountain causes image models to draw the actual place.
  // Keep the selected mood as lighting only, without any location nouns.
  const sceneLight = {
    studio:'柔和中性主光', rink:'清透冰蓝反射光', mountain:'冷白日光', aurora:'青紫色轮廓光',
    castle:'清冷折射光', changchun:'冷蓝主光与少量暖色补光', forest:'清冷绿蓝补光',
    'crystal-palace':'清透冷色折射光', 'future-base':'洁净冷色侧光', cafe:'柔和暖色主光与冰蓝补光',
    'candy-house':'柔和糖果色补光', podium:'柔和金色轮廓光',
  };
  const scenePrompt = labels.scene.get(creative.scene)?.prompt;
  if (scenePrompt) lines.push(`场景选项细节（只影响角色光线与配色）：${scenePrompt}`);
  lines.push(`场景氛围仅用于人物布光：${sceneLight[creative.scene] || sceneLight.studio}；不绘制任何场所、建筑或环境。`);
  const accessoryPrompts = creative.accessories.map((id) => labels.accessory.get(id)?.prompt).filter(Boolean);
  const effectPrompts = creative.effects.map((id) => labels.effect.get(id)?.prompt).filter(Boolean);
  if (accessoryPrompts.length) lines.push(`配饰搭配（最多三项）：${accessoryPrompts.join('；')}`);
  if (effectPrompts.length) lines.push(`特效氛围（最多两项）：${effectPrompts.join('；')}`);
  lines.push('统一视觉要求：原创 Q 版全身角色，约三头身，头部略大、轮廓鲜明，保留本人年龄与身份特征；手脚清晰，人物居中完整，缩小后仍易辨认。服装、姿态和道具遵循所选主题与角色类型，允许奇幻、街头、舞台、校园、万圣节等非冰雪设计。艺术风格控制绘制技法与材质。');
  if (creative.hairstyle === 'preserve') lines.push('发型身份约束：保留上传人物原有发型、发色、发际线和脸部辨识度，不改变人物身份。');
  const details = creative.details.trim();
  if (details) lines.push(`用户自定义细节（严格保留人物身份，不覆盖未冲突的明确选项）：${details}`);
  if (Number.isFinite(creative.metadata?.randomSeed)) {
    const seed=Number(creative.metadata.randomSeed)>>>0;
    const [silhouette, twist, color] = getSeededSurprises(seed);
    lines.push(`本次设计种子 ${seed} 的专属惊喜细节：${silhouette}${twist}${color}将这些细节融入已选服装与主题，保持角色完整、协调、可爱又有记忆点；不要覆盖用户明确选择的风格、主题、角色类型和服装。`);
  }
  lines.push('造型优先规则：艺术风格决定整张图的绘制方式，不要自动回到三维手办；材质只影响画中服装和器材表面的表现，不改变艺术风格。主色调决定衣物和装备的主要颜色，覆盖主题、场景及上传照片中的旧配色；所选服装、发型、表情、动作和配饰优先于默认运动推荐与照片中的旧造型。运动器材保持正确，主要人物和器材完整、清晰、互不遮挡。避免多个重复人物、额外肢体、杂乱背景、文字、水印和品牌标志。');
  // The current image pipeline extracts the character with a chroma-key mask.
  // Scene choices therefore guide light and palette while the required flat key remains intact.
  lines.push('抠图兼容规则：场景选择只决定角色的环境光和色彩氛围，最终背景必须为均匀无纹理的纯洋红色抠图幕（#FF00FF）；人物、衣物和器材不能使用洋红色；特效只可贴合人物或服装轮廓，不能散落到背景。');
  const gender = resolveCreativeGender(creative);
  lines.push(gender === 'male'
    ? '角色性别强约束（最高优先级）：只生成一名男性角色，角色整体性别呈现必须明确为男性；不得生成女性角色或女性身体轮廓。严格遵循此性别选项，不能被照片、服装、主题、配饰或用户补充描述覆盖。'
    : '角色性别强约束（最高优先级）：只生成一名女性角色，角色整体性别呈现必须明确为女性；不得生成男性角色或男性身体轮廓。严格遵循此性别选项，不能被照片、服装、主题、配饰或用户补充描述覆盖。');
  const result = lines.join('\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ');
  return result.slice(0, 5000);
}
