import { normalizeCreative } from './creative-config.js';

export const SECRET_AVATAR_CHANCE = .05;

const catalog = [
  {
    id:'aurora-fox', title:'极光狐', rarity:'rare', tags:['极光','守护','灵动'],
    lore:'来自雪原边界的极光守护灵，尾巴会留下流动的光带，脚步像在冰面上写下秘密。',
    tagline:'当极光落到雪面上，它就会悄悄出现。', silhouetteHint:'有人说它总在极光最亮的时候出现。',
    theme:'animal-guardian', style:'gacha-card', outfit:'mascot-kigurumi', headwear:'fox-ears', palette:'blue-purple', material:'translucent-ice', effects:['aurora-ring','starlight'], accessories:['plush-fox','ice-cape','ice-pin'], expression:'surprise', pose:'jump',
    prompt:'雪原极光守护灵，蓬松狐耳与巨大渐变狐尾形成鲜明剪影，尾尖透出青紫极光，身边有轻盈极光环和冰晶徽记。收藏级奇幻潮玩立绘，光效集中于角色。',
  },
  {
    id:'snowball-magician', title:'雪团魔法师', rarity:'rare', tags:['魔法','软萌','惊喜'],
    lore:'会把雪球变成礼物的古怪小法师，总能在最冷的时候带来最暖的惊喜。',
    tagline:'它把雪花变成祝福，也把寒冷变成了玩心。', silhouetteHint:'它的帽子里总有一颗会发光的小雪团。',
    theme:'fairytale', style:'clay', outfit:'stage-magician', headwear:'witch-hat', palette:'cream', material:'candy-gel', effects:['starlight','halo'], accessories:['magic-book','moon-wand','plush-bear'], expression:'wink', pose:'snowball',
    prompt:'奶油白短礼服饰有星月暗纹，俏皮法师帽挂着发光雪团，掌心托起内部藏有微缩雪景的雪球礼物。软陶与糖果胶质感，温暖又奇妙。',
  },
  {
    id:'crystal-knight', title:'冰晶骑士', rarity:'rare', tags:['守护','荣耀','冰晶'],
    lore:'披着冰晶护甲的沉默守护者，总在危险来临前先一步站到前方。',
    tagline:'沉默并不等于冰冷，它只是把温柔藏进了盔甲里。', silhouetteHint:'冰晶护甲的中央藏着一颗微亮的守护核心。',
    theme:'heroic-fantasy', style:'resin', outfit:'cosplay-armor', headwear:'pilot-helmet', palette:'black-silver', material:'crystal', effects:['ice-particles','halo'], accessories:['ice-cape','snow-badge','crystal-orb'], expression:'focus', pose:'champion',
    prompt:'银黑轻甲由不对称冰晶肩甲、透明棱镜护腕与短披风组成，头盔面罩翻起并露出完整脸部，手持悬浮六角冰晶核心。收藏级精工材质，坚毅而温柔。',
  },
  {
    id:'snowfield-guardian', title:'雪域守护灵', rarity:'rare', tags:['雪原','森林','守望'],
    lore:'长期游走在林海雪原边缘的守望者，能听见雪落下的声音。',
    tagline:'它是雪原最古老的回声，也是最温柔的看护者。', silhouetteHint:'它总在雪松林边静静守望，从不惊动旅人。',
    theme:'snow', style:'storybook-gouache', outfit:'field-researcher', headwear:'hood', palette:'mint', material:'knit', effects:['snowflakes','mist'], accessories:['backpack','cloud-companion','ice-pin'], expression:'gentle', pose:'wave',
    prompt:'薄荷绿雪原巡护服配半透明冰羽披肩，背包上有微型发光雪松，肩边跟着围巾云朵精灵。绘本厚涂质感，安静而神秘。',
  },
  {
    id:'nebula-dreamweaver', title:'星云织梦师', rarity:'epic', tags:['星云','梦境','幻想'],
    lore:'擅长把梦缝进星光里，让每一个胆小的愿望都拥有发光的形状。',
    tagline:'在它出现的地方，连梦都会慢慢发亮。', silhouetteHint:'夜空里偶尔会出现一缕正在编织星光的丝线。',
    theme:'space', style:'holo-fashion', outfit:'stage-magician', headwear:'oversized-bow', palette:'aurora-purple', material:'pearl', effects:['starlight','mist','aurora-ring'], accessories:['crystal-orb','moon-wand','tiny-bouquet'], expression:'gentle', pose:'spin',
    prompt:'发丝像流动星云，漂浮的星光丝带环绕身体，双手正把微小梦境缝进一颗发亮星辰。渐变珠光和克制梦境粒子，轮廓轻盈华丽。',
  },
  {
    id:'mecha-moon-rabbit', title:'机械月兔使', rarity:'epic', tags:['机械','月宫','伙伴'],
    lore:'将月光储存在机械核心中的旅行者，身边常跟着一只迷你月兔机巧伙伴。',
    tagline:'它带来的不是冰冷机械，而是会发光的陪伴。', silhouetteHint:'月光下能听见齿轮轻响，还有兔耳的影子。',
    theme:'moon-rabbit', style:'miniature-diorama', outfit:'astronaut-coverall', headwear:'halo-antenna', palette:'black-silver', material:'metal', effects:['halo','starlight'], accessories:['toy-robot','crystal-orb','light-band'], expression:'cool', pose:'standing',
    prompt:'银白精巧机械旅行服，兔耳结构与月环相连，胸前机械核心储存柔和月光；身边跟着一只迷你月兔机巧伙伴。细节精致、机械温暖亲切。',
  },
  {
    id:'mushroom-forest-sprite', title:'蘑菇森林精灵王', rarity:'epic', tags:['森林','蘑菇','精灵'],
    lore:'住在会发光的蘑菇林深处，帽檐和披风像刚从童话里摘下来一样。',
    tagline:'它像一场柔软的森林梦，慢慢长在了雪里。', silhouetteHint:'林间的蘑菇灯一盏盏亮起时，它就快到了。',
    theme:'forest-mushroom', style:'storybook-gouache', outfit:'hanfu', headwear:'witch-hat', palette:'mint', material:'ceramic', effects:['mist','starlight','snowflakes'], accessories:['tiny-bouquet','cloud-companion','crystal-orb'], expression:'smile', pose:'wave',
    prompt:'菌菇帽檐与苔藓色披风组成童话般的独特剪影，帽沿有柔和暖光，衣角缀着森林纹样。精灵王亲切神秘，雪林微光只环绕角色。',
  },
  {
    id:'chrono-courier', title:'时空快递员', rarity:'epic', tags:['时间','冒险','快递'],
    lore:'背着会滴答作响的时钟邮包，把来自不同时间的礼物送往正确的人手中。',
    tagline:'它送来的不只是包裹，还有被认真对待的时刻。', silhouetteHint:'一只带着时钟邮包的影子从未来匆匆跑过。',
    theme:'time-runner', style:'miniature-diorama', outfit:'field-researcher', headwear:'pilot-helmet', palette:'lemon', material:'metal', effects:['halo','starlight','trail'], accessories:['gear-drone','backpack','camera'], expression:'cool', pose:'jump',
    prompt:'柠檬黄与午夜蓝探险邮差服，背负透明齿轮时钟邮包，表盘中有微缩云层；黄铜机械信鸽无人机叼着时间胶囊伴飞。小型时光切片表现速度感。',
  },
  {
    id:'mirror-sea-singer', title:'镜海歌者', rarity:'legendary', tags:['镜面','海潮','歌谣','传说'],
    lore:'传说中只会在极少数灵感交汇时现身的歌者，声音能让冰面像海一样泛起层层微光。',
    tagline:'当冰面开始像海一样呼吸，你就知道它来过了。', silhouetteHint:'冰面偶尔泛起海潮般的光，传说那是歌声留下的回响。',
    theme:'deep-sea-mail', style:'holo-fashion', outfit:'hanfu', headwear:'flower-crown', palette:'sky', material:'translucent-ice', effects:['aurora-ring','starlight','mist'], accessories:['crystal-orb','shell-mailbag','tiny-bouquet'], expression:'gentle', pose:'spin',
    prompt:'镜面水晶层叠衣裙折射海潮流光，透明披帛像冰面泛起的波纹，周身有极光彩的传说光环。歌者优雅宁静，画面具有终极珍藏卡面仪式感。',
  },
  {
    id:'crown-comet-dragon', title:'王冠彗星龙', rarity:'legendary', tags:['彗星','王冠','龙灵','终极收藏'],
    lore:'收藏馆中最难出现的终极隐藏款，小小的身体里像装着整条夜空，尾迹像一颗拖着光焰的小彗星。',
    tagline:'如果它愿意现身，那一定是因为你已经足够特别。', silhouetteHint:'夜空掠过一颗戴着王冠的小彗星，只有幸运的人看得见。',
    theme:'creature-pal', style:'storybook-3d', outfit:'mascot-kigurumi', headwear:'crown', palette:'gold', material:'translucent-ice', effects:['trail','starlight','halo'], accessories:['crystal-orb','snow-badge','light-band'], expression:'smile', pose:'jump',
    prompt:'终极隐藏款幼体龙灵，戴微型金色王冠，小巧身体像装着整片夜空，龙尾拖出彗星光焰。金色细节与极光彩星屑交织，体态可爱但气场庄严。',
  },
];

