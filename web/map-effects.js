const KEY = 'cc2027:map-effects:v1';

function drawSnowflake(ctx, x, y, radius, rotation, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = '#f9feff';
  ctx.lineWidth = Math.max(1.25, radius * .22);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(39, 104, 139, .52)';
  ctx.shadowBlur = Math.max(1.2, radius * .42);
  ctx.beginPath();
  for (let arm = 0; arm < 6; arm++) {
    const angle = arm * Math.PI / 3;
    const tipX = Math.cos(angle) * radius;
    const tipY = Math.sin(angle) * radius;
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX, tipY);

    const branchX = Math.cos(angle) * radius * .62;
    const branchY = Math.sin(angle) * radius * .62;
    for (const side of [-1, 1]) {
      const branchAngle = angle + side * Math.PI / 3;
      ctx.moveTo(branchX, branchY);
      ctx.lineTo(branchX + Math.cos(branchAngle) * radius * .31, branchY + Math.sin(branchAngle) * radius * .31);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function createMapEffects(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'standard';
  try { mode = localStorage.getItem(KEY) || 'standard'; } catch {}
  if (!['standard', 'light', 'off'].includes(mode)) mode = 'standard';

  const label = document.createElement('label');
  label.textContent = '飘雪效果 ';
  label.style.cssText = 'display:inline-flex;gap:6px;align-items:center;font-size:12px;margin:6px;color:#315d69';
  const select = document.createElement('select');
  select.setAttribute('aria-label', '雪花动效强度');
  for (const [value, text] of [['standard','标准'],['light','轻量'],['off','关闭']]) {
    select.add(new Option(text, value));
  }
  select.value = mode;
  select.onchange = () => {
    mode = select.value;
    try { localStorage.setItem(KEY, mode); } catch {}
  };
  label.append(select);
  canvas.parentElement.insertAdjacentElement('afterend', label);

  const flakes = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * .61803398875) % 1),
    y: ((i * .38196601125 + .13) % 1),
    speed: 18 + (i % 5) * 7,
    sway: 7 + (i % 4) * 3,
    phase: i * 2.17,
    size: 4.5 + (i % 4) * 1.2,
    rotation: (i % 6) * Math.PI / 6,
    spin: (i % 2 ? 1 : -1) * (.16 + (i % 3) * .07),
    opacity: .68 + (i % 4) * .08,
  }));
  let lastFrame = 0;

  return {
    draw(ctx) {
      if (mode === 'off' || reduced.matches || document.hidden) return;
      const now = performance.now();
      const elapsed = lastFrame ? Math.min(.05, (now - lastFrame) / 1000) : 0;
      lastFrame = now;
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;

      const count = mode === 'standard' ? flakes.length : Math.ceil(flakes.length * .42);
      const time = now / 1000;
      for (let i = 0; i < count; i++) {
        const flake = flakes[i];
        flake.y += flake.speed * elapsed / height;
        flake.x += (Math.sin(time * .7 + flake.phase) * flake.sway) * elapsed / width;
        flake.rotation += flake.spin * elapsed;
        if (flake.y > 1.04) {
          flake.y = -.04;
          flake.x = (flake.x + .37 + (i * .071)) % 1;
        }
        if (flake.x < -.04) flake.x = 1.04;
        if (flake.x > 1.04) flake.x = -.04;
        drawSnowflake(ctx, flake.x * width, flake.y * height, flake.size, flake.rotation, flake.opacity);
      }
    },
  };
}
