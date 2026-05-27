/* ════════════════════════════════════════════════════════════════
   VOICE TEACHER v1 — "Teach Me" Mode
   ────────────────────────────────────────────────────────────────
   A voice-only teacher that narrates OVER the displayed lesson.
   No video. Two things happen at once:
   1. The full lesson notes stay visible on screen
   2. The voice TEACHES over them — summarising, explaining,
      connecting to real life, working through examples

   The voice does NOT read the notes word-for-word.
   It acts like a Nigerian teacher standing beside the student,
   pointing at sections and explaining what they mean.

   Uses ElevenLabs TTS via window.elevenSpeak (Nigerian voice).
   Falls back gracefully if TTS is unavailable.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var TEACHER_NAME = 'Ms. Adaeze';

var state = {
  active: false,
  isPlaying: false,
  isPaused: false,
  segments: [],
  currentSegment: 0,
  title: '',
  subject: '',
  studentName: '',
  aborted: false
};

// ═══════════════════════════════════════════════════════════
// STYLES — highlight bar, floating controls, progress
// ═══════════════════════════════════════════════════════════
function injectStyles(){
  if (document.getElementById('voiceteach-styles')) return;
  var s = document.createElement('style');
  s.id = 'voiceteach-styles';
  s.textContent = [
    /* Teach Me button */
    '.vt-teach-btn{display:inline-flex!important;align-items:center!important;gap:10px!important;padding:13px 26px!important;background:linear-gradient(135deg,#4c1d95,#7c3aed)!important;border:1px solid rgba(139,92,246,.3)!important;color:#fff!important;border-radius:50px!important;font-size:.88rem!important;font-weight:700!important;cursor:pointer!important;font-family:"Plus Jakarta Sans",system-ui,sans-serif!important;transition:all .25s ease!important;box-shadow:0 4px 18px rgba(124,58,237,.25),inset 0 1px 0 rgba(255,255,255,.1)!important;letter-spacing:.01em!important;position:relative!important;overflow:hidden!important}',
    '.vt-teach-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,transparent 60%);pointer-events:none;border-radius:50px}',
    '.vt-teach-btn:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(124,58,237,.35)!important;background:linear-gradient(135deg,#5b21b6,#8b5cf6)!important}',
    '.vt-teach-btn:active{transform:translateY(0)!important}',
    '.vt-teach-icon{font-size:1.15rem!important;flex-shrink:0}',
    '.vt-teach-live{font-size:.65rem!important;background:rgba(255,255,255,.2)!important;padding:2px 8px!important;border-radius:20px!important;font-weight:800!important;letter-spacing:.06em!important}',
    '.vt-teach-btn.teaching{background:linear-gradient(135deg,#7f1d1d,#dc2626)!important;border-color:rgba(239,68,68,.3)!important;animation:vt-pulse 2s ease-in-out infinite!important}',
    '@keyframes vt-pulse{0%,100%{box-shadow:0 4px 18px rgba(220,38,38,.25)}50%{box-shadow:0 4px 24px rgba(220,38,38,.4)}}',

    /* Floating control bar — safe-area aware, touch-friendly */
    '.vt-bar{position:fixed;bottom:max(24px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:10000;display:flex;align-items:center;gap:10px;background:rgba(15,23,42,.96);border:1px solid rgba(139,92,246,.3);border-radius:16px;padding:10px 14px;backdrop-filter:blur(12px);box-shadow:0 12px 40px rgba(0,0,0,.5);transition:all .3s ease;max-width:96vw;flex-wrap:wrap}',
    '.vt-bar-icon{font-size:1.4rem;flex-shrink:0}',
    '.vt-bar-info{display:flex;flex-direction:column;min-width:0;flex:1;max-width:160px}',
    '.vt-bar-text{color:#e2e8f0;font-size:.78rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:"Plus Jakarta Sans",system-ui,sans-serif}',
    '.vt-bar-sub{color:rgba(226,232,240,.55);font-size:.68rem;font-weight:600;white-space:nowrap}',
    '.vt-bar-progress{width:88px;height:5px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden;flex-shrink:0}',
    '.vt-bar-fill{height:100%;background:linear-gradient(90deg,#8b5cf6,#a78bfa,#fbbf24);border-radius:4px;transition:width .3s;width:0}',
    '.vt-bar-ctrls{display:flex;align-items:center;gap:4px;flex-shrink:0}',
    '.vt-bar-btn{background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.25);color:#e2e8f0;border-radius:8px;padding:0;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;min-width:38px;min-height:38px;display:flex;align-items:center;justify-content:center}',
    '.vt-bar-btn:hover{background:rgba(139,92,246,.25);border-color:rgba(139,92,246,.5)}',
    '.vt-bar-btn:active{transform:scale(.94)}',
    '.vt-bar-play{background:linear-gradient(135deg,#8b5cf6,#a855f7);border-color:transparent;color:#fff;font-size:1.05rem}',
    '.vt-bar-play:hover{background:linear-gradient(135deg,#a855f7,#c084fc)}',
    '.vt-bar-vol{display:flex;align-items:center;gap:6px;flex-shrink:0}',
    '.vt-bar-vol-ico{font-size:1rem;cursor:pointer;user-select:none;line-height:1}',
    '.vt-bar-vol-slider{width:64px;-webkit-appearance:none;appearance:none;height:4px;background:rgba(255,255,255,.18);border-radius:4px;outline:none;cursor:pointer}',
    '.vt-bar-vol-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;background:#a855f7;border-radius:50%;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.4)}',
    '.vt-bar-vol-slider::-moz-range-thumb{width:14px;height:14px;background:#a855f7;border-radius:50%;cursor:pointer;border:0}',
    '.vt-bar-close{background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.4);color:#fca5a5}',
    '.vt-bar-close:hover{background:rgba(239,68,68,.32);border-color:rgba(239,68,68,.6)}',
    '@media (max-width:640px){.vt-bar{gap:6px;padding:8px 10px;width:calc(100vw - 16px)}.vt-bar-info{max-width:90px}.vt-bar-text{font-size:.72rem}.vt-bar-sub{font-size:.62rem}.vt-bar-progress{width:50px}.vt-bar-vol-slider{width:48px}.vt-bar-btn{min-width:36px;min-height:36px;font-size:.88rem}}',

    /* Section highlight */
    '.vt-highlight{outline:2px solid rgba(139,92,246,.5)!important;outline-offset:4px!important;border-radius:8px!important;background:rgba(139,92,246,.04)!important;transition:all .4s ease!important}',
    '.vt-highlight-pulse{animation:vt-hl-pulse 1.5s ease-in-out!important}',
    '@keyframes vt-hl-pulse{0%{outline-color:rgba(139,92,246,.5)}50%{outline-color:rgba(139,92,246,.8)}100%{outline-color:rgba(139,92,246,.5)}}',

    /* Caption overlay */
    '.vt-caption{position:fixed;bottom:max(90px,calc(80px + env(safe-area-inset-bottom)));left:50%;transform:translateX(-50%);z-index:9999;background:rgba(15,23,42,.92);color:#e2e8f0;padding:14px 22px;border-radius:14px;font-size:.84rem;font-weight:500;line-height:1.55;max-width:88vw;max-height:120px;overflow-y:auto;text-align:center;border:1px solid rgba(139,92,246,.2);backdrop-filter:blur(8px);box-shadow:0 4px 24px rgba(0,0,0,.3);font-family:"Plus Jakarta Sans",system-ui,sans-serif;transition:opacity .3s;opacity:0;pointer-events:none}',
    '.vt-caption.show{opacity:1;pointer-events:auto}'
  ].join('\n');
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════════════════════
// PARSE LESSON INTO TEACHING SEGMENTS
// The voice summarises and teaches — doesn't read verbatim
// ═══════════════════════════════════════════════════════════
function parseLesson(content, title, studentName){
  var tmp = document.createElement('div');
  tmp.innerHTML = content;
  var segments = [];

  // Helper
  function clean(el){
    if (!el) return '';
    var clone = el.cloneNode(true);
    clone.querySelectorAll(
      '.def-label, .diag-label, .formula-label, .worked-label, .kt-label, ' +
      '.tbl-label, .mn-label, .et-hdr, .et-badge, .analogy-tag, .callout-label, ' +
      '.step-num, .ws-num, .bh-hdr, .bh-right, .bh-chip, .lt-speech-card, ' +
      '.lt-speech-avt, .lt-speech-name, .lp-strip, .lt-action-btns, .common-mistake, ' +
      '#quizArea, .quiz-embed, button, script, style, nav, .vt-listen-btn, .vt-teach-btn, .ctx-nav-btn'
    ).forEach(function(x){ x.remove(); });
    var t = (clone.textContent || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2B05}-\u{2B07}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');
    return t.replace(/\s+/g, ' ').trim();
  }

  function snip(t, n){ return t.length > n ? t.substring(0, n - 3) + '...' : t; }

  var who = studentName || 'class';

  // ── 1. INTRO — don't read the opening, teach instead ──
  segments.push({
    selector: '.lt-speech-card',
    speech: 'Good morning ' + who + '! I am so happy to see you today. We are about to learn something very interesting — ' + title + '. Now, I want you to follow along as I explain. You can see the lesson on your screen. I will teach you through it section by section. Let us go!'
  });

  // ── 2. DEFINITION — summarise, don't read ──
  var defBox = tmp.querySelector('.def-text');
  if (defBox){
    var defText = clean(defBox);
    if (defText){
      // Extract the core keyword if possible
      var kw = defText.match(/(?:a\s+)?(\w[\w\s]{2,20})\s+(?:is|are|refers|means)/i);
      var keyword = kw ? kw[1].trim() : title;
      segments.push({
        selector: '.def-box',
        speech: 'Look at the definition on your screen. This is very important. In simple terms, ' + keyword + ' — ' + snip(defText, 200) + '. Now, the key thing I want you to take away from this definition is what makes ' + keyword + ' special. If the examiner asks you to define it, this is exactly what you write. Read it again on your screen and make sure you understand every word.'
      });
    }
  }

  // ── 3. EXPLANATION — teach over each paragraph/step ──
  var explSection = tmp.querySelector('.expl-section');
  if (explSection){
    var paras = explSection.querySelectorAll('.expl-para');
    paras.forEach(function(p, i){
      var pText = clean(p);
      if (!pText || pText.length < 30) return;

      // Summarise — don't read the whole paragraph
      var summary = snip(pText, 150);
      var teacherIntros = [
        'Now look at this section on your screen. What it is really saying is: ',
        'This next part is important. Let me break it down for you simply. ',
        'Read this paragraph on your screen. Here is what you need to understand from it: ',
        'Pay attention to this part. The key point here is: '
      ];
      segments.push({
        selector: '.expl-para:nth-of-type(' + (i + 1) + ')',
        selectorFallback: '.expl-section',
        speech: teacherIntros[i % teacherIntros.length] + summary + '. You see? It is not complicated when you break it down. The important thing to remember here is the main idea — not every single word. Are you following me?'
      });
    });

    // Analogy
    var analogy = explSection.querySelector('.expl-analogy');
    if (analogy){
      var aText = clean(analogy);
      if (aText){
        segments.push({
          selector: '.expl-analogy',
          selectorFallback: '.expl-section',
          speech: 'Now look at this analogy on your screen. This is my favourite part because it makes everything click. Think about it — ' + snip(aText, 180) + '. You see how that connects? When you think of it that way, you will never forget this topic. That is the power of a good analogy.'
        });
      }
    }

    // Steps / sub-topics
    var steps = explSection.querySelectorAll('.expl-step');
    if (steps.length){
      steps.forEach(function(s, i){
        var stepTitle = '';
        var h = s.querySelector('.step-title, h4, h3');
        if (h) stepTitle = clean(h);
        var body = s.querySelector('.step-body');
        var bodyText = body ? clean(body) : clean(s);
        if (!bodyText || bodyText.length < 20) return;

        var ordinals = ['The first', 'The second', 'The third', 'The fourth', 'The fifth'];
        var ord = ordinals[i] || 'The next';

        segments.push({
          selector: '.expl-step:nth-of-type(' + (i + 1) + ')',
          selectorFallback: '.expl-section',
          speech: ord + ' key concept is ' + (stepTitle ? stepTitle + '. ' : '') + 'Look at it on your screen. ' + 'What this is really telling you is: ' + snip(bodyText, 180) + '. ' + (i === 0 ? 'This is the foundation — everything else builds on it.' : 'You see how this connects to what we just talked about?') + ' Make sure you understand this before we move on.'
        });
      });
    }

    // Callouts
    var callouts = explSection.querySelectorAll('.expl-callout');
    callouts.forEach(function(c){
      var body = c.querySelector('.callout-body');
      if (body){
        var cText = clean(body);
        if (cText && cText.length > 15){
          segments.push({
            selector: '.expl-callout',
            selectorFallback: '.expl-section',
            speech: 'Now, there is an important note here on your screen. Pay extra attention to it. ' + snip(cText, 180) + '. Students who know this do better in exams. Do not skip over it.'
          });
        }
      }
    });
  }

  // ── 4. FORMULA — explain, don't just read ──
  var formulaSection = tmp.querySelector('.formula-section');
  if (formulaSection){
    var formulaDisplay = formulaSection.querySelector('.formula-display');
    var formulaNote = formulaSection.querySelector('.formula-note');
    var fText = clean(formulaDisplay);
    var fnText = formulaNote ? clean(formulaNote) : '';
    if (fText){
      segments.push({
        selector: '.formula-section',
        speech: 'Now look at the formula on your screen. The formula is ' + fText + '. ' + (fnText ? 'Let me explain what each part means. ' + snip(fnText, 150) + '. ' : '') + 'This formula is something you must memorise. In the exam, they will not give it to you — you must know it by heart. So read it again, understand what each symbol means, and then close your eyes and try to say it from memory.'
      });
    }
  }

  // ── 5. WORKED EXAMPLE — teach step by step, help them get it ──
  var workedSection = tmp.querySelector('.worked-section');
  if (workedSection){
    var question = workedSection.querySelector('.worked-question');
    var stepEls = workedSection.querySelectorAll('.ws-line');
    var answerEl = workedSection.querySelector('.worked-answer');
    var qText = clean(question);
    var wSteps = [];
    stepEls.forEach(function(s){ var t = clean(s); if (t) wSteps.push(t); });
    var aText = clean(answerEl);

    if (qText){
      // Pose the question — make them think first
      segments.push({
        selector: '.worked-question',
        selectorFallback: '.worked-section',
        speech: 'Now we have reached the worked example. Look at the question on your screen. It says: ' + snip(qText, 150) + '. Before you look at the solution, I want you to think. How would YOU solve this? What formula or concept would you use? Take five seconds to think about it. Okay, now let me walk you through the solution.'
      });

      // Walk through the steps — explain the reasoning, don't just read
      if (wSteps.length){
        var stepSpeech = 'Follow along on your screen as I explain each step. ';
        wSteps.forEach(function(step, i){
          var labels = ['The first thing we do is: ', 'Then, ', 'Next, ', 'After that, ', 'And finally, '];
          var label = labels[i] || 'Next step: ';
          stepSpeech += label + step + '. ';
          if (i === 0) stepSpeech += 'You see why we started here? It is because this is the logical first move. ';
          if (i === wSteps.length - 1) stepSpeech += 'And that brings us to the answer. ';
        });
        segments.push({
          selector: '.worked-section',
          speech: stepSpeech + 'Are you following the working?'
        });
      }

      // Answer — drive home the lesson
      if (aText){
        segments.push({
          selector: '.worked-answer',
          selectorFallback: '.worked-section',
          speech: 'The final answer is: ' + aText + '. Look at it on your screen. Now here is what I want you to do — go back to the question, cover the solution with your hand, and try to solve it yourself. If you can get the same answer, then you truly understand it. And remember, in the exam, always show your working. The examiner gives marks for each correct step, not just the final answer.'
        });
      }
    }
  }

  // ── 6. KEY TERMS — quiz them ──
  var ktSection = tmp.querySelector('.keyterms-section');
  if (ktSection){
    var ktCards = ktSection.querySelectorAll('.kt-card');
    var termNames = [];
    ktCards.forEach(function(card){
      var term = card.querySelector('.kt-term');
      if (term) termNames.push(clean(term));
    });
    if (termNames.length){
      segments.push({
        selector: '.keyterms-section',
        speech: 'Now scroll down to the key terms on your screen. You can see ' + termNames.length + ' important terms: ' + termNames.join(', ') + '. Read each definition carefully. I want you to try something — cover each definition and see if you can say it from memory. If you can define all ' + termNames.length + ' terms without looking, you are well prepared.'
      });
    }
  }

  // ── 7. TABLE ──
  var tableSection = tmp.querySelector('.table-section');
  if (tableSection){
    var tableTitle = '';
    var tTitle = tableSection.querySelector('.tbl-label, caption, .table-title');
    if (tTitle) tableTitle = clean(tTitle);
    segments.push({
      selector: '.table-section',
      speech: 'There is a summary table on your screen' + (tableTitle ? ' about ' + tableTitle : '') + '. Tables like this are very useful because they organise information clearly. Look at each row and each column. This is the kind of thing you can draw quickly in the exam to organise your answer. Study it carefully.'
    });
  }

  // ── 8. MNEMONIC ──
  var mnSection = tmp.querySelector('.mnemonic-section');
  if (mnSection){
    var mnText = clean(mnSection.querySelector('.mn-text'));
    if (mnText){
      segments.push({
        selector: '.mnemonic-section',
        speech: 'Look at the memory trick on your screen. It says: ' + snip(mnText, 150) + '. This is brilliant because it gives you a shortcut. When you are in the exam hall and your mind goes blank, this memory trick will bring everything back. Say it to yourself three times right now.'
      });
    }
  }

  // ── 9. EXAM TIP ──
  var examTip = tmp.querySelector('.exam-tip-section');
  if (examTip){
    var tipText = clean(examTip);
    if (tipText && tipText.length > 15){
      segments.push({
        selector: '.exam-tip-section',
        speech: 'And look at the exam tip at the bottom. This is gold. ' + snip(tipText, 180) + '. Students who follow this advice consistently score higher. Take it seriously.'
      });
    }
  }

  // ── 10. CLOSING ──
  segments.push({
    selector: null, // no highlight
    speech: 'And that is everything for this lesson on ' + title + '! Now, here is what I want you to do. Go back to the top and read through the lesson one more time — but this time, try to explain each section to yourself as if you are the teacher. If you can teach it, you know it. You did very well today, ' + who + '. I am proud of you. Keep studying and you will succeed!'
  });

  return segments;
}