const oldDesigns = [
  {id:'dunhuang-star-messenger',title:'飞天星邮使',theme:'hanfu-illusionist',style:'hanhua',outfit:'hanfu',headwear:'hanfu-hairpin',accessories:['shell-mailbag','jade-fan','ice-pin'],expression:'smile',pose:'jump',palette:'berry',material:'pearl',effects:['starlight','mist'],tagline:'乘着彩绸穿过星河，把远方的祝福送到你手中。',prompt:'限定造型：原创新国风飞天邮使，朱砂红与青金色交领衣裙配层叠飘带，腰间贝壳星邮包开出一束微型银河，发间原创流苏步摇。飘带呈大而优雅的环形剪影，矿物颜料和珠光细节丰富；不复制任何现有壁画人物。'},
  {id:'neon-nian-beast',title:'霓虹年兽实习生',theme:'tiny-villain',style:'cyber-ice',outfit:'mascot-kigurumi',headwear:'bear-ears',accessories:['toy-robot','light-band','snow-badge'],expression:'tongue',pose:'champion',palette:'berry',material:'metal',effects:['neon','trail'],tagline:'本来来吓人的，结果先被自己的尾巴绊倒了。',prompt:'限定造型：原创小年兽连体服有夸张卷云角、锯齿形霓虹尾巴和一对不对称耳朵，黑红主色配电光青电路纹；肩边悬浮一只圆滚滚巡逻机器人。脸必须清楚像本人，气质是酷炫又笨拙的反差萌，不恐怖、不像已有角色。'},
  {id:'deepsea-whale-post',title:'鲸歌邮差',theme:'deep-sea-mail',style:'candy-gel',outfit:'astronaut-coverall',headwear:'halo-antenna',accessories:['shell-mailbag','crystal-orb','plush-penguin'],expression:'surprise',pose:'wave',palette:'sky',material:'translucent-ice',effects:['mist','starlight'],tagline:'把鲸鱼唱出的蓝色信封，寄给每一个迷路的梦。',prompt:'限定造型：透明深海飞行服叠穿珍珠白短斗篷，背着贝壳邮包，包口探出一只发光小鲸鱼；头顶细环天线像水波扩散，袖口有气泡形玻璃珠。蓝青与珍珠虹彩，精致水下幻想潮玩质感；画面仍为纯色抠图幕，不绘制海景。'},
  {id:'clockwork-cloud-runner',title:'云端时差快递员',theme:'time-runner',style:'miniature-diorama',outfit:'field-researcher',headwear:'pilot-helmet',accessories:['gear-drone','cloud-companion','camera'],expression:'cool',pose:'jump',palette:'lemon',material:'metal',effects:['halo','starlight'],tagline:'从未来寄来的包裹，收件时间写着“现在”。',prompt:'限定造型：柠檬黄与午夜蓝邮差飞行服，背负一只透明齿轮时钟背包，表盘中有微缩云层；一台黄铜机械信鸽无人机叼着时间胶囊伴飞。靴底和袖口出现错位的像素时光切片，完整单人微缩模型收藏品，第一眼看出时空穿梭主题。'},
  {id:'moon-palace-rabbit',title:'月宫玉兔巡游官',theme:'moon-rabbit',style:'storybook-gouache',outfit:'hanfu',headwear:'flower-crown',accessories:['jade-fan','plush-rabbit','moon-wand'],expression:'gentle',pose:'spin',palette:'cream',material:'pearl',effects:['starlight','ice-particles'],tagline:'袖中藏着一轮小月亮，玉兔伙伴正探头张望。',prompt:'限定造型：月白与淡金原创汉服，宽袖内侧是深蓝星图，腰间系玉兔形香囊；一只戴小桂冠的玉兔伙伴坐在月牙形手杖上，衣摆展开成月相轮廓。发间桂花与珍珠步摇清晰可见，优雅华丽、细节层叠，保留本人脸部特征。'},
  {id:'pocket-dino-archivist',title:'口袋恐龙档案员',theme:'dino-pal',style:'amigurumi',outfit:'field-researcher',headwear:'beanie',accessories:['dino-buddy','magic-book','backpack'],expression:'blush',pose:'plush-hug',palette:'mint',material:'plush',effects:['snowflakes','starlight'],tagline:'每翻开一本书，就有一只迷你恐龙从里面跑出来。',prompt:'限定造型：手工钩织探险档案员穿苔绿多口袋背心，怀抱一本会弹出小型立体翼龙的古生物图鉴；肩上另有一只圆滚滚三角龙伙伴，背包挂着琥珀化石。彩色毛线针脚清晰，恐龙有鲜明轮廓和表情，像独家玩具系列主角。'},
  {id:'candy-comet-idol',title:'彗星糖霜偶像',theme:'magical-idol',style:'holo-fashion',outfit:'stage-magician',headwear:'oversized-bow',accessories:['mini-guitar','tiny-bouquet','light-band'],expression:'wink',pose:'champion',palette:'pink-blue',material:'candy-gel',effects:['starlight','neon'],tagline:'每唱完一首歌，发梢就多一颗小小彗星。',prompt:'限定造型：粉蓝全息舞台短礼服采用彗星尾焰般的不对称裙摆，背后有两片透明糖晶星翼，夸张蝴蝶结中心嵌一颗彩虹宝石；手持原创星形迷你电吉他，周围只有贴身的糖霜星轨。高能演唱会主视觉，亮眼、精致、轮廓强。'},
  {id:'mushroom-night-oracle',title:'蘑菇夜行占星师',theme:'forest-mushroom',style:'watercolor',outfit:'hanfu',headwear:'witch-hat',accessories:['crystal-orb','plush-bat','tiny-bouquet'],expression:'cool',pose:'standing',palette:'aurora-purple',material:'ceramic',effects:['mist','starlight'],tagline:'她的水晶球里，住着一只正在打哈欠的小蝙蝠。',prompt:'限定造型：巨型蘑菇菌盖帽檐下垂着星月铃铛，紫罗兰短款汉服外披苔藓绿菌褶斗篷；双手捧透明占星球，球内有微缩发光蘑菇和打哈欠的紫色小蝙蝠。水彩晕染与陶瓷釉面并存，神秘梦幻但表情友善，角色剪影独特。'},
];

