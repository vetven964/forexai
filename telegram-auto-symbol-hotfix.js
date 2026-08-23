// V-TRADE Telegram Auto symbol-safety hotfix
// Prevents first-scan ReferenceError when the Telegram helper is not available
// in the scanner's lexical scope. Fails closed: it never manufactures an alert.
'use strict';

const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.join(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_AUTO_SYMBOL_SAFETY_V1';

function patch() {
  if (!fs.existsSync(SERVER_FILE)) throw new Error('server.js not found');
  let source = fs.readFileSync(SERVER_FILE, 'utf8');
  if (source.includes(MARKER)) {
    console.log('[V-TRADE TELEGRAM] symbol-safety hotfix already active');
    return;
  }

  const anchor = "const app = express();";
  if (!source.includes(anchor)) throw new Error('server app marker not found');

  const guard = `
// ${MARKER}
// Keep a globally reachable, fail-closed delivery adapter for scanner contexts.
// The adapter calls the canonical module-local helper when it exists.
globalThis.__vtradeMaybeTelegramAlert = async function(a, tg, sessionId) {
  try {
    if (typeof maybeTelegramAlert === 'function') return await maybeTelegramAlert(a, tg, sessionId);
  } catch (e) {
    console.warn('[TELEGRAM AUTO] helper call blocked:', String(e?.message || e));
  }
  return false;
};
`;
  source = source.replace(anchor, anchor + guard);

  // Scanner: avoid direct lexical resolution of maybeTelegramAlert.
  source = source.replace(
    /let sent = await maybeTelegramAlert\(a, tg, dedupeKey\);/g,
    "let sent = await globalThis.__vtradeMaybeTelegramAlert(a, tg, dedupeKey);"
  );

  // Analysis endpoint: keep delivery independent and fail-closed if an old
  // route still contains the legacy direct call.
  source = source.replace(
    /maybeTelegramAlert\(a, tg, sid\)\.catch\(e=>console\.error\('Telegram alert:',e\.message\)\);/g,
    "globalThis.__vtradeMaybeTelegramAlert(a, tg, sid).catch(e=>console.error('Telegram alert:',e.message));"
  );

  fs.writeFileSync(SERVER_FILE, source, 'utf8');
  console.log('[V-TRADE TELEGRAM] symbol-safety hotfix active | scanner helper bound safely');
}

try {
  patch();
} catch (e) {
  console.error('[V-TRADE TELEGRAM] symbol-safety hotfix failed:', e.stack || e.message);
  process.exitCode = 1;
}
