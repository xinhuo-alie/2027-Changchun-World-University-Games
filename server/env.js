import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 极简 .env 解析：不引入 dotenv 依赖 */
function loadDotEnv() {
  const file = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // 真实环境变量优先于 .env
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

function bool(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const ROOT_DIR = path.resolve(__dirname, '..');
export const WEB_DIR = path.join(ROOT_DIR, 'web');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const RESULT_DIR = path.join(DATA_DIR, 'results');

export const config = {
  port: Number(process.env.PORT || 5173),
  provider: (process.env.IMAGE_PROVIDER || 'mock').trim(),
  arkApiKey: (process.env.ARK_API_KEY || '').trim(),
  /**
   * 模型可以写成一串（逗号分隔），按顺序试，第一个能用的就长期用。
   * 好处是"换了更快的模型"只是改配置，不用改代码；
   * 而且 flash 万一哪天被限流/欠费，会自动退回 pro，不会直接报错给用户。
   */
  arkModels: (process.env.ARK_MODEL || 'doubao-seedream-5-0-flash-260915,doubao-seedream-5-0-pro-260628')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  dashscopeApiKey: (process.env.DASHSCOPE_API_KEY || '').trim(),
  dashscopeModel: (process.env.DASHSCOPE_MODEL || 'wanx2.1-imageedit').trim(),
  falKey: (process.env.FAL_KEY || '').trim(),
  falModel: (process.env.FAL_MODEL || 'fal-ai/flux-pro/kontext').trim(),
  maxConcurrentJobs: Math.max(1, Number(process.env.MAX_CONCURRENT_JOBS || 2)),
  saveUploads: bool(process.env.SAVE_UPLOADS, false),
  // 单张上传图的体积上限（base64 解码后）
  maxUploadBytes: 8 * 1024 * 1024,
};
