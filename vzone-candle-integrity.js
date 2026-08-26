'use strict';

/** Reject malformed, future, non-finite and impossible OHLC candles before signal analysis. */
function validateCandle(b, now=Date.now()) {
  if(!b || typeof b!=='object') return {valid:false,reason:'missing'};
  const o=Number(b.o??b.open), h=Number(b.h??b.high), l=Number(b.l??b.low), c=Number(b.c??b.close);
  const t=Number(b.t??b.time??b.timestamp??b.openTime??b.candleTime);
  if(![o,h,l,c].every(Number.isFinite)) return {valid:false,reason:'non-finite-ohlc'};
  if(!(h>=Math.max(o,c) && l<=Math.min(o,c) && h>=l)) return {valid:false,reason:'invalid-ohlc'};
  if(Number.isFinite(t) && t>now+5000) return {valid:false,reason:'future-candle'};
  return {valid:true,candle:{...b,o,h,l,c,t:Number.isFinite(t)?t:undefined}};
}
function filterValidBars(bars,now=Date.now()) {
  return (Array.isArray(bars)?bars:[]).map(b=>validateCandle(b,now)).filter(x=>x.valid).map(x=>x.candle);
}
module.exports={validateCandle,filterValidBars};
