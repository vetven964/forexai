'use strict';

// V-TRADE Telegram scanner safety/continuity guard.
// MT5 READY -> analysis scan must continue even when Telegram delivery is unavailable.
// V18: Pre-Market is the single ICT gate authority for Telegram delivery.
const INTERVAL_MS = Math.max(5000, Number(process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS || 15000));
let timer = null;
let running = false;
let scanSeq = 0;

function mt5Ready() {
  const feed = global.mt5FeedState || global.mt5State || global.MT5_STATE || null;
  if (!feed) return false;
  const counts = feed.historyCounts || feed.counts || {};
  return feed.connected === true && Number(counts.M5 || feed.M5 || 0) >= 200 && Number(counts.M15 || feed.M15 || 0) >= 200 && Number(counts.H1 || feed.H1 || 0) >= 200 && Number(counts.H4 || feed.H4 || 0) >= 200;
}

async function preMarketAuthority() {
  const port = Number(process.env.PORT || 10000);
  const url = `http://127.0.0.1:${port}/api/pre-market/xauusd`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const data = await r.json().catch(() => ({ success:false, error:'invalid-pre-market-json' }));
    globalThis.__vtradePreMarketGate = data;
    return data;
  } catch (e) {
    const data = { success:false, error:String(e?.message || e), code:'PREMARKET_UNAVAILABLE' };
    globalThis.__vtradePreMarketGate = data;
    return data;
  }
}

function gateValue(obj, keys) {
  for (const key of keys) {
    const v = obj?.[key];
    if (typeof v === 'boolean') return v ? 'PASS' : 'WAIT';
    if (typeof v === 'string' && v.trim()) return v.toUpperCase();
  }
  return 'N/A';
}

function diagnostics(result, pre) {
  if (!result || typeof result !== 'object') return;
  const c = result.confirmations || result.gates || result.ictGates || {};
  const pc = pre?.confirmations || pre?.gates || {};
  const mtf = result.mtfContract || result.coreMtf || result.mtf || {};
  const structure = result.structure || result.executionStructure || {};
  const sweep = result.sweep || result.liquiditySweep || {};
  const disp = result.displacement || result.candleDisplacement || {};
  const fvg = result.fvg || result.fvgZone || {};
  const ob = result.orderBlock || result.ob || {};
  const parts = [
    `MTF=${String(mtf.alignment || result.mtfAlignment || (pre?.complete ? 'READY' : 'WAIT'))}`,
    `MTF_BIAS=${String(mtf.bias || result.mtfBias || result.bias || pre?.bias || 'N/A')}`,
    `PM_GATES=${Number(pre?.processing?.gatesPassed ?? Object.values(pc).filter(v=>v===true).length)}/${Number(pre?.processing?.gatesRequired || 10)}`,
    `SWEEP=${gateValue(pc, ['liquiditySweep','sweep','liquidity']) !== 'N/A' ? gateValue(pc, ['liquiditySweep','sweep','liquidity']) : gateValue(c, ['liquiditySweep','sweep','liquidity'])}`,
    `MSS=${gateValue(pc, ['mss','marketStructureShift']) !== 'N/A' ? gateValue(pc, ['mss','marketStructureShift']) : String(structure.mss || 'N/A').toUpperCase()}`,
    `BOS=${gateValue(pc, ['bos','breakOfStructure']) !== 'N/A' ? gateValue(pc, ['bos','breakOfStructure']) : String(structure.bos || 'N/A').toUpperCase()}`,
    `DISP=${gateValue(pc, ['displacement','displacementConfirmed']) !== 'N/A' ? gateValue(pc, ['displacement','displacementConfirmed']) : String(disp.confirmed ? 'PASS' : 'WAIT').toUpperCase()}`,
    `FVG=${gateValue(pc, ['fvg','fvgConfirmed']) !== 'N/A' ? gateValue(pc, ['fvg','fvgConfirmed']) : String(fvg.found ? 'PASS' : 'WAIT').toUpperCase()}`,
    `OB=${gateValue(pc, ['orderBlock','ob','orderBlockConfirmed']) !== 'N/A' ? gateValue(pc, ['orderBlock','ob','orderBlockConfirmed']) : String(ob.found ? 'PASS' : 'WAIT').toUpperCase()}`,
    `ENTRY=${gateValue(pc, ['executionZone','entryZone','retest'])}`,
    `SPREAD=${gateValue(pc, ['spread','spreadValid'])}`,
    `ALL=${String(pre?.gates?.allGatesPassed ?? c.allGatesPassed ?? result.allGatesPassed ?? result.tradeAuthorized ?? false).toUpperCase()}`
  ];
  console.log(`[V-TRADE ICT DIAGNOSTIC] ${parts.join(' | ')}`);
}

async function runScan() {
  if (running) return;
  running = true;
  scanSeq += 1;
  const started = Date.now();
  console.log(`[TELEGRAM AUTO] Scan start | seq=${scanSeq} | MT5_READY=${mt5Ready()}`);
  try {
    const pre = await preMarketAuthority();
    const preReady = pre?.success === true && Number(pre?.available || 0) >= 4;
    const preAuthorized = pre?.gates?.allGatesPassed === true && pre?.execution?.authorization === true && pre?.execution?.status === 'ENTRY_READY';
    console.log(`[TELEGRAM AUTO] Pre-Market authority | ready=${preReady} | authorized=${preAuthorized} | transition=${pre?.workflow?.marketTransition?.phase || pre?.marketTransition?.phase || 'UNKNOWN'} | gates=${pre?.processing?.gatesPassed ?? '—'}/${pre?.processing?.gatesRequired ?? 10} | reason=${pre?.execution?.reason || pre?.error || '—'}`);
    if (typeof global.vtradeRunTelegramScan === 'function') {
      const result = await Promise.race([
        Promise.resolve(global.vtradeRunTelegramScan()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('scan-timeout')), 12000))
      ]);
      diagnostics(result, pre);
      const score = Number(result?.score ?? result?.directionScore ?? result?.confluenceScore);
      const scoreText = Number.isFinite(score) ? ` | score=${Math.round(score)}` : '';
      const status = String(result?.status || result?.decision || result?.action || 'READY');
      console.log(`[TELEGRAM AUTO] Scan OK | seq=${scanSeq} | elapsedMs=${Date.now()-started} | signal=${String(result?.signal || result?.action || 'WAIT').toUpperCase()} | bias=${String(result?.bias || result?.direction || 'N/A').toUpperCase()}${scoreText} | status=${status} | preMarketAuthorized=${preAuthorized}`);
    } else {
      console.log(`[TELEGRAM AUTO] Scan READY | seq=${scanSeq} | elapsedMs=${Date.now()-started} | scanner-hook=not-exposed`);
    }
  } catch (e) {
    console.error(`[TELEGRAM AUTO] Scan ERROR | seq=${scanSeq} | elapsedMs=${Date.now()-started} | reason=${e.message}`);
  } finally {
    running = false;
  }
}

function start() {
  if (timer) return;
  timer = setInterval(runScan, INTERVAL_MS);
  if (timer.unref) timer.unref();
  console.log(`[TELEGRAM AUTO] Continuity guard ACTIVE | interval=${INTERVAL_MS}ms | premarket-authority=true | analysis-independent-delivery=true | ict-diagnostics=true`);
  setTimeout(runScan, 1500).unref?.();
}

start();
module.exports = { runScan, start };
