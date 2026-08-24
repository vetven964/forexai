// V-TRADE Telegram formatter preload V7
// Telegram Bot ONLY compact presentation for the canonical v4 child.
'use strict';
try {
  require('./telegram-format-hotfix-v7.js');
} catch (e) {
  console.error('[V-TRADE TELEGRAM] compact formatter V7 preload failed:', e.stack || e.message);
  process.exitCode = 1;
}
