/* ════════════════════════════════════════════════════════════════
   SUPABASE — auth + cloud data sync for Lesson Teacher
   ────────────────────────────────────────────────────────────────
   Drop-in replacement for firebase-0.js. Exposes the same globals:
     window.LTAuth   — sign up / sign in / sign out / current user
     window.LTCloud  — read/write helpers for Supabase tables
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var LT_LOG = function(){
  if (window.LT_DEBUG_FIREBASE) {
    try { console.log.apply(console, ['[LT-SB]'].concat([].slice.call(arguments))); } catch(e){}
  }
};

var cfg = window.LT_SUPABASE_CONFIG;
var hasConfig = !!(cfg && cfg.url && cfg.anonKey);

// ── Public API placeholder (no-ops until Supabase loads) ──
var LTAuth = {
  ready: false,
  user: null,
  _listeners: [],
  onChange: function(fn){
    this._listeners.push(fn);
    try { fn(this.user); } catch(e){}
  },
  _emit: function(){
    var u = this.user;
    this._listeners.forEach(function(fn){ try { fn(u); } catch(e){} });
  },
  signUp: function(){ return Promise.reject(new Error('Supabase not configured')); },
  signIn: function(){ return Promise.reject(new Error('Supabase not configured')); },
  signInWithGoogle: function(){ return Promise.reject(new Error('Supabase not configured')); },
  signOut: function(){ return Promise.resolve(); },
  resetPassword: function(){ return Promise.reject(new Error('Supabase not configured')); },
  isSignedIn: function(){ return !!this.user; },
  uid: function(){ return this.user ? this.user.uid : null; }
};

var LTCloud = {
  ready: false,
  saveProfile: function(){ return Promise.resolve(); },
  loadProfile: function(){ return Promise.resolve(null); },
  saveProgress: function(){ return Promise.resolve(); },
  loadProgress: function(){ return Promise.resolve(null); },
  saveParentState: function(){ return Promise.resolve(); },
  loadParentState: function(){ return Promise.resolve(null); },
  linkChildByEmail: function(){ return Promise.reject(new Error('Supabase not configured')); },
  unlinkChild: function(){ return Promise.resolve(); },
  listLinkedChildren: function(){ return Promise.resolve([]); },
  fetchChildProgress: function(){ return Promise.resolve(null); },
  saveSocialProfile: function(){ return Promise.resolve(); },
  loadSocialProfile: function(){ return Promise.resolve(null); },
  listAllSocialProfiles: function(){ return Promise.resolve([]); },
  saveArenaProfile: function(){ return Promise.resolve(); },
  loadArenaProfile: function(){ return Promise.resolve(null); },
  publishMatch: function(){ return Promise.resolve(); },
  topLeaders: function(){ return Promise.resolve([]); }
};

window.LTAuth  = LTAuth;
window.LTCloud = LTCloud;

if (!hasConfig){
  LT_LOG('No Supabase config — running in localStorage-only mode');
  try { window.dispatchEvent(new CustomEvent('lt-firebase-ready', { detail:{ enabled:false } })); } catch(e){}
  return;
}

// ───────────────────────────────────────────────────────────────
// 1. LOAD SUPABASE SDK + INIT
// ───────────────────────────────────────────────────────────────
var ready = (async function(){
  try {
    var mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    var supabase = mod.createClient(cfg.url, cfg.anonKey);
    window._ltSupabase = supabase;

    // ───────────────────────────────────────────────────────────
    // 2. AUTH
    // ───────────────────────────────────────────────────────────
    function mapUser(sbUser){
      if (!sbUser) return null;
      return {
        uid: sbUser.id,
        email: sbUser.email || '',
        displayName: (sbUser.user_metadata && sbUser.user_metadata.full_name) ||
                     (sbUser.user_metadata && sbUser.user_metadata.name) || ''
      };
    }

    supabase.auth.onAuthStateChange(function(event, session){
      var sbUser = session ? session.user : null;
      LTAuth.user = mapUser(sbUser);
      LTAuth._emit();
      if (sbUser){
        cloudHydrate().catch(function(e){ LT_LOG('hydrate fail', e); });
      }
    });

    // Seed from existing session
    var { data: { session: initSession } } = await supabase.auth.getSession();
    if (initSession){
      LTAuth.user = mapUser(initSession.user);
      LTAuth._emit();
    }

    LTAuth.ready = true;

    LTAuth.signUp = async function(email, password, profile){
      profile = profile || {};
      var { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: profile.name || '' } }
      });
      if (error) throw error;

      // If email confirmation is enabled, data.user may be null until confirmed.
      if (!data.user) {
        throw { message: 'Check your email for a confirmation link, then sign in.', code: 'email_confirm' };
      }
      var uid = data.user.id;

      await supabase.from('profiles').upsert({
        id: uid,
        email: email,
        role: profile.role || 'student',
        name: profile.name || '',
        section: profile.section || '',
        class_level: profile.classLevel || '',
        stream: profile.stream || '',
        school: profile.school || '',
        state: profile.state || ''
      });

      await supabase.from('social_profiles').upsert({
        user_id: uid,
        name: profile.name || '',
        avatar: profile.avatar || '🦁',
        class_group: classGroupFor(profile.section, profile.classLevel),
        school: profile.school || '',
        state: profile.state || '',
        fav: [],
        bio: profile.bio || '',
        joined_at: Date.now()
      });

      return mapUser(data.user);
    };

    LTAuth.signIn = async function(email, password){
      var { data, error } = await supabase.auth.signInWithPassword({
        email: email, password: password
      });
      if (error) throw error;
      return mapUser(data.user);
    };

    LTAuth.signInWithGoogle = async function(rolePreference){
      var { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;
      return null; // OAuth always redirects
    };

    LTAuth.signOut = async function(){
      await supabase.auth.signOut();
    };

    LTAuth.resetPassword = async function(email){
      var { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      if (error) throw error;
    };

    // ───────────────────────────────────────────────────────────
    // 3. CLOUD HELPERS
    // ───────────────────────────────────────────────────────────
    function classGroupFor(section, classLevel){
      if (section === 'kids' || section === 'primary') return 'kids';
      if (section === 'jss')  return 'juniors';
      if (section === 'sss')  return 'seniors';
      var c = (classLevel||'').toUpperCase();
      if (c.indexOf('JSS') === 0) return 'juniors';
      if (c.indexOf('SS')  === 0) return 'seniors';
      if (c.indexOf('P')   === 0) return 'kids';
      return 'seniors';
    }

    LTCloud.ready = true;
    LTCloud.classGroupFor = classGroupFor;

    // ── Profile ──
    LTCloud.saveProfile = async function(patch){
      var uid = LTAuth.uid(); if (!uid) return;
      var row = Object.assign({ id: uid, updated_at: new Date().toISOString() }, profileToRow(patch || {}));
      await supabase.from('profiles').upsert(row);
    };
    LTCloud.loadProfile = async function(){
      var uid = LTAuth.uid(); if (!uid) return null;
      var { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
      return data ? rowToProfile(data) : null;
    };

    function profileToRow(p){
      var r = {};
      if (p.name !== undefined)       r.name = p.name;
      if (p.email !== undefined)      r.email = p.email;
      if (p.role !== undefined)       r.role = p.role;
      if (p.section !== undefined)    r.section = p.section;
      if (p.classLevel !== undefined) r.class_level = p.classLevel;
      if (p.stream !== undefined)     r.stream = p.stream;
      if (p.school !== undefined)     r.school = p.school;
      if (p.state !== undefined)      r.state = p.state;
      if (p.needsOnboarding !== undefined) r.needs_onboarding = p.needsOnboarding;
      return r;
    }
    function rowToProfile(r){
      return {
        uid: r.id, email: r.email, role: r.role, name: r.name,
        section: r.section, classLevel: r.class_level, stream: r.stream,
        school: r.school, state: r.state, needsOnboarding: r.needs_onboarding,
        createdAt: r.created_at, updatedAt: r.updated_at
      };
    }

    // ── Student progress ──
    LTCloud.saveProgress = async function(progress){
      var uid = LTAuth.uid(); if (!uid) return;
      await supabase.from('user_progress').upsert({
        user_id: uid,
        data: progress || {},
        updated_at: new Date().toISOString()
      });
    };
    LTCloud.loadProgress = async function(){
      var uid = LTAuth.uid(); if (!uid) return null;
      var { data } = await supabase.from('user_progress').select('data').eq('user_id', uid).single();
      return data ? data.data : null;
    };

    // ── Parent hub state ──
    LTCloud.saveParentState = async function(state){
      var uid = LTAuth.uid(); if (!uid) return;
      await supabase.from('parent_state').upsert({
        user_id: uid,
        data: state || {},
        updated_at: new Date().toISOString()
      });
    };
    LTCloud.loadParentState = async function(){
      var uid = LTAuth.uid(); if (!uid) return null;
      var { data } = await supabase.from('parent_state').select('data').eq('user_id', uid).single();
      return data ? data.data : null;
    };

    // ── Parent ↔ child links ──
    LTCloud.linkChildByEmail = async function(childEmail){
      var uid = LTAuth.uid(); if (!uid) throw new Error('Sign in first');
      childEmail = String(childEmail||'').trim().toLowerCase();
      if (!childEmail) throw new Error('Email required');
      var { data: children } = await supabase.from('profiles').select('*').eq('email', childEmail).limit(1);
      if (!children || !children.length) throw new Error('No student with that email');
      var child = children[0];
      if (child.role && child.role !== 'student') throw new Error('That account is not a student');
      var childUid = child.id;
      var linkId = uid + '_' + childUid;
      await supabase.from('parent_links').upsert({
        id: linkId, parent_uid: uid, child_uid: childUid,
        child_email: childEmail, child_name: child.name || '', status: 'active'
      });
      return { childUid: childUid, childName: child.name || childEmail, childData: rowToProfile(child) };
    };

    LTCloud.unlinkChild = async function(childUid){
      var uid = LTAuth.uid(); if (!uid) return;
      await supabase.from('parent_links').delete().eq('id', uid + '_' + childUid);
    };

    LTCloud.listLinkedChildren = async function(){
      var uid = LTAuth.uid(); if (!uid) return [];
      var { data } = await supabase.from('parent_links').select('*').eq('parent_uid', uid);
      return (data || []).map(function(r){
        return { parentUid: r.parent_uid, childUid: r.child_uid, childEmail: r.child_email, childName: r.child_name, status: r.status };
      });
    };

    LTCloud.fetchChildProgress = async function(childUid){
      try {
        var { data } = await supabase.from('user_progress').select('data').eq('user_id', childUid).single();
        return data ? data.data : null;
      } catch(e){ LT_LOG('fetchChildProgress', e); return null; }
    };

    // ── Social ──
    LTCloud.saveSocialProfile = async function(profile){
      var uid = LTAuth.uid(); if (!uid) return;
      var row = { user_id: uid, updated_at: new Date().toISOString() };
      if (profile){
        if (profile.name !== undefined)       row.name = profile.name;
        if (profile.avatar !== undefined)     row.avatar = profile.avatar;
        if (profile.classGroup !== undefined) row.class_group = profile.classGroup;
        if (profile.school !== undefined)     row.school = profile.school;
        if (profile.state !== undefined)      row.state = profile.state;
        if (profile.fav !== undefined)        row.fav = profile.fav;
        if (profile.bio !== undefined)        row.bio = profile.bio;
        if (profile.discoverable !== undefined) row.discoverable = profile.discoverable;
      }
      await supabase.from('social_profiles').upsert(row);
    };
    LTCloud.loadSocialProfile = async function(){
      var uid = LTAuth.uid(); if (!uid) return null;
      var { data } = await supabase.from('social_profiles').select('*').eq('user_id', uid).single();
      if (!data) return null;
      return {
        id: data.user_id, name: data.name, avatar: data.avatar,
        classGroup: data.class_group, school: data.school, state: data.state,
        fav: data.fav || [], bio: data.bio, joinedAt: data.joined_at
      };
    };
    LTCloud.listAllSocialProfiles = async function(){
      try {
        var { data } = await supabase.from('social_profiles').select('*').eq('discoverable', true).limit(50);
        return (data || []).map(function(r){
          return { id: r.user_id, name: r.name, avatar: r.avatar, classGroup: r.class_group, school: r.school, state: r.state };
        });
      } catch(e){ return []; }
    };

    // ── Arena ──
    LTCloud.saveArenaProfile = async function(p){
      var uid = LTAuth.uid(); if (!uid) return;
      await supabase.from('arena_profiles').upsert({
        user_id: uid,
        name: (p && p.name) || 'Player',
        avatar: (p && p.avatar) || '🦁',
        class_group: (p && p.classGroup) || 'seniors',
        state: (p && p.state) || '',
        school: (p && p.school) || '',
        xp: (p && p.xp) || 0,
        wins: (p && p.wins) || 0,
        losses: (p && p.losses) || 0,
        data: p || {},
        updated_at: new Date().toISOString()
      });
    };
    LTCloud.loadArenaProfile = async function(){
      var uid = LTAuth.uid(); if (!uid) return null;
      var { data } = await supabase.from('arena_profiles').select('*').eq('user_id', uid).single();
      if (!data) return null;
      var base = data.data || {};
      base.uid = data.user_id; base.name = data.name; base.avatar = data.avatar;
      base.classGroup = data.class_group; base.state = data.state; base.school = data.school;
      base.xp = data.xp; base.wins = data.wins; base.losses = data.losses;
      return base;
    };

    LTCloud.publishMatch = async function(match){
      var wk = (function(d){ d=d||new Date(); var t=new Date(d.valueOf()); t.setHours(0,0,0,0); var day=(t.getDay()+6)%7; t.setDate(t.getDate()-day); return t.toISOString().slice(0,10); })();
      var ops = (match.players||[]).map(async function(pl){
        if (!pl.uid || pl.uid.indexOf('bot_') === 0) return;
        var key = pl.uid + '_' + match.classGroup + '_' + match.scope + '_' + wk;
        var { data: prev } = await supabase.from('arena_leaders').select('*').eq('id', key).single();
        var row = prev || { id: key, user_id: pl.uid, name: pl.name, class_group: match.classGroup, scope: match.scope, week_key: wk, xp:0, wins:0, plays:0 };
        row.xp    = (row.xp || 0) + (pl.xp || 0);
        row.plays = (row.plays || 0) + 1;
        if (pl.uid === match.winnerUid) row.wins = (row.wins || 0) + 1;
        row.name = pl.name;
        row.updated_at = new Date().toISOString();
        await supabase.from('arena_leaders').upsert(row);
      });
      await Promise.all(ops);
    };

    LTCloud.topLeaders = async function(classGroup, scope, lim){
      var wk = (function(){ var t=new Date(); t.setHours(0,0,0,0); var day=(t.getDay()+6)%7; t.setDate(t.getDate()-day); return t.toISOString().slice(0,10); })();
      try {
        var q = supabase.from('arena_leaders').select('*')
          .eq('week_key', wk).eq('class_group', classGroup);
        if (scope && scope !== 'all') q = q.eq('scope', scope);
        q = q.order('xp', { ascending: false }).limit(lim || 25);
        var { data } = await q;
        return (data || []).map(function(r){
          return { uid: r.user_id, name: r.name, classGroup: r.class_group, scope: r.scope, weekKey: r.week_key, xp: r.xp, wins: r.wins, plays: r.plays };
        });
      } catch(e){ LT_LOG('topLeaders', e); return []; }
    };

    // ───────────────────────────────────────────────────────────
    // 4. HYDRATE LOCAL CACHES FROM CLOUD ON SIGN-IN
    // ───────────────────────────────────────────────────────────
    async function cloudHydrate(){
      if (!LTAuth.uid()) return;
      LT_LOG('Hydrating from cloud…');

      var profile = await LTCloud.loadProfile();

      // Auto-create profile if missing (e.g. user confirmed email after signup)
      if (!profile){
        var sbUser = (await supabase.auth.getUser()).data.user;
        if (sbUser){
          var meta = sbUser.user_metadata || {};
          var newProfile = {
            id: sbUser.id,
            email: sbUser.email || '',
            role: 'student',
            name: meta.full_name || meta.name || (sbUser.email||'').split('@')[0],
            section: '', class_level: '', stream: '', school: '', state: '',
            needs_onboarding: true
          };
          await supabase.from('profiles').upsert(newProfile);
          await supabase.from('social_profiles').upsert({
            user_id: sbUser.id,
            name: newProfile.name,
            avatar: '🦁',
            class_group: 'seniors',
            school: '', state: '', fav: [], bio: '',
            joined_at: Date.now()
          });
          profile = rowToProfile(newProfile);
          LT_LOG('Auto-created missing profile for', sbUser.email);
        }
      }

      if (profile){
        try {
          if (profile.name)        window.studentName   = profile.name;
          if (profile.section)     window.chosenSection = profile.section;
          if (profile.classLevel)  window.chosenClass   = profile.classLevel;
          if (profile.stream)      window.chosenStream  = profile.stream;
        } catch(e){}
      }

      var prog = await LTCloud.loadProgress();
      if (prog && window._sessionProgress){
        Object.assign(window._sessionProgress, prog);
        try { localStorage.setItem('lt_progress_v2', JSON.stringify(window._sessionProgress)); } catch(e){}
        try { window.xp = window._sessionProgress.xp || 0; } catch(e){}
        try { window.streakDays = window._sessionProgress.streak || 0; } catch(e){}
        try { if (typeof window._renderProgressBadges === 'function') window._renderProgressBadges(); } catch(e){}
      }

      // Load parent state for parents AND admins (admins demo-view everything).
      if (profile && (profile.role === 'parent' || profile.role === 'admin')){
        try {
          var ph = await LTCloud.loadParentState();
          if (ph && window.LT_PH_STATE){
            window.LT_PH_STATE = Object.assign(window.LT_PH_STATE, ph);
            try { localStorage.setItem('lt_ph_state', JSON.stringify(window.LT_PH_STATE)); } catch(e){}
          }
        } catch(e){ console.warn('parent state load skipped', e); }
      }

      var arena = await LTCloud.loadArenaProfile();
      if (arena){ try { localStorage.setItem('arena.profile', JSON.stringify(arena)); } catch(e){} }
      else if (profile && window.ArenaDB){
        var grp = classGroupFor(profile.section, profile.classLevel);
        var p = {
          uid: LTAuth.uid(), name: profile.name || 'Player', avatar: profile.avatar || '🦁',
          classGroup: grp, state: profile.state || '', school: profile.school || '',
          xp: 0, wins: 0, losses: 0, createdAt: Date.now()
        };
        try { localStorage.setItem('arena.profile', JSON.stringify(p)); } catch(e){}
        await LTCloud.saveArenaProfile(p);
      }

      var soc = await LTCloud.loadSocialProfile();
      if (soc){
        try {
          var profs = JSON.parse(localStorage.getItem('lt_social_profiles_v1') || '{}');
          profs[soc.id] = soc;
          localStorage.setItem('lt_social_profiles_v1', JSON.stringify(profs));
          localStorage.setItem('lt_social_me_v1', JSON.stringify(soc));
        } catch(e){}
      }

      // Publish profile BEFORE dispatching the event so nav-0.js intent
      // handler can read it synchronously (avoids race condition where
      // goTo('pg-beta') fires before _LT_LAST_PROFILE is set).
      if (profile) window._LT_LAST_PROFILE = profile;

      try { window.dispatchEvent(new CustomEvent('lt-cloud-hydrated', { detail:{ uid: LTAuth.uid() } })); } catch(e){}
    }
    LTCloud.hydrate = cloudHydrate;

    // ───────────────────────────────────────────────────────────
    // 5. WIRE EXISTING DATA LAYERS TO CLOUD WRITES
    // ───────────────────────────────────────────────────────────
    var pending = {};
    function debouncedSync(key, fn, ms){
      clearTimeout(pending[key]);
      pending[key] = setTimeout(function(){
        Promise.resolve(fn()).catch(function(e){ LT_LOG('sync '+key, e); });
      }, ms || 600);
    }

    (function patchProgress(){
      var orig = window.saveProgress;
      window.saveProgress = function(){
        try { if (orig) orig.apply(this, arguments); } catch(e){}
        if (LTAuth.isSignedIn() && window._sessionProgress){
          debouncedSync('progress', function(){
            var copy = Object.assign({}, window._sessionProgress);
            delete copy._sessionStart;
            delete copy._sessionTopics;
            return LTCloud.saveProgress(copy);
          });
        }
      };
    })();

    (function patchParent(){
      var orig = window.phSave;
      window.phSave = function(){
        try { if (orig) orig.apply(this, arguments); } catch(e){}
        if (LTAuth.isSignedIn() && window.LT_PH_STATE){
          debouncedSync('parent', function(){ return LTCloud.saveParentState(window.LT_PH_STATE); });
        }
      };
    })();

    (function patchArena(){
      if (!window.ArenaDB) return;
      var origSave = window.ArenaDB.saveProfile;
      window.ArenaDB.saveProfile = function(p){
        if (origSave) origSave.call(this, p);
        if (LTAuth.isSignedIn()){
          p = Object.assign({}, p, { uid: LTAuth.uid() });
          debouncedSync('arenaProfile', function(){ return LTCloud.saveArenaProfile(p); });
        }
      };
      var origRecord = window.ArenaDB.recordMatch;
      window.ArenaDB.recordMatch = function(match){
        if (origRecord) origRecord.call(this, match);
        if (LTAuth.isSignedIn()){
          var me = LTAuth.uid();
          var stamped = Object.assign({}, match);
          stamped.players = (match.players||[]).map(function(p){
            if (p.isMe) return Object.assign({}, p, { uid: me });
            return p;
          });
          if (match.winnerUid && match.winnerUid === (window.ArenaDB.loadProfile()||{}).uid){
            stamped.winnerUid = me;
          }
          debouncedSync('arenaMatch', function(){ return LTCloud.publishMatch(stamped); }, 100);
        }
      };
      window.ArenaDB.cloudLeaders = function(classGroup, scope, lim){
        if (!LTAuth.isSignedIn()) return Promise.resolve(null);
        return LTCloud.topLeaders(classGroup, scope, lim);
      };
    })();

    (function patchSocial(){
      if (!window.SocialDB) return;
      var origSaveMe = window.SocialDB.saveMe;
      window.SocialDB.saveMe = function(patch){
        var me = origSaveMe.call(this, patch);
        if (LTAuth.isSignedIn()){
          me = Object.assign({}, me, { id: LTAuth.uid() });
          debouncedSync('socialProfile', function(){ return LTCloud.saveSocialProfile(me); });
        }
        return me;
      };
    })();

    LT_LOG('Supabase ready, url =', cfg.url);
    try {
      window.dispatchEvent(new CustomEvent('lt-firebase-ready', { detail:{ enabled:true } }));
    } catch(e){}

  } catch(err){
    console.error('[LT-SB] init failed:', err);
    LTAuth.ready = false;
    LTCloud.ready = false;
    try {
      window.dispatchEvent(new CustomEvent('lt-firebase-ready', { detail:{ enabled:false, error: String(err) } }));
    } catch(e){}
  }
})();

LTAuth._ready = ready;

})();
