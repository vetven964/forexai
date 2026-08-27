/* V-TRADE AI — Telegram Bot AI Service V3
 * LEGACY TELEGRAM SERVICE — polling disabled.
 * V-ZONE V18 is the single authoritative Telegram command/polling owner.
 * This file remains as a compatibility service and must never start getUpdates.
 */
'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const TOKEN=String(process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_AUTO_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_CHAT_ID||'').trim();
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE TELEGRAM AI] disabled: missing Telegram credentials');module.exports={enabled:false};}
else{
  // IMPORTANT: do not use polling here. Only V-ZONE V18 may call getUpdates.
  let bot=null;
  try{bot=new TelegramBot(TOKEN,{polling:false});}catch(e){console.error('[V-TRADE TELEGRAM AI] client init failed:',e?.message||e);}
  console.log('[V-TRADE TELEGRAM AI] compatibility client loaded | polling=false | owner=V-ZONE V18');
  module.exports={enabled:!!bot,bot,chatId:CHAT_ID};
}
