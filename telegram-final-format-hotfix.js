// V-TRADE AI — canonical Telegram COMPACT renderer
// Runtime enforcer: prevents server-launcher legacy WAIT renderer from
// replacing the compact message with the old long format.
'use strict';

const fs = require('fs');
const Module = require('module');
const path = require('path');
const SERVER_FILE = path.resolve(__dirname, 'server.js');

// Display-only switch. Nothing is deleted from the analysis contract;
// secondary details are simply hidden from the normal Telegram card.
const SHOW_OPTIONAL_DETAILS = false;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : 'WAIT';
}
function confirmed(v) {
  return v === true || v === 1 || String(v).toLowerCase() === 'true' || String(v).toUpperCase() === 'PASS';
}
function yn(v) { return v ? '✅' : '❌'; }

function telegramWaitText(a) {
  a = a || {};
  const src = a.analysis || a.data || a.result || a.preMarket || a;
  const signal = String(src.signal || src.action || a.signal || a.action || 'WAIT').toUpperCase();
  const bias = String(src.bias || src.directionBand || a.bias || a.directionBand || 'NEUTRAL').toUpperCase();
  const score = Number(src.directionScore != null ? src.directionScore : (src.aiScore != null ? src.aiScore : (src.setupScore != null ? src.setupScore : a.directionScore)));
  const confidence = Number(src.confidence != null ? src.confidence : (a.confidence != null ? a.confidence : 0));
  const price = num(src.livePrice != null ? src.livePrice : (src.price != null ? src.price : (a.livePrice != null ? a.livePrice : (a.price != null ? a.price : a.bid))));
  const g = src.gates || src.confirmations || a.gates || a.confirmations || {};
  const ict = src.ict || a.ict || {};
  const reasons = Array.isArray(src.score?.blockedReasons) ? src.score.blockedReasons : (Array.isArray(a.score?.blockedReasons) ? a.score.blockedReasons : []);
  const blocked = p => reasons.some(x => p.test(String(x || '')));
  const rows = src.mtf?.timeframes || src.mtf?.rows || src.timeframes || src.frames || a.mtf?.timeframes || a.timeframes || a.frames || {};
  const tfReady = tf => {
    const r = rows[tf] || rows[tf.toLowerCase()] || {};
    return r.ready === true || Number(r.bars || r.feedBars || r.candles?.length || r.history?.length || 0) >= 30;
  };
  const mtfReady = ['M5','M15','H1','H4'].every(tfReady);
  const mtf = !blocked(/MTF.*not aligned|MTF.*incomplete|timeframes.*available|MTF.*history.*not/i) &&
    (confirmed(src.mtfReady) || confirmed(src.mtf?.ready) || confirmed(src.mtf?.complete) ||
     confirmed(src.mtfAligned) || confirmed(src.mtfOk) || confirmed(src.mtfAlignmentOk) ||
     confirmed(g.mtfOk) || confirmed(g.mtfAlignmentOk) || mtfReady ||
     (Number(src.available) >= 4 && Number(src.required) >= 4) ||
     (Number(a.available) >= 4 && Number(a.required) >= 4) ||
     src.complete === true || src.mtf?.complete === true || src.canonical?.mtfReady === true ||
     a.complete === true || a.canonical?.mtfReady === true ||
     (src.feedReady === true && mtfReady));
  const mss = !blocked(/Fresh M5 MSS not confirmed|Fresh M5 MSS\/BOS structure break not confirmed/i) &&
    (confirmed(g.mss) || confirmed(g.bos) || confirmed(g.mssOk) || confirmed(g.bosOk) ||
     confirmed(g.structureAgreement) || confirmed(ict.mss?.confirmed) || confirmed(ict.bos?.confirmed));
  const liq = !blocked(/Fresh liquidity sweep not confirmed/i) &&
    (confirmed(g.liquiditySweep) || confirmed(g.liquiditySweepOk) || confirmed(g.liquidityOk) ||
     confirmed(g.sweepOk) || confirmed(ict.liquiditySweep?.confirmed));
  const fvg = !blocked(/No fresh aligned FVG\/OB/i) &&
    (confirmed(g.fvg) || confirmed(g.fvgOk) || confirmed(ict.fvg?.confirmed));
  const ob = !blocked(/No fresh aligned FVG\/OB/i) &&
    (confirmed(g.orderBlock) || confirmed(g.orderBlockOk) || confirmed(g.obOk) || confirmed(ict.orderBlock?.confirmed));
  const authorized = src.tradeAuthorized === true && (signal === 'BUY' || signal === 'SELL') && mtf && mss && liq && (fvg || ob);
  const action = authorized
    ? (signal === 'BUY' ? '🟢 BUY — AUTHORIZED' : '🔴 SELL — AUTHORIZED')
    : (bias === 'BULLISH' ? '🟡 WAIT — BUY BIAS' : bias === 'BEARISH' ? '🟡 WAIT — SELL BIAS' : '🟡 WAIT');
  const ai = src.aiConfirmation || src.ai || a.aiConfirmation || a.ai || {};
  const aiDecision = String(ai.decision || src.aiDecision || a.aiDecision || 'WAIT').toUpperCase();
  const aiConfidence = Number(ai.confidence != null ? ai.confidence : (src.aiConfidence != null ? src.aiConfidence : (a.aiConfidence != null ? a.aiConfidence : 0)));
  const agreement = String(ai.agreement || src.aiAgreement || a.aiAgreement || 'NEUTRAL').toUpperCase();
  const broker = String(src.broker || a.broker || 'VT Markets MT5');
  const age = Number(src.quoteAge != null ? src.quoteAge : (src.feedAgeSec != null ? src.feedAgeSec : (a.quoteAge != null ? a.quoteAge : (a.feedAgeSec != null ? a.feedAgeSec : 0))));
  const z = src.entryZone || src.executionZone || src.candidateZone || src.referenceZone || src.zone || a.entryZone || a.executionZone || a.zone || {};
  const zone = Number.isFinite(Number(z.low)) && Number.isFinite(Number(z.high)) ? num(z.low) + '–' + num(z.high) : 'WAIT';
  const entry = authorized ? num(src.entry != null ? src.entry : (src.entryPrice != null ? src.entryPrice : a.entry)) : 'WAIT';
  const sl = authorized ? num(src.stopLoss != null ? src.stopLoss : (src.sl != null ? src.sl : a.stopLoss)) : 'WAIT';
  const tp = Array.isArray(src.takeProfit) ? src.takeProfit : (Array.isArray(src.tp) ? src.tp : (Array.isArray(a.takeProfit) ? a.takeProfit : []));
  const tp1 = authorized ? num(src.tp1 != null ? src.tp1 : tp[0]) : 'WAIT';
  const tp2 = authorized ? num(src.tp2 != null ? src.tp2 : tp[1]) : 'WAIT';
  const tp3 = authorized ? num(src.tp3 != null ? src.tp3 : tp[2]) : 'WAIT';

  // Keep all values above in the canonical contract. Only the presentation is hidden.
  const lines = [
    '🤖 *V TRADE AI — XAUUSD*',
    '💰 Price: *' + price + '* | 📈 ' + bias,
    '⚡ *' + action + '* | Score ' + (Number.isFinite(score) ? Math.round(score) : 0) + '/100 | Conf ' + (Number.isFinite(confidence) ? Math.round(confidence) : 0) + '/100',
    '🔎 ICT: MSS ' + yn(mss) + ' | LIQ ' + yn(liq) + ' | FVG ' + yn(fvg) + ' | OB ' + yn(ob) + ' | MTF ' + yn(mtf),
    '🎯 Zone: *' + zone + '* | Entry: *' + entry + '* | SL: *' + sl + '*',
    '🎯 TP1: *' + tp1 + '* | TP2: *' + tp2 + '* | TP3: *' + tp3 + '*',
    '🛡️ ' + (authorized ? '*ORDER AUTHORIZED*' : '*WAIT — NO ORDER AUTHORIZED*')
  ];

  // Optional technical details remain available to the formatter without being shown.
  if (SHOW_OPTIONAL_DETAILS) {
    lines.push('🤖 AI: *' + aiDecision + '* | ' + (Number.isFinite(aiConfidence) ? Math.round(aiConfidence) : 0) + '/100 | ' + agreement);
    lines.push('🏦 ' + broker + ' | Quote ' + (Number.isFinite(age) ? age : 0) + 's');
  }
  return lines.join('\n');
}

