
// ══════════════ PARENT HUB STATE ══════════════
(function(){
  try {
    window.LT_PH_STATE = JSON.parse(localStorage.getItem('lt_ph_state') || '{"children":[],"scores":[],"schedule":{},"counsellorChat":[]}');
  } catch(e) {
    window.LT_PH_STATE = { children: [], scores: [], schedule: {}, counsellorChat: [] };
  }
  // Migration: ensure every child has a stable id, and that activeChildId
  // points at a real child (or null when none exist). Without this, the
  // AI counsellor can't reliably tell which child the parent is asking
  // about, and the dashboard can't filter scores per child.
  var st = window.LT_PH_STATE;
  if(!Array.isArray(st.children)) st.children = [];
  st.children.forEach(function(c, i){
    if(!c.id) c.id = 'c_' + Date.now().toString(36) + '_' + i;
  });
  if(typeof st.activeChildId === 'undefined') st.activeChildId = null;
  if(st.activeChildId && !st.children.some(function(c){ return c.id === st.activeChildId; })){
    st.activeChildId = st.children[0] ? st.children[0].id : null;
  }
  if(!st.activeChildId && st.children.length) st.activeChildId = st.children[0].id;

  // Demo seed for admin/presentation: pre-populate rich, realistic data
  // so the dashboard sings during the demo (no empty states anywhere).
  try {
    var email = (localStorage.getItem('lt_user_email') || '').toLowerCase();
    var role = (localStorage.getItem('lt_user_role') || '').toLowerCase();
    var isAdminDemo = (email === 'alkebulandev@gmail.com' || role === 'admin');
    if (isAdminDemo && st.children.length === 0){
      var DAY = 86400000;
      var now = Date.now();
      var iso = function(t){ return new Date(t).toISOString(); };

      // ─── Two children with distinct profiles ───
      // Chidimma — top SS2 student, science stream, strong in maths/chem/bio
      // Tunde   — JSS3 student, weaker overall, improving, struggles with maths
      var c1 = { id: 'c_demo_chidimma', name: 'Chidimma O.', klass: 'SS2', email: 'chidimma.demo@lesson-teacher.test', avatar: '👧🏿', streak: 12, xp: 2840 };
      var c2 = { id: 'c_demo_tunde',    name: 'Tunde A.',    klass: 'JSS 3', email: 'tunde.demo@lesson-teacher.test', avatar: '👦🏿', streak: 4,  xp: 980 };
      st.children = [c1, c2];
      st.activeChildId = c1.id;

      // ─── Exam scores (per-child, multi-board, multi-subject) ───
      // Dashboard reads: score, subject, exam, date, childId
      st.scores = [
        // CHIDIMMA — strong SSS2 record
        { childId:c1.id, subject:'Mathematics',     score:84, date:now-DAY*1,  topic:'Quadratic Equations',   exam:'Mock WAEC' },
        { childId:c1.id, subject:'English Language',score:88, date:now-DAY*2,  topic:'Comprehension & Lexis', exam:'Mock WAEC' },
        { childId:c1.id, subject:'Chemistry',       score:79, date:now-DAY*3,  topic:'Acids, Bases & Salts',  exam:'Mock NECO' },
        { childId:c1.id, subject:'Biology',         score:82, date:now-DAY*4,  topic:'Cell Division',         exam:'Mock WAEC' },
        { childId:c1.id, subject:'Physics',         score:71, date:now-DAY*5,  topic:'Wave Motion',           exam:'Practice' },
        { childId:c1.id, subject:'Mathematics',     score:76, date:now-DAY*7,  topic:'Logarithms',            exam:'Practice' },
        { childId:c1.id, subject:'Civic Education', score:91, date:now-DAY*8,  topic:'Rights & Duties',       exam:'Mock NECO' },
        { childId:c1.id, subject:'Economics',       score:74, date:now-DAY*9,  topic:'Demand & Supply',       exam:'Practice' },
        { childId:c1.id, subject:'Geography',       score:81, date:now-DAY*11, topic:'Map Reading',           exam:'Mock WAEC' },
        { childId:c1.id, subject:'Chemistry',       score:68, date:now-DAY*14, topic:'Redox Reactions',       exam:'Practice' },
        { childId:c1.id, subject:'Biology',         score:86, date:now-DAY*16, topic:'Photosynthesis',        exam:'Mock JAMB' },
        { childId:c1.id, subject:'Mathematics',     score:92, date:now-DAY*18, topic:'Probability',           exam:'Mock JAMB' },
        { childId:c1.id, subject:'Physics',         score:64, date:now-DAY*21, topic:'Electromagnetism',      exam:'Practice' },

        // TUNDE — JSS3, mixed bag, improving lately
        { childId:c2.id, subject:'Basic Science',   score:72, date:now-DAY*1,  topic:'Energy & Forces',       exam:'Mock BECE' },
        { childId:c2.id, subject:'Mathematics',     score:54, date:now-DAY*2,  topic:'Fractions & Decimals',  exam:'Practice' },
        { childId:c2.id, subject:'English Studies', score:78, date:now-DAY*3,  topic:'Reading Comprehension', exam:'Mock BECE' },
        { childId:c2.id, subject:'Social Studies',  score:81, date:now-DAY*5,  topic:'Nigerian Cultures',     exam:'Mock BECE' },
        { childId:c2.id, subject:'Mathematics',     score:49, date:now-DAY*7,  topic:'Word Problems',         exam:'Practice' },
        { childId:c2.id, subject:'Basic Technology',score:70, date:now-DAY*9,  topic:'Simple Machines',       exam:'Practice' },
        { childId:c2.id, subject:'CRS',             score:88, date:now-DAY*12, topic:'Parables of Jesus',     exam:'Mock BECE' },
        { childId:c2.id, subject:'Agricultural Sc.',score:75, date:now-DAY*15, topic:'Soil Types',            exam:'Practice' },
        { childId:c2.id, subject:'Mathematics',     score:61, date:now-DAY*19, topic:'Percentages',           exam:'Practice' }
      ];

      // ─── Tutor activity (single-stream on device, attributed to active child) ───
      // Lessons read — spread over 14 days so weekly chart looks lively
      var lessonsRead = [
        // This week (days 0-6)
        { subj:'Mathematics',     topic:'Quadratic Equations',   date: iso(now-DAY*1+3600000),  seconds: 720, term:'1', wk:6 },
        { subj:'Chemistry',       topic:'Acids & Bases',         date: iso(now-DAY*1+3600000*2),seconds: 900, term:'1', wk:6 },
        { subj:'English Language',topic:'Reading for Main Ideas',date: iso(now-DAY*2+3600000),  seconds: 540, term:'1', wk:6 },
        { subj:'Biology',         topic:'Cell Division — Mitosis',date: iso(now-DAY*2+3600000*4),seconds:1080,term:'1', wk:6 },
        { subj:'Physics',         topic:'Wave Motion Properties',date: iso(now-DAY*3+3600000),  seconds: 660, term:'1', wk:5 },
        { subj:'Mathematics',     topic:'Completing the Square', date: iso(now-DAY*3+3600000*3),seconds: 480, term:'1', wk:5 },
        { subj:'Civic Education', topic:'Rights & Duties',       date: iso(now-DAY*4+3600000),  seconds: 420, term:'1', wk:5 },
        { subj:'Economics',       topic:'Demand & Supply',       date: iso(now-DAY*4+3600000*2),seconds: 720, term:'1', wk:5 },
        { subj:'Geography',       topic:'Map Reading & Scale',   date: iso(now-DAY*5+3600000),  seconds: 600, term:'1', wk:5 },
        { subj:'Chemistry',       topic:'Redox Reactions',       date: iso(now-DAY*6+3600000),  seconds: 840, term:'1', wk:4 },
        // Last week
        { subj:'Biology',         topic:'Photosynthesis',        date: iso(now-DAY*8+3600000),  seconds: 900, term:'1', wk:4 },
        { subj:'Mathematics',     topic:'Probability',           date: iso(now-DAY*9+3600000),  seconds: 780, term:'1', wk:4 },
        { subj:'Physics',         topic:'Electromagnetism Basics',date: iso(now-DAY*10+3600000),seconds: 660, term:'1', wk:4 },
        { subj:'English Language',topic:'Summary Writing',       date: iso(now-DAY*11+3600000), seconds: 540, term:'1', wk:3 },
        { subj:'Government',      topic:'Federal System',        date: iso(now-DAY*12+3600000), seconds: 480, term:'1', wk:3 },
        { subj:'Mathematics',     topic:'Logarithms',            date: iso(now-DAY*13+3600000), seconds: 720, term:'1', wk:3 }
      ];

      // Quiz results — mix of strong/watch/weak per topic for triage panel
      var quizResults = [
        // Strong (≥80%)
        { subj:'Mathematics',     topic:'Quadratic Equations', correct:9,  total:10, date: iso(now-DAY*1+7200000) },
        { subj:'Biology',         topic:'Cell Division',       correct:8,  total:10, date: iso(now-DAY*2+7200000) },
        { subj:'Civic Education', topic:'Rights & Duties',     correct:10, total:10, date: iso(now-DAY*4+7200000) },
        { subj:'Geography',       topic:'Map Reading',         correct:8,  total:10, date: iso(now-DAY*5+7200000) },
        { subj:'Mathematics',     topic:'Probability',         correct:9,  total:10, date: iso(now-DAY*9+7200000) },
        // Watch (60-79%)
        { subj:'Chemistry',       topic:'Acids & Bases',       correct:7,  total:10, date: iso(now-DAY*1+10800000) },
        { subj:'Economics',       topic:'Demand & Supply',     correct:6,  total:10, date: iso(now-DAY*4+10800000) },
        { subj:'English Language',topic:'Comprehension',       correct:7,  total:10, date: iso(now-DAY*2+10800000) },
        // Needs help (<60%)
        { subj:'Physics',         topic:'Wave Motion',         correct:4,  total:10, date: iso(now-DAY*3+10800000) },
        { subj:'Chemistry',       topic:'Redox Reactions',     correct:5,  total:10, date: iso(now-DAY*6+10800000) },
        { subj:'Physics',         topic:'Electromagnetism',    correct:4,  total:10, date: iso(now-DAY*10+10800000) }
      ];

      // Topics fully mastered
      var topicsCompletedList = [
        { subj:'Mathematics',     topic:'Indices & Surds',      date: iso(now-DAY*2),  xp: 120 },
        { subj:'Biology',         topic:'Cell Division',        date: iso(now-DAY*3),  xp: 100 },
        { subj:'Civic Education', topic:'Rights & Duties',      date: iso(now-DAY*4),  xp: 110 },
        { subj:'Mathematics',     topic:'Quadratic Equations',  date: iso(now-DAY*5),  xp: 150 },
        { subj:'English Language',topic:'Comprehension',        date: iso(now-DAY*7),  xp: 90  },
        { subj:'Geography',       topic:'Map Reading',          date: iso(now-DAY*9),  xp: 110 },
        { subj:'Biology',         topic:'Photosynthesis',       date: iso(now-DAY*12), xp: 130 },
        { subj:'Mathematics',     topic:'Probability',          date: iso(now-DAY*14), xp: 140 }
      ];

      // Persist demo tutor activity inside LT_PH_STATE so it survives the
      // onboarding flow (which overwrites lt_progress_v2). phTutorProgress
      // merges this with live device activity at read time.
      st.demoTutor = {
        lessonsRead: lessonsRead,
        quizResults: quizResults,
        topicsCompletedList: topicsCompletedList,
        xp: 2840,
        streak: 12,
        studentName: 'Chidimma O.',
        studentClass: 'SS2',
        stream: 'Science'
      };

      // ─── Study schedule (per-day slots) ───
      st.schedule = {
        mon: [ { subj:'Mathematics',     time:'16:00', dur:45 }, { subj:'Chemistry',  time:'18:00', dur:30 } ],
        tue: [ { subj:'English Language',time:'16:00', dur:30 }, { subj:'Biology',    time:'18:00', dur:45 } ],
        wed: [ { subj:'Physics',         time:'16:00', dur:45 } ],
        thu: [ { subj:'Mathematics',     time:'16:00', dur:45 }, { subj:'Geography',  time:'18:00', dur:30 } ],
        fri: [ { subj:'Civic Education', time:'16:00', dur:30 }, { subj:'Economics',  time:'17:30', dur:30 } ],
        sat: [ { subj:'Mock Exam Practice', time:'10:00', dur:120 } ],
        sun: [ { subj:'Light Revision',    time:'17:00', dur:45 } ]
      };

      // ─── Counsellor chat seed ───
      st.counsellorChat = [
        { role:'parent', text:'How is Chidimma doing this week?', date: iso(now-DAY*1) },
        { role:'ai',     text:'Chidimma is on track — 6 active days, 12-day streak, 84% on her latest Mock WAEC Maths. Areas to watch: Wave Motion (Physics, 40%) and Redox Reactions (Chemistry, 50%). I\'d recommend 30 minutes of focused practice on Physics this weekend. Would you like a personalised practice paper?', date: iso(now-DAY*1+60000) }
      ];

      // ─── Wellbeing notes ───
      st.wellbeing = {
        mood: 'focused',
        confidence: 4,
        notes: 'Mentioned worrying about Physics. Otherwise enthusiastic about Maths.',
        lastUpdated: iso(now-DAY*1)
      };

      try { localStorage.setItem('lt_ph_state', JSON.stringify(st)); } catch(e){}
      console.log('[ParentHub] Rich demo data seeded — 2 children, 22 scores, 16 lessons, 11 quizzes, 8 mastered topics');
    }
  } catch(e){ console.warn('[ParentHub] demo seed skipped', e); }
})();

function phSave(){
  try { localStorage.setItem('lt_ph_state', JSON.stringify(window.LT_PH_STATE)); } catch(e) {}
}

// ══════════════ ACTIVE-CHILD HELPERS ══════════════
// These are the single source of truth for "which child are we monitoring".
// Every dashboard widget and the AI counsellor reads from `phActiveChild()`
// so switching kids automatically reroutes context everywhere.

function phActiveChild(){
  var st = window.LT_PH_STATE;
  if(!st.activeChildId) return null;
  return st.children.find(function(c){ return c.id === st.activeChildId; }) || null;
}

function phSetActiveChild(id, gotoTab){
  var st = window.LT_PH_STATE;
  if(!st.children.some(function(c){ return c.id === id; })) return;
  st.activeChildId = id;
  phSave();
  if(gotoTab){
    phTab(gotoTab);
    return;
  }
  // Re-render whatever tab is open so the new child's data shows.
  var active = document.querySelector('.ph-subtab.active');
  var tabName = active ? active.getAttribute('data-tab') : 'dashboard';
  phTab(tabName || 'dashboard');
}

// Scores filtered to the active child. Legacy scores (no childId) show only
// when there is exactly one child — otherwise they'd be ambiguous.
function phScoresFor(childId){
  var s = window.LT_PH_STATE;
  if(!childId) return [];
  var soloChild = s.children.length === 1;
  return (s.scores || []).filter(function(sc){
    if(sc.childId === childId) return true;
    if(!sc.childId && soloChild) return true;  // backfill into the only child
    return false;
  });
}

// Tutor activity (lessons + quizzes) is single-stream on this device.
// Per-child binding will come with Supabase; for now we treat the active
// child as the "owner" of this device's tutor history.
//
// DEMO MODE: when LT_PH_STATE.demoTutor exists (admin presentation seed),
// merge that data with the live device activity so the dashboard renders
// with rich seeded history even after onboarding overwrites lt_progress_v2.
function phTutorProgress(){
  var live = (typeof _sessionProgress !== 'undefined') ? _sessionProgress
           : (window._sessionProgress || { lessonsRead:[], quizResults:[], topicsCompletedList:[] });
  var demo = (window.LT_PH_STATE && window.LT_PH_STATE.demoTutor) ? window.LT_PH_STATE.demoTutor : null;
  if (!demo) return live;
  // Merge — live data first, demo appended (sorted by date by callers)
  return {
    lessonsRead:        (live.lessonsRead        || []).concat(demo.lessonsRead        || []),
    quizResults:        (live.quizResults        || []).concat(demo.quizResults        || []),
    topicsCompletedList:(live.topicsCompletedList|| []).concat(demo.topicsCompletedList|| []),
    xp:                 (live.xp || 0) + (demo.xp || 0),
    streak:             Math.max(live.streak || 0, demo.streak || 0)
  };
}

