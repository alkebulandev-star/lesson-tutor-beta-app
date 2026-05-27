/* ════════════════════════════════════════════════════════════════
   ARENA UI EXPANSION (v2)
   ────────────────────────────────────────────────────────────────
   Adds:
   1. Game Browser Gallery — visual showcase of all arena games
   2. Per-game leaderboards
   3. School leaderboards
   4. Crews system (create, join, crew leaderboard)
   5. Enhanced profile with rank display
   Loaded AFTER arena-games-1.js.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ───────────── STYLES ───────────── */
function injectUI2Styles(){
  if (document.getElementById('arena-ui2-styles')) return;
  var s = document.createElement('style');
  s.id = 'arena-ui2-styles';
  s.textContent = ''
    /* ── Game Browser ── */
    + '.ar-game-browse{margin-top:10px}'
    + '.ar-game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}'
    + '.ar-game-card{background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px 14px 14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:8px}'
    + '.ar-game-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.35);border-color:rgba(168,85,247,.5)}'
    + '.ar-game-card.featured{border-color:rgba(245,158,11,.5);background:linear-gradient(160deg,rgba(245,158,11,.12),rgba(255,255,255,.02))}'
    + '.ar-game-card .gc-emoji{font-size:2rem;width:52px;height:52px;background:rgba(255,255,255,.06);border-radius:14px;display:flex;align-items:center;justify-content:center}'
    + '.ar-game-card .gc-name{font-family:"Bricolage Grotesque",sans-serif;font-weight:900;font-size:1rem;color:#fff;line-height:1.2}'
    + '.ar-game-card .gc-desc{font-size:.76rem;color:rgba(255,255,255,.6);line-height:1.4}'
    + '.ar-game-card .gc-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:auto}'
    + '.ar-game-card .gc-tag{font-size:.62rem;font-weight:700;padding:3px 8px;border-radius:100px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6)}'
    + '.ar-game-card .gc-tag.hot{background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.3);color:#fca5a5}'
    + '.ar-game-card .gc-tag.new{background:rgba(16,185,129,.15);border-color:rgba(16,185,129,.3);color:#6ee7b7}'
    + '.ar-game-card .gc-play{width:100%;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;border:none;padding:9px;border-radius:10px;font-weight:800;font-size:.82rem;cursor:pointer;font-family:inherit;margin-top:6px;transition:filter .15s}'
    + '.ar-game-card .gc-play:hover{filter:brightness(1.15)}'
    + '.ar-game-filter{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}'
    + '.ar-game-filter button{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);padding:6px 14px;border-radius:100px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}'
    + '.ar-game-filter button:hover{background:rgba(255,255,255,.1)}'
    + '.ar-game-filter button.on{background:linear-gradient(135deg,rgba(168,85,247,.25),rgba(59,130,246,.2));border-color:rgba(168,85,247,.5);color:#fff}'
    + '@media (max-width:600px){.ar-game-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}}'

    /* ── Enhanced Leaderboard tabs ── */
    + '.ar-lb-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}'
    + '.ar-lb-tab{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.6);padding:7px 14px;border-radius:100px;font-size:.76rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}'
    + '.ar-lb-tab:hover{background:rgba(255,255,255,.08)}'
    + '.ar-lb-tab.on{background:linear-gradient(135deg,rgba(59,130,246,.2),rgba(168,85,247,.15));border-color:rgba(96,165,250,.5);color:#fff}'
    + '.ar-lb-section{display:grid;grid-template-columns:1fr 1fr;gap:14px}'
    + '@media (max-width:700px){.ar-lb-section{grid-template-columns:1fr}}'
    + '.ar-lb-panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px}'
    + '.ar-lb-panel h3{font-family:"Bricolage Grotesque",sans-serif;font-weight:900;font-size:.95rem;margin:0 0 12px;display:flex;align-items:center;gap:8px}'
    + '.ar-lb-panel .ar-lrow{grid-template-columns:28px 1fr auto auto}'

    /* ── Crews ── */
    + '.ar-crew-card{background:linear-gradient(160deg,rgba(168,85,247,.12),rgba(255,255,255,.02));border:1px solid rgba(168,85,247,.3);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px}'
    + '.ar-crew-card .crew-name{font-family:"Bricolage Grotesque",sans-serif;font-weight:900;font-size:1.05rem;display:flex;align-items:center;gap:8px}'
    + '.ar-crew-card .crew-stat{font-size:.78rem;color:rgba(255,255,255,.6)}'
    + '.ar-crew-card .crew-members{display:flex;gap:-4px}'
    + '.ar-crew-actions{display:flex;gap:8px;margin-top:6px}'
    + '.ar-crew-actions button{flex:1}'
    + '.ar-crew-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:10px}'
    + '.ar-crew-lb{margin-top:14px}'

    /* ── Profile rank badge ── */
    + '.ar-rank-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:.72rem;font-weight:800;border:1px solid}'
    + '.ar-rank-pill{display:flex;align-items:center;gap:6px;margin-top:2px}'

    /* ── Quick play bar ── */
    + '.ar-quick-bar{display:flex;gap:8px;overflow-x:auto;padding:8px 0;scroll-snap-type:x mandatory}'
    + '.ar-quick-bar::-webkit-scrollbar{height:4px}.ar-quick-bar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}'
    + '.ar-quick-chip{scroll-snap-align:start;flex:0 0 auto;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:100px;padding:6px 14px 6px 8px;cursor:pointer;transition:all .15s;color:#fff;white-space:nowrap}'
    + '.ar-quick-chip:hover{background:rgba(168,85,247,.2);border-color:rgba(168,85,247,.5)}'
    + '.ar-quick-chip .qc-emoji{font-size:1.2rem}'
    + '.ar-quick-chip .qc-name{font-weight:700;font-size:.82rem}'
    /* ── Featured carousel ── */
    + '.ar-feat-card{flex:0 0 320px;scroll-snap-align:start;border-radius:18px;padding:0;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;position:relative}'
    + '.ar-feat-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.4)}'
    + '.ar-feat-card .fc-bg{width:100%;height:180px;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;position:relative}'
    + '.ar-feat-card .fc-badge{position:absolute;top:12px;left:12px;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);padding:4px 10px;border-radius:100px;font-size:.68rem;font-weight:800;color:#fff;display:flex;align-items:center;gap:4px}'
    + '.ar-feat-card .fc-title{font-family:"Bricolage Grotesque",sans-serif;font-weight:900;font-size:1.35rem;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6);line-height:1.15}'
    + '.ar-feat-card .fc-sub{font-size:.82rem;color:rgba(255,255,255,.85);text-shadow:0 1px 4px rgba(0,0,0,.5);margin-top:4px}'
    + '.ar-feat-card .fc-bottom{padding:14px 18px;background:rgba(15,23,42,.9);display:flex;align-items:center;justify-content:space-between}'
    + '.ar-feat-card .fc-tags{display:flex;gap:5px}'
    + '.ar-feat-card .fc-tag{font-size:.66rem;font-weight:700;padding:3px 8px;border-radius:100px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.7)}'
    + '.ar-feat-card .fc-play{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;border:none;padding:8px 18px;border-radius:100px;font-weight:800;font-size:.8rem;cursor:pointer;font-family:inherit}'
    + '.ar-feat-card .fc-play:hover{filter:brightness(1.15)}'
    + '@media (max-width:600px){.ar-feat-card{flex:0 0 280px}.ar-feat-card .fc-bg{height:150px}}'
    + '.ar-stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:14px 0}'
    + '.ar-stat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;text-align:center}'
    + '.ar-stat-card .sc-val{font-family:"Bricolage Grotesque",sans-serif;font-weight:900;font-size:1.5rem;color:#fff}'
    + '.ar-stat-card .sc-label{font-size:.68rem;color:rgba(255,255,255,.5);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}';
  document.head.appendChild(s);
}

