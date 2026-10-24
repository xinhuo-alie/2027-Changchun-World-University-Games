const option = (id, label, description, prompt) => ({ id, label, description, prompt });

export const CREATIVE_GROUPS = {
  style: [
    option('toy3d','3D 潮玩盲盒','圆润立体、收藏摆件质感','高品质三维潮玩盲盒渲染，雕塑感圆润轮廓，细腻体积光和收藏级产品细节。'),
    option('plush','软萌毛绒玩偶','蓬松短绒、柔软可抱','软萌毛绒玩偶风，短绒纤维清晰柔软，缝线克制，身体轮廓像精心制作的布偶。'),
    option('anime','日系动漫','清爽线稿、赛璐璐上色','日系动画插画，干净线稿、赛璐璐分层阴影、清晰眼神高光和成束发丝。'),
    option('kfashion','韩系时尚插画','轻盈时装感、柔和配色','韩系时尚角色插画，利落服装剪裁、清透柔和色块和细腻时装配饰。'),
    option('game-chibi','Q 版游戏角色','灵动比例、游戏立绘精度','高完成度Q版游戏角色立绘，轮廓鲜明、细节层次清楚、富有亲和力。'),
    option('clay','黏土手办','手作软陶、哑光颗粒','手工黏土手办质感，柔和哑光表面、微妙手作纹理和圆润塑形。'),
    option('brick','乐高积木风','几何积木、拼搭结构','积木玩具风格，以清楚的几何拼搭结构表现人物和服装，避免散落零件。'),
    option('pixel','像素复古风','规整像素、复古游戏色板','复古像素艺术，边缘采用统一像素网格，色板精简且人物轮廓清楚。'),
    option('watercolor','水彩绘本','纸面水彩、柔和晕染','儿童绘本水彩插画，纸张颗粒和透明水彩层次柔和，人物边缘仍清晰。'),
    option('cyber-ice','赛博冰雪风','冷色霓虹、未来装备','冰雪赛博朋克角色设计，冰青与紫色霓虹细节克制，装备结构清晰。'),
    option('candy-gel','糖果胶质感','透亮软胶、糖果高光','半透明糖果胶玩具质感，圆润透光高光，颜色清亮但不过曝。'),
    option('resin','写实收藏级手办','精工树脂、产品摄影','高精度收藏级树脂手办，真实精工表面和细致服装结构，采用产品摄影质感。'),
    option('guochao','新国风动画','水墨线条、现代国潮配色','原创新国风动画插画，利落水墨线条、朱砂与青金配色、现代角色设计。'),
    option('hanhua','敦煌彩绘幻想','矿物色、飞天飘带与壁画纹样','敦煌壁画灵感的原创幻想插画，矿物颜料质感、飘带和莲花纹样，尊重传统服饰结构。'),
    option('cosplay-editorial','Cosplay定妆海报','舞台妆造、戏服细节、镜头感','原创角色Cosplay定妆照风格插画，戏服层次精致，戏剧性侧光与清晰全身造型。'),
    option('fashion-doll','换装娃娃时装册','夸张配饰、潮流剪裁','收藏换装娃娃时装插画，醒目廓形、丰富面料与精心搭配的潮流单品。'),
    option('sticker-pop','立体贴纸拼贴','亮面贴纸、手帐装饰感','高完成度立体贴纸角色插画，粗白描边、亮面贴纸质感与少量手帐装饰符号。'),
    option('gacha-card','奇幻抽卡立绘','稀有卡面、华丽光效','原创奇幻收藏卡角色立绘，稀有卡面级华丽服装与聚焦人物的精致光效，不含文字边框。'),
    option('paper-cut','剪纸戏偶','剪纸层次、戏曲配色','原创剪纸戏偶风角色插画，层叠纸雕轮廓、戏曲启发的鲜明配色和清楚全身造型。'),
    option('retro-anime','千禧年动画','复古赛璐璐、闪亮色块','千禧年复古动画插画，清晰赛璐璐色块、闪亮眼神和带一点怀旧感的大胆配色。'),
    option('storybook-gouache','奇趣厚涂绘本','不规则笔触、故事感','原创奇趣绘本厚涂插画，富有手感的不规则笔触、丰富色彩和温暖故事气息。'),
    option('holo-fashion','Y2K全息时装','镭射材质、千禧潮流','Y2K幻想时装插画，镭射反光面料、彩色透明配件与大胆未来剪裁。'),
    option('amigurumi','钩织小人偶','毛线针织、手作可爱','手工钩织玩偶质感，清楚可见的毛线针脚、圆润比例和温暖手作细节。'),
    option('miniature-diorama','微缩模型收藏盒','微缩雕塑、精致模型感','微缩收藏模型角色渲染，精致手涂细节、模型级质感与完整清晰的人物轮廓。'),
  ],
  theme: [
    option('snow','冰雪潮玩','清爽冬日与软糯冬装','冰雪潮玩主题，以保暖运动服装和冬日细节营造轻快气氛；服装颜色完全按所选主色调绘制。'),
    option('street','街头酷玩','运动街头层搭','街头酷玩主题，运动街头层搭和大胆但协调的色块。'),
    option('sweet','甜梦收藏','糖霜粉彩与精致饰物','甜梦收藏主题，糖霜粉彩、细小精致饰物和温柔氛围。'),
    option('anime','二次元幻想','动画番剧感、角色设定鲜明','原创二次元角色主题，造型设定鲜明、色彩大胆；不模仿现有作品或角色。'),
    option('halloween','万圣节奇想','南瓜、幽灵与俏皮魔法','原创万圣节奇想主题，可加入南瓜、幽灵或蝙蝠元素；可爱奇幻，不恐怖，不模仿现成角色。'),
    option('punk','朋克反叛','格纹、金属扣与撞色层搭','原创朋克主题，格纹、铆钉、金属扣和强烈撞色组合；保持可爱、可穿着。'),
    option('gothic','哥特洋装','黑白蕾丝与古典玩偶感','原创哥特玩偶主题，黑白层叠、精致蕾丝与丝带，华丽但不阴森。'),
    option('idol','偶像舞台','闪亮演出服与星形装饰','原创偶像舞台主题，闪亮层叠演出服与星形装饰，明快自信。'),
    option('space','星际旅人','宇宙探险、未来材质','原创星际旅人主题，未来探索服与彩色宇宙徽记，轻盈而有想象力。'),
    option('retro','复古运动','经典运动图案与怀旧撞色','复古运动主题，经典运动版型、复古徽章和有节制的怀旧撞色。'),
    option('future','未来雪域','银白科技线条','未来雪域主题，银白科技装备和轻量发光细节，不遮挡脸部。'),
    option('polar','极地探险','实用保暖、野外探索','极地探险主题，功能性保暖装备、探索工具和沉静雪原色彩。'),
    option('fairytale','冬日童话','温暖故事感、柔和魔法','冬日童话主题，温暖故事感和少量梦幻装饰。'),
    option('aurora-spirit','极光精灵','流动极光与轻盈幻想','极光精灵主题，青紫渐变光感和轻盈灵动的幻想细节。'),
    option('academy','冰雪学院','整洁学院运动制服','冰雪学院主题，整洁学院制服、校队细节和清新配色。'),
    option('guardian','冰雪守护者','可靠勇敢、冰晶徽记','冰雪守护者主题，可靠勇敢的气质和冰晶守护徽记。'),
    option('pet','冬日萌宠','动物灵感、软萌轮廓','冬日萌宠主题，动物灵感帽兜和亲切玩偶化轮廓。'),
    option('champion','冰雪冠军','荣耀配色与运动荣誉','冰雪冠军主题，专业运动气质、荣耀色彩和克制的冠军细节。'),
    option('hanfu-illusionist','唐风幻术师','齐胸襦裙、璎珞与流光法术','原创唐风幻术师，穿结构清晰的齐胸襦裙或圆领袍，佩戴璎珞与小型法器，华丽又轻盈。'),
    option('cosplay-hero','原创Cosplay角色','漫展定妆、原创角色扮演','原创Cosplay角色扮演造型，可选英雄、魔法师或机甲驾驶员气质；不模仿已知作品和角色。'),
    option('dream-career','未来职业体验','把理想职业变成收藏角色','将理想职业设计成可爱的未来收藏角色，职业工具和制服一眼可辨，加入一处奇幻升级细节。'),
    option('animal-guardian','动物守护灵','动物特征、守护者披风','原创动物守护灵角色，融合一种动物的耳尾或羽翼特征与守护者服装，保持人物脸部清晰。'),
    option('deep-sea-mail','深海邮差','水母灯、贝壳邮包','深海邮差角色，穿透明层叠潜水服，携带贝壳邮包和发光水母伙伴，梦幻而明亮。'),
    option('cloud-chef','云朵甜品师','云朵厨师帽、漂浮甜点','云端甜品师角色，蓬松厨师帽、奇幻围裙和一份漂浮甜点，甜美俏皮。'),
    option('mecha-pilot','迷你机甲驾驶员','驾驶服、机械伙伴','原创迷你机甲驾驶员，穿未来飞行服并与小型机械伙伴搭档，勇敢又可爱。'),
    option('magical-idol','魔法偶像','演出礼服、魔法麦克风','原创魔法偶像角色，舞台演出服融合魔法师细节，手持原创星光麦克风。'),
    option('time-runner','时空快递员','时钟背包、时空旅行','原创时空快递员，穿轻便探险制服，携带奇妙时钟背包与跨时空包裹。'),
    option('dino-pal','恐龙伙伴','恐龙连帽服、化石徽章','穿原创恐龙连帽服的冒险角色，搭配小型恐龙伙伴和化石徽章，搞怪亲切。'),
    option('moon-rabbit','月宫玉兔','月桂纹样、玉兔伙伴','原创月宫玉兔幻想造型，柔软古风衣裙、月桂纹样和可爱玉兔元素，清雅灵动。'),
    option('tiny-villain','反派实习生','华丽黑斗篷、反差萌','可爱的原创反派实习生，穿戏剧化短斗篷，表情自信又有一点笨拙，气氛轻松不恐怖。'),
    option('forest-mushroom','蘑菇森林精灵','菌菇斗篷、森林小精怪','原创蘑菇森林精灵，菌菇形斗篷、苔藓色细节与一只奇妙森林小伙伴。'),
  ],
  sport: [
    option('ski','双板滑雪','双板与雪杖','双板滑雪，双脚分别固定在两块滑雪板上，配一对雪杖。'),
    option('cross-country','越野滑雪','耐力雪服、双板和长雪杖','越野滑雪，轻量保暖竞速服、双板和较长雪杖。'),
    option('snowboard','单板滑雪','侧身站姿、单块雪板','单板滑雪，双脚固定于同一块横向雪板，身体侧向运动。'),
    option('skate','花样滑冰','冰刀鞋与优雅动作','花样滑冰，冰刀鞋和优雅稳定的冰上姿势，不出现雪板。'),
    option('short-track','短道速滑','贴身竞速服与弯道姿态','短道速滑，流线型竞速服、护目镜和低重心弯道姿态。'),
    option('speed-skating','速度滑冰','竞速连体服与冰刀','速度滑冰，贴身竞速连体服、长冰刀和前倾滑行姿势。'),
    option('hockey','冰球','球杆、冰球与护具','冰球，合理冰球护具、冰球杆和一枚冰球，双手自然握杆。'),
    option('curling','冰壶','冰壶刷与冰壶','冰壶，保暖队服、冰壶刷和一枚冰壶，姿势稳健。'),
    option('freestyle','自由式滑雪','宽松雪服与技巧雪板','自由式滑雪，灵活雪服、双板和富有动感但结构清楚的姿势。'),
    option('aerials','空中技巧','竞速雪服与腾空姿态','空中技巧滑雪，双板、保暖竞速服和安全清晰的腾空姿势。'),
    option('winter-run','冰雪越野跑','防风层搭与跑步鞋','冰雪越野跑，防风保暖跑步层搭、抓地跑鞋和自然奔跑姿势。'),
    option('snow-adventure','雪地探险','探险背包与雪地装备','雪地探险，轻便保暖外层、雪地靴和小型探索背包。'),
    option('leisure','冬季休闲运动','轻便保暖、自在活动','冬季休闲运动，舒适保暖的户外衣物和自然放松姿势。'),
    option('custom-sport','自定义运动主题','按补充描述表现项目','依照用户补充说明表现运动主题，器材结构保持合理。'),
    option('character','自由角色展示','不强制冰雪器材','自由角色展示，不强制运动器材；姿势、服饰和随身物件按角色主题设计。'),
  ],
  scene: [
    option('studio','收藏级摄影棚','柔和影棚轮廓光','柔和中性主光和清晰轮廓光；只影响人物光色，保留纯色抠图背景。'),
    option('rink','梦幻冰场','清透冰面反光','清透冰蓝反射光；只影响人物光色，保留纯色抠图背景。'),
    option('mountain','雪山赛道','冷冽雪山日光','冷冽日光与雪白反射光；只影响人物光色，保留纯色抠图背景。'),
    option('aurora','极光夜色','青紫极光映照','青紫极光映照人物边缘，正面保持柔和清晰；保留纯色抠图背景。'),
    option('castle','冰雪城堡','晶莹城堡冷光','晶莹清透的冷色折射光；只影响人物光色，保留纯色抠图背景。'),
    option('changchun','长春冬日街景','北方城市冬日色温','冷蓝色环境光与温暖色温补光；只影响人物光色，保留纯色抠图背景。'),
    option('forest','林海雪原','松林雪色反射','清冷绿蓝色反射光；只影响人物光色，保留纯色抠图背景。'),
    option('crystal-palace','冰晶宫殿','冰晶折射高光','清透克制的冷色折射高光；只影响人物光色，保留纯色抠图背景。'),
    option('future-base','未来冰雪基地','冷色科技灯光','洁净冷色侧光；只影响人物光色，保留纯色抠图背景。'),
    option('cafe','冬日咖啡馆','暖光与冰蓝平衡','温暖柔和主光与冰蓝冷调补光形成平衡；只影响人物光色，保留纯色抠图背景。'),
    option('candy-house','糖果雪屋','柔和糖果色反射','柔和克制的糖果色反射光；只影响人物光色，保留纯色抠图背景。'),
    option('podium','冰雪颁奖舞台','金色荣耀灯光','柔和金色轮廓光；只影响人物光色，保留纯色抠图背景。'),
  ],
  outfit: [
    option('puffer','蓬松羽绒服','短款蓬松轮廓、分区绗缝','穿蓬松短款羽绒服，清晰分区绗缝和厚实立领。'),
    option('ski-suit','专业滑雪服','流线拼接、防风层次','穿专业滑雪服，流线拼接、防风面料和功能口袋。'),
    option('hockey-kit','冰球运动服','球衣、护肩与护腿','穿冰球球衣和结构合理的轻量护具。'),
    option('skating-dress','花样滑冰演出服','轻纱层叠、闪点刺绣','穿花样滑冰演出服，轻盈层叠剪裁和细小冰晶刺绣。'),
    option('academy-uniform','冰雪学院制服','学院徽章、运动制服剪裁','穿冰雪学院运动制服，整洁领口和原创学院徽章。'),
    option('street-hoodie','街头潮流卫衣','宽松帽衫、分层下摆','穿宽松街头运动卫衣，层次下摆和精致抽绳。'),
    option('plush-suit','毛绒连体服','短绒连体剪裁、软糯体积','穿短绒毛绒连体服，缝线和拉链结构简洁清楚。'),
    option('tech-suit','未来科技战衣','模块拼接、柔性发光线','穿未来科技运动战衣，模块化拼接和少量柔性发光线。'),
    option('retro-jacket','复古运动夹克','撞色滚边、复古徽章','穿复古运动夹克，撞色滚边和原创复古徽章。'),
    option('polar-suit','极地探险服','多层防寒、工具口袋','穿多层极地探险服，实用口袋、护颈和防风外层。'),
    option('knitwear','冬日针织穿搭','粗针织纹理、温暖层搭','穿冬日针织层搭，清晰粗针织纹理和柔软围脖。'),
    option('champion-uniform','冰雪冠军礼服','运动礼服、奖章细节','穿剪裁利落的冰雪冠军礼服，少量原创奖章细节。'),
    option('animal-hood','可爱动物连帽服','动物耳朵兜帽、连体保暖','穿动物主题连帽保暖服，耳朵结构可爱但不遮脸。'),
    option('witch-cape','俏皮魔法斗篷','短斗篷、星月滚边','穿短款魔法斗篷，配星月滚边和灵动层叠裙摆；不遮脸、不拖地。'),
    option('pumpkin-overall','南瓜精灵背带装','南瓜口袋、蓬松灯笼裤','穿原创南瓜精灵背带装，圆润灯笼裤和南瓜口袋，保留清晰肢体。'),
    option('punk-jacket','朋克拼接夹克','格纹、金属扣、贴布章','穿原创朋克拼接夹克，格纹、金属扣和多层贴布章，比例轻巧。'),
    option('gothic-dress','哥特娃娃洋装','黑白蕾丝、层叠裙摆','穿黑白哥特娃娃洋装，精致蕾丝、蝴蝶结和层叠裙摆。'),
    option('idol-stage','星光偶像演出服','亮片短外套、飘带','穿原创偶像演出服，亮片短外套和不对称飘带，动作方便。'),
    option('anime-school','动漫社团制服','短夹克、领结、角色徽章','穿原创动画社团制服，短夹克、领结和自创徽章，不出现文字标识。'),
    option('space-suit','星际探险服','透明舱领、彩色模块','穿轻量星际探险服，彩色模块、透明护领和原创星球徽章。'),
    option('royal-cape','童话王子/公主披风','华丽短披风、宝石扣','穿童话舞台礼服与华丽短披风，宝石扣闪亮但不遮挡面部。'),
    option('custom-outfit','自定义穿搭','服装以补充描述为准','服装款式以用户的自定义细节为准，保证剪裁真实可穿。'),
    option('hanfu','原创汉服','交领襦裙、宽袖与系带','穿原创汉服，交领、宽袖与系带结构清楚，避免把传统服饰与现代运动服混淆。'),
    option('wuxia-traveler','古风侠客装','短打劲装、护腕与披风','穿轻便古风侠客劲装，配护腕、腰封与短披风，行动利落。'),
    option('cosplay-armor','轻甲Cosplay服','原创软甲、肩甲与腰封','穿原创轻量Cosplay软甲，肩甲和腰封结构清楚，保留可爱比例与自然关节。'),
    option('astronaut-coverall','星际飞行制服','飞行服拼片、任务徽章','穿原创星际飞行制服，拼接护具、任务徽章与清晰靴子。'),
    option('dream-chef','奇幻甜品师围裙','糖果口袋、奶油褶边','穿可爱的甜品师围裙和蓬松衬衫，糖果口袋精致但不遮挡角色。'),
    option('field-researcher','野外研究员背心','多口袋、采样工具','穿轻便野外研究员背心和耐磨靴，配小型观察工具，专业又亲切。'),
    option('stage-magician','舞台魔术礼服','燕尾短外套、闪亮内衬','穿原创舞台魔术师礼服，短燕尾外套、亮色内衬和清晰腰线。'),
    option('mascot-kigurumi','动物吉祥物连体服','大耳朵、圆爪手套','穿原创动物吉祥物连体服，耳朵和圆爪手套可爱，面部保持露出。'),
  ],
  hairstyle: [
    option('short-fluffy','蓬松短发','轻盈蓬松发束','蓬松短发，层次自然并保留发际线。'), option('twin-tails','双马尾','运动感双束发','双马尾发型，发束位置清楚且适合运动。'),
    option('bun','高丸子头','利落高丸子发髻','高丸子头，发髻结构利落。'), option('long-curls','长卷发','柔软长卷发束','柔软长卷发，发束清楚并收拢在运动安全范围。'),
    option('side-braid','侧编发','精致侧编发','一侧精致编发，纹理清晰。'), option('center-long','中分长发','自然中分长发','自然中分长发，保持脸部两侧清楚。'),
    option('mushroom','可爱蘑菇头','圆润短发轮廓','圆润可爱的蘑菇短发。'), option('sport-short','运动短发','贴合运动的短发','利落运动短发，不遮挡眼睛。'),
    option('fantasy-gradient','渐变幻想发型','柔和双色发梢','幻想渐变发型，发梢双色渐变自然克制。'), option('preserve','保留原有发型','保留参考人物身份特征','严格保留参考人物原有发型、发色和发际线，不擅自改变人物身份。'),
  ],
  headwear: [
    option('beanie','针织帽','有织纹的保暖帽','戴针织保暖帽，保留发型轮廓。'), option('bear-ears','熊耳帽','圆耳软帽','戴带圆润熊耳的软帽。'),
    option('cat-ears','猫耳帽','小巧猫耳帽','戴小巧猫耳帽，避免夸张尖刺。'), option('hood','毛绒兜帽','短绒包边兜帽','戴有短绒包边的保暖兜帽，不遮脸。'),
    option('goggles','滑雪护目镜','置于额头或眼部上方','佩戴滑雪护目镜，镜片可反光但不遮挡眼睛和面部。'), option('star-clip','星星发夹','小型星形发夹','佩戴小型星星发夹。'),
    option('crown','冰晶皇冠','轻巧冰晶头饰','佩戴轻巧冰晶皇冠，轮廓轻薄不遮脸。'), option('headband','运动发带','贴合额头运动发带','佩戴贴合额头的运动发带。'),
    option('earmuffs','毛绒耳罩','圆润保暖耳罩','佩戴一对圆润毛绒耳罩。'), option('none','不添加装饰','不增加头部装饰','头部不添加帽子、头饰或护目镜。'),
    option('witch-hat','俏皮尖顶帽','软质尖顶、星月缀饰','戴一顶俏皮软质尖顶帽，缀有原创星月装饰，不遮挡眼睛。'),
    option('oversized-bow','夸张蝴蝶结','大尺寸丝带、亮面布料','佩戴一个醒目的大蝴蝶结头饰，轮廓柔软且不遮住脸。'),
    option('beret','彩色贝雷帽','侧戴软呢帽','侧戴一顶色彩鲜明的软呢贝雷帽。'),
    option('hanfu-hairpin','古风步摇','小巧流苏发簪','佩戴一支原创古风步摇发簪，流苏轻巧，不遮挡眼睛。'),
    option('fox-ears','蓬松狐耳发箍','柔软狐耳、渐变耳尖','佩戴柔软蓬松的原创狐耳发箍，耳尖渐变自然。'),
    option('pilot-helmet','迷你飞行头盔','圆润护耳、透明面罩上翻','戴圆润迷你飞行头盔，透明面罩翻起并露出完整脸部。'),
    option('chef-hat','云朵厨师帽','蓬松圆顶、糖果徽章','戴一顶蓬松云朵厨师帽，缀原创糖果形徽章。'),
    option('halo-antenna','天线光环','小型机械天线、柔光圆环','佩戴原创小型机械天线和细窄柔光环，保持轮廓轻巧。'),
    option('flower-crown','野花花冠','小花叶片、柔软编织感','佩戴一圈原创野花编织花冠，花朵小巧且不遮住额头。'),
  ],
  accessory: [
    option('scarf','毛绒围巾','柔软围巾','搭配一条柔软毛绒围巾。'), option('gloves','毛绒手套','保暖短绒手套','搭配保暖毛绒手套。'), option('round-glasses','圆框眼镜','轻巧圆框眼镜','搭配轻巧圆框眼镜并确保双眼可见。'),
    option('headphones','运动耳机','贴耳运动耳机','搭配贴耳运动耳机。'), option('ice-pin','冰晶胸针','小型冰晶胸针','胸前佩戴小型冰晶胸针。'), option('snow-badge','雪花徽章','原创雪花徽章','服装上搭配原创雪花徽章。'),
    option('mini-stick','迷你冰球杆','比例合理的小球杆','携带比例合理的迷你冰球杆。'), option('mini-skis','迷你滑雪板','一副小型双板','携带一副迷你双板滑雪板。'), option('mini-curling','迷你冰壶','小型冰壶道具','携带一枚迷你冰壶。'),
    option('medal','奖牌挂件','小巧金属奖牌','搭配一枚小巧奖牌挂件。'), option('backpack','小型运动背包','轻便贴身背包','背一只轻便小型运动背包。'), option('light-band','发光手环','柔和发光手环','佩戴柔和发光手环。'),
    option('ice-cape','透明冰晶披风','轻透短披风','搭配轻透短款冰晶披风，保持肢体轮廓清楚。'), option('plush-toy','毛绒玩偶','手持小型玩偶','抱着一只小型毛绒玩偶。'), option('number-tag','角色号码牌','无文字号码牌','佩戴简洁无文字的角色号码牌。'), option('none','不添加配饰','保持服装简洁','不增加额外配饰。'),
    option('plush-bear','毛绒泰迪','圆耳熊玩偶','双手抱着一只圆耳泰迪熊玩偶，玩偶不遮挡脸部。'),
    option('plush-fox','毛绒狐狸','橘色狐狸玩偶','单臂抱着一只橘色毛绒狐狸玩偶，尾巴蓬松醒目。'),
    option('plush-cat','毛绒猫咪','软萌猫咪玩偶','抱着一只软萌猫咪玩偶，猫耳和尾巴清楚可见。'),
    option('plush-rabbit','毛绒兔子','长耳兔玩偶','怀抱一只长耳毛绒兔子玩偶，姿势自然。'),
    option('plush-penguin','毛绒企鹅','圆滚企鹅玩偶','抱着一只圆滚滚的企鹅玩偶，黑白配色清楚。'),
    option('plush-bat','毛绒蝙蝠','紫黑小蝙蝠玩偶','抱着一只可爱紫黑色毛绒蝙蝠玩偶，不恐怖。'),
    option('toy-robot','迷你机器人伙伴','彩色机器人玩偶','手持一只原创彩色迷你机器人玩偶，结构简洁亲切。'),
    option('pumpkin-lantern','南瓜提灯','暖光南瓜小灯','手提一盏小巧原创南瓜提灯，提手清晰，不生成火焰背景。'),
    option('moon-wand','星月魔法棒','星星与月牙装饰','手持一支原创星月魔法棒，尺寸小巧，不遮挡脸部。'),
    option('mini-guitar','迷你电吉他','彩色朋克小乐器','背着一把原创迷你电吉他，背带固定自然。'),
    option('magic-book','魔法绘本','立体封面小书','双手抱着一本原创奇幻绘本，封面无可读文字。'),
    option('jade-fan','玉骨折扇','青玉扇骨、留白扇面','手持一把青玉扇骨的原创折扇，扇面留白，不出现文字。'),
    option('brush-talisman','迷你符笔','毛笔与彩色符纸','携带一支小巧毛笔和一枚原创彩色符纸，轻盈不遮脸。'),
    option('stethoscope','彩色听诊器','医生职业小道具','佩戴一只彩色儿童听诊器，造型圆润，体现友善的医护职业。'),
    option('chef-whisk','星星打蛋器','甜品师小工具','手持一支星星形小打蛋器，体现奇幻甜品师身份。'),
    option('camera','迷你拍立得相机','彩色相机与相纸','挂一台原创彩色迷你相机，露出一张无图案小相纸。'),
    option('shell-mailbag','贝壳邮包','珍珠扣、海星邮戳','背着一只贝壳造型邮包，珍珠扣与海星细节清晰。'),
    option('dino-buddy','口袋恐龙伙伴','小型圆滚恐龙','肩边跟着一只圆滚滚的原创口袋恐龙伙伴。'),
    option('cloud-companion','云朵小伙伴','漂浮微笑云团','身旁漂浮一团带微笑的原创小云朵伙伴，尺寸不超过头部。'),
    option('gear-drone','机械小助手','圆润迷你无人机','身旁跟着一只原创圆润迷你机械助手，结构简单且不遮挡人物。'),
    option('crystal-orb','掌心占卜水晶','彩色透明小水晶球','双手捧着一颗透明彩色小水晶球，柔和发光但不遮住脸。'),
    option('tiny-bouquet','迷你花束','彩纸包装、明亮花朵','手持一小束明亮原创花朵，彩纸包装清楚可见。'),
  ],
  expression: [
    option('smile','元气微笑','明亮亲和的微笑','表情是明亮元气的微笑。'), option('wink','俏皮眨眼','自然单眼眨眼','自然俏皮地眨一只眼，另一只眼保持完整。'),
    option('blush','害羞脸红','轻微腮红、羞涩微笑','脸颊微红，带羞涩微笑。'), option('cool','自信酷脸','自信从容、不凶狠','自信从容的酷感表情，不要凶狠。'),
    option('surprise','惊喜张嘴','惊喜而开心','惊喜地微微张嘴，情绪开心。'), option('focus','认真专注','专注运动状态','认真专注的运动表情，五官仍然柔和。'),
    option('gentle','温柔微笑','安静温和','安静温柔地微笑。'), option('tongue','调皮吐舌','轻松调皮','轻松调皮地吐舌，保持可爱自然。'),
    option('cheer','胜利欢呼','兴奋庆祝','开心欢呼庆祝胜利。'), option('preserve','保留原有表情','不改变参考人物表情','保留参考人物原有表情和面部气质，不改变人物身份。'),
  ],
  pose: [
    option('standing','自然站立展示','正面稳定全身站姿','自然站立展示，完整清楚呈现服装。'), option('peace','双手比耶','轻松双手比耶','双手在肩旁比耶，手指结构自然。'),
    option('thumbs-up','单手点赞','一手点赞、一手自然下垂','单手点赞，另一只手自然放松。'), option('trophy','双手举起奖杯','双手稳稳举杯','双手举起一只小型奖杯。'),
    option('ski-sprint','滑雪冲刺','双板与雪杖动态冲刺','双板滑雪冲刺姿势，雪杖和双板结构正确。'), option('jump','腾空跳跃','轻快腾空姿势','轻快腾空跳跃姿势，四肢自然且器材完整。'),
    option('spin','花样滑冰旋转','单脚旋转、裙摆舒展','花样滑冰旋转姿势，冰刀支撑自然。'), option('hockey-shot','冰球射门','持杆挥杆击球','冰球射门姿势，双手握杆并对准冰球。'),
    option('curling-throw','冰壶投掷','低姿态推出冰壶','冰壶投掷姿势，低重心并自然推出冰壶。'), option('snowball','双手捧雪球','手捧一颗雪球','双手捧着一颗小雪球。'),
    option('wave','回头招手','自然回头挥手','回头招手，身体和脸部方向自然。'), option('plush-hug','抱着毛绒玩偶','双臂轻抱玩偶','双臂轻轻抱住一只毛绒玩偶。'),
    option('champion','冠军庆祝姿势','自信庆祝、不遮脸','做冠军庆祝姿势，动作有力但不遮住面部。'), option('preserve','保留原有姿势','保留参考姿态','保留参考人物原有姿势，不擅自改变角色身份表现。'),
  ],
  palette: [
    option('glacier','冰川蓝','冰蓝、雪白、深海蓝','主色使用冰川蓝，搭配雪白和少量深海蓝。'), option('mint','薄荷绿','薄荷青、乳白','主色使用薄荷绿和冰青。'),
    option('aurora-purple','极光紫','紫罗兰与青色','主色使用极光紫，少量冰青平衡。'), option('cream','奶油白','暖白、浅金','主色使用奶油白和浅金细节。'),
    option('sakura','樱花粉','柔粉、雪白','主色使用柔和樱花粉与雪白。'), option('lemon','柠檬黄','明亮黄、冰蓝','主色使用柠檬黄并以冰蓝压住饱和度。'),
    option('berry','莓果红','莓果红、奶白','主色使用莓果红和奶白。'), option('sky','天空蓝','晴空蓝、云白','主色使用天空蓝和云白。'),
    option('black-silver','黑银科技色','石墨黑、银色','采用黑银科技配色，亮面层次克制。'), option('blue-purple','蓝紫渐变','冰蓝过渡到紫色','采用自然冰蓝到紫色渐变。'),
    option('pink-blue','粉蓝渐变','粉色过渡到天蓝','采用柔和粉蓝渐变。'), option('random','随机配色','生成协调的冬日配色','选择协调的冬日随机配色，避免高饱和颜色冲突。'),
  ],
  material: [
    option('matte-vinyl','哑光软胶','柔和哑光、细腻软胶','表面为细腻哑光软胶。'), option('translucent-ice','半透明冰晶','透光冰晶、清晰折射','局部采用半透明冰晶材质，折射清晰克制。'),
    option('pearl','珍珠光泽','细腻珠光','表面带细腻珍珠光泽。'), option('plush','柔软毛绒','短绒纤维','衣物呈柔软短绒质感。'),
    option('knit','针织织物','清楚针织纹理','衣物表现清楚的针织织物纹理。'), option('candy-gel','透明糖果胶','透亮软胶高光','局部使用透明糖果胶质感，避免整体过曝。'),
    option('metal','金属镀层','精细金属边件','小面积配件采用精细金属镀层。'), option('ceramic','陶瓷手办','细腻釉面陶瓷','主体呈细腻陶瓷手办质感。'),
    option('crystal','水晶玻璃','清澈玻璃高光','局部呈现清澈水晶玻璃质感。'), option('resin','高级树脂收藏品','精工树脂表面','整体呈高级精工树脂收藏品质感。'),
  ],
  effect: [
    option('aurora-ring','环绕极光','少量环绕光带','角色轮廓内侧带克制的极光色高光，不越出主体轮廓。'), option('snowflakes','雪花纹样','衣物上的细小雪花纹样','在衣物上添加少量精致雪花纹样，不在背景漂浮雪花。'),
    option('ice-particles','冰晶细节','服饰边缘的细小冰晶','在服饰或装备边缘添加少量冰晶装饰，不散落到背景。'), option('starlight','梦幻星光','饰品上的微弱星点','让小型饰品带柔和星光反射，不在背景添加星点。'),
    option('mist','冰雾色光','柔和的冷色轮廓光','用柔和冰雾色光塑造人物轮廓，不遮挡人物且不改变背景。'), option('neon','霓虹轮廓光','青紫描边光','以克制的青紫色轮廓光勾勒人物边缘，不越出主体。'),
    option('trail','冰雪运动纹样','服装上的简洁动感线条','在服饰上加入简洁冰雪运动线条，不生成背景拖尾。'), option('halo','闪亮魔法光环','角色身后的窄光环','用紧贴角色轮廓的细线光环点缀，禁止跨出纯色背景区域。'),
    option('softbox','柔和摄影棚光','高光柔和、阴影清楚','使用柔和影棚主光和清楚轮廓光。'), option('none','不添加特效','保持画面干净','不添加粒子、光环或动态特效。'),
  ],
  composition: [
    option('full-body','全身角色展示','从头到鞋完整入镜','全身构图，从头发到鞋底完整入镜，主要器材也完整可见。'),
    option('half','半身潮玩肖像','腰部以上人物肖像','半身潮玩肖像，清楚呈现脸部和上身服装。'),
    option('with-gear','角色与运动道具','人物和主要器材同框','角色与主要运动道具同框，器材不遮挡脸部。'),
    option('product','收藏级产品摄影','中心产品构图、留白充足','收藏级产品摄影构图，角色居中、留白充足。'),
    option('action','动态运动瞬间','动作轨迹清楚','捕捉动态运动瞬间，肢体和器材结构清晰不重叠。'),
  ],
};

