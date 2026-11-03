const VIEWED_KEY='cc2027:secret-gallery-viewed:v1';

export function secretRank(count) {
  if(count>=10)return '秘藏大师';
  if(count>=8)return '传说追寻者';
  if(count>=5)return '雪域寻宝者';
  if(count>=2)return '奇遇收藏家';
  return '初入秘藏';
}

export function secretMilestone(count) {
  return ({1:'初见奇遇！第一款隐藏角色已入藏。',3:'三款秘藏集结，收藏家之路开始发光。',5:'五重秘藏达成，你已成为雪域寻宝者。',8:'八款珍藏到手，传说已经近在眼前。',10:'图鉴圆满！十款秘藏已全部集齐。'})[count]||null;
}

export function secretAchievements(ownedIds,secrets) {
  const owned=new Set(ownedIds);
  const count=secrets.filter((item)=>owned.has(item.id)).length;
  const legendary=secrets.some((item)=>item.rarity==='legendary'&&owned.has(item.id));
  return [
    {id:'first',title:'初见奇遇',hint:'首次解锁任意隐藏角色',done:count>=1},
    {id:'double',title:'双星闪耀',hint:'解锁任意 2 款',done:count>=2},
    {id:'five',title:'五重秘藏',hint:'解锁 5 款',done:count>=5},
    {id:'legendary',title:'传说降临',hint:'解锁 1 款传说角色',done:legendary},
    {id:'complete',title:'图鉴圆满',hint:'集齐全部 10 款',done:count>=10},
  ];
}

function viewedIds() {
  try { const value=JSON.parse(localStorage.getItem(VIEWED_KEY)||'[]'); return new Set(Array.isArray(value)?value:[]); }
  catch { return new Set(); }
}
function markViewed(id,viewed) {
  viewed.add(id);
  try { localStorage.setItem(VIEWED_KEY,JSON.stringify([...viewed])); } catch { /* optional state */ }
}
function node(tag,className,text) {
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
}

