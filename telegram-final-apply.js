// V-TRADE AI — final Telegram formatter apply hook V7.3
// Single final formatter entry point. Safe to load more than once.
// Prevents server-launcher.js legacy WAIT renderer from overriding V7.2.
'use strict';

try {
  const fs = require('fs');
  const path = require('path');
  const marker = '[V-TRADE TELEGRAM] final formatter V7.3 active';
  require('./telegram-final-format-hotfix.js');

  // server-launcher.js previously patched telegramWaitText() in-memory after
  // the final formatter had already updated server.js on disk. That caused the
  // old WAIT card to win at runtime. Make the launcher defer to V7.2/V7.3.
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

  console.log(marker + ' | canonical ICT gate state | Khmer + English | fail-closed');
} catch (e) {
  console.warn('[V-TRADE TELEGRAM] final formatter apply skipped safely:', e && e.message ? e.message : e);
}
