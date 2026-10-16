import fs from 'node:fs/promises';
import path from 'node:path';

const dayInShanghai = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

// 一个进程内串行写入，临时文件原子替换；成功落盘后才对外公布。
export async function createVisitStore(file, places) {
  let state = { revision: 0, counts: {}, days: {}, recent: [], receipts: [] };
  try { state = JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const ids = new Set(places.map(p => p.id));
  const listeners = new Set();
  let chain = Promise.resolve();
  function snapshot() {
    const today = dayInShanghai(new Date());
    return { revision: state.revision, updatedAt: state.updatedAt || null, today,
      total: Object.values(state.counts).reduce((a, b) => a + b, 0),
      todayTotal: Object.values(state.days[today] || {}).reduce((a, b) => a + b, 0),
      places: places.map(p => ({ id: p.id, name: p.name, kind: p.kind, count: state.counts[p.id] || 0, today: state.days[today]?.[p.id] || 0 })),
      recent: state.recent };
  }
  function record({ placeId, eventId }) {
    if (!ids.has(placeId) || typeof eventId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(eventId)) {
      return Promise.reject(Object.assign(new Error('无效的地点或游览事件'), { status: 400 }));
    }
    const task = chain.then(async () => {
      const receipt = state.receipts.find(r => r.eventId === eventId);
      if (receipt) {
        if (receipt.placeId !== placeId) throw Object.assign(new Error('事件编号与地点不匹配'), { status: 409 });
        return snapshot();
      }
      const now = new Date();
      const day = dayInShanghai(now);
      const next = { ...state, revision: state.revision + 1, updatedAt: now.toISOString(),
        counts: { ...state.counts, [placeId]: (state.counts[placeId] || 0) + 1 },
        days: { ...state.days, [day]: { ...state.days[day], [placeId]: (state.days[day]?.[placeId] || 0) + 1 } },
        recent: [{ placeId, at: now.toISOString() }, ...state.recent].slice(0, 30),
        receipts: [...state.receipts, { eventId, placeId }] };
      await fs.mkdir(path.dirname(file), { recursive: true });
      const temp = `${file}.tmp`;
      await fs.writeFile(temp, JSON.stringify(next), 'utf8');
      await fs.rename(temp, file);
      state = next;
      const result = snapshot();
      for (const listener of listeners) { try { listener(result); } catch {} }
      return result;
    });
    chain = task.catch(() => {});
    return task;
  }
  return { snapshot, record, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
}