export const LEGACY_SECRET_AVATARS = Object.freeze(oldDesigns.map((item)=>Object.freeze({
  ...item, rarity:'rare', tags:['旧藏品','雪域奇遇'], lore:item.prompt,
  silhouetteHint:'一段来自旧图鉴的珍藏记录。', revealTitle:`旧藏揭晓 · ${item.title}`,
  creative:normalizeCreative({...item,scene:'studio',composition:'full-body'}),
})));

export const SECRET_AVATARS = Object.freeze(catalog.map((item)=>Object.freeze({
  ...item, secretId:item.id, revealTitle:`隐藏款揭晓 · ${item.title}`,
  creative:normalizeCreative({...item,scene:'studio',composition:'full-body'}),
})));

export function drawSecret({random=Math.random,chance=SECRET_AVATAR_CHANCE,excludedIds=[]}={}) {
  const excluded=new Set(excludedIds);
  const available=SECRET_AVATARS.filter((item)=>!excluded.has(item.id));
  if(!available.length||random()>=chance)return null;
  const weighted=available.map((item)=>({item,weight:item.rarity==='legendary'?.025:item.rarity==='epic'?.22:1}));
  const total=weighted.reduce((sum,row)=>sum+row.weight,0);
  let roll=random()*total;
  for(const row of weighted){roll-=row.weight;if(roll<0)return row.item;}
  return weighted.at(-1).item;
}

export function applySecretCreative(base,secret) {
  if(!secret)return normalizeCreative(base);
  const current=normalizeCreative(base);
  const locked=new Set(current.metadata?.manualLocks||[]);
  const next={...current};
  for(const key of ['stylePreset','fantasyLevel','faceStyle','world','lifeform','silhouette','bodyStructure','faceDesign','power','style','theme','sport','outfit','hairstyle','headwear','accessories','expression','pose','palette','material','effects','composition']) {
    if(!locked.has(key)&&secret.creative?.[key]!==undefined) next[key]=secret.creative[key];
  }
  if(!locked.has('details')) {
    const companionText=/(伙伴|伴飞|无人机|探出一只|身边跟着|肩边跟着|肩上另有|一只[^，；。]*小[^，；。]*(精灵|恐龙|机器人|蝙蝠|鲸鱼|玉兔))/;
    const secretDetails=String(secret.prompt||'').split(/(?<=[。；])/).filter((part)=>current.companion.enabled||!companionText.test(part)).join('').slice(0,180);
    next.details=secretDetails;
  }
  next.companion=current.companion;
  return normalizeCreative(next);
}
