// 空白雪地图上的交互锚点。归一化坐标表示插画中的可读位置，不是测绘坐标。
// 建筑图标落在预留的雪地空位，点击位置与图标共用此锚点。
export const MAP_LANDMARKS = {
  image: { width: 2048, height: 1152 },
  source: 'ice-city-anchored-map.png',
  accuracy: 'illustrative',
  points: {
    // 长春城区在左，山地雪场在右；空位坐标按原图 2048×1152 像素选取。
    wuhuan: [390/2048, 220/1152], speed: [530/2048, 365/1152],
    cityhall: [400/2048, 490/1152], provhall: [650/2048, 450/1152],
    olympic: [165/2048, 450/1152], jingyue: [950/2048, 605/1152],
    lianhua: [1660/2048, 415/1152], sculpture: [260/2048, 680/1152],
    songhuahu: [1810/2048, 465/1152], beidahu: [1680/2048, 840/1152],
    palace: [275/2048, 850/1152], film: [350/2048, 965/1152],
    mountainmall: [760/2048, 505/1152], nanhu: [875/2048, 840/1152],
    culture: [1050/2048, 685/1152], century: [1270/2048, 815/1152],
  },
  // 底图中预留的可扩展空位；新增景点时可从这里选一个锚点。
  futureSlots: [
    [120/2048, 180/1152], [790/2048, 145/1152],
    [570/2048, 145/1152], [860/2048, 315/1152],
    [1120/2048, 510/1152], [1920/2048, 290/1152],
    [85/2048, 610/1152], [520/2048, 580/1152],
    [950/2048, 405/1152], [1040/2048, 830/1152],
    [1450/2048, 910/1152], [1970/2048, 610/1152],
  ],
};

export function imagePointToWorld(point, bounds = { x: -535, z: -350, w: 1423, h: 800 }) {
  return { x: bounds.x + point[0] * bounds.w, z: bounds.z + point[1] * bounds.h };
}

export function worldPointToImage(point, bounds = { x: -535, z: -350, w: 1423, h: 800 }) {
  return [(point.x - bounds.x) / bounds.w, (point.z - bounds.z) / bounds.h];
}
