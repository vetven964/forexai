// V-TRADE Telegram Compact Formatter V8
'use strict';
const fs = require('fs');
const path = require('path');
const SERVER_FILE = path.resolve(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_COMPACT_FORMAT_V8';

function formatterSource() {
  return [
    '// ' + MARKER,
    'function telegramWaitText(a) {',
    '  a = a || {};',
    '  const n=v=>{const x=Number(v);return Number.isFinite(x)?x.toFixed(2):"WAIT";};',
    '  const ok=v=>v===true||v===1||String(v).toLowerCase()==="true"||String(v).toUpperCase()==="PASS";',
    '  const yn=v=>ok(v)?"✅":"❌";',
    '  const signal=String(a.signal||a.action||"WAIT").toUpperCase();',
    '  const bias=String(a.bias||a.directionBand||"NEUTRAL").toUpperCase();',
    '  const score=Number(a.directionScore??a.aiScore??a.setupScore);',
    '  const confidence=Number(a.confidence??0);',
    '  const price=n(a.livePrice??a.price??a.bid);',
    '  const g=a.gates||a.confirmations||{}, ict=a.ict||{};',
    '  const reasons=Array.isArray(a.score?.blockedReasons)?a.score.blockedReasons:[];',
    '  const blocked=ps=>ps.some(p=>reasons.some(x=>p.test(String(x||""))));',
    '  const mtf=!blocked([/MTF.*not aligned/i,/MTF.*incomplete/i,/MTF.*history.*not/i])&&(ok(a.mtfAligned)||ok(a.mtfOk)||ok(a.mtfAlignmentOk)||ok(g.mtfOk)||ok(g.mtfAlignmentOk)||a.complete===true||a.mtf?.complete===true||Number(a.available)>=4);',
    '  const mss=!blocked([/Fresh M5 MSS not confirmed/i,/Fresh M5 MSS\\/BOS structure break not confirmed/i])&&(ok(g.mss)||ok(g.bos)||ok(g.mssOk)||ok(g.bosOk)||ok(g.structureAgreement)||ok(ict.mss?.confirmed)||ok(ict.bos?.confirmed));',
    '  const liq=!blocked([/Fresh liquidity sweep not confirmed/i])&&(ok(g.liquiditySweep)||ok(g.liquiditySweepOk)||ok(g.liquidityOk)||ok(g.sweepOk)||ok(ict.liquiditySweep?.confirmed));',
    '  const fvg=!blocked([/No fresh aligned FVG\\/OB/i])&&(ok(g.fvg)||ok(g.fvgOk)||ok(ict.fvg?.confirmed));',
    '  const ob=!blocked([/No fresh aligned FVG\\/OB/i])&&(ok(g.orderBlock)||ok(g.orderBlockOk)||ok(g.obOk)||ok(ict.orderBlock?.confirmed));',
    '  const authorized=a.tradeAuthorized===true&&(signal==="BUY"||signal==="SELL")&&mtf&&mss&&liq&&(fvg||ob);',
    '  const action=authorized?(signal==="BUY"?"🟢 UPTRADE — BUY":"🔴 DOWNTRADE — SELL"):(bias==="BULLISH"?"🟡 WAIT — BUY BIAS":bias==="BEARISH"?"🟡 WAIT — SELL BIAS":"🟡 WAIT");',
    '  const z=a.entryZone||a.executionZone||a.candidateZone||a.referenceZone||a.zone||{};',
    '  const zone=Number.isFinite(Number(z.low))&&Number.isFinite(Number(z.high))?`${n(z.low)}–${n(z.high)}`:"WAIT";',
    '  const entry=authorized?n(a.entry??a.entryPrice):"WAIT", sl=authorized?n(a.stopLoss??a.sl):"WAIT";',
    '  const tp=Array.isArray(a.takeProfit)?a.takeProfit:(Array.isArray(a.tp)?a.tp:[]);',
    '  const tp1=authorized?n(a.tp1??tp[0]):"WAIT",tp2=authorized?n(a.tp2??tp[1]):"WAIT",tp3=authorized?n(a.tp3??tp[2]):"WAIT";',
    '  const ai=a.aiConfirmation||a.ai||{}, aiDecision=String(ai.decision||a.aiDecision||"WAIT").toUpperCase();',
    '  const aiConfidence=Number(ai.confidence??a.aiConfidence??0), agreement=String(ai.agreement||a.aiAgreement||"NEUTRAL").toUpperCase();',
    '  const broker=String(a.broker||"VT Markets MT5"), age=Number(a.quoteAge??a.feedAgeSec??0);',
    '  return ["🤖 *V TRADE AI — ICT SIGNAL*","",`📊 XAU/USD | 💰 ${price}`,`⚡ ${action}`,`📈 ${bias} | Score ${Number.isFinite(score)?Math.round(score):0}/100`,`🧠 Confidence ${Number.isFinite(confidence)?Math.round(confidence):0}/100`,"","🔎 *ICT*",`MSS/BOS ${yn(mss)} | Liquidity ${yn(liq)}`,`FVG/OB ${yn(fvg||ob)} | MTF ${yn(mtf)}`,"",`🎯 Zone: ${zone}`,`🟢 Entry: ${entry}`,`🛑 SL: ${sl}`,`🎯 TP1: ${tp1} | TP2: ${tp2} | TP3: ${tp3}`,"",`🤖 AI: ${aiDecision} | ${Number.isFinite(aiConfidence)?Math.round(aiConfidence):0}/100 | ${agreement}`,authorized?"🔐 *ORDER AUTHORIZED*":"🛡️ *NO ORDER AUTHORIZED*","",`🏦 ${broker} | Quote ${Number.isFinite(age)?age:0}s`].join("\\n");',
    '}',
    ''
  ].join("\\n");
}

function install(){
  if(!fs.existsSync(SERVER_FILE))return console.warn('[V-TRADE TELEGRAM] Compact V8 skipped: server.js missing');
  let source=fs.readFileSync(SERVER_FILE,'utf8');
  const start=source.indexOf('function telegramWaitText(a) {');
  if(start<0)return console.warn('[V-TRADE TELEGRAM] Compact V8 skipped: renderer not found');
  let end=source.indexOf('\\nfunction ',start+10); if(end<0)end=source.indexOf('\\n//',start+10);
  if(end<0)return console.warn('[V-TRADE TELEGRAM] Compact V8 skipped: renderer boundary not found');
  source=source.slice(0,start)+formatterSource()+source.slice(end);
  fs.writeFileSync(SERVER_FILE,source,'utf8');
  console.log('[V-TRADE TELEGRAM] Compact V8 installed | long renderer replaced | fail-closed');
}
try{install();}catch(e){console.error('[V-TRADE TELEGRAM] Compact V8 failed:',e?.stack||e?.message);process.exitCode=1;}
