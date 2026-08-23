// V-TRADE Telegram language finalizer V1
// Canonical Telegram formatter is bilingual Khmer + English.
// The production launcher used to replace it with an English-only WAIT renderer.
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER_LAUNCHER=path.resolve(__dirname,'server-launcher.js');
const MARK='VTRADE_TELEGRAM_LANGUAGE_FINALIZER_V1';
try {
  // Install the canonical V6 formatter first so server.js owns the final text.
  require('./telegram-final-format-hotfix.js');
  if(fs.existsSync(SERVER_LAUNCHER)){
    let s=fs.readFileSync(SERVER_LAUNCHER,'utf8');
    if(!s.includes(MARK)){
      const re=/function patchWaitCard\(source\) \{[\s\S]*?\n\}\n\nfunction patchFrontend/;
      if(re.test(s)){
        s=s.replace(re,`function patchWaitCard(source) {\n  // ${MARK}: never replace the canonical bilingual Telegram renderer.\n  return source;\n}\n\nfunction patchFrontend`);
        fs.writeFileSync(SERVER_LAUNCHER,s,'utf8');
        console.log('[V-TRADE TELEGRAM] language finalizer V1 installed | canonical Khmer + English renderer preserved');
      } else {
        console.warn('[V-TRADE TELEGRAM] language finalizer: patchWaitCard boundary not found');
      }
    } else {
      console.log('[V-TRADE TELEGRAM] language finalizer V1 already active');
    }
  }
}catch(e){
  console.error('[V-TRADE TELEGRAM] language finalizer failed:',e.stack||e.message);
  process.exitCode=1;
}
