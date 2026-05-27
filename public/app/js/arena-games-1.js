/* ════════════════════════════════════════════════════════════════
   ARENA GAMES EXPANSION (v1)
   ────────────────────────────────────────────────────────────────
   Adds 9 new games to the Live Arena plus ranking system,
   enhanced leaderboards, and crew support.
   Loaded AFTER arena-0.js and arena-rules-0.js.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ───────────── RANKING SYSTEM ───────────── */
var RANKS = [
  { name:'Rookie',     emoji:'\u{1F331}', min:0,    color:'#94a3b8' },
  { name:'Bronze',     emoji:'\u{1F949}', min:50,   color:'#cd7f32' },
  { name:'Silver',     emoji:'\u{1F948}', min:200,  color:'#c0c0c0' },
  { name:'Gold',       emoji:'\u{1F947}', min:500,  color:'#fbbf24' },
  { name:'Scholar',    emoji:'\u{1F393}', min:1200, color:'#3b82f6' },
  { name:'Professor',  emoji:'\u{1F3C6}', min:3000, color:'#a855f7' }
];
function getRank(xp){
  var r = RANKS[0];
  for(var i = RANKS.length - 1; i >= 0; i--){
    if(xp >= RANKS[i].min){ r = RANKS[i]; break; }
  }
  return r;
}
window.ArenaRanks = RANKS;
window.getArenaRank = getRank;

/* ───────────── UTILITY ───────────── */
function shuffle(a){
  a = a.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function rid(){ return 'a' + Math.random().toString(36).slice(2, 9); }

/* ═══════════════════════════════════════════
   GAME 1: AFRICAN TYCOON (Nigerian Monopoly)
   ═══════════════════════════════════════════ */
var TYCOON_PROPERTIES = [
  { name:'Aba Market Stall',     cost:500,   rent:80,   region:'South-East',    emoji:'\u{1F3EA}' },
  { name:'Lagos Island Plot',    cost:2000,  rent:350,  region:'South-West',    emoji:'\u{1F3DD}️' },
  { name:'Abuja CBD Office',     cost:1800,  rent:300,  region:'North-Central', emoji:'\u{1F3E2}' },
  { name:'Kano Textile Mill',    cost:1200,  rent:200,  region:'North-West',    emoji:'\u{1F3ED}' },
  { name:'Port Harcourt Oil',    cost:2500,  rent:450,  region:'South-South',   emoji:'\u{1F6E2}️' },
  { name:'Enugu Coal Mine',      cost:1500,  rent:250,  region:'South-East',    emoji:'⛏️' },
  { name:'Ibadan Cocoa Farm',    cost:800,   rent:130,  region:'South-West',    emoji:'\u{1F331}' },
  { name:'Jos Tin Mine',         cost:1000,  rent:170,  region:'North-Central', emoji:'\u{1F48E}' },
  { name:'Calabar Resort',       cost:1600,  rent:280,  region:'South-South',   emoji:'\u{1F3D6}️' },
  { name:'Sokoto Solar Farm',    cost:900,   rent:150,  region:'North-West',    emoji:'☀️' },
  { name:'Onitsha Trading Post', cost:1100,  rent:190,  region:'South-East',    emoji:'\u{1F4E6}' },
  { name:'Benin Bronze Gallery', cost:1400,  rent:230,  region:'South-South',   emoji:'\u{1F3DB}️' }
];
var TYCOON_EVENTS = [
  { text:'\u{1F389} Oil prices surge! Your oil investments earn double rent this round.', type:'bonus', target:'oil' },
  { text:'\u{1F4C9} Market crash! Lose A₦300.', type:'lose', amount:300 },
  { text:'\u{1F3D7}️ Government contract! Earn A₦500.', type:'gain', amount:500 },
  { text:'\u{1F4B0} Diaspora investment! Gain A₦400.', type:'gain', amount:400 },
  { text:'\u{1F4CA} Inflation hits! All rents drop 30% this round.', type:'rent_drop' },
  { text:'\u{1F393} Your worker gets a scholarship — +A₦200 productivity bonus.', type:'gain', amount:200 },
  { text:'⚡ Power outage! Pay A₦250 for generator fuel.', type:'lose', amount:250 },
  { text:'\u{1F3E6} Tax audit! Pay 15% of your cash as tax.', type:'tax', pct:0.15 },
  { text:'\u{1F30D} Export deal! Earn A₦600 from international trade.', type:'gain', amount:600 },
  { text:'\u{1F527} Property maintenance needed. Pay A₦200.', type:'lose', amount:200 }
];

window.playAfricanTycoon = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var grp = ctx.room ? ctx.room.classGroup : 'juniors';
    var startCash = grp === 'kids' ? 3000 : grp === 'juniors' ? 2500 : 2000;
    var cash = startCash;
    var owned = [];
    var round = 0;
    var totalRounds = grp === 'kids' ? 8 : 10;
    var log = [];
    var availableProps = shuffle(TYCOON_PROPERTIES.slice());

    function totalWealth(){
      var propVal = 0;
      owned.forEach(function(idx){ propVal += TYCOON_PROPERTIES[idx].cost; });
      return cash + propVal;
    }

    function collectRent(){
      var rent = 0;
      owned.forEach(function(idx){ rent += TYCOON_PROPERTIES[idx].rent; });
      return rent;
    }

    function render(){
      if(round >= totalRounds){
        var wealth = totalWealth();
        var score = Math.round(wealth / 10);
        resolve({ score:score, correct:owned.length, total:totalRounds, iWon: wealth >= startCash * 2 });
        return;
      }

      var rentEarned = collectRent();
      if(round > 0 && rentEarned > 0){
        cash += rentEarned;
        log.push('Collected A₦' + rentEarned + ' rent');
      }

      var eventHtml = '';
      if(round >= 2 && Math.random() < 0.35){
        var ev = pick(TYCOON_EVENTS);
        eventHtml = '<div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);border-radius:12px;padding:12px;margin-bottom:12px;font-size:.88rem;color:#fcd34d;">' + ev.text + '</div>';
        if(ev.type === 'lose'){ cash = Math.max(0, cash - ev.amount); log.push('Lost A₦' + ev.amount); }
        else if(ev.type === 'gain'){ cash += ev.amount; log.push('Earned A₦' + ev.amount); }
        else if(ev.type === 'tax'){ var tax = Math.round(cash * ev.pct); cash -= tax; log.push('Paid A₦' + tax + ' tax'); }
      }

      var prop = availableProps[round % availableProps.length];
      var propIdx = TYCOON_PROPERTIES.indexOf(prop);
      var canBuy = cash >= prop.cost && owned.indexOf(propIdx) === -1;

      var html = '';
      html += '<div class="ar-timer">Round ' + (round + 1) + '/' + totalRounds + ' · <span class="ar-score-pill">A₦' + cash.toLocaleString() + '</span></div>';

      html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">';
      if(owned.length === 0){
        html += '<span style="color:rgba(255,255,255,.4);font-size:.78rem;">No properties yet</span>';
      }
      owned.forEach(function(idx){
        var p = TYCOON_PROPERTIES[idx];
        html += '<span style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);padding:4px 10px;border-radius:8px;font-size:.75rem;color:#34d399;font-weight:700;">' + p.emoji + ' ' + p.name + '</span>';
      });
      html += '</div>';

      html += eventHtml;

      html += '<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px;margin-bottom:14px;">';
      html += '<div style="font-size:1.4rem;text-align:center;margin-bottom:4px;">' + prop.emoji + '</div>';
      html += '<div style="font-weight:900;font-size:1.05rem;color:#fff;text-align:center;">' + prop.name + '</div>';
      html += '<div style="color:rgba(255,255,255,.5);font-size:.78rem;text-align:center;margin-bottom:8px;">' + prop.region + ' · Rent: A₦' + prop.rent + '/round</div>';
      html += '<div style="display:flex;gap:8px;justify-content:center;">';
      if(canBuy){
        html += '<button class="ar-join" onclick="window._tycoonBuy()" style="max-width:180px;">Buy for A₦' + prop.cost.toLocaleString() + '</button>';
      } else if(owned.indexOf(propIdx) !== -1){
        html += '<span style="color:#10b981;font-weight:700;font-size:.85rem;">✓ Already owned</span>';
      } else {
        html += '<span style="color:#ef4444;font-weight:700;font-size:.85rem;">Not enough cash</span>';
      }
      html += '<button class="ar-spec" onclick="window._tycoonSkip()">Skip →</button>';
      html += '</div></div>';

      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">';
      html += '<div style="background:rgba(59,130,246,.1);padding:8px;border-radius:10px;text-align:center;"><div style="font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;font-weight:700;">Cash</div><div style="font-weight:900;color:#60a5fa;">A₦' + cash.toLocaleString() + '</div></div>';
      html += '<div style="background:rgba(16,185,129,.1);padding:8px;border-radius:10px;text-align:center;"><div style="font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;font-weight:700;">Properties</div><div style="font-weight:900;color:#34d399;">' + owned.length + '</div></div>';
      html += '<div style="background:rgba(251,191,36,.1);padding:8px;border-radius:10px;text-align:center;"><div style="font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;font-weight:700;">Total Wealth</div><div style="font-weight:900;color:#fbbf24;">A₦' + totalWealth().toLocaleString() + '</div></div>';
      html += '</div>';

      stage.innerHTML = html;

      window._tycoonBuy = function(){
        if(cash >= prop.cost && owned.indexOf(propIdx) === -1){
          cash -= prop.cost;
          owned.push(propIdx);
          log.push('Bought ' + prop.name);
        }
        round++;
        render();
      };
      window._tycoonSkip = function(){
        round++;
        render();
      };
    }
    render();
  });
};