// Per-day study minutes for the last 7 days (Mon→Sun keyed by ISO date).
function phWeekActivity(){
  var sp = phTutorProgress();
  var lessons = sp.lessonsRead || [];
  var quizzes = sp.quizResults || [];
  var byDay = {};
  var today = new Date(); today.setHours(0,0,0,0);
  for(var d = 6; d >= 0; d--){
    var dt = new Date(today); dt.setDate(today.getDate() - d);
    byDay[dt.toISOString().slice(0,10)] = 0;
  }
  lessons.forEach(function(r){
    if(!r.date) return;
    var k = r.date.slice(0,10);
    if(byDay[k] === undefined) return;
    byDay[k] += Math.round((r.seconds || 240) / 60);
  });
  quizzes.forEach(function(r){
    if(!r.date) return;
    var k = r.date.slice(0,10);
    if(byDay[k] === undefined) return;
    byDay[k] += 2;
  });
  var keys = Object.keys(byDay);
  var total = 0; keys.forEach(function(k){ total += byDay[k]; });
  var activeDays = keys.filter(function(k){ return byDay[k] > 0; }).length;
  return { byDay: byDay, total: total, activeDays: activeDays, keys: keys };
}

// Topic-level triage: green (strong), yellow (watch), red (needs help).
// Based on the most recent score per topic across the tutor's quiz history.
function phTopicTriage(){
  var quizzes = phTutorProgress().quizResults || [];
  var latest = {};  // topicKey → latest record
  for(var i = quizzes.length - 1; i >= 0; i--){
    var q = quizzes[i]; if(!q.total) continue;
    var k = (q.subj||'') + '::' + (q.topic||'');
    if(!latest[k]) latest[k] = q;
  }
  var strong = [], watch = [], needsHelp = [];
  Object.keys(latest).forEach(function(k){
    var q = latest[k];
    var pct = q.correct / q.total;
    if(pct >= 0.8) strong.push(q);
    else if(pct >= 0.6) watch.push(q);
    else needsHelp.push(q);
  });
  // Sort needsHelp by how recently — most urgent first.
  needsHelp.sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
  watch.sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
  strong.sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
  return { strong: strong, watch: watch, needsHelp: needsHelp };
}

// Per-subject mastery — avg of latest score per topic, grouped by subject.
function phSubjectMastery(){
  var quizzes = phTutorProgress().quizResults || [];
  var latest = {};
  for(var i = quizzes.length - 1; i >= 0; i--){
    var q = quizzes[i]; if(!q.total) continue;
    var k = (q.subj||'?') + '::' + (q.topic||'?');
    if(!latest[k]) latest[k] = q;
  }
  var bySubj = {};
  Object.keys(latest).forEach(function(k){
    var q = latest[k]; var s = q.subj || 'Other';
    if(!bySubj[s]) bySubj[s] = { total:0, gained:0, count:0 };
    bySubj[s].total += q.total;
    bySubj[s].gained += q.correct;
    bySubj[s].count += 1;
  });
  return Object.keys(bySubj).map(function(s){
    var r = bySubj[s];
    return { subject: s, pct: Math.round((r.gained / r.total) * 100), topics: r.count };
  }).sort(function(a,b){ return b.pct - a.pct; });
}

// Last N tutor events (lessons + quizzes), newest first.
function phRecentActivity(n){
  var sp = phTutorProgress();
  var events = [];
  (sp.lessonsRead || []).forEach(function(r){
    events.push({ kind:'lesson', subj:r.subj || r.subject || '', topic:r.topic || '', date:r.date, mins: Math.round((r.seconds||240)/60) });
  });
  (sp.quizResults || []).forEach(function(r){
    events.push({ kind:'quiz', subj:r.subj || '', topic:r.topic || '', date:r.date, correct:r.correct, total:r.total });
  });
  (sp.topicsCompletedList || []).forEach(function(r){
    events.push({ kind:'mastered', subj:r.subj || '', topic:r.topic || '', date:r.date, xp:r.xp });
  });
  events.sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
  return events.slice(0, n || 6);
}

// Deterministic, auto-generated insight. No API call needed — keeps the
// dashboard useful even before AI keys are configured. The counsellor
// itself uses the real Anthropic call.
function phComputeInsight(child){
  if(!child) return null;
  var wk = phWeekActivity();
  var tri = phTopicTriage();
  var mast = phSubjectMastery();
  var bits = [];
  // Activity headline
  if(wk.total === 0){
    bits.push(child.name + ' has not used the tutor in the last 7 days.');
    bits.push('A short conversation tonight — no teaching, just curiosity about school — often restarts the habit.');
    return { tone:'warn', text: bits.join(' ') };
  }
  if(wk.activeDays >= 5){
    bits.push(child.name + ' is studying consistently (' + wk.activeDays + ' of 7 days, ' + wk.total + ' minutes).');
  } else if(wk.activeDays >= 2){
    bits.push(child.name + ' studied ' + wk.activeDays + ' days this week — below the 5-day target.');
  } else {
    bits.push(child.name + ' only studied ' + wk.activeDays + ' day' + (wk.activeDays===1?'':'s') + ' this week.');
  }
  // Strongest / weakest
  if(mast.length){
    var best = mast[0], worst = mast[mast.length - 1];
    if(best.pct >= 75) bits.push('Strongest: ' + best.subject + ' at ' + best.pct + '%.');
    if(worst.pct < 60 && worst.subject !== best.subject) bits.push('Watch ' + worst.subject + ' — averaging ' + worst.pct + '%.');
  }
  // Urgent topic
  if(tri.needsHelp.length){
    var u = tri.needsHelp[0];
    bits.push('Sit with ' + child.name + ' tonight on ' + u.topic + ' (' + u.subj + ') — last quiz ' + Math.round((u.correct/u.total)*100) + '%.');
  } else if(tri.watch.length){
    bits.push('One topic to monitor: ' + tri.watch[0].topic + ' (' + tri.watch[0].subj + ').');
  } else if(tri.strong.length){
    bits.push('No weak topics right now. Celebrate it — a single sentence of recognition tonight builds momentum.');
  }
  var tone = (tri.needsHelp.length >= 2 || wk.activeDays < 3) ? 'warn'
           : (tri.needsHelp.length === 0 && wk.activeDays >= 5) ? 'good' : 'neutral';
  return { tone: tone, text: bits.join(' ') };
}

// HTML for the pinned switcher that appears above every parent-hub tab.
function phChildSwitcherHtml(){
  var st = window.LT_PH_STATE;
  var active = phActiveChild();
  var html = '<div class="ph-deckbar">';
  if(!st.children.length){
    html += '<div class="ph-deckbar-empty">';
    html += '<span class="ph-deckbar-empty-icon">👶</span>';
    html += '<div><div class="ph-deckbar-empty-title">No child added yet</div>';
    html += '<div class="ph-deckbar-empty-sub">Add your first child to start monitoring.</div></div>';
    html += '<button onclick="phTab(\'progress\')" class="ph-btn">+ Add child</button>';
    html += '</div></div>';
    return html;
  }
  html += '<div class="ph-deckbar-row">';
  html += '<div class="ph-deckbar-label">Monitoring</div>';
  html += '<div class="ph-deckbar-chips">';
  st.children.forEach(function(c){
    var on = active && c.id === active.id;
    html += '<button class="ph-chchip' + (on?' on':'') + '" onclick="phSetActiveChild(\'' + c.id + '\')">'
      +    '<span class="ph-chchip-av">' + (c.name[0]||'?').toUpperCase() + '</span>'
      +    '<span class="ph-chchip-text"><span class="ph-chchip-name">' + escHtml(c.name) + '</span>'
      +    '<span class="ph-chchip-class">' + escHtml(c.klass) + '</span></span>'
      +    '</button>';
  });
  html += '<button class="ph-chchip ph-chchip-add" onclick="phTab(\'progress\')" title="Add child">+</button>';
  html += '</div></div></div>';
  return html;
}

// Re-inject the deck bar above whatever the current tab rendered.
// Called from phTab() after each render so it shows on every tab.
function phInjectDeckBar(){
  var el = document.getElementById('phContent');
  if(!el) return;
  // Strip any previous deck bar so we don't stack duplicates.
  var existing = el.querySelector('.ph-deckbar');
  if(existing) existing.remove();
  el.insertAdjacentHTML('afterbegin', phChildSwitcherHtml());
}

// ════════════════════ GROUPED NAVIGATION ════════════════════
// 8 flat tabs were overwhelming on mobile and unclear for non-tech-savvy
// parents. They now sit under 3 clear sections:
//   📊 TRACK  — Dashboard · Progress · Exam Scores
//   📅 PLAN   — Study Schedule · Templates
//   💬 SUPPORT — Counsellor · Wellbeing · Advice Topics
// The grouping is purely UI; each individual phRender* function below stays
// intact, so nothing else has to change.
var PH_TAB_GROUPS = {
  track:   { label: '📊 Track',   tabs: ['dashboard','progress','scores'],   labels: { dashboard:'Overview', progress:'Activity', scores:'Exam Scores' } },
  plan:    { label: '📅 Plan',    tabs: ['schedule','templates'],            labels: { schedule:'Study Schedule', templates:'Conversation Scripts' } },
  support: { label: '💬 Support', tabs: ['counsellor','wellbeing','advice'], labels: { counsellor:'AI Counsellor', wellbeing:'Wellbeing Check', advice:'Advice Library' } }
};

function _phGroupFor(tabName){
  for(var g in PH_TAB_GROUPS){
    if(PH_TAB_GROUPS[g].tabs.indexOf(tabName) !== -1) return g;
  }
  return 'track';
}

function phTab(name){
  // Find which group this tab belongs to (so the right group stays active).
  var group = _phGroupFor(name);
  // Update group-row active state.
  document.querySelectorAll('.ph-group').forEach(function(b){
    b.classList.toggle('active', b.dataset.group === group);
  });
  // Rebuild the sub-tab strip for this group.
  var subStrip = document.getElementById('phSubTabs');
  if(subStrip){
    var gData = PH_TAB_GROUPS[group];
    var sh = '';
    for(var i = 0; i < gData.tabs.length; i++){
      var t = gData.tabs[i];
      sh += '<button class="ph-subtab' + (t === name ? ' active' : '') + '" onclick="phTab(\'' + t + '\')" data-tab="' + t + '">' + (gData.labels[t] || t) + '</button>';
    }
    subStrip.innerHTML = sh;
  }
  // Run the matching render function.
  var renderers = {
    dashboard: phRenderDashboard,
    progress: phRenderProgress,
    scores: phRenderScores,
    schedule: phRenderSchedule,
    counsellor: phRenderCounsellor,
    templates: phRenderTemplates,
    wellbeing: phRenderWellbeing,
    advice: phRenderAdvice
  };
  (renderers[name] || phRenderDashboard)();
  // Pin the active-child switcher above whatever just rendered — every tab
  // (dashboard, counsellor, scores, schedule…) gets the same context bar.
  phInjectDeckBar();
  var el = document.getElementById('phContent');
  if (el) window.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
}

// Build the grouped navigation shell. Called on first open of pg-parent.
// Replaces the old flat row of 8 tabs that lived in the static HTML.
function phBuildNav(){
  // Backwards compat: the static markup uses #phTabs, but newer code
  // expects #phNav. Use whichever exists.
  var nav = document.getElementById('phNav') || document.getElementById('phTabs');
  if(!nav) return;
  // Hide the old flat tab row if it exists in the static markup.
  nav.querySelectorAll('.ph-tab').forEach(function(b){ b.style.display = 'none'; });

  if(document.getElementById('phGroupRow')) return; // already built

  var html = ''
    + '<div id="phGroupRow" class="ph-group-row">'
    +   '<button class="ph-group active" data-group="track" onclick="phTab(\'dashboard\')">📊 Track</button>'
    +   '<button class="ph-group" data-group="plan" onclick="phTab(\'schedule\')">📅 Plan</button>'
    +   '<button class="ph-group" data-group="support" onclick="phTab(\'counsellor\')">💬 Support</button>'
    + '</div>'
    + '<div id="phSubTabs" class="ph-subtab-row"></div>';
  var holder = document.createElement('div');
  holder.id = 'phGroupNav';
  holder.innerHTML = html;
  nav.parentNode.insertBefore(holder, nav.nextSibling);

  // Inject grouped-nav styles once.
  if(!document.getElementById('phGroupStyles')){
    var st = document.createElement('style');
    st.id = 'phGroupStyles';
    st.textContent = ''
      + '.ph-group-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px}'
      + '.ph-group{flex:1;min-width:90px;padding:14px 12px;background:rgba(255,255,255,.04);'
      + 'border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);border-radius:12px;'
      + 'font-weight:800;font-size:.92rem;cursor:pointer;font-family:inherit;transition:.18s;'
      + 'text-align:center;line-height:1.1}'
      + '.ph-group:hover{background:rgba(255,255,255,.08);color:#fff}'
      + '.ph-group.active{background:linear-gradient(135deg,#fbbf24,#f97316);border-color:transparent;color:#0a1628}'
      + '.ph-subtab-row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 14px;padding:6px;'
      + 'background:rgba(0,0,0,.18);border-radius:10px}'
      + '.ph-subtab{padding:8px 14px;background:transparent;border:none;color:rgba(255,255,255,.65);'
      + 'border-radius:8px;font-weight:700;font-size:.84rem;cursor:pointer;font-family:inherit;transition:.15s}'
      + '.ph-subtab:hover{background:rgba(255,255,255,.06);color:#fff}'
      + '.ph-subtab.active{background:rgba(251,191,36,.18);color:#fbbf24}'
      + '@media(max-width:520px){.ph-group{padding:11px 8px;font-size:.85rem;min-width:0}'
      + '.ph-subtab{padding:7px 10px;font-size:.78rem}.ph-subtab-row{padding:4px}}';
    document.head.appendChild(st);
  }
}

