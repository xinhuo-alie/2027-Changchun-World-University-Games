import { CREATIVE_GROUPS, normalizeCreative } from './creative-config.js';
import { createRandomSeed, createSeededRandom } from './avatar-randomizer.js';

const labels = Object.fromEntries(Object.entries(CREATIVE_GROUPS).map(([key, options]) => [key, new Map(options.map((item) => [item.id, item]))]));

const CORE_DESCRIPTORS = {
  silhouette: {
    'dynamic-elegant':'灵动优雅的斜向主体轮廓，外层装饰轻盈并贴合人物。',
    'layered-orbit':'层叠环绕轮廓，装饰层围绕身体但保持清楚的人形边界。',
    'soft-organic':'柔和有机轮廓，以流畅曲线和自然层次塑造服装。',
    'angular-paper':'折面几何轮廓，服装采用清楚的纸艺折线。',
    'flowing-asymmetric':'流动且左右不对称的服装轮廓，保留平衡自然的人体。',
    'compact-heroic':'紧凑有力的英雄轮廓，肩部与靴子有明确造型重点。',
  },
  bodyStructure: {
    'human-proportions':'自然成人或青少年人体比例，以参考人物年龄和体态为准。',
    'athletic-natural':'自然轻运动体态，身体结构真实协调，不夸张肌肉。',
    'soft-stylized':'柔和卡通化比例，保留正常人体关节与清楚肢体结构。',
  },
  faceDesign: {
    'natural-friendly':'表情自然亲和，保留原照片五官比例和个人辨识特征。',
    'clear-glasses':'清楚保留照片中的眼镜形状与眼部特征。',
    'soft-lighting':'面部采用柔和均匀光线，五官清楚且不被装饰遮挡。',
  },
  power: {
    'soft-aurora-aura':'在人物周围加入克制的柔和极光光带，贴近身体，不遮脸。',
    'gravity-orbit':'加入少量贴近服装的悬浮重力环，结构清晰且不遮挡身体。',
    'crystal-resonance':'在服装或手持道具加入水晶共鸣光纹，控制在小范围。',
    'time-ripple':'加入一两道贴近人物的时间涟漪，不画复杂场景。',
    'shadow-ribbon':'以贴身流动的影子缎带表现能力效果，不遮挡脸和四肢。',
    'nebula-glow':'在服装边缘加入轻柔星云微光，主体轮廓始终清楚。',
  },
};

const SURPRISE_DETAILS = {
  silhouette: [
    '用不对称短披风与一侧高肩饰形成斜向剪影。', '袖口或裤脚采用适度放大的轮廓，配合紧凑上身。',
    '在腰侧增加一条短飘带和几何拼片，形成轻盈动势。', '让头饰成为一眼记住的夸张焦点，脸部和眼睛完整清晰。',
    '用蓬松外层包住利落内搭，做出软硬材质反差。', '采用短外套、宽下装和醒目鞋型，避免普通制服感。',
    '加入一处巨大的蝴蝶结或围巾结，作为收藏玩具的识别点。', '用左右不对称的袖套、肩章或袜套打破常规套装感。',
  ],
  twist: [
    '加入一件与职业相关的迷你工具，并把它设计成原创魔法道具。', '加入一枚无文字的原创徽章，图案表现角色的小秘密。',
    '使用一件看似普通、细看却有奇幻细节的随身收藏物。', '让鞋子或手套采用云朵或星星的俏皮轮廓。',
  ],
  color: [
    '选择一个与主色形成反差的荧光小面积点缀。', '让金属扣、鞋底或耳饰使用同一组亮色，形成呼应。',
    '在冷色服装上加入一处温暖的蜜糖色或珊瑚色细节。', '把透明材质做成柔和虹彩，但保留衣物主色可辨。',
    '采用深浅两个色块形成清晰分区，避免全身颜色平均铺开。', '让一件随身道具使用与衣服相反的明暗关系，产生鲜明反差。',
  ],
};

function getSeededSurprise(seed) {
  const options = Object.values(SURPRISE_DETAILS).flat();
  const random = createSeededRandom(seed);
  return options[Math.floor(random() * options.length)];
}

export function resolveCreativeGender(raw = {}) {
  const creative = normalizeCreative(raw);
  if (creative.gender === 'male' || creative.gender === 'female') return creative.gender;
  const seed = Number.isFinite(creative.metadata?.randomSeed) ? creative.metadata.randomSeed : createRandomSeed();
  return createSeededRandom(seed)() < .5 ? 'male' : 'female';
}