/* ───────────── CREW DATA (localStorage for now) ───────────── */
var CREW_LS = 'arena.crews';
var MY_CREW_LS = 'arena.myCrew';

function loadCrews(){
  try { return JSON.parse(localStorage.getItem(CREW_LS) || '[]'); } catch(e){ return []; }
}
function saveCrews(arr){
  try { localStorage.setItem(CREW_LS, JSON.stringify(arr.slice(0,200))); } catch(e){}
}
function getMyCrew(){
  try { return JSON.parse(localStorage.getItem(MY_CREW_LS) || 'null'); } catch(e){ return null; }
}
function setMyCrew(id){
  try { localStorage.setItem(MY_CREW_LS, JSON.stringify(id)); } catch(e){}
}

// Generate some bot crews if none exist
function ensureCrews(){
  var crews = loadCrews();
  if (crews.length >= 5) return crews;
  var NAMES = [
    {name:'Lagos Legends', tag:'LGL', emoji:'🦁'},
    {name:'Abuja Avengers', tag:'ABV', emoji:'🦅'},
    {name:'Naija Ninjas', tag:'NJN', emoji:'🥷'},
    {name:'Delta Force', tag:'DLT', emoji:'💎'},
    {name:'Kano Kings', tag:'KNK', emoji:'👑'},
    {name:'Ibadan Scholars', tag:'IBS', emoji:'📚'},
    {name:'PH Warriors', tag:'PHW', emoji:'⚔️'},
    {name:'Enugu Eagles', tag:'EGE', emoji:'🦅'},
    {name:'Ogun Titans', tag:'OGT', emoji:'💪'},
    {name:'Benin Royals', tag:'BNR', emoji:'🏰'}
  ];
  for (var i = crews.length; i < 8; i++){
    var n = NAMES[i % NAMES.length];
    var memberCount = 3 + Math.floor(Math.random()*12);
    var members = [];
    for (var j=0;j<memberCount;j++){
      members.push({
        uid:'crew_bot_'+Math.random().toString(36).slice(2,8),
        name:botName(),
        xp: Math.floor(Math.random()*800)
      });
    }
    crews.push({
      id:'crew_'+Math.random().toString(36).slice(2,9),
      name: n.name,
      tag: n.tag,
      emoji: n.emoji,
      owner: members[0].uid,
      members: members,
      xp: members.reduce(function(a,m){ return a + m.xp; },0),
      wins: Math.floor(Math.random()*40),
      createdAt: Date.now() - Math.floor(Math.random()*86400000*30)
    });
  }
  saveCrews(crews);
  return crews;
}

