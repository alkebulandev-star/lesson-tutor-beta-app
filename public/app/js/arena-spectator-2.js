/* ════════════════════════════════════════════════════════════════
   ARENA SPECTATOR v2 — Board-Game Live Spectating
   ────────────────────────────────────────────────────────────────
   Patches openSpectator so Chess and Monopoly rooms show the
   actual game board updating in real-time, instead of the generic
   quiz-based scoreboard.

   Loaded AFTER arena-monopoly-2.js and BEFORE arena-ui-2.js.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── Utility ── */
function shuffleArr(a){
  a = a.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function escHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

/* ───────────────────────────────────────────────────────────────
   CHESS SPECTATOR — Full 8x8 board with AI vs AI simulation
   ─────────────────────────────────────────────────────────────── */
var CHESS_P = {
  K:{w:'♔',b:'♚'}, Q:{w:'♕',b:'♛'}, R:{w:'♖',b:'♜'},
  B:{w:'♗',b:'♝'}, N:{w:'♘',b:'♞'}, P:{w:'♙',b:'♟'}
};
var FILES = ['a','b','c','d','e','f','g','h'];
var PIECE_VAL = {P:1, N:3, B:3, R:5, Q:9, K:100};

function ChessSpectator(boardEl, pushFeed, flyCheer){
  var board = {};
  var turn = 'w';
  var moveLog = [];
  var capturedW = []; /* white pieces captured by black */
  var capturedB = []; /* black pieces captured by white */
  var gameOver = false;
  var moveCount = 0;
  var clock = 300;
  var pNames = { w: 'Player 1', b: 'Player 2' };
  var pAvatars = { w: '🟢', b: '🔴' };
  var lastMove = null;
  var timerIv = null;
  var moveIv = null;
  var destroyed = false;

  /* Name the players from room if possible */
  this.setPlayers = function(players){
    if(players[0]){ pNames.w = players[0].name; pAvatars.w = players[0].avatar; }
    if(players[1]){ pNames.b = players[1].name; pAvatars.b = players[1].avatar; }
  };

  function initBoard(){
    board = {};
    var back = ['R','N','B','Q','K','B','N','R'];
    for(var i = 0; i < 8; i++){
      board[FILES[i]+'1'] = {p:back[i],c:'w'};
      board[FILES[i]+'2'] = {p:'P',c:'w'};
      board[FILES[i]+'7'] = {p:'P',c:'b'};
      board[FILES[i]+'8'] = {p:back[i],c:'b'};
    }
  }

  function validMoves(sq){
    var piece = board[sq];
    if(!piece) return [];
    var f = FILES.indexOf(sq[0]);
    var r = parseInt(sq[1],10);
    var moves = [];
    function tryM(ff,rr){
      if(ff<0||ff>7||rr<1||rr>8) return 'out';
      var t = FILES[ff]+rr;
      var p = board[t];
      if(!p){ moves.push(t); return 'empty'; }
      if(p.c!==piece.c){ moves.push(t); return 'capture'; }
      return 'block';
    }
    function slide(df,dr){
      var ff=f+df, rr=r+dr;
      while(ff>=0&&ff<=7&&rr>=1&&rr<=8){
        var res=tryM(ff,rr);
        if(res==='block'||res==='capture') break;
        ff+=df; rr+=dr;
      }
    }
    switch(piece.p){
      case 'K':
        for(var df=-1;df<=1;df++) for(var dr=-1;dr<=1;dr++){
          if(df===0&&dr===0) continue;
          tryM(f+df,r+dr);
        }
        break;
      case 'Q': slide(1,0);slide(-1,0);slide(0,1);slide(0,-1);slide(1,1);slide(1,-1);slide(-1,1);slide(-1,-1); break;
      case 'R': slide(1,0);slide(-1,0);slide(0,1);slide(0,-1); break;
      case 'B': slide(1,1);slide(1,-1);slide(-1,1);slide(-1,-1); break;
      case 'N':
        [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(function(d){
          tryM(f+d[0],r+d[1]);
        });
        break;
      case 'P':
        var dir = piece.c==='w'?1:-1;
        var start = piece.c==='w'?2:7;
        if(!board[FILES[f]+(r+dir)]){
          moves.push(FILES[f]+(r+dir));
          if(r===start&&!board[FILES[f]+(r+2*dir)]) moves.push(FILES[f]+(r+2*dir));
        }
        [-1,1].forEach(function(d){
          var tf=f+d, tr=r+dir;
          if(tf>=0&&tf<=7&&tr>=1&&tr<=8){
            var t=board[FILES[tf]+tr];
            if(t&&t.c!==piece.c) moves.push(FILES[tf]+tr);
          }
        });
        break;
    }
    return moves;
  }

  function aiPick(color){
    var allMoves = [];
    for(var ri=1;ri<=8;ri++){
      for(var fi=0;fi<8;fi++){
        var sq=FILES[fi]+ri;
        var p=board[sq];
        if(!p||p.c!==color) continue;
        var moves=validMoves(sq);
        moves.forEach(function(to){
          var sc=0;
          var cap=board[to];
          if(cap) sc += PIECE_VAL[cap.p]*10;
          var tf=FILES.indexOf(to[0]), tr=parseInt(to[1],10);
          sc += (3.5-Math.abs(3.5-tf))*0.3 + (4.5-Math.abs(4.5-tr))*0.2;
          if(p.p==='P') sc += (color==='w'?(tr-2):(7-tr))*0.5;
          if((p.p==='N'||p.p==='B')&&((color==='w'&&ri===1)||(color==='b'&&ri===8))) sc += 1.5;
          sc += Math.random()*2;
          allMoves.push({from:sq,to:to,score:sc});
        });
      }
    }
    if(!allMoves.length) return null;
    allMoves.sort(function(a,b){ return b.score-a.score; });
    return allMoves[Math.floor(Math.random()*Math.min(3,allMoves.length))];
  }

  function checkGameOver(){
    var wK=false, bK=false;
    for(var sq in board){
      if(board[sq].p==='K'){
        if(board[sq].c==='w') wK=true;
        if(board[sq].c==='b') bK=true;
      }
    }
    if(!wK) return 'b_wins';
    if(!bK) return 'w_wins';
    return null;
  }

  function sqLabel(sq){
    return sq; /* e.g. "e4" */
  }

  function pieceName(p){
    var names = {K:'King',Q:'Queen',R:'Rook',B:'Bishop',N:'Knight',P:'Pawn'};
    return names[p]||p;
  }

  function executeMove(){
    if(destroyed||gameOver) return;
    var mv = aiPick(turn);
    if(!mv){
      gameOver = true;
      var winner = turn==='w'?'b':'w';
      pushFeed('<b style="color:#fbbf24">'+pAvatars[winner]+' '+pNames[winner]+' wins!</b> No legal moves for '+pNames[turn], 'sys');
      renderBoard();
      return;
    }

    var piece = board[mv.from];
    var cap = board[mv.to] ? board[mv.to] : null;

    /* Track captures */
    if(cap){
      if(turn==='w') capturedB.push(cap.p);
      else capturedW.push(cap.p);
    }

    /* Execute */
    board[mv.to] = board[mv.from];
    delete board[mv.from];

    /* Promotion */
    if(board[mv.to].p==='P'){
      if((turn==='w'&&parseInt(mv.to[1],10)===8)||(turn==='b'&&parseInt(mv.to[1],10)===1)){
        board[mv.to].p = 'Q';
      }
    }

    moveCount++;
    lastMove = {from:mv.from, to:mv.to};
    moveLog.push({n:moveCount, from:mv.from, to:mv.to, piece:piece.p, cap:cap?cap.p:null, color:turn});

    /* Feed */
    var moveText = CHESS_P[piece.p][turn]+' '+pieceName(piece.p)+' '+sqLabel(mv.from)+' → '+sqLabel(mv.to);
    if(cap) moveText += ' captures '+CHESS_P[cap.p][cap.c]+' '+pieceName(cap.p)+'!';
    var cls = cap ? 'right' : '';
    pushFeed('<b>'+pAvatars[turn]+' '+pNames[turn]+'</b> '+moveText, cls);

    if(cap){
      var EMO = ['🔥','💯','😎','🤯','👏'];
      flyCheer(EMO[Math.floor(Math.random()*EMO.length)]);
    }

    /* Check game over */
    var result = checkGameOver();
    if(result){
      gameOver = true;
      var winColor = result==='w_wins'?'w':'b';
      pushFeed('<b style="color:#fbbf24">🏆 '+pAvatars[winColor]+' '+pNames[winColor]+' wins by capturing the King!</b>', 'sys');
      flyCheer('🏆');
    }

    turn = turn==='w'?'b':'w';
    renderBoard();
  }

  function renderBoard(){
    if(destroyed||!boardEl) return;
    var html = '';

    /* Styles */
    html += '<style>';
    html += '.spec-chess-wrap{max-width:440px;margin:0 auto;}';
    html += '.spec-chess-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding:0 2px;}';
    html += '.spec-chess-player{display:flex;align-items:center;gap:8px;}';
    html += '.spec-chess-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.9rem;border:2px solid;}';
    html += '.spec-chess-name{font-weight:800;font-size:.8rem;color:#fff;}';
    html += '.spec-chess-captures{font-size:.65rem;color:rgba(255,255,255,.45);}';
    html += '.spec-chess-timer{background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);color:#fbbf24;padding:3px 12px;border-radius:100px;font-weight:900;font-size:.9rem;font-family:"Bricolage Grotesque",monospace;}';
    html += '.spec-chess-turn{font-size:.6rem;color:rgba(255,255,255,.35);text-align:center;margin-top:2px;}';
    html += '.spec-chess-board{background:linear-gradient(160deg,#1a1a2e,#0f172a);border-radius:12px;padding:5px;margin-bottom:6px;box-shadow:0 8px 32px rgba(0,0,0,.4);}';
    html += '.spec-chess-grid{display:grid;grid-template-columns:18px repeat(8,1fr);grid-template-rows:repeat(8,1fr) 14px;gap:0;}';
    html += '.spec-chess-sq{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:clamp(1.2rem,4vw,1.9rem);user-select:none;transition:background .25s;}';
    html += '.spec-chess-label{color:rgba(255,255,255,.3);font-size:.55rem;font-weight:700;display:flex;align-items:center;justify-content:center;}';
    html += '.spec-chess-moves{max-height:80px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:2px;padding:4px;background:rgba(255,255,255,.03);border-radius:8px;margin-top:4px;}';
    html += '.spec-chess-move{font-size:.62rem;color:rgba(255,255,255,.5);padding:2px 5px;border-radius:4px;background:rgba(255,255,255,.04);}';
    html += '.spec-chess-move.cap{background:rgba(239,68,68,.12);color:#fca5a5;}';
    html += '.spec-chess-status{text-align:center;font-size:.72rem;color:rgba(255,255,255,.5);padding:4px 0;background:rgba(255,255,255,.03);border-radius:8px;margin-top:4px;}';
    html += '</style>';

    html += '<div class="spec-chess-wrap">';

    /* Top: Black player info */
    html += '<div class="spec-chess-info">';
    html += '<div class="spec-chess-player">';
    html += '<div class="spec-chess-av" style="background:linear-gradient(135deg,#1e293b,#334155);border-color:'+(turn==='b'?'#ef4444':'rgba(255,255,255,.15)')+';">'+pAvatars.b+'</div>';
    html += '<div><div class="spec-chess-name">'+escHtml(pNames.b)+' (Black)</div>';
    html += '<div class="spec-chess-captures">'+capturedW.map(function(p){return CHESS_P[p].w;}).join(' ')+(capturedW.length?'':'no captures')+'</div></div>';
    html += '</div>';
    /* Timer */
    html += '<div style="text-align:center;">';
    html += '<div class="spec-chess-timer" id="specChessClock">'+Math.floor(clock/60)+':'+('0'+(clock%60)).slice(-2)+'</div>';
    html += '<div class="spec-chess-turn">'+(gameOver?'Game Over':turn==='w'?pNames.w+' thinking...':pNames.b+' thinking...')+'</div>';
    html += '</div>';
    html += '</div>';

    /* Board */
    html += '<div class="spec-chess-board">';
    html += '<div class="spec-chess-grid">';
    for(var r=8;r>=1;r--){
      html += '<div class="spec-chess-label">'+r+'</div>';
      for(var f=0;f<8;f++){
        var sq = FILES[f]+r;
        var light = (f+r)%2===1;
        var p = board[sq];
        var isLastFrom = lastMove && sq===lastMove.from;
        var isLastTo = lastMove && sq===lastMove.to;
        var bg;
        if(isLastTo) bg = light ? '#fef08a' : '#ca8a04';
        else if(isLastFrom) bg = light ? '#fef9c3' : '#a16207';
        else bg = light ? '#f0d9b5' : '#b58863';
        var content = p ? CHESS_P[p.p][p.c] : '';
        var shadow = p ? 'text-shadow:0 1px 3px rgba(0,0,0,.5);' : '';
        html += '<div class="spec-chess-sq" style="background:'+bg+';'+shadow+'">'+content+'</div>';
      }
    }
    /* File labels */
    html += '<div></div>';
    for(var fi=0;fi<8;fi++){
      html += '<div class="spec-chess-label" style="padding-top:2px;">'+FILES[fi]+'</div>';
    }
    html += '</div></div>';

    /* Bottom: White player info */
    html += '<div class="spec-chess-info" style="margin-top:6px;">';
    html += '<div class="spec-chess-player">';
    html += '<div class="spec-chess-av" style="background:linear-gradient(135deg,#f0d9b5,#deb887);border-color:'+(turn==='w'?'#10b981':'rgba(255,255,255,.15)')+';">'+pAvatars.w+'</div>';
    html += '<div><div class="spec-chess-name">'+escHtml(pNames.w)+' (White)</div>';
    html += '<div class="spec-chess-captures">'+capturedB.map(function(p){return CHESS_P[p].b;}).join(' ')+(capturedB.length?'':'no captures')+'</div></div>';
    html += '</div>';
    html += '<div style="font-size:.72rem;color:rgba(255,255,255,.4);font-weight:700;">Move '+moveCount+'</div>';
    html += '</div>';

    /* Move log */
    if(moveLog.length){
      html += '<div class="spec-chess-moves">';
      moveLog.slice(-20).forEach(function(m){
        var cls = m.cap ? ' cap' : '';
        html += '<span class="spec-chess-move'+cls+'">'+m.n+'. '+CHESS_P[m.piece][m.color]+m.from+'→'+m.to+(m.cap?'x'+CHESS_P[m.cap][m.color==='w'?'b':'w']:'')+'</span>';
      });
      html += '</div>';
    }

    /* Status */
    html += '<div class="spec-chess-status">';
    if(gameOver) html += '🏆 Game Over!';
    else html += '🟢 Live — watching move-by-move';
    html += '</div>';

    html += '</div>';

    boardEl.innerHTML = html + '<div class="ar-cheer-layer" id="specCheerLayer"></div>';
  }

  /* Start */
  this.start = function(){
    initBoard();
    renderBoard();

    /* Clock */
    timerIv = setInterval(function(){
      if(destroyed||gameOver) return;
      clock--;
      var el = document.getElementById('specChessClock');
      if(el) el.textContent = Math.floor(clock/60)+':'+('0'+(clock%60)).slice(-2);
      if(clock <= 0){
        gameOver = true;
        pushFeed('Time\'s up! Game over.', 'sys');
        renderBoard();
      }
    }, 1000);

    /* AI moves every 2-4 seconds */
    function scheduleTick(){
      if(destroyed||gameOver) return;
      moveIv = setTimeout(function(){
        executeMove();
        scheduleTick();
      }, 1800 + Math.random()*2500);
    }
    scheduleTick();
  };

  this.destroy = function(){
    destroyed = true;
    if(timerIv) clearInterval(timerIv);
    if(moveIv) clearTimeout(moveIv);
  };
}


/* ───────────────────────────────────────────────────────────────
   MONOPOLY SPECTATOR — Full 32-space (9×9) board with AI vs AI
   ─────────────────────────────────────────────────────────────── */

var NUM_SPEC_SPACES = 32;
var SPEC_SPACES = [
  {id:0,  name:'GO',                  type:'go',        emoji:'🏁',  color:null},
  {id:1,  name:'Aba Market Stall',    type:'property',  emoji:'🏪',  cost:600,   rent:50,  color:'#8B4513',group:'brown'},
  {id:2,  name:'Naija Luck',          type:'chance',    emoji:'🃏',  color:'#f59e0b'},
  {id:3,  name:'Onitsha Trading Post',type:'property',  emoji:'📦',  cost:600,   rent:50,  color:'#8B4513',group:'brown'},
  {id:4,  name:'Tax Office',          type:'tax',       emoji:'🏦',  amount:200, color:null},
  {id:5,  name:'Lagos-Ibadan Express',type:'property',  emoji:'🚗',  cost:2000,  rent:250, color:'#6b7280',group:'transport'},
  {id:6,  name:'Abeokuta Farms',      type:'property',  emoji:'🌾',  cost:800,   rent:60,  color:'#67e8f9',group:'lightblue'},
  {id:7,  name:'Community Chest',     type:'community', emoji:'🤝',  color:'#3b82f6'},
  {id:8,  name:'JAIL',                type:'jail',      emoji:'🔒',  color:null},

  {id:9,  name:'Enugu Coal Mine',     type:'property',  emoji:'⛏️',  cost:1000,  rent:80,  color:'#67e8f9',group:'lightblue'},
  {id:10, name:'NEPA Power Station',  type:'property',  emoji:'⚡',  cost:1500,  rent:100, color:'#fbbf24',group:'utility'},
  {id:11, name:'Ibadan Cocoa Farm',   type:'property',  emoji:'🌱',  cost:1000,  rent:80,  color:'#67e8f9',group:'lightblue'},
  {id:12, name:'Naija Luck',          type:'chance',    emoji:'🃏',  color:'#f59e0b'},
  {id:13, name:'Kano Textile Mill',   type:'property',  emoji:'🏭',  cost:1200,  rent:100, color:'#f472b6',group:'pink'},
  {id:14, name:'BRT Bus Stop',        type:'property',  emoji:'🚌',  cost:2000,  rent:250, color:'#6b7280',group:'transport'},
  {id:15, name:'Abuja CBD Office',    type:'property',  emoji:'🏢',  cost:1400,  rent:120, color:'#f472b6',group:'pink'},

  {id:16, name:'Free Parking',        type:'parking',   emoji:'🅿️', color:null},
  {id:17, name:'Abuja Maitama',       type:'property',  emoji:'🏨',  cost:1600,  rent:140, color:'#fb923c',group:'orange'},
  {id:18, name:'Community Chest',     type:'community', emoji:'🤝',  color:'#3b82f6'},
  {id:19, name:'Dangote Refinery',    type:'property',  emoji:'🏭',  cost:2000,  rent:150, color:'#fbbf24',group:'utility'},
  {id:20, name:'P.H. GRA',           type:'property',  emoji:'🏡',  cost:1600,  rent:140, color:'#fb923c',group:'orange'},
  {id:21, name:'Lagos Airport',       type:'property',  emoji:'✈️',  cost:2000,  rent:250, color:'#6b7280',group:'transport'},
  {id:22, name:'Calabar Resort',      type:'property',  emoji:'🏖️', cost:1800,  rent:160, color:'#ef4444',group:'red'},
  {id:23, name:'Naija Luck',          type:'chance',    emoji:'🃏',  color:'#f59e0b'},
  {id:24, name:'EFCC Office',         type:'gotojail',  emoji:'🏛️', color:null},

  {id:25, name:'Lekki Gardens',       type:'property',  emoji:'🌳',  cost:2000,  rent:180, color:'#ef4444',group:'red'},
  {id:26, name:'Community Chest',     type:'community', emoji:'🤝',  color:'#3b82f6'},
  {id:27, name:'Victoria Island',     type:'property',  emoji:'🌇',  cost:2600,  rent:220, color:'#22c55e',group:'green'},
  {id:28, name:'Luxury Tax',          type:'tax',       emoji:'💸',  amount:750, color:null},
  {id:29, name:'Ikoyi Crescent',      type:'property',  emoji:'🏘️', cost:2800,  rent:250, color:'#22c55e',group:'green'},
  {id:30, name:'Keke NAPEP',          type:'property',  emoji:'🛺',  cost:2000,  rent:250, color:'#6b7280',group:'transport'},
  {id:31, name:'Banana Island',       type:'property',  emoji:'🌴',  cost:4000,  rent:400, color:'#818cf8',group:'blue'}
];
var SPEC_COLOR_GROUPS = {
  brown:[1,3], lightblue:[6,9,11], pink:[13,15], orange:[17,20],
  red:[22,25], green:[27,29], blue:[31], utility:[10,19], transport:[5,14,21,30]
};
var SPEC_GRID_MAP = [
  /* Bottom row (row 8): pos 0 at col 8 … pos 8 at col 0 */
  {pos:0,row:8,col:8},{pos:1,row:8,col:7},{pos:2,row:8,col:6},{pos:3,row:8,col:5},{pos:4,row:8,col:4},{pos:5,row:8,col:3},{pos:6,row:8,col:2},{pos:7,row:8,col:1},{pos:8,row:8,col:0},
  /* Left column (col 0): pos 9 at row 7 … pos 15 at row 1 */
  {pos:9,row:7,col:0},{pos:10,row:6,col:0},{pos:11,row:5,col:0},{pos:12,row:4,col:0},{pos:13,row:3,col:0},{pos:14,row:2,col:0},{pos:15,row:1,col:0},
  /* Top row (row 0): pos 16 at col 0 … pos 24 at col 8 */
  {pos:16,row:0,col:0},{pos:17,row:0,col:1},{pos:18,row:0,col:2},{pos:19,row:0,col:3},{pos:20,row:0,col:4},{pos:21,row:0,col:5},{pos:22,row:0,col:6},{pos:23,row:0,col:7},{pos:24,row:0,col:8},
  /* Right column (col 8): pos 25 at row 1 … pos 31 at row 7 */
  {pos:25,row:1,col:8},{pos:26,row:2,col:8},{pos:27,row:3,col:8},{pos:28,row:4,col:8},{pos:29,row:5,col:8},{pos:30,row:6,col:8},{pos:31,row:7,col:8}
];
var DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
var SPEC_CHANCE = [
  {text:'Oil prices surge! Advance to P.H. GRA', action:'move', dest:20},
  {text:'Diaspora remittance! Collect A₦1,000', action:'gain', amount:1000},
  {text:'Traffic jam on Third Mainland Bridge! Go back 3 spaces', action:'back', steps:3},
  {text:'Government contract! Collect A₦500', action:'gain', amount:500},
  {text:'Generator fuel price up! Pay A₦300', action:'lose', amount:300},
  {text:'EFCC summons! Report to EFCC Office', action:'jail'},
  {text:'TikTok went viral! Collect A₦200 from opponent', action:'collect_each', amount:200},
  {text:'Advance to GO — collect A₦2,000', action:'go'},
  {text:'Building permit approved! Collect A₦400', action:'gain', amount:400},
  {text:'Bank alert! Collect A₦800', action:'gain', amount:800},
  {text:'Jollof rice business booming! Collect A₦600', action:'gain', amount:600},
  {text:'Danfo bus broke down! Pay A₦250 for repairs', action:'lose', amount:250}
];
var SPEC_COMMUNITY = [
  {text:'Community contribution: collect A₦500', action:'gain', amount:500},
  {text:'School fees due: pay A₦400', action:'lose', amount:400},
  {text:'Aso-ebi request: pay A₦200', action:'lose', amount:200},
  {text:'Cooperative savings mature: collect A₦1,000', action:'gain', amount:1000},
  {text:'Community levy: pay A₦300', action:'lose', amount:300},
  {text:'Wedding gift from uncle: collect A₦600', action:'gain', amount:600},
  {text:'NEPA bill overcharge refund: collect A₦250', action:'gain', amount:250},
  {text:'Birthday! Collect A₦100 from opponent', action:'collect_each', amount:100},
  {text:'Road repairs tax: pay A₦500', action:'lose', amount:500},
  {text:'Susu savings bonus: collect A₦350', action:'gain', amount:350},
  {text:'Church harvest donation: pay A₦150', action:'lose', amount:150},
  {text:'Owambe party profit! Collect A₦450', action:'gain', amount:450}
];

function MonopolySpectator(boardEl, pushFeed, flyCheer){
  var MAX_TURNS = 36;
  var startCash = 18000;
  var potMoney = 0;
  var players = [
    {name:'Player 1', token:'🟢', avatar:'🟢', pos:0, cash:startCash, props:[], inJail:false, jailTurns:0, color:'#10b981'},
    {name:'Player 2', token:'🔴', avatar:'🔴', pos:0, cash:startCash, props:[], inJail:false, jailTurns:0, color:'#ef4444'}
  ];
  var currentPlayer = 0;
  var turnCount = 0;
  var dice = [1,1];
  var lastDiceTotal = 2;
  var gameMessage = 'Match starting...';
  var gameSubMsg = '';
  var cardMessage = null;
  var cardFlipIn = false;
  var gameEnded = false;
  var destroyed = false;
  var turnIv = null;
  var diceSpinning = false;
  var chanceDeck = shuffleArr(SPEC_CHANCE);
  var communityDeck = shuffleArr(SPEC_COMMUNITY);
  var chanceIdx = 0;
  var communityIdx = 0;

  /* ── Houses & Mortgages ── */
  var houses = {};
  var mortgaged = {};

  /* ── Visual feedback state ── */
  var cashFlash0 = '';
  var cashFlash1 = '';

  this.setPlayers = function(roomPlayers){
    if(roomPlayers[0]){ players[0].name = roomPlayers[0].name; players[0].avatar = roomPlayers[0].avatar; }
    if(roomPlayers[1]){ players[1].name = roomPlayers[1].name; players[1].avatar = roomPlayers[1].avatar; }
  };

  function rollDie(){ return Math.floor(Math.random()*6)+1; }

  function netWorth(p){
    var v = p.cash;
    p.props.forEach(function(id){
      if(!mortgaged[id]) v += SPEC_SPACES[id].cost;
      else v += Math.round(SPEC_SPACES[id].cost * 0.5);
      v += (houses[id] || 0) * Math.round(SPEC_SPACES[id].cost * 0.5);
    });
    return v;
  }

  function totalPropertyValue(p){
    var v = 0;
    p.props.forEach(function(id){
      v += SPEC_SPACES[id].cost;
      v += (houses[id] || 0) * Math.round(SPEC_SPACES[id].cost * 0.5);
    });
    return v;
  }

  function totalHouses(p){
    var h = 0;
    p.props.forEach(function(id){ h += (houses[id] || 0); });
    return h;
  }

  function ownsFullGroup(playerIdx, group){
    var needed = SPEC_COLOR_GROUPS[group];
    if(!needed) return false;
    var p = players[playerIdx];
    for(var i=0;i<needed.length;i++){
      if(p.props.indexOf(needed[i])===-1) return false;
    }
    return true;
  }

  function ownerOf(spaceId){
    for(var i=0;i<players.length;i++){
      if(players[i].props.indexOf(spaceId)!==-1) return i;
    }
    return -1;
  }

  function abbreviate(name){
    if(name.length<=8) return name;
    var words = name.split(' ');
    if(words.length>=2) return words[0].slice(0,4)+' '+words[1].slice(0,3);
    return name.slice(0,8);
  }

  function nextChance(){ var c=chanceDeck[chanceIdx%chanceDeck.length]; chanceIdx++; return c; }
  function nextCommunity(){ var c=communityDeck[communityIdx%communityDeck.length]; communityIdx++; return c; }

  function isBankrupt(p){ return p.cash<0 && p.props.length===0; }

  /* ── Cell gradient — premium per-type coloring ── */
  function cellGradient(space){
    switch(space.type){
      case 'go':       return 'linear-gradient(135deg, rgba(34,197,94,.18), rgba(16,185,129,.08))';
      case 'jail':     return 'linear-gradient(135deg, rgba(75,75,75,.25), rgba(239,68,68,.08))';
      case 'parking':  return 'linear-gradient(135deg, rgba(20,184,166,.15), rgba(6,182,212,.08))';
      case 'gotojail': return 'linear-gradient(135deg, rgba(239,68,68,.2), rgba(185,28,28,.1))';
      case 'chance':   return 'linear-gradient(135deg, rgba(245,158,11,.15), rgba(251,191,36,.08))';
      case 'community':return 'linear-gradient(135deg, rgba(59,130,246,.15), rgba(96,165,250,.08))';
      case 'tax':      return 'linear-gradient(135deg, rgba(168,85,247,.12), rgba(139,92,246,.06))';
      case 'property':
        if(space.color) return 'linear-gradient(135deg, '+space.color+'22, '+space.color+'0a)';
        return 'rgba(255,255,255,.06)';
      default: return 'rgba(255,255,255,.06)';
    }
  }

  /* ── Mortgage system ── */
  function autoMortgage(pIdx){
    var p = players[pIdx];
    while(p.cash < 0 && p.props.length > 0){
      var cheapestId = -1;
      var cheapestCost = Infinity;
      for(var i=0;i<p.props.length;i++){
        var pid = p.props[i];
        if(!mortgaged[pid] && SPEC_SPACES[pid].cost < cheapestCost){
          cheapestCost = SPEC_SPACES[pid].cost;
          cheapestId = pid;
        }
      }
      if(cheapestId === -1) break;
      mortgaged[cheapestId] = true;
      var mortgageValue = Math.round(SPEC_SPACES[cheapestId].cost * 0.5);
      p.cash += mortgageValue;
      pushFeed('<b>'+p.avatar+' '+p.name+'</b> mortgaged '+SPEC_SPACES[cheapestId].emoji+' '+SPEC_SPACES[cheapestId].name+' for A₦'+mortgageValue.toLocaleString()+' 🏷️');
    }
  }

  /* ── Cash flash helpers ── */
  function flashCash(pIdx, color){
    if(pIdx === 0) cashFlash0 = color;
    else cashFlash1 = color;
    setTimeout(function(){
      if(pIdx === 0) cashFlash0 = '';
      else cashFlash1 = '';
      renderBoard();
    }, 600);
  }

  /* ── Count transports owned by a player ── */
  function countTransports(ownerIdx){
    var count = 0;
    var transports = SPEC_COLOR_GROUPS.transport;
    var p = players[ownerIdx];
    for(var i=0;i<transports.length;i++){
      if(p.props.indexOf(transports[i])!==-1 && !mortgaged[transports[i]]) count++;
    }
    return count;
  }

  /* ── Transport rent: base × number of transports owned ── */
  function calcTransportRent(ownerIdx, space){
    if(mortgaged[space.id]) return 0;
    var numOwned = countTransports(ownerIdx);
    return space.rent * Math.max(numOwned, 1);
  }

  /* ── Utility rent: both = dice×100, one = dice×40 ── */
  function calcUtilityRent(ownerIdx){
    var ownsBoth = (players[ownerIdx].props.indexOf(10)!==-1 && !mortgaged[10]) &&
                   (players[ownerIdx].props.indexOf(19)!==-1 && !mortgaged[19]);
    return ownsBoth ? lastDiceTotal * 100 : lastDiceTotal * 40;
  }

  /* ── Rent calculation with houses, transport scaling, utility ── */
  function calcRent(space, ownerIdx){
    if(mortgaged[space.id]) return 0;
    /* Transport special */
    if(space.group === 'transport') return calcTransportRent(ownerIdx, space);
    /* Utility special */
    if(space.group === 'utility') return calcUtilityRent(ownerIdx);
    var rent = space.rent;
    var hc = houses[space.id] || 0;
    var houseMultiplier = 1 + hc;
    rent = rent * houseMultiplier;
    if(space.group && ownsFullGroup(ownerIdx, space.group) && hc === 0){
      rent = rent * 2;
    }
    return rent;
  }

  /* ── Dice animation — slot-machine style ── */
  function renderDiceOnly(){
    var el = document.getElementById('spec-mnply-dice-display');
    if(el) el.innerHTML = DICE_FACES[dice[0]-1] + ' ' + DICE_FACES[dice[1]-1];
  }

  function animateDice(finalDice, callback){
    var frames = 12;
    var delay = 70;
    var count = 0;
    diceSpinning = true;
    renderBoard();
    function tick(){
      if(destroyed) return;
      count++;
      dice = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
      if(count > 8) delay = 150;
      if(count > 10) delay = 220;
      if(count >= frames){
        dice = finalDice;
        diceSpinning = false;
        renderBoard();
        setTimeout(callback, 400);
        return;
      }
      renderDiceOnly();
      setTimeout(tick, delay);
    }
    tick();
  }

  /* ── End game — premium results card ── */
  function endGame(){
    if(gameEnded) return;
    gameEnded = true;
    var nw0 = netWorth(players[0]);
    var nw1 = netWorth(players[1]);
    var winner = nw0 > nw1 ? 0 : 1;
    var propVal0 = totalPropertyValue(players[0]);
    var propVal1 = totalPropertyValue(players[1]);
    var h0 = totalHouses(players[0]);
    var h1 = totalHouses(players[1]);
    gameMessage = '🏆 ' + players[winner].avatar + ' ' + players[winner].name + ' Wins!';
    gameSubMsg = '__endgame__';

    /* Store endgame data for render */
    window._specMnplyEndData = {
      winner: winner,
      nw0: nw0, nw1: nw1,
      cash0: players[0].cash, cash1: players[1].cash,
      props0: players[0].props.length, props1: players[1].props.length,
      propVal0: propVal0, propVal1: propVal1,
      houses0: h0, houses1: h1
    };

    pushFeed('<b style="color:#fbbf24">🏆 '+players[winner].avatar+' '+players[winner].name+' wins the match!</b> Net worth: A₦'+netWorth(players[winner]).toLocaleString(), 'sys');
    flyCheer('🏆');
    renderBoard();
  }

  function processCard(pIdx, card, callback){
    var p = players[pIdx];
    var opp = pIdx===0?1:0;
    switch(card.action){
      case 'gain':
        p.cash += card.amount;
        flashCash(pIdx, 'green');
        break;
      case 'lose':
        p.cash -= card.amount;
        potMoney += card.amount;
        autoMortgage(pIdx);
        flashCash(pIdx, 'red');
        break;
      case 'move':
        p.pos = card.dest;
        renderBoard();
        setTimeout(function(){ processLanding(pIdx, callback); }, 500);
        return;
      case 'back':
        p.pos = (p.pos - card.steps + NUM_SPEC_SPACES) % NUM_SPEC_SPACES;
        renderBoard();
        setTimeout(function(){ processLanding(pIdx, callback); }, 500);
        return;
      case 'jail':
        p.pos = 8; p.inJail = true; p.jailTurns = 0;
        break;
      case 'collect_each':
        p.cash += card.amount; players[opp].cash -= card.amount;
        autoMortgage(opp);
        flashCash(pIdx, 'green');
        flashCash(opp, 'red');
        break;
      case 'go':
        p.pos = 0; p.cash += 2000;
        flashCash(pIdx, 'green');
        break;
    }
    callback();
  }

  function processLanding(pIdx, callback){
    var p = players[pIdx];
    var space = SPEC_SPACES[p.pos];
    var opp = pIdx===0?1:0;
    cardMessage = null;
    cardFlipIn = false;

    switch(space.type){
      case 'go':
        gameSubMsg = 'Welcome to GO!';
        callback();
        break;
      case 'property':
        var owner = ownerOf(space.id);
        if(owner===-1){
          /* AI decides — buy if affordable with reserve */
          if(p.cash > space.cost + 2000){
            p.cash -= space.cost;
            p.props.push(space.id);
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> bought '+space.emoji+' '+space.name+' for A₦'+space.cost.toLocaleString()+' 🏠', 'right');
            flyCheer('🏠');
            flashCash(pIdx, 'green');
          } else if(p.cash > space.cost && Math.random() < 0.6){
            p.cash -= space.cost;
            p.props.push(space.id);
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> bought '+space.emoji+' '+space.name+' for A₦'+space.cost.toLocaleString(), 'right');
            flashCash(pIdx, 'green');
          } else {
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> passed on '+space.emoji+' '+space.name);
          }
          callback();
        } else if(owner===pIdx){
          /* Own property — check if can build houses (not on transport/utility) */
          if(space.group && space.group !== 'transport' && space.group !== 'utility' && ownsFullGroup(pIdx, space.group)){
            var houseCount = houses[space.id] || 0;
            var houseCost = Math.round(space.cost * 0.5);
            if(houseCount < 4 && p.cash > houseCost + 3000){
              houses[space.id] = houseCount + 1;
              p.cash -= houseCost;
              pushFeed('<b>'+p.avatar+' '+p.name+'</b> built a house on '+space.emoji+' '+space.name+' ('+(houseCount+1)+'/4) 🏠', 'right');
              flyCheer('🏠');
              flashCash(pIdx, 'green');
            }
          }
          gameSubMsg = 'Own property!';
          callback();
        } else {
          /* Pay rent */
          if(mortgaged[space.id]){
            gameSubMsg = 'Property is mortgaged — no rent!';
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> lands on mortgaged '+space.emoji+' '+space.name+' — no rent!');
            callback();
            return;
          }
          var rent = calcRent(space, owner);
          var hc = houses[space.id] || 0;
          if(space.group === 'transport'){
            var tCount = countTransports(owner);
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> pays A₦'+rent.toLocaleString()+' transport fare ('+tCount+' route'+(tCount>1?'s':'')+') to '+players[owner].avatar+' '+players[owner].name+' for '+space.emoji+' '+space.name+' 🚗', 'wrong');
          } else if(space.group === 'utility'){
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> pays A₦'+rent.toLocaleString()+' utility bill to '+players[owner].avatar+' '+players[owner].name+' for '+space.emoji+' '+space.name+' ⚡', 'wrong');
          } else if(hc > 0){
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> pays A₦'+rent.toLocaleString()+' rent ('+hc+' house'+(hc>1?'s':'')+') to '+players[owner].avatar+' '+players[owner].name+' for '+space.emoji+' '+space.name+' 💰', 'wrong');
          } else if(space.group && ownsFullGroup(owner, space.group)){
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> pays A₦'+rent.toLocaleString()+' DOUBLE rent to '+players[owner].avatar+' '+players[owner].name+' for '+space.emoji+' '+space.name+' 💰', 'wrong');
          } else {
            pushFeed('<b>'+p.avatar+' '+p.name+'</b> pays A₦'+rent.toLocaleString()+' rent to '+players[owner].avatar+' '+players[owner].name+' for '+space.emoji+' '+space.name);
          }
          p.cash -= rent;
          players[owner].cash += rent;
          autoMortgage(pIdx);
          flashCash(pIdx, 'red');
          flashCash(owner, 'green');
          callback();
        }
        break;
      case 'tax':
        p.cash -= space.amount;
        potMoney += space.amount;
        autoMortgage(pIdx);
        pushFeed('<b>'+p.avatar+' '+p.name+'</b> pays A₦'+space.amount+' tax 🏦 (Pot: A₦'+potMoney.toLocaleString()+')');
        flashCash(pIdx, 'red');
        callback();
        break;
      case 'jail':
        gameSubMsg = 'Just visiting!';
        callback();
        break;
      case 'gotojail':
        p.pos = 8; p.inJail = true; p.jailTurns = 0;
        pushFeed('<b>'+p.avatar+' '+p.name+'</b> sent to Jail! 🏛️ EFCC Office!', 'wrong');
        flyCheer('🏛️');
        callback();
        break;
      case 'parking':
        if(potMoney > 0){
          p.cash += potMoney;
          pushFeed('<b>'+p.avatar+' '+p.name+'</b> collects A₦'+potMoney.toLocaleString()+' from Free Parking! 🅿️', 'right');
          flyCheer('💰');
          flashCash(pIdx, 'green');
          potMoney = 0;
        }
        callback();
        break;
      case 'chance':
        var card = nextChance();
        cardMessage = '🃏 Naija Luck: ' + card.text;
        cardFlipIn = true;
        pushFeed('<b>'+p.avatar+' '+p.name+'</b> drew Naija Luck: '+card.text, 'sys');
        processCard(pIdx, card, callback);
        break;
      case 'community':
        var ccard = nextCommunity();
        cardMessage = '🤝 Community: ' + ccard.text;
        cardFlipIn = true;
        pushFeed('<b>'+p.avatar+' '+p.name+'</b> drew Community: '+ccard.text, 'sys');
        processCard(pIdx, ccard, callback);
        break;
      default:
        callback();
    }
  }

  function doTurn(pIdx){
    if(destroyed || gameEnded) return;
    var p = players[pIdx];

    /* Check jail */
    if(p.inJail){
      if(p.cash > 3000){
        p.cash -= 500; potMoney += 500; p.inJail = false;
        pushFeed('<b>'+p.avatar+' '+p.name+'</b> paid A₦500 to leave jail');
        flashCash(pIdx, 'red');
      } else {
        p.jailTurns++;
        if(p.jailTurns >= 2){
          p.inJail = false;
          pushFeed('<b>'+p.avatar+' '+p.name+'</b> released from jail after serving time');
        } else {
          pushFeed('<b>'+p.avatar+' '+p.name+'</b> skips turn in jail 🔒');
          finishTurn(pIdx);
          return;
        }
      }
    }

    /* Roll with animated dice */
    var finalDice = [rollDie(), rollDie()];
    var total = finalDice[0] + finalDice[1];
    lastDiceTotal = total;

    animateDice(finalDice, function(){
      if(destroyed) return;
      var oldPos = p.pos;
      var newPos = (p.pos + total) % NUM_SPEC_SPACES;

      if(newPos <= oldPos && total > 0){
        p.cash += 2000;
        pushFeed('<b>'+p.avatar+' '+p.name+'</b> passed GO! Collect A₦2,000 ➡️', 'right');
        flashCash(pIdx, 'green');
      }

      p.pos = newPos;
      var space = SPEC_SPACES[newPos];
      gameMessage = p.avatar+' '+p.name+' rolled '+DICE_FACES[finalDice[0]-1]+DICE_FACES[finalDice[1]-1]+' ('+total+')';
      gameSubMsg = 'Landed on '+space.emoji+' '+space.name;

      pushFeed('<b>'+p.avatar+' '+p.name+'</b> rolled '+DICE_FACES[finalDice[0]-1]+DICE_FACES[finalDice[1]-1]+' ('+total+') → '+space.emoji+' '+space.name);

      renderBoard();

      /* Process landing after render */
      setTimeout(function(){
        if(destroyed) return;
        processLanding(pIdx, function(){
          finishTurn(pIdx);
        });
      }, 600);
    });
  }

  function finishTurn(pIdx){
    if(destroyed) return;
    turnCount++;

    /* AI house building on all owned properties at end of turn */
    var aiP = players[pIdx];
    aiP.props.forEach(function(propId){
      var sp = SPEC_SPACES[propId];
      if(sp.group && sp.group !== 'transport' && sp.group !== 'utility' && ownsFullGroup(pIdx, sp.group) && !mortgaged[propId]){
        var hc = houses[propId] || 0;
        var houseCost = Math.round(sp.cost * 0.5);
        if(hc < 4 && aiP.cash > houseCost + 3000){
          houses[propId] = hc + 1;
          aiP.cash -= houseCost;
          pushFeed('<b>'+aiP.avatar+' '+aiP.name+'</b> built a house on '+sp.emoji+' '+sp.name+' ('+(hc+1)+'/4) 🏠', 'right');
        }
      }
    });

    renderBoard();

    if(isBankrupt(players[0]) || isBankrupt(players[1])){
      setTimeout(endGame, 500);
      return;
    }
    if(turnCount >= MAX_TURNS){
      setTimeout(endGame, 500);
      return;
    }

    currentPlayer = pIdx===0 ? 1 : 0;
    /* Schedule next turn with realistic delay */
    turnIv = setTimeout(function(){
      doTurn(currentPlayer);
    }, 2200 + Math.random()*2000);
  }

  /* ───────────── RENDER ───────────── */
  function renderBoard(){
    if(destroyed || !boardEl) return;
    var html = '';

    /* ── Premium Styles ── */
    html += '<style>';
    /* Wrapper */
    html += '.spec-mono-wrap{background:linear-gradient(135deg, #7c3aed22, #3b82f622);border-radius:16px;padding:10px;box-shadow:0 4px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06);max-width:520px;margin:0 auto;}';
    html += '.spec-mono-title{text-align:center;font-family:"Bricolage Grotesque",system-ui;font-size:12px;font-weight:900;color:#fbbf24;margin-bottom:6px;text-shadow:0 0 12px rgba(251,191,36,.3);letter-spacing:.5px;}';

    /* Turn progress bar */
    html += '.spec-mono-turn-wrap{margin-bottom:6px;padding:0 2px;}';
    html += '.spec-mono-turn-label{font-size:9px;color:rgba(255,255,255,.4);text-align:center;margin-bottom:3px;font-weight:700;}';
    html += '.spec-mono-turn-bar{height:4px;border-radius:2px;overflow:hidden;background:rgba(255,255,255,.06);}';
    html += '.spec-mono-turn-fill{height:100%;border-radius:2px;background:linear-gradient(90deg, #a855f7, #7c3aed);transition:width .5s;}';

    /* Board — 9×9 grid */
    html += '.spec-mono-board{display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(9,1fr);gap:2px;width:100%;aspect-ratio:1/1;margin-bottom:8px;}';

    /* Cells — premium */
    html += '.spec-mono-cell{position:relative;border:1px solid rgba(255,255,255,.08);border-radius:5px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8px;color:rgba(255,255,255,.7);padding:1px;overflow:hidden;min-height:0;min-width:0;line-height:1.1;transition:all .3s;}';
    html += '.spec-mono-cell-corner{border-radius:8px;}';
    html += '.spec-mono-cell .cstrip{position:absolute;width:100%;height:4px;left:0;top:0;border-radius:5px 5px 0 0;}';
    html += '.spec-mono-cell .cemoji{font-size:11px;line-height:1;}';
    html += '.spec-mono-cell .cname{font-size:6.5px;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;margin-top:1px;}';
    html += '.spec-mono-cell .cprice{font-size:5.5px;color:rgba(255,255,255,.4);}';
    html += '.spec-mono-cell .ctokens{display:flex;gap:2px;font-size:12px;position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);border-radius:10px;padding:1px 3px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.7));}';
    html += '.spec-mono-cell .cowner-border{position:absolute;inset:0;border-radius:5px;pointer-events:none;}';
    html += '.spec-mono-cell .chouses{position:absolute;bottom:1px;right:1px;display:flex;gap:1px;align-items:center;}';
    html += '.spec-chouse-dot{display:inline-block;width:4px;height:4px;border-radius:1px;margin:0 .5px;background:#22c55e;box-shadow:0 0 3px rgba(34,197,94,.5);}';
    html += '.spec-chouse-hotel{display:inline-block;width:7px;height:6px;border-radius:1px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:4px;font-weight:900;text-align:center;line-height:6px;box-shadow:0 0 4px rgba(251,191,36,.6);}';
    html += '.spec-mono-cell-mortgaged{opacity:.45;}';
    html += '.spec-mono-cell-active{animation:spec-mnply-glow 1.5s ease-in-out infinite;transform:scale(1.04);z-index:2;}';
    html += '.spec-mono-cell-active .ctokens{font-size:14px;}';

    /* Center */
    html += '.spec-mono-center{background:linear-gradient(135deg, rgba(168,85,247,.08), rgba(59,130,246,.06));border:1px solid rgba(255,255,255,.08);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;text-align:center;overflow:hidden;}';
    html += '.spec-mono-center-logo{font-family:"Bricolage Grotesque",system-ui;font-size:10px;font-weight:900;color:#fbbf24;text-shadow:0 0 8px rgba(251,191,36,.25);margin-bottom:2px;letter-spacing:.3px;}';

    /* Dice — premium */
    html += '.spec-mono-dice-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:4px 10px;margin:4px 0;box-shadow:0 2px 8px rgba(0,0,0,.15);}';
    html += '.spec-mono-dice{font-size:32px;letter-spacing:8px;line-height:1.1;transition:transform .2s;}';
    html += '.spec-mono-dice-spinning{animation:spec-mnply-spin .2s ease-in-out infinite;}';
    html += '.spec-mono-dice-box-glow{box-shadow:0 0 16px rgba(168,85,247,.4), 0 2px 8px rgba(0,0,0,.15);border-color:rgba(168,85,247,.3);}';

    /* Messages */
    html += '.spec-mono-msg{font-family:"Bricolage Grotesque",system-ui;font-size:11px;font-weight:800;color:#fff;margin:3px 0;}';
    html += '.spec-mono-sub{font-size:9px;color:rgba(255,255,255,.55);margin:2px 0;max-width:220px;}';

    /* Card */
    html += '.spec-mono-card{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:5px 10px;font-size:9px;color:#fcd34d;margin:4px 0;max-width:220px;}';
    html += '.spec-mono-card-flip{animation:spec-mnply-card-in .4s ease-out;}';

    /* Cash wallets — premium */
    html += '.spec-mono-cash-row{display:flex;gap:6px;margin-top:4px;}';
    html += '.spec-mono-cash-box{padding:4px 8px;border-radius:8px;font-size:10px;font-weight:800;text-align:center;border:1px solid transparent;transition:all .3s;}';
    html += '.spec-mono-cash-green{background:linear-gradient(135deg, rgba(16,185,129,.15), rgba(16,185,129,.05));color:#34d399;border-color:rgba(16,185,129,.2);}';
    html += '.spec-mono-cash-red{background:linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.05));color:#f87171;border-color:rgba(239,68,68,.2);}';
    html += '.spec-mono-cash-flash-green{box-shadow:0 0 12px rgba(34,197,94,.5);border-color:rgba(34,197,94,.6);}';
    html += '.spec-mono-cash-flash-red{box-shadow:0 0 12px rgba(239,68,68,.5);border-color:rgba(239,68,68,.6);}';

    /* Property tags — premium */
    html += '.spec-mono-props{display:flex;gap:3px;flex-wrap:wrap;justify-content:center;margin:4px 0;}';
    html += '.spec-mono-prop-tag{font-size:7px;padding:2px 5px;border-radius:10px;font-weight:700;border:1px solid;display:inline-flex;align-items:center;gap:2px;}';
    html += '.spec-mono-prop-mortgaged{text-decoration:line-through;opacity:.5;}';
    html += '.spec-mono-prop-dots{display:inline-flex;gap:1px;margin-left:2px;}';
    html += '.spec-mono-prop-dot{display:inline-block;width:3px;height:3px;border-radius:1px;background:#22c55e;box-shadow:0 0 2px rgba(34,197,94,.5);}';
    html += '.spec-mono-prop-hotel{display:inline-block;width:5px;height:4px;border-radius:1px;background:linear-gradient(135deg,#fbbf24,#f59e0b);margin-left:2px;}';

    /* Net worth bar — premium */
    html += '.spec-mono-nw-wrap{margin-top:6px;padding:0 4px;}';
    html += '.spec-mono-nw-label{font-size:8px;color:rgba(255,255,255,.4);text-align:center;margin-bottom:2px;font-weight:700;}';
    html += '.spec-mono-nw-bar{display:flex;height:7px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.06);}';
    html += '.spec-mono-nw-green{background:linear-gradient(90deg, #10b981, #34d399);transition:width .6s;}';
    html += '.spec-mono-nw-red{background:linear-gradient(90deg, #f87171, #ef4444);transition:width .6s;}';
    html += '.spec-mono-nw-nums{display:flex;justify-content:space-between;font-size:7px;color:rgba(255,255,255,.45);margin-top:2px;}';

    /* Status */
    html += '.spec-mono-status{text-align:center;font-size:.65rem;color:rgba(255,255,255,.5);padding:4px;background:rgba(255,255,255,.03);border-radius:8px;margin-top:6px;border:1px solid rgba(255,255,255,.05);}';

    /* Endgame card */
    html += '.spec-mono-endgame{background:linear-gradient(135deg, rgba(168,85,247,.12), rgba(59,130,246,.08));border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;margin:6px auto;max-width:320px;text-align:center;}';
    html += '.spec-mono-endgame h3{font-family:"Bricolage Grotesque",system-ui;font-size:16px;font-weight:900;margin:0 0 8px 0;}';
    html += '.spec-mono-endgame-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:9px;text-align:left;margin:8px 0;}';
    html += '.spec-mono-endgame-row{display:flex;justify-content:space-between;}';
    html += '.spec-mono-endgame-lbl{color:rgba(255,255,255,.5);}';
    html += '.spec-mono-endgame-val{font-weight:800;}';

    /* Keyframes */
    html += '@keyframes spec-mnply-glow{0%,100%{box-shadow:0 0 4px rgba(168,85,247,.3)}50%{box-shadow:0 0 12px rgba(168,85,247,.6)}}';
    html += '@keyframes spec-mnply-spin{0%{transform:rotate(-3deg) scale(1.1)}25%{transform:rotate(3deg) scale(1.05)}50%{transform:rotate(-2deg) scale(1.1)}75%{transform:rotate(2deg) scale(1.05)}100%{transform:rotate(0) scale(1)}}';
    html += '@keyframes spec-mnply-card-in{0%{transform:rotateX(90deg);opacity:0}100%{transform:rotateX(0);opacity:1}}';
    html += '@keyframes spec-mnply-bounce{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}';
    html += '@keyframes spec-mnply-confetti{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-30px) scale(1.5)}}';
    html += '@keyframes spec-mnply-breathe{0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06)}50%{box-shadow:0 4px 24px rgba(0,0,0,.3), 0 0 20px rgba(168,85,247,.08), 0 0 0 1px rgba(255,255,255,.08)}}';
    html += '</style>';

    /* ── Endgame display ── */
    if(gameEnded && gameSubMsg === '__endgame__'){
      var ed = window._specMnplyEndData;
      html += '<div class="spec-mono-endgame">';
      html += '<div style="font-size:24px;animation:spec-mnply-confetti 2s ease-out forwards;">🎉🏆🎉</div>';
      html += '<h3 style="color:'+(ed.winner===0?'#34d399':'#f87171')+';">'+players[ed.winner].avatar+' '+escHtml(players[ed.winner].name)+' Wins!</h3>';
      html += '<div class="spec-mono-endgame-grid">';
      html += '<div><div class="spec-mono-endgame-lbl">'+players[0].avatar+' '+escHtml(players[0].name)+'</div></div>';
      html += '<div><div class="spec-mono-endgame-lbl">'+players[1].avatar+' '+escHtml(players[1].name)+'</div></div>';

      html += '<div class="spec-mono-endgame-row"><span class="spec-mono-endgame-lbl">Cash</span><span class="spec-mono-endgame-val" style="color:#34d399;">A₦'+Math.max(0,ed.cash0).toLocaleString()+'</span></div>';
      html += '<div class="spec-mono-endgame-row"><span class="spec-mono-endgame-lbl">Cash</span><span class="spec-mono-endgame-val" style="color:#f87171;">A₦'+Math.max(0,ed.cash1).toLocaleString()+'</span></div>';

      html += '<div class="spec-mono-endgame-row"><span class="spec-mono-endgame-lbl">Properties</span><span class="spec-mono-endgame-val" style="color:#34d399;">'+ed.props0+' (A₦'+ed.propVal0.toLocaleString()+')</span></div>';
      html += '<div class="spec-mono-endgame-row"><span class="spec-mono-endgame-lbl">Properties</span><span class="spec-mono-endgame-val" style="color:#f87171;">'+ed.props1+' (A₦'+ed.propVal1.toLocaleString()+')</span></div>';

      html += '<div class="spec-mono-endgame-row"><span class="spec-mono-endgame-lbl">Houses</span><span class="spec-mono-endgame-val" style="color:#34d399;">🏠 x'+ed.houses0+'</span></div>';
      html += '<div class="spec-mono-endgame-row"><span class="spec-mono-endgame-lbl">Houses</span><span class="spec-mono-endgame-val" style="color:#f87171;">🏠 x'+ed.houses1+'</span></div>';

      html += '<div class="spec-mono-endgame-row" style="border-top:1px solid rgba(255,255,255,.1);padding-top:4px;margin-top:2px;"><span class="spec-mono-endgame-lbl"><b>Net Worth</b></span><span class="spec-mono-endgame-val" style="color:#34d399;">A₦'+ed.nw0.toLocaleString()+'</span></div>';
      html += '<div class="spec-mono-endgame-row" style="border-top:1px solid rgba(255,255,255,.1);padding-top:4px;margin-top:2px;"><span class="spec-mono-endgame-lbl"><b>Net Worth</b></span><span class="spec-mono-endgame-val" style="color:#f87171;">A₦'+ed.nw1.toLocaleString()+'</span></div>';

      html += '</div>';
      html += '<div style="font-size:9px;color:rgba(255,255,255,.35);margin-top:6px;">Game Over — '+turnCount+' turns played</div>';
      html += '</div>';
      boardEl.innerHTML = html + '<div class="ar-cheer-layer" id="specCheerLayer"></div>';
      return;
    }

    /* ── Title bar ── */
    html += '<div class="spec-mono-wrap">';
    html += '<div class="spec-mono-title">🏦 Nigerian Monopoly — Live Spectating</div>';

    /* ── Turn progress bar ── */
    var turnPct = Math.min(Math.round(((turnCount + 1) / MAX_TURNS) * 100), 100);
    html += '<div class="spec-mono-turn-wrap">';
    html += '<div class="spec-mono-turn-label">Turn '+Math.min(turnCount+1, MAX_TURNS)+'/'+MAX_TURNS+' · Pot: A₦'+potMoney.toLocaleString()+'</div>';
    html += '<div class="spec-mono-turn-bar"><div class="spec-mono-turn-fill" style="width:'+turnPct+'%;"></div></div>';
    html += '</div>';

    /* ── Board grid ── */
    html += '<div class="spec-mono-board">';

    SPEC_GRID_MAP.forEach(function(g){
      var posIdx = g.pos;
      var sp = SPEC_SPACES[posIdx];
      var cssRow = g.row + 1;
      var cssCol = g.col + 1;
      var isCorner = (posIdx===0||posIdx===8||posIdx===16||posIdx===24);
      var p0Here = players[0].pos===posIdx;
      var p1Here = players[1].pos===posIdx;
      var hasPlayer = p0Here || p1Here;
      var isMortgagedCell = mortgaged[posIdx];
      var cellClasses = 'spec-mono-cell';
      if(isCorner) cellClasses += ' spec-mono-cell-corner';
      if(hasPlayer) cellClasses += ' spec-mono-cell-active';
      if(isMortgagedCell) cellClasses += ' spec-mono-cell-mortgaged';

      var bg = cellGradient(sp);
      html += '<div class="'+cellClasses+'" style="grid-row:'+cssRow+';grid-column:'+cssCol+';background:'+bg+';">';

      /* Color strip */
      if(sp.color && sp.type==='property') html += '<div class="cstrip" style="background:'+sp.color+';"></div>';

      /* Owner border */
      var ow = ownerOf(posIdx);
      if(ow!==-1) html += '<div class="cowner-border" style="border:2px solid '+players[ow].color+'44;"></div>';

      /* Emoji */
      html += '<div class="cemoji">'+sp.emoji+'</div>';
      /* Name */
      html += '<div class="cname">'+abbreviate(sp.name)+'</div>';
      /* Price */
      if(sp.cost) html += '<div class="cprice">A₦'+sp.cost+'</div>';

      /* Houses indicator (colored dots or hotel) */
      var houseCount = houses[posIdx] || 0;
      if(houseCount > 0){
        html += '<div class="chouses">';
        if(houseCount === 4){
          html += '<span class="spec-chouse-hotel">H</span>';
        } else {
          for(var hi=0;hi<houseCount;hi++){
            html += '<span class="spec-chouse-dot"></span>';
          }
        }
        html += '</div>';
      }

      /* Player tokens (dark pill background) */
      if(hasPlayer){
        html += '<div class="ctokens">';
        if(p0Here) html += '<span>'+players[0].token+'</span>';
        if(p1Here) html += '<span>'+players[1].token+'</span>';
        html += '</div>';
      }

      html += '</div>';
    });

    /* Center area (inner 7×7 in 9×9 grid) */
    html += '<div class="spec-mono-center" style="grid-row:2/9;grid-column:2/9;">';

    /* Logo */
    html += '<div class="spec-mono-center-logo">🏦 NAIJA MONOPOLY</div>';

    /* Dice — premium with animation */
    var diceBoxClass = 'spec-mono-dice-box';
    if(diceSpinning) diceBoxClass += ' spec-mono-dice-box-glow';
    html += '<div class="'+diceBoxClass+'">';
    var diceClass = 'spec-mono-dice';
    if(diceSpinning) diceClass += ' spec-mono-dice-spinning';
    html += '<div class="'+diceClass+'" id="spec-mnply-dice-display">'+DICE_FACES[dice[0]-1]+' '+DICE_FACES[dice[1]-1]+'</div>';
    html += '</div>';

    /* Message */
    html += '<div class="spec-mono-msg">'+gameMessage+'</div>';
    if(gameSubMsg && gameSubMsg !== '__endgame__') html += '<div class="spec-mono-sub">'+gameSubMsg+'</div>';

    /* Card message */
    if(cardMessage){
      html += '<div class="spec-mono-card'+(cardFlipIn?' spec-mono-card-flip':'')+'">'+cardMessage+'</div>';
    }

    /* Cash display — premium wallets */
    html += '<div class="spec-mono-cash-row">';
    var cashClass0 = 'spec-mono-cash-box spec-mono-cash-green';
    if(cashFlash0 === 'green') cashClass0 += ' spec-mono-cash-flash-green';
    if(cashFlash0 === 'red') cashClass0 += ' spec-mono-cash-flash-red';
    var cashClass1 = 'spec-mono-cash-box spec-mono-cash-red';
    if(cashFlash1 === 'green') cashClass1 += ' spec-mono-cash-flash-green';
    if(cashFlash1 === 'red') cashClass1 += ' spec-mono-cash-flash-red';
    html += '<div class="'+cashClass0+'">💰 A₦'+players[0].cash.toLocaleString()+'</div>';
    html += '<div class="'+cashClass1+'">💰 A₦'+players[1].cash.toLocaleString()+'</div>';
    html += '</div>';

    html += '</div>'; /* end center */
    html += '</div>'; /* end board */

    /* ── Property lists ── */
    html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px;">';
    for(var pi=0;pi<2;pi++){
      var p = players[pi];
      html += '<div style="flex:1;min-width:130px;max-width:200px;">';
      html += '<div style="font-size:8px;font-weight:800;color:'+(pi===0?'#34d399':'#f87171')+';text-align:center;margin-bottom:2px;">'+p.avatar+' '+escHtml(p.name)+'</div>';
      html += '<div class="spec-mono-props">';
      if(p.props.length===0) html += '<span style="font-size:7px;color:rgba(255,255,255,.3);">None yet</span>';
      p.props.forEach(function(id){
        var s = SPEC_SPACES[id];
        var isMort = mortgaged[id];
        var hc = houses[id] || 0;
        var tagClass = 'spec-mono-prop-tag' + (isMort ? ' spec-mono-prop-mortgaged' : '');
        var houseDots = '';
        if(hc > 0){
          houseDots = '<span class="spec-mono-prop-dots">';
          if(hc === 4){
            houseDots += '<span class="spec-mono-prop-hotel"></span>';
          } else {
            for(var hi=0;hi<hc;hi++) houseDots += '<span class="spec-mono-prop-dot"></span>';
          }
          houseDots += '</span>';
        }
        html += '<span class="'+tagClass+'" style="color:'+(s.color||'#fff')+';border-color:'+(s.color||'rgba(255,255,255,.2)')+';background:'+(s.color||'rgba(255,255,255,.1)')+'22;">'+s.emoji+' '+abbreviate(s.name)+houseDots+'</span>';
      });
      html += '</div></div>';
    }
    html += '</div>';

    /* ── Net worth bar — premium ── */
    var nw0 = netWorth(players[0]);
    var nw1 = netWorth(players[1]);
    var totalNW = Math.max(nw0+nw1, 1);
    var pct0 = Math.round((nw0/totalNW)*100);
    var pct1 = 100 - pct0;
    html += '<div class="spec-mono-nw-wrap">';
    html += '<div class="spec-mono-nw-label">NET WORTH</div>';
    html += '<div class="spec-mono-nw-bar">';
    html += '<div class="spec-mono-nw-green" style="width:'+pct0+'%;"></div>';
    html += '<div class="spec-mono-nw-red" style="width:'+pct1+'%;"></div>';
    html += '</div>';
    html += '<div class="spec-mono-nw-nums">';
    html += '<span>'+players[0].avatar+' A₦'+nw0.toLocaleString()+' ('+pct0+'%)</span>';
    html += '<span>'+players[1].avatar+' A₦'+nw1.toLocaleString()+' ('+pct1+'%)</span>';
    html += '</div>';
    html += '</div>';

    /* Status */
    html += '<div class="spec-mono-status">';
    if(gameEnded) html += '🏆 Game Over!';
    else if(diceSpinning) html += '🎲 Rolling dice...';
    else html += '🟢 Live — watching turn-by-turn';
    html += '</div>';

    html += '</div>'; /* end wrapper */

    boardEl.innerHTML = html + '<div class="ar-cheer-layer" id="specCheerLayer"></div>';
  }

  /* Start */
  this.start = function(){
    renderBoard();
    /* First move after a small delay */
    turnIv = setTimeout(function(){
      pushFeed('🎲 '+players[0].avatar+' '+players[0].name+' goes first!', 'sys');
      doTurn(0);
    }, 1500);
  };

  this.destroy = function(){
    destroyed = true;
    if(turnIv) clearTimeout(turnIv);
  };
}


/* ───────────────────────────────────────────────────────────────
   PATCH openSpectator for board-game support
   ─────────────────────────────────────────────────────────────── */

/* Save reference to original openSpectator */
var _origOpenSpectator = window.openSpectator || null;

/* The enhanced spectator — builds the same modal shell, but
   replaces the board area with a custom game renderer for
   chess and monopoly, and uses the original for everything else. */
function openBoardSpectator(room){
  var isBoardGame = (room.gameId === 'african-tycoon' || room.gameId === 'arena-chess');
  if(!isBoardGame){
    /* Fall through to original quiz-based spectator */
    if(_origOpenSpectator) return _origOpenSpectator(room);
    return;
  }

  /* ── Build modal with premium sidebar styling ── */
  var modal = document.createElement('div');
  modal.className = 'ar-spec-modal';
  modal.innerHTML = ''
    /* Premium sidebar style overrides */
    + '<style>'
    + '.ar-spec-side{background:#0b1222;border-left:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;overflow:hidden;min-height:0;}'
    + '.sp-side-hdr{padding:14px 16px;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.1));border-bottom:1px solid rgba(255,255,255,.1);font-weight:900;font-size:.88rem;display:flex;align-items:center;gap:8px;font-family:"Bricolage Grotesque",system-ui;color:#e0e7ff;letter-spacing:.3px;flex-shrink:0;}'
    + '.sp-side-hdr .ar-live-dot{width:10px;height:10px;}'
    /* Watchers section */
    + '.sp-watchers{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(99,102,241,.06),transparent);overflow-x:auto;white-space:nowrap;scrollbar-width:none;flex-shrink:0;}'
    + '.sp-watchers::-webkit-scrollbar{display:none;}'
    + '.sp-watchers-label{font-size:.72rem;font-weight:800;color:#a5b4fc;letter-spacing:.5px;text-transform:uppercase;margin-right:4px;display:flex;align-items:center;gap:4px;flex-shrink:0;}'
    + '.sp-watchers-count{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:2px 8px;border-radius:100px;font-size:.65rem;font-weight:900;margin-left:2px;}'
    + '.sp-watcher-chip{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.03));border:2px solid rgba(255,255,255,.12);display:inline-flex;align-items:center;justify-content:center;font-size:.82rem;flex-shrink:0;transition:all .2s;cursor:default;position:relative;}'
    + '.sp-watcher-chip:hover{transform:scale(1.15);border-color:rgba(167,139,250,.5);box-shadow:0 0 10px rgba(167,139,250,.3);}'
    + '.sp-watcher-chip.sp-me{border-color:#3b82f6;background:linear-gradient(135deg,rgba(59,130,246,.25),rgba(59,130,246,.08));box-shadow:0 0 8px rgba(59,130,246,.25);}'
    + '.sp-watcher-stack{display:flex;align-items:center;margin-left:-4px;}'
    + '.sp-watcher-stack .sp-watcher-chip{margin-left:-6px;}'
    + '.sp-watcher-stack .sp-watcher-chip:first-child{margin-left:0;}'
    + '.sp-watcher-more{font-size:.68rem;font-weight:800;color:rgba(255,255,255,.5);margin-left:6px;flex-shrink:0;}'
    /* Feed area */
    + '.sp-feed{flex:1;min-height:0;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;font-size:.82rem;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}'
    + '.sp-feed::-webkit-scrollbar{width:4px;}'
    + '.sp-feed::-webkit-scrollbar-track{background:transparent;}'
    + '.sp-feed::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px;}'
    + '.sp-feed-msg{padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);line-height:1.45;animation:spFeedIn .3s ease-out;color:rgba(255,255,255,.8);position:relative;}'
    + '.sp-feed-msg b{color:#93c5fd;font-weight:800;}'
    + '.sp-feed-msg.right{background:linear-gradient(135deg,rgba(16,185,129,.14),rgba(16,185,129,.06));border-color:rgba(16,185,129,.25);color:#a7f3d0;}'
    + '.sp-feed-msg.right b{color:#6ee7b7;}'
    + '.sp-feed-msg.wrong{background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.04));border-color:rgba(239,68,68,.22);color:#fecaca;}'
    + '.sp-feed-msg.wrong b{color:#fca5a5;}'
    + '.sp-feed-msg.sys{background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.05));border-color:rgba(99,102,241,.2);color:#c7d2fe;font-size:.74rem;text-align:center;font-weight:600;}'
    + '.sp-feed-msg.viewer-msg{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.05);}'
    + '.sp-feed-msg.viewer-msg b{color:#fcd34d;}'
    + '.sp-feed-msg.my-msg{background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(59,130,246,.04));border-color:rgba(59,130,246,.2);}'
    + '.sp-feed-msg.my-msg b{color:#fcd34d;}'
    + '@keyframes spFeedIn{0%{opacity:0;transform:translateY(8px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}'
    /* Quick reaction buttons */
    + '.sp-quick{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px 10px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;}'
    + '.sp-quick-btn{background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));color:#fff;border:1px solid rgba(255,255,255,.1);padding:6px 12px;border-radius:100px;font-size:.78rem;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:4px;font-weight:600;}'
    + '.sp-quick-btn:hover{background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(99,102,241,.12));border-color:rgba(167,139,250,.4);transform:scale(1.05);box-shadow:0 2px 10px rgba(167,139,250,.2);}'
    + '.sp-quick-btn:active{transform:scale(.95);}'
    /* Chat bar */
    + '.sp-chat{border-top:1px solid rgba(255,255,255,.08);padding:10px 12px;display:flex;gap:8px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.15));flex-shrink:0;}'
    + '.sp-chat input{flex:1;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:10px 14px;font-size:.82rem;font-family:inherit;transition:all .2s;}'
    + '.sp-chat input:focus{outline:none;border-color:rgba(99,102,241,.5);box-shadow:0 0 12px rgba(99,102,241,.15);background:rgba(255,255,255,.08);}'
    + '.sp-chat input::placeholder{color:rgba(255,255,255,.3);}'
    + '.sp-chat-send{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;padding:10px 18px;border-radius:100px;font-weight:800;font-size:.8rem;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(99,102,241,.25);}'
    + '.sp-chat-send:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(99,102,241,.4);}'
    + '.sp-chat-send:active{transform:scale(.95);}'
    + '</style>'
    + '<div class="ar-spec-wrap">'
    +   '<div class="ar-spec-stage">'
    +     '<div class="ar-spec-top">'
    +       '<div class="ar-spec-title"><span class="ar-live-badge"><span class="ar-live-dot"></span> Live</span> '+room.gameEmoji+' '+room.gameName+'</div>'
    +       '<div class="ar-spec-meta">'
    +         '<span class="ar-vbadge">👁 <b id="specViewers">'+room.viewers+'</b></span>'
    +         '<span class="ar-vbadge">⏱ <b id="specClock">'+Math.floor(room.startedSecAgo)+'</b>s</span>'
    +         '<span class="ar-vbadge">🎁 A₦'+room.prize.toLocaleString()+'</span>'
    +         '<button class="ar-spec-x" id="specClose">Close</button>'
    +       '</div>'
    +     '</div>'
    +     '<div class="ar-fair">🛡️ <b>Fair-play mode:</b> Watch the '+(room.gameId==='arena-chess'?'chess board':'Monopoly board')+' live. Game hints & strategy messages are blocked to prevent cheating.</div>'
    +     '<div class="ar-spec-board" id="specBoard" style="position:relative"><div class="ar-cheer-layer" id="specCheerLayer"></div></div>'
    +   '</div>'
    +   '<aside class="ar-spec-side">'
    +     '<div class="sp-side-hdr"><span class="ar-live-dot"></span>Play-by-play & Cheer</div>'
    +     '<div class="sp-watchers" id="specWatchers"></div>'
    +     '<div class="sp-feed" id="specFeed"></div>'
    +     '<div class="sp-quick">'
    +       '<button class="sp-quick-btn" onclick="window._arSpecChat(\'🔥\')">🔥 Fire</button>'
    +       '<button class="sp-quick-btn" onclick="window._arSpecChat(\'👏\')">👏 Clap</button>'
    +       '<button class="sp-quick-btn" onclick="window._arSpecChat(\'GG!\')">🏆 GG!</button>'
    +       '<button class="sp-quick-btn" onclick="window._arSpecChat(\'You got this!\')">💪 You got this!</button>'
    +       '<button class="sp-quick-btn" onclick="window._arSpecChat(\'😂\')">😂 Lol</button>'
    +       '<button class="sp-quick-btn" onclick="window._arSpecChat(\'🎯\')">🎯 Nice</button>'
    +     '</div>'
    +     '<div class="sp-chat">'
    +       '<input id="specChatIn" placeholder="Send a message…" maxlength="80" />'
    +       '<button class="sp-chat-send" onclick="window._arSpecChat()">Send</button>'
    +     '</div>'
    +   '</aside>'
    + '</div>';
  document.body.appendChild(modal);

  /* ── Profile & watchers (same as original) ── */
  var me = (typeof getProfile === 'function') ? getProfile() : {name:'You',avatar:'🦁'};
  var watchers = [];
  for(var w=0;w<Math.min(8,Math.max(2,Math.floor(room.viewers/14)));w++){
    watchers.push({name:(typeof botName==='function'?botName():'Watcher '+(w+1)), avatar:(typeof botAvatar==='function'?botAvatar():'😊')});
  }
  function renderWatchers(){
    var el = document.getElementById('specWatchers'); if(!el) return;
    var totalCount = 1 + watchers.length; /* me + watchers */
    el.innerHTML = ''
      + '<span class="sp-watchers-label">👁 Watching <span class="sp-watchers-count">' + totalCount + '</span></span>'
      + '<div class="sp-watcher-stack">'
      + '<span class="sp-watcher-chip sp-me" title="'+me.name+' (you)">'+me.avatar+'</span>'
      + watchers.slice(0,9).map(function(w){ return '<span class="sp-watcher-chip" title="'+w.name+'">'+w.avatar+'</span>'; }).join('')
      + '</div>'
      + (watchers.length>9?'<span class="sp-watcher-more">+' + (watchers.length-9) + ' more</span>':'');
  }
  renderWatchers();

  /* Floating cheers */
  function flyCheer(emoji){
    var layer = document.getElementById('specCheerLayer'); if(!layer) return;
    var n = document.createElement('div');
    n.className = 'ar-cheer';
    n.textContent = emoji;
    n.style.left = (5+Math.random()*90)+'%';
    n.style.fontSize = (1.3+Math.random()*1.2)+'rem';
    layer.appendChild(n);
    setTimeout(function(){ if(n.parentNode) n.parentNode.removeChild(n); }, 2500);
  }

  /* Feed */
  var feed = document.getElementById('specFeed');
  function pushFeed(html, cls){
    var div = document.createElement('div');
    div.className = 'sp-feed-msg'+(cls?' '+cls:'');
    div.innerHTML = html;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
    while(feed.children.length > 80) feed.removeChild(feed.firstChild);
  }
  pushFeed('You\'re now spectating this live match. Cheer them on! 🎉', 'sys');
  pushFeed('<b>Match:</b> '+room.gameName+' · prize A₦'+room.prize.toLocaleString()+' 🎁', 'sys');

  /* ── Create the board game spectator ── */
  var boardEl = document.getElementById('specBoard');
  var gameSpec;
  if(room.gameId === 'arena-chess'){
    gameSpec = new ChessSpectator(boardEl, pushFeed, flyCheer);
    gameSpec.setPlayers(room.players || []);
    pushFeed('♟️ Chess match in progress — watching move by move!', 'sys');
    gameSpec.start();
  } else {
    gameSpec = new MonopolySpectator(boardEl, pushFeed, flyCheer);
    gameSpec.setPlayers(room.players || []);
    pushFeed('🎲 Nigerian Monopoly in progress — watching turn by turn!', 'sys');
    gameSpec.start();
  }

  /* ── Viewer churn + bot chats (same as original) ── */
  var clockEl = document.getElementById('specClock');
  var viewEl = document.getElementById('specViewers');
  var clock = Math.floor(room.startedSecAgo);
  var views = room.viewers;
  var EMO = ['🔥','💯','😅','😎','🤯','👏','😂','🙌','🎯'];
  var BOT_CHATS = room.gameId==='arena-chess'
    ? ['Great opening!','That knight move was smart','Bishop is in danger!','Pawn storm incoming','Who\'s winning?','Checkmate soon?','GG!','This is intense!','I love watching chess','That was unexpected!']
    : ['Roll high!','Buy everything!','That rent is crazy!','Banana Island is the dream','EFCC Office no dey play!','Monopoly is life','Lekki Gardens looking sweet!','That pot money though','Dice gods be kind!','This is so fun to watch','Ikoyi Crescent is expensive!','Keke NAPEP vibes!'];

  function tick(){
    if(!document.body.contains(modal)) return;
    clock++;
    if(clockEl) clockEl.textContent = clock;
    views += (Math.random()<0.7?1:0) - (Math.random()<0.2?1:0);
    if(views<0) views=0;
    if(viewEl) viewEl.textContent = views;
    /* Bot chat */
    if(Math.random()<0.22){
      var who = typeof botName==='function'?botName():'Viewer';
      var av = typeof botAvatar==='function'?botAvatar():'😊';
      pushFeed('<b>'+av+' '+who+':</b> '+BOT_CHATS[Math.floor(Math.random()*BOT_CHATS.length)], 'viewer-msg');
      if(Math.random()<0.5) flyCheer(EMO[Math.floor(Math.random()*EMO.length)]);
    }
    /* New watcher joining */
    if(Math.random()<0.15){
      watchers.push({name:(typeof botName==='function'?botName():'Viewer'), avatar:(typeof botAvatar==='function'?botAvatar():'😊')});
      renderWatchers();
    }
    setTimeout(tick, 1200+Math.random()*1100);
  }
  setTimeout(tick, 600);

  /* ── Anti-cheat filter ── */
  /* Block messages that could help players cheat — property names,
     game commands, strategy hints. Only safe cheering allowed. */
  var CHEAT_WORDS = [
    'buy','sell','pass','skip','don\'t buy','dont buy','do not buy',
    'mortgage','build','house','roll','rent','jail','pay',
    /* Property names (lowercase) — 32-space board */
    'aba','onitsha','brt','enugu','nepa','ibadan','kano','abuja',
    'maitama','dangote','port harcourt','calabar','victoria','banana',
    'abeokuta','lekki','ikoyi','keke','napep','lagos-ibadan','airport',
    /* Chess hints */
    'queen','king','bishop','knight','rook','pawn',
    'castle','check','mate','fork','pin','capture','take','move',
    'e4','d4','e5','d5','nf3','nc6','bb5','bc4'
  ];
  function isCheating(text){
    var lower = text.toLowerCase();
    for(var i=0;i<CHEAT_WORDS.length;i++){
      if(lower.indexOf(CHEAT_WORDS[i]) !== -1) return true;
    }
    return false;
  }

  /* ── Chat with anti-cheat ── */
  window._arSpecChat = function(canned){
    var input = document.getElementById('specChatIn');
    var msg = canned || (input ? input.value.trim() : '');
    if(!msg) return;
    var raw = msg.replace(/[<>]/g,'');

    /* Anti-cheat: block game hints (canned reactions are always safe) */
    if(!canned && isCheating(raw)){
      pushFeed('🛡️ <b>Anti-cheat:</b> Your message was blocked — spectators cannot send game hints or strategy advice to players.', 'sys');
      if(input) input.value = '';
      return;
    }

    var f = (window.SocialDB && SocialDB.filter) ? SocialDB.filter(raw) : {clean:raw, hits:[]};
    var clean = f.clean;
    pushFeed('<b style="color:#fcd34d">'+me.avatar+' '+me.name+' (you):</b> '+clean, 'my-msg');
    if(f.hits.length) pushFeed('⚠️ Personal info auto-removed from your message', 'sys');
    var firstChar = Array.from(clean)[0] || '';
    if(/[\p{Emoji}]/u.test(firstChar)) flyCheer(firstChar);
    if(input && !canned) input.value = '';
  };
  var chatIn = document.getElementById('specChatIn');
  if(chatIn) chatIn.addEventListener('keydown', function(e){ if(e.key==='Enter') window._arSpecChat(); });

  /* ── Close ── */
  function closeSpec(){
    if(gameSpec) gameSpec.destroy();
    if(document.body.contains(modal)) document.body.removeChild(modal);
    window._arSpecChat = null;
    document.removeEventListener('keydown', escKey);
  }
  function escKey(e){ if(e.key==='Escape') closeSpec(); }
  document.getElementById('specClose').onclick = closeSpec;
  document.addEventListener('keydown', escKey);
}

/* Replace global openSpectator */
window.openSpectator = openBoardSpectator;

/* Also patch ArenaUI.spectate if it exists */
if(window.ArenaUI && window.ArenaUI.spectate){
  window.ArenaUI.spectate = function(room){
    openBoardSpectator(room);
  };
}

})();
