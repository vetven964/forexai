// V-TRADE AI — Telegram gate diagnostic (non-invasive)
'use strict';
const fs = require('fs');
const path = require('path');
const serverFile = path.join(__dirname, 'server.js');
const marker = 'VTRADE_TELEGRAM_GATE_DIAGNOSTIC_V1';

function value(v) {
  if (v === true) return 'PASS';
  if (v === false) return 'WAIT';
  if (v == null || v === '') return 'MISSING';
  return String(v);
}

function diagnose(a) {
  const c = a && a.confirmations || {};
  const wf = a && a.workflow || {};
  const ict = a && a.ict || {};
  const gates = {
    'MSS/BOS': value(c.mssBos ?? c.mss ?? ict.mssBos ?? a.mssBos),
    'Liquidity': value(c.liquiditySweep ?? c.liquidity ?? ict.liquiditySweep ?? a.liquiditySweep),
    'FVG': value(c.fvg ?? c.fvgOb ?? ict.fvg ?? a.fvg),
    'OB': value(c.ob ?? ict.ob ?? a.ob),
    'MTF': value(c.mtf ?? c.mtfAlignment ?? wf.mtf ?? a.mtf),
    'Entry Zone': value(c.entryZone ?? c.zone ?? wf.entryZone ?? a.entryZone),
    'RR': value(c.rr ?? c.riskReward ?? wf.riskReward ?? a.riskReward),
    'AI Confirm': value(c.aiConfirmation ?? c.aiConfirm ?? a.aiConfirmation ?? a.aiConfirm)
  };
  const failed = Object.entries(gates).filter(([,v]) => v !== 'PASS');
  console.log('[V-TRADE GATES] ' + Object.entries(gates).map(([k,v]) => k + '=' + v).join(' | '));
  console.log('[V-TRADE GATES] result=' + (failed.length ? 'WAIT' : 'PASS') + ' | failed=' + (failed.length ? failed.map(([k]) => k).join(',') : 'none'));
  return gates;
}

try {
  if (!fs.existsSync(serverFile)) throw new Error('server.js not found');
  let source = fs.readFileSync(serverFile, 'utf8');
  if (!source.includes(marker)) {
    const needle = "console.log('[TELEGRAM AUTO] Scan OK | signal=' + signal + ' | bias=' + bias + ' | score=' + score + ' | status=' + status + ' | gates=' + gates + ' | sent=' + sent);";
    const replacement = "globalThis.__vtradeGateDiagnose = globalThis.__vtradeGateDiagnose || " + diagnose.toString() + ";\n" + needle;
    if (source.includes(needle)) {
      source = source.replace(needle, replacement);
      source = '// ' + marker + '\n' + source;
      fs.writeFileSync(serverFile, source, 'utf8');
      console.log('[V-TRADE GATES] diagnostic hook installed');
    } else {
      console.warn('[V-TRADE GATES] Scan OK log anchor not found; no source mutation performed');
    }
  }
} catch (e) {
  console.error('[V-TRADE GATES] diagnostic install failed:', e.stack || e.message);
}

require('./server-launcher.js');
