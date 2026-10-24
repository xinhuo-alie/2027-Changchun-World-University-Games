import { buildCreativePrompt, resolveCreativeGender } from '../web/creative-prompt.js';

/**
 * ★ 这个文件是整个项目的核心资产。
 *
 * 卡通形象生成最难的不是"调通 API"，而是让**所有用户出来的画风是同一套**。
 * 做法：把提示词切成三块——
 *   1. IDENTITY_LOCK  每个用户不同（保身份）
 *   2. STYLE          每个风格固定（锁画风）★ 绝不随用户变化
 *   3. COMPOSITION    全局固定（锁构图/背景/光照）
 * 拼装顺序固定、STYLE 段一字不改，出图的整体观感才会像"同一个游戏里的角色"。
 *
 * 另外：只让模型出「半身立绘」，不要出场景、不要出动作。
 * 角色动画交给后续的骨骼/精灵图去贴，AI 出整套动画是不可控的。
 */

export const IDENTITY_LOCK = {
  zh: [
    '以我上传照片中的人物为唯一原型，画出同一个人的卡通形象。',
    '必须严格保留：性别、年龄段、发型与发色、脸型与五官特征、眼镜/帽子/胡须等显著特征。',
    '保持人物原本的年龄感与面部成熟度：照片里是成年人就画成年人，不要幼化成儿童；',
    '不要放大眼睛、缩短下巴或画成婴儿脸，卡通化只改画风，不改年龄。',
    '保留原本的服装颜色与款式。',
    '不要改变人物身份，不要美化或替换成另一个人。',
  ].join(''),
  en: [
    'Draw a cartoon character of the SAME person shown in my uploaded photo, and treat that person as the only subject. ',
    'Strictly preserve: gender, age group, hairstyle and hair colour, face shape and facial features, ',
    'and distinctive accessories such as glasses, hats or facial hair. ',
    'Keep the real age and facial maturity of the person: an adult must stay an adult - do not make them younger, ',
    'do not enlarge the eyes, shorten the chin, or turn the face into a baby face. Cartoon styling changes the art style only, never the age. ',
    'Keep the original clothing colour and style. ',
    'Do not change the identity and do not beautify the person into someone else.',
  ].join(''),
};

// 2D 换装只消费头像。原照片里的帽子、围巾和衣服若被带进生成图，
// 再叠一次矢量服饰就会产生「两顶帽子/两层领口」的拼贴感。
export const AVATAR_IDENTITY_LOCK = {
  zh: '以照片中的同一个人为原型，严格保留年龄段、脸型、眼距、鼻形、嘴形、发型发色和眼镜等个人面部特征。面部表情自然亲切，允许轻微微笑，不改变身份。忽略照片中原有的帽子、围巾、外套和背景；头发完整可见，双耳和下巴清晰，颈部无遮挡，便于后续搭配卡通服饰。',
  en: 'Draw the same person from the photo. Preserve age, face shape, eye spacing, nose, mouth, hairstyle, hair colour and distinctive glasses. Keep a natural friendly expression and identity. Ignore the original hat, scarf, jacket and background; show the full hair silhouette, clear ears and chin, and an unobstructed neck for later cartoon outfit assembly.',
};

const FIGURINE_PARTS = {
  hat: { none: '露出发型', beanie: '毛线雪帽', earflap: '圆耳护耳帽', cap: '运动帽', helmet: '圆润滑雪头盔' },
  scarf: { none: '简洁领口', scarf: '飘动围巾', snood: '软糯脖套' },
  coat: { down: '短款蓬松羽绒服', jacket: '流线型滑雪外套', hoodie: '运动卫衣', team: '冰雪运动队服', sweater: '雪花针织衫' },
  pants: { snow: '宽松雪裤', sports: '运动束脚裤', skirt: '短裙与保暖打底裤', tight: '修身滑雪裤' },
  boots: { snow: '雪地运动靴', skate: '冰鞋', board: '单板滑雪靴' },
  gloves: { none: '裸手', mitten: '圆润连指手套', glove: '运动手套' },
};

