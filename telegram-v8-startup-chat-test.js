'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'telegram-bot-ai-service-v6.js');
const MARK='VTRADE_TELEGRAM_STARTUP_CHAT_TEST_V8';
if(!fs.existsSync(FILE))throw new Error('telegram-bot-ai-service-v6.js not found');
let s=fs.readFileSync(FILE,'utf8');
if(!s.includes(MARK)){
  const anchor="(async()=>{try{const me=await bot.getMe();console.log('[V-TRADE TELEGRAM V6] BOT AUTH OK | username=@'+String(me?.username||'unknown'));}catch(e){console.error('[V-TRADE TELEGRAM V6] BOT AUTH FAILED | '+e.message);}})();";
  const replacement=anchor+`\n// ${MARK}\nif(String(process.env.TELEGRAM_STARTUP_MESSAGE||'true').toLowerCase()==='true'){setTimeout(async()=>{try{await bot.sendMessage(CHAT_ID,'🤖 V TRADE AI — Telegram Bot V6 ONLINE\\n✅ Bot authentication OK\\n✅ Chat delivery OK\\n🔒 WAIT/BUY/SELL delivery is controlled by CORE authority.');console.log('[V-TRADE TELEGRAM V6] STARTUP CHAT TEST SENT | delivery=OK');}catch(e){console.error('[V-TRADE TELEGRAM V6] STARTUP CHAT TEST FAILED | '+e.message);}},1500);}`;
  if(!s.includes(anchor))throw new Error('Telegram auth anchor not found');
  s=s.replace(anchor,replacement);
  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE TELEGRAM] V8 startup chat test installed');
}else console.log('[V-TRADE TELEGRAM] V8 startup chat test already active');
module.exports={MARK};
