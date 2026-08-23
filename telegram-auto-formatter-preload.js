// V-TRADE Telegram formatter preload
// Kept as a standalone preload so Render can load the compact formatter
// before the production launcher starts.
'use strict';
try {
  require('./telegram-format-hotfix-v3.js');
} catch (e) {
  console.error('[V-TRADE TELEGRAM] compact formatter preload failed:', e.stack || e.message);
  process.exitCode = 1;
}
