'use strict';

// Telegram alert gate: emit only on meaningful state changes.
// WAIT is silent by default; authorized BUY/SELL can re-alert only when
// direction, entry zone, SL or TP structure changes materially.
const SIDE = {
  BuyBullish: 'BUY',
  SellBearish: 'SELL',
  BUY: 'BUY',
  SELL: 'SELL',
  WAIT: 'WAIT'
};

const n = (v) => Number.isFinite(Number(v)) ? Number(v) : null;
const near = (a, b, step = 0.05) => a != null && b != null && Math.abs(a - b) <= step;

function signalKey(s) {
  const side = SIDE[s?.signal] || 'WAIT';
  if (side === 'WAIT' || s?.authorized !== true) return 'WAIT';
  return [
    side,
    n(s.entry)?.toFixed(2),
    n(s.sl)?.toFixed(2),
    n(s.tp?.[0])?.toFixed(2),
    n(s.tp?.[1])?.toFixed(2),
    n(s.tp?.[2])?.toFixed(2),
    s.timeframe || 'M15'
  ].join('|');
}

function createSignalDeduper(options = {}) {
  const state = { last: null, lastSentAt: 0 };
  const cooldownMs = Number(options.cooldownMs) || 60000;

  return {
    shouldSend(signal, now = Date.now()) {
      const side = SIDE[signal?.signal] || 'WAIT';
      const key = signalKey(signal);

      // Never send WAIT/no-authority noise.
      if (side === 'WAIT' || signal?.authorized !== true) return false;

      // First valid authorized setup is sendable.
      if (!state.last) {
        state.last = key;
        state.lastSentAt = now;
        return true;
      }

      // Same setup: suppress polling duplicates.
      if (key === state.last) return false;

      // Direction/setup changed: send immediately.
      state.last = key;
      state.lastSentAt = now;
      return true;
    },
    reset() {
      state.last = null;
      state.lastSentAt = 0;
    },
    getState() {
      return { ...state };
    }
  };
}

function meaningfulChange(previous, current) {
  const a = SIDE[previous?.signal] || 'WAIT';
  const b = SIDE[current?.signal] || 'WAIT';
  if (a !== b) return true;
  if (b === 'WAIT') return false;
  return ![
    near(n(previous?.entry), n(current?.entry)),
    near(n(previous?.sl), n(current?.sl)),
    near(n(previous?.tp?.[0]), n(current?.tp?.[0])),
    near(n(previous?.tp?.[1]), n(current?.tp?.[1])),
    near(n(previous?.tp?.[2]), n(current?.tp?.[2]))
  ].every(Boolean);
}

module.exports = { createSignalDeduper, signalKey, meaningfulChange };
