import { VENUES } from './venues.js';
import { getPlaceMedia } from './place-media.js';

const attractions = [
  { id: 'palace', name: '伪满皇宫博物院', color: '#c28a50', mapPos: { x: 98, z: -172 }, address: '长春市宽城区光复北路一带', sports: ['历史建筑', '博物馆'],
    teaser: '穿过一组风格各异的建筑，把一段复杂历史读出层次。',
    desc: '博物院建立在溥仪充当伪满洲国傀儡皇帝时期的宫廷遗址上。勤民楼、缉熙楼、同德殿等建筑与专题展览共同呈现这一特殊时期的历史。这里的参观重点是结合史料理解建筑用途与殖民统治背景，而非只看宫廷外观。',
    architecture: '图标提取同德殿的坡屋顶、对称立面与层叠檐口，表现历史建筑群的轮廓。',
    highlights: ['先从历史背景展览建立时间线，再看宫廷旧址。', '观察不同建筑的屋顶、门窗与立面风格。', '把建筑用途与人物活动联系起来，理解历史。'],
    itinerary: '历史展览 → 宫廷建筑群 → 回顾近代历史脉络', duration: '建议留出 2—3 小时', sourceUrl: 'https://dfz.jl.gov.cn/ybjl/201805/t20180502_5217176.html', sourceTitle: '吉林省地方志 · 伪满皇宫博物院' },
  { id: 'film', name: '长影旧址博物馆', color: '#d18c74', mapPos: { x: -215, z: -8 }, address: '长春市朝阳区红旗街一带', sports: ['电影文化', '工业遗产'],
    teaser: '走进电影厂旧址，沿着摄影机、道具和老厂房找银幕背后的故事。',
    desc: '长影旧址博物馆位于长春电影制片厂原址，以老建筑、电影实物与创作历史串起长春的电影记忆。参观时可以从道具、摄影与声音制作等线索，认识一部电影如何从片场来到银幕。',
    architecture: '图标保留电影厂老建筑的暖色立面与规整窗格，并以胶片卷盘提示电影主题。',
    highlights: ['在老厂房里寻找电影生产留下的空间痕迹。', '留意道具与幕后制作材料，而不只看明星海报。', '结合当日展览了解摄影、配音与电影创作。'],
    itinerary: '老建筑外观 → 电影历史陈列 → 幕后制作展区', duration: '建议留出 1.5—2 小时', sourceUrl: 'https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/jdyjhsdjy/202505/t20250523_9238772.html', sourceTitle: '吉林省文旅厅 · 长影旧址博物馆' },
  { id: 'mountainmall', name: '这有山', color: '#c29b60', mapPos: { x: -332, z: -100 }, address: '长春市朝阳区红旗街商圈', sports: ['城市休闲', '室内山城'],
    teaser: '一座搬进室内的山城：不用爬远，也能边走边换视角。',
    desc: '“这有山”将山地场景融入室内商业空间，把起伏步道、不同高度的店铺与休闲体验组织在一起。它的特色是空间本身：沿坡道行走，视角会不断变化，可以在不同高度观察室内山城的层次。',
    architecture: '图标突出室内层叠山体、曲折步道、暖色店铺与上方玻璃空间。',
    highlights: ['沿步道观察店铺随高差形成的层次。', '从高处回看山体与灯光，寻找自己的构图。', '与附近长影旧址串联，体验电影文化与城市生活。'],
    itinerary: '山脚入口 → 山间步道 → 高处观景 → 特色店铺', duration: '建议留出 1—2 小时', sourceUrl: 'https://jldrc.jl.gov.cn/fgdt/jldt/202609/t20260923_3672215.html', sourceTitle: '吉林省发改委 · 这有山' },
  { id: 'nanhu', name: '南湖公园', color: '#57a7ac', mapPos: { x: -182, z: 155 }, address: '长春市朝阳区南湖片区', sports: ['湖畔漫步', '城市公园'],
    teaser: '从热闹街区走到湖岸，让脚步和城市一起慢下来。',
    desc: '南湖公园是长春城市游览中的湖畔休闲节点，可与新民大街、文化广场及红旗街片区串联。这里适合把行程从室内展览切换为户外漫步，观察湖岸、树木与城市天际线在四季中的变化。',
    architecture: '图标以湖面、临水亭阁与拱桥作为辨识线索，用薄雪保留北方冬日气息。',
    highlights: ['沿开放的湖岸步道寻找水面与树影。', '用同一视角观察季节色彩的变化。', '冬季在开放步道游览，冰面活动以公园现场安排为准。'],
    itinerary: '城市街区 → 湖岸步道 → 临水景观 → 林间休憩', duration: '建议留出 1 小时左右', sourceUrl: 'https://www.jlairports.com/changchun/contents/162/253.html', sourceTitle: '长春机场周边景点 · 南湖公园' },
  { id: 'culture', name: '文化广场', color: '#8794c3', mapPos: { x: -126, z: -126 }, address: '长春市朝阳区文化广场片区', sports: ['城市地标', '街区漫游'],
    teaser: '在开阔广场上抬头看建筑，也看看长春人如何使用城市客厅。',
    desc: '文化广场是串联长春城市历史与街区生活的一处开放空间。它与新民大街、吉林大学地质博物馆等周边节点共同构成城市漫游线索，适合从开阔的广场视角认识街区尺度与建筑关系。',
    architecture: '图标用广场中央雕塑的向上姿态与开阔基座表达地标特征，配以周边建筑剪影。',
    highlights: ['在广场上观察雕塑与周边建筑的空间关系。', '把文化广场与新民大街纳入一条步行故事线。', '留意城市公共空间中人们休憩与交流的方式。'],
    itinerary: '广场地标 → 建筑观察 → 新民大街片区', duration: '建议留出 30—60 分钟', sourceUrl: 'https://m.thepaper.cn/newsDetail_forward_29974516', sourceTitle: '吉林省文旅厅 · 文化广场' },
  { id: 'century', name: '长影世纪城', color: '#ad8cc9', mapPos: { x: 277, z: 290 }, address: '长春净月片区', sports: ['电影主题', '互动体验'],
    teaser: '走进电影主题场景，试着用导演视角寻找镜头和布景。',
    desc: '长影世纪城是长春以电影文化为线索的主题旅游节点。与讲述电影生产历史的长影旧址博物馆不同，这里更侧重主题场景与互动体验，适合与净月片区的自然游览组合，形成文化与休闲并行的行程。',
    architecture: '图标以电影主题建筑的塔楼轮廓与胶片元素表达园区特征，为概括插画。',
    highlights: ['从主题场景里寻找电影视觉叙事的手法。', '把互动体验与电影制作的原理联系起来。', '实际演出与项目安排以园区当天公告为准。'],
    itinerary: '主题场景 → 互动体验 → 电影文化观察', duration: '按当日项目安排半天行程', sourceUrl: 'https://www.changying.com/', sourceTitle: '长影世纪城官网' },
].map(p => ({ ...p, city: '长春', kind: 'attraction', cloudMinutes: p.id === 'century' ? 12 : 8 }));

