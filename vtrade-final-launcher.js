// V-TRADE FINAL PRODUCTION LAUNCHER V2
// Single canonical production entrypoint.
// CORE = server/MT5/MTF/ICT/Pre-Market; TELEGRAM = canonical V4 child service.
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
  'package-access-hotfix.js',
  'pre-market-route-boot-hotfix.js',
  'ai-confirmation-runtime-v2.js',
  'pre-market-structure-hook.js',
  'predeploy-consistency-hotfix.js'
];

function validateProductionFiles(){
  const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));
  if(missing.length)throw new Error('Missing production files: '+missing.join(', '));
  console.log('[V-TRADE FINAL] production file contract PASS');
}

try{
  validateProductionFiles();
  console.log('[V-TRADE FINAL] starting canonical CORE + Telegram V4 architecture');
  require('./vtrade-enhanced-launcher.js');
}catch(e){
  console.error('[V-TRADE FINAL LAUNCHER] FATAL:',e.stack||e.message);
  process.exitCode=1;
}