/* ═══════════════════════════════════════════
   GAME 2: ARENA CHESS (with Nigerian Kings)
   ═══════════════════════════════════════════ */
var CHESS_P = {
  K:{w:'♔',b:'♚'}, Q:{w:'♕',b:'♛'}, R:{w:'♖',b:'♜'},
  B:{w:'♗',b:'♝'}, N:{w:'♘',b:'♞'}, P:{w:'♙',b:'♟'}
};
var NAIJA_KINGS = {
  K:{w:'\u{1F451}',b:'\u{1F934}\u{1F3FF}'}, Q:{w:'\u{1F478}\u{1F3FE}',b:'\u{1F482}\u{1F3FF}'}, R:{w:'\u{1F3F0}',b:'\u{1F5FC}'},
  B:{w:'\u{1F4FF}',b:'\u{1F52E}'}, N:{w:'\u{1F40E}',b:'\u{1F993}'}, P:{w:'⚔️',b:'\u{1F6E1}️'}
};

window.playArenaChess = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var files = ['a','b','c','d','e','f','g','h'];
    var useNaija = false;
    var pieces = CHESS_P;
    var board = {};
    var turn = 'w';
    var selected = null;
    var gameOver = false;
    var moveCount = 0;
    var capturedW = [];
    var capturedB = [];
    var timeLeft = 300;
    var timerIv = null;

    function initBoard(){
      board = {};
      var back = ['R','N','B','Q','K','B','N','R'];
      for(var i = 0; i < 8; i++){
        board[files[i] + '1'] = {p:back[i], c:'w'};
        board[files[i] + '2'] = {p:'P', c:'w'};
        board[files[i] + '7'] = {p:'P', c:'b'};
        board[files[i] + '8'] = {p:back[i], c:'b'};
      }
    }

    function validMoves(sq){
      var piece = board[sq];
      if(!piece) return [];
      var f = files.indexOf(sq[0]);
      var r = parseInt(sq[1], 10);
      var moves = [];
      function tryM(ff, rr){
        if(ff < 0 || ff > 7 || rr < 1 || rr > 8) return 'out';
        var t = files[ff] + rr;
        var p = board[t];
        if(!p){ moves.push(t); return 'empty'; }
        if(p.c !== piece.c){ moves.push(t); return 'capture'; }
        return 'block';
      }
      function slide(df, dr){
        var ff = f + df, rr = r + dr;
        while(ff >= 0 && ff <= 7 && rr >= 1 && rr <= 8){
          var res = tryM(ff, rr);
          if(res === 'block' || res === 'capture') break;
          ff += df; rr += dr;
        }
      }
      switch(piece.p){
        case 'K':
          for(var df = -1; df <= 1; df++){
            for(var dr = -1; dr <= 1; dr++){
              if(df === 0 && dr === 0) continue;
              tryM(f + df, r + dr);
            }
          }
          break;
        case 'Q': slide(1,0);slide(-1,0);slide(0,1);slide(0,-1);slide(1,1);slide(1,-1);slide(-1,1);slide(-1,-1); break;
        case 'R': slide(1,0);slide(-1,0);slide(0,1);slide(0,-1); break;
        case 'B': slide(1,1);slide(1,-1);slide(-1,1);slide(-1,-1); break;
        case 'N':
          [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(function(d){
            tryM(f + d[0], r + d[1]);
          });
          break;
        case 'P':
          var dir = piece.c === 'w' ? 1 : -1;
          var start = piece.c === 'w' ? 2 : 7;
          if(!board[files[f] + (r + dir)]){
            moves.push(files[f] + (r + dir));
            if(r === start && !board[files[f] + (r + 2 * dir)]){
              moves.push(files[f] + (r + 2 * dir));
            }
          }
          [-1, 1].forEach(function(d){
            var tf = f + d, tr = r + dir;
            if(tf >= 0 && tf <= 7 && tr >= 1 && tr <= 8){
              var t = board[files[tf] + tr];
              if(t && t.c !== piece.c) moves.push(files[tf] + tr);
            }
          });
          break;
      }
      return moves;
    }

    var PIECE_VAL = {P:1, N:3, B:3, R:5, Q:9, K:100};

    function aiMove(){
      var allMoves = [];
      for(var ri = 1; ri <= 8; ri++){
        for(var fi = 0; fi < 8; fi++){
          var sq = files[fi] + ri;
          var p = board[sq];
          if(!p || p.c !== 'b') continue;
          var moves = validMoves(sq);
          moves.forEach(function(to){
            var sc = 0;
            var cap = board[to];
            if(cap) sc += PIECE_VAL[cap.p] * 10;
            var tf = files.indexOf(to[0]), tr = parseInt(to[1], 10);
            sc += (3.5 - Math.abs(3.5 - tf)) * 0.3 + (4.5 - Math.abs(4.5 - tr)) * 0.2;
            if(p.p === 'P') sc += (7 - tr) * 0.5;
            if((p.p === 'N' || p.p === 'B') && ri === 8) sc += 1.5;
            sc += Math.random() * 2;
            allMoves.push({from:sq, to:to, score:sc});
          });
        }
      }
      if(!allMoves.length) return null;
      allMoves.sort(function(a, b){ return b.score - a.score; });
      return allMoves[Math.floor(Math.random() * Math.min(3, allMoves.length))];
    }

    function checkGameOver(){
      var wK = false, bK = false;
      for(var sq in board){
        if(board[sq].p === 'K'){
          if(board[sq].c === 'w') wK = true;
          if(board[sq].c === 'b') bK = true;
        }
      }
      if(!wK) return 'b_wins';
      if(!bK) return 'w_wins';
      return null;
    }

    function startTimer(){
      timerIv = setInterval(function(){
        timeLeft--;
        var el = document.getElementById('arChessTimer');
        if(el) el.textContent = Math.floor(timeLeft / 60) + ':' + ('0' + (timeLeft % 60)).slice(-2);
        if(timeLeft <= 0){
          clearInterval(timerIv);
          gameOver = true;
          var wMat = 0, bMat = 0;
          for(var sq in board){
            var p = board[sq];
            if(p.c === 'w') wMat += PIECE_VAL[p.p];
            else bMat += PIECE_VAL[p.p];
          }
          var score = Math.max(0, (wMat - bMat) * 5 + capturedB.length * 10 + moveCount * 2);
          resolve({score:score, correct:capturedB.length, total:moveCount, iWon:wMat > bMat});
        }
      }, 1000);
    }

    function doClick(sq){
      if(gameOver || turn !== 'w') return;
      var piece = board[sq];
      if(selected){
        if(sq === selected){ selected = null; renderBoard(); return; }
        var vm = validMoves(selected);
        if(vm.indexOf(sq) !== -1){
          if(board[sq]) capturedB.push(board[sq].p);
          board[sq] = board[selected];
          delete board[selected];
          if(board[sq].p === 'P' && parseInt(sq[1], 10) === 8) board[sq].p = 'Q';
          selected = null;
          moveCount++;
          var result = checkGameOver();
          if(result){
            gameOver = true;
            clearInterval(timerIv);
            var score = result === 'w_wins' ? 200 + capturedB.length * 10 + Math.max(0, 150 - moveCount * 2) : capturedB.length * 5;
            resolve({score:score, correct:capturedB.length, total:moveCount, iWon:result === 'w_wins'});
            return;
          }
          turn = 'b';
          renderBoard();
          setTimeout(function(){
            var mv = aiMove();
            if(mv){
              if(board[mv.to]) capturedW.push(board[mv.to].p);
              board[mv.to] = board[mv.from];
              delete board[mv.from];
              if(board[mv.to].p === 'P' && parseInt(mv.to[1], 10) === 1) board[mv.to].p = 'Q';
              var r2 = checkGameOver();
              if(r2){
                gameOver = true;
                clearInterval(timerIv);
                var sc2 = r2 === 'w_wins' ? 200 : capturedB.length * 5;
                resolve({score:sc2, correct:capturedB.length, total:moveCount, iWon:r2 === 'w_wins'});
                return;
              }
            }
            turn = 'w';
            renderBoard();
          }, 500);
        } else if(piece && piece.c === 'w'){
          selected = sq;
          renderBoard();
        }
      } else {
        if(piece && piece.c === 'w'){
          selected = sq;
          renderBoard();
        }
      }
    }

    var moveLog = [];
    function logMove(from, to, piece, capture){
      moveLog.push({ from:from, to:to, piece:piece, capture:capture, n:moveLog.length+1 });
    }

    function renderBoard(){
      var vm = (selected && turn === 'w') ? validMoves(selected) : [];
      var html = '';

      /* ── Top bar: player info + timer ── */
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 2px;">';
      /* Black side */
      html += '<div style="display:flex;align-items:center;gap:8px;">';
      html += '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1e293b,#334155);border:2px solid '+(turn==='b'?'#ef4444':'rgba(255,255,255,.15)')+';display:flex;align-items:center;justify-content:center;font-size:1rem;">'+pieces.K.b+'</div>';
      html += '<div><div style="font-weight:800;font-size:.82rem;color:#fff;">AI Opponent</div>';
      html += '<div style="font-size:.68rem;color:rgba(255,255,255,.45);">'+capturedW.map(function(p){ return pieces[p].w; }).join(' ')+(capturedW.length?'':'no captures')+'</div></div>';
      html += '</div>';
      /* Timer */
      html += '<div style="display:flex;flex-direction:column;align-items:center;">';
      html += '<div id="arChessTimer" style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);color:#fbbf24;padding:4px 14px;border-radius:100px;font-weight:900;font-size:1rem;font-family:\'Bricolage Grotesque\',monospace;">' + Math.floor(timeLeft / 60) + ':' + ('0' + (timeLeft % 60)).slice(-2) + '</div>';
      html += '<div style="font-size:.6rem;color:rgba(255,255,255,.3);margin-top:2px;">'+(turn==='w'?'Your turn':'AI thinking...')+'</div>';
      html += '</div>';
      /* Theme toggle */
      html += '<button onclick="window._chessToggleTheme()" style="background:'+(useNaija?'linear-gradient(135deg,rgba(16,185,129,.2),rgba(59,130,246,.15))':'rgba(255,255,255,.06)')+';border:1px solid '+(useNaija?'rgba(16,185,129,.4)':'rgba(255,255,255,.12)')+';color:#fff;padding:5px 10px;border-radius:8px;font-size:.68rem;cursor:pointer;font-weight:700;">' + (useNaija ? '\u{1F451} Naija' : '♔ Classic') + '</button>';
      html += '</div>';

      /* ── Chess board ── */
      html += '<div style="background:linear-gradient(160deg,#1a1a2e,#0f172a);border-radius:14px;padding:6px;margin-bottom:8px;box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.06);">';
      html += '<div style="display:grid;grid-template-columns:20px repeat(8,1fr);grid-template-rows:repeat(8,1fr) 16px;gap:0;max-width:420px;margin:0 auto;">';
      for(var r = 8; r >= 1; r--){
        html += '<div style="color:rgba(255,255,255,.3);font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;">' + r + '</div>';
        for(var f = 0; f < 8; f++){
          var sq = files[f] + r;
          var light = (f + r) % 2 === 1;
          var p = board[sq];
          var isSel = sq === selected;
          var isValid = vm.indexOf(sq) !== -1;
          var isLastMove = moveLog.length > 0 && (sq === moveLog[moveLog.length-1].from || sq === moveLog[moveLog.length-1].to);
          var bg;
          if(isSel) bg = 'linear-gradient(135deg,#3b82f6,#2563eb)';
          else if(isValid && p) bg = 'linear-gradient(135deg,#ef4444,#dc2626)'; /* capture */
          else if(isValid) bg = light ? '#86efac' : '#22c55e';
          else if(isLastMove) bg = light ? '#fef08a' : '#ca8a04';
          else bg = light ? '#f0d9b5' : '#b58863';
          var content = p ? pieces[p.p][p.c] : (isValid ? '<div style="width:10px;height:10px;border-radius:50%;background:rgba(34,197,94,.5);"></div>' : '');
          var shadow = p ? 'text-shadow:0 1px 3px rgba(0,0,0,.5);' : '';
          var border = isSel ? 'box-shadow:inset 0 0 0 2px rgba(59,130,246,.8);' : '';
          html += '<div onclick="window._chessClick(\'' + sq + '\')" style="aspect-ratio:1;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:clamp(1.4rem,4.5vw,2.2rem);cursor:pointer;transition:all .12s;user-select:none;' + shadow + border + '">' + content + '</div>';
        }
      }
      /* File labels */
      html += '<div></div>';
      for(var fi = 0; fi < 8; fi++){
        html += '<div style="color:rgba(255,255,255,.3);font-size:.6rem;font-weight:700;text-align:center;padding-top:2px;">' + files[fi] + '</div>';
      }
      html += '</div></div>';

      /* ── Bottom bar: your info + captured ── */
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0 2px;margin-bottom:6px;">';
      html += '<div style="display:flex;align-items:center;gap:8px;">';
      html += '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f0d9b5,#deb887);border:2px solid '+(turn==='w'?'#10b981':'rgba(255,255,255,.15)')+';display:flex;align-items:center;justify-content:center;font-size:1rem;">'+pieces.K.w+'</div>';
      html += '<div><div style="font-weight:800;font-size:.82rem;color:#fff;">You (White)</div>';
      html += '<div style="font-size:.68rem;color:rgba(255,255,255,.45);">'+capturedB.map(function(p){ return pieces[p].b; }).join(' ')+(capturedB.length?'':'no captures')+'</div></div>';
      html += '</div>';
      /* Move count */
      html += '<div style="font-size:.72rem;color:rgba(255,255,255,.4);font-weight:700;">Move '+moveCount+'</div>';
      html += '</div>';

      /* ── Instruction ── */
      html += '<div style="text-align:center;font-size:.75rem;color:rgba(255,255,255,.5);padding:4px 0;background:rgba(255,255,255,.03);border-radius:8px;">';
      if(gameOver) html += 'Game over!';
      else if(turn !== 'w') html += '\u{1F916} AI is thinking...';
      else if(selected) html += 'Tap a <span style="color:#22c55e;font-weight:800;">green</span> square to move, or tap another piece';
      else html += 'Tap one of your pieces to select it';
      html += '</div>';

      stage.innerHTML = html;
    }

    /* Patch doClick to log moves */
    var origDoClick = doClick;
    doClick = function(sq){
      if(gameOver || turn !== 'w') return;
      var piece = board[sq];
      if(selected){
        if(sq === selected){ selected = null; renderBoard(); return; }
        var vm = validMoves(selected);
        if(vm.indexOf(sq) !== -1){
          var cap = board[sq] ? board[sq].p : null;
          if(board[sq]) capturedB.push(board[sq].p);
          board[sq] = board[selected];
          var fromSq = selected;
          delete board[selected];
          if(board[sq].p === 'P' && parseInt(sq[1], 10) === 8) board[sq].p = 'Q';
          selected = null;
          moveCount++;
          logMove(fromSq, sq, board[sq].p, cap);
          var result = checkGameOver();
          if(result){
            gameOver = true;
            clearInterval(timerIv);
            var score = result === 'w_wins' ? 200 + capturedB.length * 10 + Math.max(0, 150 - moveCount * 2) : capturedB.length * 5;
            resolve({score:score, correct:capturedB.length, total:moveCount, iWon:result === 'w_wins'});
            return;
          }
          turn = 'b';
          renderBoard();
          setTimeout(function(){
            var mv = aiMove();
            if(mv){
              var aiCap = board[mv.to] ? board[mv.to].p : null;
              if(board[mv.to]) capturedW.push(board[mv.to].p);
              board[mv.to] = board[mv.from];
              delete board[mv.from];
              if(board[mv.to].p === 'P' && parseInt(mv.to[1], 10) === 1) board[mv.to].p = 'Q';
              logMove(mv.from, mv.to, board[mv.to].p, aiCap);
              var r2 = checkGameOver();
              if(r2){
                gameOver = true;
                clearInterval(timerIv);
                var sc2 = r2 === 'w_wins' ? 200 : capturedB.length * 5;
                resolve({score:sc2, correct:capturedB.length, total:moveCount, iWon:r2 === 'w_wins'});
                return;
              }
            }
            turn = 'w';
            renderBoard();
          }, 600);
          return;
        } else if(piece && piece.c === 'w'){
          selected = sq;
          renderBoard();
          return;
        }
      } else {
        if(piece && piece.c === 'w'){
          selected = sq;
          renderBoard();
        }
      }
    };

    window._chessToggleTheme = function(){
      useNaija = !useNaija;
      pieces = useNaija ? NAIJA_KINGS : CHESS_P;
      renderBoard();
    };
    window._chessClick = doClick;

    /* Start directly — no style picker screen, just play */
    initBoard();
    startTimer();
    renderBoard();
  });
};

