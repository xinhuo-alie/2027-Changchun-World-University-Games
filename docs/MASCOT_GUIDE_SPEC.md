# 吉冰 / 吉雪内容数据结构与集成规范

## 设计目标

与本地阶段 1 的 `web/mascot-guide.js` 共存：**这里提供内容池及纯数据选择器，不替换或重置原导览状态。**
文案仅为项目游戏设定，非官方吉祥物人设或赛事官方文案。

## 文件结构

```text
web/
├── mascot-guide.js                 # 阶段 1 已存在，保留并扩展
├── mascot-assets.js                # 吉冰/吉雪性格、素材地址、缺省回退
├── mascot-dialogues.js             # 封面、工坊、地图、护照、彩蛋和双人剧情
├── mascot-place-lines.js           # 16 个地点 × 两位吉祥物的专属文案
├── mascot-game-lines.js            # 10 个场馆小游戏开局台词
├── mascot-fun-facts.js             # 16 个景点/场馆趣味问答卡
├── mascot-missions.js              # 映射原 6 个 QUESTS 任务
├── mascot-routes.js                # 4 条示例虚拟主题线
├── mascot-reactions.js             # 成绩、问答、奖励等结果反馈
├── mascot-content-engine.js        # 纯文案解析 + 频率调度器
└── assets/mascots/README.md        # 官方素材放置说明

docs/
├── MASCOT_GUIDE_SPEC.md            # 本文件
└── CODEX_MASCOT_HANDOFF.md         # 可复制给 Codex 的执行任务
```

## 事件与内容组件

每条卡片结构：

```js
{
  id: 'passport.jibing.milestone',   // 全局唯一、可用于去重
  event: 'medal_first',             // 游戏真实事件名
  kind: 'celebration',              // story | bubble | tip | mission | route | arrival | fact | reaction | mystery | celebration
  speaker: 'jibing',                // jibing | jixue | duo
  mood: 'happy',                    // idle | point | happy | surprised | thinking
  title: '第一枚场馆奖章，稳稳拿下！',
  body: '你已经证明自己能闯过冰雪挑战。',
  primaryAction: { type:'open_passport', label:'收进护照' },
  priority: 82,
  once: 'ever',
  cooldownSec: 35,
  requires: { medalsMax: 1 },
}
```

双角色剧情用 `speaker:'duo'`、`lines:[{speaker,mood,text}]`；UI 逐句显示，避免一次同时堆满。CTA 仅允许执行已存在的页面交互，不新增假的外链。

### 事件接线参考

| 真实场景 | 事件名 | 主动触发条件 |
|---|---|---|
| 新用户封面 | `cover_first` | 第一次进入（不可仅凭展示猜测已看过） |
| 普通封面 | `cover_open`, `cover_return` | 页面真实进入或返回 |
| 工坊 | `workshop_first`, `workshop_open`, `avatar_randomized`, `avatar_ready`, `avatar_generate_failed` | 人物生成的真实结果 |
| 地图 | `map_first`, `map_open` | 地图章节进入 |
| 地点 | `place_arrived`, `place_note_open`, `place_fact`, `place_revisit` | 角色真实抵达与用户真实展开手记 |
| 路线 | `route_recommended`, `route_pause`, `route_complete` | 原路线状态变动 |
| 游戏 | `game_first`, `game_start`, `game_win`, `game_lose`, `game_new_best`, `game_medal` | 现有游戏回调，不让 UI 自行判断胜负 |
| 问答 | `quiz_correct`, `quiz_wrong`, `quiz_done` | 原题目判定与结算 |
| 护照 | `passport_first`, `passport_open`, `medal_first`, `quest_ready`, `quest_claimed`, `explore_milestone`, `all_places_explored` | 现有进度 / QUESTS 判定 |
| 彩蛋 | `secret_hint`, `secret_unlocked` | 第二阶段真实隐藏款解锁逻辑 |

## UI 类型和交互要求

