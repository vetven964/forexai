// V-TRADE Telegram final presentation hotfix V7.1
// Khmer + English presentation; preserves fail-closed ICT authorization.
'use strict';

const fs = require('fs');
const path = require('path');
const SERVER_FILE = path.resolve(__dirname, 'server.js');
const MARKER = 'VTRADE_TELEGRAM_FINAL_FORMAT_V7_1';

function formatterSource() {
  return [
    '// ' + MARKER,
    'function telegramWaitText(a) {',
    '  a = a || {};',
    '  function num(v){var n=Number(v);return Number.isFinite(n)?n.toFixed(2):"WAIT";}',
    '  function ok(v){return v===true?"✅":"❌";}',
    '  function confirmed(v){return v===true||v===1||String(v).toLowerCase()==="true"||String(v).toUpperCase()==="PASS";}',
    '  function bilingualGateReason(x){',
    '    var s=String(x||"");',
    '    var weekend=new Date().getUTCDay()===0||new Date().getUTCDay()===6;',
    '    if(/Closed-candle data is stale/i.test(s)&&weekend)return "• Market closed / ទីផ្សារបិទ — closed-candle history is intentionally retained until fresh MT5 history arrives at market open / ទិន្នន័យ candle ចុងក្រោយត្រូវរក្សាទុក រហូតដល់ MT5 បើក និងផ្តល់ទិន្នន័យថ្មី";',
    '    if(/Closed-candle data is stale/i.test(s))return "• Closed-candle data is stale — wait for fresh MT5 history / ទិន្នន័យ candle បិទចាស់ — រង់ចាំ MT5 ផ្តល់ទិន្នន័យថ្មី";',
    '    if(/Fresh liquidity sweep not confirmed/i.test(s))return "• Fresh liquidity sweep not confirmed / មិនទាន់បញ្ជាក់ Liquidity Sweep ថ្មី";',
    '    if(/Fresh M5 MSS not confirmed/i.test(s))return "• Fresh M5 MSS not confirmed / មិនទាន់បញ្ជាក់ MSS ថ្មីលើ M5";',
    '    if(/Directional displacement not confirmed/i.test(s))return "• Directional displacement not confirmed / មិនទាន់បញ្ជាក់ Directional Displacement";',
    '    if(/No fresh aligned FVG\\/OB/i.test(s))return "• No fresh aligned FVG/OB / មិនទាន់មាន FVG/OB ថ្មីដែលស្របទិស";',
    '    if(/Price is outside the execution zone/i.test(s))return "• Price is outside the execution zone / តម្លៃនៅក្រៅតំបន់ប្រតិបត្តិការ";',
    '    if(/Fresh M5 MSS\\/BOS structure break not confirmed/i.test(s))return "• Fresh M5 MSS/BOS structure break not confirmed / មិនទាន់បញ្ជាក់ Structure Break M5 MSS/BOS ថ្មី";',
    '    if(/Momentum\\/displacement does not confirm/i.test(s))return "• Momentum/displacement does not confirm the execution direction / Momentum/Displacement មិនទាន់បញ្ជាក់ទិសប្រតិបត្តិការ";',
    '    return "• "+s+" / មិនទាន់បានបញ្ជាក់";',
    '  }',
    '  var signal=String(a.signal||a.action||"WAIT").toUpperCase();',
    '  var bias=String(a.bias||a.directionBand||"NEUTRAL").toUpperCase();',
    '  var score=Number(a.directionScore!=null?a.directionScore:(a.aiScore!=null?a.aiScore:a.setupScore));',
    '  var confidence=Number(a.confidence!=null?a.confidence:0);',
    '  var price=num(a.livePrice!=null?a.livePrice:(a.price!=null?a.price:a.bid));',
    '  var g=a.gates||a.confirmations||{};',
    '  var ict=a.ict||{};',
    '  var mtfRows=a.mtf?.timeframes||a.timeframes||a.frames||{};',
    '  var mtfReadyRows=["M5","M15","H1","H4"].every(function(tf){var r=mtfRows[tf]||mtfRows[tf.toLowerCase()]||{};return r.ready===true||Number(r.bars||r.feedBars||r.candles?.length||0)>=30;});',
    '  var mtfOk=confirmed(a.mtfAligned)||confirmed(a.mtfOk)||confirmed(a.mtfAlignmentOk)||confirmed(g.mtfOk)||confirmed(g.mtfAlignmentOk)||mtfReadyRows;',
    '  var mssOk=confirmed(g.mss)||confirmed(g.bos)||confirmed(g.mssOk)||confirmed(g.bosOk)||confirmed(g.structureAgreement)||String(ict.mss||"").toUpperCase()!=="NEUTRAL"||String(ict.bos||"").toUpperCase()!=="NEUTRAL";',
    '  var liqOk=confirmed(g.liquiditySweep)||confirmed(g.liquiditySweepOk)||confirmed(g.liquidityOk)||confirmed(g.sweepOk)||confirmed(ict.liquiditySweep?.confirmed);',
    '  var fvgOk=confirmed(g.fvg)||confirmed(g.fvgOk)||confirmed(ict.fvg?.confirmed)||String(ict.fvg?.type||"").toUpperCase()!=="";',
    '  var obOk=confirmed(g.orderBlock)||confirmed(g.orderBlockOk)||confirmed(g.obOk)||confirmed(ict.orderBlock?.confirmed)||String(ict.orderBlock?.type||"").toUpperCase()!=="";',
    '  var canonical=a.tradeAuthorized===true;',
    '  var sideOk=signal==="BUY"||signal==="SELL";',
    '  var authorized=canonical&&sideOk&&mtfOk&&mssOk&&liqOk&&(fvgOk||obOk);',
    '  var label=authorized?(signal==="BUY"?"UPTRADE — BUY | ទិញ":"DOWNTRADE — SELL | លក់"):(bias==="BULLISH"?"UPTRADE BULLISH — WAIT | រង់ចាំ":"DOWNTRADE BEARISH — WAIT | រង់ចាំ");',
    '  var icon=authorized?(signal==="BUY"?"🟢":"🔴"):"🟡";',
    '  var z=a.entryZone||a.executionZone||a.candidateZone||a.referenceZone||a.zone||{};',
    '  var zone=Number.isFinite(Number(z.low))&&Number.isFinite(Number(z.high))?num(z.low)+"–"+num(z.high):"WAITING FOR CONFIRMATION | រង់ចាំការបញ្ជាក់";',
    '  var entry=authorized?num(a.entry!=null?a.entry:a.entryPrice):"WAIT";',
    '  var sl=authorized?num(a.stopLoss!=null?a.stopLoss:a.sl):"WAIT";',
    '  var tp=Array.isArray(a.takeProfit)?a.takeProfit:(Array.isArray(a.tp)?a.tp:[]);',
    '  var tp1=authorized?num(a.tp1!=null?a.tp1:tp[0]):"WAIT";',
    '  var tp2=authorized?num(a.tp2!=null?a.tp2:tp[1]):"WAIT";',
    '  var tp3=authorized?num(a.tp3!=null?a.tp3:tp[2]):"WAIT";',
    '  var rr=authorized?String(a.rr||a.riskReward||"WAIT"):"WAIT";',
    '  var ai=a.aiConfirmation||a.ai||{};',
    '  var aiDecision=String(ai.decision||a.aiDecision||"WAIT").toUpperCase();',
    '  var aiConfidence=Number(ai.confidence!=null?ai.confidence:(a.aiConfidence!=null?a.aiConfidence:0));',
    '  var agreement=String(ai.agreement||a.aiAgreement||"NEUTRAL").toUpperCase();',
    '  var broker=String(a.broker||"VT Markets MT5");',
    '  var age=Number(a.quoteAge!=null?a.quoteAge:(a.feedAgeSec!=null?a.feedAgeSec:0));',
    '  var blocked=Array.isArray(a.score&&a.score.blockedReasons)?a.score.blockedReasons.slice(0,8).map(bilingualGateReason):[];',
    '  var gateText=blocked.length?blocked.join("\\n"):"• No confirmed entry gate / មិនទាន់មាន Gate បញ្ជាក់";',
    '  var lines=["🤖 *V TRADE AI — ADVANCED ICT SIGNAL*","",',
    '    "📊 Asset / ទ្រព្យ: *XAU/USD (Gold)*",',
    '    "💰 Price / តម្លៃ: *"+price+"*",',
    '    "⚡ Action / សកម្មភាព: *"+icon+" "+label+"*",',
    '    "📈 Bias / ទិសដៅ: *"+bias+"*",',
    '    "📊 Direction Score / ពិន្ទុទិសដៅ: *"+(Number.isFinite(score)?Math.round(score):0)+"/100*",',
    '    "🧠 Confidence / ទំនុកចិត្ត: *"+(Number.isFinite(confidence)?Math.round(confidence):0)+"/100*","",',
    '    "🔎 *ICT ENTRY GATES / ច្រកបញ្ជាក់ ICT*",gateText,"",',
    '    "🎯 Execution Zone / តំបន់ប្រតិបត្តិការ: *"+zone+"*",',
    '    "🟢 Entry / ចូល: *"+entry+"*",',
    '    "🛑 Stop Loss / ខាតអតិបរមា: *"+sl+"*",',
    '    "🎯 TP1 / គោលដៅ 1: *"+tp1+"*",',
    '    "🎯 TP2 / គោលដៅ 2: *"+tp2+"*",',
    '    "🎯 TP3 / គោលដៅ 3: *"+tp3+"*",',
    '    "📐 RR / Risk Reward: *"+rr+"*","",',
    '    "MSS/BOS: *"+ok(mssOk)+"*",',
    '    "Liquidity / Liquidity: *"+ok(liqOk)+"*",',
    '    "FVG: *"+ok(fvgOk)+"*",',
    '    "OB: *"+ok(obOk)+"*",',
    '    "MTF: *"+ok(mtfOk)+"*","",',
    '    "🤖 AI Confirm: *"+aiDecision+"* | Confidence: *"+(Number.isFinite(aiConfidence)?Math.round(aiConfidence):0)+"/100* | Agreement: *"+agreement+"*","",',
    '    authorized?"🔐 *ORDER AUTHORIZED — អនុញ្ញាតបញ្ជា*":"🛡️ *WAIT — រង់ចាំ | NO ORDER AUTHORIZED*","",',
    '    "🏦 Broker / ឈ្មួញជើងសារ: *"+broker+"* | Quote age: *"+(Number.isFinite(age)?age:0)+"s*"];',
    '  return lines.join("\\n");',
    '}',
    ''
  ].join('\n');
}

