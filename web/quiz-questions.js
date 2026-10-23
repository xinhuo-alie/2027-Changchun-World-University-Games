const data = [
{ question:'短道速滑运动员在弯道上为什么会明显倾斜身体？', options:['利用向心力保持弯道速度','让冰刀减少与冰面的接触','降低风阻并缩短直线距离','避免和队友发生碰撞'], answer:0, explanation:'弯道高速滑行需要向心力，运动员通过倾斜身体和冰刀建立平衡。', sourceId:'wuhuan' },
{ question:'净月潭滑雪场对应哪类赛事项目？', options:['越野滑雪与滑雪定向','冰壶与冰球','短道速滑与花样滑冰','高山滑雪回转'], answer:0, explanation:'净月潭的林地雪道适合越野滑雪、残疾人越野滑雪和滑雪定向。', sourceId:'jingyue' },
{ question:'冰壶比赛中，队友在冰壶前方刷冰主要有什么作用？', options:['减缓冰壶旋转','改变冰面的摩擦，帮助控制滑行距离和线路','让冰壶跳过场上的其他壶','增加冰壶的重量'], answer:1, explanation:'刷冰会改变冰面摩擦状态，让冰壶滑得更远，也能微调线路。', sourceId:'cityhall' },
{ question:'哪处场馆承担本届赛事的冰球比赛？', options:['长春市滑冰馆','五环体育馆','吉林省滑冰馆','长春奥林匹克公园体育馆'], answer:2, explanation:'吉林省滑冰馆承担冰球项目赛事。', sourceId:'provhall' },
{ question:'长影旧址博物馆位于什么地方？', options:['长春电影制片厂原址','净月潭湖岸','伪满皇宫旧址','南湖公园内'], answer:0, explanation:'长影旧址博物馆设在长春电影制片厂原址，以老建筑与电影资料呈现电影记忆。', sourceId:'film' },
{ question:'空中技巧运动员起跳前最重要的速度从哪里获得？', options:['落地区的下坡','连续转弯','助滑道加速','空中摆臂'], answer:2, explanation:'运动员沿助滑道积累速度，再通过跳台起跳进入腾空动作。', sourceId:'lianhua' },
{ question:'速度滑冰长距离比赛中，运动员把手臂放在背后主要是为了什么？', options:['让比赛计时暂停','方便与其他运动员交接','增加冰刀与冰面的摩擦','减少空气阻力并节省体力'], answer:3, explanation:'长距离速滑中，运动员可把一只或两只手臂放在背后，以改善空气动力姿态并节省体力。', sourceId:'speed' },
{ question:'长春的“这有山”最有辨识度的空间特色是什么？', options:['沿室内起伏步道组织店铺和休闲空间','大型露天滑雪跳台','电影拍摄摄影棚','围绕湖面修建的环形冰道'], answer:0, explanation:'“这有山”把山地步道与多层店铺结合，形成室内山城空间。', sourceId:'mountainmall' },
{ question:'伪满皇宫博物院的参观内容主要与什么有关？', options:['长春电影工业发展','冰壶器材演变','伪满时期历史及相关建筑遗址','吉林省森林生态'], answer:2, explanation:'博物院以宫廷遗址、建筑和史料呈现伪满时期的历史。', sourceId:'palace' },
{ question:'松花湖与北大湖滑雪场所在的分赛区城市是？', options:['延吉市','吉林市','长春市','四平市'], answer:1, explanation:'松花湖和北大湖两座滑雪场都位于吉林市分赛区。', sourceId:'songhuahu' },
{ question:'短道速滑比赛中，运动员为什么要频繁寻找超越机会？', options:['因为比赛只在直道上进行','因为每圈必须更换冰刀','因为赛道会自动变窄','因为运动员在同一条短赛道上争夺位置'], answer:3, explanation:'短道速滑是多人同场竞速，位置和超越时机直接影响比赛结果。', sourceId:'wuhuan' },
{ question:'南湖公园适合和哪种游览方式结合？', options:['湖岸步行与城市街区漫游','室内冰球训练','电影特效体验','高山滑雪竞速'], answer:0, explanation:'南湖公园是城市湖畔休闲节点，适合步道漫游并串联周边街区。', sourceId:'nanhu' },
{ question:'雪上项目中的U型场地，运动员借助什么获得连续腾空？', options:['冰壶刷冰','场地两侧弧形坡面','短道速滑弯道','平地上的助跑带'], answer:1, explanation:'运动员在U型池两侧弧面间滑行，利用坡面完成腾空和动作。', sourceId:'beidahu' },
{ question:'长影世纪城主要提供哪种游览体验？', options:['冰雪竞赛训练','自然保护区徒步','电影主题场景与互动游乐','古代宫殿遗址参观'], answer:2, explanation:'长影世纪城以电影为主题，结合场景、演艺和互动项目供游客体验。', sourceId:'century' },
{ question:'越野滑雪比赛的赛道通常包含哪些地形？', options:['上坡、起伏路段和下坡','只能在室内平地进行','全程为陡峭的单向下坡','只在平直冰面上进行'], answer:0, explanation:'越野滑雪赛道由爬坡、起伏地形和下坡等路段构成，考验耐力与技术。', sourceId:'jingyue' },
];

