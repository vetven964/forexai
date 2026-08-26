'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=__dirname;
const BRIDGE=path.join(ROOT,'telegram-signal-bridge.js');
const SERVER=path.join(ROOT,'server.js');
const MARK='VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1';
function apply(){
  // Ensure Telegram child processes can reach the Render CORE instead of assuming localhost.
  if(!process.env.VTRADE_CORE_URL){
    const base=String(process.env.RENDER_EXTERNAL_URL||process.env.APP_BASE_URL||'').replace(/\/$/,'');
    if(base) process.env.VTRADE_CORE_URL=base;
  }
  if(fs.existsSync(BRIDGE)){
    let s=fs.readFileSync(BRIDGE,'utf8');
    if(!s.includes(MARK)){
      const old="async function fetchCanonical(port,path,headers){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(`http://127.0.0.1:${port}${path}`,{headers:{...headers,'Cache-Control':'no-cache'},signal:ctl.signal});const d=await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));return{r,d};}finally{clearTimeout(timer);}}";
      const replacement="async function fetchCanonical(port,path,headers){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const base=String(process.env.VTRADE_CORE_URL||process.env.RENDER_EXTERNAL_URL||process.env.APP_BASE_URL||('http://127.0.0.1:'+port)).replace(/\\/$/,'');const r=await fetch(base+path,{headers:{...headers,'Cache-Control':'no-cache'},signal:ctl.signal});const d=await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));return{r,d};}finally{clearTimeout(timer);}}";
      if(s.includes(old)) s=s.replace(old,replacement);
      else console.warn('[V-TRADE TELEGRAM BRIDGE FIX] fetchCanonical anchor changed; no unsafe rewrite');
      s+='\\n/* '+MARK+' */\\n';
      fs.writeFileSync(BRIDGE,s,'utf8');
      console.log('[V-TRADE TELEGRAM BRIDGE FIX] public/Render CORE URL routing enabled');
    }
  }
  // Guarantee the market-snapshot endpoint is installed on the canonical CORE app.
  if(fs.existsSync(SERVER)){
    let s=fs.readFileSync(SERVER,'utf8');
    const anchor='const app = express();';
    if(!s.includes(MARK+' SERVER')&&s.includes(anchor)){
      const inject="\\ntry { require('./telegram-signal-bridge.js').install(app); console.log('[V-TRADE TELEGRAM BRIDGE FIX] /api/telegram/market-snapshot route installed'); } catch(e) { console.error('[V-TRADE TELEGRAM BRIDGE FIX] route install failed:',e.message); }\\n/* "+MARK+" SERVER */";
      s=s.replace(anchor,anchor+inject);
      fs.writeFileSync(SERVER,s,'utf8');
    }
  }
}
try{apply();}catch(e){console.error('[V-TRADE TELEGRAM BRIDGE FIX] failed:',e.stack||e.message||e);}
module.exports={MARK};
