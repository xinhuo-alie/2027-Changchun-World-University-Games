/** 严格映射现有 web/quests.js 的 6 个任务 ID；仅为引导，不创建新领奖状态。 */
export const MISSION_DIALOGUES = {
  "explore-first": {
    "questId": "explore-first",
    "title": "赛场遇见城市",
    "jibing": {
      "title": "任务：赛场遇见城市",
      "body": "这一段旅程要跨过赛场与城市历史，三枚地点印章等你收集。",
      "mood": "point"
    },
    "jixue": {
      "title": "故事任务：赛场遇见城市",
      "body": "运动场馆只是起点，后面还有城市的时间故事。",
      "mood": "idle"
    },
    "action": {
      "type": "open_passport",
      "label": "去看看路线"
    }
  },
  "explore-winter": {
    "questId": "explore-winter",
    "title": "从雪道到湖畔",
    "jibing": {
      "title": "任务：从雪道到湖畔",
      "body": "先去雪场，再把冬日城市的足迹补齐。",
      "mood": "point"
    },
    "jixue": {
      "title": "故事任务：从雪道到湖畔",
      "body": "雪道、湖畔和广场，串起来像一张冬天的明信片。",
      "mood": "idle"
    },
    "action": {
      "type": "open_passport",
      "label": "继续探索"
    }
  },
  "sport-speed": {
    "questId": "sport-speed",
    "title": "冰上速度双章",
    "jibing": {
      "title": "任务：冰上速度双章",
      "body": "两枚冰上奖章，挑战节奏与速度！",
      "mood": "point"
    },
    "jixue": {
      "title": "故事任务：冰上速度双章",
      "body": "同样是冰面，速度的故事可以有很多种。",
      "mood": "idle"
    },
    "action": {
      "type": "open_passport",
      "label": "前往挑战"
    }
  },
  "sport-skill": {
    "questId": "sport-skill",
    "title": "冰面技巧双章",
    "jibing": {
      "title": "任务：冰面技巧双章",
      "body": "冰壶和冰球，一个拼判断，一个拼果断！",
      "mood": "point"
    },
    "jixue": {
      "title": "故事任务：冰面技巧双章",
      "body": "两种运动，两种不同的技巧观察。",
      "mood": "idle"
    },
    "action": {
      "type": "open_passport",
      "label": "挑战下一场"
    }
  },
  "story-film": {
    "questId": "story-film",
    "title": "长春的电影记忆",
    "jibing": {
      "title": "任务：长春的电影记忆",
      "body": "电影主题任务来了，先读手记，再挑战知识题。",
      "mood": "point"
    },
    "jixue": {
      "title": "故事任务：长春的电影记忆",
      "body": "从长影旧址到世纪城，把光影的故事串起来。",
      "mood": "idle"
    },
    "action": {
      "type": "open_passport",
      "label": "读一段故事"
    }
  },
  "story-snow": {
    "questId": "story-snow",
    "title": "读懂冰雪赛场",
    "jibing": {
      "title": "任务：读懂冰雪赛场",
      "body": "先了解场馆，再挑战自己理解的冰雪知识。",
      "mood": "point"
    },
    "jixue": {
      "title": "故事任务：读懂冰雪赛场",
      "body": "手记能让雪道与冰面都有更丰富的故事。",
      "mood": "idle"
    },
    "action": {
      "type": "open_passport",
      "label": "阅读相关手记"
    }
  },
  "explore-snow-cities": {
    "questId": "explore-snow-cities",
    "title": "双城雪迹",
    "jibing": { "title": "任务：双城雪迹", "body": "松花湖、北大湖和雕塑园，三处足迹串起两座城市。", "mood": "point" },
    "jixue": { "title": "故事任务：双城雪迹", "body": "从雪道走到城市公园，看看冬日风景怎样变化。", "mood": "idle" },
    "action": { "type": "open_passport", "label": "查看任务进度" }
  },
  "story-city-parks": {
    "questId": "story-city-parks",
    "title": "城市里的冬日风景",
    "jibing": { "title": "任务：城市里的冬日风景", "body": "读完三处城市手记，再用一道知识题完成记录。", "mood": "point" },
    "jixue": { "title": "故事任务：城市里的冬日风景", "body": "南湖、文化广场和雕塑园，慢慢把城市的冬日细节收进手册。", "mood": "idle" },
    "action": { "type": "open_passport", "label": "查看任务进度" }
  }
};
