export async function fetchMapLayout() {
  let response = await fetch('/api/map-layout');
  // 已运行的旧版 5173 服务不能热重启时，由新版 5174 服务提供同一份地图配置。
  if (response.status === 404 && location.port === '5173') {
    response = await fetch(`http://${location.hostname}:5174/api/map-layout`);
  }
  if (!response.ok) throw new Error('地图配置加载失败');
  return response.json();
}
