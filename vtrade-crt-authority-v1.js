'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'server.js');
const MARK='VTRADE_CRT_SCOPE_HOTFIX_V3';

function patch(){
  if(!fs.existsSync(FILE)) return false;
  let source=fs.readFileSync(FILE,'utf8');
  if(source.includes(MARK)) return false;

  // The CRT function was stringified into server.js. Its local `bars()` helper
  // was outside the stringified function scope, producing ReferenceError: bars is not defined.
  // Replace that dependency with a fully self-contained candle extractor.
  const broken="const raw=bars(root?.M5??root?.m5??root).map(norm).filter(x=>[x.o,x.h,x.l,x.c].every(Number.isFinite));";
  const fixed="const raw=(Array.isArray(root?.M5)?root.M5:Array.isArray(root?.m5)?root.m5:Array.isArray(root)?root:Array.isArray(root?.candles)?root.candles:Array.isArray(root?.bars)?root.bars:[]).map(x=>norm(x)).filter(x=>[x.o,x.h,x.l,x.c].every(Number.isFinite));";
  let count=0;
  while(source.includes(broken)){
    source=source.replace(broken,fixed);
    count++;
  }

  // Some older injected builds used an equivalent helper call without the exact
  // `const raw` prefix. Patch the helper reference wherever it remains inside CRT.
  const brokenExpr="bars(root?.M5??root?.m5??root)";
  const fixedExpr="(Array.isArray(root?.M5)?root.M5:Array.isArray(root?.m5)?root.m5:Array.isArray(root)?root:Array.isArray(root?.candles)?root.candles:Array.isArray(root?.bars)?root.bars:[])";
  while(source.includes(brokenExpr)){
    source=source.replace(brokenExpr,fixedExpr);
    count++;
  }

  const marker="/* ${MARK} */";
  const anchor='const app = express();';
  if(!source.includes(marker)){
    if(!source.includes(anchor)) throw new Error('server app marker not found');
    source=source.replace(anchor,anchor+'\n'+marker+'\nconsole.log(\'[V-TRADE CRT] scope hotfix V3 loaded | self-contained candle extractor | replacements='+count+'\');');
  }
  fs.writeFileSync(FILE,source,'utf8');
  return true;
}

try{patch();}catch(e){console.error('[V-TRADE CRT] scope hotfix failed:',e.stack||e.message);throw e;}
module.exports={MARK};
