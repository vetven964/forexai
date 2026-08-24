/* V-TRADE AI — Telegram Bot AI Service V4
 * Authoritative scanner: MT5 snapshot + CORE Pre-Market gates.
 * No independent/synthetic ICT gate calculation.
 * Friday context / Monday transition remain owned by CORE Pre-Market.
 */
'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const {getNews,formatNews}=require('./market-news-service.js');
const TOKEN=String(process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_AUTO_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(5000,Number(process.env.TELEGRAM_AI_POLL_MS||60000));
const NEWS_POLL_MS=Math.max(60000,Number(process.env.TELEGRAM_NEWS_POLL_MS||300000));
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE TELEGRAM AI] disabled: Telegram credentials missing');process.exit(0);}

process.on('unhandledRejection',e=>console.error('[V-TRADE TELEGRAM AI] unhandled rejection:',e?.stack||e));
process.on('uncaughtException',e=>console.error('[V-TRADE TELEGRAM AI] uncaught exception:',e?.stack||e));

let bot;
try{
  console.log('[V-TRADE TELEGRAM AI] child boot | token=PRESENT | chat=PRESENT | core='+CORE_URL);
  bot=new TelegramBot(TOKEN,{polling:{autoStart:false}});
  bot.on('polling_error',e=>console.error('[V-TRADE TELEGRAM AI] polling error:',e?.message||e));
  bot.on('error',e=>console.error('[V-TRADE TELEGRAM AI] bot error:',e?.message||e));
  bot.startPolling().then(()=>console.log('[V-TRADE TELEGRAM AI] polling started | V4 child READY')).catch(e=>console.error('[V-TRADE TELEGRAM AI] polling start failed:',e?.stack||e));
}catch(e){
  console.error('[V-TRADE TELEGRAM AI] bot initialization failed:',e?.stack||e);
  process.exit(1);
}