export function describeFigurineOutfit(outfit = {}) {
  const parts = outfit.parts || {};
  const colors = outfit.colors || {};
  const items = Object.entries(FIGURINE_PARTS).map(([key, labels]) => labels[parts[key]] || Object.values(labels)[0]);
  const safeColor = (key) => /^#[0-9a-fA-F]{6}$/.test(colors[key] || '') ? colors[key] : '#67D6E5';
  return `沿用已有角色搭配中的色彩作为个人偏好参考（${items.join('、')}；头部${safeColor('hat')}、外套${safeColor('coat')}、裤装${safeColor('pants')}、鞋靴${safeColor('boots')}）。如与造型工坊明确选择的服装轮廓、发型或运动装备冲突，以工坊选择及运动项目合理性为准。`;
}

export function describeFigurineCreative(creative = {}) {
  return buildCreativePrompt(creative);
}

// 新工坊的选项已经包含服装、配色和器材；旧换装配置只用于没有工坊配置的旧客户端。
export function describeFigurineSelection(creative, outfit) {
  return creative && typeof creative === 'object' && !Array.isArray(creative)
    ? describeFigurineCreative(creative)
    : describeFigurineOutfit(outfit);
}

export const FIGURINE_COMPOSITION = {
  zh: '画面展示完整全身，约三头身的大头小身体比例，但按照参考照片保留成年或儿童的真实年龄感。人物身体固定朝画面右侧约 30–45 度，胸口、双脚脚尖及滑雪板等运动器材的前进方向也指向画面右侧；脸微微转向镜头，保持清晰可辨的右向四分之三视角。不要朝左、背对镜头或完全正面站立。从头发到鞋子、运动器材均完整不裁切。只画一个人物，运动姿态与选择的项目相符。人物四周保留适量呼吸空间。整张画布除人物及随身运动器材外，每个像素都必须是同一种均匀、无纹理、无渐变的纯洋红色（#FF00FF）：人物脚下、雪板下方、两块雪板之间、手臂与躯干之间、双腿之间和器材空隙都一样。人物与雪板悬浮在纯色平面前，不存在地平线、地面或地板；绝不绘制雪地、冰面、接地阴影、反光、光晕、飘雪、展示台、透视线或背景装饰。人物、服饰、配饰和运动器材禁止使用洋红色或近似粉紫色，改用白、蓝、青或其他有明显对比的颜色。边缘清晰无洋红溢色；场景选项只影响人物的光线和配色，不得生成场景或其他物体。不要赛事官方吉祥物、官方徽标、文字、数字或水印。',
  en: 'Show exactly one full-body character, roughly three heads tall while preserving the reference person’s adult or child age cues. Fix the body in a three-quarter pose facing toward the right side of the image, about 30–45 degrees from front. The chest, toes and forward direction of skis or other sport gear also point toward image-right. Turn the face slightly back toward the viewer so identity remains clear. Do not face left, turn away, or stand fully front-on. Do not crop hair, shoes or sport equipment. Pose and gear must match the selected sport. Leave breathing room. Every pixel outside the character and attached sport equipment must be the same uniform flat chroma magenta (#FF00FF), without texture or gradient: under the shoes and skis, between both skis, between arms and torso, between legs, and in all equipment gaps. The character and skis float in front of this flat color field; there is no horizon, floor or ground plane. Never render snow, ice, a floor, cast shadow, reflection, halo, snowflakes, pedestal, perspective lines or background decoration. Keep the character, clothes, accessories and equipment free of magenta or similar pink-purple; use contrasting white, blue or cyan instead. Keep crisp edges without magenta spill. Scene choices affect only the character’s lighting and palette; do not render a scene or other objects. No official mascots, event logos, text, numbers or watermarks.',
};

/** 全局构图锚点：与风格无关，保证所有出图能直接贴进后续的游览场景 */
export const COMPOSITION = {
  zh: [
    '构图：半身正面立绘，人物居中，占画面约七成，视线朝向镜头。',
    '背景为纯色浅冰蓝（#E8F4FD），柔和均匀布光，整体冷色调。',
    '画面中只出现这一个人物，不要出现任何文字、水印、边框、logo 或场景元素。',
  ].join(''),
  en: [
    'Composition: front-facing half-body character portrait, centred, occupying about 70% of the frame, eyes toward the camera. ',
    'Flat pale ice-blue background (#E8F4FD), soft even lighting, cool overall tone. ',
    'Exactly one character in frame — no text, no watermark, no border, no logo, no scene elements.',
  ].join(''),
};

