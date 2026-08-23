// V-TRADE Telegram final presentation hotfix V7.4
// Canonical short renderer. Does not patch server.js at runtime.
'use strict';

function telegramWaitText(a) {
  a = a || {};
  function num(v){var n=Number(v);return Number.isFinite(n)?n.toFixed(2):'WAIT';}
  function confirmed(v){return v===true||v===1||String(v).toLowerCase()==='true'||String(v).toUpperCase()==='PASS';}
  function yn(v){return v?'✅':'❌';}
  var signal=String(a.signal||a.action||'WAIT').toUpperCase();
  var bias=String(a.bias||a.directionBand||'NEUTRAL').toUpperCase();
  var score=Number(a.directionScore!=null?a.directionScore:(a.aiScore!=null?a.aiScore:a.setupScore));
  var confidence=Number(a.confidence!=null?a.confidence:0);
  var price=num(a.livePrice!=null?a.livePrice:(a.price!=null?a.price:a.bid));
  var g=a.gates||a.confirmations||{}, ict=a.ict||{};
  var reasons=Array.isArray(a.score?.blockedReasons)?a.score.blockedReasons:[];
  var rows=a.mtf?.timeframes||a.timeframes||a.frames||{};
  var mtfReady=['M5','M15','H1','H4'].every(function(tf){var r=rows[tf]||rows[tf.toLowerCase()]||{};return r.ready===true||Number(r.bars||r.feedBars||r.candles?.length||0)>=30;});
  var blocked=function(p){return reasons.some(function(x){return p.test(String(x||''));});};
  var mtf=!blocked(/MTF.*not aligned|MTF.*incomplete|timeframes.*available|MTF.*history.*not/i)&&(confirmed(a.mtfAligned)||confirmed(a.mtfOk)||confirmed(a.mtfAlignmentOk)||confirmed(g.mtfOk)||confirmed(g.mtfAlignmentOk)||mtfReady||(Number(a.available)>=4&&Number(a.required)>=4)||a.complete===true||a.mtf?.complete===true||a.canonical?.mtfReady===true);
  var mss=!blocked(/Fresh M5 MSS not confirmed|Fresh M5 MSS\/BOS structure break not confirmed/i)&&(confirmed(g.mss)||confirmed(g.bos)||confirmed(g.mssOk)||confirmed(g.bosOk)||confirmed(g.structureAgreement)||confirmed(ict.mss?.confirmed)||confirmed(ict.bos?.confirmed));
  var liq=!blocked(/Fresh liquidity sweep not confirmed/i)&&(confirmed(g.liquiditySweep)||confirmed(g.liquiditySweepOk)||confirmed(g.liquidityOk)||confirmed(g.sweepOk)||confirmed(ict.liquiditySweep?.confirmed));
  var fvg=!blocked(/No fresh aligned FVG\/OB/i)&&(confirmed(g.fvg)||confirmed(g.fvgOk)||confirmed(ict.fvg?.confirmed));
  var ob=!blocked(/No fresh aligned FVG\/OB/i)&&(confirmed(g.orderBlock)||confirmed(g.orderBlockOk)||confirmed(g.obOk)||confirmed(ict.orderBlock?.confirmed));
  var authorized=a.tradeAuthorized===true&&(signal==='BUY'||signal==='SELL')&&mtf&&mss&&liq&&(fvg||ob);
  var action=authorized?(signal==='BUY'?'🟢 BUY':'🔴 SELL'):(bias==='BULLISH'?'🟡 WAIT — BUY BIAS':bias==='BEARISH'?'🟡 WAIT — SELL BIAS':'🟡 WAIT');
  var z=a.entryZone||a.executionZone||a.candidateZone||a.referenceZone||a.zone||{};
  var zone=Number.isFinite(Number(z.low))&&Number.isFinite(Number(z.high))?num(z.low)+'–'+num(z.high):'WAIT';
  var entry=authorized?num(a.entry!=null?a.entry:a.entryPrice):'WAIT';
  var sl=authorized?num(a.stopLoss!=null?a.stopLoss:a.sl):'WAIT';
  var tp=Array.isArray(a.takeProfit)?a.takeProfit:(Array.isArray(a.tp)?a.tp:[]);
  var tp1=authorized?num(a.tp1!=null?a.tp1:tp[0]):'WAIT',tp2=authorized?num(a.tp2!=null?a.tp2:tp[1]):'WAIT',tp3=authorized?num(a.tp3!=null?a.tp3:tp[2]):'WAIT';
  var ai=a.aiConfirmation||a.ai||{};
  var aiDecision=String(ai.decision||a.aiDecision||'WAIT').toUpperCase();
  var aiConfidence=Number(ai.confidence!=null?ai.confidence:(a.aiConfidence!=null?a.aiConfidence:0));
  var agreement=String(ai.agreement||a.aiAgreement||'NEUTRAL').toUpperCase();
  var broker=String(a.broker||'VT Markets MT5'), age=Number(a.quoteAge!=null?a.quoteAge:(a.feedAgeSec!=null?a.feedAgeSec:0));
  return ['🤖 *V TRADE AI — ICT SIGNAL*',
    '📊 XAU/USD | 💰 *'+price+'*',
    '⚡ *'+action+'* | 📈 '+bias+' | Score '+(Number.isFinite(score)?Math.round(score):0)+'/100 | Conf '+(Number.isFinite(confidence)?Math.round(confidence):0)+'/100',
    '🔎 ICT: MSS '+yn(mss)+' | LIQ '+yn(liq)+' | FVG '+yn(fvg)+' | OB '+yn(ob)+' | MTF '+yn(mtf),
    '🎯 Zone: *'+zone+'* | 🟢 Entry: *'+entry+'* | 🛑 SL: *'+sl+'*',
    '🎯 TP1: *'+tp1+'* | TP2: *'+tp2+'* | TP3: *'+tp3+'*',
    '🤖 AI: *'+aiDecision+'* | '+(Number.isFinite(aiConfidence)?Math.round(aiConfidence):0)+'/100 | '+agreement,
    authorized?'🔐 *ORDER AUTHORIZED*':'🛡️ *WAIT — NO ORDER AUTHORIZED*',
    '🏦 '+broker+' | Quote '+(Number.isFinite(age)?age:0)+'s'
  ].join('\n');
}

module.exports={telegramWaitText};
