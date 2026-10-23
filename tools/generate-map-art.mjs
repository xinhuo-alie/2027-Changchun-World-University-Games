import fs from 'node:fs/promises';
import { config } from '../server/env.js';
const endpoint='https://ark.cn-beijing.volces.com/api/v3/images/generations';
const prompts=[
['winter-city-map.png',`为长春2027大冬会互动地图绘制一张高品质2.5D斜俯视冰雪城市微缩沙盘底图，横向16:9构图，2K。画面是松辽平原上的长春城市肌理：左侧和中部为相对平缓、密集但有秩序的冬季城市街区、河流与湖泊，右侧向东南逐渐过渡到连绵低丘、净月潭针叶林、滑雪场雪道，再远处以吉林市周边高山滑雪森林作为视觉边缘。冰雪清透，松林层次丰富，微缩游戏地图渲染，柔和日照，薄雾和雪粒，精致现实插画风，城市和山地地貌渐变自然。地图视觉必须清晰留出可读空间，绝对不要文字、数字、地名、建筑标记、图钉、路线、图例、UI、人物、边框、水印；不要画任何能被误认作特定真实场馆的独立标志性体育馆。`],
['winter-landmark-atlas.png',`生成一张严格4列×4行的16格建筑插画图集，正方形画布，2K。每格一个独立完整的微缩建筑/地点模型，统一高品质冬季旅游地图2.5D等距斜俯视风格，俯视方向一致、左上方柔和日照、雪地接触阴影。格子间以清晰宽白色间隔完全分开，模型完整置于格子中央且不越界；无文字无字母无数字无徽章无边框无水印。按照从左至右、从上到下的格序严格表现：1长春五环体育馆圆形大型冰上竞技馆；2速度滑冰馆长椭圆冰场与大跨屋顶；3市滑冰馆紧凑室内冰场馆；4省滑冰馆冰球馆；5奥林匹克公园大型体育场与冰雪活动园区；6净月潭森林水库湖岸与松林；7莲花山滑雪场山坡、跳台与雪道；8雕塑公园冬季广场和抽象雕塑；9松花湖滑雪度假区湖面与山地雪道；10北大湖滑雪场陡峭雪峰和长雪道；11伪满皇宫博物院同德殿风格的历史宫殿建筑群；12长影旧址博物馆红砖电影厂房；13这有山室内山城商业建筑，层叠步道环绕中庭；14南湖公园冰雪湖面、林木和亭桥；15长春文化广场开阔圆形广场与中心雕塑；16长影世纪城电影主题公园建筑群。所有地标须是精致实体微缩模型，轮廓彼此明显不同，安放在雪地小基座上；相同视角和比例，不画天空背景。`]
];
for (const [filename,prompt] of prompts) {
  const body={model:config.arkModels[0],prompt,size:'2K',output_format:'png',response_format:'url',watermark:false};
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.arkApiKey}`},body:JSON.stringify(body),signal:AbortSignal.timeout(200000)});
  const json=await response.json();
  if(!response.ok) throw new Error(`${filename}: HTTP ${response.status}: ${JSON.stringify(json).slice(0,500)}`);
  const url=json?.data?.[0]?.url;if(!url)throw new Error(`${filename}: response omitted image URL`);
  const image=await fetch(url);if(!image.ok)throw new Error(`${filename}: download HTTP ${image.status}`);
  const target=`web/assets/${filename}`;await fs.writeFile(target,Buffer.from(await image.arrayBuffer()));
  console.log(`saved ${target}`);
}
