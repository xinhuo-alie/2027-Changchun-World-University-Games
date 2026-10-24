import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, RESULT_DIR } from './env.js';
import { resolveProvider, promptLocaleFor } from './providers/index.js';
import { buildPrompt, describeFigurineSelection } from './styles.js';

/**
 * 任务队列 + 结果存储。
 *
 * 两个刻意的设计：
 *  1. 并发上限。生图接口很慢，不限并发会把自己拖垮，也会被服务商限流。
 *     超出上限的任务进队列，前端能看到自己的排队位置——这是线上活动必备的体验兜底。
 *  2. 原图只在内存里。默认不写磁盘，任务结束立即释放引用。
 *     人脸是敏感个人信息，"不落地"是最省事的合规姿势，也顺带省存储。
 */

const jobs = new Map();
const queue = [];
let running = 0;

const MAX_KEPT_JOBS = 500;

function pruneJobs() {
  if (jobs.size <= MAX_KEPT_JOBS) return;
  const finished = [...jobs.values()]
    .filter((j) => j.status === 'succeeded' || j.status === 'failed')
    .sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0));
  for (const job of finished) {
    if (jobs.size <= MAX_KEPT_JOBS) break;
    jobs.delete(job.id);
  }
}

export function createJob({ imageDataUrl, styleId, purpose, outfit, creative, providerId }) {
  const id = crypto.randomUUID();
  jobs.set(id, {
    id,
    status: 'queued',
    styleId,
    purpose,
    provider: resolveProvider(providerId).id,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
    resultUrl: null,
    error: null,
    // 原图只挂在这里，不落盘
    _image: imageDataUrl,
    _outfit: outfit,
    _creative: creative,
  });
  queue.push(id);
  pump();
  pruneJobs();
  return id;
}

export function getJob(id) {
  const job = jobs.get(id);
  if (!job) return null;
  const index = queue.indexOf(id);
  const { _image, _outfit, _creative, ...pub } = job;
  return {
    ...pub,
    queuePosition: index === -1 ? 0 : index + 1,
    queueLength: queue.length,
  };
}

function pump() {
  while (running < config.maxConcurrentJobs && queue.length > 0) {
    const id = queue.shift();
    void runJob(id);
  }
}

async function runJob(id) {
  const job = jobs.get(id);
  if (!job) return;
  running += 1;
  job.status = 'running';
  job.startedAt = Date.now();

  try {
    const provider = resolveProvider(job.provider);
    job.provider = provider.id;
    const prompt = buildPrompt({
      styleId: job.styleId,
      locale: promptLocaleFor(provider.id),
      purpose: job.purpose,
      extra: job.purpose === 'figurine' ? describeFigurineSelection(job._creative, job._outfit) : '',
      creative: job.purpose === 'figurine' ? job._creative : undefined,
    });

    const output = await provider.generate({
      imageDataUrl: job._image,
      prompt,
      styleId: job.styleId,
    });

    const fileName = `${job.id}.${output.ext}`;
    const filePath = path.join(RESULT_DIR, fileName);
    const buffer =
      output.kind === 'base64' ? Buffer.from(output.data, 'base64') : Buffer.from(output.data, 'utf8');
    await fs.writeFile(filePath, buffer);

    job.resultUrl = `/data/results/${fileName}`;
    job.resultBytes = buffer.length;
    job.status = 'succeeded';
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
  } finally {
    job.finishedAt = Date.now();
    // ★ 原图在这里立即释放
    delete job._image;
    delete job._outfit;
    delete job._creative;
    running -= 1;
    pump();
  }
}

export function queueSnapshot() {
  return { running, queued: queue.length, maxConcurrent: config.maxConcurrentJobs };
}