export function renderSecretGallery({collection,secrets,legacySecrets=[],onWorkshop,onClose}) {
  const owned=new Map(collection.items.map((item)=>[item.id,item]));
  const viewed=viewedIds();
  const count=secrets.filter((item)=>owned.has(item.id)).length;
  const recent=[...secrets].filter((item)=>owned.has(item.id)).sort((a,b)=>Date.parse(owned.get(b.id).discoveredAt||0)-Date.parse(owned.get(a.id).discoveredAt||0))[0];
  const section=node('section','guide-secret-collection');
  section.id='secretCollection';
  section.setAttribute('aria-labelledby','secretGalleryTitle');

  const hero=node('header','secret-gallery-hero');
  const heroCopy=node('div','secret-gallery-heading');
  heroCopy.append(node('span','secret-gallery-kicker','YOUR AVATAR · RARE ARCHIVE'));
  const title=node('h2','','雪域隐藏款收藏馆'); title.id='secretGalleryTitle';
  heroCopy.append(title,node('p','', '收集极少现身的雪域伙伴，解锁只属于你的秘藏图鉴。'));
  if(recent)heroCopy.append(node('small','secret-gallery-latest',`最近发现 · ${recent.title}`));
  const score=node('div','secret-gallery-score');
  const ring=node('div','secret-gallery-ring'); ring.style.setProperty('--secret-progress',`${Math.round(count/10*100)}%`);
  ring.setAttribute('role','img'); ring.setAttribute('aria-label',`已解锁 ${count} / 10 款隐藏角色`);
  const number=node('strong','',String(count)); number.append(document.createTextNode(' / 10'));
  ring.append(number); score.append(ring,node('b','',secretRank(count)),node('small','',`${Math.round(count/10*100)}% 已收录`));
  hero.append(heroCopy,score); section.append(hero);

  const tips=node('div','secret-gallery-tips');
  tips.append(node('p','',`隐藏角色仅在正式生成时以 ${Math.round(.05*100)}% 基础概率现身；传说级出现概率更低。`));
  tips.append(node('p','', '重复获得不会重复计数，每款首次发现时间与灵感号会保存在本机。'));
  section.append(tips);

  const layout=node('div','secret-gallery-layout');
  const grid=node('div','guide-secret-grid secret-gallery-grid'); grid.setAttribute('role','list');
  const detail=node('aside','secret-gallery-detail'); detail.setAttribute('aria-live','polite');
  const detailEmpty=()=>{detail.replaceChildren(node('span','secret-gallery-kicker','ARCHIVE FILE'),node('h3','','选择一张档案卡'),node('p','', '点选已发现的伙伴查看故事，或打开未知档案继续探索。'));};
  detailEmpty();
  let selectedId=recent?.id||secrets[0]?.id;

  function showDetail(secret,{markAsViewed=false}={}) {
    const record=owned.get(secret.id);
    if(markAsViewed){
      markViewed(secret.id,viewed);
      const card=grid.querySelector(`[data-secret-id="${CSS.escape(secret.id)}"]`);
      card?.classList.remove('is-new');
      card?.querySelector('.secret-gallery-new')?.remove();
    }
    detail.replaceChildren();
    detail.classList.toggle('is-legendary',secret.rarity==='legendary');
    detail.append(node('span','secret-gallery-kicker',record?'ARCHIVE FILE · DISCOVERED':'ARCHIVE FILE · UNKNOWN'));
    const media=node('div','secret-gallery-art');
    if(record?.artworkUrl){
      const img=document.createElement('img'); img.src=record.artworkUrl; img.alt=`${secret.title}角色作品`;
      img.addEventListener('error',()=>{img.remove();media.classList.add('is-unavailable');media.append(node('span','',secret.title.slice(0,1)));},{once:true});
      media.append(img);
    } else media.append(node('span','',record?secret.title.slice(0,1):'?'));
    detail.append(media);
    if(record){
      detail.append(node('span',`secret-gallery-rarity rarity-${secret.rarity}`,secret.rarity==='legendary'?'LEGENDARY':secret.rarity.toUpperCase()));
      detail.append(node('h3','',secret.title),node('p','secret-gallery-lore',secret.lore),node('p','secret-gallery-tagline',`“${secret.tagline}”`));
      const tags=node('div','secret-gallery-tags'); secret.tags.forEach((tag)=>tags.append(node('span','',tag))); detail.append(tags);
      const date=record.discoveredAt?new Date(record.discoveredAt).toLocaleString('zh-CN'):'旧版本收藏';
      detail.append(node('small','secret-gallery-record',`首次发现 · ${date}`));
      if(Number.isFinite(record.seed))detail.append(node('small','secret-gallery-record',`灵感号 · ${record.seed}`));
    }else{
      detail.append(node('span','secret-gallery-rarity is-unknown','稀有度 · 未知'),node('h3','','未知档案'),node('p','secret-gallery-lore',secret.silhouetteHint),node('p','secret-gallery-tagline','继续创造角色，让下一次灵感带你遇见它。'));
    }
  }

  for(const secret of secrets){
    const record=owned.get(secret.id);
    const card=node('button',`guide-secret-card secret-gallery-card rarity-${secret.rarity}`);
    card.type='button'; card.setAttribute('role','listitem'); card.dataset.secretId=secret.id;
    card.setAttribute('aria-label',record?`${secret.title}，已发现`:`未知档案，${secret.silhouetteHint}`);
    if(secret.id===recent?.id)card.classList.add('is-latest');
    if(record&&!viewed.has(secret.id)){card.classList.add('is-new');card.append(node('span','secret-gallery-new','NEW'));}
    const art=node('span','secret-gallery-card-art');
    if(record?.artworkUrl){
      const img=document.createElement('img'); img.src=record.artworkUrl; img.alt=''; img.loading='lazy';
      img.addEventListener('error',()=>{img.remove();art.textContent='✦';},{once:true}); art.append(img);
    }else art.append(node('span','secret-gallery-silhouette',record?secret.title.slice(0,1):'?'));
    card.append(art,node('span','secret-gallery-card-rarity',record?(secret.rarity==='legendary'?'LEGENDARY':secret.rarity.toUpperCase()):'未发现'));
    card.append(node('b','',record?secret.title:'未知档案'));
    card.append(node('small','',record?secret.tagline:secret.silhouetteHint));
    card.addEventListener('click',()=>{selectedId=secret.id;grid.querySelectorAll('.is-selected').forEach((item)=>item.classList.remove('is-selected'));card.classList.add('is-selected');showDetail(secret,{markAsViewed:true});});
    grid.append(card);
  }
  layout.append(grid,detail); section.append(layout);

  const achievements=node('section','secret-gallery-achievements');
  achievements.append(node('h3','','收藏成就'));
  const achievementGrid=node('div','secret-achievement-grid');
  for(const achievement of secretAchievements([...owned.keys()],secrets)){
    const item=node('article',achievement.done?'is-earned':'');
    item.append(node('b','',achievement.title),node('small','',achievement.hint));
    achievementGrid.append(item);
  }
  achievements.append(achievementGrid); section.append(achievements);

  const legacyById=new Map(legacySecrets.map((item)=>[item.id,item]));
  const legacyItems=collection.items.filter((item)=>legacyById.has(item.id));
  if(legacyItems.length){
    const archive=node('section','secret-gallery-legacy');
    archive.append(node('h3','','旧版图鉴珍藏'),node('p','',`保留了 ${legacyItems.length} 款旧版角色记录，继续展示原作品与首次发现信息。`));
    const archiveGrid=node('div','secret-legacy-grid');
    for(const record of legacyItems){
      const secret=legacyById.get(record.id);
      const card=node('article','secret-legacy-card');
      if(record.artworkUrl){const img=document.createElement('img');img.src=record.artworkUrl;img.alt=`${record.title||secret.title}角色作品`;img.loading='lazy';img.addEventListener('error',()=>img.remove(),{once:true});card.append(img);}
      card.append(node('b','',record.title||secret.title),node('small','',record.discoveredAt?`发现于 ${new Date(record.discoveredAt).toLocaleDateString('zh-CN')}`:'旧版收藏'));
      if(Number.isFinite(record.seed))card.append(node('small','',`灵感号 · ${record.seed}`));
      archiveGrid.append(card);
    }
    archive.append(archiveGrid);section.append(archive);
  }

  const footer=node('footer','secret-gallery-footer');
  footer.append(node('p','',count===10?'十款秘藏已经齐聚，收藏馆因你而完整。':'继续创造新的角色，下一位隐藏款或许就在下一次出现。'));
  const actions=node('div','guide-actions');
  const create=node('button','','继续去角色工坊'); create.type='button'; create.className='guide-primary'; create.addEventListener('click',onWorkshop);
  const surprise=node('button','','再试一次随机惊喜'); surprise.type='button'; surprise.addEventListener('click',onWorkshop);
  const close=node('button','','返回护照'); close.type='button'; close.addEventListener('click',onClose);
  actions.append(create,surprise,close); footer.append(actions); section.append(footer);
  if(selectedId){const selected=secrets.find((item)=>item.id===selectedId);if(selected){const card=grid.querySelector(`[data-secret-id="${CSS.escape(selectedId)}"]`);card?.classList.add('is-selected');showDetail(selected);}}
  return section;
}