var BOT_NAMES = ['Ada','Tunde','Chinedu','Aisha','Emeka','Funmi','Ibrahim','Ngozi','Yusuf','Zainab','Kemi','Obi','Halima','Bola','Sade','Musa'];
var BOT_SURNAMES = ['O.','A.','E.','I.','U.','M.','C.','B.'];
function botName(){ return BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)] + ' ' + BOT_SURNAMES[Math.floor(Math.random()*BOT_SURNAMES.length)]; }

/* ───────────── GAME CATEGORIES ───────────── */
var CATEGORIES = [
  { id:'all',       name:'All Games',   emoji:'✨' },
  { id:'academic',  name:'Academic',    emoji:'📚' },
  { id:'strategy',  name:'Strategy',    emoji:'♟️' },
  { id:'life-skills', name:'Life Skills', emoji:'💡' },
  { id:'quick',     name:'Quick Play',  emoji:'⚡' }
];
var GAME_CATS = {
  'quiz-duel':'academic', 'math-race':'quick', 'spelling-bee':'academic',
  'memory-match':'quick', 'geo-sprint':'academic', 'word-build':'academic',
  'african-tycoon':'strategy', 'arena-chess':'strategy',
  'math-royale':'academic', 'science-lab':'academic',
  'startup-sim':'life-skills', 'debate-arena':'life-skills',
  'eq-challenge':'life-skills', 'finance-survival':'life-skills',
  'history-quest':'academic'
};
var NEW_GAME_IDS = ['african-tycoon','arena-chess','math-royale','science-lab','startup-sim','debate-arena','eq-challenge','finance-survival','history-quest'];
var HOT_GAME_IDS = ['math-royale','debate-arena','african-tycoon','arena-chess'];

/* ───────────── SCHOOL LEADERBOARD DATA ───────────── */
var SCHOOLS = [
  'Kings College Lagos','Queens College Lagos','Federal Govt College Kaduna',
  'Chrisland College','Corona Secondary','Government College Ibadan',
  'Command Day Secondary','Loyola College Ibadan','Christ the King College',
  'Federal Govt Girls College Sagamu','International School Ibadan',
  'Greensprings School','Atlantic Hall','Lekki British School',
  'Mainland Senior Grammar','Vivian Fowler Memorial','Igbobi College'
];

function generateSchoolLB(classGroup){
  var rows = [];
  for (var i=0;i<12;i++){
    var school = SCHOOLS[i % SCHOOLS.length];
    rows.push({
      school: school,
      xp: Math.floor(Math.random()*8000) + 1000,
      wins: Math.floor(Math.random()*120) + 10,
      members: 5 + Math.floor(Math.random()*30),
      classGroup: classGroup
    });
  }
  rows.sort(function(a,b){ return b.xp - a.xp; });
  return rows;
}

function generateGameLB(gameId, classGroup){
  var rows = [];
  for (var i=0;i<10;i++){
    rows.push({
      name: botName(),
      school: SCHOOLS[Math.floor(Math.random()*SCHOOLS.length)],
      xp: Math.floor(Math.random()*600) + 50,
      wins: Math.floor(Math.random()*30),
      classGroup: classGroup,
      gameId: gameId
    });
  }
  rows.sort(function(a,b){ return b.xp - a.xp; });
  return rows;
}

/* ───────────── MAIN PATCH ───────────── */
var _patchState = {
  gameFilter: 'all',
  lbMode: 'weekly',       // weekly | school | game | crew
  selectedGameLB: null
};

function patchUI(){
  if (!window.ArenaUI || !window._ArenaGamesRef){
    setTimeout(patchUI, 400);
    return;
  }
  if (window.__arenaUI2Patched) return;
  window.__arenaUI2Patched = true;

  injectUI2Styles();

  // Patch ArenaUI.open to inject new sections
  var origOpen = window.ArenaUI.open;
  window.ArenaUI.open = function(){
    origOpen.call(this);
    injectGameBrowser();
    injectEnhancedLB();
    injectCrewSection();
    enhanceProfile();
    enhanceHero();
  };

  // Patch ArenaUI.refresh to also update game-aware sections
  var origRefresh = window.ArenaUI.refresh;
  window.ArenaUI.refresh = function(){
    try { origRefresh.call(this); } catch(e){}
    renderGameBrowser();
    renderLB();
    renderCrews();
  };
}

