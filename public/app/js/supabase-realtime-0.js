/* ════════════════════════════════════════════════════════════════
   SUPABASE-REALTIME — live rooms, chat, DMs, and AI-opponent
   ────────────────────────────────────────────────────────────────
   Drop-in replacement for firebase-realtime-0.js.
   Exposes the same window.LTRealtime API.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var LTRealtime = {
  ready: false,
  listRoomsLive: function(){ return function(){}; },
  createRoom: function(){ return Promise.reject(new Error('Realtime not ready')); },
  joinRoom: function(){ return Promise.resolve(function(){}); },
  leaveRoom: function(){ return Promise.resolve(); },
  startMatch: function(){ return Promise.resolve(); },
  publishScore: function(){ return Promise.resolve(); },
  subscribeChat: function(){ return function(){}; },
  sendChat: function(){ return Promise.resolve(); },
  spawnAIOpponent: function(){ return Promise.resolve(); },
  subscribeDM: function(){ return function(){}; },
  sendDM: function(){ return Promise.resolve(); }
};
window.LTRealtime = LTRealtime;

window.addEventListener('lt-firebase-ready', async function(e){
  if (!e || !e.detail || !e.detail.enabled) return;
  try { await initRealtime(); } catch(err){ console.error('[LTRealtime] init failed', err); }
});

async function initRealtime(){
  var supabase = window._ltSupabase;
  if (!supabase) throw new Error('Supabase client not initialised');

  function uid(){ return 'r_' + Math.random().toString(36).slice(2,10); }

  function authUid(){
    if (window.LTAuth && window.LTAuth.user) return window.LTAuth.user.uid;
    try {
      var s = sessionStorage.getItem('lt_guest_uid');
      if (!s){ s = 'guest_' + Math.random().toString(36).slice(2,10); sessionStorage.setItem('lt_guest_uid', s); }
      return s;
    } catch(e){ return 'guest_' + Math.random().toString(36).slice(2,10); }
  }

  function authProfile(){
    var p = window._LT_LAST_PROFILE || {};
    var arenaP = (window.ArenaDB && window.ArenaDB.loadProfile && window.ArenaDB.loadProfile()) || {};
    return {
      uid: authUid(),
      name: p.name || arenaP.name || 'Player',
      avatar: arenaP.avatar || '🦁',
      classGroup: arenaP.classGroup || 'seniors',
      state: p.state || arenaP.state || '',
      school: p.school || arenaP.school || ''
    };
  }

  // ───────────────────────────────────────────────────────────
  // ROOMS
  // ───────────────────────────────────────────────────────────
  LTRealtime.listRoomsLive = function(filters, cb){
    filters = filters || {};
    // Initial fetch
    async function fetch(){
      var q = supabase.from('arena_rooms').select('*')
        .in('status', ['open','live'])
        .eq('class_group', filters.classGroup || 'seniors')
        .eq('scope', filters.scope || 'local');
      if (filters.format && filters.format !== 'any') q = q.eq('format', filters.format);
      q = q.order('created_at', { ascending: false }).limit(30);
      var { data } = await q;
      cb(data || []);
    }
    fetch().catch(function(){ cb([]); });

    var channel = supabase.channel('rooms-' + Math.random().toString(36).slice(2,6))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'arena_rooms'
      }, function(){ fetch().catch(function(){}); })
      .subscribe();

    return function unsubscribe(){ supabase.removeChannel(channel); };
  };

  LTRealtime.createRoom = async function(roomData){
    var me = authProfile();
    var id = uid();
    var data = Object.assign({
      id: id,
      host_uid: me.uid,
      host_name: me.name,
      class_group: 'seniors',
      scope: 'local',
      state: null,
      game_id: 'quiz',
      game_name: 'Quiz Duel',
      game_emoji: '🧠',
      duration: '3 min',
      format: 'duo',
      format_name: '1v1 Duo',
      format_emoji: '⚔️',
      max_players: 2,
      team_size: 1,
      players: [{ uid: me.uid, name: me.name, avatar: me.avatar, state: me.state, ready: false, isAI: false }],
      scores: {},
      status: 'open',
      viewers: 0,
      prize: 500,
      created_at: Date.now()
    }, roomDataToRow(roomData || {}));
    await supabase.from('arena_rooms').insert(data);
    setTimeout(function(){ cleanupIfStale(id); }, 5 * 60 * 1000);
    return id;
  };

  function roomDataToRow(rd){
    var r = {};
    if (rd.classGroup !== undefined)  r.class_group = rd.classGroup;
    if (rd.hostUid !== undefined)     r.host_uid = rd.hostUid;
    if (rd.hostName !== undefined)    r.host_name = rd.hostName;
    if (rd.gameId !== undefined)      r.game_id = rd.gameId;
    if (rd.gameName !== undefined)    r.game_name = rd.gameName;
    if (rd.gameEmoji !== undefined)   r.game_emoji = rd.gameEmoji;
    if (rd.formatName !== undefined)  r.format_name = rd.formatName;
    if (rd.formatEmoji !== undefined) r.format_emoji = rd.formatEmoji;
    if (rd.maxPlayers !== undefined)  r.max_players = rd.maxPlayers;
    if (rd.teamSize !== undefined)    r.team_size = rd.teamSize;
    // Pass through snake_case fields directly
    ['scope','state','duration','format','players','scores','status','viewers','prize'].forEach(function(k){
      if (rd[k] !== undefined) r[k] = rd[k];
    });
    return r;
  }

  function rowToRoom(r){
    if (!r) return null;
    return {
      id: r.id, hostUid: r.host_uid, hostName: r.host_name,
      classGroup: r.class_group, scope: r.scope, state: r.state,
      gameId: r.game_id, gameName: r.game_name, gameEmoji: r.game_emoji,
      duration: r.duration, format: r.format, formatName: r.format_name,
      formatEmoji: r.format_emoji, maxPlayers: r.max_players, teamSize: r.team_size,
      players: r.players || [], scores: r.scores || {}, status: r.status,
      viewers: r.viewers || 0, prize: r.prize || 0,
      winnerUid: r.winner_uid, startedAt: r.started_at, finishedAt: r.finished_at,
      createdAt: r.created_at
    };
  }

  async function cleanupIfStale(roomId){
    try {
      var { data } = await supabase.from('arena_rooms').select('*').eq('id', roomId).single();
      if (!data) return;
      if (data.status === 'open' && (data.players||[]).length <= 1){
        var human = (data.players||[]).filter(function(p){ return !p.isAI; });
        if (human.length <= 1) await supabase.from('arena_rooms').delete().eq('id', roomId);
      }
    } catch(e){}
  }

  LTRealtime.subscribeRoom = function(roomId, cb){
    async function fetch(){
      var { data } = await supabase.from('arena_rooms').select('*').eq('id', roomId).single();
      cb(data ? rowToRoom(data) : null);
    }
    fetch().catch(function(){ cb(null); });

    var channel = supabase.channel('room-' + roomId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'arena_rooms',
        filter: 'id=eq.' + roomId
      }, function(payload){
        if (payload.eventType === 'DELETE'){ cb(null); return; }
        cb(rowToRoom(payload.new));
      })
      .subscribe();

    return function(){ supabase.removeChannel(channel); };
  };

  LTRealtime.joinRoom = async function(roomId){
    var me = authProfile();
    var { data } = await supabase.from('arena_rooms').select('*').eq('id', roomId).single();
    if (!data) throw new Error('Room no longer exists');
    var players = data.players || [];
    var already = players.some(function(p){ return p.uid === me.uid; });
    if (!already){
      if (players.length >= (data.max_players || 2)) throw new Error('Room is full');
      players.push({ uid: me.uid, name: me.name, avatar: me.avatar, state: me.state, ready: false, isAI: false });
      await supabase.from('arena_rooms').update({ players: players }).eq('id', roomId);
    }
  };

  LTRealtime.leaveRoom = async function(roomId){
    var me = authProfile();
    try {
      var { data } = await supabase.from('arena_rooms').select('*').eq('id', roomId).single();
      if (!data) return;
      var players = (data.players||[]).filter(function(p){ return p.uid !== me.uid; });
      var remaining = players.filter(function(p){ return !p.isAI; });
      if (remaining.length === 0){
        await supabase.from('arena_rooms').delete().eq('id', roomId);
      } else {
        await supabase.from('arena_rooms').update({ players: players }).eq('id', roomId);
      }
    } catch(e){}
  };

  LTRealtime.markReady = async function(roomId, ready){
    var me = authProfile();
    var { data } = await supabase.from('arena_rooms').select('players').eq('id', roomId).single();
    if (!data) return;
    var newPlayers = (data.players||[]).map(function(p){
      if (p.uid === me.uid) return Object.assign({}, p, { ready: !!ready });
      return p;
    });
    await supabase.from('arena_rooms').update({ players: newPlayers }).eq('id', roomId);
  };

  LTRealtime.startMatch = async function(roomId){
    await supabase.from('arena_rooms').update({
      status: 'live', started_at: Date.now()
    }).eq('id', roomId);
  };

  LTRealtime.publishScore = async function(roomId, score){
    var me = authProfile();
    var { data } = await supabase.from('arena_rooms').select('scores').eq('id', roomId).single();
    if (!data) return;
    var scores = Object.assign({}, data.scores || {});
    scores[me.uid] = score;
    await supabase.from('arena_rooms').update({ scores: scores }).eq('id', roomId);
  };

  LTRealtime.endMatch = async function(roomId, winnerUid){
    await supabase.from('arena_rooms').update({
      status: 'finished', winner_uid: winnerUid || null, finished_at: Date.now()
    }).eq('id', roomId);
    setTimeout(function(){
      supabase.from('arena_rooms').delete().eq('id', roomId).then(function(){});
    }, 10 * 60 * 1000);
  };

  // ───────────────────────────────────────────────────────────
  // CHAT (lobby + spectator)
  // ───────────────────────────────────────────────────────────
  LTRealtime.subscribeChat = function(roomId, kind, cb){
    var k = (kind === 'spec') ? 'spec' : 'lobby';
    async function fetch(){
      var { data } = await supabase.from('arena_chat').select('*')
        .eq('room_id', roomId).eq('kind', k)
        .order('at', { ascending: true }).limit(100);
      cb((data || []).map(function(r){
        return { id: r.id, uid: r.uid, name: r.name, avatar: r.avatar, text: r.text, redacted: r.redacted, at: r.at, isAI: r.is_ai };
      }));
    }
    fetch().catch(function(){});

    var channel = supabase.channel('chat-' + roomId + '-' + k)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'arena_chat',
        filter: 'room_id=eq.' + roomId
      }, function(payload){
        if (payload.new && payload.new.kind === k) fetch().catch(function(){});
      })
      .subscribe();

    return function(){ supabase.removeChannel(channel); };
  };

  LTRealtime.sendChat = async function(roomId, kind, text){
    var me = authProfile();
    if (!text || !text.trim()) return;
    var f = (window.SocialDB && window.SocialDB.filter) ? window.SocialDB.filter(text) : { clean: text, hits: [] };
    if (!f.clean.trim()) return;
    var k = (kind === 'spec') ? 'spec' : 'lobby';
    await supabase.from('arena_chat').insert({
      room_id: roomId, kind: k,
      uid: me.uid, name: me.name, avatar: me.avatar,
      text: f.clean, redacted: f.hits && f.hits.length > 0,
      at: Date.now()
    });
  };

  // ───────────────────────────────────────────────────────────
  // DMs
  // ───────────────────────────────────────────────────────────
  function dmThreadKey(a, b){ return [a, b].sort().join('__'); }

  LTRealtime.openOrCreateDMThread = async function(otherUid, otherProfile){
    var me = authProfile();
    if (otherUid === me.uid) throw new Error('Cannot DM yourself');
    if (otherProfile && otherProfile.classGroup && me.classGroup && otherProfile.classGroup !== me.classGroup){
      throw new Error('You can only DM students in the same class group.');
    }
    var threadId = dmThreadKey(me.uid, otherUid);
    var { data: existing } = await supabase.from('dm_threads').select('id').eq('id', threadId).single();
    if (!existing){
      await supabase.from('dm_threads').insert({
        id: threadId,
        a: me.uid, b: otherUid,
        members: [me.uid, otherUid],
        a_name: me.name, b_name: (otherProfile && otherProfile.name) || '',
        a_avatar: me.avatar, b_avatar: (otherProfile && otherProfile.avatar) || '🙂',
        last_at: Date.now()
      });
    }
    return threadId;
  };

  LTRealtime.subscribeDM = function(threadId, cb){
    async function fetch(){
      var { data } = await supabase.from('dm_messages').select('*')
        .eq('thread_id', threadId)
        .order('at', { ascending: true }).limit(200);
      cb((data || []).map(function(r){
        return { id: r.id, from: r.from_uid, fromName: r.from_name, text: r.text, redacted: r.redacted, at: r.at };
      }));
    }
    fetch().catch(function(){});

    var channel = supabase.channel('dm-' + threadId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'dm_messages',
        filter: 'thread_id=eq.' + threadId
      }, function(){ fetch().catch(function(){}); })
      .subscribe();

    return function(){ supabase.removeChannel(channel); };
  };

  LTRealtime.sendDM = async function(threadId, text){
    var me = authProfile();
    if (!text || !text.trim()) return;
    var f = (window.SocialDB && window.SocialDB.filter) ? window.SocialDB.filter(text) : { clean: text, hits: [] };
    if (!f.clean.trim()) return;
    await supabase.from('dm_messages').insert({
      thread_id: threadId, from_uid: me.uid, from_name: me.name,
      text: f.clean, redacted: f.hits.length > 0, at: Date.now()
    });
    try {
      await supabase.from('dm_threads').update({ last_at: Date.now(), last_text: f.clean.slice(0,80) }).eq('id', threadId);
    } catch(e){}
  };

  LTRealtime.listMyDMThreads = function(cb){
    var me = authProfile();
    async function fetch(){
      var { data } = await supabase.from('dm_threads').select('*')
        .contains('members', [me.uid])
        .order('last_at', { ascending: false }).limit(30);
      cb((data || []).map(function(r){
        return {
          id: r.id, a: r.a, b: r.b, members: r.members,
          aName: r.a_name, bName: r.b_name, aAvatar: r.a_avatar, bAvatar: r.b_avatar,
          lastAt: r.last_at, lastText: r.last_text
        };
      }));
    }
    fetch().catch(function(){});

    var channel = supabase.channel('mythreads-' + me.uid)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dm_threads'
      }, function(){ fetch().catch(function(){}); })
      .subscribe();

    return function(){ supabase.removeChannel(channel); };
  };

  // ───────────────────────────────────────────────────────────
  // AI OPPONENT
  // ───────────────────────────────────────────────────────────
  LTRealtime.spawnAIOpponent = async function(roomId){
    var { data } = await supabase.from('arena_rooms').select('*').eq('id', roomId).single();
    if (!data) return;
    var me = authProfile();
    if (data.host_uid !== me.uid) return;
    if ((data.players||[]).length >= (data.max_players||2)) return;

    var aiUid = 'ai_' + Math.random().toString(36).slice(2,8);
    var aiNames = ['Tutor Tega', 'Tutor Ada', 'Tutor Bayo', 'Tutor Chioma', 'Tutor Femi', 'Tutor Ngozi'];
    var aiAvatars = ['🤖','🦉','🧠','✨','📚','🎓'];
    var aiName = aiNames[Math.floor(Math.random()*aiNames.length)];
    var aiAvatar = aiAvatars[Math.floor(Math.random()*aiAvatars.length)];

    var players = data.players || [];
    players.push({ uid: aiUid, name: aiName, avatar: aiAvatar, state: 'AI', ready: true, isAI: true });
    await supabase.from('arena_rooms').update({ players: players }).eq('id', roomId);

    try {
      await supabase.from('arena_chat').insert({
        room_id: roomId, kind: 'lobby',
        uid: aiUid, name: aiName, avatar: aiAvatar,
        text: "Hi! I'm your AI study partner today. Ready when you are! 🎯",
        redacted: false, is_ai: true, at: Date.now()
      });
    } catch(e){}

    return { uid: aiUid, name: aiName, avatar: aiAvatar };
  };

  LTRealtime.aiAnswerQuestion = async function(question, options, correctIdx, opts){
    opts = opts || {};
    var accuracy = opts.accuracy != null ? opts.accuracy : 0.75;
    var minDelay = opts.minDelay || 1200;
    var maxDelay = opts.maxDelay || 3500;
    var delay = minDelay + Math.random() * (maxDelay - minDelay);
    await new Promise(function(r){ setTimeout(r, delay); });

    if (typeof correctIdx === 'number' && options && options.length){
      var roll = Math.random();
      if (roll < accuracy){
        return { pick: correctIdx, correct: true, delayMs: delay };
      } else {
        var wrongs = options.map(function(_,i){return i;}).filter(function(i){return i !== correctIdx;});
        var pick = wrongs[Math.floor(Math.random()*wrongs.length)];
        return { pick: pick, correct: false, delayMs: delay };
      }
    }
    try {
      var server = (function(){
        try { return localStorage.getItem('LT_SERVER') || 'auto'; } catch(e){ return 'auto'; }
      })();
      var endpoint = (server === '2') ? '/api/openai' : '/api/anthropic';
      var resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 80,
          system: 'You are an AI student playing a game. Answer the question with ONLY your single best answer, no explanations, no extra words. Be concise.',
          messages: [{ role:'user', content: question }]
        })
      });
      if (!resp.ok) throw new Error('AI call failed');
      var data = await resp.json();
      var text = '';
      if (data && data.content && data.content[0] && data.content[0].text) text = data.content[0].text.trim();
      else if (data && data.content) text = String(data.content).trim();
      return { pick: text, correct: null, delayMs: delay };
    } catch(e){
      return { pick: '', correct: false, delayMs: delay };
    }
  };

  LTRealtime.updateAIScore = async function(roomId, aiUid, newScore){
    var { data } = await supabase.from('arena_rooms').select('scores').eq('id', roomId).single();
    if (!data) return;
    var scores = Object.assign({}, data.scores || {});
    scores[aiUid] = newScore;
    await supabase.from('arena_rooms').update({ scores: scores }).eq('id', roomId);
  };

  LTRealtime.ready = true;
  console.log('[LTRealtime] ready (Supabase)');
  try { window.dispatchEvent(new CustomEvent('lt-realtime-ready')); } catch(e){}
}

})();