// ══════════════ MONITORING DECK (DASHBOARD) ══════════════
// Designed as a flight-deck: one child at a time, real signal first,
// AI insight contextualised, and every action one tap away.
function phRenderDashboard(){
  var st = window.LT_PH_STATE;
  var child = phActiveChild();

  // ─── No-child empty state: a single, focused onboarding card ───
  if(!child){
    var emp = '';
    emp += '<div class="ph-card ph-deck-empty">';
    emp += '<div class="ph-deck-empty-art">👨‍👩‍👧</div>';
    emp += '<h2 class="ph-deck-empty-title">Welcome to your monitoring deck</h2>';
    emp += '<p class="ph-deck-empty-sub">Add your first child to see weekly study activity, strengths, weak topics, exam trends and AI-coached next steps — all in one screen.</p>';
    emp += '<button class="ph-btn" onclick="phTab(\'progress\')">+ Add a child to begin</button>';
    emp += '</div>';
    document.getElementById('phContent').innerHTML = emp;
    return;
  }

  var wk = phWeekActivity();
  var tri = phTopicTriage();
  var mast = phSubjectMastery();
  var recent = phRecentActivity(6);
  var scores = phScoresFor(child.id);
  var lastScore = scores[scores.length - 1];
  var insight = phComputeInsight(child);

  // Last activity hint for the header.
  var allEvents = phRecentActivity(1);
  var lastSeen = allEvents[0] ? _phFmtRelative(allEvents[0].date) : 'no activity yet';

  var html = '';

  // ─── Deck header: who we're monitoring + at-a-glance status ──────
  html += '<div class="ph-card ph-deck-head">';
  html += '<div class="ph-deck-head-left">';
  html += '<div class="ph-deck-av">' + (child.name[0]||'?').toUpperCase() + '</div>';
  html += '<div><div class="ph-deck-name">' + escHtml(child.name) + '</div>';
  html += '<div class="ph-deck-meta">' + escHtml(child.klass) + ' · last seen ' + lastSeen + '</div></div>';
  html += '</div>';
  html += '<div class="ph-deck-head-right">';
  var insightTone = insight ? insight.tone : 'neutral';
  var statusDot = insightTone === 'good' ? '#10b981' : insightTone === 'warn' ? '#ef4444' : '#fbbf24';
  var statusLbl = insightTone === 'good' ? 'On track' : insightTone === 'warn' ? 'Needs attention' : 'Monitoring';
  html += '<div class="ph-deck-status"><span class="ph-deck-dot" style="background:' + statusDot + '"></span>' + statusLbl + '</div>';
  html += '</div></div>';

  // ─── Row 1: This week tiles — activity, mastery, exam trend ──────
  html += '<div class="ph-deck-row3">';

  // Tile A — Days active
  html += '<div class="ph-card ph-deck-tile">';
  html += '<div class="ph-deck-tile-label">Days active</div>';
  html += '<div class="ph-deck-tile-big">' + wk.activeDays + '<span class="ph-deck-tile-of"> / 7</span></div>';
  html += '<div class="ph-deck-bars">';
  wk.keys.forEach(function(k){
    var m = wk.byDay[k];
    var dt = new Date(k);
    var lbl = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(dt.getDay()+6)%7];
    html += '<div class="ph-deck-bar"><div class="ph-deck-bar-fill" style="height:' + Math.max(6, Math.min(100, m*4)) + '%;opacity:' + (m>0?1:0.25) + '"></div><div class="ph-deck-bar-lbl">' + lbl + '</div></div>';
  });
  html += '</div>';
  html += '<div class="ph-deck-tile-foot">' + wk.total + ' min this week</div>';
  html += '</div>';

  // Tile B — Topic triage (latest counts)
  html += '<div class="ph-card ph-deck-tile">';
  html += '<div class="ph-deck-tile-label">Topic triage</div>';
  html += '<div class="ph-deck-tri">';
  html += '<div class="ph-deck-tri-cell tri-good"><div class="ph-deck-tri-n">' + tri.strong.length + '</div><div class="ph-deck-tri-lbl">Strong</div></div>';
  html += '<div class="ph-deck-tri-cell tri-watch"><div class="ph-deck-tri-n">' + tri.watch.length + '</div><div class="ph-deck-tri-lbl">Watch</div></div>';
  html += '<div class="ph-deck-tri-cell tri-bad"><div class="ph-deck-tri-n">' + tri.needsHelp.length + '</div><div class="ph-deck-tri-lbl">Help</div></div>';
  html += '</div>';
  html += '<div class="ph-deck-tile-foot">Across ' + (tri.strong.length + tri.watch.length + tri.needsHelp.length) + ' topics quizzed</div>';
  html += '</div>';

  // Tile C — Exam trend
  html += '<div class="ph-card ph-deck-tile">';
  html += '<div class="ph-deck-tile-label">Last mock exam</div>';
  if(lastScore){
    var gr = _phGrade(lastScore.score);
    html += '<div class="ph-deck-tile-big" style="color:' + gr.c + '">' + lastScore.score + '%</div>';
    html += '<div class="ph-deck-tile-foot" style="color:rgba(255,255,255,.78)"><strong style="color:' + gr.c + '">' + gr.g + '</strong> · ' + escHtml(lastScore.subject) + ' · ' + escHtml(lastScore.exam) + '</div>';
    html += '<button class="ph-deck-tile-cta" onclick="phTab(\'scores\')">+ Log new score</button>';
  } else {
    html += '<div class="ph-deck-tile-big" style="color:rgba(255,255,255,.35)">—</div>';
    html += '<div class="ph-deck-tile-foot">No scores logged yet.</div>';
    html += '<button class="ph-deck-tile-cta" onclick="phTab(\'scores\')">+ Log first score</button>';
  }
  html += '</div>';
  html += '</div>'; // /row3

  // ─── AI Insight (auto, deterministic) + open counsellor ──────────
  if(insight){
    var iColor = insight.tone === 'good' ? '#10b981' : insight.tone === 'warn' ? '#ef4444' : '#fbbf24';
    html += '<div class="ph-card ph-deck-insight" style="border-left:3px solid ' + iColor + '">';
    html += '<div class="ph-deck-insight-head"><span class="ph-deck-insight-tag">AI INSIGHT</span><span class="ph-deck-insight-sub">about ' + escHtml(child.name) + ' · auto-generated</span></div>';
    html += '<p class="ph-deck-insight-body">' + escHtml(insight.text) + '</p>';
    html += '<div class="ph-deck-insight-actions">';
    html += '<button class="ph-btn" onclick="phAskCounsellorAbout(\'How can I help ' + escHtml(child.name).replace(/\'/g,"&#39;") + ' with their weak topics this week?\')">Ask counsellor →</button>';
    html += '</div>';
    html += '</div>';
  }

  // ─── Subject mastery breakdown ───────────────────────────────────
  html += '<div class="ph-card"><h3>📚 Subject mastery</h3>';
  if(!mast.length){
    html += '<p class="ph-deck-empty-line">No quizzes taken yet. Mastery shows up here once ' + escHtml(child.name) + ' completes a quiz in the tutor.</p>';
  } else {
    html += '<div class="ph-deck-subj">';
    mast.forEach(function(m){
      var c = m.pct >= 75 ? '#10b981' : m.pct >= 60 ? '#fbbf24' : '#ef4444';
      html += '<div class="ph-deck-subj-row">'
        + '<div class="ph-deck-subj-name">' + escHtml(m.subject) + '</div>'
        + '<div class="ph-deck-subj-bar"><div class="ph-deck-subj-bar-fill" style="width:' + m.pct + '%;background:' + c + '"></div></div>'
        + '<div class="ph-deck-subj-pct" style="color:' + c + '">' + m.pct + '%</div>'
        + '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // ─── Needs-help topics + recent activity (side by side on desktop) ─
  html += '<div class="ph-deck-row2">';

  // Needs help list
  html += '<div class="ph-card"><h3>🔴 Needs help</h3>';
  if(!tri.needsHelp.length){
    html += '<p class="ph-deck-empty-line">No weak topics right now. Worth saying out loud at dinner tonight — recognition compounds.</p>';
  } else {
    html += '<ul class="ph-deck-list">';
    tri.needsHelp.slice(0,5).forEach(function(t){
      var pct = Math.round((t.correct/t.total)*100);
      html += '<li><div class="ph-deck-list-main"><strong>' + escHtml(t.topic) + '</strong><span class="ph-deck-list-sub"> · ' + escHtml(t.subj) + '</span></div>'
        + '<div class="ph-deck-list-side" style="color:#ef4444">' + pct + '%</div></li>';
    });
    html += '</ul>';
    html += '<div class="ph-deck-list-actions">';
    html += '<button class="ph-btn" onclick="phAddWeakTopicsToSchedule()">📅 Add to schedule</button>';
    html += '<button class="ph-btn ph-btn-ghost" onclick="phAskCounsellorAbout(\'My child is struggling with ' + escHtml(tri.needsHelp[0].topic).replace(/\'/g,"&#39;") + '. How do I help?\')">Ask about this</button>';
    html += '</div>';
  }
  html += '</div>';

  // Recent activity
  html += '<div class="ph-card"><h3>🕒 Recent tutor activity</h3>';
  html += '<div class="ph-deck-feed">';
  if(!recent.length){
    html += '<p class="ph-deck-empty-line">No tutor sessions on this device yet.</p>';
  } else {
    recent.forEach(function(e){
      var icon = e.kind === 'quiz' ? '✏️' : e.kind === 'mastered' ? '⭐' : '📖';
      var detail = e.kind === 'quiz'
        ? (e.correct + '/' + e.total + ' correct')
        : e.kind === 'mastered'
          ? ('mastered · +' + (e.xp||0) + ' XP')
          : (e.mins + ' min lesson');
      html += '<div class="ph-deck-feed-row">'
        + '<span class="ph-deck-feed-ic">' + icon + '</span>'
        + '<div class="ph-deck-feed-main"><div>' + escHtml(e.topic || '(untitled)') + '</div>'
        + '<div class="ph-deck-feed-sub">' + escHtml(e.subj || '') + ' · ' + detail + '</div></div>'
        + '<div class="ph-deck-feed-time">' + _phFmtRelative(e.date) + '</div></div>';
    });
  }
  html += '</div>';
  html += '<p class="ph-deck-note">All study sessions on this device. Per-child sessions will arrive with cloud sync.</p>';
  html += '</div>';

  html += '</div>'; // /row2

  // ─── Quick ask counsellor about this child ───────────────────────
  html += '<div class="ph-card ph-deck-asks">';
  html += '<h3>💬 Quick ask about ' + escHtml(child.name) + '</h3>';
  var asks = phSuggestionsFor(child, tri);
  html += '<div class="ph-deck-ask-grid">';
  asks.forEach(function(q){
    html += '<button class="ph-deck-ask" onclick="phAskCounsellorAbout(\'' + q.replace(/'/g,"&#39;").replace(/"/g,"&quot;") + '\')">' + escHtml(q) + '</button>';
  });
  html += '</div></div>';

  document.getElementById('phContent').innerHTML = html;

  // Inject styles once.
  _phInjectDeckStyles();
}

// Grade helper, shared with phRenderScoreList. Kept inline so the dashboard
// has zero ordering dependencies.
function _phGrade(v){
  var n = parseInt(v);
  if (n >= 75) return { g:'A1', c:'#10b981' };
  if (n >= 70) return { g:'B2', c:'#34d399' };
  if (n >= 65) return { g:'B3', c:'#84cc16' };
  if (n >= 60) return { g:'C4', c:'#eab308' };
  if (n >= 55) return { g:'C5', c:'#f59e0b' };
  if (n >= 50) return { g:'C6', c:'#f97316' };
  if (n >= 45) return { g:'D7', c:'#ef4444' };
  if (n >= 40) return { g:'E8', c:'#dc2626' };
  return { g:'F9', c:'#991b1b' };
}

// Relative time: "2h ago", "yesterday", "Apr 30". Compact, glance-friendly.
function _phFmtRelative(iso){
  if(!iso) return 'a while ago';
  var t = new Date(iso).getTime();
  if(isNaN(t)) return 'a while ago';
  var diff = Date.now() - t;
  var mins = Math.round(diff / 60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return mins + 'm ago';
  var hrs = Math.round(mins/60);
  if(hrs < 24) return hrs + 'h ago';
  var days = Math.round(hrs/24);
  if(days === 1) return 'yesterday';
  if(days < 7) return days + 'd ago';
  return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric' });
}

// Suggested prompts personalised to the active child and their actual triage.
function phSuggestionsFor(child, tri){
  var n = child.name;
  var out = [];
  if(tri.needsHelp.length){
    out.push('How do I help ' + n + ' with ' + tri.needsHelp[0].topic + '?');
  }
  if(tri.watch.length){
    out.push('Is ' + n + ' falling behind in ' + tri.watch[0].subj + '?');
  }
  out.push('What\'s a healthy study routine for ' + n + ' (' + child.klass + ')?');
  out.push('How do I keep ' + n + ' motivated this week?');
  out.push('Should I get ' + n + ' a tutor or is the app enough?');
  out.push('How much screen time is healthy for ' + n + '?');
  return out.slice(0, 6);
}

// One-shot helper: jump to the counsellor with a pre-filled question.
function phAskCounsellorAbout(q){
  phTab('counsellor');
  setTimeout(function(){
    var input = document.getElementById('phChatInput');
    if(input){ input.value = q; input.focus(); }
  }, 60);
}

// Inject deck CSS once. Inline so we don't need to touch index.html.
function _phInjectDeckStyles(){
  if(document.getElementById('phDeckStyles')) return;
  var st = document.createElement('style');
  st.id = 'phDeckStyles';
  st.textContent = ''
    // Deck bar (pinned child switcher)
    + '.ph-deckbar{position:sticky;top:0;z-index:5;margin:-8px -2px 16px;padding:10px 12px;'
    + 'background:linear-gradient(180deg,rgba(10,22,40,.96),rgba(10,22,40,.82));'
    + 'backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08);border-radius:14px}'
    + '.ph-deckbar-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}'
    + '.ph-deckbar-label{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;'
    + 'color:rgba(255,255,255,.45);font-weight:800}'
    + '.ph-deckbar-chips{display:flex;gap:8px;flex-wrap:wrap;flex:1;min-width:0}'
    + '.ph-chchip{display:inline-flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;'
    + 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:100px;'
    + 'cursor:pointer;font-family:inherit;transition:.18s;color:rgba(255,255,255,.85)}'
    + '.ph-chchip:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}'
    + '.ph-chchip.on{background:linear-gradient(135deg,#fbbf24,#f97316);border-color:transparent;color:#0a1628}'
    + '.ph-chchip-av{width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.35);'
    + 'display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem}'
    + '.ph-chchip.on .ph-chchip-av{background:rgba(10,22,40,.25);color:#0a1628}'
    + '.ph-chchip-text{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1}'
    + '.ph-chchip-name{font-weight:800;font-size:.88rem}'
    + '.ph-chchip-class{font-size:.7rem;opacity:.7}'
    + '.ph-chchip-add{width:38px;height:38px;justify-content:center;padding:0;font-size:1.2rem;'
    + 'font-weight:900;color:rgba(255,255,255,.65)}'
    + '.ph-deckbar-empty{display:flex;align-items:center;gap:14px;flex-wrap:wrap}'
    + '.ph-deckbar-empty-icon{font-size:2rem}'
    + '.ph-deckbar-empty-title{font-weight:800;color:#fff;font-size:.95rem}'
    + '.ph-deckbar-empty-sub{font-size:.82rem;color:rgba(255,255,255,.6)}'

    // Deck header card
    + '.ph-deck-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}'
    + '.ph-deck-head-left{display:flex;align-items:center;gap:14px}'
    + '.ph-deck-av{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#fbbf24,#f97316);'
    + 'display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.4rem;color:#0a1628;'
    + "font-family:'Bricolage Grotesque',sans-serif}"
    + '.ph-deck-name{font-family:\'Bricolage Grotesque\',sans-serif;font-weight:900;font-size:1.4rem;color:#fff;line-height:1.1}'
    + '.ph-deck-meta{font-size:.82rem;color:rgba(255,255,255,.55);margin-top:3px}'
    + '.ph-deck-status{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;'
    + 'background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:100px;'
    + 'font-size:.82rem;color:rgba(255,255,255,.85);font-weight:700}'
    + '.ph-deck-dot{width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 4px rgba(255,255,255,.06)}'

    // 3-tile + 2-col rows
    + '.ph-deck-row3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}'
    + '.ph-deck-row2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}'
    + '@media(max-width:820px){.ph-deck-row3,.ph-deck-row2{grid-template-columns:1fr}}'

    // Tiles
    + '.ph-deck-tile{display:flex;flex-direction:column;gap:6px;min-height:170px}'
    + '.ph-deck-tile-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;'
    + 'font-weight:800;color:rgba(255,255,255,.5)}'
    + '.ph-deck-tile-big{font-family:\'Bricolage Grotesque\',sans-serif;font-size:2.6rem;'
    + 'font-weight:900;color:#fff;line-height:1}'
    + '.ph-deck-tile-of{font-size:1.2rem;color:rgba(255,255,255,.4);font-weight:700}'
    + '.ph-deck-tile-foot{font-size:.78rem;color:rgba(255,255,255,.6);margin-top:auto}'
    + '.ph-deck-tile-cta{margin-top:8px;padding:8px 12px;background:rgba(251,191,36,.15);'
    + 'border:1px solid rgba(251,191,36,.35);color:#fbbf24;border-radius:8px;font-size:.78rem;'
    + 'font-weight:800;cursor:pointer;font-family:inherit;align-self:flex-start}'
    + '.ph-deck-tile-cta:hover{background:rgba(251,191,36,.25)}'

    // 7-bar week chart inside Tile A
    + '.ph-deck-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;align-items:end;height:56px;margin:6px 0}'
    + '.ph-deck-bar{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}'
    + '.ph-deck-bar-fill{width:100%;background:linear-gradient(to top,#fbbf24,#f97316);border-radius:3px 3px 0 0;min-height:4px;transition:.3s}'
    + '.ph-deck-bar-lbl{font-size:.6rem;color:rgba(255,255,255,.4);margin-top:3px}'

    // Triage (Tile B)
    + '.ph-deck-tri{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:4px 0}'
    + '.ph-deck-tri-cell{padding:10px 8px;border-radius:10px;text-align:center;border:1px solid transparent}'
    + '.ph-deck-tri-cell.tri-good{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.25)}'
    + '.ph-deck-tri-cell.tri-watch{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.25)}'
    + '.ph-deck-tri-cell.tri-bad{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.25)}'
    + '.ph-deck-tri-n{font-family:\'Bricolage Grotesque\',sans-serif;font-weight:900;font-size:1.6rem;color:#fff}'
    + '.tri-good .ph-deck-tri-n{color:#10b981}.tri-watch .ph-deck-tri-n{color:#fbbf24}.tri-bad .ph-deck-tri-n{color:#ef4444}'
    + '.ph-deck-tri-lbl{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.65);font-weight:800;margin-top:2px}'

    // Insight
    + '.ph-deck-insight{padding-left:18px}'
    + '.ph-deck-insight-head{display:flex;align-items:center;gap:10px;margin-bottom:6px}'
    + '.ph-deck-insight-tag{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a1628;'
    + 'font-weight:900;font-size:.66rem;letter-spacing:.14em;padding:3px 8px;border-radius:6px}'
    + '.ph-deck-insight-sub{font-size:.78rem;color:rgba(255,255,255,.55)}'
    + '.ph-deck-insight-body{margin:0 0 12px;color:rgba(255,255,255,.92);font-size:.95rem;line-height:1.6}'
    + '.ph-deck-insight-actions{display:flex;gap:8px;flex-wrap:wrap}'

    // Subject bars
    + '.ph-deck-subj{display:flex;flex-direction:column;gap:8px}'
    + '.ph-deck-subj-row{display:grid;grid-template-columns:120px 1fr 50px;gap:12px;align-items:center}'
    + '.ph-deck-subj-name{font-weight:700;color:#fff;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.ph-deck-subj-bar{height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}'
    + '.ph-deck-subj-bar-fill{height:100%;border-radius:4px;transition:.4s}'
    + '.ph-deck-subj-pct{font-weight:800;font-size:.85rem;text-align:right}'
    + '@media(max-width:520px){.ph-deck-subj-row{grid-template-columns:80px 1fr 40px;gap:8px}}'

    // List + feed
    + '.ph-deck-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}'
    + '.ph-deck-list li{display:flex;align-items:center;justify-content:space-between;gap:10px;'
    + 'padding:10px 12px;background:rgba(0,0,0,.22);border-radius:10px}'
    + '.ph-deck-list-main{flex:1;min-width:0;color:#fff;font-size:.88rem;overflow:hidden}'
    + '.ph-deck-list-main strong{font-weight:800}'
    + '.ph-deck-list-sub{font-size:.78rem;color:rgba(255,255,255,.55)}'
    + '.ph-deck-list-side{font-weight:800;font-size:.92rem;font-family:\'Bricolage Grotesque\',sans-serif}'
    + '.ph-deck-list-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}'

    + '.ph-deck-feed{display:flex;flex-direction:column;gap:4px}'
    + '.ph-deck-feed-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;'
    + 'transition:.15s}'
    + '.ph-deck-feed-row:hover{background:rgba(255,255,255,.03)}'
    + '.ph-deck-feed-ic{font-size:1.1rem;width:24px;text-align:center}'
    + '.ph-deck-feed-main{flex:1;min-width:0;color:#fff;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.ph-deck-feed-sub{font-size:.72rem;color:rgba(255,255,255,.5);margin-top:1px}'
    + '.ph-deck-feed-time{font-size:.72rem;color:rgba(255,255,255,.45);white-space:nowrap}'
    + '.ph-deck-note{font-size:.72rem;color:rgba(255,255,255,.4);margin:10px 0 0;font-style:italic}'
    + '.ph-deck-empty-line{color:rgba(255,255,255,.55);font-size:.88rem;margin:0;padding:14px;'
    + 'background:rgba(0,0,0,.18);border-radius:10px;text-align:center}'

    // Quick asks
    + '.ph-deck-ask-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}'
    + '.ph-deck-ask{padding:12px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);'
    + 'color:rgba(255,255,255,.85);border-radius:10px;font-size:.84rem;cursor:pointer;font-family:inherit;'
    + 'text-align:left;line-height:1.4;transition:.18s}'
    + '.ph-deck-ask:hover{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.3);color:#fff}'

    // Empty deck
    + '.ph-deck-empty{text-align:center;padding:48px 24px}'
    + '.ph-deck-empty-art{font-size:3.6rem;margin-bottom:10px}'
    + '.ph-deck-empty-title{font-family:\'Bricolage Grotesque\',sans-serif;font-size:1.6rem;font-weight:900;color:#fff;margin:0 0 8px}'
    + '.ph-deck-empty-sub{color:rgba(255,255,255,.7);max-width:480px;margin:0 auto 18px;line-height:1.6}';
  document.head.appendChild(st);
}

// ══════════════ PROGRESS MONITOR ══════════════
function phRenderProgress(){
  var s = window.LT_PH_STATE;
  var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // ─── Read REAL progress from the tutor side (_sessionProgress) ───
  // The tutor writes lessonsRead, quizResults, topicsCompletedList here.
  // We aggregate it into per-day minutes for the chart and into a list of
  // weak topics that the AI can use to recommend study targets.
  var sp = (typeof _sessionProgress !== 'undefined') ? _sessionProgress : (window._sessionProgress || {});
  var lessonsRead = sp.lessonsRead || [];
  var quizzes = sp.quizResults || [];
  var topicsDone = (sp.topicsCompletedList || []).length;
  var streak = sp.streak || 0;

  // Per-day minutes for the last 7 days. Default to 0; this is honest.
  // Uses the seconds field from lessonsRead when present (added in v15_5).
  function dayKey(date){ return date.toISOString().slice(0,10); }
  var dayMinutes = {};
  var today = new Date(); today.setHours(0,0,0,0);
  for(var d = 6; d >= 0; d--){
    var dt = new Date(today); dt.setDate(today.getDate() - d);
    dayMinutes[dayKey(dt)] = 0;
  }
  lessonsRead.forEach(function(r){
    if(!r.date) return;
    var key = r.date.slice(0,10);
    if(dayMinutes[key] === undefined) return;
    dayMinutes[key] += Math.round((r.seconds || 240) / 60); // 4 min default
  });
  quizzes.forEach(function(r){
    if(!r.date) return;
    var key = r.date.slice(0,10);
    if(dayMinutes[key] === undefined) return;
    dayMinutes[key] += 2; // ~2 min per 5-question quiz
  });
  var totalMin = 0;
  Object.keys(dayMinutes).forEach(function(k){ totalMin += dayMinutes[k]; });
  var maxDay = Math.max(10, Math.max.apply(null, Object.values(dayMinutes)));

  // Weak topics — quizzes scored under 60%, de-duplicated, most recent first.
  var weakSeen = {};
  var weakTopics = [];
  for(var i = quizzes.length - 1; i >= 0; i--){
    var q = quizzes[i];
    if(!q.total || (q.correct/q.total) >= 0.6) continue;
    var key = (q.subj||'') + '::' + (q.topic||'');
    if(weakSeen[key]) continue;
    weakSeen[key] = true;
    weakTopics.push(q);
    if(weakTopics.length >= 6) break;
  }

  var html = '';
  html += '<div class="ph-card"><h3>👨‍👩‍👧 Your Children</h3>';
  html += '<p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:18px;">Link each child using the email they registered with. This connects their learning data to your monitoring deck.</p>';
  html += '<div style="background:rgba(0,0,0,.2);border-radius:12px;padding:16px;margin-bottom:18px;">';
  html += '<div style="font-weight:700;color:#fbbf24;font-size:.88rem;margin-bottom:10px;">➕ Link a Child</div>';
  html += '<div style="display:grid;gap:10px;">';
  html += '<input id="phChildEmail" class="ph-input" type="email" placeholder="Child\'s registered email address" style="width:100%;">';
  html += '<div style="display:grid;grid-template-columns:2fr 1fr auto;gap:10px;">';
  html += '<input id="phChildName" class="ph-input" placeholder="Child\'s name (e.g. Ada)">';
  html += '<select id="phChildClass" class="ph-input">';
  var classes = ['P1','P2','P3','P4','P5','P6','JSS1','JSS2','JSS3','SS1','SS2','SS3'];
  for (var ci = 0; ci < classes.length; ci++) {
    html += '<option value="' + classes[ci] + '">' + classes[ci] + '</option>';
  }
  html += '</select>';
  html += '<button onclick="phAddChild()" class="ph-btn">Link</button>';
  html += '</div></div>';
  html += '<p style="font-size:.78rem;color:rgba(255,255,255,.45);margin-top:8px;">When cloud sync is active, this email is used to pull the child\'s real study data into your dashboard automatically.</p>';
  html += '</div>';
  html += '<div id="phChildrenList">' + phRenderChildrenList() + '</div></div>';

  // ─── Real activity chart ───
  html += '<div class="ph-card"><h3>📊 This Week\'s Real Activity</h3>';
  html += '<p style="color:rgba(255,255,255,.6);font-size:.82rem;margin-bottom:14px;">Based on what your child has actually done in the tutor this week.</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:20px;">';
  var keys = Object.keys(dayMinutes);
  for(var k = 0; k < keys.length; k++){
    var dt = new Date(keys[k]);
    var mins = dayMinutes[keys[k]];
    var h = Math.max(4, Math.round((mins / maxDay) * 100));
    var lbl = days[(dt.getDay() + 6) % 7]; // Mon-first
    html += '<div style="text-align:center;"><div style="height:80px;background:linear-gradient(to top,#fbbf24,#f97316);border-radius:6px;position:relative;margin-bottom:6px;">'
      + '<div style="position:absolute;bottom:0;left:0;right:0;height:' + (100-h) + '%;background:rgba(10,22,40,.85);border-radius:6px 6px 0 0;"></div>'
      + '</div><div style="font-size:.7rem;color:rgba(255,255,255,.6);">' + lbl + '</div>'
      + '<div style="font-size:.75rem;color:' + (mins > 0 ? '#fbbf24' : 'rgba(255,255,255,.3)') + ';font-weight:700;">' + mins + 'm</div></div>';
  }
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
  html += '<div style="text-align:center;padding:14px;background:rgba(251,191,36,.08);border-radius:12px;"><div style="font-size:1.6rem;font-weight:900;color:#fbbf24;font-family:\'Bricolage Grotesque\',sans-serif;">' + (totalMin >= 60 ? (totalMin/60).toFixed(1) + 'h' : totalMin + 'm') + '</div><div style="font-size:.75rem;color:rgba(255,255,255,.6);margin-top:2px;">This week</div></div>';
  html += '<div style="text-align:center;padding:14px;background:rgba(16,185,129,.08);border-radius:12px;"><div style="font-size:1.6rem;font-weight:900;color:#10b981;font-family:\'Bricolage Grotesque\',sans-serif;">' + topicsDone + '</div><div style="font-size:.75rem;color:rgba(255,255,255,.6);margin-top:2px;">Topics mastered</div></div>';
  html += '<div style="text-align:center;padding:14px;background:rgba(124,58,237,.08);border-radius:12px;"><div style="font-size:1.6rem;font-weight:900;color:#a78bfa;font-family:\'Bricolage Grotesque\',sans-serif;">' + streak + '</div><div style="font-size:.75rem;color:rgba(255,255,255,.6);margin-top:2px;">Day streak</div></div>';
  html += '</div>';
  // Honest status note — colour-coded based on actual activity, not random.
  var statusColor = totalMin >= 120 ? '#10b981' : totalMin >= 30 ? '#fbbf24' : '#ef4444';
  var statusEmoji = totalMin >= 120 ? '✓ On track' : totalMin >= 30 ? '⚠️ Light week' : '⏰ Very little study';
  var statusText  = totalMin >= 120
    ? 'Your child is studying consistently. Ask them: "Which subject did you learn today?"'
    : totalMin >= 30
      ? 'Some progress this week but below the recommended 30-45 min/day. A short conversation tonight may help.'
      : 'Very little study time this week. Sit with them for 20 minutes today — no teaching, just presence. It works.';
  html += '<div style="margin-top:16px;padding:14px;background:' + statusColor + '14;border-left:3px solid ' + statusColor + ';border-radius:0 10px 10px 0;"><div style="font-size:.82rem;color:' + statusColor + ';font-weight:700;margin-bottom:4px;">' + statusEmoji + '</div><div style="font-size:.85rem;color:rgba(255,255,255,.85);">' + statusText + '</div></div>';
  html += '</div>';

  // ─── Weak topics (the actual "what they need" signal) ───
  html += '<div class="ph-card"><h3>⚠️ Topics Your Child Found Difficult</h3>';
  if(!weakTopics.length){
    html += '<p style="color:rgba(255,255,255,.6);font-size:.88rem;padding:14px;background:rgba(0,0,0,.2);border-radius:10px;text-align:center;">No struggle topics yet — either things are going well, or your child has not taken many quizzes. Encourage them to finish the quiz at the end of each lesson.</p>';
  } else {
    html += '<p style="color:rgba(255,255,255,.7);font-size:.88rem;margin-bottom:12px;">These are topics where your child scored under 60% on the lesson quiz. They are good candidates to revisit together.</p>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    weakTopics.forEach(function(w){
      var pct = Math.round((w.correct / w.total) * 100);
      var dt = w.date ? new Date(w.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : '';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;">'
        + '<div style="background:#ef4444;color:#fff;font-weight:800;font-size:.78rem;padding:4px 8px;border-radius:6px;min-width:42px;text-align:center;">' + pct + '%</div>'
        + '<div style="flex:1;min-width:0;"><div style="font-weight:700;color:#fff;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(w.topic) + '</div>'
        + '<div style="font-size:.72rem;color:rgba(255,255,255,.6);">' + escHtml(w.subj) + ' · ' + dt + '</div></div>'
        + '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">';
    html += '<button onclick="phAddWeakTopicsToSchedule()" class="ph-btn">📅 Add to study schedule</button>';
    html += '<button onclick="phTab(\'counsellor\')" class="ph-btn ph-btn-ghost">💬 Discuss with counsellor</button>';
    html += '</div>';
  }
  html += '</div>';

  document.getElementById('phContent').innerHTML = html;
}

// Build a study schedule from the child's weak topics. One topic per weekday.
function phAddWeakTopicsToSchedule(){
  var sp = (typeof _sessionProgress !== 'undefined') ? _sessionProgress : (window._sessionProgress || {});
  var quizzes = sp.quizResults || [];
  var seen = {};
  var weak = [];
  for(var i = quizzes.length - 1; i >= 0; i--){
    var q = quizzes[i];
    if(!q.total || (q.correct/q.total) >= 0.6) continue;
    var k = (q.subj||'') + '::' + (q.topic||'');
    if(seen[k]) continue;
    seen[k] = true;
    weak.push(q);
    if(weak.length >= 5) break;
  }
  if(!weak.length){
    alert('No weak topics to add yet. Come back after your child has taken a few quizzes.');
    return;
  }
  var days = ['Mon','Tue','Wed','Thu','Fri'];
  var sch = window.LT_PH_STATE.schedule || {};
  for(var d = 0; d < weak.length && d < days.length; d++){
    sch[days[d]] = {
      subject: 'Review: ' + weak[d].topic + ' (' + weak[d].subj + ')',
      time: '16:00'
    };
  }
  window.LT_PH_STATE.schedule = sch;
  phSave();
  alert('Added ' + Math.min(weak.length, 5) + ' weak topics to the weekday schedule. Open Plan → Study Schedule to review.');
  phTab('schedule');
}

function phRenderChildrenList(){
  var s = window.LT_PH_STATE;
  if (s.children.length === 0) {
    return '<div style="padding:24px;text-align:center;color:rgba(255,255,255,.5);font-size:.88rem;background:rgba(0,0,0,.2);border-radius:12px;">No children linked yet. Use their registered email to connect.</div>';
  }
  var html = '';
  for (var i = 0; i < s.children.length; i++) {
    var c = s.children[i];
    var isActive = c.id && c.id === s.activeChildId;
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(0,0,0,.2);border-radius:12px;margin-bottom:8px;'
      + (isActive ? 'border:1px solid rgba(251,191,36,.35);' : 'border:1px solid transparent;') + '">';
    html += '<div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">';
    html += '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f97316);display:flex;align-items:center;justify-content:center;font-weight:900;color:#0a1628;font-size:1.1rem;flex-shrink:0;">' + (c.name ? c.name[0].toUpperCase() : '?') + '</div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;">' + escHtml(c.name);
    if(isActive) html += '<span style="font-size:.65rem;padding:2px 6px;background:rgba(251,191,36,.2);color:#fbbf24;border-radius:100px;font-weight:700;">ACTIVE</span>';
    html += '</div>';
    html += '<div style="font-size:.8rem;color:rgba(255,255,255,.6);">' + escHtml(c.klass) + '</div>';
    if(c.email){
      html += '<div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escHtml(c.email) + '">📧 ' + escHtml(c.email) + '</div>';
    }
    html += '</div></div>';
    html += '<div style="display:flex;gap:6px;flex-shrink:0;">';
    if(!isActive && c.id){
      html += '<button onclick="phSetActiveChild(\'' + c.id + '\',\'dashboard\')" style="background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;">Monitor</button>';
    }
    html += '<button onclick="phRemoveChild(' + i + ')" style="background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);color:#fca5a5;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;">Unlink</button>';
    html += '</div></div>';
  }
  return html;
}

function phAddChild(){
  var emailEl = document.getElementById('phChildEmail');
  var email = emailEl ? emailEl.value.trim().toLowerCase() : '';
  var name = document.getElementById('phChildName').value.trim();
  var klass = document.getElementById('phChildClass').value;

  // Email is the primary link — it must be valid.
  if(!email) return alert('Please enter the email your child used to register.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Please enter a valid email address.');
  // Check for duplicate email.
  var exists = window.LT_PH_STATE.children.some(function(c){ return c.email === email; });
  if(exists) return alert('A child with this email is already linked.');

  if(!name) return alert('Please enter the child\'s name.');

  var id = 'c_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*1000);
  window.LT_PH_STATE.children.push({ id: id, name: name, klass: klass, email: email });
  // First child becomes the active monitoring target automatically.
  if(!window.LT_PH_STATE.activeChildId) window.LT_PH_STATE.activeChildId = id;
  phSave();
  if(emailEl) emailEl.value = '';
  document.getElementById('phChildName').value = '';
  document.getElementById('phChildrenList').innerHTML = phRenderChildrenList();
  // Refresh the deck bar so the new child appears in the switcher immediately.
  phInjectDeckBar();
}

function phRemoveChild(i){
  var removed = window.LT_PH_STATE.children[i];
  window.LT_PH_STATE.children.splice(i, 1);
  // If we just removed the active child, fall back to the first remaining.
  if(removed && window.LT_PH_STATE.activeChildId === removed.id){
    var next = window.LT_PH_STATE.children[0];
    window.LT_PH_STATE.activeChildId = next ? next.id : null;
  }
  phSave();
  document.getElementById('phChildrenList').innerHTML = phRenderChildrenList();
  phInjectDeckBar();
}

// ══════════════ EXAM SCORES ══════════════
function phRenderScores(){
  var html = '';
  html += '<div class="ph-card"><h3>🎯 Log a Mock Exam Score</h3>';
  html += '<p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:18px;">Track every mock exam. Seeing trends helps catch weaknesses early.</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:12px;">';
  html += '<select id="phScoreExam" class="ph-input"><option value="WAEC">WAEC</option><option value="NECO">NECO</option><option value="JAMB">JAMB</option><option value="BECE">BECE</option><option value="Common Entrance">Common Entrance</option><option value="School Test">School Test</option></select>';
  html += '<input id="phScoreSubject" class="ph-input" placeholder="Subject (e.g. Maths)">';
  html += '<input id="phScoreValue" class="ph-input" type="number" min="0" max="100" placeholder="Score (0-100)">';
  html += '<input id="phScoreDate" class="ph-input" type="date">';
  html += '</div><button onclick="phAddScore()" class="ph-btn">Add Score</button></div>';

  html += '<div class="ph-card"><h3>📊 Score History</h3><div id="phScoreList">' + phRenderScoreList() + '</div></div>';

  html += '<div class="ph-card"><h3>💡 Understanding WAEC Grades</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;">';
  var grades = [['A1','75-100%','#10b981','Excellent'],['B2','70-74%','#34d399','Very Good'],['B3','65-69%','#84cc16','Good'],['C4','60-64%','#eab308','Credit'],['C5','55-59%','#f59e0b','Credit'],['C6','50-54%','#f97316','Credit'],['D7','45-49%','#ef4444','Pass'],['E8','40-44%','#dc2626','Pass'],['F9','0-39%','#991b1b','Fail']];
  for (var i = 0; i < grades.length; i++) {
    var g = grades[i];
    html += '<div style="padding:12px;background:' + g[2] + '22;border:1px solid ' + g[2] + ';border-radius:10px;text-align:center;"><div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:1.4rem;font-weight:900;color:' + g[2] + ';">' + g[0] + '</div><div style="font-size:.7rem;color:rgba(255,255,255,.8);font-weight:700;margin-top:2px;">' + g[1] + '</div><div style="font-size:.65rem;color:rgba(255,255,255,.55);margin-top:2px;">' + g[3] + '</div></div>';
  }
  html += '</div>';
  html += '<div style="margin-top:14px;padding:12px;background:rgba(251,191,36,.08);border-left:3px solid #fbbf24;border-radius:0 10px 10px 0;font-size:.85rem;color:rgba(255,255,255,.85);line-height:1.6;">For university: most programmes require 5 credits (C6+) including English and Maths. Medicine typically needs A1s.</div>';
  html += '</div>';

  document.getElementById('phContent').innerHTML = html;
  document.getElementById('phScoreDate').value = new Date().toISOString().split('T')[0];
}

function phRenderScoreList(){
  var s = window.LT_PH_STATE;
  if (s.scores.length === 0) {
    return '<div style="padding:24px;text-align:center;color:rgba(255,255,255,.5);font-size:.88rem;background:rgba(0,0,0,.2);border-radius:12px;">No scores logged yet.</div>';
  }
  function grade(v) {
    var n = parseInt(v);
    if (n >= 75) return { g:'A1', c:'#10b981' };
    if (n >= 70) return { g:'B2', c:'#34d399' };
    if (n >= 65) return { g:'B3', c:'#84cc16' };
    if (n >= 60) return { g:'C4', c:'#eab308' };
    if (n >= 55) return { g:'C5', c:'#f59e0b' };
    if (n >= 50) return { g:'C6', c:'#f97316' };
    if (n >= 45) return { g:'D7', c:'#ef4444' };
    if (n >= 40) return { g:'E8', c:'#dc2626' };
    return { g:'F9', c:'#991b1b' };
  }
  var html = '';
  for (var i = s.scores.length - 1; i >= 0; i--) {
    var score = s.scores[i];
    var gr = grade(score.score);
    html += '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(0,0,0,.2);border-radius:12px;margin-bottom:8px;">';
    html += '<div style="flex-shrink:0;width:56px;height:56px;border-radius:12px;background:' + gr.c + ';color:#fff;display:flex;align-items:center;justify-content:center;font-family:\'Bricolage Grotesque\',sans-serif;font-weight:900;font-size:1.1rem;">' + gr.g + '</div>';
    html += '<div style="flex:1;"><div style="font-weight:800;color:#fff;">' + score.subject + ' <span style="font-size:.78rem;color:rgba(255,255,255,.5);font-weight:500;">· ' + score.exam + '</span></div>';
    html += '<div style="font-size:.8rem;color:rgba(255,255,255,.6);margin-top:2px;">' + score.date + ' · Score: <span style="color:' + gr.c + ';font-weight:800;">' + score.score + '%</span></div></div>';
    html += '<button onclick="phRemoveScore(' + i + ')" style="background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);color:#fca5a5;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;">Remove</button>';
    html += '</div>';
  }
  return html;
}

function phAddScore(){
  var exam = document.getElementById('phScoreExam').value;
  var subject = document.getElementById('phScoreSubject').value.trim();
  var score = parseInt(document.getElementById('phScoreValue').value);
  var date = document.getElementById('phScoreDate').value;
  if (!subject) return alert('Please enter a subject');
  if (isNaN(score) || score < 0 || score > 100) return alert('Score must be 0-100');
  if (!date) return alert('Please enter a date');
  // Tag the score to the active child so the dashboard + AI counsellor can
  // filter per child. Falls back to null (unassigned) if no child added yet.
  var active = phActiveChild();
  window.LT_PH_STATE.scores.push({
    exam: exam, subject: subject, score: score, date: date,
    childId: active ? active.id : null
  });
  phSave();
  document.getElementById('phScoreSubject').value = '';
  document.getElementById('phScoreValue').value = '';
  document.getElementById('phScoreList').innerHTML = phRenderScoreList();
}

function phRemoveScore(i){
  window.LT_PH_STATE.scores.splice(i, 1);
  phSave();
  document.getElementById('phScoreList').innerHTML = phRenderScoreList();
}

// ══════════════ SCHEDULE ══════════════
function phRenderSchedule(){
  var s = window.LT_PH_STATE;
  var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var child = phActiveChild();
  var childName = child ? child.name : 'your child';
  // Pull weak topics from real progress so the parent can see what to build around.
  var sp = phTutorProgress();
  var weakCount = 0;
  try {
    var seenW = {};
    (sp.quizResults || []).forEach(function(r){
      if(r.total && (r.correct/r.total) < 0.6){
        var k = (r.subj||'') + '::' + (r.topic||'');
        if(!seenW[k]){ seenW[k] = true; weakCount++; }
      }
    });
  } catch(e){}

  // Ensure school timetable state exists.
  if(!s.schoolTimetable) s.schoolTimetable = {};

  var html = '';

  // ─── School Timetable section ──────────────────────────────────
  var hasTimetable = Object.keys(s.schoolTimetable).some(function(d){
    return s.schoolTimetable[d] && s.schoolTimetable[d].length > 0;
  });

  html += '<div class="ph-card" style="border:1px solid rgba(59,130,246,.3);background:rgba(59,130,246,.06);">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
  html += '<h3 style="margin:0;">📋 School Timetable</h3>';
  if(hasTimetable){
    html += '<span style="font-size:.72rem;padding:3px 8px;background:rgba(16,185,129,.15);color:#10b981;border-radius:100px;font-weight:700;">✓ Uploaded</span>';
  }
  html += '</div>';
  html += '<p style="color:rgba(255,255,255,.78);font-size:.88rem;margin-bottom:16px;line-height:1.6;">';
  html += hasTimetable
    ? 'The AI uses this to build a home study plan that fills gaps in ' + escHtml(childName) + '\'s school day.'
    : 'Upload ' + escHtml(childName) + '\'s school timetable so the AI can build a home study plan that perfectly complements their school day.';
  html += '</p>';

  if(!hasTimetable){
    // ─── Upload + manual entry options ───
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">';
    // Upload button
    html += '<label class="ph-tt-upload-btn" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;background:rgba(59,130,246,.1);border:2px dashed rgba(59,130,246,.4);border-radius:14px;text-align:center;transition:.18s;">';
    html += '<input type="file" id="phTimetableFile" accept="image/*,.pdf" style="display:none" onchange="phUploadTimetable(this)">';
    html += '<div style="font-size:2rem;">📷</div>';
    html += '<div style="font-weight:800;color:#fff;font-size:.92rem;">Upload photo</div>';
    html += '<div style="font-size:.75rem;color:rgba(255,255,255,.55);">Snap a photo of the school timetable. AI reads it.</div>';
    html += '</label>';
    // Manual entry button
    html += '<button onclick="phShowManualTimetable()" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;background:rgba(251,191,36,.08);border:2px dashed rgba(251,191,36,.3);border-radius:14px;text-align:center;font-family:inherit;color:inherit;transition:.18s;">';
    html += '<div style="font-size:2rem;">✏️</div>';
    html += '<div style="font-weight:800;color:#fff;font-size:.92rem;">Fill in manually</div>';
    html += '<div style="font-size:.75rem;color:rgba(255,255,255,.55);">Type each day\'s subjects.</div>';
    html += '</button>';
    html += '</div>';
    // Hidden manual entry form (revealed by button click)
    html += '<div id="phManualTT" style="display:none;">';
    html += '<div style="font-size:.82rem;color:rgba(255,255,255,.65);margin-bottom:10px;">List each day\'s school subjects, separated by commas.</div>';
    html += '<div style="display:grid;gap:8px;">';
    for(var ti = 0; ti < 5; ti++){
      var td = days[ti]; // Mon-Fri only for school
      html += '<div style="display:grid;grid-template-columns:50px 1fr;gap:10px;align-items:center;">';
      html += '<div style="font-weight:800;color:#3b82f6;font-size:.88rem;">' + td + '</div>';
      html += '<input class="ph-input ph-tt-manual" data-day="' + td + '" placeholder="e.g. Maths, English, Science, Civic Ed">';
      html += '</div>';
    }
    html += '</div>';
    html += '<div style="margin-top:12px;display:flex;gap:8px;">';
    html += '<button onclick="phSaveManualTimetable()" class="ph-btn">Save timetable</button>';
    html += '<button onclick="document.getElementById(\'phManualTT\').style.display=\'none\'" class="ph-btn ph-btn-ghost">Cancel</button>';
    html += '</div></div>';
    // Loading state container (hidden by default)
    html += '<div id="phTTLoading" style="display:none;padding:16px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:12px;text-align:center;color:#93c5fd;">';
    html += '<div style="font-size:1.4rem;margin-bottom:6px;">🤖</div>';
    html += '<div id="phTTLoadingMsg">AI is reading the timetable...</div>';
    html += '</div>';
  } else {
    // ─── Display existing timetable ───
    html += '<div style="display:grid;gap:6px;margin-bottom:14px;">';
    days.forEach(function(d){
      var subjects = s.schoolTimetable[d];
      if(!subjects || !subjects.length) return;
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;background:rgba(0,0,0,.2);border-radius:10px;">';
      html += '<div style="font-weight:800;color:#3b82f6;font-size:.85rem;min-width:36px;padding-top:2px;">' + d + '</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      subjects.forEach(function(sub){
        var label = typeof sub === 'string' ? sub : (sub.subject || sub.name || '?');
        var time = (sub.startTime || sub.time || '');
        html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);border-radius:8px;font-size:.8rem;color:rgba(255,255,255,.85);">';
        html += escHtml(label);
        if(time) html += ' <span style="color:rgba(255,255,255,.45);font-size:.7rem;">' + escHtml(time) + '</span>';
        html += '</span>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += '<label style="cursor:pointer;" class="ph-btn ph-btn-ghost"><input type="file" accept="image/*,.pdf" style="display:none" onchange="phUploadTimetable(this)">📷 Re-upload</label>';
    html += '<button onclick="phEditTimetable()" class="ph-btn ph-btn-ghost">✏️ Edit</button>';
    html += '<button onclick="phClearTimetable()" class="ph-btn ph-btn-ghost" style="color:#fca5a5;">🗑️ Clear</button>';
    html += '</div>';
    // Loading state container (hidden by default)
    html += '<div id="phTTLoading" style="display:none;padding:16px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:12px;text-align:center;color:#93c5fd;margin-top:12px;">';
    html += '<div style="font-size:1.4rem;margin-bottom:6px;">🤖</div>';
    html += '<div id="phTTLoadingMsg">AI is reading the timetable...</div>';
    html += '</div>';
  }
  html += '</div>';

  // ─── Quick-start recommendations row ───
  html += '<div class="ph-card" style="background:linear-gradient(135deg,rgba(251,191,36,.12),rgba(249,115,22,.08));border-color:rgba(251,191,36,.25);">';
  html += '<h3>✨ Build a smart schedule</h3>';
  html += '<p style="color:rgba(255,255,255,.85);font-size:.92rem;margin-bottom:14px;line-height:1.6;">';
  html += hasTimetable
    ? 'The AI now knows ' + escHtml(childName) + '\'s school timetable. It will build a home plan that fills the gaps.'
    : 'Three ways to set up the week. The AI option uses your child\'s real quiz results.';
  html += '</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">';
  html += '<button onclick="phAIRecommendSchedule()" class="ph-btn" style="text-align:left;padding:14px;">'
    + '<div style="font-size:1.2rem;margin-bottom:4px;">🤖 AI Recommended Plan</div>'
    + '<div style="font-size:.78rem;opacity:.85;font-weight:500;">'
    + (hasTimetable ? 'Uses school timetable + ' : '')
    + (weakCount ? weakCount + ' weak topic' + (weakCount>1?'s':'') : 'quiz results')
    + '</div></button>';
  html += '<button onclick="phAutoFillSchedule()" class="ph-btn ph-btn-ghost" style="text-align:left;padding:14px;">'
    + '<div style="font-size:1.2rem;margin-bottom:4px;">⚡ Typical Nigerian Plan</div>'
    + '<div style="font-size:.78rem;opacity:.85;">Maths/English daily, Sci on Tue, Arts on Thu</div>'
    + '</button>';
  html += '<button onclick="phAddWeakTopicsToSchedule()" class="ph-btn ph-btn-ghost" style="text-align:left;padding:14px;">'
    + '<div style="font-size:1.2rem;margin-bottom:4px;">⚠️ Review Weak Topics</div>'
    + '<div style="font-size:.78rem;opacity:.85;">One weak topic per weekday</div>'
    + '</button>';
  html += '</div></div>';

  // ─── Manual schedule builder ───
  html += '<div class="ph-card"><h3>📅 Your Child\'s Weekly Plan</h3>';
  html += '<p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:18px;">Aim for 30-45 minutes weekdays, 1 hour weekends. You can edit any row.</p>';
  html += '<div style="display:grid;gap:12px;">';
  for (var i = 0; i < days.length; i++) {
    var d = days[i];
    var sub = (s.schedule[d] && s.schedule[d].subject) || '';
    var tm = (s.schedule[d] && s.schedule[d].time) || '16:00';
    html += '<div style="display:grid;grid-template-columns:60px 1fr 100px;gap:12px;align-items:center;padding:10px;background:rgba(0,0,0,.2);border-radius:10px;"><div style="font-weight:800;color:#fbbf24;">' + d + '</div><input class="ph-input ph-sch" data-day="' + d + '" placeholder="Subject or topic to study" value="' + sub.replace(/"/g,'&quot;') + '"><input class="ph-input ph-sch-time" data-day="' + d + '" type="time" value="' + tm + '"></div>';
  }
  html += '</div>';
  html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;"><button onclick="phSaveSchedule()" class="ph-btn">💾 Save Schedule</button><button onclick="phClearSchedule()" class="ph-btn ph-btn-ghost">🗑️ Clear</button></div>';
  html += '</div>';

  // ─── Tips ───
  html += '<div class="ph-card"><h3>💡 What works in Nigerian homes</h3>';
  html += '<ul style="color:rgba(255,255,255,.85);line-height:1.7;margin:0;padding-left:20px;font-size:.9rem;">';
  html += '<li><strong>Same time every day.</strong> After a snack, before dinner. Focus becomes automatic.</li>';
  html += '<li><strong>Mix subjects in one session.</strong> 15 min Maths + 15 min English beats 30 min of either.</li>';
  html += '<li><strong>One full day off.</strong> Sunday rest. Retention improves with sleep.</li>';
  html += '<li><strong>Saturday review.</strong> 30-60 min on the week\'s weakest topic.</li>';
  html += '<li><strong>Sit with them for 20 min.</strong> Not teaching — just present. Then leave them to it.</li>';
  html += '</ul></div>';

  document.getElementById('phContent').innerHTML = html;
}

// AI-driven schedule recommendation. Reads the child's real performance and
// asks Claude to build a personalised 7-day plan around the weak topics.
async function phAIRecommendSchedule(){
  var sp = (typeof _sessionProgress !== 'undefined') ? _sessionProgress : (window._sessionProgress || {});
  var quizzes = sp.quizResults || [];

  // Gather signals.
  var weakSeen = {}; var weak = [];
  for(var i = quizzes.length - 1; i >= 0; i--){
    var q = quizzes[i];
    if(!q.total || (q.correct/q.total) >= 0.6) continue;
    var k = (q.subj||'') + '::' + (q.topic||'');
    if(weakSeen[k]) continue;
    weakSeen[k] = true;
    weak.push({ subj: q.subj, topic: q.topic, score: Math.round(q.correct/q.total*100) });
    if(weak.length >= 8) break;
  }
  var strong = (sp.topicsCompletedList || []).slice(-5).map(function(t){ return t.subj + ': ' + t.topic; });
  var child = phActiveChild() || { name:'your child', klass:'' };

  // Show a loading state in the content area.
  var content = document.getElementById('phContent');
  if(content){
    var loader = document.createElement('div');
    loader.id = 'phAILoader';
    loader.style.cssText = 'padding:16px;margin-bottom:14px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:12px;color:#fbbf24;font-size:.9rem;text-align:center';
    loader.innerHTML = '🤖 AI is building a personalised plan based on your child\'s real performance... <span style="opacity:.7">(takes 5-15 seconds)</span>';
    content.insertBefore(loader, content.firstChild);
  }

  // Build the school timetable context if available.
  var tt = window.LT_PH_STATE.schoolTimetable || {};
  var hasTT = Object.keys(tt).some(function(d){ return tt[d] && tt[d].length; });
  var ttContext = '';
  if(hasTT){
    ttContext = '\n\nSCHOOL TIMETABLE (use this to COMPLEMENT, not repeat, school subjects):\n';
    ['Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(d){
      if(!tt[d] || !tt[d].length) return;
      ttContext += d + ': ' + tt[d].map(function(s){ return typeof s === 'string' ? s : (s.subject||''); }).join(', ') + '\n';
    });
    ttContext += '\nIMPORTANT: The home study plan should reinforce subjects that the school covers lightly, focus extra time on weak topics in subjects they DO have at school, and avoid simply repeating what school already covers that day. If Maths is on Monday at school and the student is weak in Maths, Monday home study should focus on the specific Maths topic they are weak in, not generic "Maths".\n';
  }

  var userMsg = 'Build a 7-day HOME STUDY schedule for ' + child.name + ' (' + (child.klass||'Nigerian secondary student') + ').\n\n';
  if(weak.length){
    userMsg += 'Topics they scored below 60% on (PRIORITISE these for review):\n';
    weak.forEach(function(w){ userMsg += '- ' + w.subj + ': ' + w.topic + ' (' + w.score + '%)\n'; });
  } else {
    userMsg += 'No specific weak topics yet — build a balanced general schedule.\n';
  }
  if(strong.length){
    userMsg += '\nTopics they have mastered (do not repeat):\n';
    strong.forEach(function(t){ userMsg += '- ' + t + '\n'; });
  }
  userMsg += ttContext;
  userMsg += '\nReturn ONLY a JSON object in this exact format (no prose, no markdown, no code fences):\n';
  userMsg += '{"Mon":{"subject":"...","time":"16:00"},"Tue":{...},"Wed":{...},"Thu":{...},"Fri":{...},"Sat":{...},"Sun":{...}}\n';
  userMsg += 'Rules: weekdays 30-45 min around 16:00 after school; Saturday 45-60 min for review around 10:00; Sunday is rest day (subject:"Rest day", time:""). Each subject string should be specific (e.g. "Maths: Quadratic equations review" not just "Maths"). Mention the weak topics by name where possible.';

  try {
    var response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: 'You are a Nigerian-context study planner. Return only valid JSON, never prose or markdown.',
        messages: [{ role:'user', content: userMsg }]
      })
    });
    if(!response.ok){
      var errTxt = '';
      try { errTxt = await response.text(); } catch(_){}
      throw new Error('HTTP ' + response.status + (errTxt ? ': ' + errTxt.slice(0,180) : ''));
    }
    var data = await response.json();
    var txt = (data.content && data.content[0] && data.content[0].text) || '';
    // Strip any accidental markdown fences and extract the JSON object.
    txt = txt.replace(/```json|```/g, '').trim();
    var first = txt.indexOf('{'), last = txt.lastIndexOf('}');
    if(first === -1 || last === -1) throw new Error('No JSON object in response');
    var plan = JSON.parse(txt.slice(first, last + 1));
    var validDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var cleaned = {};
    validDays.forEach(function(d){
      if(plan[d] && plan[d].subject){
        cleaned[d] = { subject: String(plan[d].subject).slice(0,140), time: String(plan[d].time || '16:00').slice(0,5) };
      }
    });
    if(!Object.keys(cleaned).length) throw new Error('Plan was empty');
    window.LT_PH_STATE.schedule = cleaned;
    phSave();
    phRenderSchedule();
    setTimeout(function(){
      alert('✨ AI-recommended plan ready! Review and edit any row, then tap Save.');
    }, 150);
  } catch(err){
    var loader2 = document.getElementById('phAILoader');
    if(loader2){
      loader2.style.background = 'rgba(239,68,68,.1)';
      loader2.style.borderColor = 'rgba(239,68,68,.3)';
      loader2.style.color = '#fca5a5';
      loader2.innerHTML = '⚠️ Could not generate AI plan: ' + escHtml(String(err.message||err).slice(0,140)) + '. <button onclick="phAIRecommendSchedule()" style="background:rgba(251,191,36,.2);border:1px solid #fbbf24;color:#fbbf24;padding:4px 10px;border-radius:6px;font-size:.78rem;cursor:pointer;font-family:inherit;margin-left:8px">Try again</button>';
    }
  }
}

function phSaveSchedule(){
  var sch = {};
  document.querySelectorAll('.ph-sch').forEach(function(inp){
    var tm = document.querySelector('.ph-sch-time[data-day="' + inp.dataset.day + '"]').value;
    if (inp.value.trim()) sch[inp.dataset.day] = { subject: inp.value.trim(), time: tm };
  });
  window.LT_PH_STATE.schedule = sch;
  phSave();
  alert('Schedule saved!');
}

function phAutoFillSchedule(){
  window.LT_PH_STATE.schedule = {
    Mon: { subject: 'Maths + English', time: '16:00' },
    Tue: { subject: 'Science (Biology/Physics/Chemistry)', time: '16:00' },
    Wed: { subject: 'Maths + English', time: '16:00' },
    Thu: { subject: 'Arts/Commercial (Literature/Govt/Economics)', time: '16:00' },
    Fri: { subject: 'Past questions practice (30 mins)', time: '16:00' },
    Sat: { subject: 'Weekly review + weak topics (1 hour)', time: '10:00' },
    Sun: { subject: 'Rest day', time: '' }
  };
  phSave();
  phRenderSchedule();
}

function phClearSchedule(){
  if (!confirm('Clear the whole schedule?')) return;
  window.LT_PH_STATE.schedule = {};
  phSave();
  phRenderSchedule();
}

// ══════════════ SCHOOL TIMETABLE ══════════════
// Upload photo → AI vision reads it → structured JSON → saved to state.
// Or fill in manually via simple text inputs per day.

function phShowManualTimetable(){
  var el = document.getElementById('phManualTT');
  if(el) el.style.display = 'block';
  // Pre-fill from existing data if re-editing.
  var tt = window.LT_PH_STATE.schoolTimetable || {};
  document.querySelectorAll('.ph-tt-manual').forEach(function(inp){
    var d = inp.getAttribute('data-day');
    if(tt[d] && tt[d].length){
      inp.value = tt[d].map(function(s){ return typeof s === 'string' ? s : (s.subject || s.name || ''); }).join(', ');
    }
  });
}

function phSaveManualTimetable(){
  var tt = {};
  document.querySelectorAll('.ph-tt-manual').forEach(function(inp){
    var d = inp.getAttribute('data-day');
    var val = inp.value.trim();
    if(!val) return;
    tt[d] = val.split(/[,;]+/).map(function(s){ return s.trim(); }).filter(Boolean).map(function(s){
      return { subject: s };
    });
  });
  if(!Object.keys(tt).length){
    alert('Please enter at least one day\'s subjects.');
    return;
  }
  window.LT_PH_STATE.schoolTimetable = tt;
  phSave();
  phRenderSchedule();
  phInjectDeckBar();
}

function phEditTimetable(){
  // Switch to manual entry mode pre-filled with current timetable.
  // Reset to empty-state view, then show manual form.
  window.LT_PH_STATE._ttEditing = true;
  var saved = window.LT_PH_STATE.schoolTimetable;
  window.LT_PH_STATE.schoolTimetable = {};
  phRenderSchedule();
  phInjectDeckBar();
  // Show manual form and pre-fill.
  var el = document.getElementById('phManualTT');
  if(el) el.style.display = 'block';
  document.querySelectorAll('.ph-tt-manual').forEach(function(inp){
    var d = inp.getAttribute('data-day');
    if(saved[d] && saved[d].length){
      inp.value = saved[d].map(function(s){ return typeof s === 'string' ? s : (s.subject || s.name || ''); }).join(', ');
    }
  });
  // Restore on cancel
  window.LT_PH_STATE.schoolTimetable = saved;
}

function phClearTimetable(){
  if(!confirm('Remove the school timetable?')) return;
  window.LT_PH_STATE.schoolTimetable = {};
  phSave();
  phRenderSchedule();
  phInjectDeckBar();
}

async function phUploadTimetable(input){
  if(!input.files || !input.files[0]) return;
  var file = input.files[0];

  // Validate: images and PDFs only, max 10MB.
  if(!file.type.match(/^image\//) && file.type !== 'application/pdf'){
    alert('Please upload an image (photo, screenshot) or a PDF.');
    input.value = '';
    return;
  }
  if(file.size > 10 * 1024 * 1024){
    alert('File too large. Please keep it under 10 MB.');
    input.value = '';
    return;
  }

  // Show loading state.
  var loader = document.getElementById('phTTLoading');
  var loaderMsg = document.getElementById('phTTLoadingMsg');
  if(loader) loader.style.display = 'block';
  if(loaderMsg) loaderMsg.textContent = 'AI is reading the timetable... (takes 10-20 seconds)';

  // Read file as base64.
  var reader = new FileReader();
  reader.onload = async function(e){
    var dataUrl = e.target.result;
    // dataUrl is like "data:image/jpeg;base64,/9j/4AAQ..."
    var commaIdx = dataUrl.indexOf(',');
    var base64 = dataUrl.slice(commaIdx + 1);
    var mediaType = dataUrl.slice(5, commaIdx).split(';')[0]; // e.g. "image/jpeg"

    var child = phActiveChild();
    var childName = child ? child.name + ' (' + child.klass + ')' : 'the student';

    // Build the vision request for Anthropic.
    var messages = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 }
        },
        {
          type: 'text',
          text: 'This is a photo of a Nigerian school timetable for ' + childName + '.\n\n'
            + 'Extract the weekly timetable as a JSON object. The format must be:\n'
            + '{"Mon":[{"subject":"..."},{"subject":"..."}], "Tue":[...], "Wed":[...], "Thu":[...], "Fri":[...]}\n\n'
            + 'Rules:\n'
            + '- Include ONLY the subject names in each period, in order.\n'
            + '- If you can see times, add them: {"subject":"Maths","startTime":"8:00","endTime":"9:30"}\n'
            + '- If Saturday classes exist, include "Sat".\n'
            + '- Use standard Nigerian subject names (Maths, English, Biology, Chemistry, Physics, Economics, Government, Literature, Civic Education, Computer Studies, etc.).\n'
            + '- Return ONLY the JSON, no markdown, no prose, no code fences.\n'
            + '- If the image is unclear, do your best guess based on common Nigerian school timetables.'
        }
      ]
    }];

    try {
      var response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          system: 'You are a Nigerian school timetable parser. Return only valid JSON.',
          messages: messages
        })
      });
      if(!response.ok){
        var errTxt = '';
        try { errTxt = await response.text(); } catch(_){}
        throw new Error('HTTP ' + response.status + (errTxt ? ': ' + errTxt.slice(0,180) : ''));
      }
      var data = await response.json();
      var txt = (data.content && data.content[0] && data.content[0].text) || '';
      txt = txt.replace(/```json|```/g, '').trim();
      var first = txt.indexOf('{'), last = txt.lastIndexOf('}');
      if(first === -1 || last === -1) throw new Error('AI could not read the timetable from this image. Try a clearer photo.');
      var parsed = JSON.parse(txt.slice(first, last + 1));

      // Normalise: ensure each day is an array of {subject, ...} objects.
      var cleaned = {};
      ['Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(d){
        if(!parsed[d]) return;
        if(!Array.isArray(parsed[d])) return;
        cleaned[d] = parsed[d].map(function(item){
          if(typeof item === 'string') return { subject: item };
          return { subject: item.subject || item.name || '?', startTime: item.startTime || item.time || '', endTime: item.endTime || '' };
        }).filter(function(item){ return item.subject && item.subject !== '?'; });
      });
      if(!Object.keys(cleaned).length) throw new Error('Could not parse any days from the response.');

      window.LT_PH_STATE.schoolTimetable = cleaned;
      phSave();
      phRenderSchedule();
      phInjectDeckBar();
    } catch(err){
      if(loader){
        loader.style.background = 'rgba(239,68,68,.1)';
        loader.style.borderColor = 'rgba(239,68,68,.3)';
        loader.style.color = '#fca5a5';
      }
      if(loaderMsg){
        loaderMsg.innerHTML = '⚠️ ' + escHtml(String(err.message || err).slice(0,180))
          + ' <button onclick="phRenderSchedule();phInjectDeckBar();" style="background:rgba(59,130,246,.2);border:1px solid #3b82f6;color:#93c5fd;padding:4px 10px;border-radius:6px;font-size:.78rem;cursor:pointer;font-family:inherit;margin-left:8px">Try again</button>';
      }
    }
    input.value = ''; // Reset file input so re-selecting same file triggers change.
  };
  reader.readAsDataURL(file);
}

