// V-TRADE FINAL PRODUCTION LAUNCHER V1
// Applies the canonical Khmer + English Telegram presentation before
// starting the existing enhanced CORE/Telegram process separation.
'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=__dirname;
const TELEGRAM=path.join(ROOT,'telegram-bot-ai-service.js');
const MARK='VTRADE_TELEGRAM_BILINGUAL_FORMAT_V1';

function installTelegramBilingual(){
  if(!fs.existsSync(TELEGRAM))throw new Error('telegram-bot-ai-service.js not found');
  let s=fs.readFileSync(TELEGRAM,'utf8');
  if(s.includes(MARK)){
    console.log('[V-TRADE TELEGRAM] bilingual formatter V1 already active');
    return;
  }
  const replacement=`function formatSignal(a){
  /* ${MARK} */
  const side=a.signal==='BUY'?'🟢 BUY — TRADE AUTHORIZED | បញ្ជាទិញបានអនុញ្ញាត':a.signal==='SELL'?'🔴 SELL — TRADE AUTHORIZED | បញ្ជាលក់បានអនុញ្ញាត':(a.bias==='BULLISH'?'🟡 WAIT — BUY BIAS | រង់ចាំ — ទិសដៅ BUY':'🟡 WAIT — SELL BIAS | រង់ចាំ — ទិសដៅ SELL');
  const tp=a.takeProfit||[], g=a.gates||{};
  const pass=v=>v?'PASS | ជាប់':'WAIT | រង់ចាំ';
  const authorized=a.tradeAuthorized===true;
  const reason=String(a.reason||'Waiting for mandatory ICT execution gates');
  const blocked=authorized?'All required ICT execution gates passed | Gate ICT ចាំបាច់ទាំងអស់បានជាប់':reason;
  return [
    '🤖 *V TRADE AI — ADVANCED ICT SIGNAL*','',
    '📊 Asset / ទ្រព្យ: *XAU/USD (Gold)*',
    '💰 Price / តម្លៃ: *'+fmt(a.price)+'*',
    '⚡ Action / សកម្មភាព: *'+side+'*',
    '📈 Bias / ទិសដៅ: *'+String(a.bias)+'*',
    '📊 Direction Score / ពិន្ទុទិសដៅ: *'+a.directionScore+'/100*',
    '🧠 Confidence / ទំនុកចិត្ត: *'+a.confidence+'/100*','',
    '🔎 *ICT ENTRY GATES / ច្រកបញ្ជាក់ ICT*',
    '• Liquidity Sweep / Liquidity: *'+pass(g.liquiditySweep)+'*',
    '• MSS/BOS: *'+pass(g.mss&&g.bos)+'*',
    '• Displacement: *'+pass(g.displacement)+'*',
    '• FVG: *'+pass(g.fvg)+'*',
    '• Order Block / OB: *'+pass(g.orderBlock)+'*',
    '• Premium/Discount: *'+pass(g.premiumDiscount)+'*',
    '• Execution Zone: *'+pass(g.executionZone)+'*',
    '• Momentum: *'+pass(g.momentum)+'*',
    '• Spread: *'+pass(g.spread)+'*','',
    '🎯 Execution Zone / តំបន់ចូល: *'+(authorized?fmt(a.entry):'WAITING FOR CONFIRMATION | រង់ចាំការបញ្ជាក់')+'*',
    '🟢 Entry / ចូល: *'+(authorized?fmt(a.entry):'WAIT — gate confirmation required | រង់ចាំ — ត្រូវការការបញ្ជាក់ Gate')+'*',
    '🛑 Stop Loss / SL: *'+(authorized?fmt(a.stopLoss):'WAIT')+'*',
    '🎯 TP1 / គោលដៅ 1: *'+(authorized?fmt(tp[0]):'WAIT')+'*',
    '🎯 TP2 / គោលដៅ 2: *'+(authorized?fmt(tp[1]):'WAIT')+'*',
    '🎯 TP3 / គោលដៅ 3: *'+(authorized?fmt(tp[2]):'WAIT')+'*','',
    '🤖 AI Confirm / AI បញ្ជាក់: *'+(authorized?'BUY/SELL AUTHORIZED':'WAIT')+'* | Confidence: *'+a.confidence+'/100* | Agreement: *'+(authorized?'CONFIRMED':'NEUTRAL')+'*','',
    authorized?'🔐 *ORDER AUTHORIZED — អនុញ្ញាតបញ្ជា*':'🛡️ *WAIT — រង់ចាំ | NO ORDER AUTHORIZED — មិនអនុញ្ញាតបញ្ជា*','',
    '🧾 Reason / មូលហេតុ: '+blocked,'',
    '🏦 Broker / Broker: *VT Markets MT5*'
  ].join('\\n');
}`;
  const re=/function formatSignal\(a\)\{[\s\S]*?\n\}\nasync function scan/;
  if(!re.test(s))throw new Error('formatSignal() anchor not found');
  s=s.replace(re,replacement+'\nasync function scan');
  fs.writeFileSync(TELEGRAM,s,'utf8');
  console.log('[V-TRADE TELEGRAM] bilingual Khmer + English formatter V1 installed');
}

try{
  installTelegramBilingual();
  require('./vtrade-enhanced-launcher.js');
}catch(e){
  console.error('[V-TRADE FINAL LAUNCHER] FATAL:',e.stack||e.message);
  process.exitCode=1;
}