export function buildCreativePrompt(raw = {}) {
  const creative = normalizeCreative(raw);
  const preset = {
    'event-showcase':'大会展示款：精致、亲和、配色明快，造型适合官方活动展示与大众分享。',
    'fantasy-explorer':'奇幻探索款：加强服装剪裁、外部轮廓、材质层次和受控能力效果，面部保持自然。',
  }[creative.stylePreset];
  const faceStyle = {'natural-stylized':'自然亲和的表情','refined-3d':'细腻清晰的五官','animation':'生动的动画表情'}[creative.faceStyle];
  const styleOption = labels.style.get(creative.style);
  const lines = [
    `最高优先级的艺术表现：${styleOption?.label || ''}。${styleOption?.prompt || ''} 所选画风决定全身与面部的绘制媒介、线条、质感、光影和比例；不能默认变成统一3D手办。`,
    `角色设定：${preset} 整体奇幻程度 ${creative.fantasyLevel}/5。奇幻程度优先决定服装剪裁、主体轮廓、材质层次和能力效果；面部身份与五官布局保持自然。`,
    `面部倾向：${faceStyle}；面部倾向只影响表情与辨识度，不能覆盖所选画风的媒介和表现手法。以所选画法保留参考照片中可辨认的身份特征、年龄感和五官相对位置；不让装饰遮挡五官。`,
    labels.world.get(creative.world)?.prompt,
    creative.lifeform==='original-creature'?'当前图生图服务使用参考照片，按人形主体生成，不生成原创非人形生命。':labels.lifeform.get(creative.lifeform)?.prompt,
    ...['theme','sport','outfit','palette'].map((key) => {
      const prompt=labels[key].get(creative[key])?.prompt;
      if(key!=='theme'||creative.companion.enabled||!prompt)return prompt;
      return prompt.replace('原创奇趣生物或人与生物融合的伙伴','原创奇趣角色造型').replace('发光水母伙伴','水母灯饰').replace('小型机械伙伴搭档','机械风服装装饰').replace('小型恐龙伙伴和','恐龙造型装饰和').replace('与一只奇妙森林小伙伴','并加入奇妙森林菌菇装饰');
    }),
    `主体设计（仅内容，人体比例和画法服从所选画风）：${CORE_DESCRIPTORS.silhouette[creative.silhouette]||''}${CORE_DESCRIPTORS.bodyStructure[creative.bodyStructure]||''}${CORE_DESCRIPTORS.faceDesign[creative.faceDesign]||''}${CORE_DESCRIPTORS.power[creative.power]||''}`,
  ].filter(Boolean);
  const companionAccessories = new Set(['plush-toy','plush-bear','plush-fox','plush-cat','plush-rabbit','plush-penguin','plush-bat','toy-robot','dino-buddy','cloud-companion','gear-drone']);
  const accessoryPrompts = creative.accessories.filter((id)=>creative.companion.enabled || !companionAccessories.has(id)).slice(0,2).map((id) => labels.accessory.get(id)?.prompt).filter(Boolean);
  if (accessoryPrompts.length) lines.push(`只保留以下醒目配件：${accessoryPrompts.join('；')}`);
  const posePrompt = labels.pose.get(creative.pose)?.prompt;
  if (posePrompt && creative.pose !== 'preserve') lines.push(`动作：${posePrompt}`);
  const hairstyle = labels.hairstyle.get(creative.hairstyle)?.prompt;
  const expression = labels.expression.get(creative.expression)?.prompt;
  if (hairstyle && creative.hairstyle !== 'preserve') lines.push(`发型：${hairstyle}`);
  if (expression && creative.expression !== 'preserve') lines.push(`表情：${expression}`);
  const details = creative.details.trim();
  if (details) lines.push(`补充一个小细节（不能覆盖已选造型）：${details}`);
  if (Number.isFinite(creative.metadata?.randomSeed)) {
    const seed=Number(creative.metadata.randomSeed)>>>0;
    lines.push(`本次灵感号 ${seed} 的一个专属变化：${getSeededSurprise(seed)}将它融入服装或道具，不能覆盖已选画风、主题、角色类型或服装。`);
  }
  if (creative.companion.enabled && creative.companion.type && creative.companion.blueprint) {
    const blueprint = creative.companion.blueprint;
    lines.push(`用户主动选择的伙伴：${creative.companion.type}，${creative.companion.archetype}；轮廓${blueprint.silhouette||''}，结构${blueprint.bodyStructure||''}，材质${blueprint.material||''}，特征${blueprint.signatureFeature||''}。伙伴完整入镜、尺寸受控，与主角边界清楚且不得遮挡主角面部。`);
  } else {
    lines.push('只生成角色主体，不要额外生成第二角色、伙伴、宠物、机器人、玩偶或漂浮生物。');
  }
  lines.push('设定优先级检查：所选画风决定整体媒介和视觉语言；主题、角色类型、服装及世界设定决定内容，必须用所选画风表现。脸部身份和完整全身构图保持，面部倾向或幻想细节不能把不同画风统一成同一3D真人模型。');
  lines.push('主体与构图：按所选生命形态完整呈现主体，主体居中、面部与造型清楚可辨；头身比例、轮廓、线条和表面质感服从已选风格，不套统一Q版、机器人或玩偶模板。按选定主题准确绘制，不加入无关装备、文字、标志或水印。');
  lines.push('背景要求：纯色洋红抠图幕（#FF00FF），均匀无纹理；角色、服装和道具不得使用相近洋红色。所有光效紧贴人物，不画场景、地面、投影或背景粒子。');
  const gender = resolveCreativeGender(creative);
  if (creative.gender !== 'random') lines.push(gender === 'male'
    ? '角色性别强约束（最高优先级）：只生成一名男性角色，角色整体性别呈现必须明确为男性；不得生成女性角色或女性身体轮廓。严格遵循此性别选项，不能被照片、服装、主题、配饰或用户补充描述覆盖。'
    : '角色性别强约束：角色整体性别呈现必须明确为女性；不得生成男性角色或男性身体轮廓。');
  const result = lines.join('\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ');
  return result;
}
