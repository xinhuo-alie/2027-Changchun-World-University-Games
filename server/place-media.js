import { readFileSync } from 'node:fs';

let importedGalleries = {};
try {
  importedGalleries = JSON.parse(readFileSync(new URL('../data/place-gallery.json', import.meta.url), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const commons = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1400`;
const filePage = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replaceAll('%20', '_')}`;
const photo = (id, file, title, caption, credit, license) => ({
  id, src: commons(file), alt: `${title}实景照片`, title, caption, credit,
  sourceUrl: filePage(file), license,
});

// Images are embedded from Wikimedia Commons, with their file page and license
// visible in the gallery. Other locations keep their existing original art until
// a suitable openly licensed photograph can be verified.
const galleries = {
  palace: [
    photo('tongde-hall', '25238-Changchun, Museum of the Imperial Palace of Manchukuo.jpg', '同德殿的屋顶与立面', '中西式细节并置，是伪满皇宫建筑群里很醒目的视觉线索。', 'xiquinhosilva', 'CC BY 2.0'),
    photo('palace-banquet', '1长春伪满皇宫内的宴会厅.jpg', '宫廷旧址里的宴会厅', '从室内陈设读空间用途，也别忘了把建筑放回它所处的历史背景。', 'ZZY1998', 'CC0 1.0'),
  ],
  film: [
    photo('film-museum-2024', 'Changchun Film Studio Museum 2024.jpg', '长影旧址博物馆', '红旗街老厂区留下的建筑立面，像一张尚未褪色的电影场记板。', 'Licjar Xeymelloz', 'CC0 1.0'),
    photo('film-studio', 'Changchun Film Studio.jpg', '长影老建筑入口', '走近老建筑，想象一部电影从布景、摄影到配音逐步成形。', 'Francesc Fort', 'CC BY-SA 4.0'),
  ],
  mountainmall: [
    photo('the-hill', 'The Hill, Changchun (20230725131741).jpg', '室内山城「这有山」', '这座约 30 米高的室内人造山，让逛街路线变成了层层上行的小探险。', 'N509FZ', 'CC BY-SA 4.0'),
  ],
  nanhu: [
    photo('nanhu-lake', 'Nanhu-See im Nanhu-Park, Changchun.jpg', '南湖与城市天际线', '湖面把天空和城市倒映在一起；放慢脚步，视野会从街巷切换到水岸。', 'Anaximenes', 'CC BY-SA 4.0'),
  ],
  culture: [
    photo('culture-square', '长春文化广场-地质宫广场-新京顺天广场 - panoramio.jpg', '文化广场与地质宫', '广场的开阔感适合抬头看建筑、低头看城市生活，也能串起新民大街一带。', 'wanghongliu', 'CC BY-SA 3.0'),
  ],
  century: [
    photo('movie-wonderland-gate', 'Changchun Movie Wonderland entrance.jpg', '长影世纪城入口', '电影主题园区把日常的入口变成了故事开场，适合留意建筑如何制造气氛。', 'Francesc Fort', 'CC BY-SA 4.0'),
    photo('movie-wonderland-scene', 'Changchun Movie Wonderland - 26.jpg', '园区电影主题场景', '把镜头语言搬进游乐空间，边走边找场景里的取景框。', 'Francesc Fort', 'CC BY-SA 4.0'),
  ],
  sculpture: [
    photo('sculpture-park', 'Changchun World Sculpture Park.jpg', '世界雕塑园的户外作品', '雕塑与园林共同构成开放展厅；换个角度走近，轮廓和尺度也会变化。', 'Air7538', 'CC BY-SA 4.0'),
  ],
  songhuahu: [
    photo('songhua-lake', '松花湖 大漠2.jpg', '松花湖山水远眺', '松花湖与周边山地构成吉林市冬季运动目的地的壮阔背景。', '大漠1208', 'CC BY 3.0'),
  ],
  jingyue: [
    photo('jingyue-lake', '净月潭 jing yue tan - panoramio.jpg', '净月潭湖林景色', '湖面、林海和雪道在这里相遇；赛道本身也是认识越野滑雪节奏的入口。', 'wanghongliu', 'CC BY-SA 3.0'),
    photo('jingyue-panorama', '净月潭.jpg', '森林与湖岸的开阔视野', '沿湖走一段，再把视线抬向森林边线，能感受到城市边缘的辽阔。', 'Cscen', 'CC BY-SA 4.0'),
  ],
};

const notes = {
  wuhuan: ['从这里开始认识冰上运动：短道速滑靠的不只是快，弯道里的重心、线路和时机都在悄悄抢分。', '找一找环形馆体与冰面之间的关系，再去挑战里踩出自己的比赛节奏。'],
  speed: ['速度滑冰的长直道像一条蓝色计时线，运动员要把稳定步频一路带过弯道。', '看比赛时试着数几次蹬冰；节奏连贯，比单纯猛冲更有用。'],
  cityhall: ['冰壶看起来慢悠悠，实际上每一壶都像在冰面上下一盘棋：力度、线路和队友刷冰缺一不可。', '先找出靶心，再想想最后一投要留在哪个位置。'],
  provhall: ['冰球比赛像一段高速剪辑：攻守切换很快，队友之间的传球让空当转瞬即逝。', '观察球门角度和守门员移动，小游戏里也试试等一个更好的射门窗口。'],
  olympic: ['半决赛和决赛会把注意力都聚到冰面中央。看台层次、视线和场地布局，组成了比赛现场的舞台感。', '找一个“观众席最佳视角”，想象决胜时刻全场同时屏住呼吸。'],
  jingyue: ['净月潭把森林公园变成雪上运动的长跑道。越野滑雪讲究耐力和节拍，滑得匀，才能把风景看得更远。', '在照片里找湖岸和林线，再去耐力挑战里分配体力。'],
  lianhua: ['空中技巧有四幕：助滑、起跳、腾空、落地。最惊艳的瞬间只有几秒，背后却是反复练出的线路与控制。', '沿着跳台想象运动员的飞行轨迹，给自己的落地动作打个分。'],
  sculpture: ['雕塑园不是只能安静看展的地方：作品、步道和冬季赛道会在同一片户外空间里相遇。', '选一件作品记住它的轮廓，走远几步再回头看，尺度感会完全不同。'],
  songhuahu: ['松花湖的山势起伏，把滑雪路线变成一连串选择题：什么时候换刃、何时压弯，都会影响下一段速度。', '从山脊和雪道走向开始观察，给自己挑一条最想滑的线。'],
  beidahu: ['北大湖雪道类型丰富，从高山回转到 U 型池、坡面技巧和大跳台，不同项目各有自己的“空中语法”。', '看看 U 型池两侧的弧面，想象它怎样把速度送回空中。'],
  palace: ['勤民楼、缉熙楼、同德殿各有用途和风格。把展签、房间和建筑细节串成时间线，会比只拍一张宫殿照更容易读懂这段复杂历史。', '挑一处屋檐或窗格做“建筑侦探”，再回展厅找它背后的年代线索。'],
  film: ['长影的故事不止在银幕上，也藏在摄影机、录音、道具和老厂房里。这里适合把“电影怎么拍出来”一路追问到底。', '找一件幕后工具，猜猜它在片场里负责哪一道工序。'],
  mountainmall: ['“这有山”把商业空间做成室内山路，逛街时视线会随着坡道和楼层不断变化。下雨下雪也能完成一趟城市小徒步。', '试着从高处往回看，找到一条能把楼层、灯光和店铺连成画面的路线。'],
  nanhu: ['南湖适合给紧凑行程按下暂停键：水岸、桥和树影把城市生活收进一段慢步行。', '看看湖面反射出的天空颜色；冬季冰面活动请遵守现场管理安排。'],
  culture: ['文化广场的开阔感来自它和周边街区、地质宫一起形成的城市尺度。这里不必赶路，抬头观察建筑轮廓就很有收获。', '站在广场边缘回望中心，再顺路把新民大街接进自己的漫步路线。'],
  century: ['长影世纪城和长影旧址讲的是电影的两面：一个让你走进主题场景，一个带你回看电影生产的历史。', '逛主题场景时试着找“镜头会放在哪里”，会多出一层导演视角。'],
};

export function getPlaceMedia(placeId) {
  const gallery = importedGalleries[placeId]?.length ? importedGalleries[placeId] : (galleries[placeId] || []);
  const [story, fieldNote] = notes[placeId] || ['慢慢观察地点的建筑、自然与人的活动，旅行记忆往往藏在细节里。', '选一个最打动你的细节，留作本页的小发现。'];
  return {
    gallery,
    galleryStatus: gallery.length ? 'open-license' : 'illustration-fallback',
    story,
    fieldNote,
  };
}
