'use strict';

/** Reject malformed, future and active/open OHLC candles before signal analysis. */
function normalizeTime(v){const n=Number(v);if(!Number.isFinite(n))return null;return n<1e12?n*1000:n;}
function validateCandle(b,now=Date.now(),timeframeMs=0){
  if(!b||typeof b!=='object')return{valid:false,reason:'missing'};
  const o=Number(b.o??b.open),h=Number(b.h??b.high),l=Number(b.l??b.low),c=Number(b.c??b.close),t=normalizeTime(b.t??b.time??b.timestamp??b.openTime??b.candleTime);
  if(![o,h,l,c].every(Number.isFinite))return{valid:false,reason:'non-finite-ohlc'};
  if(!(h>=Math.max(o,c)&&l<=Math.min(o,c)&&h>=l))return{valid:false,reason:'invalid-ohlc'};
  if(t!=null&&t>now+5000)return{valid:false,reason:'future-candle'};
  if(timeframeMs>0&&t!=null&&now-t<timeframeMs)return{valid:false,reason:'active-candle'};
  return{valid:true,candle:{...b,o,h,l,c,t:t??undefined}};
}
function filterValidBars(bars,now=Date.now(),timeframeMs=0){return(Array.isArray(bars)?bars:[]).map(b=>validateCandle(b,now,timeframeMs)).filter(x=>x.valid).map(x=>x.candle);}
module.exports={validateCandle,filterValidBars,normalizeTime};
