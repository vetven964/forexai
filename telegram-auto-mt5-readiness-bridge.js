// V-TRADE Telegram Auto -> broker-native MT5 readiness bridge
// Fail-closed: never manufactures broker readiness or trade authorization.
'use strict';

const MARKER = '__vtradeTelegramAutoMt5Readiness';

function normalize(source) {
  const s = source && typeof source === 'object' ? source : {};
  const history = s.history && typeof s.history === 'object' ? s.history : {};
  const mtf = s.mtf && typeof s.mtf === 'object' ? s.mtf : {};
  const connected = s.connected === true || s.state === 'READY' || s.ready === true;
  const counts = {
    M5: Number(s.M5 ?? history.M5 ?? mtf.M5 ?? 0),
    M15: Number(s.M15 ?? history.M15 ?? mtf.M15 ?? 0),
    H1: Number(s.H1 ?? history.H1 ?? mtf.H1 ?? 0),
    H4: Number(s.H4 ?? history.H4 ?? mtf.H4 ?? 0)
  };
  const complete = Object.values(counts).every(n => Number.isFinite(n) && n >= 20);
  return {
    connected,
    complete,
    ready: connected && complete,
    counts,
    ageSec: Number.isFinite(Number(s.ageSec)) ? Number(s.ageSec) : null,
    source: 'BROKER_NATIVE_MT5'
  };
}

if (typeof globalThis[MARKER] !== 'function') {
  globalThis[MARKER] = normalize;
  console.log('[V-TRADE TELEGRAM] MT5 readiness bridge active | fail-closed');
}

module.exports = { normalize, marker: MARKER };
