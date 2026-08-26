'use strict';
const {calculate}=require('./vzone-score-engine-v1');

function buildScore(input={}){
  const out=calculate(input);
  return {
    score:out.score,
    rawScore:out.rawScore,
    direction:out.direction,
    bias:out.bias,
    tierValues:out.tierValues,
    equalWeight:out.equalWeight,
    source:'V-Zone AI Score Engine V1'
  };
}

function attachScore(authority={}, inputs={}){
  const score=buildScore(inputs);
  // Score describes direction only. Existing canonical authorization remains authoritative.
  return {...authority,vzoneScore:score};
}

module.exports={buildScore,attachScore};
