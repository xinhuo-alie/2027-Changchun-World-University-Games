import assert from 'node:assert/strict';
import { listProviders, resolveProvider } from '../server/providers/index.js';

const providers = listProviders();
assert.ok(providers.some((provider) => provider.id === 'doubao'), '豆包渠道应保留');
assert.ok(providers.some((provider) => provider.id === 'mock'), '本地模拟渠道应保留');
assert.ok(!providers.some((provider) => provider.id === 'botcf'), '已移除的渠道不可出现在列表中');
assert.equal(resolveProvider('botcf').id, 'mock', '旧渠道请求不可进入外部生图接口');
console.log('通过：BotCF 渠道已移除，豆包与本地模拟渠道保留。');