// ═══════════════════════════════════════════════════════════
// UI — floating control bar + section highlighting
// ═══════════════════════════════════════════════════════════
function showBar(){
  removeBar();
  var bar = document.createElement('div');
  bar.id = 'vtBar';
  bar.className = 'vt-bar';
  bar.innerHTML = ''
    + '<span class="vt-bar-icon" id="vtBarIcon">👨🏿‍🏫</span>'
    + '<div class="vt-bar-info">'
    +   '<span class="vt-bar-text" id="vtBarText">Teaching...</span>'
    +   '<span class="vt-bar-sub" id="vtBarSub"></span>'
    + '</div>'
    + '<span class="vt-bar-progress"><span class="vt-bar-fill" id="vtBarFill"></span></span>'
    + '<div class="vt-bar-ctrls">'
    +   '<button class="vt-bar-btn" id="vtBarPrev" title="Previous section">⏪</button>'
    +   '<button class="vt-bar-btn vt-bar-play" id="vtBarPause" title="Pause">⏸</button>'
    +   '<button class="vt-bar-btn" id="vtBarNext" title="Next section">⏩</button>'
    + '</div>'
    + '<div class="vt-bar-vol">'
    +   '<span class="vt-bar-vol-ico" id="vtBarVolIco" title="Mute / unmute">🔊</span>'
    +   '<input type="range" min="0" max="100" id="vtBarVol" class="vt-bar-vol-slider" title="Volume">'
    + '</div>'
    + '<button class="vt-bar-btn vt-bar-close" id="vtBarStop" title="Stop teaching">✕</button>';
  document.body.appendChild(bar);

  // Wire controls
  document.getElementById('vtBarPause').onclick = function(){
    if (state.isPaused){
      resumeTeaching();
    } else {
      pauseTeaching();
    }
  };
  document.getElementById('vtBarStop').onclick = function(){
    stopTeaching();
  };
  document.getElementById('vtBarPrev').onclick = function(){
    var idx = Math.max(0, (state.currentSegment || 0) - 1);
    seekToSegment(idx);
  };
  document.getElementById('vtBarNext').onclick = function(){
    var total = (state.segments && state.segments.length) || 0;
    var idx = Math.min(total - 1, (state.currentSegment || 0) + 1);
    if (idx === (state.currentSegment || 0)) return; // already last
    seekToSegment(idx);
  };

  // Volume slider
  var vol = (window.elevenGetVolume ? window.elevenGetVolume() : 0.85);
  var slider = document.getElementById('vtBarVol');
  slider.value = Math.round(vol * 100);
  slider.oninput = function(){
    var v = parseInt(slider.value, 10) / 100;
    if (window.elevenSetVolume) window.elevenSetVolume(v);
    updateVolIcon(v);
  };
  updateVolIcon(vol);
  document.getElementById('vtBarVolIco').onclick = function(){
    var current = parseInt(slider.value, 10) / 100;
    if (current > 0){
      slider.dataset.last = String(current);
      slider.value = 0;
    } else {
      var last = parseFloat(slider.dataset.last || '0.85');
      slider.value = Math.round(last * 100);
    }
    slider.oninput();
  };

  watchKeyboard();
  installVisibilityPause();
}