// Each answer points to evidence for that question. sourceId still identifies the
// associated map stop for progress and rewards; a venue page cannot explain a sport rule.
const references = [
  ['https://library.olympics.com/digitalCollection/DigitalCollectionAttachmentDownloadHandler.ashx?documentId=2953969&parentDocumentId=58159&skipCopyright=true&skipWatermark=true', '奥林匹克图书馆 · 短道速滑技术'],
  ['https://news.cnjiwang.com/jlxwdt/sn/202609/4082084.html', '中国吉林网 · 大冬会场馆与项目'],
  ['https://worldcurling.org/about/curling/', '世界冰壶联合会 · 冰壶规则'],
  ['https://news.cnjiwang.com/jlxwdt/sn/202609/4082084.html', '中国吉林网 · 大冬会场馆与项目'],
  ['https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/jdyjhsdjy/202505/t20250523_9238772.html', '吉林省文旅厅 · 长影旧址博物馆'],
  ['https://www.fis-ski.com/freestyle/news/moguls-aerials-2025-26/aerials-101-understanding-aerials-and-aerials-mixed-team', '国际雪联 · 空中技巧入门'],
  ['https://library.olympics.com/digitalCollection/DigitalCollectionAttachmentDownloadHandler.ashx?documentId=2953969&parentDocumentId=58159&skipCopyright=true&skipWatermark=true', '奥林匹克图书馆 · 速度滑冰技术'],
  ['https://jldrc.jl.gov.cn/fgdt/jldt/202609/t20260923_3672215.html', '吉林省发改委 · 这有山'],
  ['https://dfz.jl.gov.cn/ybjl/201805/t20180502_5217176.html', '吉林省地方志 · 伪满皇宫博物院'],
  ['https://news.cnjiwang.com/jwyc/202610/4087753.html', '中国吉林网 · 吉林市分赛区'],
  ['https://elearning.isu.org/', '国际滑联 · 短道速滑入门'],
  ['https://www.jlairports.com/changchun/contents/162/253.html', '长春机场 · 南湖公园'],
  ['https://assets.fis-ski.com/f/252177/7c81eac52f/fis_sb_fk-judgeshandbook_update_spring-2022.pdf', '国际雪联 · U 型场地术语'],
  ['https://www.changying.com/', '长影世纪城官网'],
  ['https://assets.fis-ski.com/f/252177/e7f91d3ca4/icr_nc_23-24_e_clean.pdf', '国际雪联 · 越野滑雪赛道规则'],
];
export const QUIZ_QUESTIONS = data.map((question, index) => ({
  ...question, sourceUrl: references[index][0], sourceTitle: references[index][1],
}));

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createQuizSession(questions = QUIZ_QUESTIONS, random = Math.random, roundSize = 5, focusSourceIds = []) {
  const size = Math.max(1, Math.min(roundSize, questions.length));
  const focused = new Set(focusSourceIds);
  const preferred = focused.size ? shuffled(questions.filter((question) => focused.has(question.sourceId)), random)[0] : null;
  const pool = shuffled(questions.filter((question) => question !== preferred), random).slice(0, size - Number(Boolean(preferred)));
  const round = shuffled(preferred ? [preferred, ...pool] : pool, random).map((question) => {
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
