import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cc-job-cancel-'));
const child = spawn(process.execPath, ['server/index.js'], { cwd:process.cwd(), env:{ ...process.env, PORT:'5184', VISITS_FILE:path.join(dir,'visits.json') }, stdio:'ignore', windowsHide:true });
const base = 'http://127.0.0.1:5184';
try {
  let ready = false;
  for (let i = 0; i < 50; i += 1) { try { ready = (await fetch(`${base}/api/places`)).ok; if (ready) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 100)); }
  assert.ok(ready, '生图任务测试服务器启动');
  const created = await fetch(`${base}/api/generate`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ image:'data:image/png;base64,AA==', styleId:'q3d', purpose:'avatar2d' }) });
  assert.equal(created.status, 202);
  const { jobId } = await created.json();
  const cancelled = await fetch(`${base}/api/jobs/${jobId}`, { method:'DELETE' });
  assert.equal(cancelled.status, 200);
  assert.deepEqual(await cancelled.json(), { cancelled:true });
  assert.equal((await (await fetch(`${base}/api/jobs/${jobId}`)).json()).status, 'cancelled');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assert.equal((await (await fetch(`${base}/api/jobs/${jobId}`)).json()).status, 'cancelled', '慢速服务结果不能覆盖取消状态');
  console.log('生图排队/运行任务可撤销，且迟到的服务结果不会改回已取消状态');
} finally {
  child.kill();
  await new Promise((resolve) => child.once('exit', resolve));
  await fs.rm(dir, { recursive:true, force:true });
}
