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
  ],
  theme: [
    option('snow','冰雪潮玩','清爽冬日与软糯冬装','冰雪潮玩主题，以保暖运动服装和冬日细节营造轻快气氛；服装颜色完全按所选主色调绘制。'),
    option('street','街头酷玩','运动街头层搭','街头酷玩主题，运动街头层搭和大胆但协调的色块。'),
    option('sweet','甜梦收藏','糖霜粉彩与精致饰物','甜梦收藏主题，糖霜粉彩、细小精致饰物和温柔氛围。'),
    option('retro','复古运动','经典运动图案与怀旧撞色','复古运动主题，经典运动版型、复古徽章和有节制的怀旧撞色。'),
    option('future','未来雪域','银白科技线条','未来雪域主题，银白科技装备和轻量发光细节，不遮挡脸部。'),
    option('polar','极地探险','实用保暖、野外探索','极地探险主题，功能性保暖装备、探索工具和沉静雪原色彩。'),
    option('fairytale','冬日童话','温暖故事感、柔和魔法','冬日童话主题，温暖故事感和少量梦幻装饰。'),
    option('aurora-spirit','极光精灵','流动极光与轻盈幻想','极光精灵主题，青紫渐变光感和轻盈灵动的幻想细节。'),
    option('academy','冰雪学院','整洁学院运动制服','冰雪学院主题，整洁学院制服、校队细节和清新配色。'),
    option('guardian','冰雪守护者','可靠勇敢、冰晶徽记','冰雪守护者主题，可靠勇敢的气质和冰晶守护徽记。'),
    option('pet','冬日萌宠','动物灵感、软萌轮廓','冬日萌宠主题，动物灵感帽兜和亲切玩偶化轮廓。'),
    option('champion','冰雪冠军','荣耀配色与运动荣誉','冰雪冠军主题，专业运动气质、荣耀色彩和克制的冠军细节。'),
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
  ],
  scene: [
    option('studio','收藏级摄影棚','柔和影棚轮廓光','收藏级摄影棚的柔和主光和清晰轮廓光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('rink','梦幻冰场','清透冰面反光','梦幻冰场的清透冰蓝反射光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('mountain','雪山赛道','冷冽雪山日光','雪山赛道的冷冽日光与雪白反射光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('aurora','极光夜色','青紫极光映照','青紫极光映照人物边缘，正面保持柔和清晰；保留纯色抠图背景。'),
    option('castle','冰雪城堡','晶莹城堡冷光','晶莹冰雪城堡般的冷色折射光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('changchun','长春冬日街景','北方城市冬日色温','北方冬日街景般的冷蓝环境光与温暖窗光色彩；此选项只影响人物光色，保留纯色抠图背景。'),
    option('forest','林海雪原','松林雪色反射','松林雪原的清冷绿蓝反射光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('crystal-palace','冰晶宫殿','冰晶折射高光','冰晶宫殿般清透克制的折射高光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('future-base','未来冰雪基地','冷色科技灯光','未来冰雪基地的洁净冷色灯光；此选项只影响人物光色，保留纯色抠图背景。'),
    option('cafe','冬日咖啡馆','暖光与冰蓝平衡','温暖咖啡馆灯光与窗外冰蓝色的柔和色温对比；保留纯色抠图背景。'),
    option('candy-house','糖果雪屋','柔和糖果色反射','柔和糖果色反射光，饱和度克制；此选项只影响人物光色，保留纯色抠图背景。'),
    option('podium','冰雪颁奖舞台','金色荣耀灯光','柔和舞台主光与克制的金色荣耀轮廓光；保留纯色抠图背景。'),
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
    option('custom-outfit','自定义穿搭','服装以补充描述为准','服装款式以用户的自定义细节为准，保证剪裁真实可穿。'),
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
  ],
  accessory: [
    option('scarf','毛绒围巾','柔软围巾','搭配一条柔软毛绒围巾。'), option('gloves','毛绒手套','保暖短绒手套','搭配保暖毛绒手套。'), option('round-glasses','圆框眼镜','轻巧圆框眼镜','搭配轻巧圆框眼镜并确保双眼可见。'),
    option('headphones','运动耳机','贴耳运动耳机','搭配贴耳运动耳机。'), option('ice-pin','冰晶胸针','小型冰晶胸针','胸前佩戴小型冰晶胸针。'), option('snow-badge','雪花徽章','原创雪花徽章','服装上搭配原创雪花徽章。'),
    option('mini-stick','迷你冰球杆','比例合理的小球杆','携带比例合理的迷你冰球杆。'), option('mini-skis','迷你滑雪板','一副小型双板','携带一副迷你双板滑雪板。'), option('mini-curling','迷你冰壶','小型冰壶道具','携带一枚迷你冰壶。'),
    option('medal','奖牌挂件','小巧金属奖牌','搭配一枚小巧奖牌挂件。'), option('backpack','小型运动背包','轻便贴身背包','背一只轻便小型运动背包。'), option('light-band','发光手环','柔和发光手环','佩戴柔和发光手环。'),
    option('ice-cape','透明冰晶披风','轻透短披风','搭配轻透短款冰晶披风，保持肢体轮廓清楚。'), option('plush-toy','毛绒玩偶','手持小型玩偶','抱着一只小型毛绒玩偶。'), option('number-tag','角色号码牌','无文字号码牌','佩戴简洁无文字的角色号码牌。'), option('none','不添加配饰','保持服装简洁','不增加额外配饰。'),
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
  version: 2, style:'toy3d', theme:'snow', vibe:'snow', sport:'ski', scene:'studio', outfit:'ski-suit',
  hairstyle:'preserve', headwear:'goggles', accessories:['scarf'], expression:'smile', pose:'standing',
  palette:'glacier', material:'matte-vinyl', effects:[], composition:'full-body', details:'',
});

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
    style:validValue('style', source.style), theme, vibe:theme,
    sport:validValue('sport', LEGACY_SPORT[source.sport] || source.sport),
    scene:validValue('scene', source.scene), outfit:validValue('outfit', source.outfit),
    hairstyle:validValue('hairstyle', source.hairstyle), headwear:validValue('headwear', source.headwear), accessories,
    expression:validValue('expression', source.expression), pose:validValue('pose', source.pose),
    palette:validValue('palette', source.palette), material:validValue('material', source.material), effects,
    composition:validValue('composition', source.composition),
    details:typeof source.details === 'string' ? source.details.replace(/[\u0000-\u001f\u007f<>]/g, ' ').slice(0,240) : '',
  };
}

const RECOMMENDATIONS = {
  ski:['ski-suit','goggles',['mini-skis'],'ski-sprint'], 'cross-country':['ski-suit','headband',[],'ski-sprint'], snowboard:['ski-suit','goggles',[],'jump'],
  skate:['skating-dress','headband',[],'spin'], 'short-track':['ski-suit','goggles',[],'ski-sprint'], 'speed-skating':['ski-suit','goggles',[],'ski-sprint'],
  hockey:['hockey-kit','goggles',['mini-stick'],'hockey-shot'], curling:['academy-uniform','headband',['mini-curling'],'curling-throw'],
  freestyle:['ski-suit','goggles',['mini-skis'],'jump'], aerials:['ski-suit','goggles',['mini-skis'],'jump'],
  'winter-run':['polar-suit','headband',['backpack'],'standing'], 'snow-adventure':['polar-suit','hood',['backpack'],'wave'],
  leisure:['puffer','earmuffs',[],'standing'], 'custom-sport':['custom-outfit','none',[],'standing'],
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

export function applyCreativePreset(id) {
  return CREATIVE_PRESETS.find((preset) => preset.id === id)?.values || normalizeCreative();
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