// ══════════════ AI COUNSELLOR ══════════════
function phRenderCounsellor(){
  var active = phActiveChild();
  var html = '';
  html += '<div class="ph-card" style="padding:0;overflow:hidden;">';
  html += '<div style="padding:18px 20px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.08);">';
  html += '<h3 style="margin:0;"><span style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a1628;padding:4px 10px;border-radius:100px;font-size:.72rem;margin-right:8px;">AI</span> Parent Counsellor</h3>';
  // Explicit "Talking about <child>" badge — same source of truth as the
  // deck bar, so the parent always knows what context the AI is using.
  if(active){
    html += '<div style="font-size:.82rem;color:rgba(255,255,255,.85);margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(251,191,36,.14);border:1px solid rgba(251,191,36,.3);border-radius:100px;font-weight:700;color:#fbbf24;font-size:.78rem;">'
      + '🎯 Talking about ' + escHtml(active.name) + ' · ' + escHtml(active.klass) + '</span>'
      + '<span style="font-size:.78rem;color:rgba(255,255,255,.55);">Switch above to discuss another child.</span></div>';
  } else {
    html += '<div style="font-size:.82rem;color:rgba(255,255,255,.6);margin-top:4px;">Add a child above and the AI will tailor every reply to them.</div>';
  }
  html += '</div>';
  html += '<div id="phChatWindow" style="height:400px;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px;">' + phRenderChatHistory() + '</div>';
  html += '<div style="padding:14px 16px;background:rgba(0,0,0,.3);border-top:1px solid rgba(255,255,255,.08);display:flex;gap:8px;">';
  var placeholder = active
    ? 'Ask anything about ' + active.name + '...'
    : 'Ask anything — e.g. My 14-year-old is failing Maths...';
  html += '<input id="phChatInput" class="ph-input" placeholder="' + placeholder.replace(/"/g,'&quot;') + '" onkeydown="if(event.key===\'Enter\')phSendChat()">';
  html += '<button onclick="phSendChat()" class="ph-btn">Send</button>';
  html += '</div></div>';

  html += '<div class="ph-card"><h3>💬 Try asking...</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;" id="phSuggestions">';
  // Personalise suggested prompts when a child is active.
  var qs = active
    ? phSuggestionsFor(active, phTopicTriage())
    : [
        'My 14-year-old wants to drop Maths. What do I do?',
        'How do I handle WAEC failure?',
        'My daughter cries every morning before school',
        'Should my SS2 son switch from Arts to Science?',
        'How much phone time is healthy for a JSS3 student?',
        'My child is being bullied. How do I address it with the school?'
      ];
  for (var i = 0; i < qs.length; i++) {
    html += '<button onclick="phSuggestedAsk(' + i + ')" data-q="' + qs[i].replace(/"/g, '&quot;') + '" class="ph-btn-ghost ph-suggest" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.85);padding:12px;border-radius:10px;font-size:.82rem;cursor:pointer;font-family:inherit;text-align:left;">' + qs[i] + '</button>';
  }
  html += '</div></div>';

  document.getElementById('phContent').innerHTML = html;
  setTimeout(function(){
    var w = document.getElementById('phChatWindow');
    if (w) w.scrollTop = w.scrollHeight;
  }, 100);
}

function phSuggestedAsk(idx){
  var btns = document.querySelectorAll('.ph-suggest');
  if (!btns[idx]) return;
  var q = btns[idx].getAttribute('data-q');
  document.getElementById('phChatInput').value = q;
  phSendChat();
}

function phRenderChatHistory(){
  var chat = window.LT_PH_STATE.counsellorChat;
  if (chat.length === 0) {
    return '<div style="color:rgba(255,255,255,.5);text-align:center;padding:40px 20px;font-size:.9rem;"><div style="font-size:2.4rem;margin-bottom:8px;">👨‍👩‍👧</div>Hello! I\'m your AI parent counsellor, trained on Nigerian family contexts.<br>Ask me anything — exam stress, behaviour, career, wellbeing.<br><span style="font-size:.8rem;opacity:.7;">Everything is confidential.</span></div>';
  }
  var html = '';
  for (var i = 0; i < chat.length; i++) {
    var msg = chat[i];
    var bg = msg.role === 'user' ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'rgba(255,255,255,.06)';
    var color = msg.role === 'user' ? '#0a1628' : '#fff';
    var align = msg.role === 'user' ? 'flex-end' : 'flex-start';
    html += '<div style="align-self:' + align + ';max-width:85%;background:' + bg + ';color:' + color + ';padding:12px 16px;border-radius:16px;font-size:.9rem;line-height:1.6;white-space:pre-wrap;">' + escHtml(msg.content) + '</div>';
  }
  return html;
}

function escHtml(s){
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function phSendChat(){
  var input = document.getElementById('phChatInput');
  var question = input.value.trim();
  if (!question) return;
  input.value = '';
  window.LT_PH_STATE.counsellorChat.push({ role: 'user', content: question });
  phSave();
  var w = document.getElementById('phChatWindow');
  w.innerHTML = phRenderChatHistory() + '<div id="phThinking" style="align-self:flex-start;color:rgba(255,255,255,.5);padding:8px 16px;font-size:.85rem;">Thinking...</div>';
  w.scrollTop = w.scrollHeight;

  // Sanitise the messages array before sending to Anthropic, which requires:
  //   1. The first message must be role:'user'
  //   2. Roles must alternate user/assistant/user/assistant
  //   3. No empty content
  // If a previous turn errored, we'd have two consecutive 'user' messages and
  // every retry would 400 forever. This builds a clean alternating history.
  function buildCleanHistory(){
    var raw = (window.LT_PH_STATE.counsellorChat || []).filter(function(m){
      return m && m.content && String(m.content).trim().length > 0;
    });
    // Drop leading assistant messages so the first one is 'user'.
    while(raw.length && raw[0].role !== 'user') raw.shift();
    var clean = [];
    var expect = 'user';
    for(var i = 0; i < raw.length; i++){
      if(raw[i].role === expect){
        clean.push({ role: raw[i].role, content: String(raw[i].content) });
        expect = (expect === 'user') ? 'assistant' : 'user';
      }
      // If a role is skipped (e.g. two users in a row from a prior failure),
      // we just drop the duplicate to restore alternation.
    }
    // Final message must be 'user' for the API to accept the request.
    if(!clean.length || clean[clean.length - 1].role !== 'user'){
      clean.push({ role: 'user', content: question });
    }
    return clean;
  }

  // Build a focused context preamble for the AI. The CRITICAL change here:
  // we narrow to the ACTIVE child only. Without this the model gets a
  // generic family blob and can't reason about "what should I do about
  // *Ada* specifically?". Other siblings are mentioned in a single line
  // (existence + class) so the AI knows the family shape without confusing
  // their data with the active child's.
  function buildContextPreamble(){
    var s = window.LT_PH_STATE;
    var active = phActiveChild();
    var bits = [];
    if(active){
      bits.push('The parent is asking about ' + active.name + ', who is in ' + active.klass + '. Refer to them by name. Tailor every recommendation to ' + active.name + '\'s class level.');
      var scores = phScoresFor(active.id);
      if(scores.length){
        var recent = scores.slice(-6).map(function(sc){
          return sc.exam + ' ' + sc.subject + ': ' + sc.score + '%' + (sc.date ? ' (' + sc.date + ')' : '');
        }).join('; ');
        bits.push(active.name + '\'s recent mock-exam scores: ' + recent + '.');
      }
      // Other children — name + class only, NOT their scores. Keeps the
      // AI aware of the family without polluting the active-child context.
      var others = s.children.filter(function(c){ return c.id !== active.id; });
      if(others.length){
        bits.push('Other children in the family (do not mix their data with ' + active.name + '\'s unless explicitly asked): ' +
          others.map(function(c){ return c.name + ' (' + c.klass + ')'; }).join(', ') + '.');
      }
      // Live tutor signal — assume single-device family so this child is
      // the one using the tutor. Honest hedge in the wording.
      try {
        var sp = window._sessionProgress;
        if(sp && sp.quizResults && sp.quizResults.length){
          var weak = sp.quizResults
            .filter(function(r){ return r.total && (r.correct/r.total) < 0.6; })
            .slice(-4)
            .map(function(r){ return r.topic + ' (' + r.subj + ', ' + Math.round((r.correct/r.total)*100) + '%)'; });
          if(weak.length){
            bits.push('Topics from the tutor on this device where ' + active.name + ' scored below 60%: ' + weak.join(', ') + '.');
          }
          var wk = phWeekActivity();
          bits.push('This-week tutor activity on this device: ' + wk.activeDays + ' of 7 days, ' + wk.total + ' total minutes.');
        }
      } catch(e){}
    } else if(s.children && s.children.length){
      // No active child somehow — fall back to a brief family list.
      bits.push('Children in this parent\'s account: ' +
        s.children.map(function(c){ return c.name + ' (' + c.klass + ')'; }).join(', ') + '.');
    }
    return bits.length
      ? ('CONTEXT (use silently — do not list it back to the parent):\n' + bits.join('\n'))
      : '';
  }

  try {
    var systemPrompt = 'You are an AI parent counsellor trained specifically for Nigerian families. You understand the Nigerian education system (WAEC, NECO, JAMB, BECE), cultural dynamics, extended family expectations, faith-based households, and the realities of raising children in Nigeria. Give warm, practical, specific advice. Be direct but kind. Reference Nigerian examples when helpful. Never be preachy. Answer in 2-4 short paragraphs. Use plain English — parents may not be highly tech-savvy. If the parent seems distressed, acknowledge their feelings first before giving advice.';
    var preamble = buildContextPreamble();
    if(preamble) systemPrompt += '\n\n' + preamble;

    var cleanMessages = buildCleanHistory();

    var response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: cleanMessages
      })
    });
    if(!response.ok){
      var errText = '';
      try { errText = await response.text(); } catch(_){}
      throw new Error('HTTP ' + response.status + (errText ? ': ' + errText.slice(0,200) : ''));
    }
    var data = await response.json();
    var reply = (data.content && data.content[0] && data.content[0].text) || 'Sorry, I could not respond right now. Please try again.';
    window.LT_PH_STATE.counsellorChat.push({ role: 'assistant', content: reply });
    phSave();
    w.innerHTML = phRenderChatHistory();
    w.scrollTop = w.scrollHeight;
  } catch (err) {
    // Remove the orphan user message we just pushed, so the history stays
    // valid for the next attempt rather than locking into a broken state.
    try {
      var hist = window.LT_PH_STATE.counsellorChat;
      if(hist.length && hist[hist.length - 1].role === 'user' && hist[hist.length - 1].content === question){
        hist.pop();
        phSave();
      }
    } catch(_){}
    var el = document.getElementById('phThinking');
    var msg = '⚠️ Could not reach the counsellor. ' + (err && err.message ? '<span style="opacity:.6;font-size:.78rem">(' + escHtml(err.message.slice(0,120)) + ')</span>' : '') + ' <button onclick="document.getElementById(\'phChatInput\').value=\'' + escHtml(question).replace(/'/g,'&#39;') + '\';phSendChat();" style="background:rgba(251,191,36,.2);border:1px solid #fbbf24;color:#fbbf24;padding:4px 10px;border-radius:6px;font-size:.78rem;cursor:pointer;font-family:inherit;margin-left:8px">Try again</button>';
    if (el) el.innerHTML = msg;
    else {
      var w2 = document.getElementById('phChatWindow');
      if(w2) w2.innerHTML = phRenderChatHistory() + '<div style="align-self:flex-start;color:#fca5a5;padding:8px 16px;font-size:.85rem;">' + msg + '</div>';
    }
  }
}