- `story`：双人分句卡。用户点击「下一句」；结尾操作按钮；仅首次重要节点自动弹一次。
- `bubble`：头像 + 简短标题和一行正文；展示 4–6 秒后自动折叠（设置的延迟只是设计建议）。
- `tip`：贴边提示卡，禁止遮挡地图控件和照片编辑画布。
- `mission`：关联现有任务的轻任务卡；真实任务进度来源于 `evaluateQuests`，不要自建一套任务状态。
- `route`：说明主题线路；「规划」必须调用当前 `guide-ui.js` + `itinerary.js`，不要绕过现有路线推荐流程。
- `arrival` / `fact`：地点卡；使用 `placeId` 调取 `PLACE_DIALOGUES`，鼓励打开真正的地点手记；趣味问答通过 `place_fact` 读取 `MASCOT_FUN_FACTS`，答案点击 `reveal_answer` 再展开。
- `reaction`：在小游戏结果面板显示短句；低于用户操作层级。
- `mystery`：仅提示彩蛋可能存在，不披露概率、假装必得，也不要未解锁先宣称获得。
- `celebration`：轻量动画；仅在真正获得奖章/达成奖励后出现。

## 重要内容约束

1. 路线是**云游体验排序**，不是真实地图导航，不承诺到达距离/交通时间。现有 16 个地标锚点坐标必须保留。
2. 任务只能用已有 `QUESTS` 的 6 个 ID，领取与奖励仍走现有护照，不制造虚构奖励。
3. 正式官方吉祥物形象必须使用用户自行提供且有使用权的素材；没有授权素材时保留阶段 1 的原创符号/文字回退。
4. `web/mascot-guide.js` 已保存的 `cc2027:mascot-guide:v1` 选择和收起/关闭状态必须沿用。
5. `cc2027:progress:v2`、`cc2027:avatar`、`cc2027:creative` 不迁移/覆盖。额外引导去重可以新建 `cc2027:mascot-guide-seen:v1`。
6. 任务、隐藏款概率、个人新纪录不能从文案推测；只响应真实业务事件。
7. 防刷屏：普通提示场景级至少间隔 8 秒，同条建议 35 秒以上，首次剧情一次，重大奖励优先，用户手动展开不受限制。
8. 用户关闭导览后不弹自动提示；无障碍减少动态效果时取消呼吸、弹跳与自动逐句计时；移动端卡片不能压住「前往地点」「关闭游戏」等必要操作。
9. 本包不含测试框架，不会在项目中自动执行。Codex 将其整合到真实本地项目后才是实际功能。

## 选择器示例（由本地已存在的导览组件调用）

```js
import {createMascotCuePicker} from '/mascot-content-engine.js';
const seenPersist = JSON.parse(localStorage.getItem('cc2027:mascot-guide-seen:v1') || '{}');
const picker=createMascotCuePicker({store:seenPersist});

function onArrived(place,progress,selectedMascot){
  const cue=picker.pick({event:'place_arrived',mascot:selectedMascot,placeId:place.id,progress});
  if(cue) {
    // renderCue(cue);  // 映射到阶段 1 已有导览 UI
    localStorage.setItem('cc2027:mascot-guide-seen:v1',JSON.stringify(seenPersist));
  }
}
```

此示例只说明接口，事件挂载点应由本地 Codex 根据项目真实代码改。`createMascotCuePicker` 只管理内存展示频率，不代替现有 `mascot-guide.js` 存取偏好。

## 成功标准（人工查看，不运行测试脚本）

- 展示 3 种常态/指引/庆祝外观，缺图不破图；点击 CTA 有真实作用。
- 16 个地点每站都有两套不同表达，不把旧地点文案误用于别处。
- 游戏胜负、个人纪录、奖励事件只在实际发生时触发。
- 没有关掉后仍弹窗、刷新后反复播新手对话、与小游戏控件重叠的问题。
- 低动态/手机窄屏保持可读，原角色和虚拟路线逻辑无回归。
