import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config, WEB_DIR, RESULT_DIR } from './env.js';
import { listStyles } from './styles.js';
import { listPlaces } from './places.js';
import { createVisitStore } from './visits.js';
import { providerStatus, listProviders } from './providers/index.js';
import { createJob, getJob, queueSnapshot } from './store.js';
import { parseDataUrl } from './http.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const places = listPlaces();
const visitStore = await createVisitStore(process.env.VISITS_FILE || path.join(RESULT_DIR, '..', 'visits.json'), places);

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > config.maxUploadBytes * 1.6) {
      throw new Error('请求体过大，请压缩图片后重试');
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('请求体不是合法 JSON');
  }
}

async function serveFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    // 代码类文件一律不缓存：开发时改了代码刷新就该生效，
    // 否则浏览器会拿着旧 JS 跑，出现"改了没反应"甚至"人物消失"这类假故障。
    // 模型和图片是重资源，允许缓存。
    const noStore = ['.html', '.js', '.css', '.json'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': noStore ? 'no-store, must-revalidate' : 'public, max-age=86400',
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

/** 防目录穿越：解析后必须仍在允许的根目录内 */
function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const resolved = path.resolve(root, `.${path.posix.normalize(decoded)}`);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/places') {
      return sendJson(res, 200, { places });
    }
    if (req.method === 'GET' && pathname === '/api/visits') {
      return sendJson(res, 200, visitStore.snapshot());
    }
    if (req.method === 'POST' && pathname === '/api/visits') {
      const body = await readJsonBody(req);
      try { return sendJson(res, 200, await visitStore.record(body)); }
      catch (error) { if (error.status) return sendJson(res, error.status, { error: error.message }); throw error; }
    }
    if (req.method === 'GET' && pathname === '/api/visits/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders();
      const send = (data) => res.write(`event: stats\ndata: ${JSON.stringify(data)}\n\n`);
      send(visitStore.snapshot());
      const unsubscribe = visitStore.subscribe(send);
      const pulse = setInterval(() => send(visitStore.snapshot()), 20000);
      pulse.unref();
      res.on('close', () => { clearInterval(pulse); unsubscribe(); });
      return;
    }
    if (req.method === 'GET' && pathname === '/api/config') {
      return sendJson(res, 200, {
        styles: listStyles(),
        provider: providerStatus(),
        providers: listProviders(),
        queue: queueSnapshot(),
      });
    }

    if (req.method === 'POST' && pathname === '/api/generate') {
      const body = await readJsonBody(req);
      if (!body.image || typeof body.image !== 'string') {
        return sendJson(res, 400, { error: '缺少 image 字段（data URL）' });
      }
      const { buffer } = parseDataUrl(body.image);
      if (buffer.length > config.maxUploadBytes) {
        return sendJson(res, 413, { error: '图片太大，请压缩到 8MB 以内' });
      }
      const purpose = body.purpose === 'figurine' ? 'figurine' : body.purpose === 'avatar2d' ? 'avatar2d' : undefined;
      const providerId = body.provider;
      if (providerId !== undefined && !listProviders().some(p => p.id === providerId && p.available)) {
        return sendJson(res, 400, { error: '所选生图模型不可用，请选择已配置的模型' });
      }
      const jobId = createJob({ imageDataUrl: body.image, styleId: body.styleId || 'q3d', purpose, providerId, outfit: purpose === 'figurine' ? body.outfit : undefined, creative: purpose === 'figurine' ? body.creative : undefined });
      return sendJson(res, 202, { jobId, queue: queueSnapshot() });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/jobs/')) {
      const id = pathname.slice('/api/jobs/'.length);
      const job = getJob(id);
      if (!job) return sendJson(res, 404, { error: '任务不存在或已过期' });
      return sendJson(res, 200, job);
    }

    if (req.method === 'GET' && pathname.startsWith('/data/results/')) {
      const filePath = safeJoin(RESULT_DIR, pathname.slice('/data/results'.length));
      if (filePath && (await serveFile(res, filePath))) return undefined;
      return sendJson(res, 404, { error: '文件不存在' });
    }

    if (req.method === 'GET') {
      const rel = pathname === '/' ? '/play.html' : pathname;
      const filePath = safeJoin(WEB_DIR, rel);
      if (filePath && (await serveFile(res, filePath))) return undefined;

      // 无扩展名的页面路径，例如 /display。
      if (!path.extname(rel)) {
        const pagePath = safeJoin(WEB_DIR, `${rel}.html`);
        if (pagePath && (await serveFile(res, pagePath))) return undefined;
      }
    }

    return sendJson(res, 404, { error: 'Not Found' });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : '服务器内部错误',
    });
  }
});

await fs.mkdir(RESULT_DIR, { recursive: true });

server.listen(config.port, () => {
  const status = providerStatus();
  console.log('');
  console.log('  长春 2027 大冬会云游览 · 形象生成服务');
  console.log(`  http://localhost:${config.port}`);
  console.log(`  当前服务商: ${status.activeLabel} (${status.active})`);
  if (status.fellBackToMock) {
    console.log(`  ⚠️  配置里指定的是 "${status.requested}"，但缺少 API key，已自动降级为本地模拟`);
  }
  console.log(`  并发上限: ${config.maxConcurrentJobs} · 原图落盘: ${config.saveUploads ? '是' : '否（推荐）'}`);
  console.log('');
});