// ══════════════ TEMPLATES ══════════════
function phRenderTemplates(){
  var templates = [
    { cat: 'For Teachers', icon: '👩‍🏫', items: [
      { title: 'Request a parent-teacher meeting',
        text: "Dear Mrs/Mr [Teacher's name],\n\nGood day. I am [Your name], parent of [Child's name] in [Class]. I would like to request a brief meeting at your convenience to discuss my child's progress in [subject].\n\nPlease let me know a suitable time this week or next.\n\nThank you for your dedication to our children.\n\nKind regards,\n[Your name]\n[Phone number]" },
      { title: 'Ask about a specific weak subject',
        text: "Dear [Teacher's name],\n\nI hope this message finds you well. My child [Name] in [Class] has been struggling with [specific topic/subject]. Could you advise:\n\n1. What specific areas need the most work?\n2. What can we practise at home?\n3. Are there additional resources you recommend?\n\nWe are willing to put in the work at home — we just need your guidance on where to focus.\n\nThank you.\n\nWarm regards,\n[Your name]" },
      { title: 'Explain an absence',
        text: "Dear [Teacher's name],\n\nPlease accept my apology for [Child's name]'s absence from school on [date/dates]. This was due to [reason — illness, family emergency, etc.].\n\n[Child's name] will resume on [date] and will catch up on missed work. Please let me know what she/he needs to complete.\n\nThank you for your understanding.\n\nRegards,\n[Your name]" }
    ]},
    { cat: 'For Children', icon: '👨‍👩‍👧', items: [
      { title: 'Encouragement after a bad test',
        text: "[Child's name],\n\nI heard about your test score. I want you to know — one test does not define you. What matters is what we do next.\n\nLet's look at it together this weekend. Not to scold — to understand. Which questions were hardest? What confused you? With that information, we can plan how to improve.\n\nI am proud of you for trying, and I am in this with you. We will fix this.\n\nLove,\n[Parent]" },
      { title: 'Preparing them for WAEC season',
        text: "My dear [Child's name],\n\nWAEC is coming. I know there is pressure — from school, from relatives, from everyone saying 'do well'. I just want to say one thing: your best is enough.\n\nYour value is not a grade. Whether you score A1 or struggle, you are still my child, still brilliant, still loved. All I ask is that you give your honest best effort — study consistently, rest well, eat well, pray if that helps.\n\nWhatever the result, we will handle it together. I am proud of you already.\n\nLove always,\n[Parent]" }
    ]},
    { cat: 'For School Admin', icon: '🏫', items: [
      { title: 'Report a bullying concern',
        text: "Dear [Principal/Head Teacher],\n\nI am writing with concern. My child [Name] in [Class] has reported [brief description of incident] happening at school. This has been ongoing for [duration] and is affecting her/his wellbeing and attendance.\n\nI would appreciate:\n1. An investigation into the matter\n2. A meeting to discuss how the school will respond\n3. Updates on the outcome\n\nI know the school takes child safety seriously, and I am confident we can address this together.\n\nSincerely,\n[Your name]\n[Phone number]" },
      { title: 'Request school records/report',
        text: "Dear [School Administrator],\n\nGood day. I am writing to formally request a copy of [Child's name, Class]'s academic records, including:\n\n- Previous term report cards\n- Current continuous assessment scores\n- Any additional notes from class teachers\n\nThese are needed for [reason — transfer, application, etc.]. I can collect them at your convenience.\n\nThank you for your assistance.\n\nRegards,\n[Your name]" }
    ]}
  ];

  var html = '';
  html += '<div class="ph-card"><h3>✉️ Communication Templates</h3>';
  html += '<p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:0;">Ready-made templates. Click any to expand, then copy to clipboard.</p></div>';

  for (var c = 0; c < templates.length; c++) {
    var cat = templates[c];
    html += '<div class="ph-card"><h3>' + cat.icon + ' ' + cat.cat + '</h3><div style="display:grid;gap:10px;">';
    for (var t = 0; t < cat.items.length; t++) {
      var item = cat.items[t];
      html += '<div style="background:rgba(0,0,0,.2);border-radius:12px;overflow:hidden;">';
      html += '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer;" onclick="phToggleTpl(this)">';
      html += '<div style="font-weight:700;color:#fff;font-size:.92rem;">' + item.title + '</div>';
      html += '<div class="arrow" style="color:#fbbf24;transition:transform .2s;">▼</div>';
      html += '</div>';
      html += '<div class="tpl-body" style="display:none;padding:0 16px 16px;">';
      html += '<pre style="background:rgba(0,0,0,.4);border-radius:10px;padding:14px 16px;color:rgba(255,255,255,.9);font-size:.85rem;line-height:1.65;white-space:pre-wrap;font-family:inherit;margin:0 0 10px;max-height:300px;overflow-y:auto;">' + escHtml(item.text) + '</pre>';
      html += '<button onclick="phCopyTpl(this)" class="ph-btn" style="width:100%;">Copy to Clipboard</button>';
      html += '</div></div>';
    }
    html += '</div></div>';
  }
  document.getElementById('phContent').innerHTML = html;
}

