/* ════════════════════════════════════════════════════════════════
   LESSON AUDIO ENGINE v1 — "Listen to Lesson"
   ────────────────────────────────────────────────────────────────
   Reads the full lesson aloud with Nigerian-accented voice.

   Priority:
   1. Pre-generated audio (if available in /lesson-audio/)
   2. ElevenLabs TTS — Nigerian voice via /api/elevenlabs proxy
   3. NO generic browser TTS — never plays robot voice
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var AUDIO_BASE = 'lesson-audio/';  // Where pre-generated Afro-TTS files live

var state = {
  isPlaying: false,
  isPaused: false,
  currentAudio: null,
  utterance: null,
  topicKey: null
};

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
function injectStyles(){
  if (document.getElementById('la-styles')) return;
  var s = document.createElement('style');
  s.id = 'la-styles';
  s.textContent = '\
.lt-action-btns{display:flex;gap:14px;flex-wrap:wrap;margin:20px 0 8px;padding:0}\
.vt-listen-btn{display:inline-flex!important;align-items:center!important;gap:10px!important;padding:13px 26px!important;background:linear-gradient(135deg,#064e3b,#059669)!important;border:1px solid rgba(16,185,129,.25)!important;color:#fff!important;border-radius:50px!important;font-size:.88rem!important;font-weight:700!important;cursor:pointer!important;font-family:"Plus Jakarta Sans",system-ui,sans-serif!important;transition:all .25s ease!important;box-shadow:0 4px 18px rgba(5,150,105,.2),inset 0 1px 0 rgba(255,255,255,.1)!important;letter-spacing:.01em!important;-webkit-appearance:none!important;appearance:none!important;position:relative!important;overflow:hidden!important}\
.vt-listen-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,transparent 60%);pointer-events:none;border-radius:50px}\
.vt-listen-btn:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(5,150,105,.35),inset 0 1px 0 rgba(255,255,255,.12)!important;background:linear-gradient(135deg,#065f46,#10b981)!important}\
.vt-listen-btn:active{transform:translateY(0)!important;box-shadow:0 2px 10px rgba(5,150,105,.2)!important}\
.vt-listen-btn.playing{background:linear-gradient(135deg,#7f1d1d,#dc2626)!important;border-color:rgba(239,68,68,.3)!important;box-shadow:0 4px 18px rgba(220,38,38,.25),inset 0 1px 0 rgba(255,255,255,.1)!important;animation:la-pulse 2s ease-in-out infinite!important}\
.vt-listen-btn.playing:hover{box-shadow:0 8px 28px rgba(220,38,38,.35)!important;background:linear-gradient(135deg,#991b1b,#ef4444)!important}\
@keyframes la-pulse{0%,100%{box-shadow:0 4px 18px rgba(220,38,38,.25)}50%{box-shadow:0 4px 24px rgba(220,38,38,.4)}}\
.vt-listen-icon{font-size:1.15rem!important;flex-shrink:0}\
.la-progress{position:fixed;top:38px;left:0;right:0;height:3px;background:rgba(255,255,255,.06);z-index:9999;display:none}\
.la-progress.show{display:block}\
.la-progress-fill{height:100%;background:linear-gradient(90deg,#10b981,#059669);transition:width .3s;width:0%}\
  ';
  document.head.appendChild(s);
}

// Add progress bar to page
function ensureProgressBar(){
  if (document.getElementById('laProgress')) return;
  var bar = document.createElement('div');
  bar.id = 'laProgress';
  bar.className = 'la-progress';
  bar.innerHTML = '<div class="la-progress-fill" id="laProgressFill"></div>';
  document.body.appendChild(bar);
}

// ═══════════════════════════════════════════════════════════
// GET LESSON TEXT
// ═══════════════════════════════════════════════════════════
function getLessonText(){
  var body = document.getElementById('lessonBody');
  if (!body) return '';
  // Strip HTML, get clean text — remove all layout labels and UI elements
  var tmp = document.createElement('div');
  tmp.innerHTML = body.innerHTML;
  var remove = tmp.querySelectorAll(
    '.def-label, .diag-label, .diagram-section, .formula-label, .worked-label, ' +
    '.kt-label, .tbl-label, .mn-label, .et-hdr, .et-badge, .analogy-tag, ' +
    '.callout-label, .step-num, .ws-num, .bh-hdr, .bh-right, .bh-chip, ' +
    '.lt-speech-card, .lt-speech-avt, .lt-speech-name, .lp-strip, .lt-action-btns, .common-mistake, ' +
    '#quizArea, .quiz-embed, button, script, style, nav, .vt-listen-btn, .vt-teach-btn, .ctx-nav-btn'
  );
  remove.forEach(function(el){ el.remove(); });
  var text = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  // Strip emoji so TTS doesn't try to read them
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2B05}-\u{2B07}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');
  return text.replace(/\s{2,}/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════
// TRY PRE-GENERATED AFRO-TTS AUDIO
// ═══════════════════════════════════════════════════════════
function tryAfroAudio(topicKey, callback){
  if (!topicKey){ callback(false); return; }
  var url = AUDIO_BASE + topicKey + '.wav';
  var audio = new Audio();
  audio.src = url;
  audio.oncanplaythrough = function(){
    callback(audio);
  };
  audio.onerror = function(){
    // Try mp3
    audio.src = AUDIO_BASE + topicKey + '.mp3';
    audio.oncanplaythrough = function(){ callback(audio); };
    audio.onerror = function(){ callback(false); };
  };
  // Timeout — if no response in 2 seconds, skip
  setTimeout(function(){
    if (!state.currentAudio) callback(false);
  }, 2000);
}

// ═══════════════════════════════════════════════════════════
// PLAY WITH PRE-GENERATED AUDIO
// ═══════════════════════════════════════════════════════════
function playPreGenerated(audio){
  state.currentAudio = audio;
  audio.ontimeupdate = function(){
    if (audio.duration){
      updateProgress(audio.currentTime / audio.duration);
    }
  };
  audio.onended = function(){
    stopPlayback();
  };
  audio.play().catch(function(){
    // If pre-generated fails, fallback to ElevenLabs
    playElevenLabs(getLessonText());
  });
}

// ═══════════════════════════════════════════════════════════
// PLAY WITH ELEVENLABS TTS (Nigerian voice)
// ═══════════════════════════════════════════════════════════
function playElevenLabs(text){
  if (!window.elevenSpeak){
    // ElevenLabs shim not loaded — show message
    stopPlayback();
    showAudioNotReady();
    return;
  }

  // Split into chunks (~500 chars) for sequential playback
  var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  var chunks = [];
  var current = '';
  for (var i = 0; i < sentences.length; i++){
    if (current.length + sentences[i].length < 500){
      current += ' ' + sentences[i];
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = sentences[i];
    }
  }
  if (current.trim()) chunks.push(current.trim());

  var chunkIdx = 0;

  function speakNext(){
    if (!state.isPlaying || chunkIdx >= chunks.length){
      stopPlayback();
      return;
    }

    window.elevenSpeak(chunks[chunkIdx], function(errFlag){
      if (!state.isPlaying) return;
      chunkIdx++;
      updateProgress(chunkIdx / chunks.length);
      speakNext();
    });
  }

  speakNext();
}

// ═══════════════════════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════════════════════
function updateProgress(pct){
  var fill = document.getElementById('laProgressFill');
  if (fill) fill.style.width = (pct * 100) + '%';
}

function startPlayback(){
  injectStyles();
  ensureProgressBar();

  state.isPlaying = true;
  state.isPaused = false;

  var btn = document.getElementById('vtListenBtn');
  if (btn){
    btn.classList.add('playing');
    btn.querySelector('.vt-listen-icon').textContent = '⏸';
    btn.querySelector('span:nth-child(2)').textContent = 'Stop Listening';
  }

  document.getElementById('laProgress').classList.add('show');
  updateProgress(0);

  // Get current topic key for Afro-TTS lookup
  var topicKey = '';
  if (window._currentLesson){
    var s = window._currentLesson.s;
    var term = window._currentLesson.term;
    var idx = window._currentLesson.idx;
    topicKey = (s.key || '') + '-' + term + '-' + idx;
  }

  // Try pre-generated audio first, then ElevenLabs
  tryAfroAudio(topicKey, function(audio){
    if (audio){
      playPreGenerated(audio);
    } else {
      // No pre-generated audio — use ElevenLabs Nigerian voice
      playElevenLabs(getLessonText());
    }
  });
}

function stopPlayback(){
  state.isPlaying = false;
  state.isPaused = false;

  // Stop ElevenLabs audio
  if (window.elevenStop) window.elevenStop();

  // Stop pre-generated audio
  if (state.currentAudio){
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }

  var btn = document.getElementById('vtListenBtn');
  if (btn){
    btn.classList.remove('playing');
    btn.querySelector('.vt-listen-icon').textContent = '🔊';
    btn.querySelector('span:nth-child(2)').textContent = 'Listen to Lesson';
  }

  var progress = document.getElementById('laProgress');
  if (progress) progress.classList.remove('show');
  updateProgress(0);
}

// ═══════════════════════════════════════════════════════════
// AUDIO NOT READY MESSAGE
// ═══════════════════════════════════════════════════════════
function showAudioNotReady(){
  var existing = document.getElementById('laNotReady');
  if (existing) existing.remove();
  var msg = document.createElement('div');
  msg.id = 'laNotReady';
  msg.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.95);border:1px solid rgba(251,191,36,.3);color:#fbbf24;padding:14px 24px;border-radius:12px;font-size:.88rem;font-weight:600;z-index:10001;display:flex;align-items:center;gap:10px;backdrop-filter:blur(8px);box-shadow:0 8px 30px rgba(0,0,0,.3);max-width:90vw;text-align:center';
  msg.innerHTML = '🎙️ Audio coming soon — generating Nigerian voice on Colab';
  document.body.appendChild(msg);
  setTimeout(function(){ if (msg.parentNode) msg.remove(); }, 4000);
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════
window.LessonAudio = {
  toggle: function(){
    injectStyles();
    if (state.isPlaying){
      stopPlayback();
    } else {
      startPlayback();
    }
  },

  play: function(){ if (!state.isPlaying) startPlayback(); },
  stop: function(){ stopPlayback(); },
  isPlaying: function(){ return state.isPlaying; }
};

})();
