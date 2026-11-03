import assert from 'node:assert/strict';
import { buildPrompt } from '../server/styles.js';
import { buildCreativePrompt } from '../web/creative-prompt.js';
import { figureCutoutHasBackground } from '../web/avatar-face.js';

const creative = buildCreativePrompt({ scene: 'cafe' });
assert.match(creative, /背景要求：纯色洋红抠图幕/);
assert.doesNotMatch(creative, /柔和暖色主光与冰蓝补光|咖啡馆|窗外/);
const prompt = buildPrompt({ purpose: 'figurine', locale: 'zh', extra: creative });
assert.match(prompt, /头身比例、轮廓、质感和绘制技法严格服从所选艺术风格/);
assert.match(prompt, /人物姿态和运动器材只按用户选择的角色类型与动作生成/);
assert.match(prompt, /#FF00FF/);
assert.match(prompt, /不画场景、地面、投影或背景粒子/);

const width = 100, height = 100;
const data = new Uint8ClampedArray(width * height * 4);
const fill = (x0, y0, x1, y1) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[(y * width + x) * 4 + 3] = 255;
};
fill(35, 10, 65, 90);
assert.equal(figureCutoutHasBackground({ width, height, data }), false);
fill(90, 12, 100, 90);
assert.equal(figureCutoutHasBackground({ width, height, data }), true);
console.log('figure background checks passed');
