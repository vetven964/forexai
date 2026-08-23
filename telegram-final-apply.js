// V-TRADE AI — final Telegram formatter apply hook
// Loaded after the Local ICT runtime prepares server.js and before server.js
// is finally required by server-launcher.js.
'use strict';

try {
  require('./telegram-final-format-hotfix.js');
  console.log('[V-TRADE TELEGRAM] final formatter V2 apply hook active');
} catch (e) {
  console.warn('[V-TRADE TELEGRAM] final formatter V2 skipped safely:', e.message);
}
