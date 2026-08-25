// V-TRADE FINAL PRODUCTION LAUNCHER V9
// PRE-MARKET AI is independent; Telegram has a signal-only consumer.
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=__dirname;
const PRE_SIGNAL='telegram-premarket-signal-v2.js';
const REQUIRED=['vtrade-enhanced-launcher.js','server-launcher.js','server.js','telegram-bot-ai-service-v6.js','telegram-v6-delivery-hotfix-v7.js','telegram-v8-startup-chat-test.js','telegram-signal-bridge.js','telegram-signal-result-v1.js','telegram-premarket-signal-v1.js',PRE_SIGNAL,'pre-market-ai-core.js','monday-fresh-candle-contract.js','package-access-hotfix.js','pre-market-route-boot-hotfix.js','ai-confirmation-runtime-v2.js','pre-market-structure-hook.js','predeploy-consistency-hotfix.js'];
function validate(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing production files: '+missing.join(', '));console.log('[V-TRADE FINAL V9] file contract PASS | PRE-MARKET + TELEGRAM + RESULT + SIGNAL-V2');}
function ownership(){const pre=require('./pre-market-ai-core.js');pre.assertOwnership();console.log('[V-TRADE ARCHITECTURE] PRE-MARKET=OWNED | Telegram credentials NOT consumed by core');console.log('[V-TRADE ARCHITECTURE] TELEGRAM=BOT ONLY | RESULT=READ-ONLY | PRE-SIGNAL=SIGNAL-ONLY');}
try{validate();ownership();require('./monday-fresh-candle-contract.js');require('./telegram-v6-delivery-hotfix-v7.js');require('./telegram-v8-startup-chat-test.js');if(String(process.env.TELEGRAM_TOKEN||'').trim()&&String(process.env.TELEGRAM_CHAT_ID||'').trim()){require('./telegram-signal-result-v1.js');require('./'+PRE_SIGNAL);console.log('[V-TRADE FINAL V9] Telegram result + Pre-Market Signal V2 loaded');}else console.log('[V-TRADE FINAL V9] Telegram children skipped | credentials not configured');require('./vtrade-enhanced-launcher.js');}catch(e){console.error('[V-TRADE FINAL V9] FATAL:',e.stack||e.message);process.exitCode=1;}
