'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.resolve(__dirname,'server-launcher.js');
const MARK='VTRADE_LAUNCHER_COMPACT_FORMAT_V2';

function patch(){
  if(!fs.existsSync(FILE)) throw new Error('server-launcher.js missing');
  let s=fs.readFileSync(FILE,'utf8');
  const a=s.indexOf('function patchWaitCard(source) {');
  const b=a>=0?s.indexOf('\nfunction patchFrontend',a+1):-1;
  if(a<0||b<0) throw new Error('patchWaitCard boundary not found');
  const replacement=String.raw`function patchWaitCard(source) {
 // ${MARK} — authoritative Khmer + English WAIT/authorized formatter
 const waitSource = String.raw\`function telegramWaitText(a) {
  const n=x=>Number.isFinite(Number(x))?Number(x).toFixed(2):'WAIT';
  const bias=String(a?.bias||a?.directionBand||'NEUTRAL').toUpperCase();
  const score=Number(a?.directionScore??a?.aiScore??a?.setupScore??0);
  const confidence=Number(a?.confidence??a?.score?.confidence??0);
  const price=n(a?.price??a?.livePrice??a?.bid??a?.ask);
  const g=a?.confirmations||a?.gates||{};
  const mss=g.mss===true||g.mssOk===true||g.bos===true||g.bosOk===true;
  const liq=g.liquiditySweep===true||g.liquiditySweepOk===true||g.liquidityOk===true||g.sweepOk===true;
  const fvg=g.fvg===true||g.fvgOk===true||g.freshFvg===true;
  const ob=g.orderBlock===true||g.orderBlockOk===true||g.obOk===true||g.freshOb===true;
  const mtf=g.mtfAligned===true||g.mtfOk===true||g.mtfAlignmentOk===true||a?.mtfAligned===true||(Array.isArray(a?.mtf)&&a.mtf.length>=4);
  const canonical=a?.tradeAuthorized===true;
  const side=String(a?.signal||a?.action||'').toUpperCase();
  const sideOk=side==='BUY'||side==='SELL';
  const authorized=canonical&&sideOk&&mss&&liq&&fvg&&ob&&mtf;
  const z=a?.entryZone||a?.executionZone||a?.candidateZone||a?.referenceZone||a?.zone||{};
  const zone=authorized&&Number.isFinite(Number(z?.low))&&Number.isFinite(Number(z?.high))?n(z.low)+'–'+n(z.high):'WAIT';
  const entry=authorized?n(a?.entry??a?.entryPrice??a?.livePrice):'WAIT';
  const sl=authorized?n(a?.sl??a?.stopLoss):'WAIT';
  const tp=Array.isArray(a?.takeProfit)?a.takeProfit:Array.isArray(a?.tp)?a.tp:[];
  const tp1=authorized?n(a?.tp1??a?.takeProfit1??tp[0]):'WAIT';
  const tp2=authorized?n(a?.tp2??a?.takeProfit2??tp[1]):'WAIT';
  const tp3=authorized?n(a?.tp3??a?.takeProfit3??tp[2]):'WAIT';
  const rr=authorized?String(a?.rr??a?.riskReward??'WAIT'):'WAIT';
  const ai=a?.aiConfirmation||a?.ai||{};
  const aiDecision=String(ai?.decision||a?.aiDecision||'WAIT').toUpperCase();
  const aiConfidence=Number(ai?.confidence??a?.aiConfidence??0);
  const agreement=String(ai?.agreement||a?.aiAgreement||'NEUTRAL').toUpperCase();
  const broker=String(a?.broker||'VT Markets MT5');
  const age=Number(a?.quoteAge??a?.quote_age??a?.feedAgeSec??a?.priceAgeSec??0);
  const label=authorized?(side==='BUY'?'🟢 *UPTRADE — BUY / ទិញ*':'🔴 *DOWNTRADE — SELL / លក់*'):(bias==='BULLISH'?'🟡 *UPTRADE BULLISH — WAIT / រង់ចាំ*':bias==='BEARISH'?'🟡 *DOWNTRADE BEARISH — WAIT / រង់ចាំ*':'🟡 *WAIT — NO ENTRY / មិនទាន់មាន Entry*');
  const yes=v=>v===true?'✅':'❌';
  const L=['🤖 *V TRADE AI — XAUUSD*','',label,'💰 Price / តម្លៃ: *'+price+'*','📈 Bias / ទិសដៅ: *'+bias+'*','📊 Direction Score / ពិន្ទុទិសដៅ: *'+(Number.isFinite(score)?Math.round(score):0)+'/100*','🧠 Confidence / ទំនុកចិត្ត: *'+(Number.isFinite(confidence)?Math.round(confidence):0)+'/100*',''];
  L.push('🎯 Entry Zone / តំបន់ចូល: *'+zone+'*','🟢 Entry / ចូល: *'+entry+'*','🛑 SL / Stop Loss: *'+sl+'*','🎯 TP1 / គោលដៅ 1: *'+tp1+'*','🎯 TP2 / គោលដៅ 2: *'+tp2+'*','🎯 TP3 / គោលដៅ 3: *'+tp3+'*','📐 RR / Risk Reward: *'+rr+'*','', 'MSS/BOS: *'+yes(mss)+'*','Liquidity / សាច់ប្រាក់: *'+yes(liq)+'*','FVG/OB: *'+yes(fvg&&ob)+'*','MTF: *'+yes(mtf)+'*','', '🤖 AI Confirm: *'+aiDecision+'* | Confidence: *'+(Number.isFinite(aiConfidence)?Math.round(aiConfidence):0)+'/100* | Agreement: *'+agreement+'*','',authorized?'🔐 *ORDER AUTHORIZED / អនុញ្ញាតបញ្ជា*':'🛡️ *WAIT — NO ORDER AUTHORIZED / មិនអនុញ្ញាតបញ្ជា*','🏦 Broker: *'+broker+'* | Quote: *'+age+'s*');
  return L.join('\\n');
}
\`;
 const pattern=/function\s+telegramWaitText\s*\(a\)\s*\{[\s\S]*?\n\}\s*(?=\n\s*function\s+)/;
 return pattern.test(source)?source.replace(pattern,waitSource):source;
}
`;
  s=s.slice(0,a)+replacement+s.slice(b);
  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE TELEGRAM] launcher compact formatter V2 installed | Khmer + English | fail-closed');
}
try{patch();}catch(e){console.warn('[V-TRADE TELEGRAM] launcher compact V2 skipped safely:',e.stack||e.message);}
