import assert from 'node:assert/strict';
import { buildPrompt, describeFigurineCreative } from '../server/styles.js';

const creative = describeFigurineCreative({
  vibe: 'retro', sport: 'curling', scene: 'aurora',
  details: '白色波点发饰，挥手微笑',
});
for (const phrase of ['复古俏皮', '冰壶', '极光氛围', '白色波点发饰']) {
  assert.ok(creative.includes(phrase), `缺少选择：${phrase}`);
}
const prompt = buildPrompt({ styleId: 'avatar', purpose: 'figurine', extra: creative });
assert.ok(prompt.includes('人物面部身份必须保持'));
assert.ok(prompt.includes('脸必须仍然像上传照片中的本人'));
assert.ok(!prompt.includes('脚踩两条独立短滑雪板'), '旧版固定滑雪姿势不应覆盖运动选择');

const unsafe = describeFigurineCreative({
  vibe: 'unknown', sport: 'unknown', scene: 'unknown',
  details: '<script>\n' + 'x'.repeat(500),
});
assert.ok(unsafe.includes('冰雪潮玩') && unsafe.includes('双板滑雪') && unsafe.includes('影棚氛围'));
assert.ok(!unsafe.includes('<') && !unsafe.includes('\n<script>'));
assert.ok(!unsafe.includes('x'.repeat(241)), '补充创意最多 240 字');
assert.ok(prompt.includes('#FF00FF'), '全身角色采用高对比纯色幕');
console.log('角色创意选项、身份约束与自定义描述检查通过');
