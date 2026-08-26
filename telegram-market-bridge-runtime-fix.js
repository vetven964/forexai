'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=__dirname;
const BRIDGE=path.join(ROOT,'telegram-signal-bridge.js');
const SERVER=path.join(ROOT,'server.js');
const MARK='VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V3';

function repairServer(){
  if(!fs.existsSync(SERVER)) return;
  let s=fs.readFileSync(SERVER,'utf8');
  const before=s;

  // Remove the malformed V1 payload regardless of whitespace/escaping differences.
  // The old patch wrote literal backslash-n characters into server.js, so matching
  // the exact old string was too fragile. Target the unique V1 marker instead.
  const marker=/\\n?try\s*\{\s*require\('\.\/telegram-signal-bridge\.js'\)\.install\(app\)[\s\S]*?VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g;
  s=s.replace(marker,'');

  // Also remove an accidental literal "\\n" immediately before the marker if
  // a previous patch left the marker without the opening try block.
  s=s.replace(/\\n?\/\*\s*VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');

  if(s!==before){
    fs.writeFileSync(SERVER,s,'utf8');
    console.log('[V-TRADE TELEGRAM BRIDGE FIX] repaired malformed V1 server injection | V3');
  }
}

function apply(){
  if(!process.env.VTRADE_CORE_URL){
    const base=String(process.env.RENDER_EXTERNAL_URL||process.env.APP_BASE_URL||'').replace(/\/$/,'');
    if(base) process.env.VTRADE_CORE_URL=base;
  }
  repairServer();

  if(fs.existsSync(BRIDGE)){
    let s=fs.readFileSync(BRIDGE,'utf8');
    if(!s.includes(MARK)){
      const old="async function fetchCanonical(port,path,headers){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(`http://127.0.0.1:${port}${path}`,{headers:{...headers,'Cache-Control':'no-cache'},signal:ctl.signal});const d=await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));return{r,d};}finally{clearTimeout(timer);}}";
      const replacement="async function fetchCanonical(port,path,headers){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const base=String(process.env.VTRADE_CORE_URL||process.env.RENDER_EXTERNAL_URL||process.env.APP_BASE_URL||('http://127.0.0.1:'+port)).replace(/\\/$/,'');const r=await fetch(base+path,{headers:{...headers,'Cache-Control':'no-cache'},signal:ctl.signal});const d=await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));return{r,d};}finally{clearTimeout(timer);}}";
      if(s.includes(old)) s=s.replace(old,replacement);
      else console.warn('[V-TRADE TELEGRAM BRIDGE FIX] fetchCanonical anchor changed; no unsafe rewrite');
      s+='\n/* '+MARK+' */\n';
      fs.writeFileSync(BRIDGE,s,'utf8');
      console.log('[V-TRADE TELEGRAM BRIDGE FIX] public/Render CORE URL routing enabled');
    }
  }
}
try{apply();}catch(e){console.error('[V-TRADE TELEGRAM BRIDGE FIX] failed:',e.stack||e.message||e);}
module.exports={MARK};
