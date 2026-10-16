# 长春冬日漫游

一个本地运行的长春 2027 冬季城市互动网页。用户从城市游览手册封面进入，第一页制作卡通角色，第二页跟着角色浏览长春及吉林市的 10 座竞赛场馆和 6 处城市景点，抵达后翻开对应地点手记；独立的 `/display` 页面用于展示地图和实时游览统计。

## 启动

需要 Node.js 20 或更新版本。项目没有 npm 依赖。

```powershell
Copy-Item .env.example .env
notepad .env
node server/index.js
```

打开 `.env` 后，选择图像生成渠道并填写对应密钥。例如使用豆包 Seedream：

```dotenv
IMAGE_PROVIDER=doubao
ARK_API_KEY=在火山方舟获取的API密钥
```

保存后运行 `node server/index.js`。打开 `http://localhost:5173/`；在同一台服务器上打开 `http://localhost:5173/display` 可展示大屏。若 `.env` 已存在，保留并编辑现有文件，无需再次复制。服务端配置变更后需要重启 Node 进程。

仓库中的 `.env.example` 只提供空白配置模板，**不包含任何可用 API 密钥**。`.env` 已加入 Git 忽略规则，不会随项目提交；请只在本地 `.env` 中填写密钥，不要将密钥粘贴到源码、README、截图或公开仓库中。无需使用豆包时可保留 `IMAGE_PROVIDER=mock`，该模式不需要密钥。

## 角色与地图

翻开封面后上传或拍摄照片，选好形象设定和生成模型，点击生成。生成的图片会处理为透明人物。点击「带我去游览」，手册翻到地图页，角色跳入地图；再点击场馆或景点，角色抵达后才翻开对应的地点介绍页并增加一次统计。读完可返回地图继续游览。场馆挑战成功可集章，也能在浏览器中生成纪念卡。

图片生成使用豆包 Seedream。生成失败时不会自动切换模型再次扣费。没有密钥时可使用本地模拟提供商检查操作流程。

## 统计说明

`GET /api/places` 提供地图地点。`GET /api/visits` 提供统计快照，`GET /api/visits/stream` 通过 SSE 推送更新，`POST /api/visits` 在角色完成地点到达时记录 `{ placeId, eventId }`。刷新页面、仅查看介绍和跳入地图均不计数。

统计代表本项目中的**虚拟游览到达次数**，并非真实景区客流或去重人数。数据保存于 `data/visits.json`，服务重启后仍保留。单进程内串行写入并使用事件编号防止重试重复计数；局域网设备访问同一服务即可共享。多进程部署需迁移至共享数据库。

地图是冰雪主题城市示意图，概括了相对位置，不提供实际导航。地点介绍中的资料来源可点击查阅。

## 检查

```powershell
node tools/test-avatar.js
node tools/test-creative.js
node tools/test-games.js
node tools/test-visits.js
node tools/test-visits-http.js
node tools/test-providers.js
```

这些测试不会调用付费生图接口。

旧版 3D 生成与 `/tour` 页面、相关服务端路由和专用资源已从项目移除。历史生成文件与统计文件仍留在本地 `data/` 中，不受页面清理影响。
