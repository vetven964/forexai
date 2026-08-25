/* V-TRADE Telegram WAIT Delivery Hotfix V1
 * Telegram ONLY. Does not change ICT authorization/execution logic.
 * Sends compact WAIT updates when the canonical Telegram AI scan is not authorized.
 * Uses Telegram HTTP sendMessage only; no second polling client is created.
 */
'use strict';
require('dotenv').config();
const TOKEN=String(process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_AUTO_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||`http://127.0.0.1:${process.env.PORT||10000}`).replace(/\/$/,'');
const KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(15000,Number(process.env.TELEGRAM_WAIT_DELIVERY_MS||60000));
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE TELEGRAM WAIT] disabled: credentials missing');return;}
let lastKey='';let busy=false;
async function send(text){const r=await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:CHAT_ID,text,parse_mode:'Markdown'})});if(!r.ok)throw new Error(`Telegram HTTP ${r.status}`);const d=await r.json().catch(()=>({}));if(!d.ok)throw new Error(d.description||'Telegram send failed');}
async function scan(){if(busy)return;busy=true;try{const h={};if(KEY)h['X-VTRADE-TELEGRAM-KEY']=KEY;const r=await fetch(CORE_URL+'/api/telegram/market-snapshot',{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d?.success!==true)throw new Error(d?.error||`HTTP ${r.status}`);const a=d.analysis||d.signal||d.ai||d;const signal=String(a.signal||'WAIT').toUpperCase();const authorized=Boolean(a.tradeAuthorized||a.authorized||signal==='BUY'||signal==='SELL');if(authorized)return;const price=Number(d.price??a.price);const bias=String(a.bias||'NEUTRAL');const score=Number(a.directionScore??a.score??50);const confidence=Number(a.confidence??0);const gates=a.gateCount??a.gatesCount??'0/10';const reason=String(a.reason||'Setup incomplete').split(';')[0].trim();const key=[signal,bias,score,confidence,gates,Math.round(price*100)].join('|');if(key===lastKey)return;const text=`🤖 *V TRADE AI — XAUUSD*\n💰 ${Number.isFinite(price)?price.toFixed(2):'WAIT'} | 🟡 WAIT\n📈 *${bias}* | Score *${Math.round(score)}/100* | Confidence *${Math.round(confidence)}/100*\n🔎 ICT *${gates}*\n⏳ *WAIT — NO ORDER*\n🧠 ${reason||'Setup incomplete'}`;await send(text);lastKey=key;console.log(`[V-TRADE TELEGRAM WAIT] SENT | bias=${bias} | score=${Math.round(score)} | confidence=${Math.round(confidence)} | gates=${gates}`);}catch(e){console.warn('[V-TRADE TELEGRAM WAIT] delivery failed:',e.message);}finally{busy=false;}}
scan();setInterval(scan,POLL_MS);console.log(`[V-TRADE TELEGRAM WAIT] delivery hotfix V1 active | interval=${POLL_MS}ms | Telegram ONLY`);