export const DEFAULT_CREATIVE = Object.freeze({
  version: 2, gender:'random', style:'toy3d', theme:'snow', vibe:'snow', sport:'ski', scene:'studio', outfit:'ski-suit',
  hairstyle:'preserve', headwear:'goggles', accessories:['scarf'], expression:'smile', pose:'standing',
  palette:'glacier', material:'matte-vinyl', effects:[], composition:'full-body', details:'',
});

export const CREATIVE_GENDER_OPTIONS = Object.freeze([
  { id:'male', label:'男' },
  { id:'female', label:'女' },
  { id:'random', label:'随机' },
]);
const CREATIVE_GENDER_IDS = new Set(CREATIVE_GENDER_OPTIONS.map((item) => item.id));

const LEGACY_SPORT = { skate:'skate', alpine:'ski', snowboard:'snowboard', skiing:'ski' };
const ids = Object.fromEntries(Object.entries(CREATIVE_GROUPS).map(([key, list]) => [key, new Set(list.map((item) => item.id))]));
const validValue = (group, value) => ids[group]?.has(value) ? value : DEFAULT_CREATIVE[group];
const limited = (values, group, max, noneId) => {
  if (!Array.isArray(values)) return [];
  const clean = [...new Set(values.filter((id) => ids[group].has(id)))];
  if (clean.includes(noneId)) return [noneId];
  return clean.slice(0, max);
};

