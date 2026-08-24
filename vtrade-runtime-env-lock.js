// V-TRADE runtime safety lock
'use strict';

// CORE must never run a second Telegram Auto Scanner.
// Telegram delivery is owned by the canonical compact V4 child service.
// This lock normalizes legacy Telegram env names BEFORE disabling the CORE scanner,
// so TELEGRAM_AUTO_TOKEN / TELEGRAM_AUTO_CHAT_ID are not accidentally destroyed
// before the canonical V4 child receives them.
const __telegramToken = String(process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_AUTO_TOKEN || '').trim();
const __telegramChatId = String(process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_AUTO_CHAT_ID || '').trim();
if (!String(process.env.TELEGRAM_TOKEN || '').trim() && __telegramToken) process.env.TELEGRAM_TOKEN = __telegramToken;
if (!String(process.env.TELEGRAM_CHAT_ID || '').trim() && __telegramChatId) process.env.TELEGRAM_CHAT_ID = __telegramChatId;

// CORE scanner is always disabled. The canonical V4 child owns Telegram delivery.
process.env.TELEGRAM_AUTO_ALERT_ENABLED = 'false';
process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS = String(Math.max(30000, Number(process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS || 60000)));

// Keep legacy AUTO credentials available only long enough for the canonical
// launcher to normalize them into TELEGRAM_TOKEN / TELEGRAM_CHAT_ID. The
// enhanced launcher then passes private credentials to the V4 child and blanks
// them from the CORE parent process before server.js starts.
process.env.TELEGRAM_AUTO_TOKEN = '';
process.env.TELEGRAM_AUTO_CHAT_ID = '';

if (typeof globalThis.telegramAutoLastReadinessLog === 'undefined') globalThis.telegramAutoLastReadinessLog = '';
if (typeof globalThis.__vtradeTelegramAutoReadinessLog === 'undefined') globalThis.__vtradeTelegramAutoReadinessLog = '';

console.log(`[V-TRADE TELEGRAM ENV] canonical credential handoff | token=${__telegramToken ? 'PRESENT' : 'MISSING'} | chat=${__telegramChatId ? 'PRESENT' : 'MISSING'} | coreScanner=false`);

// Direction/zone truth must be loaded before server-launcher installs its JS loader.
try { require('./vtrade-direction-zone-truth-hotfix.js'); } catch (e) {
  console.error('[V-TRADE DIRECTION] truth hotfix preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

try { require('./vtrade-canonical-data-contract.js'); } catch (e) {
  console.error('[V-TRADE DATA CONTRACT] preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

// Canonical signal authority MUST load before the launcher installs its JS loader.
// It binds Pre-Market direction and Telegram market readiness to one contract.
try { require('./vtrade-canonical-signal-authority-v1.js'); } catch (e) {
  console.error('[V-TRADE AUTHORITY] canonical signal authority preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

// Canonical UI must consume the same H4/H1/M15 direction truth before the
// launcher installs its JS loader. This prevents score-only UI labels.
try { require('./vtrade-ui-canonical-direction-zone-hotfix-v1.js'); } catch (e) {
  console.error('[V-TRADE UI AUTHORITY] preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

try { require('./telegram-single-renderer-guard.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] single renderer preload failed:', e.stack || e.message);
  process.exitCode = 1;
}
try { require('./telegram-launcher-bilingual-patch.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] launcher bilingual patch failed:', e.stack || e.message);
  process.exitCode = 1;
}
try { require('./telegram-auto-symbol-hotfix.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] symbol-safety preload failed:', e.stack || e.message);
  process.exitCode = 1;
}
try { require('./telegram-auto-mt5-readiness-bridge.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] MT5 readiness bridge preload failed:', e.stack || e.message);
  process.exitCode = 1;
}
try { require('./telegram-final-runtime-hook.js'); } catch (e) {
  console.warn('[V-TRADE TELEGRAM] final runtime hook skipped safely:', e.message);
}

// IMPORTANT: do not load telegram-auto-scan-guard.js in CORE.
// The guard was useful during migration, but the production architecture now
// runs Telegram exclusively in telegram-bot-ai-service-v4.js. Loading the old
// continuity guard here created misleading MT5_READY/GLOBAL_MT5_READY logs and
// an extra Pre-Market polling loop even though CORE Telegram delivery is locked.
console.log('[V-TRADE TELEGRAM] CORE scanner guard disabled | canonical V4 child owns Telegram');
console.log('[V-TRADE TELEGRAM] single authoritative bilingual renderer active');
try { require('./sunday-weekly-preopen.js'); } catch (e) {
  console.error('[V-TRADE SUNDAY PREOPEN] preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

console.log('[V-TRADE TELEGRAM SEPARATION] CORE Auto Scanner DISABLED | Compact V4 owns Telegram | enabled=false');
