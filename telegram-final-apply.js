// Applies the final trader-facing Telegram formatter after Local ICT runtime edits server.js.
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.resolve(__dirname,'server.js');
const MARK='VTRADE_TELEGRAM_FINAL_APPLY_V1';
function apply(){
 if(!fs.existsSync(SERVER))return;
 let s=fs.readFileSync(SERVER,'utf8');
 if(s.includes(MARK))return;
 const start=s.indexOf('function telegramTierText(a) {');
 const end=start>=0?s.indexOf('\nfunction ',start+1):-1;
 if(start<0||end<0){console.warn('[V-TRADE TELEGRAM] final apply: formatter not found');return;}
 const fn=`// ${MARK}\nfunction telegramTierText(a) {
 const n=x=>Number.isFinite(Number(x))?Number(x).toFixed(2):'WAIT';
 const bias=String(a?.bias||a?.directionBand||'NEUTRAL').toUpperCase();
 const score=Number(a?.directionScore??a?.aiScore??a?.setupScore??0);
 const confidence=Number(a?.confidence??a?.score?.confidence??0);
 const price=n(a?.livePrice??a?.price??a?.bid??a?.ask);
 const authorized=a?.tradeAuthorized===true||a?.setupReady===true;
 const strong=a?.strongTrade===true||(authorized&&confidence>=85&&score>=80);
 const type=bias==='BULLISH'?(strong?'UPTRADE STRONG LONG':'UPTRADE BULLISH'):bias==='BEARISH'?(strong?'DOWNTRADE STRONG SHORT':'DOWNTRADE BEARISH'):'WAIT';
 const icon=bias==='BULLISH'?'🟢':bias==='BEARISH'?'🔴':'🟡';
 const z=a?.entryZone||a?.candidateZone||a?.referenceZone||a?.zone||{};
 const zone=Number.isFinite(Number(z?.low))&&Number.isFinite(Number(z?.high))?n(z.low)+'–'+n(z.high):'WAIT';
 const entry=n(a?.entry??a?.entryPrice),sl=n(a?.stopLoss??a?.sl);
 const tp=Array.isArray(a?.takeProfit)?a.takeProfit:Array.isArray(a?.tp)?a.tp:[];
 const tp1=n(a?.tp1??tp[0]),tp2=n(a?.tp2??tp[1]),tp3=n(a?.tp3??tp[2]);
 const rr=String(a?.rr||a?.riskReward||(strong?'1:2.5':'WAIT'));
 const g=a?.gates||a?.confirmations||{}; const yes=v=>v===true?'✅':'❌';
 const mtf=g.mtf===true||a?.mtf?.length===4||a?.mtfAligned===true;
 const mss=g.mss===true||g.bos===true||g.mssFresh===true||g.bosFresh===true;
 const liq=g.liquiditySweep===true||g.liquidity===true;
 const fvg=g.fvg===true||g.orderBlock===true||g.freshFvg===true||g.freshOb===true;
 const L=['🤖 *V TRADE AI — ADVANCED ICT SIGNAL*','',icon+' *XAUUSD — '+type+'*','💰 Price: *'+price+'*','📈 Bias: *'+bias+'*','📊 Direction Score: *'+(Number.isFinite(score)?Math.round(score):0)+'/100*','🧠 Confidence: *'+(Number.isFinite(confidence)?Math.round(confidence):0)+'/100*',''];
 if(authorized){L.push('🎯 Entry Zone: *'+zone+'*','🟢 Entry: *'+entry+'*','🛑 SL: *'+sl+'*','🎯 TP1: *'+tp1+'*','🎯 TP2: *'+tp2+'*','🎯 TP3: *'+tp3+'*','📐 RR: *'+rr+'*','', 'MSS/BOS: *'+yes(mss)+'*','Liquidity: *'+yes(liq)+'*','FVG/OB: *'+yes(fvg)+'*','MTF: *'+yes(mtf)+'*','','🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*');}
 else {L.push('🎯 Entry Zone: *WAIT*','🟢 Entry: *WAIT*','🛑 SL: *WAIT*','🎯 TP1: *WAIT*','🎯 TP2: *WAIT*','🎯 TP3: *WAIT*','📐 RR: *WAIT*','', 'MSS/BOS: *'+yes(mss)+'*','Liquidity: *'+yes(liq)+'*','FVG/OB: *'+yes(fvg)+'*','MTF: *'+yes(mtf)+'*','','🛡️ *WAIT — NO ORDER AUTHORIZED*');}
 return L.join('\\n');
}\n`;
 fs.writeFileSync(SERVER,s.slice(0,start)+fn+s.slice(end),'utf8');
 console.log('[V-TRADE TELEGRAM] final trade formatter applied after AI runtime');
}
try{apply();}catch(e){console.warn('[V-TRADE TELEGRAM] final apply skipped safely:',e.message);}
