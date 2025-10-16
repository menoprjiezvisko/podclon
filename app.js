/* ================== app.js ================== */
// Core web app logic

const LS_KEY = 'podclone-subs';
const LAST_UPDATE_KEY = 'podclone-lastupdate';

let state = {
  subs: loadSubs(),
  episodes: {}, // map feedUrl -> episodes[]
  queue: [],
  current: null
};

// DOM refs
const navHome = document.getElementById('nav-home');
const navLibrary = document.getElementById('nav-library');
const navAdd = document.getElementById('nav-add');
const screens = {home: document.getElementById('home'), library: document.getElementById('library'), add: document.getElementById('add')};
const discoverList = document.getElementById('discover-list');
const subsList = document.getElementById('subs-list');
const manageList = document.getElementById('manage-list');
const downloadsList = document.getElementById('downloads-list');
const historyList = document.getElementById('history-list');
const addForm = document.getElementById('add-form');
const rssUrlInput = document.getElementById('rss-url');
const audio = document.getElementById('audio');
const playerModal = document.getElementById('player-modal');
const playBtn = document.getElementById('play-btn');
const miniTitle = document.getElementById('mini-title');
const miniSub = document.getElementById('mini-sub');
const miniArt = document.getElementById('mini-art');
const playerTitle = document.getElementById('player-title');
const playerDesc = document.getElementById('player-desc');
const playerArt = document.getElementById('player-art');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const queueList = document.getElementById('queue-list');

// nav
navHome.addEventListener('click', ()=>switchTo('home'));
navLibrary.addEventListener('click', ()=>switchTo('library'));
navAdd.addEventListener('click', ()=>switchTo('add'));

function switchTo(name){
  for(const k in screens) screens[k].classList.toggle('hidden', k!==name);
  [navHome,navLibrary,navAdd].forEach(b=>b.classList.remove('active'));
  if(name==='home') navHome.classList.add('active');
  if(name==='library') navLibrary.classList.add('active');
  if(name==='add') navAdd.classList.add('active');
}

// load subscriptions
function loadSubs(){
  try{const s = localStorage.getItem(LS_KEY); return s?JSON.parse(s):[];}catch(e){return []}
}

function saveSubs(){ localStorage.setItem(LS_KEY, JSON.stringify(state.subs)); }

// render
function render(){
  renderHome();
  renderSubs();
  renderManage();
  renderDownloads();
  renderHistory();
}

function renderHome(){
  discoverList.innerHTML = '';
  // gather latest episodes from subs
  const items = [];
  for(const sub of state.subs){
    const eps = state.episodes[sub.url] || [];
    for(const e of eps.slice(0,5)) items.push(Object.assign({}, e, {feedTitle: sub.title, feedUrl: sub.url}));
  }
  items.sort((a,b)=> new Date(b.pubDate) - new Date(a.pubDate));
  if(items.length===0) discoverList.innerHTML = '<div class="muted">Nižiadne epizódy. Pridaj RSS feed v Knižnici.</div>';
  for(const it of items){
    const c = document.createElement('div'); c.className='card';
    c.innerHTML = `<h4>${escapeHtml(it.title)}</h4><p class="muted">${it.feedTitle} • ${formatDate(it.pubDate)}</p><div class="meta"><span class="small">${formatDuration(it.duration)}</span><div><button data-action="play" data-id="${encodeURIComponent(it.id)}" data-feed="${encodeURIComponent(it.feedUrl)}">Prehrať</button> <button data-action="download" data-id="${encodeURIComponent(it.id)}" data-feed="${encodeURIComponent(it.feedUrl)}">⬇</button></div></div>`;
    discoverList.appendChild(c);
  }
}

function renderSubs(){
  subsList.innerHTML='';
  if(state.subs.length===0) subsList.innerHTML='<div class="muted">Žiadne odbery.</div>';
  for(const s of state.subs){
    const c = document.createElement('div'); c.className='card';
    c.innerHTML = `<h4>${escapeHtml(s.title)}</h4><p class="muted">${s.url}</p><div class="meta"><span class="small">${(state.episodes[s.url]||[]).length} epizód</span><div><button data-action="openFeed" data-feed="${encodeURIComponent(s.url)}">Otvoriť</button></div></div>`;
    subsList.appendChild(c);
  }
}

function renderManage(){
  manageList.innerHTML = '';
  for(const s of state.subs){
    const c = document.createElement('div'); c.className='card';
    c.innerHTML = `<h4>${escapeHtml(s.title)}</h4><p class="muted">${s.url}</p><div class="meta"><div><button data-action="refresh" data-feed="${encodeURIComponent(s.url)}">Aktualizovať</button> <button data-action="remove" data-feed="${encodeURIComponent(s.url)}">Odobrať</button></div></div>`;
    manageList.appendChild(c);
  }
}