let lastKey='',busy=false,newsBusy=false;const seenNews=new Set();
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const bars=(s,tf)=>Array.isArray(s?.timeframes?.[tf]?.bars)?s.timeframes[tf].bars:[];
async function getJSON(path){const h={};if(BRIDGE_KEY)h['X-VTRADE-TELEGRAM-KEY']=BRIDGE_KEY;const r=await fetch(CORE_URL+path,{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d?.success===false)throw new Error(d?.error||`HTTP ${r.status}`);return d;}
function bool(v){return v===true||v===1||String(v).toLowerCase()==='true'||String(v).toUpperCase()==='PASS';}
function gate(pre,name,...aliases){const g=pre?.gates||{},c=pre?.confirmations||{},i=pre?.ict||{};return [g[name],...aliases.map(k=>c[k]),...aliases.map(k=>i?.[k]?.confirmed),...aliases].some(bool);}
function analyze(m,pre){
  const tfs=['M5','M15','H1','H4'];
  const rows=tfs.map(tf=>({tf,ready:bars(m,tf).length>=20}));
  const mtfReady=rows.every(x=>x.ready);
  const price=num(m.price);
  const rawBias=String(pre?.bias||pre?.direction||pre?.resolvedBias||'').toUpperCase();
  const bias=rawBias.includes('BULL')?'BULLISH':rawBias.includes('BEAR')?'BEARISH':'NEUTRAL';
  const buy=num(pre?.buyStrengthPct??pre?.buyScore??pre?.buyPct);
  const sell=num(pre?.sellStrengthPct??pre?.sellScore??pre?.sellPct);
  const strength=buy!=null&&sell!=null?Math.round(Math.max(buy,sell)):num(pre?.confidence??pre?.preAiConfidence)??0;
  const gates={MTF:mtfReady,LIQ:gate(pre,'liquiditySweep','liquiditySweepOk','sweepOk'),MSS:gate(pre,'mss','mssOk','structureAgreement'),BOS:gate(pre,'bos','bosOk'),DISP:gate(pre,'displacement','displacementOk'),FVG:gate(pre,'fvg','fvgOk','freshFvg'),OB:gate(pre,'orderBlock','orderBlockOk','obOk','freshOb'),PD:gate(pre,'premiumDiscountOk','locationOk'),ZONE:gate(pre,'executionZone','executionZoneOk','retest','zoneIsNear'),MOM:gate(pre,'technicalMomentumOk','momentumOk','trendStrengthOk'),SPREAD:gate(pre,'spreadOk')};
  const preAll=bool(pre?.gates?.allGatesPassed)||bool(pre?.confirmations?.allGatesPassed)||bool(pre?.execution?.authorization&&pre?.execution?.status==='ENTRY_READY');
  const transition=pre?.workflow?.marketTransition||pre?.marketTransition||{};
  const historicalFriday=transition.fridayContext===true||transition.phase==='SUNDAY_PREOPEN'||transition.phase==='MONDAY_OPEN_WAIT';
  const freshExecution=!historicalFriday;
  const required=['LIQ','MSS','BOS','DISP','FVG','OB','PD','ZONE','MOM','SPREAD'];
  const ictReady=required.every(k=>gates[k]);
  const confidence=clamp(Math.round(num(pre?.confidence??pre?.preAiConfidence??strength)??0),0,100);
  const authorized=m.connected===true&&mtfReady&&bias!=='NEUTRAL'&&preAll&&ictReady&&freshExecution&&confidence>=75;
  let entry=null,stop=null,tp=[];
  if(authorized&&price!=null){const m15=bars(m,'M15'),recent=m15.slice(-8);if(recent.length){if(bias==='BULLISH'){stop=Math.min(...recent.map(x=>Number(x.l)));const risk=Math.max(price-stop,.5);entry=price;tp=[price+risk*1.5,price+risk*2.5,price+risk*3.5];}else{stop=Math.max(...recent.map(x=>Number(x.h)));const risk=Math.max(stop-price,.5);entry=price;tp=[price-risk*1.5,price-risk*2.5,price-risk*3.5];}}}
  const reason=historicalFriday?'Friday candle is historical reference; waiting for fresh Monday/live candle.':authorized?'All CORE Pre-Market + ICT gates passed.':pre?.execution?.reason||'Waiting for mandatory CORE Pre-Market confirmation.';
  return {price,bias,directionScore:strength,confidence,signal:authorized?(bias==='BULLISH'?'BUY':'SELL'):'WAIT',authorized,entry,stop,tp,gates,reason,transition:transition.phase||'UNKNOWN',historicalFriday,preAll};
}
function fmt(v){return Number.isFinite(Number(v))?Number(v).toFixed(2):'WAIT';}
function formatSignal(a){if(a.signal==='WAIT')return ['🤖 *V TRADE AI — XAUUSD*','',`🟡 *WAIT — ${a.bias==='BULLISH'?'BUY BIAS':a.bias==='BEARISH'?'SELL BIAS':'NO BIAS'}*`,`💰 Price: *${fmt(a.price)}*`,`📈 ${a.bias} | Strength ${a.directionScore} | Conf ${a.confidence}`,'',`⏱️ CORE MTF: *${a.gates.MTF?'READY':'WAIT'}*`,`🔎 ICT: LIQ ${a.gates.LIQ?'✅':'❌'} | MSS ${a.gates.MSS?'✅':'❌'} | BOS ${a.gates.BOS?'✅':'❌'} | DISP ${a.gates.DISP?'✅':'❌'}`,`🔎 FVG ${a.gates.FVG?'✅':'❌'} | OB ${a.gates.OB?'✅':'❌'} | P/D ${a.gates.PD?'✅':'❌'} | ZONE ${a.gates.ZONE?'✅':'❌'}`,`🛡️ MOM ${a.gates.MOM?'✅':'❌'} | Spread ${a.gates.SPREAD?'✅':'❌'}`,`📅 Context: *${a.historicalFriday?'FRIDAY HISTORICAL / PRE-OPEN':'LIVE'}*`,`🎯 Entry: *WAIT* | SL: *WAIT*`,`🎯 TP1: *WAIT* | TP2: *WAIT* | TP3: *WAIT*`,`🛡️ *NO ORDER AUTHORIZED*`,`ℹ️ ${a.reason}`,'🏦 VT Markets MT5'].join('\n');return ['🤖 *V TRADE AI — XAUUSD*','',`🟢 *${a.signal}*`,`💰 Price: *${fmt(a.price)}* | 📈 ${a.bias}`,`⏱️ CORE MTF | Strength ${a.directionScore} | Conf ${a.confidence}`,`🎯 Entry: *${fmt(a.entry)}*`,`🛑 SL: *${fmt(a.stop)}*`,`🎯 TP1: *${fmt(a.tp[0])}* | TP2: *${fmt(a.tp[1])}* | TP3: *${fmt(a.tp[2])}`,`🧠 Confidence: ${a.confidence}/100`,`🔐 *ORDER AUTHORIZED*`].join('\n');}
async function scan(sendWait=false){if(busy)return;busy=true;try{const [m,pre]=await Promise.all([getJSON('/api/telegram/market-snapshot'),getJSON('/api/pre-market/xauusd')]),a=analyze(m,pre);console.log(`[TELEGRAM AUTO] CORE scan | signal=${a.signal} | bias=${a.bias} | strength=${a.directionScore} | confidence=${a.confidence} | status=${a.authorized?'AUTHORIZED':'WAIT — NO ENTRY'} | transition=${a.transition} | fridayHistorical=${a.historicalFriday}`);if(!a.authorized&&!sendWait)return;const key=[a.signal,a.entry,a.stop,a.directionScore,a.confidence,a.transition].join('|');if(key===lastKey)return;await bot.sendMessage(CHAT_ID,formatSignal(a),{parse_mode:'Markdown'});lastKey=key;}catch(e){console.warn('[V-TRADE TELEGRAM AI] scan failed:',e.message);}finally{busy=false;}}
async function sendNews(chatId,auto=false){if(newsBusy)return;newsBusy=true;try{const items=await getNews(8);if(auto){const fresh=items.filter(x=>x.impact==='HIGH'&&!seenNews.has(x.link||x.title));if(!fresh.length)return;fresh.forEach(x=>seenNews.add(x.link||x.title));await bot.sendMessage(chatId,formatNews(fresh.slice(0,3)),{parse_mode:'Markdown'});}else await bot.sendMessage(chatId,formatNews(items),{parse_mode:'Markdown',disable_web_page_preview:true});}catch(e){console.warn('[V-TRADE NEWS] scan failed:',e.message);}finally{newsBusy=false;}}
bot.onText(/^\/(news|macro|fed)(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)===CHAT_ID)await sendNews(msg.chat.id,false);});
bot.onText(/^\/signal(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)===CHAT_ID)await scan(true);});
bot.onText(/^\/price(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;try{const m=await getJSON('/api/telegram/market-snapshot');await bot.sendMessage(msg.chat.id,`💰 *XAUUSD:* ${fmt(m.price)}\n📡 MT5: *${m.connected?'READY':'WAIT'}*`,{parse_mode:'Markdown'});}catch(_){await bot.sendMessage(msg.chat.id,'⚠️ MT5 price unavailable');}});
bot.onText(/^\/help(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)===CHAT_ID)await bot.sendMessage(msg.chat.id,'🤖 *V TRADE AI — Telegram*\n\n/signal — XAUUSD CORE ICT scan\n/price — MT5 price\n/news — macro news\n/macro — macro radar\n/fed — Fed news',{parse_mode:'Markdown'});});
console.log('[V-TRADE TELEGRAM AI] CORE AUTHORITY V5 ACTIVE | MT5 + PREMARKET | Friday-safe | no synthetic gates');
scan(false);setInterval(()=>scan(false),POLL_MS);sendNews(CHAT_ID,true);setInterval(()=>sendNews(CHAT_ID,true),NEWS_POLL_MS);process.on('SIGTERM',()=>process.exit(0));process.on('SIGINT',()=>process.exit(0));