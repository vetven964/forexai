/* V-TRADE AI — Pre-Market route boot hotfix V10 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_PREMARKET_ROUTE_BOOT_HOTFIX_V10';

if(fs.existsSync(SERVER)){
  let source=fs.readFileSync(SERVER,'utf8');

  const legacy='/* VTRADE_PREMARKET_ROUTE_BOOT_HOTFIX_V8 */';
  let start=source.indexOf(legacy);
  while(start>=0){
    const next=source.indexOf('/* VTRADE_PREMARKET_AUTHORITY_ROUTE_V4 */',start);
    if(next>=0) source=source.slice(0,start)+source.slice(next);
    else break;
    start=source.indexOf(legacy);
  }

  try{
    const direct=require('./pre-market-direct-route-hotfix.js');
    source=direct.inject(source);
    console.log('[V-TRADE PRE-MARKET] DIRECT MT5-FEED transport loaded');
  }catch(e){
    console.error('[V-TRADE PRE-MARKET] DIRECT MT5-FEED injection failed:',e.stack||e.message);
    throw e;
  }

  try{
    const authority=require('./pre-market-authority-route-hotfix.js');
    source=authority.inject(source);
    console.log('[V-TRADE PRE-MARKET AUTH] SINGLE authoritative processing route loaded');
  }catch(e){
    console.error('[V-TRADE PRE-MARKET AUTH] authority injection failed:',e.stack||e.message);
    throw e;
  }

  // Friday closed candles remain historical context. Monday execution is blocked
  // until the authoritative MT5 M5 candle is from Monday and <=10 minutes old.
  try{
    const monday=require('./monday-fresh-candle-contract.js');
    source=monday.patch(source);
    console.log('[V-TRADE MONDAY] Friday context retained | fresh Monday M5 execution gate loaded');
  }catch(e){
    console.error('[V-TRADE MONDAY] fresh-candle contract failed:',e.stack||e.message);
    throw e;
  }

  if(!source.includes(MARKER)){
    const anchor='const app = express();';
    if(!source.includes(anchor))throw new Error('server app marker not found');
    const patch=`\n/* ${MARKER} */\n// Legacy Candle-Open compatibility engine intentionally disabled.\n// Authority V4 + Monday fresh-candle contract are canonical.\nconsole.log('[V-TRADE PRE-MARKET] ROUTE BOOT V10: authority + Monday freshness canonical');\n`;
    source=source.replace(anchor,anchor+patch);
  }

  fs.writeFileSync(SERVER,source,'utf8');
}