/** 负向提示词（不支持负向参数的模型把它拼到正文末尾） */
export const NEGATIVE = {
  zh: '写实照片，真人质感，低质量，模糊，噪点，多余的手指，畸形四肢，扭曲的脸，不对称的眼睛，多个人物，背景杂乱，文字，水印，logo，恐怖，成人内容',
  en: 'photorealistic, real photograph, low quality, blurry, noisy, extra fingers, deformed limbs, distorted face, asymmetrical eyes, multiple people, cluttered background, text, watermark, logo, creepy, adult content',
};

export const STYLES = [
  {
    id: 'avatar',
    name: '冰雪运动手办 · 推荐',
    tagline: '大头圆润的动画手办质感 · 保留本人辨识度',
    accent: '#63C7E8',
    mockBg: '#E8F4FD',
    /**
     * 这个风格要自己的构图。
     *
     * 全局 COMPOSITION 是"半身立绘"（当年给 3D 绑骨用的：必须全身、双臂张开）。
     * 2D 拼装只消费头像——从半身照里裁脑袋会剩一堆肩膀，白等时间和像素。
     * 所以头像类风格把构图换成头肩特写：**构图本身就是画风的一部分**。
     */
    composition: {
      zh: [
        '构图：正面全身角色立绘，从头顶到鞋底完整入镜，人物居中，占画面高度约八成，双脚完整可见，双臂自然微微离开身体，站姿稳定，视线朝向镜头，不歪头。人物保持大头短身的收藏级冰雪运动手办比例，头部、躯干、双臂、双腿和鞋子边界清晰。',
        '背景为纯色浅冰蓝（#E8F4FD），柔和均匀布光，整体冷色调，人物轮廓与背景界限清晰，脚下只保留轻微接地阴影。',
        '画面中只出现这一个完整人物，不要裁切头顶、手臂或鞋底，不要出现文字、水印、边框、logo、底座或场景元素。',
      ].join(''),
      en: [
        'Composition: full-body straight-on character illustration, from the top of the head to the soles fully inside frame, centred and occupying about 80% of image height, both feet visible, arms held slightly away from the torso, balanced standing pose, eyes toward camera, no head tilt. Collectible winter-sports figurine proportions with a large head and compact body; clear silhouette for head, torso, arms, legs and boots. ',
        'Flat pale ice-blue background (#E8F4FD), soft even lighting, cool overall tone, crisp subject boundary, with only a faint contact shadow under the feet. ',
        'Show exactly one complete person. Do not crop the head, hands or boots. No text, watermark, border, logo, pedestal or scene elements.',
      ].join(''),
    },
    prompt: {
      zh: [
        '风格：原创冰雪运动动画手办。圆润、软萌、精致的三维卡通雕塑感，柔和的体积光与奶油色高光，少量深蓝轮廓线；与鲜亮的卡通滑雪服协调。头像属于约三头身的运动角色，脸部亲切但不幼化。',
        '严格沿用照片的眼距、鼻形、嘴形、下颌轮廓、眼镜和年龄特征，保留本人辨识度；适度简化皮肤纹理，画成细腻的动画角色脸，不要直接贴真实照片、不要真实皮肤毛孔，不要过度放大眼睛或改变脸型。头发按原发型塑成圆润发束，双耳和下巴完整。',
      ].join(''),
      en: [
        'Style: original winter-sports animated figurine, rounded and charming with refined soft 3D sculpted forms, gentle volumetric light, creamy highlights and a few fine navy outlines. Design the head for a roughly three-head-tall sporty mascot body while keeping the person recognisable. ',
        'Preserve the reference eye spacing, nose, mouth, jaw, glasses and age. Simplify skin texture into an animated character face; no pasted photograph, pores, exaggerated eyes or redesigned identity. Sculpt the original hairstyle into rounded locks and keep both ears and chin visible.',
      ].join(''),
    },
  },
  {
    id: 'stylized',
    name: '卡通写实',
    tagline: '接近真人比例 · 最能保住本人长相',
    accent: '#8E9BF2',
    mockBg: '#EEF1FC',
    prompt: {
      zh: [
        '风格：三维动画电影式的卡通渲染，但保持接近真人的身体与面部比例（头身比约 1:6.5，不是Q版）。',
        '眼睛大小接近真人，保留下颌线与颧骨的真实结构，皮肤有细腻的材质与真实光影层次。',
        '整体效果是把真人照片「翻译」成动画角色，而不是把真人变成玩偶或儿童。',
      ].join(''),
      en: [
        'Style: 3D animated-film style cartoon rendering, but keep close-to-real human body and facial proportions (head-to-body ratio about 1:6.5 - this is NOT chibi). ',
        'Eye size close to life size, keep the real jawline and cheekbone structure, fine skin material with realistic light and shadow layering. ',
        'The goal is to translate a real photograph into an animated character, not to turn the person into a doll or a child.',
      ].join(''),
    },
  },
  {
    id: 'q3d',
    name: 'Q版3D',
    tagline: '圆润软萌 · 动画电影质感',
    accent: '#7CC4F8',
    mockBg: '#E8F4FD',
    prompt: {
      zh: [
        '风格：Q版3D卡通渲染，现代动画电影质感（皮克斯/迪士尼长篇动画的观感）。',
        '头身比约 1:3.2，头部适度放大但不夸张，保留成年人的面部比例与骨相；',
        '脸型圆润但保留下颌轮廓，眼睛约为真人比例的 1.2 倍，鼻子小巧；',
        '皮肤通透带轻微次表面散射感，头发呈成块的柔软高光；',
        '材质干净，阴影柔和，整体像高质量3D动画电影的剧照。',
      ].join(''),
      en: [
        'Style: chibi 3D cartoon render with the look of a modern animated feature film (Pixar/Disney style). ',
        'Head-to-body ratio about 1:3.2 - the head is moderately enlarged but not exaggerated, preserving adult facial proportions and bone structure; ',
        'a rounded face that keeps its jawline, eyes about 1.2x life size, small nose; ',
        'translucent skin with subtle subsurface scattering, hair as soft glossy clumps; ',
        'clean materials, soft shadows — the overall quality of a high-end 3D animated film still.',
      ].join(''),
    },
  },
  {
    id: 'anime',
    name: '日系动漫',
    tagline: '干净线稿 · 赛璐璐平涂',
    accent: '#F8A5C2',
    mockBg: '#FFF1F6',
    prompt: {
      zh: [
        '风格：日系动画赛璐璐上色，干净的线稿，硬边分层阴影，明快的配色，',
        '眼睛高光清晰，发丝成束分明，整体达到日本电视动画的成片质量。',
      ].join(''),
      en: [
        'Style: Japanese anime cel-shaded illustration — clean line art, hard-edged layered shadows, bright palette, ',
        'clear eye highlights, distinct hair strands, matching Japanese TV animation production quality.',
      ].join(''),
    },
  },
  {
    id: 'sticker',
    name: '冰雪贴纸',
    tagline: '扁平描边 · 适合做头像与表情包',
    accent: '#63C7E8',
    mockBg: '#EAF7FC',
    prompt: {
      zh: [
        '风格：扁平矢量贴纸插画，粗描边，色块明快，简化五官，',
        '点缀少量冰晶与雪花元素，整体干净利落，适合做社交头像、贴纸和表情包。',
      ].join(''),
      en: [
        'Style: flat vector sticker illustration — thick outline, bold colour blocks, simplified facial features, ',
        'with a few ice-crystal and snowflake accents; clean and crisp, suitable as a social avatar, sticker or emoji pack.',
      ].join(''),
    },
  },
  {
    id: 'clay',
    name: '黏土手办',
    tagline: '软陶质感 · 摆件感强',
    accent: '#F0B27A',
    mockBg: '#FDF3E7',
    prompt: {
      zh: [
        '风格：黏土/软陶手办质感，表面有细腻的哑光颗粒感，造型圆润，',
        '像在影棚里拍摄的手办摆件，浅景深，柔和顶光，干净背景。',
      ].join(''),
      en: [
        'Style: clay / polymer-figurine texture — fine matte grain on the surface, rounded forms, ',
        'looking like a collectible figure photographed in a studio: shallow depth of field, soft top light, clean backdrop.',
      ].join(''),
    },
  },
];