function phToggleTpl(head){
  var body = head.nextElementSibling;
  var arrow = head.querySelector('.arrow');
  var show = body.style.display !== 'block';
  body.style.display = show ? 'block' : 'none';
  if (arrow) arrow.style.transform = show ? 'rotate(180deg)' : 'rotate(0)';
}

function phCopyTpl(btn){
  var pre = btn.parentElement.querySelector('pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(function(){
    btn.textContent = '✓ Copied!';
    setTimeout(function(){ btn.textContent = '📋 Copy to Clipboard'; }, 1500);
  }).catch(function(){
    // Fallback for browsers without clipboard API
    var ta = document.createElement('textarea');
    ta.value = pre.textContent;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); btn.textContent = '✓ Copied!'; } catch(e) { btn.textContent = 'Copy failed'; }
    document.body.removeChild(ta);
    setTimeout(function(){ btn.textContent = '📋 Copy to Clipboard'; }, 1500);
  });
}

// ══════════════ WELLBEING ══════════════
function phRenderWellbeing(){
  var checks = [
    { cat: 'Physical', icon: '💪', color: '#10b981', items: [
      'Eating regularly (3 meals + 1-2 snacks a day)?',
      'Sleeping 8-10 hours (primary) or 7-9 hours (secondary)?',
      'Active — walking, playing, physical movement daily?',
      'No unexplained weight loss or gain in the past month?',
      'No persistent headaches, stomach aches, or fatigue?'
    ]},
    { cat: 'Emotional', icon: '❤️', color: '#f97316', items: [
      'Generally in a good mood most days?',
      'Laughing, talking, engaged at home?',
      'Sharing things about school without prompting?',
      'Managing frustration without extreme reactions?',
      'No mentions of self-harm or hopelessness?'
    ]},
    { cat: 'Social', icon: '👥', color: '#3b82f6', items: [
      'Has at least 1-2 close friends?',
      'Mentions friends when talking about school?',
      'Participates in school/church/community activities?',
      'Gets along with siblings (most of the time)?',
      'No reports of bullying (as victim or perpetrator)?'
    ]},
    { cat: 'Academic', icon: '📚', color: '#a78bfa', items: [
      'Attending school regularly without resistance?',
      'Completing homework most days?',
      'Talks positively (or neutrally) about teachers?',
      'Scores are stable or improving across subjects?',
      'Shows interest in at least one subject?'
    ]},
    { cat: 'Digital', icon: '📱', color: '#ec4899', items: [
      'Phone use under control — not 6+ hours/day?',
      'Not hiding screen from parents?',
      'No signs of cyberbullying or strangers messaging?',
      'Balanced — uses phone AND reads/plays/goes outside?',
      'Sleeping without phone in bed?'
    ]}
  ];

  var html = '';
  html += '<div class="ph-card"><h3>❤️ Child Wellbeing Check</h3>';
  html += '<p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:0;">Weekly check-in. Tick what\'s true. Anything unticked is a conversation starter — not a crisis.</p></div>';

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">';
  for (var c = 0; c < checks.length; c++) {
    var cat = checks[c];
    html += '<div class="ph-card" style="border-left:4px solid ' + cat.color + ';">';
    html += '<h3 style="margin-bottom:12px;"><span style="color:' + cat.color + ';">' + cat.icon + '</span> ' + cat.cat + '</h3>';
    html += '<div style="display:grid;gap:8px;">';
    for (var i = 0; i < cat.items.length; i++) {
      html += '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:8px;border-radius:8px;"><input type="checkbox" style="width:18px;height:18px;accent-color:' + cat.color + ';cursor:pointer;flex-shrink:0;margin-top:1px;"><span style="font-size:.88rem;color:rgba(255,255,255,.88);line-height:1.5;">' + cat.items[i] + '</span></label>';
    }
    html += '</div></div>';
  }
  html += '</div>';

  html += '<div class="ph-card" style="background:linear-gradient(135deg,rgba(220,38,38,.1),rgba(251,146,60,.1));border:1px solid rgba(220,38,38,.25);">';
  html += '<h3 style="color:#fca5a5;">🚨 When to seek help immediately</h3>';
  html += '<ul style="color:rgba(255,255,255,.88);line-height:1.7;margin:0;padding-left:20px;font-size:.9rem;">';
  html += '<li>Talking about death, self-harm, or feeling worthless</li>';
  html += '<li>Sudden personality changes lasting more than 2 weeks</li>';
  html += '<li>Refusing to eat or extreme weight loss</li>';
  html += '<li>Withdrawal from all friends and activities</li>';
  html += '<li>Aggressive behaviour that is new or escalating</li>';
  html += '<li>Reports or signs of abuse (from anyone)</li>';
  html += '</ul>';
  html += '<p style="color:rgba(255,255,255,.75);font-size:.88rem;margin:14px 0 0;"><strong>Contact:</strong> Your child\'s doctor, a school counsellor, or MANI helpline (<a href="tel:08091116264" style="color:#fbbf24;">0809 111 6264</a>). Talk to a qualified counsellor.</p>';
  html += '</div>';

  document.getElementById('phContent').innerHTML = html;
}

