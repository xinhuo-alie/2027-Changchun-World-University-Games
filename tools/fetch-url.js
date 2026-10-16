/**
 * 通用取页工具：把网页抓回本地再慢慢分析。
 *
 * 比 curl 强的地方：Node 的 fetch 会自动解压 gzip/br，
 * 而 Windows 自带的 curl 不支持 --compressed，很多文档站抓回来是乱码。
 *
 * 用法：
 *   node tools/fetch-url.js <url> [输出文件]
 *   不带输出文件时，打印正文前 4000 字符
 */

import fs from 'node:fs';

const url = process.argv[2];
const outFile = process.argv[3];

if (!url) {
  console.error('用法: node tools/fetch-url.js <url> [输出文件]');
  process.exit(1);
}

const res = await fetch(url, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
  },
  redirect: 'follow',
});

const buffer = Buffer.from(await res.arrayBuffer());
console.log(`HTTP ${res.status} · ${buffer.length} 字节 · ${res.headers.get('content-type') || ''}`);

if (outFile) {
  // 按原始字节写，文本和图片/压缩包都能存
  fs.writeFileSync(outFile, buffer);
  console.log(`已保存: ${outFile}`);
} else {
  console.log(buffer.toString('utf8').slice(0, 4000));
}
