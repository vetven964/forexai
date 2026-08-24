/* V-TRADE Direction / Zone Truth Hotfix V1
 * Purpose: prevent pre-market BUY/SELL direction from being driven by
 * weighted candle-score alone. Direction must come from H4/H1/M15 core
 * structure confluence (2 of 3). Zones remain reference-only until gates pass.
 */
'use strict';
const Module=require('module');
const original=Module._extensions['.js'];
const TARGET='pre-market-candle-open-engine.js';
Module._extensions['.js']=function(module,filename){
  if(!String(filename).endsWith(TARGET)) return original(module,filename);
  const fs=require('fs');
  let source=fs.readFileSync(filename,'utf8');
  const old="const bias=buy>sell?'BULLISH':sell>buy?'BEARISH':'NEUTRAL';";
  const replacement=`const coreSides=[rows.H4?.direction,rows.H1?.direction,rows.M15?.direction];
    const coreBull=coreSides.filter(x=>x==='BULLISH').length;
    const coreBear=coreSides.filter(x=>x==='BEARISH').length;
    const coreBias=coreBull>=2?'BULLISH':coreBear>=2?'BEARISH':'NEUTRAL';
    const bias=coreBias;`;
  if(source.includes(old)&&!source.includes('VTRADE_DIRECTION_ZONE_TRUTH_V1')){
    source=source.replace(old,`/* VTRADE_DIRECTION_ZONE_TRUTH_V1 */\n    ${replacement}`);
    console.log('[V-TRADE DIRECTION] Core MTF truth V1 active | H4/H1/M15 2-of-3 direction');
  }
  // Never let a weak/non-core bias expose a directional execution label.
  const oldReturn="buyStrengthPct:round1(buy),sellStrengthPct:round1(sell),buyScore:round1(buy),sellScore:round1(sell),bias,";
  const newReturn="buyStrengthPct:round1(buy),sellStrengthPct:round1(sell),buyScore:round1(buy),sellScore:round1(sell),bias,coreBias,coreBiasVotes:{BULLISH:coreBull,BEARISH:coreBear},directionSource:'H4/H1/M15 core confluence',";
  if(source.includes(oldReturn)) source=source.replace(oldReturn,newReturn);
  const wrapped=Module.wrap(source);
  const compiled=module._compile.bind(module);
  compiled(wrapped,filename);
};
