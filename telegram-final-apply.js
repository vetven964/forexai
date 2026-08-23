// Final trader-facing Telegram formatter V2.
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.resolve(__dirname,'server.js');
const MARK='VTRADE_TELEGRAM_FINAL_APPLY_V2';
function formatterSource(){return `function telegramCompactText(a) {
 const n=x=>Number.isFinite(Number(x))?Number(x).toFixed(2):'WAIT';
 const bias=String(a?.bias||a?.directionBand||'NEUTRAL').toUpperCase();
 const score=Number(a?.directionScore??a?.aiScore??a?.setupScore??0);
 const confidence=Number(a?.confidence??a?.score?.confidence??0);
 const price=n(a?.livePrice??a?.price??a?.bid??a?.ask);
 const authorized=a?.tradeAuthorized===true||a?.setupReady===true;
 const strong=a?.strongTrade===true||(authorized&&confidence>=85&&score>=80);
 const type=bias==='BULLISH'?(strong?'UPTRADE STRONG LONG':'UPTRADE BULLISH'):bias==='BEARISH'?(strong?'DOWNTRADE STRONG SHORT':'DOWNTRADE BEARISH'):'WAIT';
 const icon=bias==='BULLISH'?'🟢':bias==='BEARISH'?'🔴':'🟡';
 const z=a?.entryZone||a?.executionZone||a?.candidateZone||a?.referenceZone||a?.zone||{};
 const zone=Number.isFinite(Number(z?.low))&&Number.isFinite(Number(z?.high))?n(z.low)+'–'+n(z.high):'WAIT';
 const entry=n(a?.entry??a?.entryPrice),sl=n(a?.stopLoss??a?.sl);
 const tp=Array.isArray(a?.takeProfit)?a.takeProfit:Array.isArray(a?.tp)?a.tp:[];
 const tp1=n(a?.tp1??a?.takeProfit1??tp[0]),tp2=n(a?.tp2??a?.takeProfit2??tp[1]),tp3=n(a?.tp3??a?.takeProfit3??tp[2]);
 const rr=String(a?.rr??a?.riskReward||(strong?'1:2.5':'WAIT'));
 const g=a?.gates||a?.confirmations||{}; const yes=v=>v===true?'✅':'❌';
 const mss=g.mss===true||g.bos===true||g.mssFresh===true||g.bosFresh===true;
 const liq=g.liquiditySweep===true||g.liquidity===true;
 const fvg=g.fvg===true||g.orderBlock===true||g.freshFvg===true||g.freshOb===true;
 const mtf=g.mtf===true||g.mtfAligned===true||a?.mtfAligned===true||(Array.isArray(a?.mtf)&&a.mtf.length>=4);
 const L=['🤖 *V TRADE AI — XAUUSD*','',icon+' *'+type+'*','💰 Price: *'+price+'*','📈 Bias: *'+bias+'*','📊 Direction Score: *'+(Number.isFinite(score)?Math.round(score):0)+'/100*','🧠 Confidence: *'+(Number.isFinite(confidence)?Math.round(confidence):0)+'/100*',''];
 L.push('🎯 Entry Zone: *'+(authorized?zone:'WAIT')+'*','🟢 Entry: *'+(authorized?entry:'WAIT')+'*','🛑 SL: *'+(authorized?sl:'WAIT')+'*','🎯 TP1: *'+(authorized?tp1:'WAIT')+'*','🎯 TP2: *'+(authorized?tp2:'WAIT')+'*','🎯 TP3: *'+(authorized?tp3:'WAIT')+'*','📐 RR: *'+(authorized?rr:'WAIT')+'*','', 'MSS/BOS: *'+yes(mss)+'*','Liquidity: *'+yes(liq)+'*','FVG/OB: *'+yes(fvg)+'*','MTF: *'+yes(mtf)+'*','',authorized?'🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*':'🛡️ *WAIT — NO ORDER AUTHORIZED*');
 return L.join('\\n');
}
function telegramTierText(a){return telegramCompactText(a);}
function telegramWaitText(a){return telegramCompactText(a);}
function telegramText(a){return telegramCompactText(a);}
`}
function apply(){
 if(!fs.existsSync(SERVER))return;
 let s=fs.readFileSync(SERVER,'utf8');
 if(s.includes(MARK))return;
 const source=formatterSource();
 s=s.replace(/function\s+telegramTierText\s*\(a\)\s*\{[\s\S]*?\n\}\s*(?=\nfunction\s+)/,source);
 s=s.replace(/function\s+telegramWaitText\s*\(a\)\s*\{[\s\S]*?\n\}\s*(?=\nfunction\s+)/,'function telegramWaitText(a){return telegramCompactText(a);}\n');
 s=s.replace(/function\s+telegramText\s*\(a\)\s*\{[\s\S]*?\n\}\s*(?=\nfunction\s+)/,'function telegramText(a){return telegramCompactText(a);}\n');
 if(!s.includes('telegramCompactText(a)')){console.warn('[V-TRADE TELEGRAM] compact formatter insertion failed');return;}
 s='// '+MARK+'\n'+s;
 fs.writeFileSync(SERVER,s,'utf8');
 console.log('[V-TRADE TELEGRAM] final compact formatter applied to telegramText/telegramWaitText/telegramTierText');
}
try{apply();}catch(e){console.warn('[V-TRADE TELEGRAM] final compact apply skipped safely:',e.message);}