/* ═══════════════════════════════════════════
   GAME 3: MATHS BATTLE ROYALE
   ═══════════════════════════════════════════ */
window.playMathRoyale = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var grp = ctx.room ? ctx.room.classGroup : 'juniors';
    var roundNum = 0;
    var totalRounds = 3;
    var score = 0;
    var correct = 0;
    var total = 0;
    var streak = 0;
    var maxStreak = 0;

    function genQ(rd){
      var a, b, op, ans;
      if(grp === 'kids'){
        if(rd === 0){ a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; op = '+'; ans = a + b; }
        else if(rd === 1){ a = Math.floor(Math.random() * 15) + 5; b = Math.floor(Math.random() * 10) + 1; op = Math.random() < 0.5 ? '+' : '-'; ans = op === '+' ? a + b : a - b; }
        else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 5) + 2; op = '×'; ans = a * b; }
      } else if(grp === 'juniors'){
        if(rd === 0){ a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 30) + 5; op = ['+', '-'][Math.floor(Math.random() * 2)]; ans = op === '+' ? a + b : a - b; }
        else if(rd === 1){ a = Math.floor(Math.random() * 15) + 3; b = Math.floor(Math.random() * 12) + 2; op = '×'; ans = a * b; }
        else { var d = Math.floor(Math.random() * 12) + 2; b = d; a = d * (Math.floor(Math.random() * 15) + 2); op = '÷'; ans = a / b; }
      } else {
        if(rd === 0){ a = Math.floor(Math.random() * 99) + 10; b = Math.floor(Math.random() * 50) + 10; op = ['+', '-', '×'][Math.floor(Math.random() * 3)]; ans = op === '+' ? a + b : op === '-' ? a - b : a * b; }
        else if(rd === 1){ var p = Math.floor(Math.random() * 10) + 2; ans = p * p; a = ans; op = '√'; b = null; }
        else { a = Math.floor(Math.random() * 20) + 2; b = 2; op = '^'; ans = a * a; }
      }
      return {q: op === '√' ? '√' + a + ' = ?' : op === '^' ? a + '² = ?' : a + ' ' + op + ' ' + b + ' = ?', a:ans};
    }

    function playRound(rd){
      var questionsInRound = rd === 0 ? 5 : rd === 1 ? 7 : 10;
      var timeForRound = rd === 0 ? 30 : rd === 1 ? 40 : 50;
      var time = timeForRound;
      var qi = 0;
      var q = genQ(rd);
      var rdCorrect = 0;
      var rankLabels = ['\u{1F949} Bronze Round', '\u{1F948} Silver Round', '\u{1F393} Scholar Round'];
      var roundDone = false;
      var iv = null;

      function renderQ(){
        if(qi >= questionsInRound || time <= 0){
          roundDone = true;
          if(iv){ clearInterval(iv); iv = null; }
          if(rd < totalRounds - 1){
            stage.innerHTML = '<div style="text-align:center;padding:20px;">'
              + '<div style="font-size:2rem;margin-bottom:8px;">' + (rdCorrect >= questionsInRound * 0.5 ? '\u{1F389}' : '\u{1F4AA}') + '</div>'
              + '<div style="font-weight:900;font-size:1.1rem;color:#fff;margin-bottom:8px;">' + rankLabels[rd] + ' Complete!</div>'
              + '<div style="color:rgba(255,255,255,.6);font-size:.9rem;margin-bottom:16px;">Got ' + rdCorrect + '/' + questionsInRound + ' correct · Score: ' + score + '</div>'
              + '<div style="font-weight:800;color:#fbbf24;margin-bottom:12px;">Next: ' + rankLabels[rd + 1] + ' — Harder questions!</div>'
              + '<button class="ar-join" onclick="window._mathRoyaleNext()" style="max-width:200px;">Continue →</button>'
              + '</div>';
            window._mathRoyaleNext = function(){ playRound(rd + 1); };
          } else {
            resolve({score:score, correct:correct, total:total, iWon:score >= 100});
          }
          return;
        }
        var streakHtml = streak >= 3 ? '<span style="color:#ef4444;font-weight:900;margin-left:8px;">\u{1F525} x' + streak + '</span>' : '';
        stage.innerHTML = '<div class="ar-timer">' + rankLabels[rd] + ' · Q' + (qi + 1) + '/' + questionsInRound + ' · ⏱ ' + time + 's · <span class="ar-score-pill">' + score + ' pts</span>' + streakHtml + '</div>'
          + '<div class="ar-q" style="font-size:1.8rem;">' + q.q + '</div>'
          + '<input class="ar-input" id="arMathIn" inputmode="numeric" autocomplete="off" placeholder="answer" style="font-size:1.2rem;text-align:center;"/>'
          + '<div style="font-size:.78rem;color:rgba(255,255,255,.55);">Press Enter · Max streak: ' + maxStreak + '</div>';
        var inp = document.getElementById('arMathIn');
        if(inp) inp.focus();
        if(inp){
          inp.onkeydown = function(e){
            if(e.key === 'Enter'){
              total++;
              qi++;
              if(parseInt(inp.value, 10) === q.a){
                correct++;
                rdCorrect++;
                streak++;
                if(streak > maxStreak) maxStreak = streak;
                var bonus = streak >= 5 ? 8 : streak >= 3 ? 4 : 0;
                score += 10 + (rd * 5) + bonus;
              } else {
                streak = 0;
              }
              q = genQ(rd);
              renderQ();
            }
          };
        }
      }

      renderQ();
      iv = setInterval(function(){
        time--;
        if(time <= 0 || roundDone){
          clearInterval(iv);
          iv = null;
          if(time <= 0 && !roundDone) renderQ();
        }
      }, 1000);
    }
    playRound(0);
  });
};

