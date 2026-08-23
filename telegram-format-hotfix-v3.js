// V-TRADE AI — Telegram compact signal formatter V3
// Keeps signal/entry gates unchanged; only shortens trader-facing Telegram text.
'use strict';
const fs = require('fs');
const path = require('path');

const LAUNCHER = path.resolve(__dirname, 'server-launcher.js');
const MARKER = 'VTRADE_TELEGRAM_COMPACT_FORMAT_V3';

function patch() {
  if (!fs.existsSync(LAUNCHER)) throw new Error('server-launcher.js not found');
  let source = fs.readFileSync(LAUNCHER, 'utf8');
  if (source.includes(MARKER)) {
    console.log('[V-TRADE TELEGRAM] compact formatter V3 already active');
    return;
  }

  const start = source.indexOf('function patchWaitCard(source) {');
  const end = source.indexOf('\nfunction patchFrontend(source) {', start);
  if (start < 0 || end < 0) throw new Error('patchWaitCard anchors not found');

  const replacement = String.raw`function patchWaitCard(source) {
  // ${MARKER}
  const waitSource = [
    'function telegramWaitText(a) {',
    "  const price=Number(a?.price ?? a?.livePrice ?? a?.bid);",
    "  const bias=String(a?.bias || a?.directionBand || 'NEUTRAL').toUpperCase();",
    "  const score=Number(a?.directionScore ?? a?.aiScore ?? 0);",
    "  const confidence=Number(a?.confidence ?? a?.score?.confidence ?? 0);",
    "  const blocked=Array.isArray(a?.score?.blockedReasons) ? a.score.blockedReasons.map(String) : [];",
    "  const ai=a?.aiConfirmation || a?.ai || {};",
    "  const aiDecision=String(ai?.decision || a?.aiDecision || 'WAIT').toUpperCase();",
    "  const aiConfidence=Number(ai?.confidence ?? a?.aiConfidence ?? 0);",
    "  const agreement=String(ai?.agreement || a?.aiAgreement || 'NEUTRAL').toUpperCase();",
    "  const broker=String(a?.broker || 'VT Markets MT5');",
    "  const age=Number(a?.quoteAge ?? a?.quote_age ?? a?.feedAgeSec ?? a?.priceAgeSec ?? 0);",
    "  const zone=a?.entryZone || a?.executionZone || null;",
    "  const low=Number(zone?.low), high=Number(zone?.high);",
    "  const zoneText=Number.isFinite(low)&&Number.isFinite(high) ? low.toFixed(2)+'–'+high.toFixed(2) : 'WAIT';",
    "  const fmt=x=>Number.isFinite(Number(x))?Number(x).toFixed(2):'WAIT';",
    "  const gate=(name,ok)=>name+': '+(ok?'✅':'❌');",
    "  const gates=a?.confirmations || a?.gates || {};",
    "  const liquidity=Boolean(gates.liquiditySweepOk ?? gates.liquidityOk ?? gates.sweepOk);",
    "  const mss=Boolean(gates.mssOk ?? gates.mss ?? gates.structureAgreement);",
    "  const fvg=Boolean(gates.fvgOk ?? gates.fvg);",
    "  const ob=Boolean(gates.orderBlockOk ?? gates.obOk ?? gates.orderBlock);",
    "  const mtf=Boolean(gates.mtfOk ?? gates.mtfAlignmentOk ?? a?.mtfOk);",
    "  const authorized=a?.tradeAuthorized===true || a?.setupReady===true && blocked.length===0;",
    "  const side=bias==='BULLISH'?'BUY':bias==='BEARISH'?'SELL':'';",
    "  if(authorized && side){",
    "    const entry=Number(a?.entry ?? a?.entryPrice ?? a?.livePrice);",
    "    const sl=Number(a?.sl ?? a?.stopLoss);",
    "    const tp1=Number(a?.tp1 ?? a?.takeProfit1);",
    "    const tp2=Number(a?.tp2 ?? a?.takeProfit2);",
    "    const tp3=Number(a?.tp3 ?? a?.takeProfit3);",
    "    return ['🤖 *V TRADE AI — XAUUSD*','',side==='BUY'?'🟢 *UPTRADE NOW*':'🔴 *DOWNTRADE NOW*','📊 TF: *'+String(a?.timeframe||a?.executionTimeframe||'M5')+'*','💰 Price: *'+fmt(price)+'*','🎯 Entry Zone: *'+zoneText+'*','🛑 SL: *'+fmt(sl)+'*','🎯 TP1: *'+fmt(tp1)+'*','🎯 TP2: *'+fmt(tp2)+'*','🎯 TP3: *'+fmt(tp3)+'*','📐 RR: *'+fmt(a?.rr ?? a?.riskReward)+'*','',gate('MSS/BOS',mss),gate('Liquidity',liquidity),gate('FVG/OB',fvg||ob),gate('MTF',mtf),'','🔐 *ORDER AUTHORIZED — ALL GATES PASSED*','🏦 '+broker+' | Quote: '+age+'s'].join('\\n');",
    "  }",
    "  const action=bias==='BULLISH'?'🟡 *UPTRADE BULLISH*':bias==='BEARISH'?'🟡 *DOWNTRADE BEARISH*':'🟡 *WAIT*';",
    "  return ['🤖 *V TRADE AI — XAUUSD*','',action,'💰 Price: *'+fmt(price)+'*','📈 Direction Score: *'+(Number.isFinite(score)?score:0)+'/100*','🧠 Confidence: *'+(Number.isFinite(confidence)?confidence:0)+'/100*','',gate('MSS/BOS',mss),gate('Liquidity',liquidity),gate('FVG/OB',fvg||ob),gate('MTF',mtf),'','🎯 Entry Zone: *'+zoneText+'*','🛑 SL: *WAIT*','🎯 TP1: *WAIT*','🎯 TP2: *WAIT*','🎯 TP3: *WAIT*','', '🤖 AI: *'+aiDecision+'* | '+(Number.isFinite(aiConfidence)?aiConfidence:0)+'/100 | '+agreement,'🔒 *WAIT — NO ORDER AUTHORIZED*','🏦 '+broker+' | Quote: '+age+'s'].join('\\n');",
    '}', ''
  ].join('\\n');
  const pattern=/function\\s+telegramWaitText\\s*\\(a\\)\\s*\\{[\\s\\S]*?\\n\\}\\s*(?=\\n\\s*function\\s+)/;
  if(pattern.test(source)) source=source.replace(pattern,waitSource);
  else throw new Error('telegramWaitText anchor not found');
  return source;
}`;

  source = source.slice(0, start) + replacement + source.slice(end);
  fs.writeFileSync(LAUNCHER, source, 'utf8');
  console.log('[V-TRADE TELEGRAM] compact formatter V3 installed');
}

try { patch(); } catch (e) { console.error('[V-TRADE TELEGRAM] compact formatter V3 failed:', e.stack || e.message); throw e; }
