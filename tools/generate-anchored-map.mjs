import fs from 'node:fs/promises';
import { config } from '../server/env.js';

const source = new URL('../web/assets/ice-city-blank-map.png', import.meta.url);
const target = new URL('../web/assets/ice-city-anchored-map.png', import.meta.url);
if (!config.arkApiKey) throw new Error('ARK_API_KEY is required');
const image = await fs.readFile(source);
const prompt = `参考输入图片的横版16:9、2048×1152冰雪城市与右侧山地的2.5D斜俯视沙盘风格，重新绘制可供网页景点图标叠加的纯空白地图。保持左侧长春冬季城区、右侧森林雪山和滑雪道、贯穿其间的蓝色河湖、道路桥梁、雪松、柔和日光，色彩清透精致。不要复制原图左下角水印。
关键构图约束：下面所有坐标均按从左上角起算的2048×1152画布像素计。在现有景点图标的落脚点周围，安排自然、平整、浅色、低细节的雪地或广场，每块至少约150×110像素，让后续叠加的建筑图标和文字清晰可见，不能被道路、河流、树木、峭壁或已有建筑穿过：
(390,235)、(530,380)、(400,500)、(650,460)、(165,460)、(900,620)、(1660,425)、(260,690)、(1820,585)、(1680,850)、(275,860)、(280,1000)、(760,520)、(700,850)、(1050,700)、(1270,730)。
此外还要留出至少12处将来可添加景点的相近大小空地，分散于城市和山地之间，优先坐标约为(110,160)、(800,180)、(1040,230)、(1190,400)、(1450,260)、(1950,350)、(120,620)、(540,690)、(1150,870)、(1430,950)、(1930,980)、(900,1000)，但画面上不要标识这些空位。空地要像自然的雪地、广场、缓坡或林间空地，不能是整齐的网格或白色圆圈。
整张图绝对不能出现景点图标、独立地标建筑、人物、图钉、路线标记、文字、数字、标签、图例、界面、边框或水印。地形纹理要丰富，空地仍要适合与微缩建筑图标自然融合。`;
const body = {
  model: 'doubao-seedream-5-0-pro-260628',
  prompt,
  image: `data:image/png;base64,${image.toString('base64')}`,
  size: '2048x1152',
  output_format: 'png',
  response_format: 'url',
  watermark: false,
};
const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.arkApiKey}` },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(240000),
});
const result = await response.json();
if (!response.ok) throw new Error(`Doubao Pro HTTP ${response.status}: ${JSON.stringify(result).slice(0, 600)}`);
const url = result?.data?.[0]?.url;
if (!url) throw new Error('Doubao Pro did not return an image URL');
const downloaded = await fetch(url, { signal: AbortSignal.timeout(90000) });
if (!downloaded.ok) throw new Error(`Image download HTTP ${downloaded.status}`);
await fs.writeFile(target, Buffer.from(await downloaded.arrayBuffer()));
console.log(`Saved ${target.pathname}`);