/* ═══════════════════════════════════════════
   GAME 4: SCIENCE LAB SIMULATOR
   ═══════════════════════════════════════════ */
var EXPERIMENTS = [
  {
    name:'Volcano Eruption \u{1F30B}',
    desc:'Build a chemical volcano using baking soda and vinegar.',
    steps:[
      {q:'What\'s the first ingredient for your volcano base?', opts:['Baking soda','Salt','Sugar','Flour'], a:0},
      {q:'What liquid causes the eruption reaction?', opts:['Water','Vinegar','Milk','Oil'], a:1},
      {q:'What gas is released in this reaction?', opts:['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], a:2},
      {q:'Adding red food colouring makes it look like real...', opts:['Water','Blood','Lava','Juice'], a:2},
      {q:'This is an example of a ___ reaction.', opts:['Nuclear','Acid-base','Combustion','Photosynthesis'], a:1}
    ]
  },
  {
    name:'Electric Circuit ⚡',
    desc:'Build a simple circuit to light a bulb.',
    steps:[
      {q:'What provides the energy in a circuit?', opts:['Bulb','Wire','Battery','Switch'], a:2},
      {q:'Electricity flows through...', opts:['Rubber','Plastic','Copper wire','Wood'], a:2},
      {q:'What happens if the circuit is broken (open)?', opts:['Bulb glows brighter','Bulb turns off','Battery explodes','Wire melts'], a:1},
      {q:'A switch does what in a circuit?', opts:['Creates electricity','Opens/closes the circuit','Stores energy','Makes light'], a:1},
      {q:'Adding more batteries makes the bulb...', opts:['Dimmer','Brighter','The same','Turn blue'], a:1}
    ]
  },
  {
    name:'Magnet Lab \u{1F9F2}',
    desc:'Explore what magnets attract and repel.',
    steps:[
      {q:'Which material is attracted to magnets?', opts:['Plastic','Iron','Wood','Glass'], a:1},
      {q:'What happens when two north poles meet?', opts:['They attract','They repel','Nothing','They melt'], a:1},
      {q:'Which is NOT magnetic?', opts:['Steel','Iron','Nickel','Aluminium'], a:3},
      {q:'Earth itself is a giant...', opts:['Battery','Magnet','Volcano','Crystal'], a:1},
      {q:'A compass needle points to...', opts:['The Sun','Magnetic North','The Moon','East'], a:1}
    ]
  },
  {
    name:'Acid vs Base \u{1F9EA}',
    desc:'Test different liquids with pH indicators.',
    steps:[
      {q:'Lemon juice is an example of an...', opts:['Acid','Base','Neutral','Metal'], a:0},
      {q:'Soap is an example of a...', opts:['Acid','Base','Neutral','Gas'], a:1},
      {q:'Pure water has a pH of...', opts:['0','3','7','14'], a:2},
      {q:'Mixing acid and base creates...', opts:['An explosion','Salt and water','Gas','Nothing'], a:1},
      {q:'Litmus paper turns red in...', opts:['Base','Water','Acid','Salt'], a:2}
    ]
  },
  {
    name:'Solar Power ☀️',
    desc:'Build a solar energy system.',
    steps:[
      {q:'Solar panels convert sunlight into...', opts:['Water','Electricity','Heat only','Sound'], a:1},
      {q:'Solar energy is a ___ resource.', opts:['Non-renewable','Renewable','Artificial','Chemical'], a:1},
      {q:'Batteries in solar systems are used to...', opts:['Create sunlight','Store energy','Make panels','Cool down'], a:1},
      {q:'Solar panels work best when facing...', opts:['North','East','The Sun','Down'], a:2},
      {q:'Nigeria gets ___ sunlight, making solar ideal.', opts:['No','Very little','Plenty of','Only night'], a:2}
    ]
  }
];

window.playScienceLab = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var exps = shuffle(EXPERIMENTS).slice(0, 3);
    var ei = 0, si = 0;
    var score = 0, correct = 0, total = 0;

    function render(){
      if(ei >= exps.length){
        resolve({score:score, correct:correct, total:total, iWon:correct >= total * 0.7});
        return;
      }
      var exp = exps[ei];
      if(si >= exp.steps.length){
        ei++;
        si = 0;
        if(ei < exps.length){
          stage.innerHTML = '<div style="text-align:center;padding:20px;">'
            + '<div style="font-size:2.5rem;">✅</div>'
            + '<div style="font-weight:900;color:#fff;font-size:1.1rem;margin:8px 0;">Experiment Complete!</div>'
            + '<div style="color:rgba(255,255,255,.6);margin-bottom:16px;">Score so far: ' + score + ' pts</div>'
            + '<button class="ar-join" onclick="window._labNext()" style="max-width:200px;">Next Experiment →</button></div>';
          window._labNext = function(){ render(); };
          return;
        }
        render();
        return;
      }
      var step = exp.steps[si];
      var progress = Math.round(((ei * 5 + si) / (exps.length * 5)) * 100);

      stage.innerHTML = '<div class="ar-timer">' + exp.name + ' · Step ' + (si + 1) + '/' + exp.steps.length + ' · <span class="ar-score-pill">' + score + ' pts</span></div>'
        + '<div style="background:rgba(255,255,255,.08);border-radius:100px;height:6px;margin-bottom:12px;overflow:hidden;"><div style="width:' + progress + '%;height:100%;background:linear-gradient(90deg,#10b981,#3b82f6);border-radius:100px;transition:width .3s;"></div></div>'
        + '<div style="font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:6px;">' + exp.desc + '</div>'
        + '<div class="ar-q">' + step.q + '</div>'
        + '<div class="ar-opts">' + step.opts.map(function(o, idx){ return '<button class="ar-opt" data-i="' + idx + '">' + o + '</button>'; }).join('') + '</div>';

      stage.querySelectorAll('.ar-opt').forEach(function(b){
        b.onclick = function(){
          total++;
          var picked = parseInt(b.getAttribute('data-i'), 10);
          if(picked === step.a){ score += 15; correct++; b.classList.add('right'); }
          else { b.classList.add('wrong'); stage.querySelectorAll('.ar-opt')[step.a].classList.add('right'); }
          stage.querySelectorAll('.ar-opt').forEach(function(x){ x.disabled = true; });
          si++;
          setTimeout(render, 700);
        };
      });
    }
    render();
  });
};

