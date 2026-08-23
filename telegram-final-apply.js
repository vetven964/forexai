// V-TRADE AI — final Telegram formatter apply hook V7.2
// Single final formatter entry point. Safe to load more than once.
'use strict';

try {
  const marker = '[V-TRADE TELEGRAM] final formatter V7.2 active';
  require('./telegram-final-format-hotfix.js');
  console.log(marker + ' | canonical ICT gate state | Khmer + English | fail-closed');
} catch (e) {
  console.warn('[V-TRADE TELEGRAM] final formatter apply skipped safely:', e && e.message ? e.message : e);
}
