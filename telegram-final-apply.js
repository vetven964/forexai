// V-TRADE AI — final Telegram formatter apply hook V7.5
// Single final formatter entry point. Safe to load more than once.
// Adds closed-candle early direction watch without changing trade authorization.
'use strict';

try {
  const fs = require('fs');
  const path = require('path');
  const marker = '[V-TRADE TELEGRAM] final formatter V7.5 active';
  require('./telegram-final-format-hotfix.js');
  require('./telegram-early-watch-closed-candle-v1.js');
  require('./telegram-early-watch-format-v1.js');

  const launcherFile = path.resolve(__dirname, 'server-launcher.js');
  if (fs.existsSync(launcherFile)) {
    let launcher = fs.readFileSync(launcherFile, 'utf8');
    const legacy = 'source = patchWaitCard(source);';
    const guarded = "if (!source.includes('VTRADE_TELEGRAM_FINAL_FORMAT_V7_2')) source = patchWaitCard(source);";
    if (launcher.includes(legacy) && !launcher.includes("VTRADE_TELEGRAM_FINAL_FORMAT_V7_2")) {
      launcher = launcher.replace(legacy, guarded);
      fs.writeFileSync(launcherFile, launcher, 'utf8');
      console.log('[V-TRADE TELEGRAM] launcher legacy WAIT override disabled | canonical formatter owns runtime');
    }
  }

  console.log(marker + ' | canonical ICT gate state | early direction watch | CLOSED CANDLES ONLY | Khmer + English | fail-closed');
} catch (e) {
  console.warn('[V-TRADE TELEGRAM] final formatter apply skipped safely:', e && e.message ? e.message : e);
}