/* ───────────── ENHANCED HERO ───────────── */
function enhanceHero(){
  var hero = document.querySelector('.ar-hero');
  if (!hero || hero.dataset.enhanced) return;
  hero.dataset.enhanced = '1';

  var p = window.ArenaUI && window.ArenaDB ? window.ArenaDB.loadProfile() : null;
  if (!p) return;

  var rank = window.getArenaRank ? window.getArenaRank(p.xp) : { name:'Rookie', emoji:'🌱', color:'#94a3b8' };

  // Add stats row after hero
  var statsDiv = document.createElement('div');
  statsDiv.className = 'ar-stats-row';
  statsDiv.id = 'arStatsRow';
  statsDiv.innerHTML = ''
    + '<div class="ar-stat-card"><div class="sc-val">'+p.xp+'</div><div class="sc-label">Total XP</div></div>'
    + '<div class="ar-stat-card"><div class="sc-val">'+rank.emoji+' '+rank.name+'</div><div class="sc-label">Current Rank</div></div>'
    + '<div class="ar-stat-card"><div class="sc-val">'+(p.wins||0)+'</div><div class="sc-label">Wins</div></div>'
    + '<div class="ar-stat-card"><div class="sc-val">'+(p.plays||0)+'</div><div class="sc-label">Matches</div></div>'
    + '<div class="ar-stat-card"><div class="sc-val">'+(p.plays ? Math.round((p.wins||0)/p.plays*100) : 0)+'%</div><div class="sc-label">Win Rate</div></div>';
  hero.parentNode.insertBefore(statsDiv, hero.nextSibling);

  // Featured games carousel
  var featDiv = document.createElement('div');
  featDiv.id = 'arFeatured';
  featDiv.innerHTML = '<div class="ar-section-label">🌟 Featured Games</div><div id="arFeaturedInner" style="display:flex;gap:14px;overflow-x:auto;padding:8px 0 14px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;"></div>';
  statsDiv.parentNode.insertBefore(featDiv, statsDiv.nextSibling);
  renderFeaturedCarousel();

  // Quick play bar
  var quickDiv = document.createElement('div');
  quickDiv.id = 'arQuickBar';
  quickDiv.innerHTML = '<div class="ar-section-label">⚡ Quick Play</div><div class="ar-quick-bar" id="arQuickBarInner"></div>';
  featDiv.parentNode.insertBefore(quickDiv, featDiv.nextSibling);
  renderQuickBar();
}

function renderQuickBar(){
  var bar = document.getElementById('arQuickBarInner');
  if (!bar || !window._ArenaGamesRef) return;
  var cg = (window.ArenaDB && window.ArenaDB.loadProfile()) ? window.ArenaDB.loadProfile().classGroup : 'juniors';
  var games = window._ArenaGamesRef.filter(function(g){ return g.groups.indexOf(cg) !== -1; });
  bar.innerHTML = games.map(function(g){
    return '<div class="ar-quick-chip" onclick="ArenaUI2.quickPlay(\''+g.id+'\')">'
      + '<span class="qc-emoji">'+g.emoji+'</span>'
      + '<span class="qc-name">'+g.name+'</span>'
      + '</div>';
  }).join('');
}

/* ───────────── FEATURED CAROUSEL ───────────── */
function renderFeaturedCarousel(){
  var el = document.getElementById('arFeaturedInner');
  if (!el) return;

  var FEATURED = [
    {
      id: 'african-tycoon',
      title: 'Nigerian Monopoly',
      sub: 'Roll dice, buy Lagos properties, collect rent — real board game!',
      gradient: 'linear-gradient(135deg,#7c3aed 0%,#2563eb 50%,#0d9488 100%)',
      emoji: '🏦',
      tags: ['🎲 Board Game','🇳🇬 Nigerian','🏘️ Properties'],
      badge: '🔥 Most Popular'
    },
    {
      id: 'arena-chess',
      title: 'Live Chess',
      sub: 'Full chess board with AI opponent. Classic pieces or Nigerian Kings theme!',
      gradient: 'linear-gradient(135deg,#1e293b 0%,#334155 40%,#78350f 100%)',
      emoji: '♟️',
      tags: ['♔ Strategy','🤖 vs AI','5 min'],
      badge: '♟️ Classic'
    },
    {
      id: 'math-royale',
      title: 'Maths Battle Royale',
      sub: '3 escalating rounds: Bronze → Silver → Scholar. Build streaks for bonus!',
      gradient: 'linear-gradient(135deg,#dc2626 0%,#f59e0b 50%,#eab308 100%)',
      emoji: '⚡',
      tags: ['📊 Maths','🏆 Ranked','3 Rounds'],
      badge: '⚡ Fast-Paced'
    },
    {
      id: 'debate-arena',
      title: 'Debate Arena',
      sub: 'AI-judged debates on real topics. Score on vocabulary, logic & confidence!',
      gradient: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 50%,#f43f5e 100%)',
      emoji: '🎤',
      tags: ['💬 Debate','🤖 AI Judge','Topics'],
      badge: '🎤 New'
    },
    {
      id: 'history-quest',
      title: 'African History Quest',
      sub: 'Explore Mali, Benin, Egypt, Nok & Songhai empires through adventure!',
      gradient: 'linear-gradient(135deg,#92400e 0%,#b45309 40%,#d97706 100%)',
      emoji: '🏛️',
      tags: ['🌍 History','📚 Learn','5 Empires'],
      badge: '🏛️ Adventure'
    }
  ];

  el.innerHTML = FEATURED.map(function(f){
    return '<div class="ar-feat-card" onclick="ArenaUI2.quickPlay(\''+f.id+'\')">'
      + '<div class="fc-bg" style="background:'+f.gradient+';">'
      +   '<div class="fc-badge">'+f.badge+'</div>'
      +   '<div style="font-size:2.5rem;margin-bottom:4px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.4));">'+f.emoji+'</div>'
      +   '<div class="fc-title">'+f.title+'</div>'
      +   '<div class="fc-sub">'+f.sub+'</div>'
      + '</div>'
      + '<div class="fc-bottom">'
      +   '<div class="fc-tags">'+f.tags.map(function(t){ return '<span class="fc-tag">'+t+'</span>'; }).join('')+'</div>'
      +   '<button class="fc-play" onclick="event.stopPropagation();ArenaUI2.quickPlay(\''+f.id+'\')">Play →</button>'
      + '</div>'
      + '</div>';
  }).join('');
}