async function renderDownloads(){
  downloadsList.innerHTML = '';
  const items = await IDB_HELPER.all();
  if(items.length===0) downloadsList.innerHTML='<div class="muted">Žiadne stiahnuté epizódy.</div>';
  for(const it of items){
    const c = document.createElement('div'); c.className='card';
    c.innerHTML = `<h4>${escapeHtml(it.title)}</h4><p class="muted">${it.feedTitle}</p><div class="meta"><div><button data-action="playLocal" data-id="${it.id}">Prehrať</button> <button data-action="deleteLocal" data-id="${it.id}">Vymazať</button></div></div>`;
    downloadsList.appendChild(c);
  }
}

function renderHistory(){
  const h = JSON.parse(localStorage.getItem('podclone-history')||'[]');
  historyList.innerHTML = '';
  if(h.length===0) historyList.innerHTML = '<div class="muted">História je prázdna.</div>';
  for(const it of h.slice().reverse()){
    const c = document.createElement('div'); c.className='card';
    c.innerHTML = `<h4>${escapeHtml(it.title)}</h4><p class="muted">${it.feedTitle} • ${formatDate(it.playedAt)}</p>`;
    historyList.appendChild(c);
  }
}

// helpers
function escapeHtml(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function formatDate(d){ if(!d) return ''; const dt = new Date(d); return dt.toLocaleString(); }
function formatDuration(d){ if(!d) return ''; return d; }

// add form
addForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const url = rssUrlInput.value.trim();
  if(!url) return;
  try{
    const feed = await fetchAndParseRss(url);
    const sub = {url, title: feed.title||url, autoUpdate: document.getElementById('auto-update').checked};
    state.subs.push(sub); saveSubs();
    state.episodes[url] = feed.items;
    render();
    rssUrlInput.value = '';
    alert('Pridané: '+sub.title);
  }catch(err){
    console.error(err);
    alert('Chyba pri sťahovaní feedu. Skontroluj CORS alebo URL.\n'+(err.message||err));
  }
});

// manage buttons (delegation)
manageList.addEventListener('click', async e=>{
  const a = e.target.dataset.action; const feed = decodeURIComponent(e.target.dataset.feed||'');
  if(a==='refresh'){
    await refreshFeed(feed);
    render();
  }else if(a==='remove'){
    state.subs = state.subs.filter(s=>s.url!==feed); saveSubs(); delete state.episodes[feed]; render();
  }
});

// discover and subs click delegations
discoverList.addEventListener('click', async e=>{
  const action = e.target.dataset.action; const id = decodeURIComponent(e.target.dataset.id||''); const feed = decodeURIComponent(e.target.dataset.feed||'');
  if(action==='play'){
    const ep = findEpisode(feed,id); if(ep) openPlayer(ep,feed);
  }else if(action==='download'){
    const ep = findEpisode(feed,id); if(ep) await downloadEpisode(ep,feed);
  }
});

subsList.addEventListener('click', e=>{
  const a = e.target.dataset.action; const feed = decodeURIComponent(e.target.dataset.feed||'');
  if(a==='openFeed'){
    switchTo('library');
    // scroll to feed episodes — simple: show alert and refresh home
    alert('Otvoriť feed v Home: aktualizácia pre ' + feed);
  }
});

// downloads actions
downloadsList.addEventListener('click', async e=>{
  const a = e.target.dataset.action; const id = e.target.dataset.id;
  if(a==='playLocal'){
    const rec = await IDB_HELPER.get(id); if(rec) playBlob(rec.blob, rec);
  }else if(a==='deleteLocal'){
    await IDB_HELPER.del(id); renderDownloads();
  }
});

// find ep
function findEpisode(feed, id){
  const list = state.episodes[feed]||[]; return list.find(x=>x.id===id);
}

// open player
function openPlayer(ep, feed){
  state.current = {ep, feed};
  playerTitle.textContent = ep.title;
  playerDesc.textContent = ep.description||'';
  playerArt.src = ep.itunesImage || '';
  miniTitle.textContent = ep.title; miniSub.textContent = (state.subs.find(s=>s.url===feed)||{}).title || '';
  miniArt.src = ep.itunesImage || '';
  audio.src = ep.enclosureUrl || '';
  downloadBtn.dataset.id = ep.id; downloadBtn.dataset.feed = feed;
  shareBtn.dataset.url = ep.enclosureUrl;
  queueList.innerHTML = '';
  playerModal.classList.remove('hidden');
}

