// V-TRADE Telegram final presentation hotfix V5
// Khmer + English presentation; preserves fail-closed ICT authorization.
'use strict';

const fs = require('fs');
const path = require('path');
const SERVER_FILE = path.resolve(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_FINAL_FORMAT_V5';

function install() {
  if (!fs.existsSync(SERVER_FILE)) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: server.js missing');
    return;
  }

  let source = fs.readFileSync(SERVER_FILE, 'utf8');
  if (source.indexOf(MARKER) >= 0) {
    console.log('[V-TRADE TELEGRAM] final trade formatter V5 already active');
    return;
  }

  const start = source.indexOf('function telegramTierText(a) {');
  if (start < 0) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: telegramTierText not found');
    return;
  }

  const end = source.indexOf('\nfunction ', start + 10);
  if (end < 0) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: formatter boundary not found');
    return;
  }

  const fn = [
    '// ' + MARKER,
    'function telegramTierText(a) {',
    '  a = a || {};',
    '  function num(v) { var n = Number(v); return Number.isFinite(n) ? n.toFixed(2) : "WAIT"; }',
    '  function ok(v) { return v === true ? "✅" : "❌"; }',
    '  var signal = String(a.signal || a.action || "WAIT").toUpperCase();',
    '  var bias = String(a.bias || a.directionBand || "NEUTRAL").toUpperCase();',
    '  var score = Number(a.directionScore != null ? a.directionScore : (a.aiScore != null ? a.aiScore : a.setupScore));',
    '  var confidence = Number(a.confidence != null ? a.confidence : 0);',
    '  var price = num(a.livePrice != null ? a.livePrice : (a.price != null ? a.price : a.bid));',
    '  var g = a.gates || a.confirmations || {};',
    '  var mtfOk = a.mtfAligned === true || (Array.isArray(a.mtf) && a.mtf.length >= 4);',
    '  var mssOk = g.mss === true || g.bos === true;',
    '  var liqOk = g.liquiditySweep === true;',
    '  var fvgOk = g.fvg === true;',
    '  var obOk = g.orderBlock === true;',
    '  var canonical = a.tradeAuthorized === true;',
    '  var sideOk = signal === "BUY" || signal === "SELL";',
    '  var authorized = canonical && sideOk && mtfOk && mssOk && liqOk && fvgOk && obOk;',
    '  var strong = authorized && a.strongTrade === true;',
    '  var label = authorized ? (signal === "BUY" ? (strong ? "UPTRADE — STRONG LONG" : "UPTRADE — BUY") : (strong ? "DOWNTRADE — STRONG SHORT" : "DOWNTRADE — SELL")) : (bias === "BULLISH" ? "UPTRADE BULLISH — WAIT" : (bias === "BEARISH" ? "DOWNTRADE BEARISH — WAIT" : "WAIT — NO ENTRY"));',
    '  var icon = authorized ? (signal === "BUY" ? "🟢" : "🔴") : "🟡";',
    '  var z = a.entryZone || a.candidateZone || a.referenceZone || a.zone || {};',
    '  var zone = authorized && Number.isFinite(Number(z.low)) && Number.isFinite(Number(z.high)) ? num(z.low) + "–" + num(z.high) : "WAIT";',
    '  var entry = authorized ? num(a.entry != null ? a.entry : a.entryPrice) : "WAIT";',
    '  var sl = authorized ? num(a.stopLoss != null ? a.stopLoss : a.sl) : "WAIT";',
    '  var tp = Array.isArray(a.takeProfit) ? a.takeProfit : (Array.isArray(a.tp) ? a.tp : []);',
    '  var tp1 = authorized ? num(a.tp1 != null ? a.tp1 : tp[0]) : "WAIT";',
    '  var tp2 = authorized ? num(a.tp2 != null ? a.tp2 : tp[1]) : "WAIT";',
    '  var tp3 = authorized ? num(a.tp3 != null ? a.tp3 : tp[2]) : "WAIT";',
    '  var rr = authorized ? String(a.rr || a.riskReward || "WAIT") : "WAIT";',
    '  return [',
    '    "🤖 *V TRADE AI — ADVANCED ICT SIGNAL*", "",',
    '    icon + " *" + label + "*",',
    '    "💰 Price / តម្លៃ: *" + price + "*",',
    '    "📈 Bias / ទិសដៅ: *" + bias + "*",',
    '    "📊 Direction Score / ពិន្ទុទិសដៅ: *" + (Number.isFinite(score) ? Math.round(score) : 0) + "/100*",',
    '    "🧠 Confidence / ទំនុកចិត្ត: *" + (Number.isFinite(confidence) ? Math.round(confidence) : 0) + "/100*", "",',
    '    "🎯 Entry Zone / តំបន់ចូល: *" + zone + "*",',
    '    "🟢 Entry / ចូល: *" + entry + "*",',
    '    "🛑 SL / Stop Loss: *" + sl + "*",',
    '    "🎯 TP1 / គោលដៅ 1: *" + tp1 + "*",',
    '    "🎯 TP2 / គោលដៅ 2: *" + tp2 + "*",',
    '    "🎯 TP3 / គោលដៅ 3: *" + tp3 + "*",',
    '    "📐 RR / Risk Reward: *" + rr + "*", "",',
    '    "MSS/BOS: *" + ok(mssOk) + "*",',
    '    "Liquidity / សាច់ប្រាក់: *" + ok(liqOk) + "*",',
    '    "FVG: *" + ok(fvgOk) + "*",',
    '    "OB: *" + ok(obOk) + "*",',
    '    "MTF: *" + ok(mtfOk) + "*", "",',
    '    authorized ? "🔐 *ORDER AUTHORIZED — អនុញ្ញាតបញ្ជា*" : "🛡️ *WAIT — រង់ចាំ | NO ORDER AUTHORIZED*"',
    '  ].join("\\n");',
    '}',
    ''
  ].join('\n');

  source = source.slice(0, start) + fn + source.slice(end);
  fs.writeFileSync(SERVER_FILE, source, 'utf8');
  console.log('[V-TRADE TELEGRAM] final trade formatter V5 installed | Khmer + English | fail-closed gates');
}

try {
  install();
} catch (e) {
  console.error('[V-TRADE TELEGRAM] final formatter failed:', e && e.stack ? e.stack : e.message);
  process.exitCode = 1;
}
