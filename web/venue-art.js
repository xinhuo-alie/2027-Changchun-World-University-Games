/**
 * 场馆缩略插画。按场馆公开资料中的结构或赛道特征绘制，
 * 用在地图、介绍卡和小游戏中，保持同一场馆的视觉识别一致。
 */

import { drawLandmark } from './landmark-art.js';
const palettes = {
  wuhuan: ['#a8d9f4', '#6c9fc9', '#365e91'],
  speed: ['#a2e7f5', '#5bb4d1', '#297b9e'],
  cityhall: ['#f4d8e8', '#c987b2', '#7a6598'],
  provhall: ['#c8eee9', '#79beb6', '#478c9a'],
  olympic: ['#cbdcff', '#849ddd', '#4c6bb2'],
  jingyue: ['#bce9dc', '#72bba9', '#3c8c86'],
  lianhua: ['#c5e9fb', '#76b5dc', '#5081b3'],
  sculpture: ['#e3d8f5', '#b69bd9', '#795fa8'],
  songhuahu: ['#f9ded8', '#dc9f9e', '#8a739f'],
  beidahu: ['#d2e9fa', '#83b5d7', '#547fae'],
};

function poly(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function snowPeak(ctx, x, y, width, height, color = '#93b9d6') {
  poly(ctx, color, [[x - width / 2, y], [x, y - height], [x + width / 2, y]]);
  poly(ctx, '#fff', [[x - width * .13, y - height * .73], [x, y - height], [x + width * .17, y - height * .66], [x + width * .03, y - height * .72]]);
}

function fir(ctx, x, y, height, dark = '#3d8190') {
  ctx.fillStyle = '#755e6b';
  ctx.fillRect(x - 1.4, y - height * .1, 2.8, height * .17);
  for (let tier = 0; tier < 3; tier += 1) {
    const top = y - height + tier * height * .23;
    const half = height * (.15 + tier * .065);
    poly(ctx, dark, [[x, top], [x - half, top + height * .35], [x + half, top + height * .35]]);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - half * .7, top + height * .3); ctx.quadraticCurveTo(x, top + height * .22, x + half * .65, top + height * .29); ctx.stroke();
  }
}

function windows(ctx, x, y, columns, rows, dx = 11, dy = 9) {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      ctx.fillStyle = (row + col) % 3 === 0 ? '#f9f1c9' : '#b9e5f3';
      ctx.fillRect(x + col * dx, y + row * dy, dx * .58, dy * .56);
    }
  }
}

