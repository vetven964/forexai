/* V-TRADE AI — Monday fresh-candle execution contract V3 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_MONDAY_FRESH_CANDLE_CONTRACT_V3';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const anchor='/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */';
  const i=source.indexOf(anchor);
  if(i<0) return source;
  const code=`\n/* ${MARKER} */\n(function installMondayFreshCandleContract(){\n  const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});\n  function freshCandleTime(value,nowMs){\n    const t=Number(value); if(!Number.isFinite(t))return false;\n    const ms=t<1e12?t*1000:t;\n    return day.format(new Date(nowMs))==='Mon' && day.format(new Date(ms))==='Mon' && nowMs-ms<=10*60*1000;\n  }\n  globalThis.vtradeMondayExecutionFreshTime=freshCandleTime;\n})();\n`;
  let out=source.slice(0,i)+code+source.slice(i);
  const old=`const all=ready===4&&bias!=='NEUTRAL'&&liq&&mss&&bos&&displacement&&fvg&&ob&&pdOk&&!!execZone&&momentum&&spreadOk&&mondayFresh;`;
  const replacement=`const mondayFresh=typeof globalThis.vtradeMondayExecutionFreshTime==='function'?globalThis.vtradeMondayExecutionFreshTime(m?.candle?.candleTime,Date.now()):false;\n    const all=ready===4&&bias!=='NEUTRAL'&&liq&&mss&&bos&&displacement&&fvg&&ob&&pdOk&&!!execZone&&momentum&&spreadOk&&mondayFresh;`;
  if(out.includes(old))out=out.replace(old,replacement);
  return out;
}

try{
  if(fs.existsSync(SERVER)){
    const before=fs.readFileSync(SERVER,'utf8');
    const after=patch(before);
    if(after!==before){fs.writeFileSync(SERVER,after,'utf8');console.log('[V-TRADE MONDAY] V3 active | Friday history retained | fresh Monday M5 required | fail-closed');}
  }
}catch(e){console.error('[V-TRADE MONDAY] V3 failed:',e.stack||e.message);throw e;}
module.exports={patch};