/* ═══════════════════════════════════════════
   GAME 5: STARTUP SIMULATOR
   ═══════════════════════════════════════════ */
var STARTUP_TYPES = [
  {name:'\u{1F35B} Mama Nkechi\'s Kitchen', type:'Food Business', startCash:500000},
  {name:'\u{1F69A} SwiftMove Logistics', type:'Logistics Company', startCash:800000},
  {name:'☀️ SunPower Nigeria', type:'Solar Company', startCash:1000000},
  {name:'⛏️ NaijaMine', type:'Mining Company', startCash:1200000},
  {name:'\u{1F3B5} AfroBeats Records', type:'Music Label', startCash:600000}
];
var STARTUP_DECISIONS = [
  {q:'Fuel price doubled! What do you do?',
   opts:['Absorb the cost','Raise your prices 20%','Cut staff','Switch to solar generators'], best:3, ok:1, bad:2,
   results:[{cash:-80000,msg:'Absorbing cost hurts profits'},{cash:-20000,msg:'Lost some customers but stayed profitable'},{cash:-50000,msg:'Fired staff = lower output'},{cash:30000,msg:'Smart! Long-term savings with solar'}]},
  {q:'A big customer wants 50% discount for bulk order.',
   opts:['Accept the deal','Negotiate to 20% discount','Refuse entirely','Offer 30% + long-term contract'], best:3, ok:1, bad:2,
   results:[{cash:-40000,msg:'Too cheap — lost money on this deal'},{cash:20000,msg:'Fair deal, small profit'},{cash:0,msg:'Missed opportunity'},{cash:60000,msg:'Excellent! Locked in recurring revenue'}]},
  {q:'Your top employee wants a raise or they\'ll leave.',
   opts:['Let them leave','Give 10% raise','Give 30% raise','Give raise + profit sharing'], best:3, ok:1, bad:0,
   results:[{cash:-100000,msg:'Lost key talent — costly to replace'},{cash:-15000,msg:'Kept them but not thrilled'},{cash:-40000,msg:'Expensive but loyal employee now'},{cash:50000,msg:'Genius! Employee works harder, profits grow'}]},
  {q:'NAFDAC/government inspection coming. Your compliance is 60%.',
   opts:['Hope they don\'t notice','Bribe the inspector','Rush to fix everything','Hire a compliance officer'], best:3, ok:2, bad:1,
   results:[{cash:-200000,msg:'Got caught! Huge fine'},{cash:-150000,msg:'Risky! Could face jail time'},{cash:-50000,msg:'Fixed barely in time'},{cash:-30000,msg:'Smart investment — now always compliant'}]},
  {q:'Naira crashes 40% against dollar. Your imports are affected.',
   opts:['Panic and close shop','Find local suppliers','Raise prices 50%','Hedge with dollar account'], best:1, ok:3, bad:0,
   results:[{cash:-300000,msg:'Closing loses everything!'},{cash:80000,msg:'Local sourcing saves costs!'},{cash:20000,msg:'Lost customers but survived'},{cash:40000,msg:'Dollar hedge protected some value'}]},
  {q:'Social media influencer offers to promote you for A₦200K.',
   opts:['Too expensive, skip','Negotiate to A₦80K','Accept at A₦200K','Create your own content instead'], best:1, ok:3, bad:2,
   results:[{cash:0,msg:'Missed marketing opportunity'},{cash:100000,msg:'Great deal! Big ROI'},{cash:20000,msg:'Expensive but some returns'},{cash:40000,msg:'Slow growth but free marketing'}]},
  {q:'Tax season! Your accountant suggests...',
   opts:['Don\'t file taxes','File honestly','Hide some income','Invest in tax-deductible equipment'], best:3, ok:1, bad:0,
   results:[{cash:-250000,msg:'Tax evasion = jail + fines!'},{cash:-40000,msg:'Paid fair taxes, clean record'},{cash:-180000,msg:'Audit caught you — huge penalty'},{cash:-10000,msg:'Legal tax savings! Smart business'}]},
  {q:'Competitor opened next to you. Sales drop 30%.',
   opts:['Start a price war','Improve quality + service','Copy their strategy','Partner with them'], best:1, ok:3, bad:0,
   results:[{cash:-100000,msg:'Price war destroyed both profits'},{cash:70000,msg:'Quality wins! Customers returned'},{cash:-20000,msg:'Customers see you as a copycat'},{cash:40000,msg:'Partnership created new opportunities'}]}
];

window.playStartupSim = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var startup = null;
    var cash = 0;
    var round = 0;
    var decisions = shuffle(STARTUP_DECISIONS).slice(0, 6);
    var totalDecisions = decisions.length;
    var goodCalls = 0;

    stage.innerHTML = '<div style="text-align:center;padding:12px;">'
      + '<div style="font-size:2rem;margin-bottom:6px;">\u{1F680}</div>'
      + '<div style="font-weight:900;font-size:1.15rem;color:#fff;margin-bottom:14px;">Choose Your Startup</div>'
      + '<div style="display:grid;gap:8px;">'
      + STARTUP_TYPES.map(function(s, i){
        return '<button onclick="window._pickStartup(' + i + ')" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;cursor:pointer;color:#fff;text-align:left;display:flex;align-items:center;gap:12px;font-family:inherit;">'
          + '<span style="font-size:1.5rem;">' + s.name.split(' ')[0] + '</span>'
          + '<div><div style="font-weight:900;">' + s.name + '</div><div style="font-size:.78rem;color:rgba(255,255,255,.5);">' + s.type + ' · Starting: A₦' + s.startCash.toLocaleString() + '</div></div>'
          + '</button>';
      }).join('')
      + '</div></div>';

    window._pickStartup = function(i){
      startup = STARTUP_TYPES[i];
      cash = startup.startCash;
      playDecision();
    };

    function playDecision(){
      if(round >= totalDecisions){
        var profit = cash - startup.startCash;
        var score = Math.max(0, Math.round(cash / 1000));
        resolve({score:score, correct:goodCalls, total:totalDecisions, iWon:profit > 0});
        return;
      }
      var d = decisions[round];
      stage.innerHTML = '<div class="ar-timer">' + startup.name + ' · Decision ' + (round + 1) + '/' + totalDecisions + ' · <span class="ar-score-pill">A₦' + cash.toLocaleString() + '</span></div>'
        + '<div class="ar-q">' + d.q + '</div>'
        + '<div class="ar-opts">' + d.opts.map(function(o, idx){ return '<button class="ar-opt" data-i="' + idx + '">' + o + '</button>'; }).join('') + '</div>';

      stage.querySelectorAll('.ar-opt').forEach(function(b){
        b.onclick = function(){
          var picked = parseInt(b.getAttribute('data-i'), 10);
          var result = d.results[picked];
          cash += result.cash;
          if(cash < 0) cash = 0;
          if(picked === d.best){ goodCalls++; b.classList.add('right'); }
          else if(picked === d.bad){ b.classList.add('wrong'); }
          else { b.style.background = 'rgba(251,191,36,.3)'; }
          stage.querySelectorAll('.ar-opt').forEach(function(x){ x.disabled = true; });
          var resDiv = document.createElement('div');
          resDiv.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;text-align:center;background:rgba(255,255,255,.05);';
          resDiv.innerHTML = '<div style="color:' + (result.cash >= 0 ? '#10b981' : '#ef4444') + ';font-size:1.1rem;">' + (result.cash >= 0 ? '+' : '') + 'A₦' + result.cash.toLocaleString() + '</div>'
            + '<div style="color:rgba(255,255,255,.7);font-size:.85rem;margin-top:4px;">' + result.msg + '</div>';
          stage.appendChild(resDiv);
          round++;
          setTimeout(playDecision, 2000);
        };
      });
    }
  });
};

/* ═══════════════════════════════════════════
   GAME 6: DEBATE ARENA
   ═══════════════════════════════════════════ */
