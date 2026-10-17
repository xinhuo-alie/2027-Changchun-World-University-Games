import { CREATIVE_GROUPS, normalizeCreative } from './creative-config.js';

const labels = Object.fromEntries(Object.entries(CREATIVE_GROUPS).map(([key, options]) => [key, new Map(options.map((item) => [item.id, item]))]));

export function buildCreativePrompt(raw = {}) {
  const creative = normalizeCreative(raw);
  const ordered = ['style','theme','sport','outfit','hairstyle','headwear','expression','pose','palette','material','scene','composition'];
  const lines = ordered.map((key) => labels[key].get(creative[key])?.prompt).filter(Boolean);
  const accessoryPrompts = creative.accessories.map((id) => labels.accessory.get(id)?.prompt).filter(Boolean);
  const effectPrompts = creative.effects.map((id) => labels.effect.get(id)?.prompt).filter(Boolean);
  if (accessoryPrompts.length) lines.push(`配饰搭配（最多三项）：${accessoryPrompts.join('；')}`);
  if (effectPrompts.length) lines.push(`特效氛围（最多两项）：${effectPrompts.join('；')}`);
  if (creative.hairstyle === 'preserve') lines.push('发型身份约束：保留上传人物原有发型、发色、发际线和脸部辨识度，不改变人物身份。');
  const details = creative.details.trim();
  if (details) lines.push(`用户自定义细节（严格保留人物身份，不覆盖未冲突的明确选项）：${details}`);
  lines.push('造型优先规则：艺术风格决定整张图的绘制方式，不要自动回到三维手办；材质只影响画中服装和器材表面的表现，不改变艺术风格。主色调决定衣物和装备的主要颜色，覆盖主题、场景及上传照片中的旧配色；所选服装、发型、表情、动作和配饰优先于默认运动推荐与照片中的旧造型。运动器材保持正确，主要人物和器材完整、清晰、互不遮挡。避免多个重复人物、额外肢体、杂乱背景、文字、水印和品牌标志。');
  // The current image pipeline extracts the character with a chroma-key mask.
  // Scene choices therefore guide light and palette while the required flat key remains intact.
  lines.push('抠图兼容规则：场景选择只决定角色的环境光和色彩氛围，最终背景必须为均匀无纹理的纯洋红色抠图幕（#FF00FF）；人物、衣物和器材不能使用洋红色；特效只可贴合人物或服装轮廓，不能散落到背景。');
  const result = lines.join('\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ');
  return result.slice(0, 4200);
}