const attractionGames = {
  palace: { engine:'attraction', title:'历史线索整理', subtitle:'梳理历史背景、建筑线索与历史影响，理解这段复杂历史。', icon:'📚', params:{ placeId:'palace' } },
  film: { engine:'attraction', title:'电影节奏剪辑台', subtitle:'把建立场景、动作与反应排成一段顺畅的电影节奏。', icon:'🎬', params:{ placeId:'film' } },
  mountainmall: { engine:'attraction', title:'山城寻路', subtitle:'规划山脚、步道与高处停靠点，体验室内山路的空间层次。', icon:'🧭', params:{ placeId:'mountainmall' } },
  nanhu: { engine:'attraction', title:'冰晶记忆配对', subtitle:'记住依次亮起的冰晶图案，再按顺序找回来。', icon:'❄️', params:{ placeId:'nanhu' } },
  culture: { engine:'attraction', title:'城市剪影找不同', subtitle:'观察广场剪影，找到提示中的三个城市细节。', icon:'🏛️', params:{ placeId:'culture' } },
  century: { engine:'attraction', title:'电影镜头快反', subtitle:'根据每条导演提示，及时选择镜头、音效或特效。', icon:'🎞️', params:{ placeId:'century' } },
};
for (const place of attractions) place.game = attractionGames[place.id];

