const licenseUrl = license => {
  if (license.startsWith('CC BY-SA ')) return `https://creativecommons.org/licenses/by-sa/${license.slice(9)}/`;
  if (license.startsWith('CC BY ')) return `https://creativecommons.org/licenses/by/${license.slice(6)}/`;
  if (license === 'CC0' || license === 'CC0 1.0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  return '';
};

export function createPlaceGallery(container, onUnavailable = () => {}) {
  let current = [];
  let index = 0;
  let revision = 0;

  function show() {
    container.replaceChildren();
    if (!current.length) { container.hidden = true; return false; }
    const renderedRevision = revision;
    const figure = document.createElement('figure');
    figure.className = 'place-gallery-figure';
    const img = document.createElement('img');
    img.className = 'place-gallery-image';
    img.loading = 'lazy';
    img.decoding = 'async';
    const expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'place-gallery-expand';
    expand.textContent = '⛶';
    expand.setAttribute('aria-label', '全屏查看照片');
    expand.addEventListener('click', async () => {
      if (document.fullscreenElement === figure) await document.exitFullscreen();
      else if (figure.requestFullscreen) await figure.requestFullscreen().catch(() => {});
    });
    const shade = document.createElement('div');
    shade.className = 'place-gallery-shade';
    const title = document.createElement('strong');
    const caption = document.createElement('p');
    shade.append(title, caption);
    figure.append(img, expand);
    const stage = document.createElement('div');
    stage.className = 'place-gallery-stage';
    stage.append(figure);

    const controls = document.createElement('div');
    controls.className = 'place-gallery-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '‹';
    previous.setAttribute('aria-label', '上一张照片');
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '›';
    next.setAttribute('aria-label', '下一张照片');
    const counter = document.createElement('span');
    counter.className = 'place-gallery-counter';
    controls.append(previous, counter, next);

    const seek = document.createElement('div');
    seek.className = 'place-gallery-seek';
    const seekLabel = document.createElement('label');
    seekLabel.textContent = '滑动定位图片';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = String(current.length);
    slider.step = '1';
    slider.setAttribute('aria-label', '滑动定位图片');
    seekLabel.append(slider);
    const position = document.createElement('span');
    seek.append(seekLabel, position);

    const footer = document.createElement('div');
    footer.className = 'place-gallery-footer';
    const credit = document.createElement('a');
    credit.className = 'place-gallery-credit';
    credit.target = '_blank';
    credit.rel = 'noopener noreferrer';
    const licenseLink = document.createElement('a');
    licenseLink.className = 'place-gallery-license';
    licenseLink.target = '_blank';
    licenseLink.rel = 'noopener noreferrer';
    licenseLink.textContent = '许可说明';
    footer.append(credit, licenseLink);

    function update() {
      const item = current[index];
      img.alt = item.alt || item.title || '地点照片';
      img.src = item.src;
      title.textContent = item.title || '地点照片';
      caption.textContent = `${item.caption || ''}${item.captionVerified === false ? '（图注待核实）' : ''}`;
      counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(current.length).padStart(2, '0')}`;
      slider.value = String(index + 1);
      slider.style.setProperty('--gallery-progress', `${current.length > 1 ? index / (current.length - 1) * 100 : 0}%`);
      position.textContent = `${index + 1} / ${current.length}`;
      credit.href = item.sourceUrl || '#';
      const rights = item.license === 'permission-required' ? '授权待核' : (item.license || '许可信息待核');
      credit.textContent = `${item.credit || '图片来源'} · ${rights} ↗`;
      const license = item.licenseUrl || licenseUrl(item.license || '');
      licenseLink.hidden = !license;
      if (license) licenseLink.href = license;
      previous.disabled = next.disabled = slider.disabled = current.length < 2;
    }
    function goTo(value) { index = (value + current.length) % current.length; update(); }
    previous.addEventListener('click', () => goTo(index - 1));
    next.addEventListener('click', () => goTo(index + 1));
    slider.addEventListener('input', () => goTo(Number(slider.value) - 1));
    let touchStart = null;
    figure.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
    figure.addEventListener('touchend', event => {
      if (touchStart === null) return;
      const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
      if (Math.abs(distance) > 45 && current.length > 1) goTo(index + (distance < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
    img.addEventListener('error', () => {
      if (renderedRevision !== revision) return;
      current = [];
      container.hidden = true;
      onUnavailable();
    });
    stage.append(controls);
    container.append(stage, shade, seek, footer);
    update();
    container.hidden = false;
    return true;
  }
  return {
    render(place) {
      revision += 1;
      current = Array.isArray(place?.gallery) ? place.gallery : [];
      index = 0;
      return show();
    },
  };
}
