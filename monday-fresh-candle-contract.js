/* V-TRADE AI — Sunday/Monday market transition contract V6 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_SUNDAY_MONDAY_TRANSITION_CONTRACT_V6';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const anchor='/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */';
  const i=source.indexOf(anchor);
  if(i<0) return source;

  const code=`\n/* ${MARKER} */\n(function installSundayMondayTransition(){\n  const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});\n  function freshMondayM5(value,nowMs){\n    const t=Number(value); if(!Number.isFinite(t))return false;\n    const ms=t<1e12?t*1000:t;\n    return day.format(new Date(nowMs))==='Mon' && day.format(new Date(ms))==='Mon' && nowMs-ms<=10*60*1000;\n  }\n  globalThis.vtradeMarketTransitionState=function(candleTime,nowMs){\n    const d=day.format(new Date(nowMs));\n    const fresh=freshMondayM5(candleTime,nowMs);\n    return {phase:d==='Sun'?'SUNDAY_PREOPEN':d==='Mon'?(fresh?'MONDAY_LIVE_REVALIDATION':'MONDAY_OPEN_WAIT'):'LIVE_MARKET',fridayContext:d==='Sun'||(d==='Mon'&&!fresh),mondayFreshM5:fresh};\n  };\n  globalThis.vtradeMondayExecutionFreshTime=freshMondayM5;\n})();\n`;

  let out=source.slice(0,i)+code+source.slice(i);

  // Match the execution gate even if formatting/spacing changed in server.js.
  if(!out.includes('const marketTransition=')){
    const allRe=/const\s+all\s*=([^;]+);/;
    const m=out.match(allRe);
    if(m){
      const guarded=`const marketTransition=globalThis.vtradeMarketTransitionState?.(m?.candle?.candleTime,Date.now())||{phase:'LIVE_MARKET',fridayContext:false,mondayFreshM5:true};\n    const mondayExecutionGate=marketTransition.phase==='MONDAY_LIVE_REVALIDATION'?marketTransition.mondayFreshM5:marketTransition.phase==='LIVE_MARKET';\n    const all=${m[1]}&&mondayExecutionGate;`;
      out=out.replace(m[0],guarded);
    }
  }

  // The workflow object may be reached even when the execution-gate anchor above
  // was not found. Always define the transition locally before exposing it.
  if(!out.includes('marketTransition,fridayCandleRole:marketTransition.fridayContext')){
    const returnNeedle="workflow:{stage:ready===4?'PRE_MARKET_MTF_READY':'PRE_MARKET_MTF_WAITING',";
    const p=out.indexOf(returnNeedle);
    if(p>=0){
      const decl=`const marketTransition=globalThis.vtradeMarketTransitionState?.(m?.candle?.candleTime,Date.now())||{phase:'LIVE_MARKET',fridayContext:false,mondayFreshM5:true};\n    `;
      out=out.slice(0,p)+decl+out.slice(p);
    }
  }

  const workflowRe=/workflow:\{stage:ready===4\?'PRE_MARKET_MTF_READY':'PRE_MARKET_MTF_WAITING',source:'MT5_AUTHORITATIVE_V4',/;
  if(workflowRe.test(out) && !out.includes("fridayCandleRole:marketTransition.fridayContext")){
    out=out.replace(workflowRe,"workflow:{stage:ready===4?'PRE_MARKET_MTF_READY':'PRE_MARKET_MTF_WAITING',source:'MT5_AUTHORITATIVE_V4',marketTransition,fridayCandleRole:marketTransition.fridayContext?'HISTORICAL_REFERENCE':'LIVE_EXECUTION_CONTEXT',");
  }
  return out;
}

try{
  if(fs.existsSync(SERVER)){
    const before=fs.readFileSync(SERVER,'utf8');
    const after=patch(before);
    if(after!==before){fs.writeFileSync(SERVER,after,'utf8');console.log('[V-TRADE MARKET TRANSITION] V6 active | Sunday pre-open | Monday fresh M5 | Friday history retained | fail-closed');}
  }
}catch(e){console.error('[V-TRADE MARKET TRANSITION] V6 failed:',e.stack||e.message);throw e;}
module.exports={patch};
