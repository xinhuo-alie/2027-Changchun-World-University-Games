/**
 * 大冬会 10 座竞赛场馆的数据。
 *
 * 名称 / 地址 / 承担项目 / 简介 来自赛事官网公开接口。
 *
 * mapPos 是按**真实相对方位**折算的示意坐标（x = 东正西负，z = 南正北负，1 单位约 1 公里）。
 * 方位关系是对的（比如奥体在北、净月潭在东南、吉林市两座在很远的东南），
 * 但距离做了压缩 —— 真实世界里吉林市离长春约 160 公里，
 * 按真实比例走过去要几十分钟，云展览体验会崩。所以一切以便于游览为准。
 *
 * building：程序化建模用的建筑类型与参数（不调用任何生成接口）
 * game：按比赛项目分配的小游戏配置（玩法见 web/minigame-redesign.js）
 */

export const VENUES = [
  {
    id: 'wuhuan',
    name: '长春五环体育馆',
    city: '长春',
    sports: ['短道速滑', '花样滑冰', '开幕式'],
    teaser: '从开幕式的第一束光，到冰刀掠过弯道的瞬间：你的冰雪之旅从这里开始。',
    isCeremony: true,
    address: '长春市南关区亚泰大街 4899 号',
    desc:
      '1998 年 7 月建成，总建筑面积 31192 平方米，改造后可容纳观众 10931 人。曾举办第六届亚冬会、六次世界杯短道速滑赛、第九届与第十二届全国冬运会。本届承担开幕式，以及短道速滑和花样滑冰两个项目的全部赛事。',
    mapPos: { x: 0, z: 0 },
    color: '#4FA8E8',
    building: { type: 'ring', radius: 13, height: 8, rings: 5 },
    game: {
      engine: 'rhythm',
      title: '短道速滑 500 米',
      subtitle: '踩准冰面节拍，交替蹬冰追上对手',
      icon: '⛸️',
      params: { target: 500, rival: 0.64, unit: '米', accent: '#4FA8E8', duration: 18 },
    },
  },
  {
    id: 'speed',
    name: '吉林省速滑馆',
    city: '长春',
    sports: ['速度滑冰'],
    teaser: '长直道、疾风与分秒必争的冲刺；来感受速度滑冰的节奏。',
    address: '长春市南关区吉顺街 1202 号',
    desc:
      '采用 90 米跨度大型索拱结构体系，总建筑面积 3 万平方米，可容纳 2000 名观众。本届改造换装乙二醇绿色制冷系统，冰面下方布设数百组温度传感器，实现毫米级冰面平整度管控。承担速度滑冰项目的全部赛事。',
    mapPos: { x: -92, z: 72 },
    color: '#5FD3E8',
    building: { type: 'oval-ice', rx: 22, rz: 12, height: 7 },
    game: {
      engine: 'rhythm',
      title: '速度滑冰 1000 米',
      subtitle: '抓准步频，在长直道上连续踩出完美节拍',
      icon: '⛸️',
      params: { target: 1000, rival: 0.72, unit: '米', accent: '#5FD3E8', duration: 18, period: 0.58 },
    },
  },
  {
    id: 'cityhall',
    name: '长春市滑冰馆',
    city: '长春',
    sports: ['冰壶'],
    teaser: '看似轻轻一投，背后却是路线、力度与队友默契的较量。',
    address: '长春市南关区吉顺街 950-A 号',
    desc:
      '曾举办第六届亚洲冬季运动会冰壶比赛、第六届全国冰壶比赛、第十二届全国冬季运动会冰壶比赛。本届改造维修面积 5347.82 平方米，对屋顶网架实施专项加固并集成化升级消防系统，承担冰壶项目的全部赛事。',
    mapPos: { x: 66, z: 88 },
    color: '#FF9EBE',
    building: { type: 'box-ice', w: 18, d: 14, height: 8, sheets: 4 },
    game: {
      engine: 'aim',
      title: '冰壶 · 最后一投',
      subtitle: '选好力量和路线，用最后几壶争夺营心',
      icon: '🥌',
      params: { mode: 'curling', rounds: 3, goal: 7, unit: '分', accent: '#FF9EBE' },
    },
  },
  {
    id: 'provhall',
    name: '吉林省滑冰馆',
    city: '长春',
    sports: ['女子冰球循环赛/排名赛', '男子冰球排名赛'],
    teaser: '球杆击向冰面，队友冲向球门。先从一次射门认识冰球的热血。',
    address: '长春市南关区吉顺街 32 号',
    desc:
      '场馆历史悠久，曾举办第九届全国冬季运动会、第六届亚洲冬季运动会、第十二届全国冬季运动会等重大冰上赛事。本届承担女子冰球循环赛、排名赛以及男子冰球排名赛。',
    mapPos: { x: -26, z: -96 },
    color: '#7FE0C4',
    building: { type: 'box-ice', w: 20, d: 15, height: 9, sheets: 2, goals: true },
    game: {
      engine: 'aim',
      title: '冰球射门',
      subtitle: '读守门员的移动方向，连续完成五次点球',
      icon: '🏒',
      params: { mode: 'hockey', shots: 5, goalieSpeed: 1.1, unit: '球', accent: '#7FE0C4' },
    },
  },
  {
    id: 'olympic',
    name: '长春奥林匹克公园体育馆',
    city: '长春',
    sports: ['男子冰球', '冰球半决赛/决赛'],
    teaser: '决赛的舞台，每一次攻防都可能改变比分；准备好迎接冰球挑战了吗？',
    address: '长春市宽城区北湖科技开发区中科大街与大学城路交会',
    desc:
      '曾举办吉林省第十八届运动会短道速滑与花样滑冰比赛、中国滑冰协会首届短道系列联赛第一站。本届承担男子冰球循环赛，以及男子、女子冰球的半决赛和决赛。',
    mapPos: { x: 96, z: -192 },
    color: '#7FA8F0',
    building: { type: 'stadium', radius: 24, height: 12, tiers: 3 },
    game: {
      engine: 'aim',
      title: '冰球点球大战',
      subtitle: '决赛点球大战，读守门员移动，在五次射门中争取破门',
      icon: '🥅',
      params: { mode: 'hockey', shots: 5, goalieSpeed: 1.55, unit: '球', accent: '#7FA8F0' },
    },
  },
  {
    id: 'jingyue',
    name: '长春净月潭滑雪场',
    city: '长春',
    sports: ['越野滑雪', '残疾人越野滑雪', '滑雪定向'],
    teaser: '滑进林海雪原，让脚步跟上雪道的起伏，认识越野滑雪的耐力之美。',
    address: '长春市南关区净月大街 5840 号（净月潭国家森林公园）',
    desc:
      '场内 5 条滑雪赛道、雪道总长 3800 米，拥有国际雪联认证的 25 公里瓦萨越野滑雪专业赛道。自 2003 年起连续举办 24 届中国长春净月潭瓦萨国际滑雪节。承担越野滑雪（含残疾人越野滑雪）和滑雪定向项目的全部赛事。',
    mapPos: { x: 202, z: 212 },
    color: '#6FD6B4',
    building: { type: 'ski', peaks: 3, snowTrails: 4, forest: true, lake: true },
    game: {
      engine: 'endurance',
      title: '净月雪野耐力赛',
      subtitle: '管理体力节奏，在上坡与下坡间滑向终点',
      icon: '🎿',
      params: { target: 1180, unit: '米', accent: '#6FD6B4', duration: 20 },
    },
  },
  {
    id: 'lianhua',
    name: '长春莲花山滑雪场',
    city: '长春',
    sports: ['自由式滑雪空中技巧'],
    teaser: '冲上跳台、跃向天空，看看运动员如何把勇气与技巧留在雪上。',
    address: '长春市二道区莲花山生态旅游度假区四家乡青山村',
    desc:
      '建有符合国际赛事标准的专业赛道，曾成功举办八届 11 站国际雪联自由式滑雪空中技巧世界杯、全国第二届青年运动会等赛事。承担自由式滑雪空中技巧项目的全部赛事。',
    mapPos: { x: 322, z: -112 },
    color: '#A9D6FF',
    building: { type: 'ski', peaks: 4, snowTrails: 3, aerial: true, forest: true },
    game: {
      engine: 'jump',
      title: '空中技巧',
      subtitle: '踩准起跳点、空中控姿势，稳稳完成三次落地',
      icon: '🤸',
      params: { jumps: 3, goal: 12, unit: '分', accent: '#A9D6FF' },
    },
  },
  {
    id: 'sculpture',
    name: '长春世界雕塑园',
    city: '长春',
    sports: ['冬季越野跑'],
    teaser: '从雕塑与雪景之间出发，用一场越野跑感受冬日城市的活力。',
    address: '长春市南关区人民大街 9518 号',
    desc:
      '园内建有符合国际赛事标准的专业赛道，核心赛道总长 2000 米，配备完善的竞赛功能区。曾举办雪雕赛事、户外越野定向赛等文体活动。承担本届新增项目冬季越野跑的全部赛事。',
    mapPos: { x: -176, z: 152 },
    color: '#B79BE8',
    building: { type: 'park', sculptures: 9, radius: 22 },
    game: {
      engine: 'dodge',
      title: '雕塑雪径旗门赛',
      subtitle: '沿雕塑园雪径选线穿门，积攒能量完成冲刺',
      icon: '🏃',
      params: { speed: 0.88, gates: 7, goal: 13, unit: '分', accent: '#B79BE8', duration: 17 },
    },
  },
  {
    id: 'songhuahu',
    name: '吉林松花湖滑雪场',
    city: '吉林市',
    sports: ['滑雪登山', '单板滑雪平行项目'],
    teaser: '雪板划过旗门，山坡变成赛道。来体验平行大回转的速度感。',
    address: '吉林市丰满区青山街 888 号',
    desc:
      '承担滑雪登山、单板滑雪平行项目（男子/女子平行大回转、平行回转）两个项目的赛事。与北大湖滑雪场同属吉林市分赛区，两市赛区公路距离约 160 公里。',
    mapPos: { x: 522, z: 292 },
    color: '#FFB1A0',
    building: { type: 'ski', peaks: 5, snowTrails: 5, forest: true, lake: true, big: true },
    game: {
      engine: 'dodge',
      title: '单板平行大回转',
      subtitle: '在山道上连续穿旗门，抓住时机发动冲刺',
      icon: '🏂',
      params: { speed: 1.08, gates: 8, goal: 16, unit: '分', accent: '#FFB1A0', duration: 17 },
    },
  },
  {
    id: 'beidahu',
    name: '吉林北大湖滑雪场',
    city: '吉林市',
    sports: ['高山滑雪', '残疾人高山滑雪', 'U型池', '坡面障碍技巧', '大跳台'],
    teaser: '从大回转到大跳台，在吉林市的雪场遇见多种雪上项目。',
    address: '吉林市永吉县北大湖镇',
    desc:
      '承担高山滑雪（含残疾人高山滑雪）、自由式滑雪与单板滑雪的 U 型场地技巧、坡面障碍技巧、大跳台项目。代表团团长会议期间，多国代表团曾到这里实地考察雪上项目筹备情况。',
    mapPos: { x: 604, z: 122 },
    color: '#8FD0FF',
    building: { type: 'ski', peaks: 6, snowTrails: 6, forest: true, big: true, halfpipe: true },
    game: {
      engine: 'dodge',
      title: '高山滑雪大回转',
      subtitle: '高速大回转：旗门更密，路线判断必须提前',
      icon: '⛷️',
      params: { speed: 1.26, gates: 8, goal: 17, unit: '分', accent: '#8FD0FF', duration: 17 },
    },
  },
];

export function listVenues() {
  return VENUES;
}
