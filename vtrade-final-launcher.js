// V-TRADE FINAL PRODUCTION LAUNCHER V7
// Ownership boundaries:
//   1) PRE-MARKET AI = pre-market-ai-core.js
//   2) FRIDAY/MONDAY TRANSITION = monday-fresh-candle-contract.js
//   3) TELEGRAM BOT = telegram-bot-ai-service-v6.js
//   4) TELEGRAM RESULT = telegram-signal-result-v1.js (read-only result consumer)
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=__dirname;
const REQUIRED=['vtrade-enhanced-launcher.js','server-launcher.js','server.js','telegram-bot-ai-service-v6.js','telegram-v6-delivery-hotfix-v7.js','telegram-v8-startup-chat-test.js','telegram-signal-bridge.js','telegram-signal-result-v1.js','pre-market-ai-core.js','monday-fresh-candle-contract.js','package-access-hotfix.js','pre-market-route-boot-hotfix.js','ai-confirmation-runtime-v2.js','pre-market-structure-hook.js','predeploy-consistency-hotfix.js'];
function validateProductionFiles(){const missing=REQUIRED.filter(f=>!fs.existsSync(path.join(ROOT,f)));if(missing.length)throw new Error('Missing production files: '+missing.join(', '));console.log('[V-TRADE FINAL] production file contract PASS | PRE-MARKET / MONDAY / TELEGRAM / RESULT present');}
function validateOwnership(){const pre=require('./pre-market-ai-core.js');const contract=pre.assertOwnership();console.log('[V-TRADE ARCHITECTURE] PRE-MARKET=OWNED | Telegram=NOT_LOADED | FridayMonday=NOT_OWNED');console.log('[V-TRADE ARCHITECTURE] MONDAY TRANSITION=OWNED | Telegram=READ_ONLY');console.log('[V-TRADE ARCHITECTURE] TELEGRAM=BOT ONLY | telegram-bot-ai-service-v6.js');console.log('[V-TRADE ARCHITECTURE] TELEGRAM RESULT=READ-ONLY | telegram-signal-result-v1.js');return contract;}
try{validateProductionFiles();validateOwnership();require('./monday-fresh-candle-contract.js');require('./telegram-v6-delivery-hotfix-v7.js');require('./telegram-v8-startup-chat-test.js');if(String(process.env.TELEGRAM_TOKEN||'').trim()&&String(process.env.TELEGRAM_CHAT_ID||'').trim()){require('./telegram-signal-result-v1.js');console.log('[V-TRADE FINAL] Telegram signal result tracker loaded');}else{console.log('[V-TRADE FINAL] Telegram signal result tracker skipped | credentials not configured');}console.log('[V-TRADE FINAL] Telegram V6 delivery + startup chat verification loaded');console.log('[V-TRADE FINAL] starting canonical ownership architecture');require('./vtrade-enhanced-launcher.js');}catch(e){console.error('[V-TRADE FINAL LAUNCHER] FATAL:',e.stack||e.message);process.exitCode=1;}
