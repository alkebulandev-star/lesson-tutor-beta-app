/* ════════════════════════════════════════════════════════════════
   ARENA MONOPOLY 2 — Nigerian Monopoly Board Game (v2 Premium)
   ────────────────────────────────────────────────────────────────
   Full Monopoly-style board game with 32 spaces (9×9 grid),
   2 players (Human vs AI), tap-to-stop dice, property trading,
   houses/hotels, mortgages, Chance & Community cards — all themed
   around Nigerian landmarks. Currency: Arena Naira (A₦).
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ───────────── CONSTANTS ───────────── */
var NUM_SPACES = 32;
var DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

/* ───────────── BOARD SPACES (32) ───────────── */
var SPACES = [
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

/* ── Color groups ── */
var COLOR_GROUPS = {
  brown:     [1, 3],
  lightblue: [6, 9, 11],
  pink:      [13, 15],
  orange:    [17, 20],
  red:       [22, 25],
  green:     [27, 29],
  blue:      [31],
  utility:   [10, 19],
  transport: [5, 14, 21, 30]
};

/* ── Grid position mapping (9×9 grid, outer ring = 32 spaces) ── */
var GRID_MAP = [
  /* Bottom row (row 8): pos 0 at col 8, pos 1 at col 7, ... pos 8 at col 0 */
  {pos:0,  row:8, col:8},
  {pos:1,  row:8, col:7},
  {pos:2,  row:8, col:6},
  {pos:3,  row:8, col:5},
  {pos:4,  row:8, col:4},
  {pos:5,  row:8, col:3},
  {pos:6,  row:8, col:2},
  {pos:7,  row:8, col:1},
  {pos:8,  row:8, col:0},
  /* Left column (col 0): pos 9 at row 7, ... pos 15 at row 1 */
  {pos:9,  row:7, col:0},
  {pos:10, row:6, col:0},
  {pos:11, row:5, col:0},
  {pos:12, row:4, col:0},
  {pos:13, row:3, col:0},
  {pos:14, row:2, col:0},
  {pos:15, row:1, col:0},
  /* Top row (row 0): pos 16 at col 0, pos 17 at col 1, ... pos 24 at col 8 */
  {pos:16, row:0, col:0},
  {pos:17, row:0, col:1},
  {pos:18, row:0, col:2},
  {pos:19, row:0, col:3},
  {pos:20, row:0, col:4},
  {pos:21, row:0, col:5},
  {pos:22, row:0, col:6},
  {pos:23, row:0, col:7},
  {pos:24, row:0, col:8},
  /* Right column (col 8): pos 25 at row 1, ... pos 31 at row 7 */
  {pos:25, row:1, col:8},
  {pos:26, row:2, col:8},
  {pos:27, row:3, col:8},
  {pos:28, row:4, col:8},
  {pos:29, row:5, col:8},
  {pos:30, row:6, col:8},
  {pos:31, row:7, col:8}
];

/* ── Chance Cards ── */
var CHANCE_CARDS = [
  {text:'Oil prices surge! Advance to P.H. GRA', action:'move', dest:20},
  {text:'Diaspora remittance! Collect A₦1,000', action:'gain', amount:1000},
  {text:'Traffic jam on Third Mainland Bridge! Go back 3 spaces', action:'back', steps:3},
  {text:'Government contract! Collect A₦500', action:'gain', amount:500},
  {text:'Generator fuel price up! Pay A₦300', action:'lose', amount:300},
  {text:'EFCC summons! Report to EFCC Office', action:'jail'},
  {text:'Your TikTok went viral! Collect A₦200 from each player', action:'collect_each', amount:200},
  {text:'Advance to GO — collect A₦2,000', action:'go'},
  {text:'Building permit approved! Collect A₦400', action:'gain', amount:400},
  {text:'Bank alert! Collect A₦800', action:'gain', amount:800},
  {text:'Jollof rice business booming! Collect A₦600', action:'gain', amount:600},
  {text:'Danfo bus broke down! Pay A₦250 for repairs', action:'lose', amount:250}
];

/* ── Community Cards ── */
var COMMUNITY_CARDS = [
  {text:'Community contribution: collect A₦500', action:'gain', amount:500},
  {text:'School fees due: pay A₦400', action:'lose', amount:400},
  {text:'Aso-ebi request: pay A₦200', action:'lose', amount:200},
  {text:'Cooperative savings mature: collect A₦1,000', action:'gain', amount:1000},
  {text:'Community levy: pay A₦300', action:'lose', amount:300},
  {text:'Wedding gift from uncle: collect A₦600', action:'gain', amount:600},
  {text:'NEPA bill overcharge refund: collect A₦250', action:'gain', amount:250},
  {text:'Birthday! Collect A₦100 from each player', action:'collect_each', amount:100},
  {text:'Road repairs tax: pay A₦500', action:'lose', amount:500},
  {text:'Susu savings bonus: collect A₦350', action:'gain', amount:350},
  {text:'Church harvest donation: pay A₦150', action:'lose', amount:150},
  {text:'Owambe party profit! Collect A₦450', action:'gain', amount:450}
];

/* ───────────── SHUFFLE UTILITY ───────────── */
function shuffleArr(a){
  a = a.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ── Cell gradient helper ── */
function cellGradient(space){
  switch(space.type){
    case 'go':       return 'linear-gradient(135deg, rgba(34,197,94,.22), rgba(16,185,129,.10))';
    case 'jail':     return 'linear-gradient(135deg, rgba(75,75,75,.30), rgba(239,68,68,.10))';
    case 'parking':  return 'linear-gradient(135deg, rgba(20,184,166,.20), rgba(6,182,212,.10))';
    case 'gotojail': return 'linear-gradient(135deg, rgba(239,68,68,.25), rgba(185,28,28,.12))';
    case 'chance':   return 'linear-gradient(135deg, rgba(245,158,11,.20), rgba(251,191,36,.10))';
    case 'community':return 'linear-gradient(135deg, rgba(59,130,246,.20), rgba(96,165,250,.10))';
    case 'tax':      return 'linear-gradient(135deg, rgba(168,85,247,.18), rgba(139,92,246,.08))';
    case 'property':
      if(space.color){
        return 'linear-gradient(135deg, ' + space.color + '30, ' + space.color + '10)';
      }
      return 'rgba(255,255,255,.06)';
    default:
      return 'rgba(255,255,255,.06)';
  }
}

/* ═══════════════════════════════════════════
   MAIN GAME FUNCTION
   ═══════════════════════════════════════════ */
window.playAfricanTycoon = function(ctx){
  return new Promise(function(resolve){
    var stage = ctx.stage;
    var grp = ctx.room ? ctx.room.classGroup : 'juniors';

    /* ── Game state ── */
    var MAX_TURNS = 36;
    var startCash = grp === 'kids' ? 25000 : 18000;
    var potMoney = 0;

    var players = [
      {name:'You', token:'🟢', pos:0, cash:startCash, props:[], inJail:false, jailTurns:0, color:'#10b981'},
      {name:'Bot', token:'🔴', pos:0, cash:startCash, props:[], inJail:false, jailTurns:0, color:'#ef4444'}
    ];
    var currentPlayer = 0;
    var turnCount = 0;
    var dice = [1, 1];
    var lastDiceTotal = 2;
    var gameMessage = 'Roll the dice to start!';
    var gameSubMsg = '';
    var cardMessage = null;
    var waitingForBuy = false;
    var waitingForRoll = true;
    var buyBtnLabel = 'Buy 🏠';
    var passBtnLabel = 'Pass ➡️';
    var gameEnded = false;
    var animating = false;
    var chanceDeck = shuffleArr(CHANCE_CARDS);
    var communityDeck = shuffleArr(COMMUNITY_CARDS);
    var chanceIdx = 0;
    var communityIdx = 0;

    /* ── Tap-to-stop dice state machine ── */
    var diceState = 'idle'; /* 'idle' | 'spinning' | 'stopping' | 'done' */
    var finalDiceResult = [1, 1];
    var spinIntervalId = null;

    /* ── Houses & Mortgages ── */
    var houses = {};
    var mortgaged = {};

    /* ── Visual feedback state ── */
    var cashFlash0 = '';
    var cashFlash1 = '';
    var cardFlipIn = false;

    /* ── Helpers ── */
    function rollDie(){ return Math.floor(Math.random() * 6) + 1; }

    function netWorth(p){
      var v = p.cash;
      p.props.forEach(function(id){
        if(!mortgaged[id]){
          v += SPACES[id].cost;
        } else {
          v += Math.round(SPACES[id].cost * 0.5);
        }
        v += (houses[id] || 0) * Math.round(SPACES[id].cost * 0.5);
      });
      return v;
    }

    function totalPropertyValue(p){
      var v = 0;
      p.props.forEach(function(id){
        v += SPACES[id].cost;
        v += (houses[id] || 0) * Math.round(SPACES[id].cost * 0.5);
      });
      return v;
    }

    function totalHouses(p){
      var h = 0;
      p.props.forEach(function(id){ h += (houses[id] || 0); });
      return h;
    }

    function ownsFullGroup(playerIdx, group){
      var needed = COLOR_GROUPS[group];
      if(!needed) return false;
      var p = players[playerIdx];
      for(var i = 0; i < needed.length; i++){
        if(p.props.indexOf(needed[i]) === -1) return false;
      }
      return true;
    }

    function ownerOf(spaceId){
      for(var i = 0; i < players.length; i++){
        if(players[i].props.indexOf(spaceId) !== -1) return i;
      }
      return -1;
    }

    function abbreviate(name){
      if(name.length <= 8) return name;
      var words = name.split(' ');
      if(words.length >= 2){
        return words[0].slice(0,4) + ' ' + words[1].slice(0,3);
      }
      return name.slice(0,8);
    }

    function nextChance(){
      var c = chanceDeck[chanceIdx % chanceDeck.length];
      chanceIdx++;
      return c;
    }

    function nextCommunity(){
      var c = communityDeck[communityIdx % communityDeck.length];
      communityIdx++;
      return c;
    }

    function isBankrupt(p){
      return p.cash < 0 && p.props.length === 0;
    }

    /* ── Count transports owned by a player ── */
    function countTransports(ownerIdx){
      var count = 0;
      var transports = COLOR_GROUPS.transport;
      var p = players[ownerIdx];
      for(var i = 0; i < transports.length; i++){
        if(p.props.indexOf(transports[i]) !== -1 && !mortgaged[transports[i]]) count++;
      }
      return count;
    }

    /* ── Transport rent scaling: rent = base × number owned ── */
    function calcTransportRent(ownerIdx, space){
      if(mortgaged[space.id]) return 0;
      var numOwned = countTransports(ownerIdx);
      return space.rent * Math.max(numOwned, 1);
    }

    /* ── Utility rent: both = dice×100, one = dice×40 ── */
    function calcUtilityRent(ownerIdx){
      var ownsBoth = (players[ownerIdx].props.indexOf(10) !== -1 && !mortgaged[10]) &&
                     (players[ownerIdx].props.indexOf(19) !== -1 && !mortgaged[19]);
      return ownsBoth ? lastDiceTotal * 100 : lastDiceTotal * 40;
    }

    /* ── Mortgage system ── */
    function autoMortgage(pIdx){
      var p = players[pIdx];
      while(p.cash < 0 && p.props.length > 0){
        var cheapestId = -1;
        var cheapestCost = Infinity;
        for(var i = 0; i < p.props.length; i++){
          var pid = p.props[i];
          if(!mortgaged[pid] && SPACES[pid].cost < cheapestCost){
            cheapestCost = SPACES[pid].cost;
            cheapestId = pid;
          }
        }
        if(cheapestId === -1) break;
        mortgaged[cheapestId] = true;
        var mortgageValue = Math.round(SPACES[cheapestId].cost * 0.5);
        p.cash += mortgageValue;
        gameSubMsg = (pIdx === 0 ? 'You' : 'Bot') + ' mortgaged ' + SPACES[cheapestId].name + ' for A₦' + mortgageValue.toLocaleString();
      }
    }

    /* ── Cash flash helpers ── */
    function flashCash(pIdx, color){
      if(pIdx === 0) cashFlash0 = color;
      else cashFlash1 = color;
      setTimeout(function(){
        if(pIdx === 0) cashFlash0 = '';
        else cashFlash1 = '';
        render();
      }, 600);
    }

    /* ── Dice display update (without full re-render) ── */
    function renderDiceOnly(){
      var el = document.getElementById('mnply-dice-display');
      if(el) el.innerHTML = DICE_FACES[dice[0]-1] + ' ' + DICE_FACES[dice[1]-1];
    }

    /* ── Tap-to-stop: start spinning ── */
    function startDiceSpin(){
      if(spinIntervalId) clearInterval(spinIntervalId);
      spinIntervalId = setInterval(function(){
        dice = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        renderDiceOnly();
      }, 60);
    }

    /* ── Tap-to-stop: decelerate and land ── */
    function stopDiceDecelerate(finalDice, cb){
      if(spinIntervalId){ clearInterval(spinIntervalId); spinIntervalId = null; }
      var delays = [100, 160, 240, 350, 500, 700];
      var frameIdx = 0;

      function nextFrame(){
        if(frameIdx >= delays.length){
          /* Final frame: land on predetermined result */
          dice = finalDice;
          renderDiceOnly();
          /* Add bounce class */
          var el = document.getElementById('mnply-dice-display');
          if(el) el.className = 'mnply-dice mnply-dice-bounce';
          setTimeout(function(){
            if(el) el.className = 'mnply-dice';
            cb();
          }, 400);
          return;
        }
        /* Show random face for this frame */
        if(frameIdx === delays.length - 1){
          dice = finalDice;
        } else {
          dice = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        }
        renderDiceOnly();
        frameIdx++;
        setTimeout(nextFrame, delays[frameIdx - 1]);
      }
      nextFrame();
    }

    /* ── Bot auto dice animation (old style, no tap-to-stop) ── */
    function animateDiceBot(finalDice, callback){
      var frames = 12;
      var delay = 70;
      var count = 0;
      animating = true;
      render();

      function tick(){
        count++;
        dice = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        if(count > 8) delay = 150;
        if(count > 10) delay = 220;
        if(count >= frames){
          dice = finalDice;
          animating = false;
          render();
          setTimeout(callback, 400);
          return;
        }
        renderDiceOnly();
        setTimeout(tick, delay);
      }
      tick();
    }

    /* ── End game ── */
    function endGame(){
      if(gameEnded) return;
      gameEnded = true;
      var nw0 = netWorth(players[0]);
      var nw1 = netWorth(players[1]);
      var iWon = nw0 > nw1;
      var propVal0 = totalPropertyValue(players[0]);
      var propVal1 = totalPropertyValue(players[1]);
      var h0 = totalHouses(players[0]);
      var h1 = totalHouses(players[1]);
      gameMessage = iWon ? '🎉🎉🎉 YOU WIN! 🎉🎉🎉' : '🔴 Bot Wins!';
      gameSubMsg = '__endgame__';

      window._mnplyEndData = {
        iWon: iWon,
        nw0: nw0, nw1: nw1,
        cash0: players[0].cash, cash1: players[1].cash,
        props0: players[0].props.length, props1: players[1].props.length,
        propVal0: propVal0, propVal1: propVal1,
        houses0: h0, houses1: h1
      };

      render();
      setTimeout(function(){
        resolve({
          score: Math.round(nw0 / 10),
          correct: players[0].props.length,
          total: turnCount,
          iWon: iWon
        });
      }, 3000);
    }

    /* ── Rent calculation with houses ── */
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

    /* ── Process landing on a space ── */
    function processLanding(pIdx, callback){
      var p = players[pIdx];
      var space = SPACES[p.pos];
      var opp = pIdx === 0 ? 1 : 0;
      cardMessage = null;
      cardFlipIn = false;

      switch(space.type){
        case 'go':
          gameSubMsg = 'Welcome to GO!';
          callback();
          break;

        case 'property':
          var owner = ownerOf(space.id);
          if(owner === -1){
            if(pIdx === 0){
              if(p.cash >= space.cost){
                waitingForBuy = true;
                buyBtnLabel = 'Buy A₦' + space.cost.toLocaleString() + ' 🏠';
                passBtnLabel = 'Pass ➡️';
                gameMessage = 'Buy ' + space.name + '?';
                gameSubMsg = 'Cost: A₦' + space.cost.toLocaleString() + ' | Rent: A₦' + space.rent;
                render();
                window._monopolyBuy = function(){
                  if(!waitingForBuy) return;
                  waitingForBuy = false;
                  p.cash -= space.cost;
                  p.props.push(space.id);
                  gameMessage = 'You bought ' + space.name + '!';
                  gameSubMsg = '';
                  flashCash(0, 'green');
                  callback();
                };
                window._monopolyPass = function(){
                  if(!waitingForBuy) return;
                  waitingForBuy = false;
                  gameMessage = 'You passed on ' + space.name;
                  gameSubMsg = '';
                  callback();
                };
                return;
              } else {
                gameSubMsg = 'Cannot afford ' + space.name + ' (A₦' + space.cost.toLocaleString() + ')';
                callback();
              }
            } else {
              if(p.cash > space.cost + 2000){
                p.cash -= space.cost;
                p.props.push(space.id);
                gameMessage = 'Bot bought ' + space.name;
              } else {
                gameMessage = 'Bot passed on ' + space.name;
              }
              gameSubMsg = '';
              callback();
            }
          } else if(owner === pIdx){
            if(space.group && space.group !== 'transport' && space.group !== 'utility' && ownsFullGroup(pIdx, space.group)){
              var houseCount = houses[space.id] || 0;
              if(houseCount < 4){
                var houseCost = Math.round(space.cost * 0.5);
                if(pIdx === 0 && p.cash >= houseCost){
                  waitingForBuy = true;
                  var isHotel = houseCount === 3;
                  buyBtnLabel = isHotel ? 'Build Hotel A₦' + houseCost.toLocaleString() + ' ⭐' : 'Build House A₦' + houseCost.toLocaleString() + ' 🏠';
                  passBtnLabel = 'Skip ➡️';
                  gameMessage = 'Build on ' + space.name + '?';
                  gameSubMsg = 'You have full ' + space.group + ' set! (' + houseCount + '/4 built)';
                  render();
                  window._monopolyBuy = function(){
                    if(!waitingForBuy) return;
                    waitingForBuy = false;
                    houses[space.id] = houseCount + 1;
                    p.cash -= houseCost;
                    var label = (houseCount + 1) === 4 ? 'hotel' : 'house';
                    gameMessage = 'Built ' + label + ' on ' + space.name + '! (' + (houseCount+1) + '/4)';
                    gameSubMsg = 'Rent is now A₦' + calcRent(space, pIdx).toLocaleString();
                    flashCash(0, 'green');
                    callback();
                  };
                  window._monopolyPass = function(){
                    if(!waitingForBuy) return;
                    waitingForBuy = false;
                    gameMessage = 'Your own property!';
                    gameSubMsg = '';
                    callback();
                  };
                  return;
                } else if(pIdx === 1 && p.cash > houseCost + 3000){
                  houses[space.id] = houseCount + 1;
                  p.cash -= houseCost;
                  gameMessage = 'Bot built on ' + space.name + '!';
                  gameSubMsg = '';
                  callback();
                  return;
                }
              }
            }
            gameSubMsg = 'Your own property!';
            callback();
          } else {
            if(mortgaged[space.id]){
              gameSubMsg = 'Property is mortgaged — no rent!';
              gameMessage = (pIdx === 0 ? 'You land' : 'Bot lands') + ' on mortgaged ' + space.name;
              callback();
              return;
            }
            var rent = calcRent(space, owner);
            var hc = houses[space.id] || 0;
            if(space.group === 'transport'){
              var tc = countTransports(owner);
              gameSubMsg = 'Transport rent (' + tc + ' owned)! Pay A₦' + rent.toLocaleString();
            } else if(space.group === 'utility'){
              gameSubMsg = 'Utility rent (dice: ' + lastDiceTotal + ')! Pay A₦' + rent.toLocaleString();
            } else if(hc > 0){
              gameSubMsg = 'Rent with ' + (hc === 4 ? 'hotel' : hc + ' house' + (hc > 1 ? 's' : '')) + '! Pay A₦' + rent.toLocaleString();
            } else if(space.group && ownsFullGroup(owner, space.group)){
              gameSubMsg = 'Double rent! Full ' + space.group + ' group! Pay A₦' + rent.toLocaleString();
            } else {
              gameSubMsg = 'Pay A₦' + rent.toLocaleString() + ' rent to ' + players[owner].name;
            }
            p.cash -= rent;
            players[owner].cash += rent;
            autoMortgage(pIdx);
            gameMessage = (pIdx === 0 ? 'You pay' : 'Bot pays') + ' A₦' + rent.toLocaleString() + ' rent';
            flashCash(pIdx, 'red');
            flashCash(owner, 'green');
            callback();
          }
          break;

        case 'tax':
          p.cash -= space.amount;
          potMoney += space.amount;
          autoMortgage(pIdx);
          gameMessage = (pIdx === 0 ? 'You pay' : 'Bot pays') + ' A₦' + space.amount + ' tax';
          gameSubMsg = 'Added to Free Parking pot (A₦' + potMoney.toLocaleString() + ')';
          flashCash(pIdx, 'red');
          callback();
          break;

        case 'jail':
          gameSubMsg = 'Just visiting!';
          callback();
          break;

        case 'gotojail':
          p.pos = 8;
          p.inJail = true;
          p.jailTurns = 0;
          gameMessage = (pIdx === 0 ? 'You are' : 'Bot is') + ' detained!';
          gameSubMsg = 'Detained at EFCC Office! Skip a turn or pay A₦500';
          callback();
          break;

        case 'parking':
          if(potMoney > 0){
            p.cash += potMoney;
            gameMessage = (pIdx === 0 ? 'You collect' : 'Bot collects') + ' A₦' + potMoney.toLocaleString() + ' from pot!';
            flashCash(pIdx, 'green');
            potMoney = 0;
          } else {
            gameMessage = 'Free Parking — relax!';
          }
          gameSubMsg = '';
          callback();
          break;

        case 'chance':
          var card = nextChance();
          cardMessage = '🃏 Naija Luck: ' + card.text;
          cardFlipIn = true;
          processCard(pIdx, card, callback);
          break;

        case 'community':
          var ccard = nextCommunity();
          cardMessage = '🤝 Community: ' + ccard.text;
          cardFlipIn = true;
          processCard(pIdx, ccard, callback);
          break;

        default:
          callback();
      }
    }

    function processCard(pIdx, card, callback){
      var p = players[pIdx];
      var opp = pIdx === 0 ? 1 : 0;
      switch(card.action){
        case 'gain':
          p.cash += card.amount;
          gameMessage = (pIdx === 0 ? 'You gain' : 'Bot gains') + ' A₦' + card.amount;
          flashCash(pIdx, 'green');
          break;
        case 'lose':
          p.cash -= card.amount;
          potMoney += card.amount;
          autoMortgage(pIdx);
          gameMessage = (pIdx === 0 ? 'You pay' : 'Bot pays') + ' A₦' + card.amount;
          flashCash(pIdx, 'red');
          break;
        case 'move':
          p.pos = card.dest;
          gameMessage = (pIdx === 0 ? 'You advance' : 'Bot advances') + ' to ' + SPACES[card.dest].name;
          render();
          setTimeout(function(){ processLanding(pIdx, callback); }, 600);
          return;
        case 'back':
          p.pos = (p.pos - card.steps + NUM_SPACES) % NUM_SPACES;
          gameMessage = (pIdx === 0 ? 'You go' : 'Bot goes') + ' back ' + card.steps + ' spaces';
          render();
          setTimeout(function(){ processLanding(pIdx, callback); }, 600);
          return;
        case 'jail':
          p.pos = 8;
          p.inJail = true;
          p.jailTurns = 0;
          gameMessage = (pIdx === 0 ? 'You are' : 'Bot is') + ' sent to EFCC Office!';
          break;
        case 'collect_each':
          p.cash += card.amount;
          players[opp].cash -= card.amount;
          autoMortgage(opp);
          gameMessage = (pIdx === 0 ? 'You collect' : 'Bot collects') + ' A₦' + card.amount + ' from opponent';
          flashCash(pIdx, 'green');
          flashCash(opp, 'red');
          break;
        case 'go':
          p.pos = 0;
          p.cash += 2000;
          gameMessage = (pIdx === 0 ? 'You advance' : 'Bot advances') + ' to GO! Collect A₦2,000';
          flashCash(pIdx, 'green');
          break;
        default:
          break;
      }
      gameSubMsg = '';
      callback();
    }

    /* ── Execute roll result after dice animation ── */
    function executeRollResult(pIdx, finalDice){
      var p = players[pIdx];
      var total = finalDice[0] + finalDice[1];
      lastDiceTotal = total;

      var oldPos = p.pos;
      var newPos = (p.pos + total) % NUM_SPACES;

      if(newPos <= oldPos && total > 0){
        p.cash += 2000;
        gameSubMsg = newPos === 0 ? 'Landed on GO! Collect A₦2,000' : 'Passed GO! Collect A₦2,000';
        flashCash(pIdx, 'green');
      }

      p.pos = newPos;
      gameMessage = (pIdx === 0 ? 'You rolled' : 'Bot rolled') + ' ' + DICE_FACES[finalDice[0]-1] + DICE_FACES[finalDice[1]-1] + ' (' + total + ')';

      render();

      setTimeout(function(){
        processLanding(pIdx, function(){
          finishTurn(pIdx);
        });
      }, 400);
    }

    /* ── Full turn logic ── */
    function doTurn(pIdx){
      if(gameEnded) return;
      var p = players[pIdx];

      if(p.inJail){
        if(pIdx === 1 && p.cash > 3000){
          p.cash -= 500;
          potMoney += 500;
          p.inJail = false;
          gameMessage = 'Bot paid A₦500 to leave jail';
          gameSubMsg = '';
          finishTurn(pIdx);
          return;
        }
        if(pIdx === 0){
          waitingForBuy = true;
          buyBtnLabel = 'Pay A₦500 💰';
          passBtnLabel = 'Skip Turn ⏭️';
          gameMessage = 'You are in Jail!';
          gameSubMsg = 'Pay A₦500 to get out, or skip this turn';
          render();
          window._monopolyBuy = function(){
            if(!waitingForBuy) return;
            waitingForBuy = false;
            p.cash -= 500;
            potMoney += 500;
            p.inJail = false;
            gameMessage = 'You paid A₦500 to leave jail';
            gameSubMsg = '';
            flashCash(0, 'red');
            proceedWithRoll(pIdx);
          };
          window._monopolyPass = function(){
            if(!waitingForBuy) return;
            waitingForBuy = false;
            p.jailTurns++;
            if(p.jailTurns >= 2){
              p.inJail = false;
              gameMessage = 'Released from jail after serving time';
            } else {
              gameMessage = 'Skipping turn in jail...';
            }
            gameSubMsg = '';
            finishTurn(pIdx);
          };
          return;
        }
        p.jailTurns++;
        if(p.jailTurns >= 2){
          p.inJail = false;
          gameMessage = 'Bot released from jail';
        } else {
          gameMessage = 'Bot skips turn in jail';
        }
        gameSubMsg = '';
        finishTurn(pIdx);
        return;
      }

      proceedWithRoll(pIdx);
    }

    function proceedWithRoll(pIdx){
      if(pIdx === 0){
        waitingForRoll = true;
        diceState = 'idle';
        gameMessage = 'Your turn! Roll the dice';
        gameSubMsg = '';
        render();
      } else {
        waitingForRoll = false;
        setTimeout(function(){
          executeBotRoll(pIdx);
        }, 800);
      }
    }

    /* ── Bot roll (auto-animated, no tap-to-stop) ── */
    function executeBotRoll(pIdx){
      var finalDice = [rollDie(), rollDie()];
      animateDiceBot(finalDice, function(){
        executeRollResult(pIdx, finalDice);
      });
    }

    function finishTurn(pIdx){
      turnCount++;
      diceState = 'idle';
      animating = false;

      /* AI house building on all owned properties at end of turn */
      if(pIdx === 1){
        var aiP = players[1];
        aiP.props.forEach(function(propId){
          var sp = SPACES[propId];
          if(sp.group && sp.group !== 'transport' && sp.group !== 'utility' && ownsFullGroup(1, sp.group) && !mortgaged[propId]){
            var hc = houses[propId] || 0;
            var houseCost = Math.round(sp.cost * 0.5);
            if(hc < 4 && aiP.cash > houseCost + 3000){
              houses[propId] = hc + 1;
              aiP.cash -= houseCost;
            }
          }
        });
      }

      render();

      if(isBankrupt(players[0]) || isBankrupt(players[1])){
        setTimeout(endGame, 500);
        return;
      }
      if(turnCount >= MAX_TURNS){
        setTimeout(endGame, 500);
        return;
      }

      currentPlayer = pIdx === 0 ? 1 : 0;
      setTimeout(function(){
        doTurn(currentPlayer);
      }, currentPlayer === 1 ? 1000 : 200);
    }

    /* ───────────── RENDER ───────────── */
    function render(){
      var html = '';

      /* ── Styles ── */
      html += '<style>';
      /* Wrapper */
      html += '.mnply-wrapper{background:linear-gradient(135deg, #7c3aed22, #3b82f622);border-radius:16px;padding:10px;box-shadow:0 4px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06);margin-bottom:8px;animation:mnply-breathe 4s ease-in-out infinite;}';
      html += '.mnply-title-bar{text-align:center;font-family:"Bricolage Grotesque",system-ui;font-size:13px;font-weight:900;color:#fbbf24;margin-bottom:6px;text-shadow:0 0 12px rgba(251,191,36,.3);letter-spacing:.5px;}';

      /* Board - 9x9 grid */
      html += '.mnply-board{display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(9,1fr);gap:2px;width:100%;max-width:520px;margin:0 auto;aspect-ratio:1/1;}';

      /* Cells */
      html += '.mnply-cell{position:relative;border:1px solid rgba(255,255,255,.08);border-radius:5px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;color:rgba(255,255,255,.7);padding:1px;overflow:hidden;min-height:0;min-width:0;line-height:1.1;transition:all .3s;}';
      html += '.mnply-cell-corner{border-radius:8px;padding:3px;}';
      html += '.mnply-cell .cstrip{position:absolute;width:100%;height:4px;left:0;top:0;border-radius:5px 5px 0 0;}';
      html += '.mnply-cell .cemoji{font-size:12px;line-height:1;}';
      html += '.mnply-cell .cname{font-size:6px;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;margin-top:1px;}';
      html += '.mnply-cell .cprice{font-size:5.5px;color:rgba(255,255,255,.4);}';
      html += '.mnply-cell .ctokens{display:flex;gap:2px;font-size:14px;position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);border-radius:10px;padding:1px 4px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.7));}';
      html += '.mnply-cell .cowner-border{position:absolute;inset:0;border-radius:5px;pointer-events:none;}';
      html += '.mnply-cell .chouses{position:absolute;bottom:1px;right:1px;display:flex;gap:1px;align-items:center;}';
      html += '.chouse-dot{display:inline-block;width:5px;height:5px;border-radius:1px;margin:0 1px;box-shadow:0 0 3px rgba(34,197,94,.5);}';
      html += '.chouse-hotel{display:inline-block;width:8px;height:7px;border-radius:1px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:5px;font-weight:900;text-align:center;line-height:7px;box-shadow:0 0 4px rgba(251,191,36,.6);}';
      html += '.mnply-cell-mortgaged{opacity:.45;}';

      /* Active cell (player on it) */
      html += '.mnply-cell-active{animation:mnply-glow 1.5s ease-in-out infinite;transform:scale(1.04);z-index:2;}';
      html += '.mnply-cell-active .ctokens{font-size:16px;}';

      /* Token pulse for active player */
      html += '.mnply-token-active{animation:mnply-token-pulse 1s infinite;}';

      /* Center area - spans inner 7x7 */
      html += '.mnply-center{background:linear-gradient(135deg, rgba(168,85,247,.08), rgba(59,130,246,.06));border:1px solid rgba(255,255,255,.08);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;text-align:center;overflow:hidden;}';
      html += '.mnply-center-logo{font-family:"Bricolage Grotesque",system-ui;font-size:11px;font-weight:900;color:#fbbf24;text-shadow:0 0 8px rgba(251,191,36,.25);margin-bottom:2px;letter-spacing:.3px;}';

      /* Dice */
      html += '.mnply-dice-box{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:6px 16px;margin:4px 0;box-shadow:0 2px 10px rgba(0,0,0,.2);}';
      html += '.mnply-dice{font-size:44px;letter-spacing:12px;line-height:1.1;transition:transform .2s;}';
      html += '.mnply-dice-spinning{animation:mnply-spin .15s ease-in-out infinite;}';
      html += '.mnply-dice-box-glow{box-shadow:0 0 20px rgba(168,85,247,.5), 0 0 40px rgba(168,85,247,.2), 0 2px 10px rgba(0,0,0,.2);border-color:rgba(168,85,247,.4);}';
      html += '.mnply-dice-bounce{animation:mnply-bounce .4s ease;}';

      /* Messages */
      html += '.mnply-msg{font-family:"Bricolage Grotesque",system-ui;font-size:13px;font-weight:800;color:#fff;margin:3px 0;}';
      html += '.mnply-sub{font-size:10px;color:rgba(255,255,255,.55);margin:2px 0;max-width:240px;}';

      /* Card */
      html += '.mnply-card{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:6px 10px;font-size:10px;color:#fcd34d;margin:4px 0;max-width:240px;}';
      html += '.mnply-card-flip{animation:mnply-card-in .4s ease-out;}';

      /* Cash wallets */
      html += '.mnply-cash-row{display:flex;gap:8px;margin-top:4px;}';
      html += '.mnply-cash-box{padding:5px 10px;border-radius:8px;font-size:11px;font-weight:800;text-align:center;border:1px solid transparent;transition:all .3s;}';
      html += '.mnply-cash-green{background:linear-gradient(135deg, rgba(16,185,129,.15), rgba(16,185,129,.05));color:#34d399;border-color:rgba(16,185,129,.2);}';
      html += '.mnply-cash-red{background:linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.05));color:#f87171;border-color:rgba(239,68,68,.2);}';
      html += '.mnply-cash-flash-green{box-shadow:0 0 12px rgba(34,197,94,.5);border-color:rgba(34,197,94,.6);}';
      html += '.mnply-cash-flash-red{box-shadow:0 0 12px rgba(239,68,68,.5);border-color:rgba(239,68,68,.6);}';

      /* Buttons */
      html += '.mnply-btn{display:inline-block;padding:8px 18px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;border:none;margin:3px;transition:transform .1s;}';
      html += '.mnply-btn:hover{transform:scale(1.05);}';
      html += '.mnply-btn-roll{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;box-shadow:0 2px 10px rgba(168,85,247,.3);}';
      html += '.mnply-btn-stop{background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;box-shadow:0 0 16px rgba(249,115,22,.5);animation:mnply-stop-pulse 0.8s ease-in-out infinite;font-size:14px;padding:10px 22px;}';
      html += '.mnply-btn-buy{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 2px 10px rgba(16,185,129,.3);}';
      html += '.mnply-btn-pass{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.15);}';
      html += '.mnply-btn-disabled{background:rgba(120,120,120,.3);color:rgba(255,255,255,.4);cursor:not-allowed;box-shadow:none;}';
      html += '.mnply-controls{text-align:center;margin:6px 0;}';

      /* Property tags */
      html += '.mnply-props{display:flex;gap:3px;flex-wrap:wrap;justify-content:center;margin:4px 0;}';
      html += '.mnply-prop-tag{font-size:8px;padding:2px 6px;border-radius:10px;font-weight:700;border:1px solid;display:inline-flex;align-items:center;gap:2px;}';
      html += '.mnply-prop-mortgaged{text-decoration:line-through;opacity:.5;}';
      html += '.mnply-prop-dots{display:inline-flex;gap:1px;margin-left:2px;}';
      html += '.mnply-prop-dot{display:inline-block;width:4px;height:4px;border-radius:1px;background:#22c55e;box-shadow:0 0 2px rgba(34,197,94,.5);}';
      html += '.mnply-prop-hotel{display:inline-block;width:6px;height:5px;border-radius:1px;background:linear-gradient(135deg,#fbbf24,#f59e0b);margin-left:2px;}';

      /* Turn indicator / progress bar */
      html += '.mnply-turn-bar-wrap{margin-bottom:6px;padding:0 2px;}';
      html += '.mnply-turn-label{font-size:10px;color:rgba(255,255,255,.4);text-align:center;margin-bottom:3px;font-weight:700;}';
      html += '.mnply-turn-bar{height:4px;border-radius:2px;overflow:hidden;background:rgba(255,255,255,.06);}';
      html += '.mnply-turn-fill{height:100%;border-radius:2px;background:linear-gradient(90deg, #a855f7, #7c3aed);transition:width .5s;}';

      /* Net worth bar */
      html += '.mnply-nw-wrap{margin-top:6px;padding:0 4px;}';
      html += '.mnply-nw-label{font-size:8px;color:rgba(255,255,255,.4);text-align:center;margin-bottom:2px;font-weight:700;}';
      html += '.mnply-nw-bar{display:flex;height:8px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.06);}';
      html += '.mnply-nw-green{background:linear-gradient(90deg, #10b981, #34d399);transition:width .6s;}';
      html += '.mnply-nw-red{background:linear-gradient(90deg, #f87171, #ef4444);transition:width .6s;}';
      html += '.mnply-nw-nums{display:flex;justify-content:space-between;font-size:8px;color:rgba(255,255,255,.45);margin-top:2px;}';

      /* Endgame card */
      html += '.mnply-endgame{background:linear-gradient(135deg, rgba(168,85,247,.12), rgba(59,130,246,.08));border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;margin:6px auto;max-width:340px;text-align:center;}';
      html += '.mnply-endgame h3{font-family:"Bricolage Grotesque",system-ui;font-size:18px;font-weight:900;margin:0 0 8px 0;}';
      html += '.mnply-endgame-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:10px;text-align:left;margin:8px 0;}';
      html += '.mnply-endgame-row{display:flex;justify-content:space-between;}';
      html += '.mnply-endgame-lbl{color:rgba(255,255,255,.5);}';
      html += '.mnply-endgame-val{font-weight:800;}';

      /* Keyframes */
      html += '@keyframes mnply-glow{0%,100%{box-shadow:0 0 4px rgba(168,85,247,.3)}50%{box-shadow:0 0 14px rgba(168,85,247,.7)}}';
      html += '@keyframes mnply-spin{0%{transform:rotate(-4deg) scale(1.12)}25%{transform:rotate(4deg) scale(1.06)}50%{transform:rotate(-3deg) scale(1.12)}75%{transform:rotate(3deg) scale(1.06)}100%{transform:rotate(0) scale(1)}}';
      html += '@keyframes mnply-card-in{0%{transform:rotateX(90deg);opacity:0}100%{transform:rotateX(0);opacity:1}}';
      html += '@keyframes mnply-token-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}';
      html += '@keyframes mnply-bounce{0%{transform:scale(1)}30%{transform:scale(1.3)}60%{transform:scale(0.95)}100%{transform:scale(1)}}';
      html += '@keyframes mnply-confetti{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-30px) scale(1.5)}}';
      html += '@keyframes mnply-breathe{0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06)}50%{box-shadow:0 4px 24px rgba(0,0,0,.3), 0 0 20px rgba(168,85,247,.08), 0 0 0 1px rgba(255,255,255,.08)}}';
      html += '@keyframes mnply-stop-pulse{0%,100%{box-shadow:0 0 16px rgba(249,115,22,.5)}50%{box-shadow:0 0 28px rgba(249,115,22,.8), 0 0 48px rgba(239,68,68,.3)}}';
      html += '</style>';

      /* ── Endgame display ── */
      if(gameEnded && gameSubMsg === '__endgame__'){
        var ed = window._mnplyEndData;
        html += '<div class="mnply-endgame">';
        if(ed.iWon){
          html += '<div style="font-size:28px;animation:mnply-confetti 2s ease-out forwards;">🎉🏆🎉</div>';
          html += '<h3 style="color:#34d399;">You Win!</h3>';
        } else {
          html += '<div style="font-size:28px;">🔴</div>';
          html += '<h3 style="color:#f87171;">Bot Wins!</h3>';
        }
        html += '<div class="mnply-endgame-grid">';
        html += '<div><div class="mnply-endgame-lbl">🟢 You</div></div>';
        html += '<div><div class="mnply-endgame-lbl">🔴 Bot</div></div>';

        html += '<div class="mnply-endgame-row"><span class="mnply-endgame-lbl">Cash</span><span class="mnply-endgame-val" style="color:#34d399;">A₦' + Math.max(0, ed.cash0).toLocaleString() + '</span></div>';
        html += '<div class="mnply-endgame-row"><span class="mnply-endgame-lbl">Cash</span><span class="mnply-endgame-val" style="color:#f87171;">A₦' + Math.max(0, ed.cash1).toLocaleString() + '</span></div>';

        html += '<div class="mnply-endgame-row"><span class="mnply-endgame-lbl">Properties</span><span class="mnply-endgame-val" style="color:#34d399;">' + ed.props0 + ' (A₦' + ed.propVal0.toLocaleString() + ')</span></div>';
        html += '<div class="mnply-endgame-row"><span class="mnply-endgame-lbl">Properties</span><span class="mnply-endgame-val" style="color:#f87171;">' + ed.props1 + ' (A₦' + ed.propVal1.toLocaleString() + ')</span></div>';

        html += '<div class="mnply-endgame-row"><span class="mnply-endgame-lbl">Houses</span><span class="mnply-endgame-val" style="color:#34d399;">' + ed.houses0 + '</span></div>';
        html += '<div class="mnply-endgame-row"><span class="mnply-endgame-lbl">Houses</span><span class="mnply-endgame-val" style="color:#f87171;">' + ed.houses1 + '</span></div>';

        html += '<div class="mnply-endgame-row" style="border-top:1px solid rgba(255,255,255,.1);padding-top:4px;margin-top:2px;"><span class="mnply-endgame-lbl"><b>Net Worth</b></span><span class="mnply-endgame-val" style="color:#34d399;">A₦' + ed.nw0.toLocaleString() + '</span></div>';
        html += '<div class="mnply-endgame-row" style="border-top:1px solid rgba(255,255,255,.1);padding-top:4px;margin-top:2px;"><span class="mnply-endgame-lbl"><b>Net Worth</b></span><span class="mnply-endgame-val" style="color:#f87171;">A₦' + ed.nw1.toLocaleString() + '</span></div>';

        html += '</div>';
        html += '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:6px;">Game Over — ' + turnCount + ' turns played</div>';
        html += '</div>';
        stage.innerHTML = html;
        return;
      }

      /* ── Title bar ── */
      html += '<div class="mnply-wrapper">';
      html += '<div class="mnply-title-bar">🏦 Nigerian Monopoly — Arena Edition</div>';

      /* ── Turn progress bar ── */
      var turnPct = Math.min(Math.round(((turnCount + 1) / MAX_TURNS) * 100), 100);
      html += '<div class="mnply-turn-bar-wrap">';
      html += '<div class="mnply-turn-label">Turn ' + Math.min(turnCount + 1, MAX_TURNS) + '/' + MAX_TURNS + ' · Pot: A₦' + potMoney.toLocaleString() + '</div>';
      html += '<div class="mnply-turn-bar"><div class="mnply-turn-fill" style="width:' + turnPct + '%;"></div></div>';
      html += '</div>';

      /* ── Board grid (9×9) ── */
      html += '<div class="mnply-board">';

      GRID_MAP.forEach(function(g){
        var posIdx = g.pos;
        var sp = SPACES[posIdx];
        var cssRow = g.row + 1;
        var cssCol = g.col + 1;
        var isCorner = (posIdx === 0 || posIdx === 8 || posIdx === 16 || posIdx === 24);
        var p0Here = players[0].pos === posIdx;
        var p1Here = players[1].pos === posIdx;
        var hasPlayer = p0Here || p1Here;
        var isMortgagedCell = mortgaged[posIdx];
        var cellClasses = 'mnply-cell';
        if(isCorner) cellClasses += ' mnply-cell-corner';
        if(hasPlayer) cellClasses += ' mnply-cell-active';
        if(isMortgagedCell) cellClasses += ' mnply-cell-mortgaged';

        var bg = cellGradient(sp);
        html += '<div class="' + cellClasses + '" style="grid-row:' + cssRow + ';grid-column:' + cssCol + ';background:' + bg + ';">';

        /* Color strip */
        if(sp.color && sp.type === 'property'){
          html += '<div class="cstrip" style="background:' + sp.color + ';"></div>';
        }

        /* Owner border */
        var ow = ownerOf(posIdx);
        if(ow !== -1){
          html += '<div class="cowner-border" style="border:2px solid ' + players[ow].color + '44;"></div>';
        }

        /* Emoji */
        html += '<div class="cemoji">' + sp.emoji + '</div>';

        /* Name */
        html += '<div class="cname">' + abbreviate(sp.name) + '</div>';

        /* Price */
        if(sp.cost){
          html += '<div class="cprice">A₦' + sp.cost + '</div>';
        }

        /* Houses indicator (colored dots or hotel) */
        var houseCount = houses[posIdx] || 0;
        if(houseCount > 0){
          html += '<div class="chouses">';
          if(houseCount === 4){
            html += '<span class="chouse-hotel">H</span>';
          } else {
            for(var hi = 0; hi < houseCount; hi++){
              html += '<span class="chouse-dot" style="background:#22c55e;"></span>';
            }
          }
          html += '</div>';
        }

        /* Player tokens */
        if(hasPlayer){
          html += '<div class="ctokens">';
          if(p0Here){
            var p0Active = currentPlayer === 0;
            html += '<span' + (p0Active ? ' class="mnply-token-active"' : '') + '>' + players[0].token + '</span>';
          }
          if(p1Here){
            var p1Active = currentPlayer === 1;
            html += '<span' + (p1Active ? ' class="mnply-token-active"' : '') + '>' + players[1].token + '</span>';
          }
          html += '</div>';
        }

        html += '</div>';
      });

      /* Center area (inner 7×7, grid-row:2/9, grid-column:2/9) */
      html += '<div class="mnply-center" style="grid-row:2/9;grid-column:2/9;">';

      /* Logo */
      html += '<div class="mnply-center-logo">🏦 NAIJA MONOPOLY</div>';

      /* Dice */
      var diceBoxClass = 'mnply-dice-box';
      if(diceState === 'spinning' || animating) diceBoxClass += ' mnply-dice-box-glow';
      html += '<div class="' + diceBoxClass + '">';
      var diceClass = 'mnply-dice';
      if(diceState === 'spinning') diceClass += ' mnply-dice-spinning';
      html += '<div class="' + diceClass + '" id="mnply-dice-display">' + DICE_FACES[dice[0]-1] + ' ' + DICE_FACES[dice[1]-1] + '</div>';
      html += '</div>';

      /* Message */
      html += '<div class="mnply-msg">' + gameMessage + '</div>';
      if(gameSubMsg && gameSubMsg !== '__endgame__') html += '<div class="mnply-sub">' + gameSubMsg + '</div>';

      /* Card message */
      if(cardMessage){
        html += '<div class="mnply-card' + (cardFlipIn ? ' mnply-card-flip' : '') + '">' + cardMessage + '</div>';
      }

      /* Cash display */
      html += '<div class="mnply-cash-row">';
      var cashClass0 = 'mnply-cash-box mnply-cash-green';
      if(cashFlash0 === 'green') cashClass0 += ' mnply-cash-flash-green';
      if(cashFlash0 === 'red') cashClass0 += ' mnply-cash-flash-red';
      var cashClass1 = 'mnply-cash-box mnply-cash-red';
      if(cashFlash1 === 'green') cashClass1 += ' mnply-cash-flash-green';
      if(cashFlash1 === 'red') cashClass1 += ' mnply-cash-flash-red';

      html += '<div class="' + cashClass0 + '">💰 A₦' + players[0].cash.toLocaleString() + '</div>';
      html += '<div class="' + cashClass1 + '">💰 A₦' + players[1].cash.toLocaleString() + '</div>';
      html += '</div>';

      html += '</div>'; /* end center */
      html += '</div>'; /* end board */

      /* ── Controls ── */
      html += '<div class="mnply-controls">';
      if(gameEnded){
        html += '<div style="font-size:12px;color:rgba(255,255,255,.5);">Game Over</div>';
      } else if(waitingForBuy){
        html += '<button class="mnply-btn mnply-btn-buy" onclick="window._monopolyBuy()">' + buyBtnLabel + '</button>';
        html += '<button class="mnply-btn mnply-btn-pass" onclick="window._monopolyPass()">' + passBtnLabel + '</button>';
      } else if(diceState === 'spinning'){
        html += '<button class="mnply-btn mnply-btn-stop" onclick="window._monopolyStop()">STOP ✋</button>';
      } else if(diceState === 'stopping'){
        html += '<button class="mnply-btn mnply-btn-disabled" disabled>Stopping...</button>';
      } else if(waitingForRoll && currentPlayer === 0 && diceState === 'idle'){
        html += '<button class="mnply-btn mnply-btn-roll" onclick="window._monopolyRoll()">Roll 🎲</button>';
      } else if(animating){
        html += '<button class="mnply-btn mnply-btn-disabled" disabled>Rolling...</button>';
      } else {
        html += '<div style="font-size:12px;color:rgba(255,255,255,.5);">' + (currentPlayer === 1 ? '🔴 Bot is playing...' : 'Processing...') + '</div>';
      }
      html += '</div>';

      html += '</div>'; /* end wrapper */

      /* ── Property lists ── */
      html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px;">';

      /* Player properties */
      html += '<div style="flex:1;min-width:140px;max-width:240px;">';
      html += '<div style="font-size:9px;font-weight:800;color:#34d399;text-align:center;margin-bottom:2px;">🟢 YOUR PROPERTIES</div>';
      html += '<div class="mnply-props">';
      if(players[0].props.length === 0){
        html += '<span style="font-size:8px;color:rgba(255,255,255,.3);">None yet</span>';
      }
      players[0].props.forEach(function(id){
        var s = SPACES[id];
        var isMort = mortgaged[id];
        var hc = houses[id] || 0;
        var tagClass = 'mnply-prop-tag' + (isMort ? ' mnply-prop-mortgaged' : '');
        html += '<span class="' + tagClass + '" style="color:' + (s.color || '#fff') + ';border-color:' + (s.color || 'rgba(255,255,255,.2)') + ';background:' + (s.color || 'rgba(255,255,255,.1)') + '22;">';
        html += s.emoji + ' ' + abbreviate(s.name);
        if(hc > 0){
          if(hc === 4){
            html += '<span class="mnply-prop-hotel"></span>';
          } else {
            html += '<span class="mnply-prop-dots">';
            for(var hi = 0; hi < hc; hi++) html += '<span class="mnply-prop-dot"></span>';
            html += '</span>';
          }
        }
        html += '</span>';
      });
      html += '</div></div>';

      /* AI properties */
      html += '<div style="flex:1;min-width:140px;max-width:240px;">';
      html += '<div style="font-size:9px;font-weight:800;color:#f87171;text-align:center;margin-bottom:2px;">🔴 BOT PROPERTIES</div>';
      html += '<div class="mnply-props">';
      if(players[1].props.length === 0){
        html += '<span style="font-size:8px;color:rgba(255,255,255,.3);">None yet</span>';
      }
      players[1].props.forEach(function(id){
        var s = SPACES[id];
        var isMort = mortgaged[id];
        var hc = houses[id] || 0;
        var tagClass = 'mnply-prop-tag' + (isMort ? ' mnply-prop-mortgaged' : '');
        html += '<span class="' + tagClass + '" style="color:' + (s.color || '#fff') + ';border-color:' + (s.color || 'rgba(255,255,255,.2)') + ';background:' + (s.color || 'rgba(255,255,255,.1)') + '22;">';
        html += s.emoji + ' ' + abbreviate(s.name);
        if(hc > 0){
          if(hc === 4){
            html += '<span class="mnply-prop-hotel"></span>';
          } else {
            html += '<span class="mnply-prop-dots">';
            for(var hi = 0; hi < hc; hi++) html += '<span class="mnply-prop-dot"></span>';
            html += '</span>';
          }
        }
        html += '</span>';
      });
      html += '</div></div>';

      html += '</div>';

      /* ── Net worth bar ── */
      var nw0 = netWorth(players[0]);
      var nw1 = netWorth(players[1]);
      var totalNW = Math.max(nw0 + nw1, 1);
      var pct0 = Math.round((nw0 / totalNW) * 100);
      var pct1 = 100 - pct0;
      html += '<div class="mnply-nw-wrap">';
      html += '<div class="mnply-nw-label">NET WORTH</div>';
      html += '<div class="mnply-nw-bar">';
      html += '<div class="mnply-nw-green" style="width:' + pct0 + '%;"></div>';
      html += '<div class="mnply-nw-red" style="width:' + pct1 + '%;"></div>';
      html += '</div>';
      html += '<div class="mnply-nw-nums">';
      html += '<span>🟢 A₦' + nw0.toLocaleString() + ' (' + pct0 + '%)</span>';
      html += '<span>🔴 A₦' + nw1.toLocaleString() + ' (' + pct1 + '%)</span>';
      html += '</div>';
      html += '</div>';

      stage.innerHTML = html;
    }

    /* ── Wire up tap-to-stop dice handlers ── */
    window._monopolyRoll = function(){
      if(diceState !== 'idle' || !waitingForRoll || currentPlayer !== 0) return;
      waitingForRoll = false;
      finalDiceResult = [rollDie(), rollDie()];
      diceState = 'spinning';
      gameMessage = '🎲 Dice are rolling — tap STOP!';
      gameSubMsg = '';
      render();
      startDiceSpin();
    };

    window._monopolyStop = function(){
      if(diceState !== 'spinning') return;
      diceState = 'stopping';
      gameMessage = '🎲 Stopping...';
      gameSubMsg = '';
      render();
      stopDiceDecelerate(finalDiceResult, function(){
        diceState = 'done';
        render();
        executeRollResult(0, finalDiceResult);
      });
    };

    /* ── Start game ── */
    render();
    doTurn(0);

  });
};

})();
