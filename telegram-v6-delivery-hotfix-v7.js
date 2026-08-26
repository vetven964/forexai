'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'telegram-bot-ai-service-v6.js');
const MARK='VTRADE_TELEGRAM_DELIVERY_V8_ENTRY_ONLY';
const OUT='VZONE_TELEGRAM_OUTPUT_V1';

if(!fs.existsSync(FILE)) throw new Error('telegram-bot-ai-service-v6.js not found');
let s=fs.readFileSync(FILE,'utf8');

// V6/V8 delivery gate: automatic Telegram is ENTRY-ONLY; unauthorized WAIT stays silent.
const oldGate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | canonical authority not authorized');return;}";
const newGate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | ENTRY-ONLY policy | canonical authority not authorized');return;}";
if(s.includes(oldGate)) s=s.replace(oldGate,newGate);

// Remove the older periodic automatic WAIT delivery while preserving duplicate protection.
const v7Gate="if(!manual&&!x.authorized){const waitBucket=Math.floor(Date.now()/300000);const waitKey=`WAIT|${String(a.symbol||'XAUUSD')}|${String(a.executionTimeframe||'M5')}|${waitBucket}`;if(waitKey===lastWaitKey){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | duplicate M5 delivery');return;}await bot.sendMessage(CHAT_ID,format(x,false),{parse_mode:'Markdown'});lastWaitKey=waitBucket;console.log(`[V-TRADE TELEGRAM V6] WAIT SENT | authorized=false | m5Bucket=${waitBucket}`);return;}";
const v8Gate="if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | ENTRY-ONLY policy | canonical authority not authorized');return;}";
if(s.includes(v7Gate)) s=s.replace(v7Gate,v8Gate);

// Never authorize an explicitly invalid/fake candle or explicitly unprotected RS/SP stop.
const authOld="const authorized=signal!=='WAIT'&&canonicalPassed&&brokerFresh&&hasTradeLevels;";
const authNew="const candleGuard=a?.fakeCandle!==true&&a?.candleValid!==false&&a?.candleClosed!==false&&a?.realCandle!==false;\n  const rsSpGuard=a?.rsSpProtected!==false&&a?.rsSpGuard!==false&&a?.liquiditySlProtected!==false&&a?.supportResistanceGuard!==false;\n  const authorized=signal!=='WAIT'&&canonicalPassed&&brokerFresh&&hasTradeLevels&&candleGuard&&rsSpGuard;";
if(s.includes(authOld)&&!s.includes('const candleGuard=')) s=s.replace(authOld,authNew);
if(s.includes("if(!hasTradeLevels)reasons.push('entry/sl/tp-incomplete');")&&!s.includes("reasons.push('fake-candle-or-invalid-candle')")){
  s=s.replace("if(!hasTradeLevels)reasons.push('entry/sl/tp-incomplete');","if(!hasTradeLevels)reasons.push('entry/sl/tp-incomplete');\n  if(!candleGuard)reasons.push('fake-candle-or-invalid-candle');\n  if(!rsSpGuard)reasons.push('rs-sp-sl-protection');");
}

