'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'telegram-bot-ai-service-v6.js');
const MARK='VTRADE_TELEGRAM_DELIVERY_V8_ENTRY_ONLY';

if(!fs.existsSync(FILE)) throw new Error('telegram-bot-ai-service-v6.js not found');
let s=fs.readFileSync(FILE,'utf8');
if(!s.includes(MARK)){
  // V6 base gate: unauthorized automatic WAIT must stay silent.
  const oldGate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | canonical authority not authorized');return;}";
  const newGate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | ENTRY-ONLY policy | canonical authority not authorized');return;}";
  if(s.includes(oldGate)) s=s.replace(oldGate,newGate);

  // Older V7 hotfix emitted one WAIT every five minutes. Remove that behavior
  // while keeping the duplicate-delivery protection for authorized entries.
  const v7Gate="if(!manual&&!x.authorized){const waitBucket=Math.floor(Date.now()/300000);const waitKey=`WAIT|${String(a.symbol||'XAUUSD')}|${String(a.executionTimeframe||'M5')}|${waitBucket}`;if(waitKey===lastWaitKey){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | duplicate M5 delivery');return;}await bot.sendMessage(CHAT_ID,format(x,false),{parse_mode:'Markdown'});lastWaitKey=waitKey;console.log(`[V-TRADE TELEGRAM V6] WAIT SENT | authorized=false | m5Bucket=${waitBucket}`);return;}";
  const v8Gate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | ENTRY-ONLY policy | canonical authority not authorized');return;}";
  if(s.includes(v7Gate)) s=s.replace(v7Gate,v8Gate);

  // Keep bot authentication diagnostics in the child service.
  const oldPolling="bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));";
  const newPolling="bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));\nbot.on('error',e=>console.warn('[V-TRADE TELEGRAM V6] bot_error:',e.message));\n(async()=>{try{const me=await bot.getMe();console.log('[V-TRADE TELEGRAM V6] BOT AUTH OK | username=@'+String(me?.username||'unknown'));}catch(e){console.error('[V-TRADE TELEGRAM V6] BOT AUTH FAILED | '+e.message);}})();";
  if(!s.includes("BOT AUTH OK | username=@")){
    if(s.includes(oldPolling)) s=s.replace(oldPolling,newPolling);
  }

  s=s.replace("// VTRADE_TELEGRAM_DELIVERY_V7_WAIT_ONCE_PER_M5", "// VTRADE_TELEGRAM_DELIVERY_V7_WAIT_ONCE_PER_M5\n// VTRADE_TELEGRAM_DELIVERY_V8_ENTRY_ONLY");
  s=s.includes('VTRADE_TELEGRAM_DELIVERY_V8_ENTRY_ONLY')?s:s+'\n// VTRADE_TELEGRAM_DELIVERY_V8_ENTRY_ONLY\n';
  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE TELEGRAM] Delivery V8 active | ENTRY-ONLY | automatic WAIT suppressed | no candle fabrication');
}else console.log('[V-TRADE TELEGRAM] Delivery V8 already active');

module.exports={MARK};