function updateVolIcon(v){
  var el = document.getElementById('vtBarVolIco');
  if (!el) return;
  el.textContent = v === 0 ? '🔇' : v < 0.4 ? '🔈' : v < 0.75 ? '🔉' : '🔊';
}

// Jump to a specific segment — stops current audio, plays the target.
function seekToSegment(idx){
  if (!state.active) return;
  if (idx < 0 || idx >= state.segments.length) return;
  if (window.elevenStop) window.elevenStop();
  state.currentSegment = idx;
  state.isPlaying = true;
  state.isPaused = false;
  var pauseBtn = document.getElementById('vtBarPause');
  if (pauseBtn) pauseBtn.textContent = '⏸';
  playSegment(idx);
}

// ════════════════════════════════════════════════════════════════
// AUTO-PAUSE WHEN STUDENT LEAVES THE LESSON
// Saves ElevenLabs API costs + bandwidth. Pauses on:
//   - Tab/app hidden (visibilitychange)
//   - Leaving the lesson page (navigation away from pg-classroom)
// Resumes from same segment when they return.
// ════════════════════════════════════════════════════════════════
var _vtVisHandler = null;
var _vtRouteWatcher = null;
function installVisibilityPause(){
  if (_vtVisHandler) return;
  _vtVisHandler = function(){
    if (document.hidden){
      if (state.active && state.isPlaying && !state.isPaused){
        pauseTeaching();
        // Mark as auto-paused so we know to resume on return
        state._autoPausedByVisibility = true;
      }
    } else {
      if (state.active && state._autoPausedByVisibility){
        state._autoPausedByVisibility = false;
        resumeTeaching();
      }
    }
  };
  document.addEventListener('visibilitychange', _vtVisHandler);

  // Also watch for in-app navigation away from the lesson.
  // The classroom page is .page.active with id pg-classroom.
  if (!_vtRouteWatcher){
    _vtRouteWatcher = setInterval(function(){
      if (!state.active) return;
      var classroomActive = !!document.querySelector('#pg-classroom.active');
      // If the lesson view is no longer the active page, auto-pause
      if (!classroomActive && state.isPlaying && !state.isPaused){
        pauseTeaching();
        state._autoPausedByRoute = true;
      } else if (classroomActive && state._autoPausedByRoute){
        state._autoPausedByRoute = false;
        resumeTeaching();
      }
    }, 1200);
  }
}
function uninstallVisibilityPause(){
  if (_vtVisHandler){
    document.removeEventListener('visibilitychange', _vtVisHandler);
    _vtVisHandler = null;
  }
  if (_vtRouteWatcher){
    clearInterval(_vtRouteWatcher);
    _vtRouteWatcher = null;
  }
}