/* ───────────── GAME BROWSER ───────────── */
function injectGameBrowser(){
  if (document.getElementById('arGameBrowse')) return;
  var wrap = document.querySelector('.ar-wrap');
  if (!wrap) return;

  // Insert before the "4. Live rooms" label
  var roomLabel = wrap.querySelectorAll('.ar-section-label');
  var insertBefore = null;
  for (var i=0;i<roomLabel.length;i++){
    if (roomLabel[i].textContent.indexOf('Live rooms') !== -1){
      insertBefore = roomLabel[i];
      break;
    }
  }

  var section = document.createElement('div');
  section.id = 'arGameBrowse';
  section.innerHTML = ''
    + '<div class="ar-section-label">🎮 Game Library <span style="float:right;color:rgba(255,255,255,.4);font-weight:700;text-transform:none;letter-spacing:0;font-size:.72rem" id="arGameCount"></span></div>'
    + '<div class="ar-game-filter" id="arGameFilter"></div>'
    + '<div class="ar-game-grid" id="arGameGrid"></div>';

  if (insertBefore){
    wrap.insertBefore(section, insertBefore);
  } else {
    wrap.appendChild(section);
  }

  // Render filter buttons
  var filterEl = document.getElementById('arGameFilter');
  filterEl.innerHTML = CATEGORIES.map(function(c){
    return '<button data-cat="'+c.id+'" onclick="ArenaUI2.filterGames(\''+c.id+'\')">'
      + c.emoji+' '+c.name+'</button>';
  }).join('');

  renderGameBrowser();
}

function renderGameBrowser(){
  var grid = document.getElementById('arGameGrid');
  if (!grid || !window._ArenaGamesRef) return;

  var cg = (window.ArenaDB && window.ArenaDB.loadProfile()) ? window.ArenaDB.loadProfile().classGroup : 'juniors';
  var games = window._ArenaGamesRef.filter(function(g){
    if (g.groups.indexOf(cg) === -1) return false;
    if (_patchState.gameFilter !== 'all'){
      return (GAME_CATS[g.id] || 'academic') === _patchState.gameFilter;
    }
    return true;
  });

  var countEl = document.getElementById('arGameCount');
  if (countEl) countEl.textContent = games.length + ' games available';

  // Highlight active filter
  document.querySelectorAll('#arGameFilter button').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-cat') === _patchState.gameFilter);
  });

  grid.innerHTML = games.map(function(g){
    var isNew = NEW_GAME_IDS.indexOf(g.id) !== -1;
    var isHot = HOT_GAME_IDS.indexOf(g.id) !== -1;
    var cat = GAME_CATS[g.id] || 'academic';
    var catObj = CATEGORIES.find(function(c){ return c.id === cat; }) || CATEGORIES[0];
    var featured = isHot ? ' featured' : '';

    return '<div class="ar-game-card'+featured+'" onclick="ArenaUI2.quickPlay(\''+g.id+'\')">'
      + '<div style="display:flex;align-items:flex-start;gap:12px">'
      +   '<div class="gc-emoji">'+g.emoji+'</div>'
      +   '<div style="flex:1">'
      +     '<div class="gc-name">'+g.name+'</div>'
      +     '<div class="gc-desc">'+(g.desc||'')+'</div>'
      +   '</div>'
      + '</div>'
      + '<div class="gc-tags">'
      +   '<span class="gc-tag">'+catObj.emoji+' '+catObj.name+'</span>'
      +   '<span class="gc-tag">⏱ '+(g.duration||'3 min')+'</span>'
      +   (isNew ? '<span class="gc-tag new">✨ New</span>' : '')
      +   (isHot ? '<span class="gc-tag hot">🔥 Hot</span>' : '')
      + '</div>'
      + '<button class="gc-play" onclick="event.stopPropagation();ArenaUI2.quickPlay(\''+g.id+'\')">Play now →</button>'
      + '</div>';
  }).join('');
}

