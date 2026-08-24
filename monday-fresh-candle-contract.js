/* V-TRADE AI — Sunday/Monday market transition contract V7 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_SUNDAY_MONDAY_TRANSITION_CONTRACT_V7';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const anchor='/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */';
  const i=source.indexOf(anchor);
  if(i<0) return source;

  const code=`\n/* ${MARKER} */\n(function installSundayMondayTransition(){\n  const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});\n  function freshMondayM5(value,nowMs){\n    const t=Number(value); if(!Number.isFinite(t))return false;\n    const ms=t<1e12?t*1000:t;\n    return day.format(new Date(nowMs))==='Mon' && day.format(new Date(ms))==='Mon' && nowMs-ms<=10*60*1000;\n  }\n  globalThis.vtradeMarketTransitionState=function(candleTime,nowMs){\n    const d=day.format(new Date(nowMs));\n    const fresh=freshMondayM5(candleTime,nowMs);\n    return {phase:d==='Sun'?'SUNDAY_PREOPEN':d==='Mon'?(fresh?'MONDAY_LIVE_REVALIDATION':'MONDAY_OPEN_WAIT'):'LIVE_MARKET',fridayContext:d==='Sun'||(d==='Mon'&&!fresh),mondayFreshM5:fresh};\n  };\n  globalThis.vtradeMondayExecutionFreshTime=freshMondayM5;\n})();\n`;

  let out=source.slice(0,i)+code+source.slice(i);

  // Define marketTransition at the beginning of analyze(), never inside a return/object.
  // This prevents the previous V6 bug that could generate `return const marketTransition...`.
  if(!out.includes('const marketTransition=')){
    const analyzeRe=/(function\s+analyze\s*\([^)]*\)\s*\{)/;
    if(analyzeRe.test(out)){
      out=out.replace(analyzeRe, `$1\n  const marketTransition=globalThis.vtradeMarketTransitionState?.(typeof m!=='undefined'?m?.candle?.candleTime:undefined,Date.now())||{phase:'LIVE_MARKET',fridayContext:false,mondayFreshM5:true};\n    `);
    }
  }

  // Add the Monday freshness requirement to the final execution gate when available.
  if(!out.includes('mondayExecutionGate')){
    const allRe=/const\s+all\s*=([^;]+);/;
    const m=out.match(allRe);
    if(m){
      const guarded=`const mondayExecutionGate=marketTransition.phase==='MONDAY_LIVE_REVALIDATION'?marketTransition.mondayFreshM5:marketTransition.phase==='LIVE_MARKET';\n    const all=${m[1]}&&mondayExecutionGate;`;
      out=out.replace(m[0],guarded);
    }
  }

  // Expose transition metadata in the workflow object without injecting declarations there.
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
    if(after!==before){fs.writeFileSync(SERVER,after,'utf8');console.log('[V-TRADE MARKET TRANSITION] V7 active | Sunday pre-open | Monday fresh M5 | Friday history retained | fail-closed');}
  }
}catch(e){console.error('[V-TRADE MARKET TRANSITION] V7 failed:',e.stack||e.message);throw e;}
module.exports={patch};