// Move bar above virtual keyboard on mobile when it opens
var _vpListener = null;
function watchKeyboard(){
  if (_vpListener || !window.visualViewport) return;
  _vpListener = function(){
    var bar = document.getElementById('vtBar');
    var cap = document.getElementById('vtCaption');
    if (!bar) return;
    var vv = window.visualViewport;
    var keyboardHeight = window.innerHeight - vv.height;
    if (keyboardHeight > 100){
      bar.style.bottom = (keyboardHeight + 16) + 'px';
      if (cap) cap.style.bottom = (keyboardHeight + 80) + 'px';
    } else {
      bar.style.bottom = '';
      if (cap) cap.style.bottom = '';
    }
  };
  window.visualViewport.addEventListener('resize', _vpListener);
}
function unwatchKeyboard(){
  if (_vpListener && window.visualViewport){
    window.visualViewport.removeEventListener('resize', _vpListener);
  }
  _vpListener = null;
}

function removeBar(){
  var old = document.getElementById('vtBar');
  if (old) old.remove();
  unwatchKeyboard();
  uninstallVisibilityPause();
}

function updateBar(text, sub, progress){
  var t = document.getElementById('vtBarText');
  var s = document.getElementById('vtBarSub');
  var f = document.getElementById('vtBarFill');
  if (t) t.textContent = text;
  if (s) s.textContent = sub || '';
  if (f) f.style.width = (progress * 100) + '%';
}