/* ───────────── ENHANCED LEADERBOARD ───────────── */
function injectEnhancedLB(){
  var lb = document.getElementById('arenaLeaderboard');
  if (!lb || lb.dataset.enhanced) return;
  lb.dataset.enhanced = '1';

  // Hide the original leaderboard (origRefresh still writes to it, harmlessly)
  lb.style.display = 'none';

  // Insert tabs before it
  var tabsDiv = document.createElement('div');
  tabsDiv.id = 'arLBTabs';
  tabsDiv.className = 'ar-lb-tabs';
  lb.parentNode.insertBefore(tabsDiv, lb);

  // Insert our new content container after the original
  var newLB = document.createElement('div');
  newLB.id = 'arLBContent';
  newLB.className = 'ar-lb-section';
  lb.parentNode.insertBefore(newLB, lb.nextSibling);

  renderLB();
}

function renderLB(){
  var tabsDiv = document.getElementById('arLBTabs');
  var content = document.getElementById('arLBContent');
  if (!tabsDiv || !content) return;

  var cg = (window.ArenaDB && window.ArenaDB.loadProfile()) ? window.ArenaDB.loadProfile().classGroup : 'juniors';

  // Render tabs
  var tabs = [
    { id:'weekly', name:'🏆 This Week', desc:'Weekly player rankings' },
    { id:'school', name:'🏫 Schools', desc:'School vs school' },
    { id:'game',   name:'🎮 By Game', desc:'Per-game rankings' },
    { id:'crew',   name:'👥 Crews', desc:'Crew rankings' }
  ];
  tabsDiv.innerHTML = tabs.map(function(t){
    return '<button class="ar-lb-tab'+(_patchState.lbMode === t.id ? ' on':'')+'" data-lb="'+t.id+'" onclick="ArenaUI2.switchLB(\''+t.id+'\')">'
      + t.name + '</button>';
  }).join('');

  // Content by mode
  if (_patchState.lbMode === 'weekly'){
    renderWeeklyLB(content, cg);
  } else if (_patchState.lbMode === 'school'){
    renderSchoolLB(content, cg);
  } else if (_patchState.lbMode === 'game'){
    renderGameLBPanel(content, cg);
  } else if (_patchState.lbMode === 'crew'){
    renderCrewLB(content);
  }
}

function renderWeeklyLB(el, cg){
  var scope = 'all';
  var leaders = window.ArenaDB ? window.ArenaDB.topLeaders(cg, scope, 10) : [];
  if (!leaders.length){
    // Generate some demo entries
    leaders = [];
    for (var i=0;i<8;i++){
      leaders.push({ name:botName(), classGroup:cg, scope:'local', xp:Math.floor(Math.random()*500)+50, wins:Math.floor(Math.random()*20) });
    }
    leaders.sort(function(a,b){ return b.xp - a.xp; });
  }

  el.style.display = 'block';
  el.innerHTML = '<div class="ar-lb-panel" style="max-width:100%">'
    + '<h3>🏆 Weekly Leaderboard — '+cg.charAt(0).toUpperCase()+cg.slice(1)+'</h3>'
    + leaders.map(function(r,i){
        var rank = window.getArenaRank ? window.getArenaRank(r.xp) : { emoji:'🌱', color:'#94a3b8' };
        return '<div class="ar-lrow">'
          + '<div class="ar-lrank">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1))+'</div>'
          + '<div><div class="ar-lname">'+rank.emoji+' '+r.name+'</div><div class="ar-lstate">'+r.classGroup+' · '+(r.scope||'local')+'</div></div>'
          + '<div class="ar-score-pill">'+r.wins+'W</div>'
          + '<div class="ar-lxp">'+r.xp+' XP</div>'
        + '</div>';
      }).join('')
    + '</div>';
}

function renderSchoolLB(el, cg){
  var schools = generateSchoolLB(cg);
  el.style.display = 'block';
  el.innerHTML = '<div class="ar-lb-panel" style="max-width:100%">'
    + '<h3>🏫 School Leaderboard — '+cg.charAt(0).toUpperCase()+cg.slice(1)+'</h3>'
    + '<div style="font-size:.76rem;color:rgba(255,255,255,.5);margin-bottom:10px">Schools ranked by combined student XP this week</div>'
    + schools.map(function(r,i){
        return '<div class="ar-lrow" style="grid-template-columns:28px 1fr auto auto auto">'
          + '<div class="ar-lrank">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1))+'</div>'
          + '<div><div class="ar-lname">🏫 '+r.school+'</div><div class="ar-lstate">'+r.members+' students competing</div></div>'
          + '<div class="ar-score-pill">'+r.wins+'W</div>'
          + '<div class="ar-lxp">'+r.xp.toLocaleString()+' XP</div>'
        + '</div>';
      }).join('')
    + '</div>';
}

