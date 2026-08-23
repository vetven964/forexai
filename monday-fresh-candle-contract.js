/* V-TRADE AI — Monday fresh-candle execution contract V1 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_MONDAY_FRESH_CANDLE_CONTRACT_V1';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const anchor='/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */';
  const i=source.indexOf(anchor);
  if(i<0) return source;
  const code=`\n/* ${MARKER} */\n(function installMondayFreshCandleContract(){\n  // Friday closed candles remain valid historical context. They are never deleted.\n  // Execution on Monday requires a broker-native MT5 M5 candle belonging to the\n  // new local trading day and a recent live quote. Sunday remains analysis-only.\n  const _day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});\n  const _parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});\n  function mondayExecutionFresh(bars,nowMs){\n    const a=Array.isArray(bars)?bars:[]; if(!a.length) return false;\n    const last=a[a.length-1]||{}; const t=Number(last.t??last.time??last.timestamp??last.timeMs);\n    if(!Number.isFinite(t)) return false; const ms=t<1e12?t*1000:t;\n    const d=_day.format(new Date(ms)); const now=_day.format(new Date(nowMs));\n    if(now!=='Mon') return false;\n    if(d!=='Mon') return false;\n    return nowMs-ms<=10*60*1000;\n  }\n  globalThis.vtradeMondayExecutionFresh=mondayExecutionFresh;\n  globalThis.vtradeMondayFreshReason=function(bars,nowMs){\n    const fresh=mondayExecutionFresh(bars,nowMs);\n    return fresh?'Fresh Monday M5 candle confirmed':'Waiting for fresh Monday M5 candle — Friday candle retained as historical context';\n  };\n})();\n`;
  return source.slice(0,i)+code+source.slice(i);
}

try{
  if(fs.existsSync(SERVER)){
    const before=fs.readFileSync(SERVER,'utf8');
    const after=patch(before);
    if(after!==before){fs.writeFileSync(SERVER,after,'utf8');console.log('[V-TRADE MONDAY] fresh-candle contract installed | Friday context retained | Monday M5 required');}
  }
}catch(e){console.error('[V-TRADE MONDAY] contract failed:',e.stack||e.message);throw e;}

module.exports={patch};