function drawArena(ctx, id, p) {
  const [, mid, deep] = p;
  ctx.fillStyle = 'rgba(40,77,111,.17)';
  ctx.beginPath(); ctx.ellipse(80, 96, 65, 9, 0, 0, Math.PI * 2); ctx.fill();
  if (id === 'wuhuan') {
    ctx.fillStyle = deep; ctx.beginPath(); ctx.ellipse(80, 73, 64, 23, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9ebf5'; ctx.fillRect(20, 73, 120, 21);
    windows(ctx, 27, 78, 11, 2, 10, 8);
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.strokeStyle = ring === 1 ? '#fff' : '#b4d6e9'; ctx.lineWidth = ring === 1 ? 5 : 3;
      ctx.beginPath(); ctx.ellipse(80, 70 - ring * 4, 59 - ring * 7, 22 - ring * 3, 0, Math.PI, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(80, 57, 44, 15, 0, Math.PI, Math.PI * 2); ctx.fill();
  } else if (id === 'speed') {
    ctx.fillStyle = deep; ctx.fillRect(10, 68, 140, 28);
    ctx.fillStyle = '#b9e6f2'; ctx.fillRect(13, 73, 134, 19);
    windows(ctx, 18, 77, 13, 2, 10, 9);
    ctx.fillStyle = '#effaff'; ctx.beginPath(); ctx.moveTo(9, 68); ctx.bezierCurveTo(34, 27, 125, 27, 151, 68); ctx.lineTo(144, 71); ctx.bezierCurveTo(114, 44, 46, 44, 16, 71); ctx.fill();
    ctx.strokeStyle = mid; ctx.lineWidth = 2;
    for (let x = 31; x <= 129; x += 14) { ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x + (80 - x) * .1, 69); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 68); ctx.bezierCurveTo(40, 35, 121, 35, 144, 68); ctx.stroke();
  } else if (id === 'olympic') {
    ctx.fillStyle = deep; ctx.beginPath(); ctx.ellipse(80, 72, 70, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d3e5f8'; ctx.fillRect(15, 73, 130, 23); windows(ctx, 23, 78, 12, 2, 10, 9);
    ctx.fillStyle = '#f2f9ff'; ctx.beginPath(); ctx.ellipse(80, 67, 64, 24, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = mid; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(80, 68, 58, 18, 0, Math.PI, Math.PI * 2); ctx.stroke();
    for (let i = -3; i <= 3; i += 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(80 + i * 14, 71); ctx.lineTo(80 + i * 7, 45); ctx.stroke(); }
    ctx.fillStyle = '#f7d99a'; ctx.fillRect(15, 91, 130, 3);
  } else {
    const hockey = id === 'provhall';
    ctx.fillStyle = deep; ctx.beginPath(); ctx.roundRect(16, 61, 128, 35, 4); ctx.fill();
    ctx.fillStyle = hockey ? '#d5f3ee' : '#efebf8'; ctx.fillRect(20, 67, 120, 25);
    windows(ctx, 25, 72, 11, 2, 10, 9);
    ctx.fillStyle = '#f7fbff'; ctx.beginPath(); ctx.moveTo(12, 63); ctx.lineTo(28, 43); ctx.lineTo(132, 43); ctx.lineTo(148, 63); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = mid; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(13, 63); ctx.lineTo(147, 63); ctx.stroke();
    if (hockey) {
      ctx.strokeStyle = '#ed7285'; ctx.lineWidth = 2.4; ctx.strokeRect(65, 77, 30, 16);
      ctx.beginPath(); ctx.moveTo(65, 77); ctx.lineTo(72, 82); ctx.lineTo(88, 82); ctx.lineTo(95, 77); ctx.stroke();
    } else {
      for (let i = 0; i < 3; i += 1) {
        ctx.strokeStyle = '#70bdd9'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(59 + i * 20, 86, 7, 4, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
}

function drawOutdoors(ctx, id, p) {
  const [, mid, deep] = p;
  if (id === 'sculpture') {
    ctx.fillStyle = '#e7ddf3'; ctx.fillRect(15, 67, 46, 19); windows(ctx, 21, 72, 4, 1, 9, 8);
    ctx.fillStyle = deep; ctx.fillRect(72, 88, 47, 5);
    ctx.strokeStyle = mid; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(84, 84); ctx.bezierCurveTo(48, 38, 116, 37, 106, 77); ctx.stroke();
    ctx.strokeStyle = '#f7eefa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(84, 80); ctx.bezierCurveTo(66, 57, 98, 50, 106, 67); ctx.stroke();
    ctx.fillStyle = mid; ctx.beginPath(); ctx.arc(124, 73, 7, 0, Math.PI * 2); ctx.fill();
    fir(ctx, 35, 94, 30, '#547f85'); fir(ctx, 137, 93, 32, '#567f9b');
    return;
  }
  if (id === 'jingyue') {
    ctx.fillStyle = '#95d9e3'; ctx.beginPath(); ctx.ellipse(93, 92, 59, 13, -.08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(12, 101); ctx.bezierCurveTo(35, 68, 90, 79, 144, 61); ctx.stroke();
    for (const [x, y, h] of [[20, 86, 35], [42, 75, 29], [65, 75, 39], [127, 82, 38], [147, 70, 30]]) fir(ctx, x, y, h);
    ctx.fillStyle = deep; ctx.fillRect(65, 60, 4, 22); ctx.fillRect(96, 60, 4, 22);
    ctx.strokeStyle = '#f4ffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(82, 82, 18, Math.PI, 2 * Math.PI); ctx.stroke();
    return;
  }
  if (id === 'lianhua') {
    snowPeak(ctx, 68, 101, 150, 72, mid); snowPeak(ctx, 132, 98, 90, 51, deep);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(30, 88); ctx.lineTo(112, 47); ctx.lineTo(119, 50); ctx.lineTo(50, 96); ctx.fill();
    ctx.strokeStyle = '#547894'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(36, 89); ctx.lineTo(112, 50); ctx.stroke();
    ctx.strokeStyle = '#f9cf81'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(114, 49); ctx.quadraticCurveTo(127, 40, 135, 50); ctx.stroke();
    for (const x of [21, 137]) fir(ctx, x, 100, 34);
    return;
  }
  if (id === 'songhuahu') {
    snowPeak(ctx, 78, 98, 172, 65, deep); snowPeak(ctx, 137, 90, 95, 43, mid);
    ctx.fillStyle = '#7fcfdb'; ctx.beginPath(); ctx.ellipse(77, 102, 75, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(57, 43); ctx.quadraticCurveTo(78, 64, 83, 93); ctx.stroke();
    ctx.strokeStyle = '#567991'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(26, 44); ctx.lineTo(128, 29); ctx.stroke();
    for (const [x, y] of [[55, 39], [99, 33]]) { ctx.fillStyle = '#e9f9ff'; ctx.beginPath(); ctx.roundRect(x - 6, y, 12, 9, 3); ctx.fill(); }
    for (const x of [13, 139]) fir(ctx, x, 94, 35);
    return;
  }
  // 北大湖：山谷、大跳台与 U 型池。
  snowPeak(ctx, 58, 99, 142, 76, deep); snowPeak(ctx, 123, 96, 94, 59, mid);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(51, 46); ctx.quadraticCurveTo(79, 70, 64, 97); ctx.stroke();
  ctx.strokeStyle = '#74c4db'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(84, 84); ctx.quadraticCurveTo(102, 106, 126, 82); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(84, 78); ctx.quadraticCurveTo(103, 98, 127, 77); ctx.stroke();
  ctx.fillStyle = '#f7d8a4'; ctx.fillRect(32, 71, 6, 23);
  for (const x of [15, 142]) fir(ctx, x, 99, 31);
}

export function drawVenueIllustration(ctx, venue, x, y, width, height) {
  const id = typeof venue === 'string' ? venue : venue?.id;
  const p = palettes[id] || palettes.wuhuan;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width / 160, height / 110);
  if (typeof venue === 'object' && venue.kind === 'attraction') {
    drawLandmark(ctx, id); ctx.restore(); return;
  }
  const sky = ctx.createLinearGradient(0, 0, 0, 110);
  sky.addColorStop(0, p[0]); sky.addColorStop(.68, '#eaf6fd'); sky.addColorStop(1, '#fff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 160, 110);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (const [sx, sy, sr] of [[21, 15, 1.5], [48, 22, 1], [117, 14, 1.7], [141, 36, 1]]) {
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }
  snowPeak(ctx, 27, 76, 80, 48, '#bbd5e7');
  snowPeak(ctx, 111, 78, 113, 54, '#a8c8e0');
  ctx.fillStyle = '#f7fdff'; ctx.beginPath(); ctx.ellipse(80, 108, 96, 27, 0, 0, Math.PI * 2); ctx.fill();
  if (['wuhuan', 'speed', 'cityhall', 'provhall', 'olympic'].includes(id)) drawArena(ctx, id, p);
  else drawOutdoors(ctx, id, p);
  ctx.restore();
}
