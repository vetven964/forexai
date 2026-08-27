/* V-TRADE TELEGRAM PRE-MARKET SIGNAL V7
 * Telegram is a read-only consumer of broker-native MT5 analysis.
 * V-ZONE V18 owns Telegram commands/polling; this worker never calls getUpdates.
 */
'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const fs=require('fs');
const path=require('path');
const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||process.env.RENDER_EXTERNAL_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(15000,Number(process.env.TELEGRAM_PREMARKET_POLL_MS||30000));
const STATE=path.join(__dirname,'data','telegram-last-premarket-signal.json');
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE PRE-MARKET TELEGRAM V7] disabled: missing credentials');module.exports={enabled:false};}
else{
 const bot=new TelegramBot(TOKEN,{polling:false});
 async function getAuthority(){
  const h={'Cache-Control':'no-cache','X-VTRADE-CLIENT':'telegram-premarket-v7'};
  if(KEY)h['X-VTRADE-TELEGRAM-KEY']=KEY;
  const r=await fetch(CORE_URL+'/api/analysis/xauusd',{headers:h,cache:'no-store'});
  const text=await r.text();let d={};try{d=JSON.parse(text)}catch(_){throw new Error(`CORE returned non-JSON HTTP ${r.status}: ${text.slice(0,120)}`)}
  if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);return d;
 }
 async function scan(){try{const raw=await getAuthority();console.log(`[V-TRADE PRE-MARKET TELEGRAM V7] AUTHORITY | MT5=${raw?.connected===true?'READY':'WAIT'} | bias=${raw?.bias||'NEUTRAL'} | score=${raw?.directionScore??0} | polling=false`);}catch(e){console.warn('[V-TRADE PRE-MARKET TELEGRAM V7] scan failed:',e?.message||e)}}
 console.log(`[V-TRADE PRE-MARKET TELEGRAM V7] ACTIVE | authority=/api/analysis/xauusd | polling=false | owner=V-ZONE V18 | interval=${POLL_MS}ms`);
 setInterval(scan,POLL_MS);scan();
 module.exports={enabled:true,bot,chatId:CHAT_ID,scan};
}
