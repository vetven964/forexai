/* V-TRADE PRE-MARKET SIGNAL AUTHORITY V2 runtime safety fix */
'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'server.js');
const AUTHORITY=path.join(__dirname,'pre-market-signal-authority-v2.js');
const MARK='VTRADE_PREMARKET_SIGNAL_AUTHORITY_V2_RUNTIME_FIX_V2';

function sanitizeServer(source){
  let s=String(source||'');
  // Remove the legacy malformed bridge payload. Older builds wrote literal \\n  // characters into server.js, which makes Node fail before Express can bind.
  s=s.replace(/\\n?try\s*\{\s*require\(['"]\.\/telegram-signal-bridge\.js['"]\)\.install\(app\)[\s\S]*?VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');
  s=s.replace(/\\n?\/\*\s*VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');

  // The generated authority block must never use `ob` for both the function
  // and the boolean result. Rename both sides deterministically.
  s=s.replace(/function ob\(c,want\)/g,'function findOb(c,want)');
  s=s.replace(/\bob\(rows\[tf\]\?\.candles\|\|\[\],bias\)/g,'findOb(rows[tf]?.candles||[],bias)');
  s=s.replace(/,ob=CORE\.some\(tf=>findOb\(/g,',hasOb=CORE.some(tf=>findOb(');
  s=s.replace(/,ob=CORE\.some\(tf=>ob\(/g,',hasOb=CORE.some(tf=>findOb(');
  s=s.replace(/\+\(ob\?1:0\)/g,'+(hasOb?1:0)');
  s=s.replace(/orderBlock:ob/g,'orderBlock:hasOb');

  // Preserve candles on timeframe rows so OB/FVG zone discovery has data.
  s=s.replace(/return\{tf,ready:true,bars:c\.length,/g,'return{tf,ready:true,bars:c.length,candles:c,');
  return s;
}

// Intercept later runtime writes to server.js. The enhanced launcher injects
// additional authority/bridge code after this module is loaded; sanitize that
// final generated source before server-launcher compiles it.
if(!fs.__vtradeRuntimeWriteGuard){
  const originalWriteFileSync=fs.writeFileSync.bind(fs);
  fs.writeFileSync=function(file,data,options){
    try{
      if(path.resolve(String(file))===FILE && typeof data==='string') data=sanitizeServer(data);
    }catch(e){
      console.error('[V-TRADE PRE-MARKET SIGNAL V2] write guard failed:',e.message);
    }
    return originalWriteFileSync(file,data,options);
  };
  fs.__vtradeRuntimeWriteGuard=true;
}

try{
  if(fs.existsSync(AUTHORITY)){
    let s=fs.readFileSync(AUTHORITY,'utf8');
    const before=s;
    s=s.replace(/function ob\(c,want\)/g,'function findOb(c,want)');
    s=s.replace(/\bob\(r\?\.candles\|\|\[\],want\)/g,'findOb(r?.candles||[],want)');
    s=s.replace(/,ob=CORE\.some\(/g,',hasOb=CORE.some(');
    s=s.replace(/\+\(ob\?1:0\)/g,'+(hasOb?1:0)');
    s=s.replace(/orderBlock:ob/g,'orderBlock:hasOb');
    if(!s.includes(MARK)) s+='\n/* '+MARK+' */\n';
    if(s!==before) fs.writeFileSync(AUTHORITY,s,'utf8');
  }
  console.log('[V-TRADE PRE-MARKET SIGNAL V2] runtime safety/write-guard fix active');
}catch(e){console.error('[V-TRADE PRE-MARKET SIGNAL V2] runtime safety fix failed:',e.stack||e.message||e);}
module.exports={MARK};