const previousLoader = Module._extensions['.js'];
if (previousLoader && !previousLoader.__vtradeCompactEnforced) {
  const loader = function vtradeCompactEnforcedLoader(mod, filename) {
    if (path.resolve(filename) !== SERVER_FILE) return previousLoader(mod, filename);
    const raw = fs.readFileSync(filename, 'utf8');
    let compactSource = raw.replace(/\btelegramWaitText\b/g, 'telegramWaitTextCompact');
    const fn = `function telegramWaitTextCompact(a) {\n  return require('./telegram-final-format-hotfix.js').telegramWaitText(a);\n}\n`;
    const pattern = /function\s+telegramWaitTextCompact\s*\(a\)\s*\{[\s\S]*?\n\}\s*(?=\n\s*function\s+)/;
    if (pattern.test(compactSource)) compactSource = compactSource.replace(pattern, fn);
    const originalRead = fs.readFileSync;
    fs.readFileSync = function patchedRead(file, encoding) {
      if (path.resolve(String(file)) === SERVER_FILE) return encoding ? compactSource : Buffer.from(compactSource, 'utf8');
      return originalRead.apply(fs, arguments);
    };
    try { return previousLoader(mod, filename); } finally { fs.readFileSync = originalRead; }
  };
  loader.__vtradeCompactEnforced = true;
  Module._extensions['.js'] = loader;
}

module.exports = { telegramWaitText };
console.log('[V-TRADE TELEGRAM] canonical COMPACT renderer enforced | legacy long WAIT renderer blocked | optional details hidden');