// ══════════════ ADVICE / GUIDES ══════════════
window.LT_PARENT = {
  academic: {
    title: 'Academic Support', icon: '📚', color: '#7c3aed',
    sections: [
      { h: 'Set a daily study routine', p: '30-45 minutes daily beats 4 hours on weekends. Suggest: 15 min lesson on Lesson Teacher, 15 min practice questions, 10 min reviewing wrong answers. Same time every day.' },
      { h: 'Check exam scores, not just grades', p: 'After every mock, ask: "Which subject today? What was your score? Which questions did you get wrong and why?" This beats asking "Did you read today?"' },
      { h: 'Communicate with teachers constructively', p: 'Visit the school once a term. Come with specific questions: "What is his weakest topic? What can we practise at home?" Teachers respond to engaged parents.' },
      { h: 'Match the energy to the age', p: 'Primary: direct supervision. JSS: accountability — ask daily. SS: autonomy with weekly check-ins.' }
    ]
  },
  exam: {
    title: 'Exam Pressure', icon: '📝', color: '#dc2626',
    sections: [
      { h: 'Things to say during WAEC season', p: '"I know you are working hard." "Take a break if you are tired." "One bad day does not define you." "I am proud of your effort."' },
      { h: 'Things NOT to say', p: '"If you fail, you will disgrace this family." "Your cousin got 9 A1s, why can\'t you?" Fear-based studying lowers retention. Children freeze when self-worth is tied to scores.' },
      { h: 'Physical environment matters', p: 'Quiet study space. Good lighting. Feed them before sessions, not after. Let them watch 30 min of something fun after 2 hours of study.' },
      { h: 'After the exam — whatever the result', p: 'If they pass: celebrate effort, not just outcome. If they fail: listen first, solution second. A single exam does not determine their life.' }
    ]
  },
  career: {
    title: 'Career & Stream', icon: '🎯', color: '#059669',
    sections: [
      { h: 'Science vs Arts vs Commercial', p: 'Do not force Science for prestige. Identify strengths early. Arts leads to Law, Mass Comm. Commercial leads to Accounting, Banking. Science for those who love Maths.' },
      { h: 'JAMB subject combinations', p: 'Medicine: English + Biology + Chemistry + Physics. Law: English + Literature + Government + CRK/IRK. Engineering: English + Maths + Physics + Chemistry.' },
      { h: 'Universities beyond UNILAG, UI, OAU', p: 'Consider state universities (LASU, RSU, UNILORIN), private (Covenant, Babcock, Pan-Atlantic) and polytechnics (Yabatech, Auchi). HND is not a downgrade.' },
      { h: 'Alternative paths', p: 'Tech bootcamps, professional certifications (ICAN, ACCA), trade schools, apprenticeships. Multiple paths lead to dignified work.' }
    ]
  },
  behaviour: {
    title: 'Behaviour & Discipline', icon: '🧠', color: '#0891b2',
    sections: [
      { h: 'Discipline that builds, not breaks', p: 'Remove privileges, not dignity. Never discipline in anger — cool off first. Explain why. Children obey reasons, not rules.' },
      { h: 'Exam season moodiness is normal', p: 'Teenagers under pressure become irritable, quiet, hungry at strange hours. This is stress response, not disrespect. Respond with more patience.' },
      { h: 'Secondary school identity shifts', p: 'Your SS2 child questions everything. This is healthy. Engage: "Why do you think that?" Avoid "Because I said so."' },
      { h: 'When to seek help', p: 'Weight loss, worthlessness, withdrawal, aggression, self-harm — signs of depression/anxiety. Talk to a counsellor.' }
    ]
  },
  screen: {
    title: 'Screen Time & Safety', icon: '📱', color: '#f59e0b',
    sections: [
      { h: 'How much screen time?', p: 'Primary: 1 hour entertainment + educational. JSS: 2 hours entertainment. SS: 2-3 hours + unlimited academic. No screens at dinner or bed.' },
      { h: 'Social media', p: 'Under 13: no independent accounts. JSS: supervised. SS: trusted but taught online permanence.' },
      { h: 'Online safety conversation', p: 'Never meet strangers. Never share school/home address. Tell a parent immediately if an adult online makes them uncomfortable — no punishment for reporting.' },
      { h: 'Productive internet use', p: 'Lesson Teacher for academics. YouTube for tutorials. Wikipedia for research. Khan Academy for Maths/Science. Codecademy for coding.' }
    ]
  }
};

