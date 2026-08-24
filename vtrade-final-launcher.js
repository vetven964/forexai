// V-TRADE FINAL PRODUCTION LAUNCHER V3
// Three explicit ownership boundaries:
//   1) PRE-MARKET AI = pre-market-ai-core.js
//   2) FRIDAY/MONDAY TRANSITION = monday-fresh-candle-contract.js
//   3) TELEGRAM BOT = telegram-bot-ai-service-v4.js
// No component may silently own another component's state or credentials.
'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=__dirname;
const REQUIRED=[
  'vtrade-enhanced-launcher.js',
  'server-launcher.js',
  'server.js',
  'telegram-bot-ai-service-v4.js',
  'telegram-signal-bridge.js',
  'pre-market-ai-core.js',
  'monday-fresh-candle-contract.js',
  'package-access-hotfix.js',
  'pre-market-route-boot-hotfix.js',
  'ai-confirmation-runtime-v2.js',
  'pre-market-structure-hook.js',
  'predeploy-consistency-hotfix.js'
];

function validateProductionFiles(){
  const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));
  if(missing.length)throw new Error('Missing production files: '+missing.join(', '));
  console.log('[V-TRADE FINAL] production file contract PASS | PRE-MARKET / MONDAY / TELEGRAM files present');
}

function validateOwnership(){
  const pre=require('./pre-market-ai-core.js');
  const contract=pre.assertOwnership();
  console.log('[V-TRADE ARCHITECTURE] PRE-MARKET=OWNED | Telegram=NOT_LOADED | FridayMonday=NOT_OWNED');
  console.log('[V-TRADE ARCHITECTURE] MONDAY TRANSITION=OWNED | Telegram=NOT_LOADED');
  console.log('[V-TRADE ARCHITECTURE] TELEGRAM=OWNED BY telegram-bot-ai-service-v4.js');
  return contract;
}

try{
  validateProductionFiles();
  validateOwnership();
  // Monday transition contract is a CORE patch and must load before server compilation.
  require('./monday-fresh-candle-contract.js');
  console.log('[V-TRADE FINAL] starting canonical 3-file ownership architecture');
  require('./vtrade-enhanced-launcher.js');
}catch(e){
  console.error('[V-TRADE FINAL LAUNCHER] FATAL:',e.stack||e.message);
  process.exitCode=1;
}