export function normalizeCreative(raw = {}) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const theme = validValue('theme', source.theme || source.vibe);
  const accessories = limited(source.accessories ?? DEFAULT_CREATIVE.accessories, 'accessory', 3, 'none');
  const effects = limited(source.effects ?? DEFAULT_CREATIVE.effects, 'effect', 2, 'none');
  return {
    version:2,
    gender:CREATIVE_GENDER_IDS.has(source.gender) ? source.gender : DEFAULT_CREATIVE.gender,
    style:validValue('style', source.style), theme, vibe:theme,
    sport:validValue('sport', LEGACY_SPORT[source.sport] || source.sport),
    scene:validValue('scene', source.scene), outfit:validValue('outfit', source.outfit),
    hairstyle:validValue('hairstyle', source.hairstyle), headwear:validValue('headwear', source.headwear), accessories,
    expression:validValue('expression', source.expression), pose:validValue('pose', source.pose),
    palette:validValue('palette', source.palette), material:validValue('material', source.material), effects,
    composition:validValue('composition', source.composition),
    metadata:source.metadata&&typeof source.metadata==='object'&&!Array.isArray(source.metadata)&&Number.isFinite(Number(source.metadata.randomSeed))?{randomSeed:Number(source.metadata.randomSeed)>>>0}:undefined,
    details:typeof source.details === 'string' ? source.details.replace(/[\u0000-\u001f\u007f<>]/g, ' ').slice(0,240) : '',
  };
}

