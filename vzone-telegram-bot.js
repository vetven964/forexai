'use strict';
require('dotenv').config();
require('./vzone-runtime-compat');
const TelegramBot=require('node-telegram-bot-api');
const {scoreSnapshot,formatTelegram}=require('./vzone-telegram-engine');
const TOKEN=String(process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_AUTO_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(3000,Number(process.env.VZONE_TELEGRAM_POLL_MS||5000));
const ENGINE_VERSION='V-ZONE-TELEGRAM-V3';
if(!TOKEN){console.error('[V-ZONE TELEGRAM] CONFIG ERROR | TELEGRAM_TOKEN missing');process.exit(1);}
if(!CHAT_ID) console.warn('[V-ZONE TELEGRAM] CHAT TARGET not configured | command replies use originating chat | auto delivery disabled');
const bot=new TelegramBot(TOKEN,{polling:true});let lastKey='';
function allowed(msg){return !CHAT_ID||String(msg.chat.id)===CHAT_ID;}
function target(msg){return CHAT_ID||String(msg.chat.id);}
function normalizeMarket(d){const candidates=[d?.snapshot,d?.marketSnapshot,d?.market,d?.data,d?.result,d];const s=candidates.find(x=>x&&typeof x==='object'&&(x.timeframes||x.connected!==undefined||x.price!==undefined));if(!s)throw new Error('market snapshot missing');const tf=s.timeframes||s.mtf||{};return {...s,connected:s.connected===true||s.state==='READY'||s.mt5?.state==='READY',price:s.price??s.livePrice??s.currentPrice??s.quote?.price??s.quote?.bid??s.quote?.ask,timeframes:tf};}
async function requestJson(path){const headers=BRIDGE_KEY?{'X-VTRADE-TELEGRAM-KEY':BRIDGE_KEY}:{};const r=await fetch(CORE_URL+path,{headers,cache:'no-store'});const text=await r.text();let d={};try{d=JSON.parse(text);}catch{throw new Error(`CORE_NOT_JSON HTTP ${r.status}`);}if(!r.ok)throw new Error(d?.error||`HTTP ${r.status}`);return d;}
async function market(){const paths=['/api/telegram/market-snapshot-v5','/api/telegram/market-snapshot','/api/market-snapshot','/api/mt5/market-snapshot'];let lastErr=null;for(const path of paths){try{return normalizeMarket(await requestJson(path));}catch(e){lastErr=e;console.warn(`[V-ZONE TELEGRAM] MARKET ENDPOINT MISS | ${path} | ${e.message}`);}}throw new Error(`MARKET_BRIDGE_FAILED | ${lastErr?.message||'no market endpoint available'}`);}
function key(a){return [a.signal,a.score,a.bias,a.entry,a.sl,...(a.tp||[])].join('|');}
async function scan(force=false,chatId=null){try{const snapshot=await market();const a=scoreSnapshot(snapshot);console.log(`[V-ZONE TELEGRAM] SCAN | engine=${ENGINE_VERSION} | signal=${a.signal} | bias=${a.bias} | score=${a.score} | gates=${a.gateCount} | authorized=${a.authorized}`);if(!a.authorized&&!force)return;const k=key(a);if(!force&&k===lastKey)return;const destination=chatId||CHAT_ID;if(!destination){console.warn('[V-ZONE TELEGRAM] DELIVERY SKIP | no CHAT_ID target');return;}await bot.sendMessage(destination,formatTelegram(a),{parse_mode:'Markdown'});if(a.authorized)lastKey=k;console.log(`[V-ZONE TELEGRAM] SENT | engine=${ENGINE_VERSION} | authorized=${a.authorized} | chat=${destination}`);}catch(e){console.warn('[V-ZONE TELEGRAM] DELIVERY ERROR |',e.message);}}
bot.onText(/^\/(signal|scan)(?:@\w+)?$/i,async msg=>{if(!allowed(msg))return;await scan(true,target(msg));});
bot.onText(/^\/(status|start)(?:@\w+)?$/i,async msg=>{if(!allowed(msg))return;await bot.sendMessage(target(msg),'🤖 *V-Zone AI*\n🟢 Telegram Engine: ONLINE\n📊 XAUUSD: REALTIME\n🧠 ICT + CRT: EQUAL-WEIGHT\n🕯️ Real Closed Candle: ON\n🔐 Auto Order: FAIL-CLOSED\n⚙️ Engine: *V-ZONE-TELEGRAM-V3*',{parse_mode:'Markdown'});});
bot.on('polling_error',e=>console.warn('[V-ZONE TELEGRAM] POLLING ERROR |',e.message));
bot.on('error',e=>console.warn('[V-ZONE TELEGRAM] ERROR |',e.message));
console.log(`[V-ZONE TELEGRAM] ONLINE | ${ENGINE_VERSION} | XAUUSD REALTIME | ICT+CRT | FAIL-CLOSED | core=${CORE_URL} | target=${CHAT_ID||'COMMAND_CHAT'}`);
if(CHAT_ID)scan(true);setInterval(()=>{if(CHAT_ID)scan(false);},POLL_MS);
