/* V-TRADE PRE-MARKET SIGNAL AUTHORITY V2 runtime safety fix */
'use strict';
const fs=require('fs');const path=require('path');
const FILE=path.join(__dirname,'pre-market-signal-authority-v2.js');
const MARK='VTRADE_PREMARKET_SIGNAL_AUTHORITY_V2_RUNTIME_FIX';
if(fs.existsSync(FILE)){
 let s=fs.readFileSync(FILE,'utf8');
 if(!s.includes(MARK)){
  s=s.replace(/function ob\(c,want\)/g,'function findOb(c,want)');
  s=s.replace(/\bob\(r\?\.candles\|\|\[\],want\)/g,'findOb(r?.candles||[],want)');
  s=s.replace(/,ob=CORE\.some\(/g,',hasOb=CORE.some(');
  s=s.replace(/\+\(ob\?1:0\)/g,'+(hasOb?1:0)');
  s=s.replace(/orderBlock:ob/g,'orderBlock:hasOb');
  s += `\n/* ${MARK} */\n`;
  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE PRE-MARKET SIGNAL V2] runtime safety fix applied');
 }else console.log('[V-TRADE PRE-MARKET SIGNAL V2] runtime safety fix already active');
}
module.exports={MARK};
