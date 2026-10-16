import { config } from '../env.js';
import { requestJson } from '../http.js';

/**
 * 阿里云百炼（通义万相）图生图。
 *
 * ⚠️ 两个待核实的现实约束：
 *  1. 万相图生图多数模式要求 base_image_url 是**公网可访问的 URL**，
 *     不接受 data URL。所以真接入时通常要先落地对象存储再传链接。
 *  2. 这是异步接口（创建任务 → 轮询），字段名与 function 取值需对照最新文档。
 */

export const id = 'dashscope';
export const label = '通义万相（阿里云百炼）';
export const requiresKey = true;

const CREATE_ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis';
const TASK_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/tasks';

export function isAvailable() {
  return Boolean(config.dashscopeApiKey);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generate({ imageDataUrl, prompt }) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.dashscopeApiKey}`,
    'X-DashScope-Async': 'enable',
  };

  const created = await requestJson(
    CREATE_ENDPOINT,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.dashscopeModel,
        input: {
          function: 'stylization_all',
          prompt,
          base_image_url: imageDataUrl,
        },
        parameters: { n: 1 },
      }),
    },
    { timeoutMs: 60000, retries: 1 },
  );

  const taskId = created?.output?.task_id;
  if (!taskId) {
    throw new Error(`万相未返回 task_id：${JSON.stringify(created).slice(0, 300)}`);
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(2500);
    const task = await requestJson(
      `${TASK_ENDPOINT}/${taskId}`,
      { method: 'GET', headers: { Authorization: `Bearer ${config.dashscopeApiKey}` } },
      { timeoutMs: 30000, retries: 1 },
    );
    const status = task?.output?.task_status;
    if (status === 'SUCCEEDED') {
      const url = task?.output?.results?.[0]?.url;
      if (!url) throw new Error('万相任务成功但未返回图片地址');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`下载万相结果失败：HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      return { kind: 'base64', data: buffer.toString('base64'), ext: 'png', mimeType: 'image/png' };
    }
    if (status === 'FAILED' || status === 'UNKNOWN') {
      throw new Error(`万相任务失败：${JSON.stringify(task?.output).slice(0, 300)}`);
    }
  }
  throw new Error('万相任务超时');
}
