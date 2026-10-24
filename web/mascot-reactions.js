/** 通用小游戏、知识问答、奖章与任务结果反馈；游戏结果由现有游戏代码触发，不自行猜测。 */
export const MASCOT_REACTIONS = [
  {
    "id": "game.duo.first",
    "event": "game_first",
    "kind": "story",
    "speaker": "duo",
    "mood": "point",
    "title": "第一次挑战，别着急！",
    "lines": [
      {
        "speaker": "jibing",
        "mood": "point",
        "text": "看清操作再出手，赢在节奏！"
      },
      {
        "speaker": "jixue",
        "mood": "idle",
        "text": "试错也是体验的一部分，玩得开心最重要。"
      }
    ],
    "primaryAction": {
      "type": "start_current_game",
      "label": "开始挑战"
    },
    "once": "ever",
    "priority": 32
  },
  {
    "id": "reaction.jibing.game_win",
    "event": "game_win",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "happy",
    "title": "漂亮，这局拿下了！",
    "body": "你刚才的操作很稳，下一次可以试试更高分。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.game_win",
    "event": "game_win",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "恭喜赢下一场！",
    "body": "把这段小小的胜利收进今天的旅行。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.game_lose",
    "event": "game_lose",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "thinking",
    "title": "差一点！下局换个节奏。",
    "body": "试着观察提示，再决定下一步。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.game_lose",
    "event": "game_lose",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "idle",
    "title": "没关系，游戏还可以再试。",
    "body": "这次至少摸清了玩法，下次会更有把握。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.game_new_best",
    "event": "game_new_best",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "surprised",
    "title": "新纪录！这可是你自己刷新的！",
    "body": "记录已经超过之前的最佳表现。",
    "priority": 60,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.game_new_best",
    "event": "game_new_best",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "给今天留下一笔新成绩。",
    "body": "这次突破值得记在护照里。",
    "priority": 60,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.game_medal",
    "event": "game_medal",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "happy",
    "title": "新的场馆奖章点亮！",
    "body": "去护照里看看，你还差哪些挑战？",
    "priority": 80,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.game_medal",
    "event": "game_medal",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "又多了一枚纪念章。",
    "body": "这段旅行正在慢慢变得独一无二。",
    "priority": 80,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.quiz_correct",
    "event": "quiz_correct",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "happy",
    "title": "回答正确，反应很快！",
    "body": "下一题也要看清题干哦。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.quiz_correct",
    "event": "quiz_correct",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "答对啦！",
    "body": "这些冰雪知识，记住一点就多懂一点。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.quiz_wrong",
    "event": "quiz_wrong",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "thinking",
    "title": "这题挺会设陷阱！",
    "body": "看看解释，再来下一题。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.quiz_wrong",
    "event": "quiz_wrong",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "thinking",
    "title": "没答对也有收获。",
    "body": "读一读解析，就能发现新知识。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.quiz_done",
    "event": "quiz_done",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "happy",
    "title": "这一轮知识挑战完成！",
    "body": "成绩已经结算，想再试试新题吗？",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.quiz_done",
    "event": "quiz_done",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "新的知识也能成为旅途纪念。",
    "body": "回到地图，看看知识背后的场馆吧。",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.quest_ready",
    "event": "quest_ready",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "surprised",
    "title": "任务进度达标！",
    "body": "这枚任务章等你亲手领取。",
    "priority": 48,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.quest_ready",
    "event": "quest_ready",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "有一份旅程奖励待领取。",
    "body": "去护照里为它盖章吧。",
    "priority": 48,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.quest_claimed",
    "event": "quest_claimed",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "happy",
    "title": "任务章入手！",
    "body": "这段挑战算是被你正式记录下来啦。",
    "priority": 55,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.quest_claimed",
    "event": "quest_claimed",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "happy",
    "title": "新的一页收藏完成。",
    "body": "接下来挑一件感兴趣的事继续吧。",
    "priority": 55,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jibing.place_revisit",
    "event": "place_revisit",
    "kind": "reaction",
    "speaker": "jibing",
    "mood": "idle",
    "title": "老地方也能玩出新成绩。",
    "body": "要不要重玩这里的挑战？",
    "priority": 12,
    "cooldownSec": 12
  },
  {
    "id": "reaction.jixue.place_revisit",
    "event": "place_revisit",
    "kind": "reaction",
    "speaker": "jixue",
    "mood": "idle",
    "title": "又回到熟悉的一站。",
    "body": "再读一次手记，也许会发现上次忽略的细节。",
    "priority": 12,
    "cooldownSec": 12
  }
];