function showCaption(text){
  var cap = document.getElementById('vtCaption');
  if (!cap){
    cap = document.createElement('div');
    cap.id = 'vtCaption';
    cap.className = 'vt-caption';
    document.body.appendChild(cap);
  }
  cap.textContent = text.length > 200 ? text.substring(0, 200) + '...' : text;
  cap.classList.add('show');
}

function hideCaption(){
  var cap = document.getElementById('vtCaption');
  if (cap) cap.classList.remove('show');
}

// Highlight section on the lesson page
var currentHighlight = null;
function highlightSection(selector, fallback){
  clearHighlight();
  if (!selector) return;

  var lessonBody = document.getElementById('lessonBody');
  if (!lessonBody) return;

  var el = lessonBody.querySelector(selector);
  if (!el && fallback) el = lessonBody.querySelector(fallback);
  if (!el) return;

  el.classList.add('vt-highlight', 'vt-highlight-pulse');
  currentHighlight = el;

  // Smooth scroll into view
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearHighlight(){
  if (currentHighlight){
    currentHighlight.classList.remove('vt-highlight', 'vt-highlight-pulse');
    currentHighlight = null;
  }
  // Also clear any stale ones
  document.querySelectorAll('.vt-highlight').forEach(function(el){
    el.classList.remove('vt-highlight', 'vt-highlight-pulse');
  });
}

// ═══════════════════════════════════════════════════════════
// PLAYBACK ENGINE — drive TTS through segments
// ═══════════════════════════════════════════════════════════
function speakText(text, onDone){
  // Don't fetch new audio if teaching has been paused or stopped.
  // Saves ElevenLabs API costs + bandwidth.
  if (!state.active || state.aborted || state.isPaused){
    return;
  }
  if (!window.elevenSpeak){
    // ElevenLabs not available — fall back to a reading-time delay.
    var words = text.split(/\s+/).length;
    var readTime = Math.max(3000, words * 300); // ~200 WPM
    setTimeout(function(){
      // Re-check state before continuing
      if (state.active && !state.aborted && !state.isPaused) onDone && onDone();
    }, readTime);
    return;
  }

  window.elevenSpeak(text, function(){
    // Re-check state — student may have paused/navigated away during playback
    if (!state.active || state.aborted) return;
    if (onDone) onDone();
  });
}

function playSegment(idx){
  if (!state.active || !state.isPlaying || state.aborted) return;
  if (idx >= state.segments.length){
    // All done
    finishTeaching();
    return;
  }

  state.currentSegment = idx;
  var seg = state.segments[idx];
  var total = state.segments.length;

  // Update UI
  var progress = (idx + 1) / total;
  var label = idx === 0 ? 'Introduction' :
              idx === total - 1 ? 'Wrapping up' :
              'Teaching...';
  updateBar(label, (idx + 1) + ' of ' + total, progress);

  // Highlight the relevant section on screen
  highlightSection(seg.selector, seg.selectorFallback);

  // Show caption
  showCaption(seg.speech);

  // Speak — then advance
  speakText(seg.speech, function(){
    if (!state.active || state.aborted) return;
    // Small pause between sections
    setTimeout(function(){
      hideCaption();
      clearHighlight();
      if (state.isPlaying && !state.aborted){
        playSegment(idx + 1);
      }
    }, 600);
  });
}

function startTeaching(opts){
  injectStyles();
  // CONTINUATION GUARD — if we already have segments cached for this exact
  // lesson title and we're not aborted, resume from where we left off
  // instead of restarting from the beginning.
  var newTitle = opts.title || 'Lesson';
  var resuming = (state.title === newTitle && state.segments && state.segments.length && state.currentSegment > 0 && state.currentSegment < state.segments.length);

  state.active = true;
  state.isPlaying = true;
  state.isPaused = false;
  state.aborted = false;
  state.title = newTitle;
  state.subject = opts.subject || '';
  state.studentName = opts.studentName || '';

  if (!resuming){
    state.currentSegment = 0;
    state.segments = parseLesson(opts.content || '', state.title, state.studentName);
  }

  console.log('[VoiceTeacher] ' + (resuming ? 'Resuming from segment ' + state.currentSegment : 'Starting with ' + state.segments.length + ' segments'));

  // Update the Teach Me button
  var btn = document.getElementById('vtTeachBtn');
  if (btn){
    btn.classList.add('teaching');
    var iconSpan = btn.querySelector('.vt-teach-icon');
    if (iconSpan) iconSpan.textContent = '⏹';
    var labelSpan = btn.querySelector('span:nth-child(2)');
    if (labelSpan) labelSpan.textContent = 'Stop Teaching';
  }

  showBar();
  // Show a beautiful "preparing" loading state for the first ~600ms so
  // students know it's working (no AI mention — just confidence-building).
  updateBar('Preparing your lesson...', '✨', 0.02);
  setTimeout(function(){
    if (state.active && !state.aborted){
      playSegment(state.currentSegment || 0);
    }
  }, 600);
}

function stopTeaching(){
  state.active = false;
  state.isPlaying = false;
  state.aborted = true;

  // Stop any active TTS
  if (window.elevenStop) window.elevenStop();

  clearHighlight();
  hideCaption();
  removeBar();

  // Reset button — speaker icon + Teach Me Voice label
  var btn = document.getElementById('vtTeachBtn');
  if (btn){
    btn.classList.remove('teaching');
    var iconSpan = btn.querySelector('.vt-teach-icon');
    if (iconSpan) iconSpan.textContent = '🔊';
    var labelSpan = btn.querySelector('span:nth-child(2)');
    if (labelSpan) labelSpan.textContent = 'Teach Me Voice';
  }

  console.log('[VoiceTeacher] Stopped');
}

function pauseTeaching(){
  state.isPaused = true;
  state.isPlaying = false;
  if (window.elevenPause) window.elevenPause();

  var pauseBtn = document.getElementById('vtBarPause');
  if (pauseBtn) pauseBtn.textContent = '▶';

  updateBar('Paused', '', (state.currentSegment + 1) / state.segments.length);
}

function resumeTeaching(){
  state.isPaused = false;
  state.isPlaying = true;
  if (window.elevenResume) window.elevenResume();

  var pauseBtn = document.getElementById('vtBarPause');
  if (pauseBtn) pauseBtn.textContent = '⏸';

  updateBar('Teaching...', (state.currentSegment + 1) + ' of ' + state.segments.length, (state.currentSegment + 1) / state.segments.length);
}

function finishTeaching(){
  clearHighlight();
  hideCaption();
  updateBar('Lesson complete!', '', 1);

  // Auto-dismiss after 3 seconds
  setTimeout(function(){
    removeBar();
    state.active = false;
    state.isPlaying = false;

    // Reset button — speaker icon + Teach Me Voice label
    var btn = document.getElementById('vtTeachBtn');
    if (btn){
      btn.classList.remove('teaching');
      var iconSpan = btn.querySelector('.vt-teach-icon');
      if (iconSpan) iconSpan.textContent = '🔊';
      var labelSpan = btn.querySelector('span:nth-child(2)');
      if (labelSpan) labelSpan.textContent = 'Teach Me Voice';
    }
    // Reset the lesson-pointer so next click starts fresh on completion
    state.currentSegment = 0;
    state.segments = [];
    state.title = '';
  }, 3000);

  console.log('[VoiceTeacher] Lesson complete');
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════
window.VoiceTeacher = {
  // Main entry point — toggle teach mode
  teach: function(opts){
    injectStyles();
    if (state.active){
      stopTeaching();
    } else {
      startTeaching(opts);
    }
  },

  // Show a subtle hint near the Teach Me button — "Click Teach Me Voice to
  // hear this lesson". Auto-dismisses after a few seconds. Used when a new
  // lesson loads so students discover the feature.
  showHint: function(){
    var btn = document.getElementById('vtTeachBtn');
    if (!btn || document.getElementById('vtHintBubble')) return;
    var hint = document.createElement('div');
    hint.id = 'vtHintBubble';
    hint.style.cssText = 'position:absolute;background:#fbbf24;color:#0b1220;padding:8px 14px;border-radius:100px;font-weight:800;font-size:.78rem;font-family:inherit;'
      + 'box-shadow:0 4px 14px rgba(251,191,36,.4);'
      + 'animation:vtHintFloat 1.4s ease-in-out infinite;z-index:50;white-space:nowrap;pointer-events:none;'
      + 'bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);';
    hint.textContent = '👆 Click "Teach Me Voice" to hear this lesson';
    // Ensure btn is positioned relative
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.appendChild(hint);
    // Inject keyframe once
    if (!document.getElementById('vtHintKf')){
      var st = document.createElement('style');
      st.id = 'vtHintKf';
      st.textContent = '@keyframes vtHintFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-4px)}}';
      document.head.appendChild(st);
    }
    setTimeout(function(){ if (hint.parentElement) hint.remove(); }, 6000);
  },

  stop: stopTeaching,
  pause: pauseTeaching,
  resume: resumeTeaching,
  isActive: function(){ return state.active; },
  isPlaying: function(){ return state.isPlaying; }
};

console.log('[VoiceTeacher] Voice-only teacher engine loaded');
})();
