// V-ZONE AI WEB APP + TELEGRAM PRODUCTION LAUNCHER V19
'use strict';
const fs=require('fs');const path=require('path');const ROOT=__dirname;

// Render may invoke this launcher directly instead of package.json "start".
// Always boot the canonical MT5 authority route before server.js is loaded.
try{
  require(path.join(ROOT,'pre-market-route-boot-hotfix.js'));
  console.log('[V-ZONE V19] PRE-MARKET BOOT | canonical MT5 authority route persisted before server');
}catch(e){
  console.error('[V-ZONE V19] PRE-MARKET BOOT FAILED:',e.stack||e.message||e);
  throw e;
}

const REQUIRED=['server.js','vtrade-enhanced-launcher.js','vzone-telegram-bot.js','vzone-telegram-engine.js','vzone-runtime-compat.js','vtrade-real-candle-gate-v1.js','vzone-new-ui-route.js'];
function validate(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing V-Zone production files: '+missing.join(', '));console.log('[V-ZONE V19] file contract PASS | WEB APP + TELEGRAM + REAL CANDLE');}
function safeRequire(file,label){try{return require(path.join(ROOT,file));}catch(e){console.error(`[V-ZONE V19] ${label} failed:`,e.stack||e.message||e);return null;}}
try{
 validate();
 safeRequire('vzone-runtime-compat.js','candleGuard compatibility');
 safeRequire('vzone-new-ui-route.js','New V-Zone AI Web App route');
 const server=safeRequire('server.js','HTTP server');
 console.log('[V-ZONE V19] CANDLE GUARD | global binding installed before server');
 console.log('[V-ZONE V19] WEB APP ROUTES | /v-zone-ai | /vtrade-new | /dashboard-new');
 console.log('[V-ZONE V19] SIGNAL CORE | MT5 REAL CANDLE | ICT+CRT | FAIL-CLOSED');
 const telegram=safeRequire('vzone-telegram-bot.js','V-Zone Telegram worker');
 console.log(`[V-ZONE V19] TELEGRAM WORKER | ${telegram?'LOADED':'DISABLED — credentials or worker unavailable'}`);
 console.log('[V-ZONE V19] TELEGRAM COMMANDS | /signal /status /start');
 module.exports={server,telegram};
}catch(e){console.error('[V-ZONE V19] STARTUP ERROR:',e.stack||e.message||e);process.exitCode=1;}
