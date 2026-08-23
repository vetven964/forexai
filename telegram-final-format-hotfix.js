// V-TRADE AI — canonical Telegram COMPACT renderer
// Runtime enforcer: prevents server-launcher legacy WAIT renderer from
// replacing the compact message with the old long format.
'use strict';

const fs = require('fs');
const Module = require('module');
const path = require('path');
const SERVER_FILE = path.resolve(__dirname, 'server.js');

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
  const signal = String(a.signal || a.action || 'WAIT').toUpperCase();
  const bias = String(a.bias || a.directionBand || 'NEUTRAL').toUpperCase();
  const score = Number(a.directionScore != null ? a.directionScore : (a.aiScore != null ? a.aiScore : a.setupScore));
  const confidence = Number(a.confidence != null ? a.confidence : 0);
  const price = num(a.livePrice != null ? a.livePrice : (a.price != null ? a.price : a.bid));
  const g = a.gates || a.confirmations || {};
  const ict = a.ict || {};
  const reasons = Array.isArray(a.score?.blockedReasons) ? a.score.blockedReasons : [];
  const blocked = p => reasons.some(x => p.test(String(x || '')));
  const rows = a.mtf?.timeframes || a.timeframes || a.frames || {};
  const mtfReady = ['M5','M15','H1','H4'].every(tf => {
    const r = rows[tf] || rows[tf.toLowerCase()] || {};
    return r.ready === true || Number(r.bars || r.feedBars || r.candles?.length || 0) >= 30;
  });
  const mtf = !blocked(/MTF.*not aligned|MTF.*incomplete|timeframes.*available|MTF.*history.*not/i) &&
    (confirmed(a.mtfAligned) || confirmed(a.mtfOk) || confirmed(a.mtfAlignmentOk) || confirmed(g.mtfOk) ||
     confirmed(g.mtfAlignmentOk) || mtfReady || (Number(a.available) >= 4 && Number(a.required) >= 4) ||
     a.complete === true || a.mtf?.complete === true || a.canonical?.mtfReady === true);
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
  const authorized = a.tradeAuthorized === true && (signal === 'BUY' || signal === 'SELL') && mtf && mss && liq && (fvg || ob);
  const action = authorized
    ? (signal === 'BUY' ? '🟢 BUY — AUTHORIZED' : '🔴 SELL — AUTHORIZED')
    : (bias === 'BULLISH' ? '🟡 WAIT — BUY BIAS' : bias === 'BEARISH' ? '🟡 WAIT — SELL BIAS' : '🟡 WAIT');
  const ai = a.aiConfirmation || a.ai || {};
  const aiDecision = String(ai.decision || a.aiDecision || 'WAIT').toUpperCase();
  const aiConfidence = Number(ai.confidence != null ? ai.confidence : (a.aiConfidence != null ? a.aiConfidence : 0));
  const agreement = String(ai.agreement || a.aiAgreement || 'NEUTRAL').toUpperCase();
  const broker = String(a.broker || 'VT Markets MT5');
  const age = Number(a.quoteAge != null ? a.quoteAge : (a.feedAgeSec != null ? a.feedAgeSec : 0));
  const z = a.entryZone || a.executionZone || a.candidateZone || a.referenceZone || a.zone || {};
  const zone = Number.isFinite(Number(z.low)) && Number.isFinite(Number(z.high)) ? num(z.low) + '–' + num(z.high) : 'WAIT';
  const entry = authorized ? num(a.entry != null ? a.entry : a.entryPrice) : 'WAIT';
  const sl = authorized ? num(a.stopLoss != null ? a.stopLoss : a.sl) : 'WAIT';
  const tp = Array.isArray(a.takeProfit) ? a.takeProfit : (Array.isArray(a.tp) ? a.tp : []);
  const tp1 = authorized ? num(a.tp1 != null ? a.tp1 : tp[0]) : 'WAIT';
  const tp2 = authorized ? num(a.tp2 != null ? a.tp2 : tp[1]) : 'WAIT';
  const tp3 = authorized ? num(a.tp3 != null ? a.tp3 : tp[2]) : 'WAIT';

  return [
    '🤖 *V TRADE AI — XAUUSD*',
    '💰 Price: *' + price + '* | 📈 ' + bias,
    '⚡ *' + action + '* | Score ' + (Number.isFinite(score) ? Math.round(score) : 0) + '/100 | Conf ' + (Number.isFinite(confidence) ? Math.round(confidence) : 0) + '/100',
    '🔎 ICT: MSS ' + yn(mss) + ' | LIQ ' + yn(liq) + ' | FVG ' + yn(fvg) + ' | OB ' + yn(ob) + ' | MTF ' + yn(mtf),
    '🎯 Zone: *' + zone + '* | Entry: *' + entry + '* | SL: *' + sl + '*',
    '🎯 TP1: *' + tp1 + '* | TP2: *' + tp2 + '* | TP3: *' + tp3 + '*',
    '🤖 AI: *' + aiDecision + '* | ' + (Number.isFinite(aiConfidence) ? Math.round(aiConfidence) : 0) + '/100 | ' + agreement,
    authorized ? '🔐 *ORDER AUTHORIZED*' : '🛡️ *WAIT — NO ORDER AUTHORIZED*',
    '🏦 ' + broker + ' | Quote ' + (Number.isFinite(age) ? age : 0) + 's'
  ].join('\n');
}

// The production launcher installs its own Module loader and contains the old
// long WAIT renderer. Replace that function in the source before handing the
// source back to the launcher's loader. Renaming the function also prevents
// patchWaitCard() from matching and overwriting it again.
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
      if (path.resolve(String(file)) === SERVER_FILE) {
        return encoding ? compactSource : Buffer.from(compactSource, 'utf8');
      }
      return originalRead.apply(fs, arguments);
    };
    try {
      return previousLoader(mod, filename);
    } finally {
      fs.readFileSync = originalRead;
    }
  };
  loader.__vtradeCompactEnforced = true;
  Module._extensions['.js'] = loader;
}

module.exports = { telegramWaitText };
console.log('[V-TRADE TELEGRAM] canonical COMPACT renderer enforced | legacy long WAIT renderer blocked');
