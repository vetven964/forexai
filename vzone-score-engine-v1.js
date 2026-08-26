'use strict';

const SCORE_TIERS=[10,15,25,35,45,55,65,75,85,95,100];

function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function tier(raw){
  const n=clamp(Math.round(Number(raw)||0),-100,100);
  if(n===0)return 0;
  const sign=n<0?-1:1;
  const a=Math.abs(n);
  return sign*SCORE_TIERS.reduce((best,x)=>Math.abs(x-a)<Math.abs(best-a)?x:best,SCORE_TIERS[0]);
}

/**
 * Canonical directional score. ICT and CRT are equal-weight groups.
 * This module never creates a trade by itself: authority + candle + broker
 * freshness + complete trade levels must authorize execution separately.
 */
function calculate(input={}){
  const ict=Number(input.ictPoints)||0;
  const crt=Number(input.crtPoints)||0;
  const mtf=Number(input.mtfPoints)||0;
  const liquidity=Number(input.liquidityPoints)||0;
  const structure=Number(input.structurePoints)||0;
  const raw=clamp(ict+crt+mtf+liquidity+structure,-100,100);
  const score=tier(raw);
  return {
    score,
    rawScore:raw,
    direction:score>0?'BUY':score<0?'SELL':'WAIT',
    bias:score>0?'BULLISH':score<0?'BEARISH':'NEUTRAL',
    tierValues:SCORE_TIERS.slice(),
    equalWeight:{ICT:ict,CRT:crt}
  };
}

module.exports={SCORE_TIERS,tier,calculate};