const venueDetails = {
  wuhuan: ['环形馆体与层叠屋顶', '弯道时运动员为何要倾斜身体？', '先观察场馆轮廓，再在节奏挑战中体验短道速滑的加速感。'],
  speed: ['大跨度索拱屋顶', '长直道与弯道如何分配体力？', '留意开阔的冰面与屋顶结构，体验速度滑冰的稳定节奏。'],
  cityhall: ['冰壶赛道与低矮馆体', '刷冰如何影响冰壶前进？', '观察靶心、路线与落点，在投掷挑战中理解力度控制。'],
  provhall: ['冰球馆体与球门', '冰球的射门角度怎样改变得分机会？', '从球门与球杆认识冰球，把握移动目标的射门时机。'],
  olympic: ['分层看台与宽阔体育馆', '决赛舞台如何让观众看清冰面？', '关注看台与冰面的关系，再体验一轮冰球射门。'],
  jingyue: ['林海、雪道与湖岸', '越野滑雪与高山滑雪有何不同？', '从连续起伏的林间赛道认识越野滑雪的耐力与节奏。'],
  lianhua: ['空中技巧跳台与落地区', '运动员如何把速度变成腾空高度？', '沿助滑、起跳、腾空、落地四个环节理解空中技巧。'],
  sculpture: ['户外雕塑与开放园地', '城市公园怎样成为体育活动的舞台？', '把雕塑与雪地活动联系起来，感受艺术和运动相遇。'],
  songhuahu: ['湖畔山地与连续雪道', '单板滑雪如何控制转弯？', '观察山体坡度与雪道走向，在挑战中练习变向。'],
  beidahu: ['山峰、U 型池与跳台', 'U 型池的弧面为何能让运动员再次腾空？', '比较回转与技巧项目的场地差异，认识不同雪上运动。'],
};

const venueSources = {
  wuhuan: ['https://www.jl.gov.cn/szfzt/tzcj/tpxwx/202609/t20260916_3670709.html', '吉林省政府 · 长春五环体育馆'],
  speed: ['https://tyj.jl.gov.cn/mobile/tydt_143339/jjty_143365/201803/t20180302_5825657.html', '吉林省体育局 · 吉林省速滑馆'],
  cityhall: ['https://www.jl.gov.cn/szfzt/gzlfz/ywdt/202606/t20260601_3634659.html', '吉林省政府 · 长春市滑冰馆'],
  provhall: ['https://news.cnjiwang.com/jlxwdt/sn/202610/4087809.html', '吉林发布 · 吉林省滑冰馆'],
  olympic: ['https://www.jl.gov.cn/szfzt/dxdc/jljxs/jljxsld/202604/t20260415_3623554.html', '吉林省政府 · 长春奥体公园体育馆'],
  jingyue: ['https://www.jingyuetan.cn/', '净月潭景区官网 · 滑雪场'],
  lianhua: ['https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/zcs/zcs_424332/202507/t20250703_9272005.html', '吉林省文旅厅 · 莲花山滑雪场'],
  sculpture: ['https://sjfw.mct.gov.cn/site/dataservice/culdetails?curId=10&id=34836', '文化和旅游部 · 长春世界雕塑园'],
  songhuahu: ['https://www.ctg.cn/article/20116', '中国旅游集团 · 松花湖度假区'],
  beidahu: ['https://www.beidahu.com/about/6.html', '北大湖滑雪度假区官网 · 雪道'],
};

const positions = {
  wuhuan: [180,-60], speed: [-12,110], cityhall: [160,95], provhall: [-12,-80], olympic: [280,-355],
  jingyue: [330,205], lianhua: [500,-70], sculpture: [15,320], songhuahu: [690,220], beidahu: [720,415],
};
export function listPlaces() {
  const places = [...VENUES.map(v => {
    const d = venueDetails[v.id] || ['冰雪竞赛建筑', '这项运动最考验什么？', '先了解场地，再体验对应的冰雪挑战。'];
    const [sourceUrl, sourceTitle] = venueSources[v.id];
    return { ...v, mapPos: { x: positions[v.id][0], z: positions[v.id][1] }, kind: 'venue', cloudMinutes: 6, architecture: `图标提取${d[0]}，以概括插画呈现场馆特征。`, highlights: [d[2], `带着问题看比赛：${d[1]}`, `体验「${v.game.title}」，挑战成功后收集纪念章。`], itinerary: '认场馆 → 找比赛细节 → 玩一局挑战 → 把纪念章收入护照', duration: '云游建议 2—5 分钟', sourceUrl, sourceTitle };
  }), ...attractions];
  return places.map(place => ({ ...place, ...getPlaceMedia(place.id) }));
}
