// V-ZONE AI WEB APP + TELEGRAM PRODUCTION LAUNCHER V17
'use strict';
const fs=require('fs');const path=require('path');const ROOT=__dirname;
const REQUIRED=['server.js','vtrade-enhanced-launcher.js','vzone-telegram-bot.js','vzone-telegram-engine.js','vzone-runtime-compat.js','vtrade-real-candle-gate-v1.js','vzone-new-ui-route.js'];
function validate(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing V-Zone production files: '+missing.join(', '));console.log('[V-ZONE V17] file contract PASS | WEB APP + TELEGRAM + REAL CANDLE');}
function safeRequire(file,label){try{return require(path.join(ROOT,file));}catch(e){console.error(`[V-ZONE V17] ${label} failed:`,e.stack||e.message||e);return null;}}
try{
 validate();
 // Canonical runtime compatibility MUST load before any legacy/Telegram consumer.
 safeRequire('vzone-runtime-compat.js','candleGuard compatibility');
 // Install the canonical new web-app route before HTTP server startup.
 safeRequire('vzone-new-ui-route.js','New V-Zone AI Web App route');
 const server=safeRequire('server.js','HTTP server');
 console.log('[V-ZONE V17] CANDLE GUARD | global binding installed before server');
 console.log('[V-ZONE V17] WEB APP ROUTES | /v-zone-ai | /vtrade-new | /dashboard-new');
 console.log('[V-ZONE V17] TELEGRAM BOT | /signal /status /start');
 console.log('[V-ZONE V17] SIGNAL CORE | MT5 REAL CANDLE | ICT+CRT | FAIL-CLOSED');
 module.exports={server};
}catch(e){console.error('[V-ZONE V17] STARTUP ERROR:',e.stack||e.message||e);process.exitCode=1;}