// download
async function downloadEpisode(ep, feed){
  try{
    if(!ep.enclosureUrl) throw new Error('No audio URL');
    downloadBtn.disabled = true; downloadBtn.textContent='Sťahujem...';
    const res = await fetch(ep.enclosureUrl);
    if(!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    const rec = {id: ep.id, title: ep.title, feedTitle: (state.subs.find(s=>s.url===feed)||{}).title||'', blob, storedAt: Date.now()};
    await IDB_HELPER.put(rec);
    alert('Epizóda uložená offline');
    renderDownloads();
  }catch(err){
    console.error(err); alert('Chyba pri sťahovaní: ' + (err.message||err));
  }finally{downloadBtn.disabled=false; downloadBtn.textContent='Stiahnuť';}
}

// play blob
function playBlob(blob, meta){
  const url = URL.createObjectURL(blob);
  audio.src = url; audio.play();
  miniTitle.textContent = meta.title; miniSub.textContent = meta.feedTitle; miniArt.src = '';
  addToHistory(meta);
}

// audio controls
playBtn.addEventListener('click', ()=>{
  if(audio.paused) audio.play(); else audio.pause();
});

audio.addEventListener('play', ()=>playBtn.textContent='⏸');
audio.addEventListener('pause', ()=>playBtn.textContent='▶️');

// share
shareBtn.addEventListener('click', async ()=>{
  const url = shareBtn.dataset.url;
  if(navigator.share){
    try{ await navigator.share({title: state.current.ep.title, text: state.current.ep.description, url}); }catch(e){/*ignore*/}
  }else{
    prompt('Skopíruj URL:', url);
  }
});

// auto-update logic
async function checkAutoUpdate(){
  const last = parseInt(localStorage.getItem(LAST_UPDATE_KEY)||'0',10);
  const now = Date.now();
  if(now - last > 24*3600*1000){
    // update all feeds
    for(const s of state.subs){ if(s.autoUpdate) await refreshFeed(s.url); }
    localStorage.setItem(LAST_UPDATE_KEY, String(now));
    render();
  }
}

async function refreshFeed(feedUrl){
  try{
    const feed = await fetchAndParseRss(feedUrl);
    state.episodes[feedUrl] = feed.items;
  }catch(err){ console.warn('Refresh failed',feedUrl,err); }
}

// simple RSS parser using DOMParser - expects CORS-allowed feed
async function fetchAndParseRss(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Network response not ok');
  const txt = await res.text();
  const doc = new DOMParser().parseFromString(txt, 'text/xml');
  const channel = doc.querySelector('channel');
  const title = (channel && channel.querySelector('title')) ? channel.querySelector('title').textContent : url;
  const items = Array.from(doc.querySelectorAll('item')).slice(0,50).map(it=>{
    const enclosure = it.querySelector('enclosure');
    const guid = (it.querySelector('guid') && it.querySelector('guid').textContent) || (enclosure && enclosure.getAttribute('url')) || Math.random().toString(36).slice(2);
    return {
      id: guid,
      title: it.querySelector('title') ? it.querySelector('title').textContent : 'No title',
      description: it.querySelector('description') ? it.querySelector('description').textContent : '',
      pubDate: it.querySelector('pubDate') ? it.querySelector('pubDate').textContent : '',
      enclosureUrl: enclosure ? enclosure.getAttribute('url') : null,
      itunesImage: (it.querySelector('itunes\\:image') && it.querySelector('itunes\\:image').getAttribute('href')) || (channel && channel.querySelector('image url') ? channel.querySelector('image url').textContent : '')
    };
  });
  return {title, items};
}

// history
function addToHistory(meta){
  try{
    const h = JSON.parse(localStorage.getItem('podclone-history')||'[]');
    h.push({title: meta.title, feedTitle: meta.feedTitle, playedAt: Date.now()});
    if(h.length>200) h.shift();
    localStorage.setItem('podclone-history', JSON.stringify(h));
    renderHistory();
  }catch(e){/*ignore*/}
}

// init
(async function init(){
  // load episodes for subs
  for(const s of state.subs){ try{ const feed = await fetchAndParseRss(s.url); state.episodes[s.url] = feed.items; }catch(e){ console.warn('Failed load',s.url,e); } }
  await checkAutoUpdate();
  render();
})();

// utility: simple escape for attributes
function safeAttr(s){return (s||'').replace(/"/g,'\"');}

// basic event: close player when clicking close
document.getElementById('close-player').addEventListener('click', ()=>playerModal.classList.add('hidden'));

// end of app.js