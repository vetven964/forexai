// V-TRADE Telegram final presentation hotfix
// Patches the formatter AFTER Local ICT runtime prepares server.js.
// Presentation only: never changes signal gates or authorization.
'use strict';

const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.resolve(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_FINAL_FORMAT_V2';

function install() {
  if (!fs.existsSync(SERVER_FILE)) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: server.js missing');
    return;
  }

  let source = fs.readFileSync(SERVER_FILE, 'utf8');
  if (source.includes(MARKER)) {
    console.log('[V-TRADE TELEGRAM] final trade formatter V2 already active');
    return;
  }

  const start = source.indexOf('function telegramTierText(a) {');
  if (start < 0) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: telegramTierText not found');
    return;
  }
  const end = source.indexOf('\nfunction ', start + 1);
  if (end < 0) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: formatter boundary not found');
    return;
  }

  const fn = `// ${MARKER}\nfunction telegramTierText(a) {
  const n = x => Number.isFinite(Number(x)) ? Number(x).toFixed(2) : 'WAIT';
  const signal = String(a?.signal || a?.action || 'WAIT').toUpperCase();
  const bias = String(a?.bias || a?.directionBand || 'NEUTRAL').toUpperCase();
  const score = Number(a?.directionScore ?? a?.aiScore ?? a?.setupScore ?? 0);
  const confidence = Number(a?.confidence ?? a?.score?.confidence ?? 0);
  const price = n(a?.livePrice ?? a?.price ?? a?.bid ?? a?.ask);

  // CRITICAL: only the canonical engine authorization may produce a trade card.
  // A directional BULLISH/BEARISH bias or setupReady alone is never authorization.
  const authorized = a?.tradeAuthorized === true && (signal === 'BUY' || signal === 'SELL');
  const strong = a?.strongTrade === true && authorized;
  const type = authorized
    ? (signal === 'BUY' ? (strong ? 'UPTRADE STRONG LONG' : 'UPTRADE NOW') : (strong ? 'DOWNTRADE STRONG SHORT' : 'DOWNTRADE NOW'))
    : (bias === 'BULLISH' ? 'WAIT — BUY BIAS' : bias === 'BEARISH' ? 'WAIT — SELL BIAS' : 'WAIT — NO ENTRY');
  const icon = authorized ? (signal === 'BUY' ? '🟢' : '🔴') : '🟡';
  const z = a?.entryZone || a?.candidateZone || a?.referenceZone || a?.zone || {};
  const zone = authorized && Number.isFinite(Number(z?.low)) && Number.isFinite(Number(z?.high)) ? n(z.low) + '–' + n(z.high) : 'WAIT';
  const entry = authorized ? n(a?.entry ?? a?.entryPrice) : 'WAIT';
  const sl = authorized ? n(a?.stopLoss ?? a?.sl) : 'WAIT';
  const tp = Array.isArray(a?.takeProfit) ? a.takeProfit : Array.isArray(a?.tp) ? a.tp : [];
  const tp1 = authorized ? n(a?.tp1 ?? tp[0]) : 'WAIT';
  const tp2 = authorized ? n(a?.tp2 ?? tp[1]) : 'WAIT';
  const tp3 = authorized ? n(a?.tp3 ?? tp[2]) : 'WAIT';
  const rr = authorized ? String(a?.rr || a?.riskReward || 'WAIT') : 'WAIT';
  const g = a?.gates || a?.confirmations || {};
  const yes = v => v === true ? '✅' : '❌';
  const mtfOk = a?.mtf?.length === 4 || a?.mtfAligned === true;
  const mssOk = g.mss === true || g.bos === true || g.mssFresh === true || g.bosFresh === true;
  const liqOk = g.liquiditySweep === true || g.liquidity === true;
  const fvgObOk = g.fvg === true || g.orderBlock === true || g.freshFvg === true || g.freshOb === true;

  const lines = [
    '🤖 *V TRADE AI — ADVANCED ICT SIGNAL*',
    '',
    icon + ' *XAUUSD — ' + type + '*',
    '💰 Price: *' + price + '*',
    '📈 Bias: *' + bias + '*',
    '📊 Direction Score: *' + (Number.isFinite(score) ? Math.round(score) : 0) + '/100*',
    '🧠 Confidence: *' + (Number.isFinite(confidence) ? Math.round(confidence) : 0) + '/100*'
  ];

  if (authorized) {
    lines.push('',
      '🎯 Entry Zone: *' + zone + '*',
      '🟢 Entry: *' + entry + '*',
      '🛑 SL: *' + sl + '*',
      '🎯 TP1: *' + tp1 + '*',
      '🎯 TP2: *' + tp2 + '*',
      '🎯 TP3: *' + tp3 + '*',
      '📐 RR: *' + rr + '*',
      '',
      'MSS/BOS: *' + yes(mssOk) + '*',
      'Liquidity: *' + yes(liqOk) + '*',
      'FVG/OB: *' + yes(fvgObOk) + '*',
      'MTF: *' + yes(mtfOk) + '*',
      '',
      '🔐 *ORDER AUTHORIZED — ALL REQUIRED GATES PASSED*'
    );
  } else {
    lines.push('',
      '🎯 Entry Zone: *WAIT*',
      '🟢 Entry: *WAIT*',
      '🛑 SL: *WAIT*',
      '🎯 TP1: *WAIT*',
      '🎯 TP2: *WAIT*',
      '🎯 TP3: *WAIT*',
      '📐 RR: *WAIT*',
      '',
      'MSS/BOS: *' + yes(mssOk) + '*',
      'Liquidity: *' + yes(liqOk) + '*',
      'FVG/OB: *' + yes(fvgObOk) + '*',
      'MTF: *' + yes(mtfOk) + '*',
      '',
      '🛡️ *WAIT — NO ORDER AUTHORIZED*'
    );
  }
  return lines.join('\\n');
}
`;

  source = source.slice(0, start) + fn + source.slice(end);
  fs.writeFileSync(SERVER_FILE, source, 'utf8');
  console.log('[V-TRADE TELEGRAM] final trade formatter V2 installed');
}

try { install(); } catch (e) {
  console.error('[V-TRADE TELEGRAM] final formatter failed:', e.stack || e.message);
  process.exitCode = 1;
}
