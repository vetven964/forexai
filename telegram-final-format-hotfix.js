// V-TRADE Telegram final presentation hotfix
// Patches the formatter AFTER Local ICT runtime prepares server.js.
// Presentation only: never changes signal gates or authorization.
'use strict';

const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.resolve(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_FINAL_FORMAT_V1';

function install() {
  if (!fs.existsSync(SERVER_FILE)) {
    console.warn('[V-TRADE TELEGRAM] final formatter skipped: server.js missing');
    return;
  }

  let source = fs.readFileSync(SERVER_FILE, 'utf8');
  if (source.includes(MARKER)) {
    console.log('[V-TRADE TELEGRAM] final trade formatter already active');
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
  const bias = String(a?.bias || a?.directionBand || 'NEUTRAL').toUpperCase();
  const score = Number(a?.directionScore ?? a?.aiScore ?? a?.setupScore ?? 0);
  const confidence = Number(a?.confidence ?? a?.score?.confidence ?? 0);
  const price = n(a?.livePrice ?? a?.price ?? a?.bid ?? a?.ask);
  const authorized = a?.tradeAuthorized === true || a?.setupReady === true;
  const strong = a?.strongTrade === true || (authorized && confidence >= 85 && score >= 80);
  const type = bias === 'BULLISH' ? (strong ? 'UPTRADE STRONG LONG' : 'UPTRADE BULLISH') : bias === 'BEARISH' ? (strong ? 'DOWNTRADE STRONG SHORT' : 'DOWNTRADE BEARISH') : 'WAIT';
  const icon = bias === 'BULLISH' ? '🟢' : bias === 'BEARISH' ? '🔴' : '🟡';
  const z = a?.entryZone || a?.candidateZone || a?.referenceZone || a?.zone || {};
  const zone = Number.isFinite(Number(z?.low)) && Number.isFinite(Number(z?.high)) ? n(z.low) + '–' + n(z.high) : 'WAIT';
  const entry = n(a?.entry ?? a?.entryPrice);
  const sl = n(a?.stopLoss ?? a?.sl);
  const tp = Array.isArray(a?.takeProfit) ? a.takeProfit : Array.isArray(a?.tp) ? a.tp : [];
  const tp1 = n(a?.tp1 ?? tp[0]);
  const tp2 = n(a?.tp2 ?? tp[1]);
  const tp3 = n(a?.tp3 ?? tp[2]);
  const rr = String(a?.rr || a?.riskReward || (strong ? '1:2.5' : 'WAIT'));
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
      '🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*'
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
  console.log('[V-TRADE TELEGRAM] final trade formatter V1 installed');
}

try { install(); } catch (e) {
  console.error('[V-TRADE TELEGRAM] final formatter failed:', e.stack || e.message);
  process.exitCode = 1;
}
