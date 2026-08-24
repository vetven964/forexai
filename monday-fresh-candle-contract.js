/* V-TRADE AI — Sunday/Monday market transition contract V12 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_SUNDAY_MONDAY_TRANSITION_CONTRACT_V12';

const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});

function freshMondayM5(value,nowMs=Date.now()){
  const t=Number(value);
  if(!Number.isFinite(t))return false;
  const ms=t<1e12?t*1000:t;
  return day.format(new Date(nowMs))==='Mon' &&
    day.format(new Date(ms))==='Mon' &&
    nowMs-ms>=0 && nowMs-ms<=10*60*1000;
}

function getMarketTransitionState(candleTime,nowMs=Date.now()){
  const d=day.format(new Date(nowMs));
  const fresh=freshMondayM5(candleTime,nowMs);
  return {
    phase:d==='Sun'?'SUNDAY_PREOPEN':d==='Mon'?(fresh?'MONDAY_LIVE_REVALIDATION':'MONDAY_OPEN_WAIT'):'LIVE_MARKET',
    fridayContext:d==='Sun'||(d==='Mon'&&!fresh),
    mondayFreshM5:fresh,
    candleTime:Number.isFinite(Number(candleTime))?Number(candleTime):null,
    timezone:'Asia/Phnom_Penh'
  };
}

function patch(source){
  if(!source)return source;
  const anchor='/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */';
  const i=source.indexOf(anchor);
  if(i<0)return source;

  const code=`\n/* ${MARKER} */\n(function installSundayMondayTransition(){\n  const transitionDay=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'});\n  function freshMondayM5(candleTime,nowMs=Date.now()){\n    const t=Number(candleTime);\n    if(!Number.isFinite(t))return false;\n    const ms=t<1e12?t*1000:t;\n    return transitionDay.format(new Date(nowMs))==='Mon' && transitionDay.format(new Date(ms))==='Mon' && nowMs-ms>=0 && nowMs-ms<=10*60*1000;\n  }\n  globalThis.vtradeMarketTransitionState=function(candleTime,nowMs=Date.now()){\n    const d=transitionDay.format(new Date(nowMs));\n    const fresh=freshMondayM5(candleTime,nowMs);\n    return {phase:d==='Sun'?'SUNDAY_PREOPEN':d==='Mon'?(fresh?'MONDAY_LIVE_REVALIDATION':'MONDAY_OPEN_WAIT'):'LIVE_MARKET',fridayContext:d==='Sun'||(d==='Mon'&&!fresh),mondayFreshM5:fresh,candleTime:Number.isFinite(Number(candleTime))?Number(candleTime):null,timezone:'Asia/Phnom_Penh'};\n  };\n  globalThis.vtradeMondayExecutionFreshTime=freshMondayM5;\n})();\n`;

  let out=source;
  if(!out.includes(MARKER))out=source.slice(0,i)+code+source.slice(i);

  out=out.replace(/\s*const\s+marketTransition\s*=\s*globalThis\.vtradeMarketTransitionState\?\.\([^;]+;\s*/g,'\n');
  out=out.replace(/\s*const\s+mondayExecutionGate\s*=\s*marketTransition\.phase==='MONDAY_LIVE_REVALIDATION'\?marketTransition\.mondayFreshM5:marketTransition\.phase==='LIVE_MARKET';\s*/g,'\n');

  const gateNeedle=",all=ready===4&&bias!=='NEUTRAL'";
  if(out.includes(gateNeedle) && !out.includes('marketTransition=globalThis.vtradeMarketTransitionState')){
    out=out.replace(gateNeedle,",marketTransition=globalThis.vtradeMarketTransitionState?.(m?.candle?.candleTime??null,Date.now())||{phase:'LIVE_MARKET',fridayContext:false,mondayFreshM5:true},mondayExecutionGate=marketTransition.phase==='MONDAY_LIVE_REVALIDATION'?marketTransition.mondayFreshM5:marketTransition.phase==='LIVE_MARKET',all=ready===4&&bias!=='NEUTRAL'");
  }

  const workflowRe=/workflow:\{stage:ready===4\?'PRE_MARKET_MTF_READY':'PRE_MARKET_MTF_WAITING',source:'MT5_AUTHORITATIVE_V4',/;
  if(workflowRe.test(out) && !out.includes("fridayCandleRole:marketTransition.fridayContext")){
    out=out.replace(workflowRe,"workflow:{stage:ready===4?'PRE_MARKET_MTF_READY':'PRE_MARKET_MTF_WAITING',source:'MT5_AUTHORITATIVE_V4',marketTransition,fridayCandleRole:marketTransition.fridayContext?'HISTORICAL_REFERENCE':'LIVE_EXECUTION_CONTEXT',");
  }
  return out;
}

if(process.env.VTRADE_TELEGRAM_CHILD!=='1'){
  try{
    if(fs.existsSync(SERVER)){
      const before=fs.readFileSync(SERVER,'utf8');
      const after=patch(before);
      if(after!==before){fs.writeFileSync(SERVER,after,'utf8');console.log('[V-TRADE MARKET TRANSITION] V12 active | injected scope self-contained | TDZ-safe | fail-closed');}
    }
  }catch(e){console.error('[V-TRADE MARKET TRANSITION] V12 failed:',e.stack||e.message);throw e;}
}else{
  console.log('[V-TRADE MARKET TRANSITION] TELEGRAM READ-ONLY | CORE server patch skipped | transition context available');
}

module.exports={patch,freshMondayM5,getMarketTransitionState};
