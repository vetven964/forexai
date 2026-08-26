/* V-TRADE AI — Telegram Signal Result Tracker V3
 * Signal result + persistent history + win/loss statistics.
 * Signal-only: never places orders.
 * Startup-safe: missing/temporarily unavailable env must never crash the web server.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const dotenv=require('dotenv');
try{dotenv.config();}catch(e){console.warn('[V-TRADE TELEGRAM RESULT] dotenv load skipped:',e.message);}
const ENV=(globalThis&&globalThis.process&&globalThis.process.env)||{};
const TelegramBot=require('node-telegram-bot-api');
const TOKEN=String(ENV.TELEGRAM_TOKEN||ENV.TELEGRAM_BOT_TOKEN||'').trim();
const CHAT_ID=String(ENV.TELEGRAM_CHAT_ID||ENV.TELEGRAM_CHATID||'').trim();
const CORE_URL=String(ENV.VTRADE_CORE_URL||ENV.APP_BASE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(ENV.TELEGRAM_BRIDGE_API_KEY||ENV.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(5000,Number(ENV.TELEGRAM_RESULT_POLL_MS||10000));
const RESULT_FILE=path.join(__dirname,'data','telegram-signal-results.json');
const HISTORY_FILE=path.join(__dirname,'data','telegram-signal-history.jsonl');
if(!TOKEN||!CHAT_ID){
 console.warn('[V-TRADE TELEGRAM RESULT] disabled: missing Telegram credentials; continuing CORE server');
 module.exports={enabled:false,reason:'missing_credentials'};
}else{
 const bot=new TelegramBot(TOKEN,{polling:false});
 let state={active:null,lastFinalKey:''};
 try{if(fs.existsSync(RESULT_FILE))state=JSON.parse(fs.readFileSync(RESULT_FILE,'utf8'))||state;}catch(e){console.warn('[V-TRADE TELEGRAM RESULT] state reset:',e.message);}
 function save(){try{fs.mkdirSync(path.dirname(RESULT_FILE),{recursive:true});fs.writeFileSync(RESULT_FILE,JSON.stringify(state,null,2));}catch(e){console.warn('[V-TRADE TELEGRAM RESULT] state save failed:',e.message);}}
 function history(row){try{fs.mkdirSync(path.dirname(HISTORY_FILE),{recursive:true});fs.appendFileSync(HISTORY_FILE,JSON.stringify(row)+'\n');}catch(e){console.warn('[V-TRADE TELEGRAM RESULT] history save failed:',e.message);}}
 const n=v=>Number.isFinite(Number(v))?Number(v):null;
 const F=v=>n(v)==null?'—':Number(v).toFixed(2);
 function sideOf(a){const s=String(a?.signal||a?.direction||'').toUpperCase();return s==='BUY'||s==='SELL'?s:null;}
 function levels(a){const tp=Array.isArray(a?.takeProfit)?a.takeProfit.filter(x=>n(x)!=null).map(Number):[];return {entry:n(a?.entry),sl:n(a?.stopLoss),tp};}
 async function request(p){const h={'Cache-Control':'no-cache'};if(BRIDGE_KEY)h['X-VTRADE-TELEGRAM-KEY']=BRIDGE_KEY;const r=await fetch(CORE_URL+p,{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d;}
 async function readAnalysis(){for(const p of ['/api/analysis/xauusd','/api/telegram/market-snapshot']){try{const d=await request(p);if(d?.success!==false)return d;}catch(e){}}return null;}
 function extract(d){const a=d?.analysis||d?.result||d?.data||d;const side=sideOf(a);const l=levels(a);const price=n(d?.price??a?.price??a?.currentPrice??a?.quote?.price);if(!side||l.entry==null||l.sl==null||l.tp.length<1)return null;return {side,price,entry:l.entry,sl:l.sl,tp:l.tp,signalId:String(a?.signalId||a?.id||a?.generatedAt||Date.now()),confidence:n(a?.confidence),timeframe:a?.timeframe||'MTF'};}
 function hit(s,price){if(price==null)return null;if(s.side==='BUY'){if(price<=s.sl)return {type:'SL',index:0,price:s.sl};for(let i=s.tp.length-1;i>=0;i--)if(price>=s.tp[i])return {type:`TP${i+1}`,index:i+1,price:s.tp[i]};}else{if(price>=s.sl)return {type:'SL',index:0,price:s.sl};for(let i=s.tp.length-1;i>=0;i--)if(price<=s.tp[i])return {type:`TP${i+1}`,index:i+1,price:s.tp[i]};}return null;}
 function pts(s,price){return s.side==='BUY'?price-s.entry:s.entry-price;}
 function stats(){let rows=[];try{rows=fs.readFileSync(HISTORY_FILE,'utf8').split('\n').filter(Boolean).map(x=>JSON.parse(x));}catch(e){}const final=rows.filter(x=>x.final);const wins=final.filter(x=>x.final==='TP1'||x.final==='TP2'||x.final==='TP3').length;const losses=final.filter(x=>x.final==='SL').length;return {signals:final.length,wins,losses,winRate:final.length?wins/final.length*100:0};}
 async function send(text){await bot.sendMessage(CHAT_ID,text,{parse_mode:'Markdown'});}
 async function startSignal(s){const key=`${s.side}|${s.entry}|${s.sl}|${s.tp.join(',')}`;if(state.active?.key===key)return;state.active={...s,key,hitIndex:0,startedAt:new Date().toISOString()};save();console.log(`[V-TRADE TELEGRAM RESULT] TRACKING | ${s.side} | entry=${F(s.entry)} | SL=${F(s.sl)} | TP=${s.tp.map(F).join(',')}`);}
 async function process(){const d=await readAnalysis();if(!d)return;const s=extract(d);if(!s)return;if(!state.active){await startSignal(s);return;}const a=state.active;const key=`${s.side}|${s.entry}|${s.sl}|${s.tp.join(',')}`;if(key!==a.key&&(Math.abs((s.entry??0)-(a.entry??0))>0.01||s.side!==a.side)){await startSignal(s);return;}const price=s.price;if(price==null)return;const h=hit(a,price);if(!h)return;if(h.type!=='SL'&&h.index<=a.hitIndex)return;a.hitIndex=Math.max(a.hitIndex,h.index);a.lastPrice=price;a.lastUpdateAt=new Date().toISOString();save();const p=pts(a,h.price);const icon=h.type==='SL'?'❌':'✅';let text=`📊 *V TRADE AI — SIGNAL RESULT*\n\n${a.side==='BUY'?'🟢':'🔴'} *${a.side} XAUUSD*\n\n${icon} *${h.type} HIT*\n📍 Price: *${F(h.price)}*\n📈 Points: *${p>=0?'+':''}${p.toFixed(2)} pts*`;let final=null;if(h.type!=='SL'&&h.index<a.tp.length){text+=`\n\n🎯 Next: *TP${h.index+1} — ${F(a.tp[h.index])}*`;}else{final=h.type;text+=`\n\n🏁 *FINAL RESULT: ${h.type}*`;state.lastFinalKey=`${a.key}|${h.type}`;state.active=null;}if(final){history({signalId:a.signalId,side:a.side,entry:a.entry,sl:a.sl,tp:a.tp,confidence:a.confidence,timeframe:a.timeframe,final,points:p,startedAt:a.startedAt,finishedAt:new Date().toISOString()});const st=stats();text+=`\n\n📊 History: *${st.signals}* | Win: *${st.wins}* | SL: *${st.losses}* | Win-rate: *${st.winRate.toFixed(1)}%*`;}await send(text);save();console.log(`[V-TRADE TELEGRAM RESULT] SENT | ${a.side} | ${h.type} | points=${p.toFixed(2)}`);}
 console.log(`[V-TRADE TELEGRAM RESULT] V3 ACTIVE | poll=${POLL_MS}ms | persistent history=${HISTORY_FILE}`);
 const timer=setInterval(()=>process().catch(e=>console.warn('[V-TRADE TELEGRAM RESULT] scan failed:',e.message)),POLL_MS);
 process().catch(e=>console.warn('[V-TRADE TELEGRAM RESULT] initial scan failed:',e.message));
 module.exports={enabled:true,stop:()=>clearInterval(timer)};
}
