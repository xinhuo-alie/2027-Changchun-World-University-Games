/**
 * 方舟模型探针：发一次"最小可行"的图生图请求，报出**能不能用 / 花多久**。
 *
 * 换更快的模型之前先跑这个。没开通的模型会在参数校验阶段就返回 ModelNotOpen，
 * 不产生生成费用；开通了才会真的跑一次（会花一点点钱，但这是唯一可信的验证）。
 *
 * 用法：
 *   node tools/ark-probe.js doubao-seedream-5-0-flash-260915 768
 *   node tools/ark-probe.js                       # 不传就探当前 ARK_MODEL
 */

import fs from 'node:fs';
import path from 'node:path';
import { config, ROOT_DIR } from '../server/env.js';

const ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const model = process.argv[2] || config.arkModels[0];
const size = `${process.argv[3] || 768}x${process.argv[3] || 768}`;
const stream = process.argv.includes('--stream');

if (!config.arkApiKey) {
  console.error('缺少 ARK_API_KEY（看 .env）');
  process.exit(1);
}

// 用一张项目自带的样图当输入：探针只看"模型通不通、多快"，不看画得好不好
const samplePath = path.join(ROOT_DIR, 'docs', 'samples', '00-input-portrait.jpg');
const dataUrl = `data:image/jpeg;base64,${fs.readFileSync(samplePath).toString('base64')}`;

console.log(`探针 → model=${model} size=${size}${stream ? ' stream=on' : ''}`);
const started = Date.now();

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.arkApiKey}`,
  },
  body: JSON.stringify({
    model,
    prompt: '把这张照片里的人画成 2D 扁平卡通头像，头肩特写，纯色浅蓝背景。',
    image: dataUrl,
    size,
    response_format: 'url',
    watermark: false,
    stream,
  }),
});

if (stream) {
  // 流式：看看它是不是在画的过程中就把半成品推过来，第一个事件多久到
  console.log(`HTTP ${res.status}（流式）`);
  if (!res.ok) {
    console.log((await res.text()).slice(0, 400));
    process.exit(2);
  }
  let events = 0;
  let firstAt = null;
  let lastUrl = '';
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    const text = decoder.decode(chunk, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      events += 1;
      try {
        const json = JSON.parse(payload);
        const url = json?.data?.[0]?.url || json?.url;
        if (url && !firstAt) firstAt = ((Date.now() - started) / 1000).toFixed(1);
        if (url) lastUrl = url;
      } catch {
        /* 不是 JSON 的事件忽略 */
      }
    }
  }
  console.log(
    `事件 ${events} 个 · 第一张半成品 ${firstAt ? `${firstAt}s` : '没等到'} · 总用时 ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  console.log(`最后一张: ${lastUrl.slice(0, 80)}…`);
  process.exit(0);
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
const text = await res.text();

if (!res.ok) {
  console.log(`HTTP ${res.status} · ${elapsed}s`);
  console.log(text.slice(0, 400));
  process.exit(2);
}

const json = JSON.parse(text);
console.log(`HTTP 200 · 用时 ${elapsed}s · 图片地址: ${String(json?.data?.[0]?.url || '').slice(0, 80)}…`);
console.log(json?.usage ? `用量: ${JSON.stringify(json.usage)}` : '');
