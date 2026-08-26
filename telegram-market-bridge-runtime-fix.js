'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=__dirname;
const BRIDGE=path.join(ROOT,'telegram-signal-bridge.js');
const SERVER=path.join(ROOT,'server.js');
const MARK='VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V5';

function repairServer(){
  if(!fs.existsSync(SERVER))return;
  let s=fs.readFileSync(SERVER,'utf8');
  const before=s;
  s=s.replace(/\\n?try\s*\{\s*require\('\.\/telegram-signal-bridge\.js'\)\.install\(app\)[\s\S]*?VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');
  s=s.replace(/\\n?\/\*\s*VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');
  if(s!==before){fs.writeFileSync(SERVER,s,'utf8');console.log('[V-TRADE TELEGRAM BRIDGE FIX] repaired malformed V1 server injection | V5');}
}

function patchBridge(){
  if(!fs.existsSync(BRIDGE))return;
  let s=fs.readFileSync(BRIDGE,'utf8');
  const before=s;

  // Use the same public/core authority as the Pre-Market Telegram child.
  s=s.replace(/async function fetchCanonical\(port,path,headers\)\{[\s\S]*?\n\}/,`async function fetchCanonical(port,path,headers){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const base=String(process.env.VTRADE_CORE_URL||process.env.RENDER_EXTERNAL_URL||process.env.APP_BASE_URL||('http://127.0.0.1:'+port)).replace(/\\/$/,'');const r=await fetch(base+path,{headers:{...headers,'Cache-Control':'no-cache'},signal:ctl.signal});const d=await r.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));return{r,d};}finally{clearTimeout(timer);}}`);

  // Adapter for MT5_AUTHORITATIVE_V4 so Telegram has one canonical schema.
  s=s.replace(/function canonicalAuthority\(d\)\{[\s\S]*?\n\}/,`function canonicalAuthority(d){const src=isObj(d?.authority)?d.authority:(isObj(d?.signalAuthority)?d.signalAuthority:(isObj(d?.canonicalAuthority)?d.canonicalAuthority:d));const gates=isObj(src?.gates)?src.gates:(isObj(src?.confirmations)?src.confirmations:{});const exec=src?.execution||{};const side=String(exec.side||src.signalSide||'').toUpperCase();const ready=exec.status==='ENTRY_READY'&&gates.allGatesPassed===true;const atr=num(src?.timeframes?.M15?.atr)||num(src?.timeframes?.M5?.atr)||1;const zone=Array.isArray(exec.zone)&&exec.zone.length>=2?{low:Math.min(Number(exec.zone[0]),Number(exec.zone[1])),high:Math.max(Number(exec.zone[0]),Number(exec.zone[1]))}:null;const price=num(src?.price??src?.livePrice);let entry=null,stopLoss=null,takeProfit=[];if(ready&&zone&&price!=null){entry=exec.inZone?price:(zone.low+zone.high)/2;const buffer=Math.max(atr*.35,.80);stopLoss=side==='BUY'?zone.low-buffer:zone.high+buffer;const risk=Math.max(Math.abs(entry-stopLoss),.50);takeProfit=[entry+(side==='BUY'?1.8:-1.8)*risk,entry+(side==='BUY'?2.7:-2.7)*risk,entry+(side==='BUY'?3.8:-3.8)*risk];}return{...src,signal:ready&&['BUY','SELL'].includes(side)?side:'WAIT',bias:src?.bias||'NEUTRAL',setupScore:src?.directionScore??src?.setupScore??src?.score??0,confidence:src?.confidence??0,confirmations:gates,decision:{...(src?.decision||{}),passed:ready},execution:{...exec,status:ready?'ENTRY CONFIRMED':'WAIT',side:side||null,zone:zone?[zone.low,zone.high]:null,inZone:!!exec.inZone},entry,stopLoss,takeProfit,source:'MT5_AUTHORITATIVE_V4'};}`);

  // Canonical route first; legacy routes remain fallbacks only.
  s=s.replace(/for\(const path of \['\/api\/pre-market\/xauusd','\/api\/pre-market\/candle-open','\/api\/pre-market\/intelligence'\]\)/,"for(const path of ['/api/pre-market/mt5-authoritative','/api/pre-market/xauusd','/api/pre-market/candle-open','/api/pre-market/intelligence'])");

  // Always prefer the authoritative V4 payload over a legacy route with more bars.
  s=s.replace(/function scoreCandidate\(d,tf\)\{return\(d\?\.success===true\?100000000:0\)\+Object\.values\(tf\)\.reduce\(\(s,x\)=>s\+x\.count,0\)\*10\+\(d\?\.complete===true\?1000:0\);\}/,"function scoreCandidate(d,tf){const canonical=d?.processing?.source==='MT5_AUTHORITATIVE_V4'||d?.workflow?.source==='MT5_AUTHORITATIVE_V4'||d?.source==='MT5 brokerFeed';return(canonical?1000000000:0)+(d?.success===true?100000000:0)+Object.values(tf).reduce((s,x)=>s+x.count,0)*10+(d?.complete===true?1000:0);}");

  if(!s.includes(MARK))s+='\n/* '+MARK+' */\n';
  if(s!==before){fs.writeFileSync(BRIDGE,s,'utf8');console.log('[V-TRADE TELEGRAM BRIDGE FIX] canonical MT5 authority adapter V5 installed');}
}

function apply(){
  if(!process.env.VTRADE_CORE_URL){const base=String(process.env.RENDER_EXTERNAL_URL||process.env.APP_BASE_URL||'').replace(/\/$/,'');if(base)process.env.VTRADE_CORE_URL=base;}
  repairServer();
  try{patchBridge();}catch(e){console.error('[V-TRADE TELEGRAM BRIDGE FIX] bridge patch failed:',e.stack||e.message||e);}
}
try{apply();}catch(e){console.error('[V-TRADE TELEGRAM BRIDGE FIX] failed:',e.stack||e.message||e);}
module.exports={MARK};
