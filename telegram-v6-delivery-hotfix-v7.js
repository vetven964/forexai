'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'telegram-bot-ai-service-v6.js');
const MARK='VTRADE_TELEGRAM_DELIVERY_V7_WAIT_ONCE_PER_M5';

if(!fs.existsSync(FILE)) throw new Error('telegram-bot-ai-service-v6.js not found');
let s=fs.readFileSync(FILE,'utf8');
if(!s.includes(MARK)){
  const oldState="let busy=false,lastSentKey='';";
  const newState="let busy=false,lastSentKey='',lastWaitKey='';\n// VTRADE_TELEGRAM_DELIVERY_V7_WAIT_ONCE_PER_M5";
  if(!s.includes(oldState)) throw new Error('V6 state anchor not found');
  s=s.replace(oldState,newState);

  const oldGate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | canonical authority not authorized');return;}";
  const newGate="if(!manual&&!x.authorized){const waitBucket=Math.floor(Date.now()/300000);const waitKey=`WAIT|${String(a.symbol||'XAUUSD')}|${String(a.executionTimeframe||'M5')}|${waitBucket}`;if(waitKey===lastWaitKey){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | duplicate M5 delivery');return;}await bot.sendMessage(CHAT_ID,format(x,false),{parse_mode:'Markdown'});lastWaitKey=waitKey;console.log(`[V-TRADE TELEGRAM V6] WAIT SENT | authorized=false | m5Bucket=${waitBucket}`);return;}";
  if(!s.includes(oldGate)) throw new Error('V6 WAIT gate anchor not found');
  s=s.replace(oldGate,newGate);

  const oldPolling="bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));";
  const newPolling="bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));\nbot.on('error',e=>console.warn('[V-TRADE TELEGRAM V6] bot_error:',e.message));\n(async()=>{try{const me=await bot.getMe();console.log('[V-TRADE TELEGRAM V6] BOT AUTH OK | username=@'+String(me?.username||'unknown'));}catch(e){console.error('[V-TRADE TELEGRAM V6] BOT AUTH FAILED | '+e.message);}})();";
  if(!s.includes(oldPolling)) throw new Error('V6 polling anchor not found');
  s=s.replace(oldPolling,newPolling);

  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE TELEGRAM] Delivery V7 hotfix installed | WAIT once per 5m bucket | no candle fabrication');
}else console.log('[V-TRADE TELEGRAM] Delivery V7 hotfix already active');

module.exports={MARK};
