// V-TRADE AI — canonical Telegram COMPACT renderer V9
// Final compact presentation only. Execution logic remains authoritative elsewhere.
'use strict';

const fs = require('fs');
const Module = require('module');
const path = require('path');
const SERVER_FILE = path.resolve(__dirname, 'server.js');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '';
}
function confirmed(v) {
  return v === true || v === 1 || String(v).toLowerCase() === 'true' || String(v).toUpperCase() === 'PASS';
}
function telegramWaitText(a) {
  a = a || {};
  const src = a.analysis || a.data || a.result || a.preMarket || a;
  const signal = String(src.signal || src.action || a.signal || a.action || 'WAIT').toUpperCase();
  const bias = String(src.bias || src.directionBand || a.bias || a.directionBand || 'NEUTRAL').toUpperCase();
  const score = Number(src.directionScore ?? src.aiScore ?? src.setupScore ?? a.directionScore);
  const confidence = Number(src.confidence ?? a.confidence ?? 0);
  const price = num(src.livePrice ?? src.price ?? a.livePrice ?? a.price ?? a.bid);
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
  const mtf = !blocked(/MTF.*not aligned|MTF.*incomplete|timeframes.*available|MTF.*history.*not/i) && (
    confirmed(src.mtfReady) || confirmed(src.mtf?.ready) || confirmed(src.mtf?.complete) ||
    confirmed(src.mtfAligned) || confirmed(src.mtfOk) || confirmed(src.mtfAlignmentOk) ||
    confirmed(g.mtfOk) || confirmed(g.mtfAlignmentOk) || mtfReady ||
    (Number(src.available) >= 4 && Number(src.required) >= 4) ||
    (Number(a.available) >= 4 && Number(a.required) >= 4) ||
    src.complete === true || src.mtf?.complete === true || src.canonical?.mtfReady === true ||
    a.complete === true || a.canonical?.mtfReady === true
  );
  const mss = !blocked(/Fresh M5 MSS not confirmed|Fresh M5 MSS\/BOS structure break not confirmed/i) && (
    confirmed(g.mss) || confirmed(g.bos) || confirmed(g.mssOk) || confirmed(g.bosOk) ||
    confirmed(g.structureAgreement) || confirmed(ict.mss?.confirmed) || confirmed(ict.bos?.confirmed)
  );
  const liq = !blocked(/Fresh liquidity sweep not confirmed/i) && (
    confirmed(g.liquiditySweep) || confirmed(g.liquiditySweepOk) || confirmed(g.liquidityOk) ||
    confirmed(g.sweepOk) || confirmed(ict.liquiditySweep?.confirmed)
  );
  const fvg = !blocked(/No fresh aligned FVG\/OB/i) && (confirmed(g.fvg) || confirmed(g.fvgOk) || confirmed(ict.fvg?.confirmed));
  const ob = !blocked(/No fresh aligned FVG\/OB/i) && (confirmed(g.orderBlock) || confirmed(g.orderBlockOk) || confirmed(g.obOk) || confirmed(ict.orderBlock?.confirmed));

  // Bias is informational only. BUY/SELL requires the authoritative tradeAuthorized gate.
  const authorized = src.tradeAuthorized === true &&
    (signal === 'BUY' || signal === 'SELL') && mtf && mss && liq && (fvg || ob);
  const action = authorized ? (signal === 'BUY' ? '🟢 BUY' : '🔴 SELL') : '🟡 WAIT';
  const entry = authorized ? num(src.entry ?? src.entryPrice ?? a.entry) : 'WAIT';
  const sl = authorized ? num(src.stopLoss ?? src.sl ?? a.stopLoss) : 'WAIT';
  const tp = Array.isArray(src.takeProfit) ? src.takeProfit : (Array.isArray(src.tp) ? src.tp : (Array.isArray(a.takeProfit) ? a.takeProfit : []));
  const tp1 = authorized ? num(src.tp1 ?? tp[0]) : 'WAIT';
  const tp2 = authorized ? num(src.tp2 ?? tp[1]) : 'WAIT';
  const tp3 = authorized ? num(src.tp3 ?? tp[2]) : 'WAIT';

  return [
    '🤖 *V TRADE AI — XAUUSD*',
    '',
    '💰 ' + (price || 'WAIT'),
    action,
    '📈 ' + bias + ' | Score ' + (Number.isFinite(score) ? Math.round(score) : 0) + ' | Confidence ' + (Number.isFinite(confidence) ? Math.round(confidence) : 0),
    '',
    '⏱ LIVE MARKET',
    '🔎 ICT: ' + (authorized ? '10/10' : (mtf ? 'ACTIVE' : 'WAIT')),
    '',
    '🎯 Entry: ' + entry,
    '🛑 SL: ' + sl,
    '🎯 TP1: ' + tp1 + ' | TP2: ' + tp2 + ' | TP3: ' + tp3,
    '',
    authorized ? '✅ TRADE AUTHORIZED' : '⏳ NO ORDER'
  ].join('\n');
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
console.log('[V-TRADE TELEGRAM] canonical V9 compact format | BUY/SELL only after authorization | hidden ICT internals');
