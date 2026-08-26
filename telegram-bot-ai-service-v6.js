'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(30000,Number(process.env.TELEGRAM_AI_POLL_MS||60000));
const MAX_AGE_SEC=Math.max(5,Number(process.env.TELEGRAM_MAX_PRICE_AGE_SEC||15));
if(!TOKEN||!CHAT_ID){console.warn('[V-ZONEAI TELEGRAM] disabled: missing Telegram credentials');process.exit(0);}
const bot=new TelegramBot(TOKEN,{polling:{interval:3000,autoStart:true,params:{timeout:25}}});
let busy=false,lastSentKey='';
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const F=v=>v==null?'WAIT':Number(v).toFixed(2);
const yes=v=>v===true?'PASS':'WAIT';
function authorityFrom(snapshot){return snapshot?.authority&&typeof snapshot.authority==='object'?snapshot.authority:snapshot;}
async function request(path){const headers={'Cache-Control':'no-cache'};if(BRIDGE_KEY)headers['X-VTRADE-TELEGRAM-KEY']=BRIDGE_KEY;const r=await fetch(CORE_URL+path,{headers,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);return d;}
async function snapshot(){
  const d=await request('/api/pre-market/mt5-authoritative');
  const a=authorityFrom(d);
  if(!a||typeof a!=='object')throw new Error('Canonical MT5 authority payload missing');
  const m5=a?.timeframes?.M5||{};
  const candle=m5?.candle||{};
  const realCandle=(a.realCandle===true||a.candleValid===true||candle.closed===true||candle.isClosed===true)&&a.fakeCandle!==true&&a.syntheticCandle!==true&&a.candleFabricated!==true;
  const processing=a.processing||{};
  const gates=a.gates||a.confirmations||{};
  const merged={...a,realCandle,price:a.price??a.livePrice,livePrice:a.livePrice??a.price,brokerConnected:a.brokerConnected!==false,priceAgeSec:a.priceAgeSec??a.candleAgeSec,decision:a.decision||{passed:a.signalEligible===true||a.entryReady===true||a.validEntry===true},confirmations:a.confirmations||gates,gates:{...gates,allGatesPassed:gates.allGatesPassed===true||processing.gatesPassed>=Number(processing.gatesRequired||10)},takeProfit:a.takeProfit||a.execution?.tp||[],entry:a.entry??a.execution?.entry,stopLoss:a.stopLoss??a.execution?.sl};
  return {...d,authority:merged,price:merged.price,quoteConnected:d.quoteConnected!==false||merged.brokerConnected===true,preMarketLoaded:true,mtfCounts:d.mtfCounts||{M5:m5.bars||m5.count||0,M15:a.timeframes?.M15?.bars||0,H1:a.timeframes?.H1?.bars||0,H4:a.timeframes?.H4?.bars||0}};
}
function normalize(a){
  const c=a?.confirmations||a?.gates||{};
  const signal=['BUY','SELL'].includes(String(a?.signal||'').toUpperCase())?String(a.signal).toUpperCase():'WAIT';
  const canonicalPassed=a?.decision?.passed===true||a?.confirmations?.allGatesPassed===true||a?.gates?.allGatesPassed===true||a?.signalEligible===true||a?.entryReady===true||a?.validEntry===true;
  const brokerFresh=a?.brokerConnected!==false&&a?.stalePrice!==true&&(n(a?.priceAgeSec)==null||n(a.priceAgeSec)<=MAX_AGE_SEC);
  const fakeCandle=a?.fakeCandle===true||a?.syntheticCandle===true||a?.candleFabricated===true||a?.realCandle===false;
  const realCandle=a?.realCandle===true&&!fakeCandle;
  const tp=Array.isArray(a?.takeProfit)?a.takeProfit:[];
  const hasTradeLevels=n(a?.entry)!=null&&n(a?.stopLoss)!=null&&tp.length>=3;
  const authorized=signal!=='WAIT'&&canonicalPassed&&brokerFresh&&realCandle&&hasTradeLevels;
  const gates={mtf:c.mtfAligned===true||c.mtfCount>=2,sweep:c.liquiditySweep===true,mss:c.mss===true,bos:c.bos===true,displacement:c.displacement?.confirmed===true||c.displacement===true,fvg:c.freshFvg===true||c.fvg===true,ob:c.freshOb===true||c.orderBlock===true,pd:c.premiumDiscountOk===true,momentum:c.technicalMomentumOk===true,trend:c.trendStrengthOk===true,spread:c.spreadOk===true,realCandle};
  const required=Number(a?.processing?.gatesRequired||11);
  const passed=Number.isFinite(Number(a?.processing?.gatesPassed))?Number(a.processing.gatesPassed):Object.values(gates).filter(Boolean).length;
  const reasons=[];
  if(signal==='WAIT')reasons.push('signal=WAIT');
  if(!canonicalPassed)reasons.push('canonical-authority-not-authorized');
  if(!brokerFresh)reasons.push('broker-freshness');
  if(!realCandle)reasons.push('REAL-CANDLE-REQUIRED');
  if(!hasTradeLevels)reasons.push('entry/sl/tp-incomplete');
  return {a,signal:authorized?signal:'WAIT',rawSignal:signal,authorized,brokerFresh,canonicalPassed,realCandle,fakeCandle,gates,passed,total:required,reasons};
}
function transitionLine(d){const t=d?.marketTransition||d?.workflow?.marketTransition||{};const phase=String(t.phase||d?.executionContext||'UNKNOWN').toUpperCase();const friday=d?.fridayCandleRole==='HISTORICAL_REFERENCE'||t.fridayContext===true;const fresh=d?.freshMondayM5===true||t.mondayFreshM5===true;let context=phase==='SUNDAY_PREOPEN'?'SUNDAY PRE-OPEN':phase==='MONDAY_OPEN_WAIT'?'MONDAY OPEN — WAIT FRESH M5':phase==='MONDAY_LIVE_REVALIDATION'?'MONDAY LIVE — FRESH M5 REVALIDATION':phase==='LIVE_MARKET'?'LIVE MARKET':phase;return `🗓️ Context: *${context}* | Friday ${friday?'HISTORY':'LIVE'} | Monday M5 ${fresh?'FRESH':'WAIT'}`;}
function format(x,manual=false,snap=null){const a=x.a,g=x.gates,side=x.signal==='BUY'?'🟢 BUY LONG / BULLISH':x.signal==='SELL'?'🔴 SELL SHORT / BEARISH':'🟡 WAIT';const lines=['🤖 *V-ZoneAI — XAUUSD*',`💰 ${F(a.livePrice??a.price)} | *${side}*`,`📈 *${a.bias||'NEUTRAL'}* | Score *${a.setupScore??a.confidence??0}/100* | Conf *${a.confidence??0}/100*`,transitionLine(snap||a),`🕯️ Real Candle *${x.realCandle?'PASS':'REJECT'}* | Fake Candle *${x.fakeCandle?'REJECT':'BLOCKED'}*`,`🔎 ICT/CRT Authority *${x.passed}/${x.total}*`,`💧 Sweep ${yes(g.sweep)} | MSS ${yes(g.mss)} | BOS ${yes(g.bos)}`,`⚡ Disp ${yes(g.displacement)} | FVG ${yes(g.fvg)} | OB ${yes(g.ob)}`,`🧠 MTF ${yes(g.mtf)} | PD ${yes(g.pd)} | Momentum ${yes(g.momentum)}`,`📍 ADX ${yes(g.trend)} | Spread ${yes(g.spread)}`,`📰 News/Authority *${x.canonicalPassed?'PASS':'WAIT'}*`,`📍 Enter Zone: ${x.authorized?'READY':'WAIT'}`,`🎯 Entry ${F(a.entry)} | SL ${F(a.stopLoss)}`,`🎯 TP1 ${F(a.takeProfit?.[0])} | TP2 ${F(a.takeProfit?.[1])} | TP3 ${F(a.takeProfit?.[2])}`,'',x.authorized?'🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*':'⏳ *WAIT — NO ORDER*',`🧠 ${a.decision?.reason||a.trigger||'Canonical authority has not authorized an entry.'}`];if(manual&&x.reasons.length)lines.push(`🔐 Gate reason: ${x.reasons.join(', ')}`);return lines.join('\n');}
async function scan(force=false,manual=false){if(busy)return;busy=true;try{const snap=await snapshot();const a=authorityFrom(snap);const x=normalize(a);console.log(`[V-ZONEAI TELEGRAM] Scan | raw=${x.rawSignal} | final=${x.signal} | bias=${a.bias||'NEUTRAL'} | score=${a.setupScore??a.directionScore??a.confidence??0} | conf=${a.confidence??0} | gates=${x.passed}/${x.total} | realCandle=${x.realCandle} | authority=${x.authorized} | reasons=${x.reasons.join(',')||'none'}`);if(!manual&&!x.authorized){console.log('[V-ZONEAI TELEGRAM] AUTO ALERT SUPPRESSED | ENTRY-ONLY | REAL-CANDLE + AUTHORITY required');return;}const key=x.authorized?`${x.signal}|${a.candleAgeSec}|${a.executionTimeframe}|${a.entry}|${a.stopLoss}|${(a.takeProfit||[]).join(',')}`:`MANUAL|${a.signal}|${a.timestamp}|${a.livePrice}|${x.passed}|${x.reasons.join(',')}`;if(!force&&key===lastSentKey)return;await bot.sendMessage(CHAT_ID,format(x,manual,snap),{parse_mode:'Markdown'});lastSentKey=key;console.log(`[V-ZONEAI TELEGRAM] SENT | signal=${x.signal} | authorized=${x.authorized} | manual=${manual}`);}catch(e){console.warn('[V-ZONEAI TELEGRAM] delivery failed:',e.message);}finally{busy=false;}}
async function sendText(msg,text){await bot.sendMessage(msg.chat.id,text,{parse_mode:'Markdown'});}
function eventLines(events,limit=5){return (Array.isArray(events)?events:[]).slice(0,limit).map(e=>`• *${e.title||e.name||'Economic event'}* — ${e.impact||'UNKNOWN'}${e.minutesUntil!=null?` (${e.minutesUntil>=0?`in ${e.minutesUntil}m`:`${Math.abs(e.minutesUntil)}m ago`})`:''}`).join('\n')||'• No verified events returned.';}
function fedFilter(events){return (Array.isArray(events)?events:[]).filter(e=>/\bfed\b|fomc|federal reserve|powell|interest rate|rate decision|minutes/i.test(String(e.title||e.name||'')));}
bot.on('polling_error',e=>console.warn('[V-ZONEAI TELEGRAM] polling_error:',e.message));
bot.onText(/^\/start(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await sendText(msg,'🤖 *V-ZoneAI — XAUUSD*\n\n`/start` — Bot start\n`/help` — All commands\n`/signal` — ICT + CRT + MTF signal\n`/price` — Broker-native MT5 price + MTF\n`/news` — Latest macro/news\n`/macro` — Macro radar\n`/fed` — Fed-focused news\n`/status` — Bot/system status');});
bot.onText(/^\/help(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await sendText(msg,'🤖 *V-ZoneAI — XAUUSD*\n\n/start — Bot start\n/help — All commands\n/signal — ICT + CRT + MTF signal\n/price — Broker-native MT5 price + MTF counts\n/news — Latest macro/news\n/macro — Macro radar\n/fed — Fed-focused news\n/status — Bot/system status');});
bot.onText(/^\/signal(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await scan(true,true);});
bot.onText(/^\/price(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;try{const d=await snapshot();const a=authorityFrom(d)||{};const m=d.mtfCounts||d.mtf||{};await sendText(msg,`💰 *V-ZoneAI PRICE*\nPrice: *${F(d.price??a.livePrice??a.price)}*\nMT5: ${m.M5??'WAIT'} | ${m.M15??'WAIT'} | ${m.H1??'WAIT'} | ${m.H4??'WAIT'}\nState: *${d.state||'WAIT'}*\n${transitionLine(d)}`);}catch(e){await sendText(msg,`⚠️ *PRICE unavailable*\n${e.message}`);}});
bot.onText(/^\/news(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;try{const d=await core('/api/market-news');const c=d.calendar||d;await sendText(msg,`📰 *MACRO / NEWS*\nState: *${d.state||'WAIT'}*\nVerified: *${d.verified===true?'PASS':'WAIT'}*\nHigh-impact USD: *${d.highImpactCount??(c.relevantEvents?.length||0)}*\n${eventLines(d.items||c.relevantEvents,5)}`);}catch(e){await sendText(msg,`⚠️ *NEWS unavailable*\n${e.message}`);}});
bot.onText(/^\/macro(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;try{const [d,snap]=await Promise.all([core('/api/news-risk'),snapshot()]);const a=authorityFrom(snap)||{};await sendText(msg,`📡 *MACRO RADAR*\nBias: *${a.bias||'NEUTRAL'}*\nScore: *${a.setupScore??a.confidence??0}/100*\nNews state: *${d.state||'WAIT'}*\nAction: *${d.action||'WAIT'}*\n${d.reason||'No verified macro event.'}`);}catch(e){await sendText(msg,`⚠️ *MACRO unavailable*\n${e.message}`);}});
bot.onText(/^\/fed(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;try{const d=await core('/api/market-news');const c=d.calendar||d;const fed=fedFilter(d.items||c.relevantEvents);await sendText(msg,`🇺🇸 *FED RADAR*\nState: *${d.state||'WAIT'}*\nVerified: *${d.verified===true?'PASS':'WAIT'}*\n${eventLines(fed,5)}`);}catch(e){await sendText(msg,`⚠️ *FED unavailable*\n${e.message}`);}});
bot.onText(/^\/status(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;try{const d=await snapshot();const a=authorityFrom(d)||{};const x=normalize(a);await sendText(msg,`🤖 *V-ZoneAI Telegram Bot*\nBot: *ONLINE*\nCore: *${d.preMarketLoaded?'READY':'WAIT'}*\nMT5: *${d.quoteConnected?'READY':'WAIT'}*\nMTF: *${['M5','M15','H1','H4'].every(tf=>(d.mtfCounts?.[tf]??0)>0)?'READY':'WAIT'}*\nReal Candle: *${x.realCandle?'PASS':'REJECT'}*\nPrice: *${F(d.price??a.livePrice??a.price)}*\nAuthorization: *${x.authorized?'AUTHORIZED':'WAIT'}*\nSignal: *${x.signal}*\nGates: *${x.passed}/${x.total}*\n${transitionLine(d)}`);}catch(e){await sendText(msg,`⚠️ *STATUS unavailable*\n${e.message}`);}});
setInterval(()=>scan(false,false),POLL_MS);
scan(false,false);
