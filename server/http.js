const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 带超时与重试的 JSON 请求。
 * 生图接口普遍偏慢（10~60s），且偶发 5xx，所以默认重试 1 次。
 */
export async function requestJson(url, options = {}, { timeoutMs = 90000, retries = 1 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text.slice(0, 400)}`);
      }
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(800 * (attempt + 1));
    }
  }
  throw lastError;
}

/** 把 data URL 拆成 { mimeType, base64, buffer } */
export function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(dataUrl || ''));
  if (!match) throw new Error('图片格式不正确，需要 data URL');
  const mimeType = match[1] || 'image/jpeg';
  const isBase64 = Boolean(match[2]);
  const payload = match[3];
  const buffer = isBase64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');
  return { mimeType, base64: buffer.toString('base64'), buffer };
}
