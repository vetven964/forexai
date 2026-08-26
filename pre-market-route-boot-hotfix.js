/* V-TRADE AI — Pre-Market route boot hotfix V13 */
'use strict';
const fs=require('fs');
const path=require('path');
const SERVER=path.join(__dirname,'server.js');
const MARKER='VTRADE_PREMARKET_ROUTE_BOOT_HOTFIX_V13';

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
    require('./vtrade-canonical-signal-authority-v1.js');
    console.log('[V-TRADE AUTHORITY] Canonical Signal Authority V1 loaded');
  }catch(e){
    console.error('[V-TRADE AUTHORITY] canonical authority load failed:',e.stack||e.message);
    throw e;
  }

  // logic-v4-finalizer installs its wrapper directly into server.js, so reload
  // source immediately afterward; otherwise a stale source snapshot could undo it.
  try{
    const logic=require('./logic-v4-finalizer.js');
    if(typeof logic.install==='function') logic.install();
    source=fs.readFileSync(SERVER,'utf8');
    console.log('[V-TRADE LOGIC] V4.2 historical + range/trend engine loaded');
  }catch(e){
    console.error('[V-TRADE LOGIC] V4.2 load failed:',e.stack||e.message);
    throw e;
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

  try{
    const monday=require('./monday-fresh-candle-contract.js');
    source=monday.patch(source);
    console.log('[V-TRADE MONDAY] Friday context retained | fresh Monday M5 execution gate loaded');
  }catch(e){
    console.error('[V-TRADE MONDAY] fresh-candle contract failed:',e.stack||e.message);
    throw e;
  }

  try{
    const tgState=require('./sunday-monday-telegram-state-hotfix.js');
    source=tgState.patch(source);
    console.log('[V-TRADE TELEGRAM] Sunday/Monday market-state renderer aligned | Asia/Phnom_Penh');
  }catch(e){
    console.error('[V-TRADE TELEGRAM] Sunday/Monday state patch failed:',e.stack||e.message);
    throw e;
  }

  if(!source.includes(MARKER)){
    const anchor='const app = express();';
    if(!source.includes(anchor))throw new Error('server app marker not found');
    const patch=`\n/* ${MARKER} */\n// Canonical authority + V4.2 evidence engine + Monday freshness + timezone-correct Telegram state.\nconsole.log('[V-TRADE PRE-MARKET] ROUTE BOOT V13: canonical execution pipeline active');\n`;
    source=source.replace(anchor,anchor+patch);
  }
  fs.writeFileSync(SERVER,source,'utf8');
}