var DEBATE_TOPICS = [
  { topic:'Should AI replace teachers in Nigerian schools?', for_hint:'Think about accessibility, cost, 24/7 availability', against_hint:'Think about human connection, mentorship, cultural context' },
  { topic:'Should Nigeria ban fuel imports and go fully electric?', for_hint:'Think about climate, local manufacturing, energy independence', against_hint:'Think about infrastructure costs, job losses, transition time' },
  { topic:'Should school uniforms be abolished?', for_hint:'Think about self-expression, cost savings for families', against_hint:'Think about equality, discipline, school identity' },
  { topic:'Should coding be mandatory from Primary 1?', for_hint:'Think about future jobs, digital economy, early start advantage', against_hint:'Think about teacher availability, basic literacy first, screen time' },
  { topic:'Is social media helping or hurting Nigerian youth?', for_hint:'Think about business opportunities, connection, information access', against_hint:'Think about mental health, fake news, distraction from studies' },
  { topic:'Should Nigeria adopt a 4-day school week?', for_hint:'Think about student wellbeing, project-based learning, family time', against_hint:'Think about curriculum coverage, working parents, global competition' },
  { topic:'Should students be allowed to use phones in class?', for_hint:'Think about research tools, digital literacy, modern learning', against_hint:'Think about distraction, inequality, cyberbullying' }
];

function scoreDebate(text){
  var words = text.trim().split(/\s+/);
  var wordCount = words.length;
  var sc = {vocabulary:0, logic:0, confidence:0, total:0};

  var uniqueWords = {};
  words.forEach(function(w){ uniqueWords[w.toLowerCase()] = true; });
  var unique = Object.keys(uniqueWords).length;
  sc.vocabulary = clamp(Math.round((unique / Math.max(wordCount, 1)) * 20 + Math.min(wordCount / 5, 15)), 0, 35);

  var logicWords = ['because','therefore','however','although','furthermore','firstly','secondly','moreover','consequently','evidence','example','for instance','in conclusion','on the other hand','research shows','data','statistics','according to'];
  var logicHits = 0;
  logicWords.forEach(function(lw){ if(text.toLowerCase().indexOf(lw) !== -1) logicHits++; });
  sc.logic = clamp(logicHits * 7 + (wordCount > 30 ? 5 : 0), 0, 35);

  var sentences = text.split(/[.!?]+/).filter(function(s){ return s.trim().length > 0; }).length;
  var strongWords = ['must','should','clearly','definitely','important','critical','essential','absolutely','strongly'];
  var strongHits = 0;
  strongWords.forEach(function(sw){ if(text.toLowerCase().indexOf(sw) !== -1) strongHits++; });
  sc.confidence = clamp(sentences * 4 + strongHits * 5 + (wordCount > 20 ? 5 : 0), 0, 30);

  sc.total = sc.vocabulary + sc.logic + sc.confidence;
  return sc;
}

window.playDebateArena = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var topics = shuffle(DEBATE_TOPICS).slice(0, 3);
    var ti = 0;
    var totalScore = 0;
    var scores = [];

    function playTopic(){
      if(ti >= topics.length){
        resolve({score:totalScore, correct:scores.filter(function(s){ return s >= 50; }).length, total:topics.length, iWon:totalScore >= 120});
        return;
      }
      var t = topics[ti];
      var side = Math.random() < 0.5 ? 'FOR' : 'AGAINST';
      var hint = side === 'FOR' ? t.for_hint : t.against_hint;
      var time = 90;

      stage.innerHTML = '<div class="ar-timer">Debate ' + (ti + 1) + '/' + topics.length + ' · ⏱ <span id="debateTime">' + time + '</span>s · <span class="ar-score-pill">' + totalScore + ' pts</span></div>'
        + '<div style="background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.25);border-radius:14px;padding:14px;margin-bottom:12px;">'
        + '<div style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(168,85,247,.7);margin-bottom:4px;">Topic</div>'
        + '<div style="font-weight:900;font-size:1.05rem;color:#fff;">' + t.topic + '</div></div>'
        + '<div style="background:' + (side === 'FOR' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)') + ';border:1px solid ' + (side === 'FOR' ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)') + ';border-radius:10px;padding:10px;margin-bottom:12px;">'
        + '<div style="font-weight:800;color:' + (side === 'FOR' ? '#10b981' : '#ef4444') + ';">You argue: ' + side + '</div>'
        + '<div style="font-size:.78rem;color:rgba(255,255,255,.5);margin-top:2px;">\u{1F4A1} ' + hint + '</div></div>'
        + '<textarea id="debateInput" style="width:100%;min-height:120px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:12px;color:#fff;padding:12px;font-family:inherit;font-size:.92rem;resize:vertical;box-sizing:border-box;" placeholder="Type your argument here... Use reasoning words like \'because\', \'therefore\', \'however\' for more points!"></textarea>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'
        + '<span id="debateWordCount" style="font-size:.75rem;color:rgba(255,255,255,.4);">0 words</span>'
        + '<button class="ar-join" id="debateSubmit" style="max-width:160px;">Submit Argument</button></div>';

      var textarea = document.getElementById('debateInput');
      if(textarea) textarea.focus();
      if(textarea){
        textarea.oninput = function(){
          var wc = textarea.value.trim().split(/\s+/).filter(function(w){ return w; }).length;
          var el = document.getElementById('debateWordCount');
          if(el) el.textContent = wc + ' words';
        };
      }

      var iv = setInterval(function(){
        time--;
        var el = document.getElementById('debateTime');
        if(el) el.textContent = time;
        if(time <= 0){ clearInterval(iv); submitDebate(); }
      }, 1000);

      function submitDebate(){
        clearInterval(iv);
        var text = textarea ? textarea.value.trim() : '';
        if(text.length < 5) text = 'I believe this is important.';
        var result = scoreDebate(text);
        totalScore += result.total;
        scores.push(result.total);

        stage.innerHTML = '<div style="text-align:center;padding:16px;">'
          + '<div style="font-size:2rem;margin-bottom:6px;">' + (result.total >= 60 ? '\u{1F3C6}' : result.total >= 40 ? '\u{1F44F}' : '\u{1F4DD}') + '</div>'
          + '<div style="font-weight:900;color:#fff;font-size:1.1rem;margin-bottom:12px;">AI Judge Score: ' + result.total + '/100</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">'
          + '<div style="background:rgba(59,130,246,.1);padding:10px;border-radius:10px;text-align:center;"><div style="font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;font-weight:700;">Vocabulary</div><div style="font-weight:900;color:#60a5fa;font-size:1.2rem;">' + result.vocabulary + '/35</div></div>'
          + '<div style="background:rgba(168,85,247,.1);padding:10px;border-radius:10px;text-align:center;"><div style="font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;font-weight:700;">Logic</div><div style="font-weight:900;color:#c084fc;font-size:1.2rem;">' + result.logic + '/35</div></div>'
          + '<div style="background:rgba(16,185,129,.1);padding:10px;border-radius:10px;text-align:center;"><div style="font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;font-weight:700;">Confidence</div><div style="font-weight:900;color:#34d399;font-size:1.2rem;">' + result.confidence + '/30</div></div>'
          + '</div>'
          + '<button class="ar-join" onclick="window._debateNext()" style="max-width:200px;">' + (ti < topics.length - 1 ? 'Next Topic →' : 'See Results') + '</button>'
          + '</div>';

        window._debateNext = function(){ ti++; playTopic(); };
      }

      var submitBtn = document.getElementById('debateSubmit');
      if(submitBtn) submitBtn.onclick = submitDebate;
    }
    playTopic();
  });
};

/* ═══════════════════════════════════════════
   GAME 7: EQ CHALLENGE (Emotional Intelligence)
   ═══════════════════════════════════════════ */
var EQ_SCENARIOS = [
  {q:'Your friend is crying because they failed a test. What do you do?',
   opts:['Laugh and say "you should have studied"','Ignore them','Sit with them and say "I\'m sorry, let\'s study together next time"','Tell the teacher they\'re being dramatic'],
   a:2, skill:'Empathy'},
  {q:'Two of your friends are fighting over a seat. What do you do?',
   opts:['Pick a side','Walk away','Suggest they take turns or find another seat','Tell the teacher immediately'],
   a:2, skill:'Conflict Resolution'},
  {q:'A new student joins your class and looks nervous. What do you do?',
   opts:['Stare at them','Introduce yourself and show them around','Whisper about them to friends','Wait for the teacher to handle it'],
   a:1, skill:'Empathy'},
  {q:'Your group project partner isn\'t doing their share. What do you do?',
   opts:['Do all the work yourself','Tell the teacher to fail them','Talk to them privately about splitting work fairly','Post about it on social media'],
   a:2, skill:'Communication'},
  {q:'Someone makes fun of your accent. How do you respond?',
   opts:['Fight them','Cry and run away','Calmly say "My accent is part of my culture and I\'m proud of it"','Make fun of their accent too'],
   a:2, skill:'Confidence'},
  {q:'You see someone being bullied online. What do you do?',
   opts:['Join in','Screenshot and share it','Report it and support the victim privately','Ignore it — not your business'],
   a:2, skill:'Empathy'},
  {q:'Your parent says no to something you really wanted. What\'s the best response?',
   opts:['Throw a tantrum','Stop talking to them','Ask calmly why, and suggest a compromise','Sneak and do it anyway'],
   a:2, skill:'Communication'},
  {q:'You made a mistake that hurt your friend. What do you do?',
   opts:['Pretend it didn\'t happen','Blame someone else','Apologize sincerely and ask how to fix it','Say "it\'s not that serious"'],
   a:2, skill:'Accountability'},
  {q:'Your team lost a competition. How do you handle it?',
   opts:['Blame the weakest player','Quit the team','Congratulate the winners and discuss how to improve','Say the judges were unfair'],
   a:2, skill:'Resilience'},
  {q:'A younger student asks you a question you think is silly. What do you do?',
   opts:['Laugh at them','Say "figure it out yourself"','Answer kindly — everyone starts somewhere','Roll your eyes'],
   a:2, skill:'Patience'}
];

