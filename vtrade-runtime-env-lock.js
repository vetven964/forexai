// V-TRADE runtime safety lock
// Loaded before server.js so legacy/core Telegram behavior cannot override
// the dedicated Telegram Auto runtime credentials configured in Render.
'use strict';

process.env.TELEGRAM_AUTO_ALERT_ENABLED = String(process.env.TELEGRAM_AUTO_ALERT_ENABLED || 'true').toLowerCase() === 'true' ? 'true' : 'false';
process.env.TELEGRAM_AUTO_TOKEN = String(process.env.TELEGRAM_AUTO_TOKEN || process.env.TELEGRAM_TOKEN || '').trim();
process.env.TELEGRAM_AUTO_CHAT_ID = String(process.env.TELEGRAM_AUTO_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '').trim();
process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS = String(Math.max(30000, Number(process.env.TELEGRAM_AUTO_ALERT_INTERVAL_MS || 60000)));

if (typeof globalThis.telegramAutoLastReadinessLog === 'undefined') globalThis.telegramAutoLastReadinessLog = '';
if (typeof globalThis.__vtradeTelegramAutoReadinessLog === 'undefined') globalThis.__vtradeTelegramAutoReadinessLog = '';

try { require('./telegram-auto-symbol-hotfix.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] symbol-safety preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

try { require('./telegram-auto-mt5-readiness-bridge.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] MT5 readiness bridge preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

// Sunday-only weekly pre-open outlook. Analysis-only; it never authorizes orders.
try { require('./sunday-weekly-preopen.js'); } catch (e) {
  console.error('[V-TRADE SUNDAY PREOPEN] preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

// Compact Telegram formatter is applied before server-launcher patches server.js.
try { require('./telegram-format-hotfix-v3.js'); } catch (e) {
  console.error('[V-TRADE TELEGRAM] compact formatter preload failed:', e.stack || e.message);
  process.exitCode = 1;
}

console.log('[V-TRADE TELEGRAM SEPARATION] Auto runtime preserved | enabled=' +
  (process.env.TELEGRAM_AUTO_ALERT_ENABLED === 'true') +
  ' | token=' + (process.env.TELEGRAM_AUTO_TOKEN ? 'configured' : 'missing') +
  ' | chat=' + (process.env.TELEGRAM_AUTO_CHAT_ID ? 'configured' : 'missing'));