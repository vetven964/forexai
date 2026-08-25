/* V-TRADE AI — Telegram Market Bridge V6.4
 * READ-ONLY MT5 MARKET DATA ONLY.
 * Canonical Pre-Market -> Telegram AI handoff.
 * Friday history is context only; Monday execution remains fail-closed until fresh M5.
 * Adds a deterministic 10-minute preview window without authorizing an entry.
 */
'use strict';
const MARKER='VTRADE_TELEGRAM_MARKET_BRIDGE_V6_4';
const API_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const PREVIEW_LEAD_MS=10*60*1000;
function isObj(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function arr(x){
  if(Array.isArray(x))return x;
  if(!isObj(x))return [];
  for(const k of ['bars','candles','history','data','series','items','rows']){
    if(Array.isArray(x[k]))return x[k];
    if(isObj(x[k])){const a=arr(x[k]);if(a.length)return a;}
  }
  return [];
}
function frameRoot(data){
  const candidates=[data?.timeframes,data?.frames,data?.mtf?.timeframes,data?.mtf?.frames,data?.data?.timeframes,data?.data?.frames,data?.payload?.timeframes,data?.payload?.frames,data?.result?.timeframes,data?.result?.frames];
  for(const x of candidates)if(isObj(x))return x;
  return {};
}
function frameFor(root,tf){
  const x=root?.[tf]||root?.[tf.toLowerCase()]||root?.[tf.toUpperCase()];
  if(x)return x;
  const alt={M5:['m5','5m'],M15:['m15','15m'],H1:['h1','1h'],H4:['h4','4h']}[tf]||[];
  for(const k of alt)if(root?.[k])return root[k];
  return {};
}
function normBar(x){
  if(!x||typeof x!=='object')return null;
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const o=n(x.o??x.open??x.Open),h=n(x.h??x.high??x.High),l=n(x.l??x.low??x.Low),c=n(x.c??x.close??x.Close);
  if([o,h,l,c].some(v=>v==null))return null;
  const t=n(x.candleTime??x.timeMs??x.timestamp??x.openTime??x.time??x.t);
  return {...x,o,h,l,c,candleTime:t};
}
function extractTimeframes(data){
  const sourceFrames=frameRoot(data),timeframes={};
  for(const tf of ['M5','M15','H1','H4']){
    const src=frameFor(sourceFrames,tf),raw=arr(src).map(normBar).filter(Boolean);
    timeframes[tf]={bars:raw,candles:raw,count:raw.length,ready:src?.ready===true||raw.length>=30,source:src?.source||'canonical-pre-market'};
  }
  return timeframes;
}
function totalBars(timeframes){return Object.values(timeframes).reduce((s,x)=>s+Number(x?.count||0),0);}
function latestCandleTime(timeframes){const bars=Array.isArray(timeframes?.M5?.bars)?timeframes.M5.bars:[];const last=bars.at(-1)||{};return last.candleTime??last.timeMs??last.timestamp??last.openTime??last.time??last.t??null;}
function fallbackTransition(candleTime,nowMs=Date.now()){
  const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'}).format(new Date(nowMs));
  const t=Number(candleTime),ms=Number.isFinite(t)?(t<1e12?t*1000:t):NaN;
  const candleDay=Number.isFinite(ms)?new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'}).format(new Date(ms)):null;
  const fresh=day==='Mon'&&candleDay==='Mon'&&Number.isFinite(ms)&&nowMs>=ms&&nowMs-ms<=PREVIEW_LEAD_MS;
  return{phase:day==='Sun'?'SUNDAY_PREOPEN':day==='Mon'?(fresh?'MONDAY_LIVE_REVALIDATION':'MONDAY_OPEN_WAIT'):'LIVE_MARKET',fridayContext:day==='Sun'||(day==='Mon'&&!fresh),mondayFreshM5:fresh,candleTime:Number.isFinite(t)?t:null,timezone:'Asia/Phnom_Penh'};
}
function resolveTransition(data,timeframes){
  const t=data?.marketTransition||data?.workflow?.marketTransition;
  if(t&&typeof t==='object'&&typeof t.phase==='string')return t;
  try{if(typeof globalThis.vtradeMarketTransitionState==='function')return globalThis.vtradeMarketTransitionState(latestCandleTime(timeframes),Date.now());}
  catch(e){console.warn('[V-TRADE TELEGRAM BRIDGE] shared transition resolver failed:',e.message);}
  return fallbackTransition(latestCandleTime(timeframes));
}
function fridayContext(timeframes){
  const bars=[...(timeframes?.H4?.bars||[]),...(timeframes?.H1?.bars||[])].filter(x=>Number.isFinite(Number(x.candleTime))).sort((a,b)=>Number(a.candleTime)-Number(b.candleTime);
  const friday=bars.filter(x=>new Date(Number(x.candleTime)<1e12?Number(x.candleTime)*1000:Number(x.candleTime)).toLocaleString('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'})==='Fri');
  if(!friday.length)return {available:false};
  const first=friday[0],last=friday[friday.length-1];
  return {available:true,open:first.o,high:Math.max(...friday.map(x=>x.h)),low:Math.min(...friday.map(x=>x.l)),close:last.c,candleCount:friday.length,source:'MT5 historical candles'};
}
function mondayContext(timeframes,nowMs=Date.now()){
  const bars=[...(timeframes?.M5?.bars||[])].filter(x=>Number.isFinite(Number(x.candleTime))).sort((a,b)=>Number(a.candleTime)-Number(b.candleTime));
  const monday=bars.filter(x=>new Date(Number(x.candleTime)<1e12?Number(x.candleTime)*1000:Number(x.candleTime)).toLocaleString('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'})==='Mon');
  const last=monday.at(-1);
  const age=last?nowMs-(Number(last.candleTime)<1e12?Number(last.candleTime)*1000:Number(last.candleTime)):null;
  return {available:!!last,openingCandle:last?{time:last.candleTime,open:last.o,high:last.h,low:last.l,close:last.c}:null,freshM5:age!=null&&age>=0&&age<=PREVIEW_LEAD_MS,ageMs:age};
}
function nextM15Open(nowMs=Date.now()){return Math.ceil(nowMs/(15*60*1000))*(15*60*1000);}
function previewWindow(nowMs=Date.now(),candleOpenMs=nextM15Open(nowMs)){
  const leadStart=candleOpenMs-PREVIEW_LEAD_MS;
  return {enabled:true,leadMinutes:10,candleOpenAt:new Date(candleOpenMs).toISOString(),windowStart:new Date(leadStart).toISOString(),windowEnd:new Date(candleOpenMs).toISOString(),active:nowMs>=leadStart&&nowMs<candleOpenMs,authorization:false,kind:'PREVIEW_ONLY'};
}
function canonicalAuthority(data){
  if(isObj(data?.authority))return data.authority;
  if(isObj(data?.signalAuthority))return data.signalAuthority;
  if(isObj(data?.canonicalAuthority))return data.canonicalAuthority;
  const confirmations=isObj(data?.confirmations)?data.confirmations:(isObj(data?.gates)?data.gates:{});
  return {...data,signal:data?.signal??data?.canonical?.signal??'WAIT',bias:data?.bias??data?.canonical?.bias??'NEUTRAL',setupScore:data?.setupScore??data?.score??data?.directionScore??data?.canonical?.directionScore??0,confidence:data?.confidence??data?.canonical?.confidence??0,confirmations,decision:data?.decision??{},execution:data?.execution??data?.workflow??{status:'WAIT'},news:data?.news??{},entry:data?.entry??null,stopLoss:data?.stopLoss??data?.sl??null,takeProfit:Array.isArray(data?.takeProfit)?data.takeProfit:(Array.isArray(data?.tp)?data.tp:[]),source:data?.canonical?.source||'canonical-pre-market'};
}
async function fetchCanonical(port,pathname,headers){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch(`http://127.0.0.1:${port}${pathname}`,{headers:{...headers,'Cache-Control':'no-cache'},signal:controller.signal});const d=await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));return{r,d};}finally{clearTimeout(timer);}
}
function candidateScore(d,timeframes){return (d?.success===true?100000000:0)+totalBars(timeframes)*10+(d?.complete===true?1000:0)+(d?.available===4?100:0);}
function selectCanonical(candidates){let best=null,bestScore=-1;for(const c of candidates){const t=extractTimeframes(c.d),score=candidateScore(c.d,t);if(score>bestScore){best={...c,timeframes:t};bestScore=score;}}return best;}
function install(app){
  if(!app||app.__VTRADE_TELEGRAM_MARKET_BRIDGE_V6_4__)return;
  app.__VTRADE_TELEGRAM_MARKET_BRIDGE_V6_4__=true;
  app.get('/api/telegram/market-snapshot',async(req,res)=>{
    res.set('Cache-Control','no-store, no-cache, must-revalidate');
    if(API_KEY&&String(req.get('X-VTRADE-TELEGRAM-KEY')||'')!==API_KEY)return res.status(401).json({success:false,error:'Telegram market bridge unauthorized'});
    try{
      const port=Number(process.env.PORT||10000),headers={};
      const candidates=[];
      for(const pathname of ['/api/pre-market/xauusd','/api/pre-market/candle-open','/api/pre-market/intelligence']){try{const c=await fetchCanonical(port,pathname,headers);if(c?.d?.success===true)candidates.push({...c,pathname});}catch(e){console.warn('[V-TRADE TELEGRAM BRIDGE] canonical route failed | '+pathname+' | '+e.message);}}
      const chosen=selectCanonical(candidates);
      if(!chosen)return res.status(503).json({success:false,error:'Canonical Pre-Market unavailable',source:'BROKER_NATIVE_MT5',state:'WAIT'});
      const data=chosen.d,timeframes=chosen.timeframes,n=v=>Number.isFinite(Number(v))?Number(v):null,nowMs=Date.now();
      const rawPrice=n(data?.livePrice??data?.price??data?.quote?.price),price=rawPrice!=null&&rawPrice>0?rawPrice:null;
      const allReady=['M5','M15','H1','H4'].every(tf=>timeframes[tf].ready),age=n(data?.quoteAgeSec??data?.ageSec),quoteConnected=price!=null&&allReady,quoteFresh=age==null?quoteConnected:(age>=0&&age<=60&&quoteConnected),marketTransition=resolveTransition(data,timeframes),mondayFreshM5=marketTransition?.mondayFreshM5===true,mondayOpenWait=marketTransition?.phase==='MONDAY_OPEN_WAIT',mondayLiveRevalidation=marketTransition?.phase==='MONDAY_LIVE_REVALIDATION',executionFresh=marketTransition?.phase==='LIVE_MARKET'||(mondayLiveRevalidation&&mondayFreshM5),executionLoaded=quoteFresh&&executionFresh,authority=canonicalAuthority(data),friday=fridayContext(timeframes),monday=mondayContext(timeframes,nowMs),preview=previewWindow(nowMs);
      const mtfCounts=Object.fromEntries(Object.entries(timeframes).map(([tf,x])=>[tf,x.count]));
      const signal=String(authority?.signal||'WAIT').toUpperCase(),validSignal=['BUY','SELL'].includes(signal)&&String(authority?.execution?.status||authority?.status||'').toUpperCase().includes('ENTRY CONFIRMED')&&authority?.confirmations?.allGatesPassed===true&&n(authority?.entry)!=null;
      const previewPayload={active:preview.active,bias:authority?.bias||'NEUTRAL',signal:validSignal?signal:'WAIT',score:authority?.setupScore??0,confidence:authority?.confidence??0,entry:validSignal?authority?.entry:null,sl:validSignal?(authority?.stopLoss??null):null,tp:validSignal?(authority?.takeProfit||[]):[],authorization:false};
      console.log(`[V-TRADE TELEGRAM BRIDGE] V6.4 SNAPSHOT | transition=${marketTransition?.phase||'UNKNOWN'} | preview=${preview.active?'ACTIVE':'OFF'} | Friday=${friday.available?'READY':'N/A'} | Monday=${monday.available?'READY':'N/A'} | authority=${signal} | validEntry=${validSignal}`);
      return res.json({success:true,source:'BROKER_NATIVE_MT5',contract:MARKER,symbol:'XAUUSD',price,bid:n(data?.bid),ask:n(data?.ask),spread:n(data?.spread),connected:executionLoaded,quoteConnected,quoteFresh,quoteAgeSec:age,state:executionLoaded?'READY':'WAIT',timeframes,frames:timeframes,mtfCounts,authority,fridayContext:friday,mondayContext:monday,preview,previewPayload,generatedAt:new Date().toISOString(),telegramRole:'CANONICAL_PREMARKET_CONSUMER',preMarketLoaded:true,preMarketAuthority:true,executionLoaded,executionContext:executionLoaded?'LIVE':'PRE_OPEN_WAIT',marketTransition,fridayCandleRole:marketTransition?.fridayContext?'HISTORICAL_REFERENCE':'LIVE_EXECUTION_CONTEXT',freshMondayM5:mondayFreshM5,mondayOpenWait,mondayLiveRevalidation,canonicalRoute:chosen.pathname});
    }catch(e){const message=String(e?.name==='AbortError'?'Canonical Pre-Market timeout':e?.message||e);console.error('[V-TRADE TELEGRAM BRIDGE] snapshot failed:',message);return res.status(503).json({success:false,error:message,source:'BROKER_NATIVE_MT5',state:'WAIT'});}
  });
  console.log('[V-TRADE TELEGRAM BRIDGE] V6.4 ACTIVE | Friday historical + Monday context + 10m preview | BUY/SELL remains authority-gated | fail-closed');
}
module.exports={MARKER,install,resolveTransition,canonicalAuthority,previewWindow,fridayContext,mondayContext};