// Canonical V-ZoneAI Telegram output. It uses only the already-authorized snapshot values.
if(!s.includes(OUT)){
  const oldFormat="function format(x,manual=false,snap=null){const a=x.a,g=x.gates,side=x.signal==='BUY'?'🟢 BUY':x.signal==='SELL'?'🔴 SELL':'🟡 WAIT';const lines=['🤖 *V TRADE AI — XAUUSD*',`💰 ${F(a.livePrice??a.price)} | *${side}*`,`📈 *${a.bias||'NEUTRAL'}* | Score *${a.setupScore??a.confidence??0}/100* | Conf *${a.confidence??0}/100*`,transitionLine(snap||a),`🔎 Canonical ICT *${x.passed}/${x.total}*`,`💧 Sweep ${yes(g.sweep)} | MSS ${yes(g.mss)} | BOS ${yes(g.bos)}`,`⚡ Disp ${yes(g.displacement)} | FVG ${yes(g.fvg)} | OB ${yes(g.ob)}`,`🧠 MTF ${yes(g.mtf)} | PD ${yes(g.pd)} | Momentum ${yes(g.momentum)}`,`📍 ADX ${yes(g.trend)} | Spread ${yes(g.spread)}`,`📰 News/Authority *${x.canonicalPassed?'PASS':'WAIT'}*`,`🎯 Entry ${F(a.entry)} | SL ${F(a.stopLoss)}`,`🎯 TP1 ${F(a.takeProfit?.[0])} | TP2 ${F(a.takeProfit?.[1])} | TP3 ${F(a.takeProfit?.[2])}`,'',x.authorized?'🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*':'⏳ *WAIT — NO ORDER*',`🧠 ${a.decision?.reason||a.trigger||'Canonical authority has not authorized an entry.'}`];if(manual&&x.reasons.length)lines.push(`🔐 Gate reason: ${x.reasons.join(', ')}`);return lines.join('\\n');}";
  const newFormat="function format(x,manual=false,snap=null){const a=x.a,g=x.gates,side=x.signal==='BUY'?'🟢 *BUY LONG / BULLISH*':x.signal==='SELL'?'🔴 *SELL SHORT / BEARISH*':'🟡 *WAIT*';const rsSp=(a.rsSpProtected===true||a.rsSpGuard===true||a.liquiditySlProtected===true||a.supportResistanceGuard===true)?'PROTECTED':'GUARDED';const candle=(a.fakeCandle===true||a.candleValid===false||a.candleClosed===false||a.realCandle===false)?'REJECTED':'VALID';const lines=['🤖 *V-ZoneAI*',`📊 *XAUUSD* | TF *${a.executionTimeframe||a.timeframe||'M15'}*`,`💰 Price: *${F(a.livePrice??a.price)}*`,`⚡ Signal: ${side}`,`📍 *ENTER ZONE* | Bias *${a.bias||'NEUTRAL'}*`,`🎯 Score: *${a.setupScore??a.confidence??0}/100* | Confidence: *${a.confidence??0}/100*`,transitionLine(snap||a),`🧠 ICT *${yes(g.mtf)}* | CRT *${yes(a.crtConfirmed===true||a.crt===true)}*`,`💧 Liquidity Sweep ${yes(g.sweep)} | MSS ${yes(g.mss)} | BOS ${yes(g.bos)}`,`⚡ FVG ${yes(g.fvg)} | OB ${yes(g.ob)} | Momentum ${yes(g.momentum)}`,`🛡️ RS/SP SL: *${rsSp}* | Candle: *${candle}*`,`📌 Entry: *${F(a.entry)}* | SL: *${F(a.stopLoss)}*`,`💎 TP1: *${F(a.takeProfit?.[0])}* | TP2: *${F(a.takeProfit?.[1])}* | TP3: *${F(a.takeProfit?.[2])}*`,'',x.authorized?'✅ *AUTHORIZED — READY*':'⏳ *WAIT — NO ENTRY*',x.authorized?'🛡️ SL protected by RS/SP · closed/valid candle only':'🔒 Entry blocked until all gates pass',`🧠 ${a.decision?.reason||a.trigger||'Canonical authority has not authorized an entry.'}`];if(manual&&x.reasons.length)lines.push(`🔐 Gate reason: ${x.reasons.join(', ')}`);return lines.join('\\n');}\n// VZONE_TELEGRAM_OUTPUT_V1";
  if(s.includes(oldFormat)) s=s.replace(oldFormat,newFormat);
}

// Keep bot authentication diagnostics in the child service.
const oldPolling="bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));";
const newPolling="bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));\nbot.on('error',e=>console.warn('[V-TRADE TELEGRAM V6] bot_error:',e.message));\n(async()=>{try{const me=await bot.getMe();console.log('[V-TRADE TELEGRAM V6] BOT AUTH OK | username=@'+String(me?.username||'unknown'));}catch(e){console.error('[V-TRADE TELEGRAM V6] BOT AUTH FAILED | '+e.message);}})();";
if(!s.includes("BOT AUTH OK | username=@")&&s.includes(oldPolling)) s=s.replace(oldPolling,newPolling);

s=s.includes(MARK)?s:s+'\n// VTRADE_TELEGRAM_DELIVERY_V8_ENTRY_ONLY\n';
fs.writeFileSync(FILE,s,'utf8');
console.log('[V-TRADE TELEGRAM] V-ZoneAI output V1 | ENTRY-ONLY | RS/SP SL guard | no fake candle');
module.exports={MARK,OUT};
