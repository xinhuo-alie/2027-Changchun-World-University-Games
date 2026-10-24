import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createLeaderboardStore } from '../server/leaderboards.js';

const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cc2027-games-'));
try {
 const file=path.join(dir,'game-results.json');const store=await createLeaderboardStore(file);
 const make=(overrides={})=>({resultId:'result-000000000001',gameId:'wuhuan-shorttrack',venueId:'wuhuan',mode:'ranked-solo',playerId:'player-000000000001',displayName:'冰雪选手',score:720,durationMs:42000,seed:123,metrics:{misses:2},...overrides});
 const first=await store.submit(make());assert.equal(first.ok,true);
 const duplicate=await store.submit(make());assert.equal(duplicate.duplicate,true);
 assert.equal(store.list({gameId:'wuhuan-shorttrack'}).entries.length,1);
 assert.equal(store.history({playerId:'player-000000000001'}).length,1);
 assert.equal(store.overall().entries[0].score,100);
 await assert.rejects(store.submit(make({resultId:'result-000000000002',mode:'practice'})),error=>error.status===400);
 await assert.rejects(store.submit(make({resultId:'result-000000000003',score:1001})),error=>error.status===400);
 const reloaded=await createLeaderboardStore(file);assert.equal(reloaded.list({gameId:'wuhuan-shorttrack'}).entries[0].score,720);
 console.log('排行榜校验、幂等提交、历史记录、总积分和持久化测试通过');
} finally { await fs.rm(dir,{recursive:true,force:true}); }