function renderGameLBPanel(el, cg){
  var games = window._ArenaGamesRef ? window._ArenaGamesRef.filter(function(g){ return g.groups.indexOf(cg) !== -1; }) : [];
  var selectedId = _patchState.selectedGameLB || (games[0] ? games[0].id : null);

  el.style.display = 'block';
  var gameTabsHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'
    + games.map(function(g){
        return '<button style="background:'+(g.id === selectedId ? 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(59,130,246,.2))' : 'rgba(255,255,255,.06)')
          + ';border:1px solid '+(g.id === selectedId ? 'rgba(168,85,247,.5)' : 'rgba(255,255,255,.1)')
          + ';color:#fff;padding:5px 10px;border-radius:100px;font-size:.72rem;font-weight:700;cursor:pointer;font-family:inherit" onclick="ArenaUI2.pickGameLB(\''+g.id+'\')">'
          + g.emoji+' '+g.name+'</button>';
      }).join('')
    + '</div>';

  var gameRows = generateGameLB(selectedId, cg);
  var gameName = '';
  var gm = games.find(function(g){ return g.id === selectedId; });
  if (gm) gameName = gm.emoji + ' ' + gm.name;

  el.innerHTML = '<div class="ar-lb-panel" style="max-width:100%">'
    + '<h3>🎮 Game Leaderboard</h3>'
    + gameTabsHtml
    + '<div style="font-size:.82rem;color:rgba(255,255,255,.7);font-weight:800;margin-bottom:8px">'+gameName+' — Top Players</div>'
    + gameRows.map(function(r,i){
        return '<div class="ar-lrow" style="grid-template-columns:28px 1fr auto auto">'
          + '<div class="ar-lrank">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1))+'</div>'
          + '<div><div class="ar-lname">'+r.name+'</div><div class="ar-lstate">'+r.school+'</div></div>'
          + '<div class="ar-score-pill">'+r.wins+'W</div>'
          + '<div class="ar-lxp">'+r.xp+' XP</div>'
        + '</div>';
      }).join('')
    + '</div>';
}

function renderCrewLB(el){
  var crews = ensureCrews();
  crews.sort(function(a,b){ return b.xp - a.xp; });

  el.style.display = 'block';
  el.innerHTML = '<div class="ar-lb-panel" style="max-width:100%">'
    + '<h3>👥 Crew Rankings</h3>'
    + '<div style="font-size:.76rem;color:rgba(255,255,255,.5);margin-bottom:10px">Crews ranked by combined member XP</div>'
    + crews.slice(0,10).map(function(c,i){
        return '<div class="ar-lrow" style="grid-template-columns:28px 1fr auto auto auto">'
          + '<div class="ar-lrank">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1))+'</div>'
          + '<div><div class="ar-lname">'+c.emoji+' '+c.name+' <span style="font-size:.68rem;color:rgba(255,255,255,.45)">['+c.tag+']</span></div>'
          + '<div class="ar-lstate">'+c.members.length+' members</div></div>'
          + '<div class="ar-score-pill">'+c.wins+'W</div>'
          + '<div class="ar-lxp">'+c.xp.toLocaleString()+' XP</div>'
        + '</div>';
      }).join('')
    + '</div>';
}

/* ───────────── CREW SECTION ───────────── */
function injectCrewSection(){
  if (document.getElementById('arCrewSection')) return;
  var wrap = document.querySelector('.ar-wrap');
  if (!wrap) return;

  var section = document.createElement('div');
  section.id = 'arCrewSection';
  section.innerHTML = ''
    + '<div class="ar-section-label">👥 Crews <span style="float:right;color:rgba(255,255,255,.4);font-weight:700;text-transform:none;letter-spacing:0;font-size:.72rem">'
    +   '<button class="ar-back" style="padding:4px 10px;font-size:.72rem" onclick="ArenaUI2.createCrew()">+ Create crew</button>'
    + '</span></div>'
    + '<div class="ar-crew-grid" id="arCrewGrid"></div>';
  wrap.appendChild(section);
  renderCrews();
}

function renderCrews(){
  var grid = document.getElementById('arCrewGrid');
  if (!grid) return;

  var crews = ensureCrews();
  var myCrew = getMyCrew();

  grid.innerHTML = crews.slice(0,6).map(function(c){
    var isMember = myCrew === c.id;
    var topMembers = c.members.slice(0,5).map(function(m){
      return '<span class="ar-pchip" title="'+m.name+'" style="font-size:.72rem;width:24px;height:24px">'
        + ['🦁','🐘','🦒','🦅','🐆','🦓','🐢','🐬'][Math.floor(Math.random()*8)] + '</span>';
    }).join('');

    return '<div class="ar-crew-card">'
      + '<div class="crew-name">'+c.emoji+' '+c.name+' <span style="font-size:.72rem;color:rgba(255,255,255,.45);font-weight:600">['+c.tag+']</span></div>'
      + '<div class="crew-stat">👥 '+c.members.length+' members · ⭐ '+c.xp.toLocaleString()+' XP · 🏆 '+c.wins+' wins</div>'
      + '<div class="ar-room-players" style="margin:2px 0">'+topMembers+'</div>'
      + '<div class="ar-crew-actions">'
      +   (isMember
            ? '<button class="ar-spec" style="flex:1" disabled>✓ Your crew</button>'
            : '<button class="ar-join" style="flex:1;font-size:.78rem" onclick="ArenaUI2.joinCrew(\''+c.id+'\')">Join crew →</button>')
      + '</div>'
      + '</div>';
  }).join('');
}

