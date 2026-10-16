import { getStyle } from '../styles.js';

/**
 * 本地模拟服务商：不联网、不需要 key。
 * 用 SVG 滤镜把用户照片做「色阶压缩 + 增饱和」，模拟卡通化的观感，
 * 目的是让上传 → 排队 → 出图 → 展示 这条链路今天就能端到端跑通，
 * 同时给前端一个确定可用的兜底输出（真实 API 挂掉时可以直接切过来）。
 */

export const id = 'mock';
export const label = '本地模拟（不调用任何 API）';
export const requiresKey = false;

export function isAvailable() {
  return true;
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  }[c]));
}

function buildMockSvg({ imageDataUrl, style }) {
  const bg = style.mockBg || '#E8F4FD';
  const safeHref = String(imageDataUrl).replace(/[<>"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <filter id="toon" x="-10%" y="-10%" width="120%" height="120%">
      <feColorMatrix type="saturate" values="1.8"/>
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0.04 0.28 0.52 0.76 1"/>
        <feFuncG type="discrete" tableValues="0.04 0.28 0.52 0.76 1"/>
        <feFuncB type="discrete" tableValues="0.04 0.28 0.52 0.76 1"/>
      </feComponentTransfer>
      <feGaussianBlur stdDeviation="1.4"/>
      <feComposite in2="SourceGraphic" operator="atop"/>
    </filter>
    <clipPath id="frame"><circle cx="512" cy="452" r="322"/></clipPath>
  </defs>
  <rect width="1024" height="1024" fill="${bg}"/>
  <circle cx="512" cy="452" r="338" fill="#FFFFFF" opacity="0.6"/>
  <image xlink:href="${safeHref}" href="${safeHref}" x="190" y="130" width="644" height="644"
         preserveAspectRatio="xMidYMid slice" filter="url(#toon)" clip-path="url(#frame)"/>
  <text x="512" y="884" text-anchor="middle"
        font-family="system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif"
        font-size="42" font-weight="700" fill="#2A5C8A">MOCK · ${escapeXml(style.name)}</text>
  <text x="512" y="936" text-anchor="middle"
        font-family="system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif"
        font-size="25" fill="#6A8AA6">本地模拟输出 · 接入真实模型后自动替换</text>
</svg>`;
}

export async function generate({ imageDataUrl, styleId }) {
  const style = getStyle(styleId);
  // 故意留一点延迟，让排队/进度条这条交互路径真的被走到
  await new Promise((resolve) => setTimeout(resolve, 900));
  return {
    kind: 'text',
    data: buildMockSvg({ imageDataUrl: imageDataUrl, style }),
    ext: 'svg',
    mimeType: 'image/svg+xml',
  };
}