function install(){
  if(!fs.existsSync(SERVER_FILE)){console.warn('[V-TRADE TELEGRAM] final formatter skipped: server.js missing');return;}
  let source=fs.readFileSync(SERVER_FILE,'utf8');
  if(source.indexOf(MARKER)>=0){console.log('[V-TRADE TELEGRAM] final formatter V7.1 already active');return;}
  var start=source.indexOf('function telegramTierText(a) {');
  var marker='function telegramWaitText(a) {';
  if(start<0) start=source.indexOf(marker);
  if(start<0){console.warn('[V-TRADE TELEGRAM] final formatter skipped: telegram renderer not found');return;}
  var end=source.indexOf('\nfunction ',start+10);
  if(end<0){console.warn('[V-TRADE TELEGRAM] final formatter skipped: formatter boundary not found');return;}
  source=source.slice(0,start)+formatterSource()+source.slice(end);
  fs.writeFileSync(SERVER_FILE,source,'utf8');
  console.log('[V-TRADE TELEGRAM] final formatter V7.1 installed | canonical MTF/ICT gate aliases | fail-closed');
}
try{install();}catch(e){console.error('[V-TRADE TELEGRAM] final formatter V7.1 failed:',e&&e.stack?e.stack:e.message);process.exitCode=1;}
