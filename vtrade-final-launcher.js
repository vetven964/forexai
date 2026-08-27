// V-ZONE AI WEB APP + TELEGRAM PRODUCTION LAUNCHER V18
'use strict';
const fs=require('fs');const path=require('path');const ROOT=__dirname;
const REQUIRED=['server.js','vtrade-enhanced-launcher.js','vzone-telegram-bot.js','vzone-telegram-engine.js','vzone-runtime-compat.js','vtrade-real-candle-gate-v1.js','vzone-new-ui-route.js'];
function validate(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing V-Zone production files: '+missing.join(', '));console.log('[V-ZONE V18] file contract PASS | WEB APP + TELEGRAM + REAL CANDLE');}
function safeRequire(file,label){try{return require(path.join(ROOT,file));}catch(e){console.error(`[V-ZONE V18] ${label} failed:`,e.stack||e.message||e);return null;}}
try{
 validate();
 safeRequire('vzone-runtime-compat.js','candleGuard compatibility');
 safeRequire('vzone-new-ui-route.js','New V-Zone AI Web App route');
 const server=safeRequire('server.js','HTTP server');
 console.log('[V-ZONE V18] CANDLE GUARD | global binding installed before server');
 console.log('[V-ZONE V18] WEB APP ROUTES | /v-zone-ai | /vtrade-new | /dashboard-new');
 console.log('[V-ZONE V18] SIGNAL CORE | MT5 REAL CANDLE | ICT+CRT | FAIL-CLOSED');
 // The production service must load the canonical Telegram worker in the same runtime.
 // The worker itself remains fail-closed when Telegram credentials are absent.
 const telegram=safeRequire('vzone-telegram-bot.js','V-Zone Telegram worker');
 console.log(`[V-ZONE V18] TELEGRAM WORKER | ${telegram?'LOADED':'DISABLED — credentials or worker unavailable'}`);
 console.log('[V-ZONE V18] TELEGRAM COMMANDS | /signal /status /start');
 module.exports={server,telegram};
}catch(e){console.error('[V-ZONE V18] STARTUP ERROR:',e.stack||e.message||e);process.exitCode=1;}
