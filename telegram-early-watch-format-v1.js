// V-TRADE AI — Telegram Early Watch presentation V1
// Does not alter authorization or candle data.
'use strict';
const fs=require('fs');
const path=require('path');
const TARGET=path.resolve(__dirname,'telegram-bot-ai-service.js');
const MARK='VTRADE_EARLY_WATCH_FORMAT_V1';
try{
 if(fs.existsSync(TARGET)){
  let s=fs.readFileSync(TARGET,'utf8');
  if(!s.includes(MARK)){
   const needle="const isAuth=a.tradeAuthorized===true;";
   if(!s.includes(needle)) throw new Error('formatter authorization anchor not found');
   s=s.replace(needle,needle+"\n  const setupStage=String(a.setupStage||'WAIT');\n  const watchLine=setupStage==='EARLY_BUY_WATCH'?'🟡 *EARLY BUY WATCH*':setupStage==='EARLY_SELL_WATCH'?'🟠 *EARLY SELL WATCH*':'';");
   const linesNeedle="    '⏱️ *'+String(transition).replaceAll('_',' ')+'* | 🔎 ICT *'+String(a.gateCount||'0/10')+'*',";
   if(!s.includes(linesNeedle)) throw new Error('formatter lines anchor not found');
   s=s.replace(linesNeedle,linesNeedle+"\n    watchLine,");
   const noOrderNeedle="    (isAuth?'🔐 *SIGNAL AUTHORIZED*':'⏳ *WAIT — NO ORDER*'),";
   if(!s.includes(noOrderNeedle)) throw new Error('no-order anchor not found');
   s=s.replace(noOrderNeedle,"    (isAuth?'🔐 *SIGNAL AUTHORIZED*':(setupStage==='EARLY_BUY_WATCH'||setupStage==='EARLY_SELL_WATCH'?'⏳ *WATCH — NO ORDER YET*':'⏳ *WAIT — NO ORDER*')),");
   fs.writeFileSync(TARGET,s,'utf8');
   console.log('[V-TRADE TELEGRAM] early direction watch formatter V1 active | no fake candles');
  }
 }
}catch(e){console.warn('[V-TRADE TELEGRAM] early watch formatter skipped safely:',e.message);}
