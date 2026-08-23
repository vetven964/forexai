// V-TRADE Telegram language finalizer V3
// Canonical Telegram renderer owner: server-launcher.js / telegramWaitText.
// This guard prevents legacy launcher WAIT renderers from being re-enabled.
'use strict';
const fs = require('fs');
const path = require('path');
const SERVER_LAUNCHER = path.resolve(__dirname, 'server-launcher.js');
const MARK = 'VTRADE_TELEGRAM_LANGUAGE_FINALIZER_V3';
try {
  if (fs.existsSync(SERVER_LAUNCHER)) {
    let s = fs.readFileSync(SERVER_LAUNCHER, 'utf8');
    if (!s.includes(MARK)) {
      s = s.replace(
        /function patchWaitCard\(source\) \{[\s\S]*?\n\}\n\nfunction patchFrontend\(/,
        `function patchWaitCard(source) {\n  // ${MARK}: legacy renderer disabled. The canonical bilingual formatter owns Telegram output.\n  return source;\n}\n\nfunction patchFrontend(`
      );
      fs.writeFileSync(SERVER_LAUNCHER, s, 'utf8');
      console.log('[V-TRADE TELEGRAM] language finalizer V3 installed | legacy WAIT renderer disabled');
    } else {
      console.log('[V-TRADE TELEGRAM] language finalizer V3 already active');
    }
  }
} catch (e) {
  console.error('[V-TRADE TELEGRAM] language finalizer V3 failed:', e.stack || e.message);
  process.exitCode = 1;
}
