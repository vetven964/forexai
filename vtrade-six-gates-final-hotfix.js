// V-TRADE FINAL SIX-GATE HOTFIX
// Loaded by the production launcher in the next startup patch.
// This module is intentionally fail-closed: it never promotes a WAIT to BUY/SELL.
'use strict';

const VERSION = 'SIX-GATES-V1';
const MAX_QUOTE_AGE_MS = Math.max(5000, Number(process.env.MT5_MAX_AGE_MS || 15000));
const CLOSED_CANDLE_MAX_AGE_MS = Math.max(60000, Number(process.env.MT5_CLOSED_CANDLE_MAX_AGE_MS || 15 * 60 * 1000));

function normalizeTime(v) {
  let n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1e12) n *= 1000;
  return n;
}

function inspectMT5(feed, candlesByTf = {}) {
  const now = Date.now();
  const receivedAt = normalizeTime(feed?.receivedAt);
  const quoteAgeMs = receivedAt ? Math.max(0, now - receivedAt) : Infinity;
  const quoteFresh = quoteAgeMs <= MAX_QUOTE_AGE_MS;
  const tf = {};
  for (const name of ['M5','M15','H1','H4']) {
    const rows = Array.isArray(candlesByTf[name]) ? candlesByTf[name] : [];
    const last = rows.length ? rows[rows.length - 1] : null;
    const t = normalizeTime(last?.t ?? last?.time);
    const ageMs = t ? Math.max(0, now - t) : Infinity;
    tf[name] = { count: rows.length, lastTimestamp:t, ageMs, available:rows.length >= 30 };
  }
  return {version:VERSION,quoteFresh,quoteAgeSec:Number.isFinite(quoteAgeMs)?Math.round(quoteAgeMs/1000):null,tf};
}

function gateReport(input = {}) {
  const x = input;
  const reasons = [];
  const mt5 = x.mt5 || {};
  const candleFresh = x.candlesFresh === true;
  const weekendPreopen = x.weekendPreopen === true;
  const quoteFresh = x.quoteFresh === true;
  if (!quoteFresh) reasons.push('MT5 quote is stale or unavailable');
  if (!candleFresh && !weekendPreopen) reasons.push('Closed-candle data is stale — wait for fresh MT5 history');
  if (weekendPreopen && !candleFresh) reasons.push('Weekend closed-candle snapshot — analysis only; revalidate at market open');
  if (x.liquiditySweepFresh !== true) reasons.push('Fresh liquidity sweep not confirmed');
  if (x.mssFresh !== true) reasons.push('Fresh M5 MSS not confirmed');
  if (x.displacementConfirmed !== true) reasons.push('Directional displacement not confirmed');
  if (x.alignedFvgOb !== true) reasons.push('No fresh aligned FVG/OB');
  if (x.executionLocationOk !== true) reasons.push('Price is outside the execution zone');
  if (x.bosFresh !== true) reasons.push('Fresh M5 MSS/BOS structure break not confirmed');
  if (x.momentumConfirmed !== true) reasons.push('Momentum/displacement does not confirm the execution direction');
  const allExecutionGates = quoteFresh && candleFresh && x.liquiditySweepFresh === true && x.mssFresh === true && x.bosFresh === true && x.displacementConfirmed === true && x.alignedFvgOb === true && x.executionLocationOk === true && x.momentumConfirmed === true;
  return {version:VERSION,reasons,allExecutionGates,authorized:allExecutionGates === true};
}

function bilingualWaitReason(reason) {
  const map = {
    'Closed-candle data is stale — wait for fresh MT5 history':'Closed-candle data is stale — wait for fresh MT5 history | ទិន្នន័យ candle ដែលបិទហើយចាស់ — រង់ចាំ MT5 history ថ្មី',
    'Fresh liquidity sweep not confirmed':'Fresh liquidity sweep not confirmed | មិនទាន់បញ្ជាក់ Liquidity Sweep ថ្មី',
    'Fresh M5 MSS not confirmed':'Fresh M5 MSS not confirmed | មិនទាន់បញ្ជាក់ M5 MSS ថ្មី',
    'Directional displacement not confirmed':'Directional displacement not confirmed | មិនទាន់បញ្ជាក់ Displacement តាមទិស',
    'No fresh aligned FVG/OB':'No fresh aligned FVG/OB | មិនមាន FVG/OB ថ្មីដែលស្របទិស',
    'Price is outside the execution zone':'Price is outside the execution zone | តម្លៃនៅក្រៅ Execution Zone',
    'Fresh M5 MSS/BOS structure break not confirmed':'Fresh M5 MSS/BOS structure break not confirmed | មិនទាន់បញ្ជាក់ MSS/BOS ថ្មី',
    'Momentum/displacement does not confirm the execution direction':'Momentum/displacement does not confirm the execution direction | Momentum/Displacement មិនបញ្ជាក់ទិស',
    'Weekend closed-candle snapshot — analysis only; revalidate at market open':'Weekend closed-candle snapshot — analysis only; revalidate at market open | ទិន្នន័យចុងសប្តាហ៍សម្រាប់វិភាគប៉ុណ្ណោះ — ត្រូវ Verify ម្តងទៀតពេល Market Open'
  };
  return map[reason] || reason;
}

module.exports = { VERSION, MAX_QUOTE_AGE_MS, CLOSED_CANDLE_MAX_AGE_MS, normalizeTime, inspectMT5, gateReport, bilingualWaitReason };
