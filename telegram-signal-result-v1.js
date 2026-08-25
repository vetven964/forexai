/* V-TRADE AI — Telegram Signal Result Tracker V1
 * OWNER: Telegram Result child. READ-ONLY market/analysis consumer.
 * Purpose: after a confirmed BUY/SELL signal is sent, track price against
 * Entry/SL/TP1/TP2/TP3 and send the actual result to Telegram.
 * No order execution. No new signal generation. Fail-closed.
 */
'use strict';
require('dotenv').config();
const fs=require('fs');
const path=require('path');
const TelegramBot=require('node-telegram-bot-api');

const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(5000,Number(process.env.TELEGRAM_RESULT_POLL_MS||10000));
const RESULT_FILE=path.join(__dirname,'data','telegram-signal-results.json');

if(!TOKEN||!CHAT_ID){
  console.warn('[V-TRADE TELEGRAM RESULT] disabled: missing TELEGRAM_TOKEN/TELEGRAM_CHAT_ID');
  return;
}

const bot=new TelegramBot(TOKEN,{polling:false});
let state={active:null,lastFinalKey:''};
try{if(fs.existsSync(RESULT_FILE))state=JSON.parse(fs.readFileSync(RESULT_FILE,'utf8'))||state;}catch(e){console.warn('[V-TRADE TELEGRAM RESULT] state reset:',e.message);}
function save(){try{fs.mkdirSync(path.dirname(RESULT_FILE),{recursive:true});fs.writeFileSync(RESULT_FILE,JSON.stringify(state,null,2));}catch(e){console.warn('[V-TRADE TELEGRAM RESULT] state save failed:',e.message);}}
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const F=v=>n(v)==null?'—':Number(v).toFixed(2);
function sideOf(a){const s=String(a?.signal||a?.direction||'').toUpperCase();return s==='BUY'||s==='SELL'?s:null;}
function levels(a){
  const tp=Array.isArray(a?.takeProfit)?a.takeProfit.filter(x=>n(x)!=null).map(Number):[];
  return {entry:n(a?.entry),sl:n(a?.stopLoss),tp};
}
async function request(p){
  const h={'Cache-Control':'no-cache'};if(BRIDGE_KEY)h['X-VTRADE-TELEGRAM-KEY']=BRIDGE_KEY;
  const r=await fetch(CORE_URL+p,{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d;
}
async function readAnalysis(){
  for(const p of ['/api/analysis/xauusd','/api/telegram/market-snapshot']){
    try{const d=await request(p);if(d?.success!==false)return d;}catch(e){}
  }
  return null;
}
function extract(d){
  const a=d?.analysis||d?.result||d?.data||d;
  const side=sideOf(a);const l=levels(a);const price=n(d?.price??a?.price??a?.currentPrice??a?.quote?.price);
  if(!side||l.entry==null||l.sl==null||l.tp.length<1)return null;
  return {side,price,entry:l.entry,sl:l.sl,tp:l.tp,signalId:String(a?.signalId||a?.id||a?.generatedAt||Date.now()),confidence:n(a?.confidence),timeframe:a?.timeframe||'MTF',zone:a?.entryZone||null};
}
function hit(s,price){
  if(price==null)return null;
  if(s.side==='BUY'){
    if(price<=s.sl)return {type:'SL',index:0,price:s.sl};
    for(let i=s.tp.length-1;i>=0;i--)if(price>=s.tp[i])return {type:`TP${i+1}`,index:i+1,price:s.tp[i]};
  }else{
    if(price>=s.sl)return {type:'SL',index:0,price:s.sl};
    for(let i=s.tp.length-1;i>=0;i--)if(price<=s.tp[i])return {type:`TP${i+1}`,index:i+1,price:s.tp[i]};
  }
  return null;
}
function pts(s,price){return s.side==='BUY'?price-s.entry:s.entry-price;}
async function send(text){await bot.sendMessage(CHAT_ID,text,{parse_mode:'Markdown'});}
async function startSignal(s){
  const key=`${s.side}|${s.entry}|${s.sl}|${s.tp.join(',')}`;
  if(state.active?.key===key)return;
  state.active={...s,key,hitIndex:0,startedAt:new Date().toISOString()};save();
  console.log(`[V-TRADE TELEGRAM RESULT] TRACKING | ${s.side} | entry=${F(s.entry)} | SL=${F(s.sl)} | TP=${s.tp.map(F).join(',')}`);
}
async function process(){
  const d=await readAnalysis();if(!d)return;
  const s=extract(d);if(!s)return;
  if(!state.active){await startSignal(s);return;}
  const a=state.active;
  if(`${s.side}|${s.entry}|${s.sl}|${s.tp.join(',')}`!==a.key){
    if(Math.abs((s.entry??0)-(a.entry??0))>0.01||s.side!==a.side){
      await startSignal(s);
      return;
    }
  }
  const price=s.price;if(price==null)return;
  const h=hit(a,price);if(!h)return;
  if(h.type==='SL'&&a.hitIndex>0)return;
  if(h.index>0&&h.index<=a.hitIndex)return;
  a.hitIndex=h.index; a.lastPrice=price; a.lastUpdateAt=new Date().toISOString();save();
  const p=pts(a,h.price);
  const icon=h.type==='SL'?'❌':'✅';
  let text=`📊 *V TRADE AI — SIGNAL RESULT*\n\n${a.side==='BUY'?'🟢':'🔴'} *${a.side} XAUUSD*\n\n${icon} *${h.type} HIT*\n📍 Price: *${F(h.price)}*\n📈 Points: *${p>=0?'+':''}${p.toFixed(2)} pts*`;
  if(h.type!=='SL'&&h.index<a.tp.length){text+=`\n\n🎯 Next: *TP${h.index+1} — ${F(a.tp[h.index])}*`;}else{text+=`\n\n🏁 *FINAL RESULT: ${h.type}*`;state.lastFinalKey=`${a.key}|${h.type}`;state.active=null;}
  await send(text);save();console.log(`[V-TRADE TELEGRAM RESULT] SENT | ${a.side} | ${h.type} | points=${p.toFixed(2)}`);
}
console.log(`[V-TRADE TELEGRAM RESULT] V1 ACTIVE | poll=${POLL_MS}ms | result-state=${RESULT_FILE}`);
setInterval(()=>process().catch(e=>console.warn('[V-TRADE TELEGRAM RESULT] scan failed:',e.message)),POLL_MS);
process().catch(()=>{});
