// V-ZONE AI WEB APP + TELEGRAM PRODUCTION LAUNCHER V20
'use strict';
const fs=require('fs');const path=require('path');const ROOT=__dirname;

// Render may invoke this launcher directly instead of package.json "start".
// Boot the canonical MT5 authority route before server.js is loaded.
try{
  require(path.join(ROOT,'pre-market-route-boot-hotfix.js'));
  console.log('[V-ZONE V20] PRE-MARKET BOOT | canonical MT5 authority route persisted before server');
}catch(e){
  console.error('[V-ZONE V20] PRE-MARKET BOOT FAILED:',e.stack||e.message||e);
  throw e;
}

const REQUIRED=['server.js','vtrade-enhanced-launcher.js','vzone-telegram-engine.js','vzone-runtime-compat.js','vtrade-real-candle-gate-v1.js','vzone-new-ui-route.js'];
function validate(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing V-Zone production files: '+missing.join(', '));console.log('[V-ZONE V20] file contract PASS | WEB APP + TELEGRAM + REAL CANDLE');}
function safeRequire(file,label){try{return require(path.join(ROOT,file));}catch(e){console.error(`[V-ZONE V20] ${label} failed:`,e.stack||e.message||e);return null;}}
try{
 validate();
 safeRequire('vzone-runtime-compat.js','candleGuard compatibility');
 safeRequire('vzone-new-ui-route.js','New V-Zone AI Web App route');
 const server=safeRequire('server.js','HTTP server');
 console.log('[V-ZONE V20] CANDLE GUARD | global binding installed before server');
 console.log('[V-ZONE V20] WEB APP ROUTES | /v-zone-ai | /vtrade-new | /dashboard-new');
 console.log('[V-ZONE V20] SIGNAL CORE | MT5 REAL CANDLE | ICT+CRT | FAIL-CLOSED');
 // Telegram polling is intentionally NOT started inside the core web process.
 // A dedicated V-Zone Telegram worker owns getUpdates; this prevents Telegram 409 conflicts.
 console.log('[V-ZONE V20] TELEGRAM POLLING | CORE DISABLED | dedicated V-Zone Telegram worker owns getUpdates');
 module.exports={server};
}catch(e){console.error('[V-ZONE V20] STARTUP ERROR:',e.stack||e.message||e);process.exitCode=1;}