function phRenderAdvice(){
  var guides = [
    { key: 'academic', title: 'Academic Support', icon: '📚', color: '#7c3aed' },
    { key: 'exam', title: 'Exam Pressure', icon: '📝', color: '#dc2626' },
    { key: 'career', title: 'Career & Stream', icon: '🎯', color: '#059669' },
    { key: 'behaviour', title: 'Behaviour & Discipline', icon: '🧠', color: '#0891b2' },
    { key: 'screen', title: 'Screen Time & Safety', icon: '📱', color: '#f59e0b' }
  ];

  var html = '<div class="ph-card"><h3>📚 Parenting Guides</h3>';
  html += '<p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:0;">In-depth guidance for the big topics.</p></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">';
  for (var i = 0; i < guides.length; i++) {
    var g = guides[i];
    html += '<div onclick="parentOpen(\'' + g.key + '\')" class="ph-card" style="cursor:pointer;border-top:4px solid ' + g.color + ';">';
    html += '<div style="font-size:2rem;margin-bottom:10px;">' + g.icon + '</div>';
    html += '<h3 style="margin-bottom:6px;">' + g.title + '</h3>';
    html += '<div style="color:rgba(255,255,255,.6);font-size:.85rem;">Read the full guide →</div>';
    html += '</div>';
  }
  html += '</div>';
  html += '<div id="parentContent" style="margin-top:24px;"></div>';

  document.getElementById('phContent').innerHTML = html;
}

function parentOpen(key){
  var d = window.LT_PARENT[key];
  if (!d) return;
  var container = document.getElementById('parentContent');
  if (!container) return;
  container.style.display = 'block';
  var html = '<div class="ph-card">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><span style="font-size:2rem;">' + d.icon + '</span>';
  html += '<h2 style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:1.5rem;font-weight:900;margin:0;color:#fff;">' + d.title + '</h2></div>';
  for (var i = 0; i < d.sections.length; i++) {
    var s = d.sections[i];
    html += '<div style="margin-bottom:20px;padding-left:14px;border-left:3px solid ' + d.color + ';">';
    html += '<h3 style="color:#fbbf24;font-family:\'Bricolage Grotesque\',sans-serif;font-size:1rem;font-weight:800;margin:0 0 8px;">' + s.h + '</h3>';
    html += '<p style="color:rgba(255,255,255,.88);font-size:.92rem;line-height:1.7;margin:0;">' + s.p + '</p>';
    html += '</div>';
  }
  html += '<button onclick="document.getElementById(\'parentContent\').style.display=\'none\';window.scrollTo({top:0,behavior:\'smooth\'})" class="ph-btn ph-btn-ghost" style="margin-top:10px;">← Back to topics</button>';
  html += '</div>';
  container.innerHTML = html;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Auto-load dashboard when Parent Hub opens
(function(){
  var observer = new MutationObserver(function(){
    var page = document.getElementById('pg-parent');
    if (page && page.classList.contains('active')) {
      // Build the grouped navigation shell (replaces 8 flat tabs).
      phBuildNav();
      var phContent = document.getElementById('phContent');
      if (phContent && !phContent.innerHTML) {
        phTab('dashboard');
      }
    }
  });
  if (document.body) {
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }
})();
