/* V-TRADE PRE-MARKET V2 — OB scope/function collision fix */
'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'server.js');
const MARK='VTRADE_SERVER_OB_SCOPE_FUNCTION_FIX_V1';

function apply(){
  if(!fs.existsSync(FILE)) return console.warn('[V-TRADE OB FIX] server.js not found');
  let s=fs.readFileSync(FILE,'utf8');
  if(s.includes(MARK)) return console.log('[V-TRADE OB FIX] already active');
  const before=s;
  // In the injected PRE-MARKET SIGNAL AUTHORITY V2 block, `ob` was both
  // the Order-Block function and a boolean result from CORE.some(...).
  s=s.replace(/function ob\(c,want\)/g,'function findOrderBlock(c,want)');
  s=s.replace(/ob\(rows\[tf\]\?\.candles\|\|\[\],want\)/g,'findOrderBlock(rows[tf]?.candles||[],want)');
  s=s.replace(/,ob=CORE\.some\(tf=>ob\(rows\[tf\]\?\.candles\|\|\[\],bias\)\.length>0\),/g,',hasOrderBlock=CORE.some(tf=>findOrderBlock(rows[tf]?.candles||[],bias).length>0),');
  s=s.replace(/\+\(ob\?1:0\)/g,'+(hasOrderBlock?1:0)');
  s=s.replace(/orderBlock:ob/g,'orderBlock:hasOrderBlock');
  // Preserve candle history on each row so zone discovery can inspect OBs.
  s=s.replace(/return\{tf,ready:true,bars:c\.length,/g,'return{tf,ready:true,bars:c.length,candles:c,');
  if(s===before) return console.warn('[V-TRADE OB FIX] target pattern not found; no mutation applied');
  s += `\n/* ${MARK} */\n`;
  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE OB FIX] function/boolean collision removed | candles exposed | fail-closed');
}
try{apply();}catch(e){console.error('[V-TRADE OB FIX] failed:',e.stack||e.message||e);}
module.exports={MARK};
