// V-TRADE Telegram language finalizer V2
// Canonical Telegram formatter is bilingual Khmer + English.
// Disable the launcher-level English-only WAIT renderer before server.js loads.
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER_LAUNCHER=path.resolve(__dirname,'server-launcher.js');
const MARK='VTRADE_TELEGRAM_LANGUAGE_FINALIZER_V2';
try {
  require('./telegram-final-format-hotfix.js');
  if(fs.existsSync(SERVER_LAUNCHER)){
    let s=fs.readFileSync(SERVER_LAUNCHER,'utf8');
    if(!s.includes(MARK)){
      const call="  source = patchWaitCard(source);";
      if(s.includes(call)){
        s=s.replace(call,"  // "+MARK+" — canonical bilingual Telegram renderer owns telegramWaitText.\n  source = source;");
        fs.writeFileSync(SERVER_LAUNCHER,s,'utf8');
        console.log('[V-TRADE TELEGRAM] language finalizer V2 installed | launcher WAIT renderer disabled');
      } else {
        console.log('[V-TRADE TELEGRAM] language finalizer V2: launcher patch call already absent');
      }
    } else {
      console.log('[V-TRADE TELEGRAM] language finalizer V2 already active');
    }
  }
}catch(e){
  console.error('[V-TRADE TELEGRAM] language finalizer V2 failed:',e.stack||e.message);
  process.exitCode=1;
}
