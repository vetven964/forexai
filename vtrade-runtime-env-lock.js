// V-TRADE runtime safety lock
'use strict';

// CORE must never run a second Telegram Auto Scanner.
// Telegram delivery is owned by the canonical compact V4 child service.
// This prevents duplicate scans, duplicate sends, and legacy WAIT renderers.
process.env.TELEGRAM_AUTO_ALERT_ENABLED = 'false';
process.env.TELEGRAM_AUTO_TOKEN = '';
process.env.TELEGRAM_AUTO_CHAT_ID = '';
process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS = String(Math.max(30000, Number(process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS || 60000)));

if (typeof globalThis.telegramAutoLastReadinessLog === 'undefined') globalThis.telegramAutoLastReadinessLog = '';
if (typeof globalThis.__vtradeTelegramAutoReadinessLog === 'undefined') globalThis.__vtradeTelegramAutoReadinessLog = '';

try { require('./vtrade-canonical-data-contract.js'); } catch (e) {
  console.error('[V-TRADE DATA CONTRACT] preload failed:', e.stack || e.message);
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
