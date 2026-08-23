'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.resolve(__dirname,'server-launcher.js');
const MARK='VTRADE_LAUNCHER_COMPACT_FORMAT_V1';
try{
 if(!fs.existsSync(FILE)) throw new Error('server-launcher.js missing');
 let s=fs.readFileSync(FILE,'utf8');
 if(!s.includes(MARK)){
  const a=s.indexOf('function patchWaitCard(source) {');
  const b=a>=0?s.indexOf('\nfunction patchFrontend',a+1):-1;
  if(a<0||b<0) throw new Error('patchWaitCard boundary not found');
  const fn=`// ${MARK}\nfunction patchWaitCard(source) {\n const replacement = \`function telegramWaitText(a) {\n  const n=x=>Number.isFinite(Number(x))?Number(x).toFixed(2):'WAIT';\n  const bias=String(a?.bias||a?.directionBand||'NEUTRAL').toUpperCase();\n  const score=Number(a?.directionScore??a?.aiScore??a?.setupScore??0);\n  const confidence=Number(a?.confidence??a?.score?.confidence??0);\n  const price=n(a?.price??a?.livePrice??a?.bid??a?.ask);\n  const authorized=a?.tradeAuthorized===true||a?.setupReady===true;\n  const strong=a?.strongTrade===true||(authorized&&confidence>=85&&score>=80);\n  const type=bias==='BULLISH'?(strong?'UPTRADE STRONG LONG':'UPTRADE BULLISH'):bias==='BEARISH'?(strong?'DOWNTRADE STRONG SHORT':'DOWNTRADE BEARISH'):'WAIT';\n  const icon=bias==='BULLISH'?'🟢':bias==='BEARISH'?'🔴':'🟡';\n  const z=a?.entryZone||a?.executionZone||a?.candidateZone||a?.referenceZone||a?.zone||{};\n  const zone=Number.isFinite(Number(z?.low))&&Number.isFinite(Number(z?.high))?n(z.low)+'–'+n(z.high):'WAIT';\n  const entry=n(a?.entry??a?.entryPrice??a?.livePrice);\n  const sl=n(a?.sl??a?.stopLoss);\n  const tp=Array.isArray(a?.takeProfit)?a.takeProfit:Array.isArray(a?.tp)?a.tp:[];\n  const tp1=n(a?.tp1??a?.takeProfit1??tp[0]);\n  const tp2=n(a?.tp2??a?.takeProfit2??tp[1]);\n  const tp3=n(a?.tp3??a?.takeProfit3??tp[2]);\n  const rr=String(a?.rr??a?.riskReward??(strong?'1:2.5':'WAIT'));\n  const g=a?.confirmations||a?.gates||{}; const yes=v=>v===true?'✅':'❌';\n  const mss=g.mss===true||g.bos===true||g.mssFresh===true||g.bosFresh===true;\n  const liq=g.liquiditySweep===true||g.liquidity===true;\n  const fvg=g.freshFvg===true||g.freshOb===true||g.fvg===true||g.orderBlock===true;\n  const mtf=g.mtfAligned===true||g.mtf===true||a?.mtfAligned===true||Array.isArray(a?.mtf)&&a.mtf.length>=4;\n  const L=['🤖 *V TRADE AI — XAUUSD*','',icon+' *'+type+'*','💰 Price: *'+price+'*','📈 Bias: *'+bias+'*','📊 Direction Score: *'+(Number.isFinite(score)?Math.round(score):0)+'/100*','🧠 Confidence: *'+(Number.isFinite(confidence)?Math.round(confidence):0)+'/100*',''];\n  L.push('🎯 Entry Zone: *'+zone+'*','🟢 Entry: *'+(authorized?entry:'WAIT')+'*','🛑 SL: *'+(authorized?sl:'WAIT')+'*','🎯 TP1: *'+(authorized?tp1:'WAIT')+'*','🎯 TP2: *'+(authorized?tp2:'WAIT')+'*','🎯 TP3: *'+(authorized?tp3:'WAIT')+'*','📐 RR: *'+(authorized?rr:'WAIT')+'*','', 'MSS/BOS: *'+yes(mss)+'*','Liquidity: *'+yes(liq)+'*','FVG/OB: *'+yes(fvg)+'*','MTF: *'+yes(mtf)+'*','',authorized?'🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*':'🛡️ *WAIT — NO ORDER AUTHORIZED*');\n  return L.join('\\\\n');\n}\n\`;\n  const re=/function\\s+telegramWaitText\\s*\\(a\\)\\s*\\{[\\s\\S]*?\\n\\}\\s*(?=\\n\\s*function\\s+)/;\n  return re.test(source)?source.replace(re,replacement):source;\n}\n`;
  s=s.slice(0,a)+fn+s.slice(b);
  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE TELEGRAM] launcher compact formatter installed');
 }
}catch(e){console.warn('[V-TRADE TELEGRAM] launcher compact hotfix skipped safely:',e.message);}