const RECOMMENDATIONS = {
  ski:['ski-suit','goggles',['mini-skis'],'ski-sprint'], 'cross-country':['ski-suit','headband',[],'ski-sprint'], snowboard:['ski-suit','goggles',[],'jump'],
  skate:['skating-dress','headband',[],'spin'], 'short-track':['ski-suit','goggles',[],'ski-sprint'], 'speed-skating':['ski-suit','goggles',[],'ski-sprint'],
  hockey:['hockey-kit','goggles',['mini-stick'],'hockey-shot'], curling:['academy-uniform','headband',['mini-curling'],'curling-throw'],
  freestyle:['ski-suit','goggles',['mini-skis'],'jump'], aerials:['ski-suit','goggles',['mini-skis'],'jump'],
  'winter-run':['polar-suit','headband',['backpack'],'standing'], 'snow-adventure':['polar-suit','hood',['backpack'],'wave'],
  leisure:['puffer','earmuffs',[],'standing'], 'custom-sport':['custom-outfit','none',[],'standing'], character:['anime-school','none',[],'standing'],
};

export function recommendCreativeForSport(current, sport) {
  const creative = normalizeCreative({ ...current, sport });
  const [outfit, headwear, accessories, pose] = RECOMMENDATIONS[creative.sport] || RECOMMENDATIONS.ski;
  return normalizeCreative({ ...creative, outfit, headwear, accessories, pose });
}