export function getStyle(styleId) {
  return STYLES.find((s) => s.id === styleId) || STYLES[0];
}

export function listStyles() {
  return STYLES.map(({ id, name, tagline, accent }) => ({ id, name, tagline, accent }));
}

/**
 * 拼装最终提示词。
 * locale 用于不同模型的语言偏好：国内模型用 zh，海外模型用 en。
 */
export function buildPrompt({ styleId, locale = 'zh', extra = '', purpose, creative } = {}) {
  const style = getStyle(styleId);
  if (purpose === 'figurine') {
    const gender = creative ? resolveCreativeGender(creative) : null;
    const genderCheck = gender === 'male'
      ? (locale === 'zh' ? '最终性别检查：角色整体必须呈现为男性；若参考照片或其他描述与此冲突，以男性选项为准，同时尽量保留可辨认的脸部身份特征。不得生成女性角色。' : 'Final gender check: the character must read as male. If the reference photo or any other description conflicts, follow the male selection while preserving recognisable facial identity where possible. Do not generate a female character.')
      : gender === 'female'
        ? (locale === 'zh' ? '最终性别检查：角色整体必须呈现为女性；若参考照片或其他描述与此冲突，以女性选项为准，同时尽量保留可辨认的脸部身份特征。不得生成男性角色。' : 'Final gender check: the character must read as female. If the reference photo or any other description conflicts, follow the female selection while preserving recognisable facial identity where possible. Do not generate a male character.')
        : '';
    return [
      locale === 'zh'
        ? '以照片中的人为唯一身份参考，准确保留脸型、五官布局、眼距、鼻嘴形状、年龄感和眼镜等可辨认的面部特征；不能变成另一张通用娃娃脸。照片中的服装、颜色、动作和场景不作为造型模板，除非用户明确选择保留；人物面部身份必须保持。'
        : 'Use the person in the reference photo only as the identity reference. Preserve recognisable face shape, features, glasses and age. Do not copy the photo’s clothing, colours, pose or scene unless explicitly requested.',
      locale === 'zh'
        ? '严格采用造型工坊所选的艺术风格、服装、主色调、材质、运动项目和动作，不套用固定的蓝色滑雪服或三维手办模板。主色调覆盖主题与场景中提到的颜色；服装选择覆盖照片原衣着；运动项目与动作选择决定器材和身体姿态。面部与身体使用同一种所选画风，不要把真人照片贴在角色脸上。'
        : 'Follow the workshop’s selected art style, outfit, palette, material, sport and pose. Do not default to a blue ski outfit or a 3D toy. The selected palette overrides theme or scene colours; the selected outfit overrides clothing in the photo; sport and pose determine equipment and body position. Render face and body in the same selected style.',
      extra,
      FIGURINE_COMPOSITION[locale],
      locale === 'zh' ? '最终检查：角色的脸必须仍然像上传照片中的本人，五官完整清晰；脸部、服装和身体必须统一采用用户所选画风，不把真人照片直接贴到角色上。' : 'Final check: the face must remain recognisably the person in the uploaded photo, with clear features; render the face, outfit and body consistently in the selected art style rather than pasting a photograph onto the character.',
      genderCheck,
      locale === 'zh' ? `避免出现：${NEGATIVE.zh}` : `Avoid: ${NEGATIVE.en}`,
    ].filter(Boolean).join('\n');
  }
  // 风格可以覆盖构图（见上面 avatar 风格的说明），默认用全局那一段
  const composition = purpose === 'avatar2d' ? STYLES[0].composition : style.composition || COMPOSITION;
  const parts = [purpose === 'avatar2d' ? AVATAR_IDENTITY_LOCK[locale] : IDENTITY_LOCK[locale], style.prompt[locale], composition[locale]];
  if (extra) parts.push(extra);
  parts.push(locale === 'zh' ? `避免出现：${NEGATIVE.zh}` : `Avoid: ${NEGATIVE.en}`);
  return parts.join('\n');
}