window.playEQChallenge = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var scenarios = shuffle(EQ_SCENARIOS).slice(0, 8);
    var si = 0, score = 0, correct = 0;

    function render(){
      if(si >= scenarios.length){
        resolve({score:score, correct:correct, total:scenarios.length, iWon:correct >= scenarios.length * 0.7});
        return;
      }
      var s = scenarios[si];
      stage.innerHTML = '<div class="ar-timer">Scenario ' + (si + 1) + '/' + scenarios.length + ' · <span style="background:rgba(168,85,247,.2);padding:2px 8px;border-radius:6px;font-size:.75rem;color:#c084fc;">' + s.skill + '</span> · <span class="ar-score-pill">' + score + ' pts</span></div>'
        + '<div class="ar-q" style="font-size:1rem;line-height:1.6;">' + s.q + '</div>'
        + '<div class="ar-opts">' + s.opts.map(function(o, idx){ return '<button class="ar-opt" data-i="' + idx + '" style="text-align:left;font-size:.88rem;">' + o + '</button>'; }).join('') + '</div>';

      stage.querySelectorAll('.ar-opt').forEach(function(b){
        b.onclick = function(){
          var picked = parseInt(b.getAttribute('data-i'), 10);
          if(picked === s.a){ score += 15; correct++; b.classList.add('right'); }
          else { b.classList.add('wrong'); stage.querySelectorAll('.ar-opt')[s.a].classList.add('right'); }
          stage.querySelectorAll('.ar-opt').forEach(function(x){ x.disabled = true; });
          si++;
          setTimeout(render, 900);
        };
      });
    }
    render();
  });
};

/* ═══════════════════════════════════════════
   GAME 8: FINANCIAL SURVIVAL
   ═══════════════════════════════════════════ */
var FINANCE_SCENARIOS = [
  {q:'You receive A₦50,000 allowance. A friend says "invest" in their new scheme that promises 200% returns in a week. What do you do?',
   opts:['Invest everything!','Invest half','Decline — sounds like a scam','Ask for proof and documentation first'],
   a:2, points:[-30000,-15000,0,5000], feedback:['Classic Ponzi scheme! Lost everything.','Lost half to a scam.','Smart! If it sounds too good to be true...','Good instinct, but this one\'s definitely a scam.']},
  {q:'Your salary is A₦150,000. Rent is A₦50,000. How do you budget the rest?',
   opts:['Spend it all on wants','50% needs, 30% wants, 20% savings','Save everything, eat only rice','80% wants, 20% needs'],
   a:1, points:[-20000,30000,10000,-10000], feedback:['No savings = financial danger!','50-30-20 rule — excellent budgeting!','Too extreme, you need nutrition.','Too much on wants.']},
  {q:'A "bank" calls saying you won A₦500K. They need your BVN to process it. What do you do?',
   opts:['Give them your BVN immediately','Give them only your name','Hang up — this is a scam','Call them back later'],
   a:2, points:[-50000,-20000,10000,-5000], feedback:['Identity theft! They drained your account.','Never share personal info!','Correct! Banks never call asking for BVN.','They\'ll still try to scam you.']},
  {q:'You have A₦200,000 saved. Interest rates are rising. What do you do?',
   opts:['Keep cash under your mattress','Put it in a fixed deposit','Buy the latest phone','Lend it to a friend without documentation'],
   a:1, points:[-5000,25000,-100000,-50000], feedback:['Cash loses value to inflation.','Smart! Fixed deposit earns interest safely.','Depreciating asset — poor investment.','No documentation = might never see it again.']},
  {q:'Your business made A₦100K profit. Tax is 15%. What do you do?',
   opts:['Hide the income','Pay the full tax','Pay half and hope','Reinvest profits into business (tax-deductible)'],
   a:3, points:[-80000,-15000,-40000,20000], feedback:['Tax evasion has severe penalties!','Honest but you could optimize legally.','Partial evasion still illegal.','Legal tax planning! Business expense deductions.']},
  {q:'Naira depreciates 30%. Your friend suggests buying dollars. What\'s the best approach?',
   opts:['Convert all savings to dollars','Keep all in Naira','Diversify: some Naira, some dollars, some assets','Buy crypto with everything'],
   a:2, points:[-10000,-15000,25000,-30000], feedback:['Timing the market is risky.','Inflation eats your savings.','Diversification is key to wealth protection!','Extremely volatile and risky.']},
  {q:'You want to start saving for university. You have 3 years. Best option?',
   opts:['Ajo/contribution club only','Education savings plan + investment','Borrow when the time comes','Ask relatives to pay'],
   a:1, points:[5000,30000,-20000,0], feedback:['Good start but limited growth.','Structured saving + compound interest = smart!','Debt from the start is a bad plan.','Unreliable plan.']}
];

window.playFinanceSurvival = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var balance = 100000;
    var scenarios = shuffle(FINANCE_SCENARIOS).slice(0, 6);
    var si = 0, correct = 0;

    function render(){
      if(si >= scenarios.length){
        var score = Math.max(0, Math.round(balance / 100));
        resolve({score:score, correct:correct, total:scenarios.length, iWon:balance >= 100000});
        return;
      }
      var s = scenarios[si];
      stage.innerHTML = '<div class="ar-timer">Challenge ' + (si + 1) + '/' + scenarios.length + ' · <span class="ar-score-pill">A₦' + balance.toLocaleString() + '</span></div>'
        + '<div class="ar-q" style="font-size:.95rem;line-height:1.6;">' + s.q + '</div>'
        + '<div class="ar-opts">' + s.opts.map(function(o, idx){ return '<button class="ar-opt" data-i="' + idx + '" style="text-align:left;">' + o + '</button>'; }).join('') + '</div>';

      stage.querySelectorAll('.ar-opt').forEach(function(b){
        b.onclick = function(){
          var picked = parseInt(b.getAttribute('data-i'), 10);
          balance += s.points[picked];
          if(balance < 0) balance = 0;
          if(picked === s.a){ correct++; b.classList.add('right'); }
          else { b.classList.add('wrong'); stage.querySelectorAll('.ar-opt')[s.a].classList.add('right'); }
          stage.querySelectorAll('.ar-opt').forEach(function(x){ x.disabled = true; });
          var fb = document.createElement('div');
          fb.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;text-align:center;background:rgba(255,255,255,.05);';
          fb.innerHTML = '<div style="color:' + (s.points[picked] >= 0 ? '#10b981' : '#ef4444') + ';font-weight:900;">' + (s.points[picked] >= 0 ? '+' : '') + 'A₦' + s.points[picked].toLocaleString() + '</div>'
            + '<div style="color:rgba(255,255,255,.7);font-size:.85rem;margin-top:4px;">' + s.feedback[picked] + '</div>';
          stage.appendChild(fb);
          si++;
          setTimeout(render, 2200);
        };
      });
    }
    render();
  });
};

/* ═══════════════════════════════════════════
   GAME 9: AFRICAN HISTORY ADVENTURES
   ═══════════════════════════════════════════ */
var HISTORY_QUESTS = [
  {
    empire:'Mali Empire \u{1F981}',
    intro:'You are a scholar in the court of Mansa Musa, the richest person in history. Guide the empire to glory!',
    questions:[
      {q:'Mansa Musa ruled the Mali Empire in which century?', opts:['10th','12th','14th','16th'], a:2},
      {q:'What made Mali incredibly wealthy?', opts:['Oil','Gold and salt trade','Diamonds','Tourism'], a:1},
      {q:'Mansa Musa\'s famous pilgrimage to Mecca caused what in Egypt?', opts:['A war','Gold price crash (inflation)','A famine','A flood'], a:1},
      {q:'Which great city of learning was in Mali?', opts:['Cairo','Timbuktu','Accra','Nairobi'], a:1},
      {q:'The Mali Empire was located in modern-day...', opts:['South Africa','Nigeria','West Africa (Mali, Senegal, Guinea)','East Africa'], a:2}
    ]
  },
  {
    empire:'Benin Kingdom \u{1F3DB}️',
    intro:'You are a master bronze caster in the Kingdom of Benin. Your art tells the story of a great civilization.',
    questions:[
      {q:'The Benin Kingdom was famous for...', opts:['Gold mining','Bronze sculptures','Ship building','Pottery'], a:1},
      {q:'Benin Kingdom was located in modern-day...', opts:['Republic of Benin','Edo State, Nigeria','Ghana','Cameroon'], a:1},
      {q:'What happened to many Benin Bronzes in 1897?', opts:['They were buried','Stolen by British soldiers','They melted','Sold to China'], a:1},
      {q:'The ruler of Benin was called the...', opts:['Sultan','Emir','Oba','Chief'], a:2},
      {q:'Benin City had walls that were described as...', opts:['Tiny','The largest earthworks in the world','Invisible','Made of gold'], a:1}
    ]
  },
  {
    empire:'Ancient Egypt \u{1F3FA}',
    intro:'You are an architect building the great pyramids. Navigate the wonders of the Nile civilization!',
    questions:[
      {q:'The Great Pyramid was built for Pharaoh...', opts:['Tutankhamun','Cleopatra','Khufu','Ramesses'], a:2},
      {q:'Ancient Egyptians wrote using...', opts:['Latin','Hieroglyphics','Arabic','Chinese'], a:1},
      {q:'The Nile River flows through Egypt from...', opts:['West to East','North to South','South to North','East to West'], a:2},
      {q:'Ancient Egypt is on which continent?', opts:['Asia','Europe','Africa','South America'], a:2},
      {q:'Egyptians preserved dead bodies as...', opts:['Statues','Mummies','Paintings','Songs'], a:1}
    ]
  },
  {
    empire:'Nok Civilization \u{1F5FF}',
    intro:'You are a Nok artisan in ancient Nigeria, creating terracotta masterpieces that will survive millennia.',
    questions:[
      {q:'The Nok Civilization existed in what is now...', opts:['Ghana','Central Nigeria','South Africa','Egypt'], a:1},
      {q:'The Nok are most famous for their...', opts:['Gold jewelry','Terracotta sculptures','Iron swords','Stone pyramids'], a:1},
      {q:'The Nok Civilization dates back to approximately...', opts:['500 AD','1000 AD','500 BC','100 AD'], a:2},
      {q:'Nok people were among the first in West Africa to...', opts:['Write books','Smelt iron','Build ships','Grow rice'], a:1},
      {q:'Nok terracotta figures were first discovered in...', opts:['A museum','A mining site','The ocean','A palace'], a:1}
    ]
  },
  {
    empire:'Songhai Empire ⚔️',
    intro:'You are a general in the mighty Songhai Empire, the largest empire in African history.',
    questions:[
      {q:'Who was the famous warrior king of Songhai?', opts:['Mansa Musa','Sunni Ali','Shaka Zulu','Nkrumah'], a:1},
      {q:'Songhai\'s capital city was...', opts:['Timbuktu','Gao','Kumasi','Benin City'], a:1},
      {q:'The Songhai Empire replaced which empire?', opts:['Roman','Benin','Mali','Zulu'], a:2},
      {q:'Songhai was destroyed by invaders from...', opts:['Britain','Morocco','France','Portugal'], a:1},
      {q:'The University of Sankore in Timbuktu taught...', opts:['Only religion','Medicine, math, law, and astronomy','Only war','Only farming'], a:1}
    ]
  }
];

