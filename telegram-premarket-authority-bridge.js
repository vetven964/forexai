'use strict';

// V-TRADE Telegram ↔ Pre-Market authority bridge.
// The production Telegram scanner must evaluate the same Pre-Market ICT result
// shown by the dashboard before any BUY/SELL delivery is allowed.
const fs = require('fs');
const path = require('path');
const SERVER = path.join(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_PREMARKET_AUTHORITY_BRIDGE_V2';

function inject(source) {
  if (!source) return source;
  const needle = 'async function runTelegramAutoAlertScan() {';
  if (!source.includes(needle)) {
    console.warn('[V-TRADE TELEGRAM] authority bridge: scanner function not found; delivery guard remains fail-closed');
    return source;
  }
  if (source.includes(MARKER)) return source;
  const bridge = `
// ${MARKER}
async function vtradeLoadPreMarketAuthority() {
  const port = Number(process.env.PORT || 10000);
  try {
    const r = await fetch('http://127.0.0.1:' + port + '/api/pre-market/xauusd', {signal:AbortSignal.timeout(12000)});
    const data = await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));
    globalThis.__vtradePreMarketGate = data;
    console.log('[TELEGRAM AUTO] Pre-Market authority snapshot | success=' + !!data?.success + ' | gates=' + String(data?.processing?.gatesPassed ?? '—') + '/' + String(data?.processing?.gatesRequired ?? 10) + ' | execution=' + String(data?.execution?.status || 'WAIT') + ' | reason=' + String(data?.execution?.reason || data?.error || '—'));
    return data;
  } catch(e) {
    const data={success:false,error:String(e?.message||e),code:'PREMARKET_UNAVAILABLE'};
    globalThis.__vtradePreMarketGate=data;
    console.error('[TELEGRAM AUTO] Pre-Market authority unavailable | fail-closed | ' + data.error);
    return data;
  }
}
`;
  // Expose the real scanner for continuity diagnostics only. The guard does not
  // invoke it, so the production interval cannot create duplicate scans/delivery.
  const call = "async function runTelegramAutoAlertScan() {\\n  globalThis.vtradeRunTelegramScan = runTelegramAutoAlertScan;\\n  globalThis.__vtradeTelegramScannerExposed = true;\\n  const preMarketAuthority = await vtradeLoadPreMarketAuthority();\\n  if (!preMarketAuthority?.success) console.warn('[TELEGRAM AUTO] scanner continues for diagnostics; delivery remains blocked');";
  return source.replace(needle, bridge + '\n' + call);
}

try {
  if (fs.existsSync(SERVER)) {
    const before = fs.readFileSync(SERVER, 'utf8');
    const after = inject(before);
    if (after !== before) {
      fs.writeFileSync(SERVER, after, 'utf8');
      console.log('[V-TRADE TELEGRAM] Pre-Market authority bridge V2 installed');
    }
  }
} catch (e) {
  console.error('[V-TRADE TELEGRAM] authority bridge failed:', e.stack || e.message);
  throw e;
}

module.exports = { inject };
