'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const {scoreSnapshot,formatTelegram}=require('./vzone-telegram-engine');
const TOKEN=String(process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_AUTO_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(3000,Number(process.env.VZONE_TELEGRAM_POLL_MS||5000));
if(!TOKEN||!CHAT_ID){console.error('[V-ZONE TELEGRAM] missing TELEGRAM_TOKEN/TELEGRAM_CHAT_ID');process.exit(1);}
const bot=new TelegramBot(TOKEN,{polling:true});
let lastKey='';
function normalizeMarket(d){
  const candidates=[d?.snapshot,d?.marketSnapshot,d?.market,d?.data,d?.result,d];
  const s=candidates.find(x=>x&&typeof x==='object'&&(x.timeframes||x.connected!==undefined||x.price!==undefined));
  if(!s)throw new Error('market snapshot missing');
  const tf=s.timeframes||s.mtf||{};
  return {...s,connected:s.connected===true||s.state==='READY'||s.mt5?.state==='READY',price:s.price??s.livePrice??s.currentPrice??s.quote?.price??s.quote?.bid??s.quote?.ask,timeframes:tf};
}
async function market(){const headers=BRIDGE_KEY?{'X-VTRADE-TELEGRAM-KEY':BRIDGE_KEY}:{};const r=await fetch(CORE_URL+'/api/telegram/market-snapshot',{headers,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||`HTTP ${r.status}`);return normalizeMarket(d);}
function key(a){return [a.signal,a.score,a.entry,a.sl,...a.tp].join('|');}
async function scan(force=false){try{const snapshot=await market();const a=scoreSnapshot(snapshot);console.log(`[V-ZONE TELEGRAM] ${a.signal} | score=${a.score} | bias=${a.bias} | gates=${a.gateCount} | authorized=${a.authorized}`);if(!a.authorized){if(force)console.log('[V-ZONE TELEGRAM] manual scan: WAIT / no authorization, no trade alert sent');return;}const k=key(a);if(!force&&k===lastKey)return;await bot.sendMessage(CHAT_ID,formatTelegram(a),{parse_mode:'Markdown'});lastKey=k;}catch(e){console.warn('[V-ZONE TELEGRAM] scan:',e.message);}}
bot.onText(/^\/(signal|scan)(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await scan(true);});
bot.onText(/^\/(status|start)(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await bot.sendMessage(msg.chat.id,'🤖 *V-Zone AI*\n🟢 Telegram Engine: ONLINE\n📊 XAUUSD: REALTIME\n🧠 ICT + CRT: EQUAL-WEIGHT\n🔐 Auto Order: FAIL-CLOSED',{parse_mode:'Markdown'});});
console.log('[V-ZONE TELEGRAM] ONLINE | XAUUSD REALTIME | ICT+CRT EQUAL-WEIGHT | FAIL-CLOSED');
scan(true);setInterval(()=>scan(false),POLL_MS);
