// V-TRADE PRE-MARKET OB SAFETY HOTFIX
// Some legacy/injected analysis paths reference `ob` without declaring it.
// Provide a conservative, non-signal-producing fallback so one bad path cannot
// crash the Express request handler. Canonical analyzers still declare/use their
// own order-block objects when available.
'use strict';
if (typeof globalThis.ob === 'undefined') {
  globalThis.ob = Object.freeze({
    found: false,
    type: 'NONE',
    low: null,
    high: null,
    reason: 'OB safety fallback — no canonical order block available in this scope'
  });
}
console.log('[V-TRADE PRE-MARKET OB SAFETY] undeclared OB fallback installed | fail-closed');
module.exports = globalThis.ob;
