// V-TRADE FINAL PRODUCTION LAUNCHER V13
// PRE-MARKET AI is independent; Telegram children are isolated consumers.
'use strict';
const fs=require('fs');const path=require('path');const ROOT=__dirname;
const PRE_SIGNAL='telegram-premarket-signal-v2.js';
const REQUIRED=['vtrade-enhanced-launcher.js','server-launcher.js','server.js','telegram-bot-ai-service-v6.js','telegram-v6-delivery-hotfix-v7.js','telegram-v8-startup-chat-test.js','telegram-signal-bridge.js','telegram-signal-result-v1.js','telegram-premarket-signal-v1.js',PRE_SIGNAL,'pre-market-ai-core.js','monday-fresh-candle-contract.js','package-access-hotfix.js','pre-market-route-boot-hotfix.js','ai-confirmation-runtime-v2.js','predeploy-consistency-hotfix.js','pre-market-signal-authority-v2.js','vtrade-pre-market-ob-safety-hotfix.js','vtrade-server-ob-scope-fix.js','telegram-market-bridge-runtime-fix.js'];
function validate(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing production files: '+missing.join(', '));console.log('[V-TRADE FINAL V13] file contract PASS | PRE-MARKET + TELEGRAM + BRIDGE-ROUTING + OB-SCOPE-FIX');}
function ownership(){const pre=require('./pre-market-ai-core.js');pre.assertOwnership();console.log('[V-TRADE ARCHITECTURE] PRE-MARKET=OWNED | Telegram credentials NOT consumed by core');console.log('[V-TRADE ARCHITECTURE] TELEGRAM=BOT ONLY | RESULT=READ-ONLY | PRE-SIGNAL=SIGNAL-ONLY');}
function safeRequire(file,label){try{return require(file);}catch(e){console.warn(`[V-TRADE ISOLATION] ${label} disabled safely:`,e.stack||e.message||e);return null;}}
try{
 validate();
 ownership();
 safeRequire('./telegram-market-bridge-runtime-fix.js','Telegram market bridge routing');
 safeRequire('./vtrade-server-ob-scope-fix.js','Pre-Market OB scope/function fix');
 safeRequire('./vtrade-pre-market-ob-safety-hotfix.js','Pre-Market OB safety');
 safeRequire('./monday-fresh-candle-contract.js','Monday contract');
 safeRequire('./telegram-v6-delivery-hotfix-v7.js','Telegram delivery');
 safeRequire('./telegram-v8-startup-chat-test.js','Telegram startup test');
 if(String(process.env.TELEGRAM_TOKEN||'').trim()&&String(process.env.TELEGRAM_CHAT_ID||'').trim()){
   safeRequire('./telegram-signal-result-v1.js','Telegram result tracker');
   console.log('[V-TRADE FINAL V13] Telegram result child isolated | CORE will remain alive on child failure');
 }else console.log('[V-TRADE FINAL V13] Telegram children skipped | credentials not configured');
 const core=safeRequire('./vtrade-enhanced-launcher.js','CORE launcher');
 if(!core) console.error('[V-TRADE FINAL V13] CORE launcher failed; no child failure may terminate this process');
}catch(e){
 console.error('[V-TRADE FINAL V13] STARTUP ERROR:',e.stack||e.message||e);
}
