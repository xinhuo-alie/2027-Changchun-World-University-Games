/** 剧情、首页、工坊、地图、护照、隐藏款、成果文案池：不用 DOM 和网络。 */
export const SCENE_DIALOGUES = [
  {
    "id": "cover.duo.intro",
    "event": "cover_first",
    "kind": "story",
    "speaker": "duo",
    "mood": "point",
    "title": "冰雪之旅，双人搭档就位！",
    "lines": [
      {
        "speaker": "jibing",
        "mood": "happy",
        "text": "我负责带你热血开赛！"
      },
      {
        "speaker": "jixue",
        "mood": "idle",
        "text": "我带你收集城市里的小故事。"
      },
      {
        "speaker": "jibing",
        "mood": "point",
        "text": "先创造冰雪分身，然后选一站出发！"
      }
    ],
    "primaryAction": {
      "type": "open_workshop",
      "label": "创造我的分身"
    },
    "secondaryAction": {
      "type": "enter_tour",
      "label": "直接漫游"
    },
    "once": "ever",
    "priority": 45
  },
  {
    "id": "cover.jibing.fresh",
    "event": "cover_open",
    "kind": "bubble",
    "speaker": "jibing",
    "mood": "happy",
    "title": "开场哨响啦！",
    "body": "你的第一枚冰雪奖章，想从哪个挑战开始？",
    "primaryAction": {
      "type": "open_workshop",
      "label": "创造角色"
    },
    "priority": 10
  },
  {
    "id": "cover.jixue.fresh",
    "event": "cover_open",
    "kind": "bubble",
    "speaker": "jixue",
    "mood": "point",
    "title": "城市的雪景故事，等你来翻开。",
    "body": "创造分身，或者直接踏上冬日地图。",
    "primaryAction": {
      "type": "enter_tour",
      "label": "直接漫游"
    },
    "priority": 10
  },
  {
    "id": "cover.jibing.return",
    "event": "cover_return",
    "kind": "bubble",
    "speaker": "jibing",
    "mood": "point",
    "title": "熟悉的雪道，新的突破！",
    "body": "这次试试没玩过的运动项目吧。",
    "primaryAction": {
      "type": "open_passport",
      "label": "看看我的奖章"
    },
    "priority": 12
  },
  {
    "id": "cover.jixue.return",
    "event": "cover_return",
    "kind": "bubble",
    "speaker": "jixue",
    "mood": "happy",
    "title": "又见面啦，冬日旅人。",
    "body": "上次没读完的地点手记，我们可以接着看。",
    "primaryAction": {
      "type": "open_passport",
      "label": "继续收集"
    },
    "priority": 12
  },
  {
    "id": "workshop.duo.open",
    "event": "workshop_first",
    "kind": "story",
    "speaker": "duo",
    "mood": "thinking",
    "title": "你的冰雪分身是什么风格？",
    "lines": [
      {
        "speaker": "jixue",
        "mood": "idle",
        "text": "先选一个喜欢的造型方向。"
      },
      {
        "speaker": "jibing",
        "mood": "happy",
        "text": "其他细节交给随机灵感！"
      },
      {
        "speaker": "jixue",
        "mood": "point",
        "text": "想细调也可以打开高级选项。"
      }
    ],
    "once": "ever",
    "priority": 20
  },
  {
    "id": "workshop.jibing.open",
    "event": "workshop_open",
    "kind": "tip",
    "speaker": "jibing",
    "mood": "point",
    "title": "先选风格，再来点运动感！",
    "body": "动作、表情和配色都能带来不同惊喜。",
    "primaryAction": {
      "type": "randomize_avatar",
      "label": "试试随机灵感"
    },
    "priority": 8
  },
  {
    "id": "workshop.jixue.open",
    "event": "workshop_open",
    "kind": "tip",
    "speaker": "jixue",
    "mood": "point",
    "title": "选你喜欢的感觉就好。",
    "body": "别被太多选项难住，高级细节可以慢慢调。",
    "primaryAction": {
      "type": "randomize_avatar",
      "label": "试试随机灵感"
    },
    "priority": 8
  },
  {
    "id": "workshop.jibing.random",
    "event": "avatar_randomized",
    "kind": "bubble",
    "speaker": "jibing",
    "mood": "surprised",
    "title": "嘿！这次搭配有点东西。",
    "body": "喜欢就保存这套灵感，不喜欢再换一次。",
    "primaryAction": {
      "type": "generate_avatar",
      "label": "生成角色"
    },
    "priority": 10,
    "cooldownSec": 25
  },
  {
    "id": "workshop.jixue.random",
    "event": "avatar_randomized",
    "kind": "bubble",
    "speaker": "jixue",
    "mood": "happy",
    "title": "每一次随机，都像拆一份冬日礼物。",
    "body": "记得保留你最喜欢的造型。",
    "primaryAction": {
      "type": "generate_avatar",
      "label": "生成角色"
    },
    "priority": 10,
    "cooldownSec": 25
  },
  {
    "id": "workshop.jibing.generated",
    "event": "avatar_ready",
    "kind": "celebration",
    "speaker": "jibing",
    "mood": "happy",
    "title": "角色上场！",
    "body": "带着你的冰雪分身，去打第一场比赛吧。",
    "primaryAction": {
      "type": "enter_tour",
      "label": "前往地图"
    },
    "priority": 35,
    "once": "session"
  },
  {
    "id": "workshop.jixue.generated",
    "event": "avatar_ready",
    "kind": "celebration",
    "speaker": "jixue",
    "mood": "happy",
    "title": "冬日旅伴诞生啦！",
    "body": "地图上有 16 处地点等着你去发现。",
    "primaryAction": {
      "type": "enter_tour",
      "label": "开始探索"
    },
    "priority": 35,
    "once": "session"
  },
  {
    "id": "workshop.jibing.error",
    "event": "avatar_generate_failed",
    "kind": "tip",
    "speaker": "jibing",
    "mood": "thinking",
    "title": "这一张没生成成功。",
    "body": "先保留选择，换张清晰照片或稍后再试；也能直接试玩。",
    "primaryAction": {
      "type": "enter_tour",
      "label": "直接试玩"
    },
    "priority": 65,
    "cooldownSec": 15
  },
  {
    "id": "workshop.jixue.error",
    "event": "avatar_generate_failed",
    "kind": "tip",
    "speaker": "jixue",
    "mood": "thinking",
    "title": "灵感还在，作品可以再来。",
    "body": "这次没有成功生成，不会把失败的图当成完成作品。",
    "primaryAction": {
      "type": "enter_tour",
      "label": "先去漫游"
    },
    "priority": 65,
    "cooldownSec": 15
  },
  {
    "id": "map.duo.first",
    "event": "map_first",
    "kind": "story",
    "speaker": "duo",
    "mood": "point",
    "title": "16 站冰雪手记，现在开始收集！",
    "lines": [
      {
        "speaker": "jibing",
        "mood": "point",
        "text": "想冲成绩？点一座场馆。"
      },
      {
        "speaker": "jixue",
        "mood": "idle",
        "text": "想读故事？选一个城市景点。"
      },
      {
        "speaker": "jibing",
        "mood": "happy",
        "text": "到达后才能正式解锁这站的记录哦！"
      }
    ],
    "primaryAction": {
      "type": "open_route",
      "label": "规划云游路线"
    },
    "once": "ever",
    "priority": 35
  },
  {
    "id": "map.jibing.zero",
    "event": "map_open",
    "kind": "mission",
    "speaker": "jibing",
    "mood": "point",
    "title": "第一站就选运动场馆！",
    "body": "先解锁一个地点，再试试看能否拿下第一枚奖章。",
    "primaryAction": {
      "type": "open_route",
      "label": "挑选路线"
    },
    "requires": {
      "exploredMax": 0
    },
    "priority": 20
  },
  {
    "id": "map.jixue.zero",
    "event": "map_open",
    "kind": "mission",
    "speaker": "jixue",
    "mood": "point",
    "title": "从一枚地点印章开始。",
    "body": "点击地标，看角色走到终点，然后翻开手记。",
    "primaryAction": {
      "type": "open_route",
      "label": "规划路线"
    },
    "requires": {
      "exploredMax": 0
    },
    "priority": 20
  },
  {
    "id": "map.jibing.progress",
    "event": "map_open",
    "kind": "tip",
    "speaker": "jibing",
    "mood": "happy",
    "title": "地图已经留下你的足迹！",
    "body": "还没拿过奖章的场馆，也许就是下一站。",
    "primaryAction": {
      "type": "open_passport",
      "label": "查看挑战进度"
    },
    "requires": {
      "exploredMin": 1
    },
    "priority": 10,
    "cooldownSec": 100
  },
  {
    "id": "map.jixue.progress",
    "event": "map_open",
    "kind": "tip",
    "speaker": "jixue",
    "mood": "happy",
    "title": "你的小护照越来越热闹啦。",
    "body": "换一类地点看看，故事会更丰富。",
    "primaryAction": {
      "type": "open_passport",
      "label": "查看我的护照"
    },
    "requires": {
      "exploredMin": 1
    },
    "priority": 10,
    "cooldownSec": 100
  },
  {
    "id": "map.jibing.wait",
    "event": "route_pause",
    "kind": "bubble",
    "speaker": "jibing",
    "mood": "idle",
    "title": "中场休息也算战术！",
    "body": "路线已经暂停，准备好了再继续。",
    "primaryAction": {
      "type": "open_route",
      "label": "继续路线"
    },
    "priority": 12
  },
  {
    "id": "map.jixue.wait",
    "event": "route_pause",
    "kind": "bubble",
    "speaker": "jixue",
    "mood": "idle",
    "title": "休息一下，风景还在。",
    "body": "你可以随时从当前进度继续漫游。",
    "primaryAction": {
      "type": "open_route",
      "label": "打开路线"
    },
    "priority": 12
  },
  {
    "id": "route.duo.complete",
    "event": "route_complete",
    "kind": "celebration",
    "speaker": "duo",
    "mood": "happy",
    "title": "这一程，我们一起走完啦！",
    "lines": [
      {
        "speaker": "jixue",
        "mood": "happy",
        "text": "每一站都变成你的城市记忆。"
      },
      {
        "speaker": "jibing",
        "mood": "happy",
        "text": "下一条路线，来点新的挑战！"
      }
    ],
    "primaryAction": {
      "type": "open_passport",
      "label": "看看收获"
    },
    "priority": 52,
    "once": "session"
  },
  {
    "id": "passport.duo.first",
    "event": "passport_first",
    "kind": "story",
    "speaker": "duo",
    "mood": "happy",
    "title": "你的冰雪护照开张啦！",
    "lines": [
      {
        "speaker": "jixue",
        "mood": "point",
        "text": "地点印章记录走过的地方。"
      },
      {
        "speaker": "jibing",
        "mood": "happy",
        "text": "场馆奖章要靠挑战赢得！"
      },
      {
        "speaker": "jixue",
        "mood": "idle",
        "text": "跨地点任务也在这里等你领取。"
      }
    ],
    "primaryAction": {
      "type": "open_passport",
      "label": "查看护照"
    },
    "priority": 18,
    "once": "ever"
  },
  {
    "id": "passport.jibing.no_medal",
    "event": "passport_open",
    "kind": "mission",
    "speaker": "jibing",
    "mood": "point",
    "title": "奖章栏还空着？",
    "body": "去一个场馆完成挑战，试着点亮第一枚。",
    "primaryAction": {
      "type": "open_route",
      "label": "寻找场馆"
    },
    "requires": {
      "medalsMax": 0
    },
    "priority": 19
  },
  {
    "id": "passport.jixue.incomplete",
    "event": "passport_open",
    "kind": "mission",
    "speaker": "jixue",
    "mood": "point",
    "title": "手记还没有读完呢。",
    "body": "挑一个没去过的地点，看看新的故事。",
    "primaryAction": {
      "type": "open_route",
      "label": "寻找新地点"
    },
    "requires": {
      "exploredMax": 15
    },
    "priority": 14
  },
  {
    "id": "passport.jibing.milestone",
    "event": "medal_first",
    "kind": "celebration",
    "speaker": "jibing",
    "mood": "happy",
    "title": "第一枚场馆奖章，稳稳拿下！",
    "body": "你已经证明自己能闯过冰雪挑战。",
    "primaryAction": {
      "type": "open_passport",
      "label": "收进护照"
    },
    "priority": 82,
    "once": "ever"
  },
  {
    "id": "passport.jixue.milestone",
    "event": "explore_milestone",
    "kind": "celebration",
    "speaker": "jixue",
    "mood": "happy",
    "title": "又一段冬日记忆加入收藏！",
    "body": "回到护照看看，下一段旅程在哪里。",
    "primaryAction": {
      "type": "open_passport",
      "label": "查看足迹"
    },
    "priority": 45,
    "cooldownSec": 90
  },
  {
    "id": "passport.duo.complete",
    "event": "all_places_explored",
    "kind": "celebration",
    "speaker": "duo",
    "mood": "surprised",
    "title": "16 枚地点印章，全部集齐！",
    "lines": [
      {
        "speaker": "jixue",
        "mood": "happy",
        "text": "这张地图上的故事，被你一页页翻完了。"
      },
      {
        "speaker": "jibing",
        "mood": "happy",
        "text": "场馆成绩还能继续刷新，冠军之路没结束！"
      }
    ],
    "primaryAction": {
      "type": "open_passport",
      "label": "查看完整护照"
    },
    "priority": 100,
    "once": "ever"
  },
  {
    "id": "secret.jibing.hint",
    "event": "secret_hint",
    "kind": "mystery",
    "speaker": "jibing",
    "mood": "thinking",
    "title": "听说工坊还藏着惊喜……",
    "body": "有些特殊造型只有随机灵感才可能遇见。",
    "primaryAction": {
      "type": "open_workshop",
      "label": "去工坊看看"
    },
    "priority": 8,
    "cooldownSec": 600
  },
  {
    "id": "secret.jixue.hint",
    "event": "secret_hint",
    "kind": "mystery",
    "speaker": "jixue",
    "mood": "thinking",
    "title": "雪花里好像藏着一份神秘礼物。",
    "body": "隐藏造型是否出现由生成规则决定，不是多按几次就必得哦。",
    "primaryAction": {
      "type": "open_workshop",
      "label": "看看随机造型"
    },
    "priority": 8,
    "cooldownSec": 600
  },
  {
    "id": "secret.duo.unlock",
    "event": "secret_unlocked",
    "kind": "celebration",
    "speaker": "duo",
    "mood": "surprised",
    "title": "哇！你遇见隐藏款了！",
    "lines": [
      {
        "speaker": "jibing",
        "mood": "surprised",
        "text": "这是什么神仙运气！"
      },
      {
        "speaker": "jixue",
        "mood": "happy",
        "text": "快保存下来，让这份冬日惊喜留下纪念。"
      }
    ],
    "primaryAction": {
      "type": "open_secret_collection",
      "label": "查看珍藏图鉴"
    },
    "priority": 95,
    "once": "session"
  },
  {
    "id": "misc.jibing.back",
    "event": "return_from_game",
    "kind": "bubble",
    "speaker": "jibing",
    "mood": "idle",
    "title": "这一局先告一段落。",
    "body": "下一站要不要换一项运动试试？",
    "primaryAction": {
      "type": "open_route",
      "label": "挑选新场馆"
    },
    "priority": 5
  },
  {
    "id": "misc.jixue.back",
    "event": "return_from_game",
    "kind": "bubble",
    "speaker": "jixue",
    "mood": "idle",
    "title": "比赛结束，故事继续。",
    "body": "离开赛场后，也可以去看看附近的城市手记。",
    "primaryAction": {
      "type": "open_route",
      "label": "看看路线"
    },
    "priority": 5
  },
  {
    "id": "display.duo.watch",
    "event": "display_open",
    "kind": "tip",
    "speaker": "duo",
    "mood": "happy",
    "title": "大屏记录大家的虚拟到达足迹。",
    "body": "现阶段统计不是实时在线人数；等多人在线功能上线后，再展示玩家角色。",
    "primaryAction": {
      "type": "open_map",
      "label": "返回我的地图"
    },
    "priority": 8
  }
];
