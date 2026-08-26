/* V-TRADE REAL CANDLE GATE V1
 * MT5 broker-native OHLC only. No synthetic candles, no fabricated wick/shadow.
 */
'use strict';

const TFS = ['M1','M5','M15','H1','H4','D1'];
const CORE_TFS = ['M5','M15','H1','H4'];
const MIN_BARS = 30;

const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
const arr = x => {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.candles)) return x.candles;
  if (Array.isArray(x?.bars)) return x.bars;
  if (Array.isArray(x?.history)) return x.history;
  return [];
};

function normalizeRealCandle(x) {
  const t = num(x?.t ?? x?.time ?? x?.timestamp ?? x?.timeMs);
  const o = num(x?.o ?? x?.open);
  const h = num(x?.h ?? x?.high);
  const l = num(x?.l ?? x?.low);
  const c = num(x?.c ?? x?.close);
  const v = num(x?.v ?? x?.volume ?? x?.tickVolume) ?? 0;

  // Strict OHLC invariants. Invalid bars never enter the signal engine.
  if (![t,o,h,l,c].every(Number.isFinite)) return null;
  if (!(h >= Math.max(o,c) && l <= Math.min(o,c) && h >= l)) return null;

  const bodyHigh = Math.max(o,c);
  const bodyLow = Math.min(o,c);
  const upperWick = h - bodyHigh;
  const lowerWick = bodyLow - l;
  const range = h - l;

  return Object.freeze({
    t, o, h, l, c, v,
    upperWick: Number(upperWick.toFixed(5)),
    lowerWick: Number(lowerWick.toFixed(5)),
    range: Number(range.toFixed(5)),
    source: 'MT5_BROKER_NATIVE',
    synthetic: false,
    realCandle: true
  });
}

function readBrokerCandles(brokerFeed, tf) {
  const node = brokerFeed?.timeframes?.[tf];
  const raw = arr(node);
  const candles = raw.map(normalizeRealCandle).filter(Boolean);
  return { candles, rawCount: raw.length, validCount: candles.length };
}

function validateTimeframe(brokerFeed, tf) {
  const r = readBrokerCandles(brokerFeed, tf);
  const chronological = r.candles.every((x,i,a) => i === 0 || x.t >= a[i-1].t);
  return {
    timeframe: tf,
    source: 'MT5_BROKER_NATIVE',
    bars: r.validCount,
    rawBars: r.rawCount,
    ready: r.validCount >= MIN_BARS && chronological,
    chronological,
    syntheticBars: 0,
    realCandle: r.validCount >= MIN_BARS && chronological
  };
}

function validateMT5Feed(brokerFeed) {
  const rows = {};
  for (const tf of TFS) rows[tf] = validateTimeframe(brokerFeed, tf);
  const coreReady = CORE_TFS.every(tf => rows[tf].ready);
  return {
    ok: coreReady,
    source: 'MT5_BROKER_NATIVE_ONLY',
    syntheticAllowed: false,
    coreReady,
    required: CORE_TFS.slice(),
    timeframes: rows,
    reason: coreReady ? 'REAL_MT5_CANDLES_READY' : 'REAL_MT5_CANDLES_NOT_READY'
  };
}

function wickShadow(candle) {
  if (!candle?.realCandle || candle?.synthetic) return null;
  return {
    upper: candle.upperWick,
    lower: candle.lowerWick,
    range: candle.range,
    source: 'REAL_MT5_HIGH_LOW'
  };
}

function install(a, brokerFeed) {
  const feed = brokerFeed || a?.brokerFeed || a?.mt5?.brokerFeed;
  const validation = validateMT5Feed(feed);
  if (!validation.ok) {
    return {
      ...a,
      realCandleGate: validation,
      signal: 'WAIT',
      status: 'WAIT — REAL MT5 CANDLES NOT READY',
      tradeAuthorized: false,
      workflow: { ...(a?.workflow || {}), realCandleOnly: true, syntheticCandles: false, entryAuthorization: false }
    };
  }

  const out = { ...a, realCandleGate: validation };
  out.workflow = { ...(out.workflow || {}), realCandleOnly: true, syntheticCandles: false, wickShadowSource: 'MT5_HIGH_LOW' };
  out.timeframes = { ...(out.timeframes || {}) };
  for (const tf of TFS) {
    const r = readBrokerCandles(feed, tf);
    out.timeframes[tf] = { ...(out.timeframes[tf] || {}), candles: r.candles, bars: r.candles.length, source: 'MT5_BROKER_NATIVE', realCandle: true, synthetic: false };
  }
  return out;
}

module.exports = { TFS, CORE_TFS, normalizeRealCandle, readBrokerCandles, validateMT5Feed, wickShadow, install };
