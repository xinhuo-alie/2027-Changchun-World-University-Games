import { config } from '../env.js';
import { requestJson } from '../http.js';

/**
 * fal.ai 上的 Flux Kontext —— 专门的指令式图像编辑模型，
 * 在「改画风但保住人物身份」这件事上目前是同类里比较强的，
 * 很适合作为效果基准来对照国内模型。
 */

export const id = 'fal';
export const label = 'Flux Kontext（fal.ai）';
export const requiresKey = true;

export function isAvailable() {
  return Boolean(config.falKey);
}

export async function generate({ imageDataUrl, prompt }) {
  const json = await requestJson(
    `https://fal.run/${config.falModel}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${config.falKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_url: imageDataUrl,
        num_images: 1,
      }),
    },
    { timeoutMs: 150000, retries: 1 },
  );

  const url = json?.images?.[0]?.url;
  if (!url) {
    throw new Error(`fal 响应中没有图片：${JSON.stringify(json).slice(0, 300)}`);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载 fal 结果失败：HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { kind: 'base64', data: buffer.toString('base64'), ext: 'png', mimeType: 'image/png' };
}
