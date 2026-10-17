const data = [
{ question:'短道速滑运动员在弯道上为什么会明显倾斜身体？', options:['利用向心力保持弯道速度','让冰刀减少与冰面的接触','降低风阻并缩短直线距离','避免和队友发生碰撞'], answer:0, explanation:'弯道高速滑行需要向心力，运动员通过倾斜身体和冰刀建立平衡。', sourceId:'wuhuan' },
{ question:'净月潭滑雪场对应哪类赛事项目？', options:['越野滑雪与滑雪定向','冰壶与冰球','短道速滑与花样滑冰','高山滑雪回转'], answer:0, explanation:'净月潭的林地雪道适合越野滑雪、残疾人越野滑雪和滑雪定向。', sourceId:'jingyue' },
{ question:'冰壶比赛中，队友在冰壶前方刷冰主要有什么作用？', options:['减缓冰壶旋转','改变冰面的摩擦，帮助控制滑行距离和线路','让冰壶跳过场上的其他壶','增加冰壶的重量'], answer:1, explanation:'刷冰会改变冰面摩擦状态，让冰壶滑得更远，也能微调线路。', sourceId:'cityhall' },
{ question:'哪处场馆承担本届赛事的冰球比赛？', options:['长春市滑冰馆','五环体育馆','吉林省滑冰馆','长春奥林匹克公园体育馆'], answer:2, explanation:'吉林省滑冰馆承担冰球项目赛事。', sourceId:'provhall' },
{ question:'长影旧址博物馆位于什么地方？', options:['长春电影制片厂原址','净月潭湖岸','伪满皇宫旧址','南湖公园内'], answer:0, explanation:'长影旧址博物馆设在长春电影制片厂原址，以老建筑与电影资料呈现电影记忆。', sourceId:'film' },
{ question:'空中技巧运动员起跳前最重要的速度从哪里获得？', options:['落地区的下坡','连续转弯','助滑道加速','空中摆臂'], answer:2, explanation:'运动员沿助滑道积累速度，再通过跳台起跳进入腾空动作。', sourceId:'lianhua' },
{ question:'速度滑冰的长距离比赛中，运动员通常如何安排体力？', options:['全程保持最高冲刺速度','直道与弯道保持相同姿势并停止摆臂','前半程完全滑行，最后才开始蹬冰','稳定滑行节奏，并在合适时机加速'], answer:3, explanation:'速度滑冰需要兼顾稳定步频、弯道技术和最后冲刺，合理分配体力。', sourceId:'speed' },
{ question:'长春的“这有山”最有辨识度的空间特色是什么？', options:['沿室内起伏步道组织店铺和休闲空间','大型露天滑雪跳台','电影拍摄摄影棚','围绕湖面修建的环形冰道'], answer:0, explanation:'“这有山”把山地步道与多层店铺结合，形成室内山城空间。', sourceId:'mountainmall' },
{ question:'伪满皇宫博物院的参观内容主要与什么有关？', options:['长春电影工业发展','冰壶器材演变','伪满时期历史及相关建筑遗址','吉林省森林生态'], answer:2, explanation:'博物院以宫廷遗址、建筑和史料呈现伪满时期的历史。', sourceId:'palace' },
{ question:'松花湖与北大湖滑雪场所在的分赛区城市是？', options:['延吉市','吉林市','长春市','四平市'], answer:1, explanation:'松花湖和北大湖两座滑雪场都位于吉林市分赛区。', sourceId:'songhuahu' },
{ question:'短道速滑比赛中，运动员为什么要频繁寻找超越机会？', options:['因为比赛只在直道上进行','因为每圈必须更换冰刀','因为赛道会自动变窄','因为运动员在同一条短赛道上争夺位置'], answer:3, explanation:'短道速滑是多人同场竞速，位置和超越时机直接影响比赛结果。', sourceId:'wuhuan' },
{ question:'南湖公园适合和哪种游览方式结合？', options:['湖岸步行与城市街区漫游','室内冰球训练','电影特效体验','高山滑雪竞速'], answer:0, explanation:'南湖公园是城市湖畔休闲节点，适合步道漫游并串联周边街区。', sourceId:'nanhu' },
{ question:'雪上项目中的U型场地，运动员借助什么获得连续腾空？', options:['冰壶刷冰','场地两侧弧形坡面','短道速滑弯道','平地上的助跑带'], answer:1, explanation:'运动员在U型池两侧弧面间滑行，利用坡面完成腾空和动作。', sourceId:'beidahu' },
{ question:'长影世纪城与长影旧址博物馆的体验侧重点有什么不同？', options:['前者以冰雪比赛为主，后者以自然徒步为主','两处都是滑雪场','前者偏主题互动体验，后者讲述电影生产历史','前者是历史宫殿，后者是湖畔公园'], answer:2, explanation:'长影世纪城侧重主题场景和互动，旧址博物馆则呈现电影厂历史与制作记忆。', sourceId:'century' },
{ question:'越野滑雪和高山滑雪最直观的赛道差异是什么？', options:['越野滑雪沿起伏路线持续滑行，高山滑雪主要沿陡坡下滑','越野滑雪只能在室内进行','高山滑雪需要冰壶','二者都只在平直冰面上比赛'], answer:0, explanation:'越野滑雪沿较长的起伏路线滑行，考验耐力；高山滑雪主要沿山坡高速下滑。', sourceId:'jingyue' },
];
export const QUIZ_QUESTIONS = data;

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createQuizSession(questions = QUIZ_QUESTIONS, random = Math.random, roundSize = 5) {
  const round = shuffled(questions, random).slice(0, Math.max(1, Math.min(roundSize, questions.length))).map((question) => {
    const options = shuffled(question.options.map((label, index) => ({ label, correct: index === question.answer })), random);
    return { ...question, options: options.map((option) => option.label), answer: options.findIndex((option) => option.correct) };
  });
  let index = 0;
  let score = 0;
  let answer = null;
  let finished = false;

  return {
    get state() { return { index, score, answer, finished, total: round.length }; },
    choose(optionIndex) {
      if (finished || answer || index >= round.length) return null;
      const question = round[index];
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) return null;
      const correct = optionIndex === question.answer;
      if (correct) score += 1;
      answer = { optionIndex, correct, explanation: question.explanation };
      return answer;
    },
    next() {
      if (!answer || finished) return false;
      index += 1;
      answer = null;
      if (index >= round.length) { finished = true; return false; }
      return true;
    },
    get question() { return round[index] || null; },
  };
}
