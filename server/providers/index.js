import { config } from '../env.js';
import * as mock from './mock.js';
import * as doubao from './doubao.js';
import * as dashscope from './dashscope.js';
import * as fal from './fal.js';

const REGISTRY = {
  mock,
  doubao,
  dashscope,
  fal,
};

/**
 * 选择服务商：优先用配置里指定的；
 * 若指定的是需要 key 但没配 key 的，自动降级到 mock，
 * 保证本地开发永远有一条能跑通的路（这也是线上活动的兜底策略）。
 */
export function resolveProvider(providerId = config.provider) {
  const wanted = REGISTRY[providerId];
  if (wanted && wanted.isAvailable()) return wanted;
  return mock;
}

export function providerStatus() {
  const active = resolveProvider();
  return {
    active: active.id,
    activeLabel: active.label,
    requested: config.provider,
    fellBackToMock: active.id !== config.provider,
    available: Object.values(REGISTRY).filter((p) => p.isAvailable()).map((p) => p.id),
  };
}

export function listProviders() {
  return Object.values(REGISTRY).map((p) => ({
    id: p.id,
    label: p.label,
    requiresKey: p.requiresKey,
    available: p.isAvailable(),
  }));
}

/**
 * 提示词语言：国内模型吃中文更稳，海外模型吃英文更稳。
 * 风格段本身有中英两版，这里只决定拼哪一版。
 */
export function promptLocaleFor(providerId) {
  return providerId === 'fal' ? 'en' : 'zh';
}
