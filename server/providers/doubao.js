import { config } from '../env.js';
import { requestJson } from '../http.js';

/**
 * 火山方舟（豆包 Seedream）—— 图生图。
 *
 * 以下全部用真实 key 实测确认过（2026-10-12）：
 *  · image 字段直接接受 **data URL**，不需要先把照片传到公网。
 *    这条很关键：用户原图可以完全不落到任何存储上，隐私上是最干净的方案。
 *  · response_format: "url" 返回 data[0].url（TOS 签名链接，24 小时有效，需立刻拉回）。
 *  · watermark: false 关闭水印。
 *
 * 实测耗时（1024x1024 图生图）：约 84~100 秒。这是当前方案最大的体验瓶颈。
 * 同账号下 doubao-seedream-5-0-flash-* 更快，但需先在方舟控制台单独开通，
 * 未开通会返回 ModelNotOpen，下面已翻译成人话。
 */

export const id = 'doubao';
export const label = '豆包 · Seedream（火山方舟）';
export const requiresKey = true;

const ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

export function isAvailable() {
  return Boolean(config.arkApiKey);
}

/**
 * 当前账号上"确定能用"的模型。
 *
 * ARK_MODEL 可以配一串（逗号分隔）：挨个试，第一个能用的记住，
 * 之后所有请求直接走它——省掉每次先撞一个必然失败的错误码。
 */
let pickedModel = null;

function buildRequestBody({ imageDataUrl, prompt, size, model }) {
  return {
    model: model || pickedModel || config.arkModels[0],
    prompt,
    image: imageDataUrl,
    size: size || '1024x1024',
    response_format: 'url',
    watermark: false,
  };
}

/** 把方舟的错误码翻译成能直接给用户看的话 */
function humanizeError(rawMessage) {
  try {
    const parsed = JSON.parse(String(rawMessage).replace(/^HTTP \d+ [^:]*:: /, ''));
    const code = parsed?.error?.code;
    const message = parsed?.error?.message || '';
    if (code === 'ModelNotOpen') {
      const model = /model (\S+) has not activated/.exec(message)?.[1] || '';
      return `模型 ${model} 尚未开通，请到火山方舟控制台开通后重试`;
    }
    if (code === 'InvalidEndpointOrModel.NotFound') {
      return '模型不存在或无权访问，请检查 ARK_MODEL 里的模型名';
    }
    if (code === 'AuthenticationError' || /invalid.*api.?key/i.test(message)) {
      return 'ARK_API_KEY 无效或已过期';
    }
    if (message) return message.split(' Request id:')[0];
  } catch {
    /* 落到下面的兜底 */
  }
  return rawMessage;
}

/**
 * 按配置顺序挑模型：flash 这类快模型优先，用不了就退回 pro。
 * 只有"这个模型用不了"才换下一个；限流、超时这类错误直接抛给用户——
 * 否则一次请求会静默地把等待时间翻好几倍。
 */
export async function generate({ imageDataUrl, prompt, size }) {
  let lastError = null;
  for (const model of config.arkModels) {
    try {
      return await generateWith(model, { imageDataUrl, prompt, size });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/尚未开通|不存在或无权访问/.test(message)) throw error;
      lastError = error;
      console.log(`  [doubao] ${model} 用不了（${message}），换下一个模型`);
    }
  }
  throw lastError || new Error('没有可用的方舟模型');
}

async function generateWith(model, { imageDataUrl, prompt, size }) {
  let json;
  try {
    json = await requestJson(
      ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.arkApiKey}`,
        },
        body: JSON.stringify(buildRequestBody({ imageDataUrl, prompt, size, model })),
      },
      // 单次实测约 100 秒。刻意不重试：静默重试会让用户等待凭空翻倍，
      // 不如快速失败，把重试权交回用户（前端有"重新生成"）。
      { timeoutMs: 170000, retries: 0 },
    );
  } catch (error) {
    throw new Error(humanizeError(error instanceof Error ? error.message : String(error)));
  }

  const imageUrl = json?.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error(`方舟响应中没有图片地址：${JSON.stringify(json).slice(0, 300)}`);
  }

  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`下载方舟生成结果失败：HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  pickedModel = model; // 这个模型跑通了，后面直接用它
  return { kind: 'base64', data: buffer.toString('base64'), ext: 'jpg', mimeType: 'image/jpeg' };
}