/* ───────────── ENHANCED PROFILE ───────────── */
function enhanceProfile(){
  var pEl = document.getElementById('arPMeta');
  if (!pEl || pEl.dataset.enhanced) return;
  pEl.dataset.enhanced = '1';

  var p = window.ArenaDB ? window.ArenaDB.loadProfile() : null;
  if (!p) return;

  var rank = window.getArenaRank ? window.getArenaRank(p.xp) : { name:'Rookie', emoji:'🌱', color:'#94a3b8' };
  pEl.innerHTML = '<span class="ar-rank-badge" style="color:'+rank.color+';border-color:'+rank.color+'">'+rank.emoji+' '+rank.name+'</span> · '
    + (p.state || '—') + ' · ' + p.xp + ' XP';
}

/* ───────────── PUBLIC API ───────────── */
window.ArenaUI2 = {
  filterGames: function(cat){
    _patchState.gameFilter = cat;
    renderGameBrowser();
  },
  quickPlay: function(gameId){
    if (!window.ArenaUI || !window._ArenaGamesRef) return;
    var game = window._ArenaGamesRef.find(function(g){ return g.id === gameId; });
    if (!game) return;

    var p = window.ArenaDB ? window.ArenaDB.loadProfile() : null;
    var cg = p ? p.classGroup : 'juniors';
    var scope = 'local';
    var fmts = window._ArenaFormats || [];
    var fmt = fmts[0] || { id:'1v1', name:'1 vs 1', emoji:'⚔️', size:2, team:1 };
    var prizeBase = scope === 'nationwide' ? 5000 : scope === 'state' ? 1500 : 500;

    var STATES = ['Lagos','Abuja','Kano','Ibadan','Port Harcourt','Enugu','Benin City','Kaduna'];
    function rid(){ return 'a' + Math.random().toString(36).slice(2,9); }

    var botPlayers = [];
    for (var i=0;i<fmt.size-1;i++){
      botPlayers.push({
        uid:'bot_'+rid(),
        name: botName(),
        avatar: ['🦊','🐯','🦅','🐼','🐸','🐵','🐧','🦄'][Math.floor(Math.random()*8)],
        state: STATES[Math.floor(Math.random()*STATES.length)],
        bot: true
      });
    }

    var room = {
      id: 'quick_'+rid(),
      classGroup: cg,
      scope: scope,
      state: p ? p.state : 'Lagos',
      gameId: game.id,
      gameName: game.name,
      gameEmoji: game.emoji,
      duration: game.duration,
      players: botPlayers,
      maxPlayers: fmt.size,
      format: fmt.id,
      formatName: fmt.name,
      formatEmoji: fmt.emoji,
      teamSize: fmt.team,
      status: 'open',
      viewers: 0,
      scores: {},
      startsIn: 10,
      prize: prizeBase,
      isHost: true,
      createdAt: Date.now()
    };

    window.ArenaUI.joinRoom(room);
  },
  switchLB: function(mode){
    _patchState.lbMode = mode;
    renderLB();
  },
  pickGameLB: function(gameId){
    _patchState.selectedGameLB = gameId;
    renderLB();
  },
  createCrew: function(){
    var name = prompt('Enter your crew name:');
    if (!name || !name.trim()) return;
    name = name.trim().slice(0,30);
    var tag = prompt('Enter a 3-letter tag (e.g. LGL):');
    if (!tag || !tag.trim()) return;
    tag = tag.trim().toUpperCase().slice(0,4);
    var emojis = ['🦁','🦅','💎','👑','⚔️','🔥','💪','🌟','🚀','🐉'];
    var emoji = emojis[Math.floor(Math.random()*emojis.length)];

    var p = window.ArenaDB ? window.ArenaDB.loadProfile() : { uid:'me', name:'Player', xp:0 };
    var crews = loadCrews();
    var newCrew = {
      id: 'crew_'+Math.random().toString(36).slice(2,9),
      name: name,
      tag: tag,
      emoji: emoji,
      owner: p.uid,
      members: [{ uid:p.uid, name:p.name, xp:p.xp||0 }],
      xp: p.xp||0,
      wins: 0,
      createdAt: Date.now()
    };
    crews.unshift(newCrew);
    saveCrews(crews);
    setMyCrew(newCrew.id);
    renderCrews();
    renderLB();
  },
  joinCrew: function(crewId){
    var crews = loadCrews();
    var crew = crews.find(function(c){ return c.id === crewId; });
    if (!crew) return;

    var p = window.ArenaDB ? window.ArenaDB.loadProfile() : { uid:'me', name:'Player', xp:0 };
    var already = crew.members.some(function(m){ return m.uid === p.uid; });
    if (!already){
      crew.members.push({ uid:p.uid, name:p.name, xp:p.xp||0 });
      crew.xp += (p.xp||0);
    }
    saveCrews(crews);
    setMyCrew(crewId);
    renderCrews();
    renderLB();
  }
};

/* ───────────── INIT ───────────── */
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', patchUI);
} else {
  patchUI();
}

})();
