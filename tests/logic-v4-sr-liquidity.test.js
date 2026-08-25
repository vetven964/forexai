'use strict';
const assert=require('node:assert/strict');
const {applyExecution}=require('../logic-v4-execution');
function base(extra={}){return {tradeAuthorized:true,entryMode:'RANGE_EDGE_EARLY',signal:'BUY',price:100,marketRegime:{rangeHigh:110,rangeLow:95,atr:2},historicalPatternScan:{expectedMove:8},...extra};}
const cases=[
  ['reject when entry is at strong resistance without sweep/MSS',base({price:109,supportResistance:{resistance:[{price:110,strength:'strong'}]},liquidity:{},confirmations:{liquiditySweep:false,mss:false}}),false),
  ['reject when liquidity sweep exists but MSS is missing',base({price:99,supportResistance:{support:[{price:98,strength:'strong'}]},liquidity:{swingLow:98.5},confirmations:{liquiditySweep:true,mss:false}}),false),
  ['allow confirmed sweep plus MSS when RR is valid',base({price:99,supportResistance:{support:[{price:98,strength:'strong'}]},liquidity:{swingLow:97},confirmations:{liquiditySweep:true,mss:true}}),true)
];
for(const [name,input,want] of cases){const out=applyExecution(input);assert.equal(out.tradeAuthorized,want,name);}
console.log('logic-v4 S/R-liquidity tests: PASS');