export const CREATIVE_PRESETS = [
  { id:'aurora-spirit', label:'极光精灵', description:'极光、冰晶与轻盈雪服', values:{style:'anime',theme:'aurora-spirit',sport:'skate',scene:'aurora',outfit:'skating-dress',hairstyle:'long-curls',headwear:'crown',accessories:['ice-pin','ice-cape'],expression:'gentle',pose:'spin',palette:'blue-purple',material:'translucent-ice',effects:['aurora-ring','starlight'],composition:'full-body'} },
  { id:'champion', label:'冰雪冠军', description:'竞速装备与荣耀舞台', values:{style:'toy3d',theme:'champion',sport:'short-track',scene:'podium',outfit:'champion-uniform',hairstyle:'sport-short',headwear:'goggles',accessories:['medal','snow-badge'],expression:'cheer',pose:'champion',palette:'glacier',material:'resin',effects:['starlight'],composition:'full-body'} },
  { id:'snow-plush', label:'软萌雪团子', description:'毛绒连体服与暖冬配色', values:{style:'plush',theme:'pet',sport:'leisure',scene:'cafe',outfit:'plush-suit',hairstyle:'mushroom',headwear:'bear-ears',accessories:['plush-toy','scarf'],expression:'blush',pose:'plush-hug',palette:'cream',material:'plush',effects:['snowflakes'],composition:'full-body'} },
  { id:'future-skier', label:'未来滑雪手', description:'银色科技服与雪山赛道', values:{style:'cyber-ice',theme:'future',sport:'ski',scene:'future-base',outfit:'tech-suit',hairstyle:'sport-short',headwear:'goggles',accessories:['light-band','mini-skis'],expression:'cool',pose:'ski-sprint',palette:'black-silver',material:'metal',effects:['neon','trail'],composition:'action'} },
  { id:'street-toy', label:'街头潮玩', description:'宽松卫衣与运动耳机', values:{style:'game-chibi',theme:'street',sport:'snowboard',scene:'changchun',outfit:'street-hoodie',hairstyle:'twin-tails',headwear:'beanie',accessories:['headphones','backpack'],expression:'wink',pose:'jump',palette:'berry',material:'matte-vinyl',effects:['trail'],composition:'action'} },
  { id:'ice-princess', label:'冰晶公主', description:'冰晶礼服与城堡光影', values:{style:'resin',theme:'fairytale',sport:'skate',scene:'castle',outfit:'skating-dress',hairstyle:'long-curls',headwear:'crown',accessories:['ice-pin','ice-cape'],expression:'gentle',pose:'spin',palette:'sky',material:'crystal',effects:['starlight','mist'],composition:'product'} },
  { id:'polar-explorer', label:'极地探险家', description:'实用户外服与林海雪原', values:{style:'toy3d',theme:'polar',sport:'snow-adventure',scene:'forest',outfit:'polar-suit',hairstyle:'short-fluffy',headwear:'hood',accessories:['backpack','gloves'],expression:'focus',pose:'wave',palette:'mint',material:'knit',effects:['snowflakes'],composition:'with-gear'} },
  { id:'fluffy-animal', label:'毛绒小动物', description:'动物耳帽与柔软毛绒', values:{style:'clay',theme:'pet',sport:'leisure',scene:'candy-house',outfit:'animal-hood',hairstyle:'mushroom',headwear:'cat-ears',accessories:['plush-toy','gloves'],expression:'smile',pose:'snowball',palette:'sakura',material:'plush',effects:['snowflakes','starlight'],composition:'full-body'} },
].map((preset) => ({ ...preset, values:normalizeCreative(preset.values) }));

