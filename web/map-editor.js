import { applyMapLayout, createMapView } from '/venues2d.js';
import { defaultConfig, loadConfig } from '/avatar.js';

const $ = id => document.getElementById(id);
const status = $('status');
const place = $('place');
const size = $('size');
const response = await fetch('/api/places');
if (!response.ok) throw new Error('无法加载景点');
const { places } = await response.json();
const layoutResponse = await fetch('/api/map-layout');
if (!layoutResponse.ok) throw new Error('无法加载后端地图配置');
applyMapLayout(await layoutResponse.json());
let map;
const syncSize = () => {
  size.value = String(map.getCalibrationSize(place.value));
  $('sizeValue').textContent = `${Math.round(Number(size.value) * 100)}%`;
};
map = createMapView($('map'), {
  venues: places,
  heroVisible: true,
  onCalibrationSelect(id) { place.value = id; syncSize(); },
  onCalibrationChange() { status.textContent = '有未保存的调整'; },
});
map.setCalibration(true);
map.setCharacter(loadConfig() || defaultConfig());
map.walkTo('wuhuan', { instant: true });
for (const item of places) place.add(new Option(item.name, item.id));
place.value = places[0]?.id || '';
map.setCalibrationSelected(place.value);
syncSize();
$('heroSize').value = String(map.getHeroSize());
$('heroSizeValue').textContent = `${Math.round(map.getHeroSize() * 100)}%`;
map.resize();
map.fit();
function frame() { map.draw(); requestAnimationFrame(frame); }
frame();
place.addEventListener('change', () => { map.setCalibrationSelected(place.value); syncSize(); });
size.addEventListener('input', () => {
  map.setCalibrationSize(place.value, size.value);
  $('sizeValue').textContent = `${Math.round(Number(size.value) * 100)}%`;
  status.textContent = '有未保存的调整';
});
$('heroSize').addEventListener('input', () => {
  map.setHeroSize($('heroSize').value);
  $('heroSizeValue').textContent = `${Math.round(map.getHeroSize() * 100)}%`;
  status.textContent = '有未保存的调整';
});
$('save').addEventListener('click', async () => {
  const button = $('save'); button.disabled = true;
  try {
    const response = await fetch('/api/map-layout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: map.exportLandmarks(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '保存失败');
    status.textContent = '已保存到后端，刷新其他页面即可生效';
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});
$('reset').addEventListener('click', () => {
  map.resetCalibration(); syncSize();
  $('heroSize').value = '1'; $('heroSizeValue').textContent = '100%';
  status.textContent = '已恢复上次保存的布局；如需保留修改请点保存';
});
$('export').addEventListener('click', async () => {
  const json = map.exportLandmarks();
  try { await navigator.clipboard.writeText(json); status.textContent = '配置已复制'; }
  catch { prompt('复制地图配置 JSON', json); }
});
$('zoomIn').addEventListener('click', () => map.zoomBy(1.25));
$('zoomOut').addEventListener('click', () => map.zoomBy(.8));
$('fit').addEventListener('click', () => map.fit());
window.addEventListener('resize', () => map.resize());
$('logout').addEventListener('click', async () => {
  await fetch('/api/map-editor/logout', { method: 'POST' });
  location.reload();
});
