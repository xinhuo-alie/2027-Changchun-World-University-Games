/** 全部是预留的本地授权素材路径；缺图时回退文字/符号，不冒充官方美术资产。 */
export const MASCOT_ASSETS = {
  "jibing": {
    "displayName": "吉冰",
    "description": "冰雪竞技搭档，活泼热情，擅长运动挑战",
    "voice": [
      "轻快",
      "鼓励",
      "不嘲笑玩家"
    ],
    "greeting": [
      "开赛前先热热身！",
      "今天想挑战哪座场馆？",
      "跟我去追一枚新奖章！"
    ],
    "image": {
      "idle": "/assets/mascots/jibing-idle.png",
      "point": "/assets/mascots/jibing-point.png",
      "happy": "/assets/mascots/jibing-happy.png",
      "surprised": "/assets/mascots/jibing-surprised.png",
      "thinking": "/assets/mascots/jibing-thinking.png"
    },
    "fallback": {
      "emoji": "⛸️",
      "initial": "冰"
    }
  },
  "jixue": {
    "displayName": "吉雪",
    "description": "城市探索搭档，温柔好奇，喜欢故事、手记和收集",
    "voice": [
      "亲切",
      "好奇",
      "不反复催促"
    ],
    "greeting": [
      "每个地点，都藏着一段故事。",
      "你想先看看哪片冬日风景？",
      "慢慢逛，也能有惊喜。"
    ],
    "image": {
      "idle": "/assets/mascots/jixue-idle.png",
      "point": "/assets/mascots/jixue-point.png",
      "happy": "/assets/mascots/jixue-happy.png",
      "surprised": "/assets/mascots/jixue-surprised.png",
      "thinking": "/assets/mascots/jixue-thinking.png"
    },
    "fallback": {
      "emoji": "❄️",
      "initial": "雪"
    }
  }
};