export function applyCreativePreset(id, { gender = DEFAULT_CREATIVE.gender } = {}) {
  return normalizeCreative({ ...(CREATIVE_PRESETS.find((preset) => preset.id === id)?.values || DEFAULT_CREATIVE), gender });
}

export function randomCreative(random = Math.random) {
  const pick = (group) => CREATIVE_GROUPS[group][Math.floor(random() * CREATIVE_GROUPS[group].length)].id;
  const sport = pick('sport');
  const recommended = recommendCreativeForSport(DEFAULT_CREATIVE, sport);
  const optional = (group, max) => CREATIVE_GROUPS[group].filter((item) => item.id !== 'none')
    .filter(() => random() < .28).slice(0,max).map((item) => item.id);
  return normalizeCreative({ ...recommended, style:pick('style'), theme:pick('theme'), scene:pick('scene'), hairstyle:pick('hairstyle'), expression:pick('expression'), palette:pick('palette'), material:pick('material'), composition:pick('composition'), accessories:optional('accessory',3), effects:optional('effect',2), details:'' });
}

export function clearCreativeDetails(current) {
  return normalizeCreative({ ...current, hairstyle:'preserve', headwear:'none', accessories:[], expression:'preserve', pose:'preserve', effects:[], details:'' });
}

export function creativeOption(group, id) {
  return CREATIVE_GROUPS[group]?.find((item) => item.id === id) || null;
}