window.playHistoryQuest = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var quests = shuffle(HISTORY_QUESTS).slice(0, 3);
    var qi = 0, qsi = 0;
    var score = 0, correct = 0, total = 0;

    function render(){
      if(qi >= quests.length){
        resolve({score:score, correct:correct, total:total, iWon:correct >= total * 0.6});
        return;
      }
      var quest = quests[qi];
      if(qsi === 0){
        stage.innerHTML = '<div style="text-align:center;padding:20px;">'
          + '<div style="font-size:2.5rem;margin-bottom:8px;">' + quest.empire.split(' ').pop() + '</div>'
          + '<div style="font-weight:900;font-size:1.3rem;color:#fff;margin-bottom:8px;">' + quest.empire + '</div>'
          + '<div style="color:rgba(255,255,255,.65);font-size:.9rem;line-height:1.6;max-width:400px;margin:0 auto 16px;">' + quest.intro + '</div>'
          + '<button class="ar-join" onclick="window._histStart()" style="max-width:200px;">Begin Quest →</button></div>';
        window._histStart = function(){ qsi = 1; renderQuestion(); };
        return;
      }
      renderQuestion();
    }

    function renderQuestion(){
      var quest = quests[qi];
      if(qsi > quest.questions.length){
        qi++;
        qsi = 0;
        if(qi < quests.length){
          stage.innerHTML = '<div style="text-align:center;padding:20px;">'
            + '<div style="font-size:2rem;">\u{1F3C6}</div>'
            + '<div style="font-weight:900;color:#fff;margin:8px 0;">Quest Complete!</div>'
            + '<div style="color:rgba(255,255,255,.6);margin-bottom:16px;">Score: ' + score + ' pts · ' + correct + ' correct</div>'
            + '<button class="ar-join" onclick="window._histNext()" style="max-width:200px;">Next Empire →</button></div>';
          window._histNext = function(){ render(); };
        } else {
          render();
        }
        return;
      }
      var qIndex = qsi - 1;
      var q = quest.questions[qIndex];
      var progress = Math.round(((qi * 5 + qIndex) / (quests.length * 5)) * 100);

      stage.innerHTML = '<div class="ar-timer">' + quest.empire + ' · Q' + qsi + '/' + quest.questions.length + ' · <span class="ar-score-pill">' + score + ' pts</span></div>'
        + '<div style="background:rgba(255,255,255,.08);border-radius:100px;height:6px;margin-bottom:12px;overflow:hidden;"><div style="width:' + progress + '%;height:100%;background:linear-gradient(90deg,#f59e0b,#ef4444);border-radius:100px;transition:width .3s;"></div></div>'
        + '<div class="ar-q">' + q.q + '</div>'
        + '<div class="ar-opts">' + q.opts.map(function(o, idx){ return '<button class="ar-opt" data-i="' + idx + '">' + o + '</button>'; }).join('') + '</div>';

      stage.querySelectorAll('.ar-opt').forEach(function(b){
        b.onclick = function(){
          total++;
          var picked = parseInt(b.getAttribute('data-i'), 10);
          if(picked === q.a){ score += 12; correct++; b.classList.add('right'); }
          else { b.classList.add('wrong'); stage.querySelectorAll('.ar-opt')[q.a].classList.add('right'); }
          stage.querySelectorAll('.ar-opt').forEach(function(x){ x.disabled = true; });
          qsi++;
          setTimeout(renderQuestion, 700);
        };
      });
    }
    render();
  });
};

/* ═══════════════════════════════════════════
   GAME REGISTRY
   ═══════════════════════════════════════════ */
var NEW_GAMES = [
  { id:'african-tycoon',   name:'African Tycoon',        emoji:'\u{1F3E6}', desc:'Buy land, build businesses, manage money — Nigerian Monopoly!', groups:['juniors','seniors','prep'], duration:'5 min', play:function(ctx){ return window.playAfricanTycoon(ctx); } },
  { id:'arena-chess',      name:'Chess',                 emoji:'♟️', desc:'Classic chess or Nigerian Kings theme — play against AI!', groups:['kids','juniors','seniors','prep'], duration:'5 min', play:function(ctx){ return window.playArenaChess(ctx); } },
  { id:'math-royale',      name:'Maths Battle Royale',   emoji:'⚡',   desc:'3 rounds of escalating maths. Bronze → Silver → Scholar!', groups:['kids','juniors','seniors','prep'], duration:'3 min', play:function(ctx){ return window.playMathRoyale(ctx); } },
  { id:'science-lab',      name:'Science Lab',           emoji:'\u{1F52C}', desc:'Virtual experiments — volcanoes, circuits, magnets and more!', groups:['juniors','seniors','prep'], duration:'5 min', play:function(ctx){ return window.playScienceLab(ctx); } },
  { id:'startup-sim',      name:'Startup Simulator',     emoji:'\u{1F680}', desc:'Build a business empire. Manage staff, money, and crises!', groups:['seniors','prep'], duration:'5 min', play:function(ctx){ return window.playStartupSim(ctx); } },
  { id:'debate-arena',     name:'Debate Arena',          emoji:'\u{1F3A4}', desc:'AI-judged debates. Argue your case, score on logic & vocab!', groups:['juniors','seniors','prep'], duration:'5 min', play:function(ctx){ return window.playDebateArena(ctx); } },
  { id:'eq-challenge',     name:'EQ Challenge',          emoji:'\u{1F49A}', desc:'Emotional intelligence scenarios — empathy, conflict, communication.', groups:['kids','juniors','seniors'], duration:'3 min', play:function(ctx){ return window.playEQChallenge(ctx); } },
  { id:'finance-survival', name:'Financial Survival',    emoji:'\u{1F4B0}', desc:'Budget, save, spot scams, invest wisely. Protect your money!', groups:['juniors','seniors','prep'], duration:'5 min', play:function(ctx){ return window.playFinanceSurvival(ctx); } },
  { id:'history-quest',    name:'African History Quest',  emoji:'\u{1F3DB}️', desc:'Explore Mali, Benin, Egypt, Nok, Songhai — interactive adventures!', groups:['juniors','seniors','prep'], duration:'5 min', play:function(ctx){ return window.playHistoryQuest(ctx); } }
];

/* ═══════════════════════════════════════════
   WIRE INTO ARENA SYSTEM
   ═══════════════════════════════════════════ */
function patchArena(){
  if(!window.ArenaUI || !window._ArenaGamesRef){
    setTimeout(patchArena, 300);
    return;
  }

  // Push directly into the live GAMES array inside arena-0.js.
  // This means createRoom dropdown, _startGame, room generation,
  // spectator, and all existing flows automatically pick up new games.
  NEW_GAMES.forEach(function(g){
    var exists = window._ArenaGamesRef.some(function(eg){ return eg.id === g.id; });
    if(!exists){
      window._ArenaGamesRef.push(g);
      window._ArenaGames.push({ id:g.id, name:g.name, emoji:g.emoji, duration:g.duration, groups:g.groups });
    }
  });
  // No monkey-patching needed — games are in the real GAMES array now.
  // The original _startGame, rules overlay, room creation, spectator
  // all work automatically.
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', patchArena);
} else {
  patchArena();
}

/* ───────────── EXPORT ───────────── */
window._ArenaNewGames = NEW_GAMES;

})();
