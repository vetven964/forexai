/* V-TRADE AI — Monday fresh-candle execution contract V2 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_MONDAY_FRESH_CANDLE_CONTRACT_V2';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const anchor='/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */';
  const i=source.indexOf(anchor);
  if(i<0) return source;
  const code=`\n/* ${MARKER} */\n(function installMondayFreshCandleContract(){\n  const _day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});\n  function mondayExecutionFresh(bars,nowMs){\n    const a=Array.isArray(bars)?bars:[]; if(!a.length)return false;\n    const last=a[a.length-1]||{}; const t=Number(last.t??last.time??last.timestamp??last.timeMs);\n    if(!Number.isFinite(t))return false;\n    const ms=t<1e12?t*1000:t;\n    if(_day.format(new Date(nowMs))!=='Mon')return false;\n    if(_day.format(new Date(ms))!=='Mon')return false;\n    return nowMs-ms<=10*60*1000;\n  }\n  globalThis.vtradeMondayExecutionFresh=mondayExecutionFresh;\n  globalThis.vtradeMondayFreshReason=(bars,nowMs)=>mondayExecutionFresh(bars,nowMs)?'Fresh Monday M5 candle confirmed':'Waiting for fresh Monday M5 candle — Friday candle retained as historical context';\n})();\n`;
  let out=source.slice(0,i)+code+source.slice(i);
  const old=`const all=ready===4&&bias!=='NEUTRAL'&&liq&&mss&&bos&&displacement&&fvg&&ob&&pdOk&&!!execZone&&momentum&&spreadOk;`;
  const replacement=`const mondayFresh=typeof globalThis.vtradeMondayExecutionFresh==='function'?globalThis.vtradeMondayExecutionFresh(rows.M5?.__rawBars||[],Date.now()):true;\n    const all=ready===4&&bias!=='NEUTRAL'&&liq&&mss&&bos&&displacement&&fvg&&ob&&pdOk&&!!execZone&&momentum&&spreadOk&&mondayFresh;`;
  if(out.includes(old))out=out.replace(old,replacement);
  return out;
}

try{
  if(fs.existsSync(SERVER)){
    const before=fs.readFileSync(SERVER,'utf8');
    const after=patch(before);
    if(after!==before){fs.writeFileSync(SERVER,after,'utf8');console.log('[V-TRADE MONDAY] V2 active | Friday context retained | Monday fresh M5 required | fail-closed');}
  }
}catch(e){console.error('[V-TRADE MONDAY] V2 failed:',e.stack||e.message);throw e;}

module.exports={patch};
