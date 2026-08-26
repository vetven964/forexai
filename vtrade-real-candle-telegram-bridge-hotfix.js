/* V-ZONEAI REAL-CANDLE TELEGRAM BRIDGE HOTFIX
 * Propagates ONLY canonical MT5 real-candle validation into Telegram consumers.
 * Never fabricates OHLC and never upgrades an invalid candle to real.
 */
'use strict';

const originalFetch = global.fetch;
if (typeof originalFetch !== 'function') {
  console.warn('[V-ZONEAI REAL-CANDLE BRIDGE] fetch unavailable; hotfix skipped');
  module.exports = { installed:false };
} else if (!global.__VZONEAI_REAL_CANDLE_BRIDGE__) {
  const validOhlc = c => {
    const o=Number(c?.o??c?.open), h=Number(c?.h??c?.high), l=Number(c?.l??c?.low), cl=Number(c?.c??c?.close);
    return [o,h,l,cl].every(Number.isFinite) && h>=Math.max(o,cl) && l<=Math.min(o,cl) && h>=l;
  };
  const enrich = payload => {
    if (!payload || typeof payload !== 'object') return payload;
    const a = payload.authority && typeof payload.authority === 'object' ? payload.authority : payload;
    const gate = a.realCandleGate || payload.realCandleGate || {};
    const tf = a.timeframes || {};
    const core = ['M5','M15','H1','H4'];
    const coreReady = gate.coreReady === true || gate.ok === true;
    const tfReady = core.every(k => {
      const x=tf[k]||{};
      const gateRow=gate.timeframes?.[k]||{};
      const bars=Number(x.bars ?? gateRow.bars ?? 0);
      return (x.realCandle===true || gateRow.realCandle===true) && bars>=30;
    });
    const m5 = tf.M5||{};
    const gateM5 = gate.timeframes?.M5 || {};
    const candle = m5.candle || m5.lastCandle || gateM5.lastCandle || (Array.isArray(m5.candles) ? m5.candles[m5.candles.length-1] : null);
    const valid = validOhlc(candle);
    const real = coreReady && tfReady && valid;
    const next = { ...a, realCandle: real, candleValid: real, fakeCandle: !real, syntheticCandle: !real };
    if (candle && valid) next.candle = { ...candle, realCandle:true, synthetic:false, source:'MT5_BROKER_NATIVE' };
    if (payload.authority && typeof payload.authority === 'object') return { ...payload, authority:next, realCandle:real, candleValid:real, fakeCandle:!real, syntheticCandle:!real };
    return { ...payload, ...next };
  };
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const url = String(args?.[0]?.url || args?.[0] || '');
      if (!url.includes('/api/pre-market/mt5-authoritative')) return response;
      const clone = response.clone();
      const text = await clone.text();
      let json; try { json=JSON.parse(text); } catch (_) { return response; }
      const enriched = enrich(json);
      const headers = new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      return new Response(JSON.stringify(enriched), { status:response.status, statusText:response.statusText, headers });
    } catch (e) {
      console.warn('[V-ZONEAI REAL-CANDLE BRIDGE] enrichment skipped:', e?.message||e);
      return response;
    }
  };
  global.__VZONEAI_REAL_CANDLE_BRIDGE__ = true;
  console.log('[V-ZONEAI REAL-CANDLE BRIDGE] canonical MT5 real-candle propagation ACTIVE | synthetic=false only');
}
module.exports = { installed:true };
