// V-TRADE runtime safety lock
'use strict';

// CORE must never run a second Telegram Auto Scanner.
// Telegram delivery is owned by the canonical compact V4 child service.
const __telegramToken = String(process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_AUTO_TOKEN || '').trim();
const __telegramChatId = String(process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_AUTO_CHAT_ID || '').trim();
if (!String(process.env.TELEGRAM_TOKEN || '').trim() && __telegramToken) process.env.TELEGRAM_TOKEN = __telegramToken;
if (!String(process.env.TELEGRAM_CHAT_ID || '').trim() && __telegramChatId) process.env.TELEGRAM_CHAT_ID = __telegramChatId;

process.env.TELEGRAM_AUTO_ALERT_ENABLED = 'false';
process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS = String(Math.max(30000, Number(process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS || 60000)));
process.env.TELEGRAM_AUTO_TOKEN = '';
process.env.TELEGRAM_AUTO_CHAT_ID = '';

if (typeof globalThis.telegramAutoLastReadinessLog === 'undefined') globalThis.telegramAutoLastReadinessLog = '';
if (typeof globalThis.__vtradeTelegramAutoReadinessLog === 'undefined') globalThis.__vtradeTelegramAutoReadinessLog = '';

console.log(`[V-TRADE TELEGRAM ENV] canonical credential handoff | token=${__telegramToken ? 'PRESENT' : 'MISSING'} | chat=${__telegramChatId ? 'PRESENT' : 'MISSING'} | coreScanner=false`);

try { require('./vtrade-direction-zone-truth-hotfix.js'); } catch (e) { console.error('[V-TRADE DIRECTION] truth hotfix preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./vtrade-canonical-data-contract.js'); } catch (e) { console.error('[V-TRADE DATA CONTRACT] preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./vtrade-canonical-signal-authority-v1.js'); } catch (e) { console.error('[V-TRADE AUTHORITY] canonical signal authority preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./vtrade-ui-canonical-direction-zone-hotfix-v1.js'); } catch (e) { console.error('[V-TRADE UI AUTHORITY] preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./telegram-single-renderer-guard.js'); } catch (e) { console.error('[V-TRADE TELEGRAM] single renderer preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./telegram-launcher-bilingual-patch.js'); } catch (e) { console.error('[V-TRADE TELEGRAM] launcher bilingual patch failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./telegram-auto-symbol-hotfix.js'); } catch (e) { console.error('[V-TRADE TELEGRAM] symbol-safety preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./telegram-auto-mt5-readiness-bridge.js'); } catch (e) { console.error('[V-TRADE TELEGRAM] MT5 readiness bridge preload failed:', e.stack || e.message); process.exitCode = 1; }
try { require('./telegram-final-runtime-hook.js'); } catch (e) { console.warn('[V-TRADE TELEGRAM] final runtime hook skipped safely:', e.message); }

console.log('[V-TRADE TELEGRAM] CORE scanner guard disabled | canonical V4 child owns Telegram');
console.log('[V-TRADE TELEGRAM] single authoritative bilingual renderer active');
try { require('./sunday-weekly-preopen.js'); } catch (e) { console.error('[V-TRADE SUNDAY PREOPEN] preload failed:', e.stack || e.message); process.exitCode = 1; }

// Canonical V-Zone AI dashboard: expose vtrade-new directly from the Render service.
// This runs before the production launcher loads server.js, so the route is available
// without changing the legacy dashboard or Telegram architecture.
try { require('./vzone-new-ui-route.js'); } catch (e) {
  console.error('[V-ZONE UI] new dashboard route preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

console.log('[V-TRADE TELEGRAM SEPARATION] CORE Auto Scanner DISABLED | Compact V4 owns Telegram | enabled=false');
