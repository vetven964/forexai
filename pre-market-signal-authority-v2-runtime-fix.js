/* V-TRADE PRE-MARKET SIGNAL AUTHORITY V2 runtime safety fix */
'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'server.js');
const AUTHORITY=path.join(__dirname,'pre-market-signal-authority-v2.js');
const TELEGRAM=path.join(__dirname,'telegram-bot-ai-service-v6.js');
const MARK='VTRADE_PREMARKET_SIGNAL_AUTHORITY_V2_RUNTIME_FIX_V3';

function sanitizeServer(source){
  let s=String(source||'');
  s=s.replace(/\\n?try\s*\{\s*require\(['"]\.\/telegram-signal-bridge\.js['"]\)\.install\(app\)[\s\S]*?VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');
  s=s.replace(/\\n?\/\*\s*VTRADE_TELEGRAM_MARKET_BRIDGE_RUNTIME_FIX_V1 SERVER\s*\*\//g,'');
  s=s.replace(/function ob\(c,want\)/g,'function findOb(c,want)');
  s=s.replace(/\bob\(rows\[tf\]\?\.candles\|\|\[\],bias\)/g,'findOb(rows[tf]?.candles||[],bias)');
  s=s.replace(/,ob=CORE\.some\(tf=>findOb\(/g,',hasOb=CORE.some(tf=>findOb(');
  s=s.replace(/,ob=CORE\.some\(tf=>ob\(/g,',hasOb=CORE.some(tf=>findOb(');
  s=s.replace(/\+\(ob\?1:0\)/g,'+(hasOb?1:0)');
  s=s.replace(/orderBlock:ob/g,'orderBlock:hasOb');
  s=s.replace(/return\{tf,ready:true,bars:c\.length,/g,'return{tf,ready:true,bars:c.length,candles:c,');
  return s;
}

function patchTelegramConsumer(){
  if(!fs.existsSync(TELEGRAM)) return;
  let s=fs.readFileSync(TELEGRAM,'utf8');
  const marker='VTRADE_TELEGRAM_CANONICAL_AUTHORITY_CONSUMER_V3';
  if(!s.includes(marker)){
    const old="async function snapshot(){const d=await request('/api/telegram/market-snapshot');if(d.success!==true)throw new Error(d.error||'Telegram market snapshot unavailable');return d;}";
    const replacement="async function snapshot(){const primary=await request('/api/pre-market/mt5-authoritative').catch(()=>null);if(primary&&primary.success!==false){return {success:true,authority:primary,price:primary.price??primary.livePrice,state:'READY',quoteConnected:true,preMarketLoaded:true,mtfCounts:{M5:primary.timeframes?.M5?.bars||0,M15:primary.timeframes?.M15?.bars||0,H1:primary.timeframes?.H1?.bars||0,H4:primary.timeframes?.H4?.bars||0},canonicalAuthority:true};}const d=await request('/api/telegram/market-snapshot');if(d.success!==true)throw new Error(d.error||'Telegram market snapshot unavailable');return d;}";
    if(s.includes(old)) s=s.replace(old,replacement);
    const oldNormalize="const canonicalPassed=a?.decision?.passed===true||a?.confirmations?.allGatesPassed===true||a?.gates?.allGatesPassed===true;";
    const newNormalize="const canonicalPassed=a?.decision?.passed===true||a?.signalEligible===true||a?.execution?.status==='ENTRY_READY'||a?.confirmations?.allGatesPassed===true||a?.gates?.allGatesPassed===true;";
    if(s.includes(oldNormalize)) s=s.replace(oldNormalize,newNormalize);
    const oldGates="const gates={mtf:c.mtfAligned===true||c.mtfCount>=2,sweep:c.liquiditySweep===true,mss:c.mss===true,bos:c.bos===true,displacement:c.displacement?.confirmed===true||c.displacement===true,fvg:c.freshFvg===true||c.fvg===true,ob:c.freshOb===true||c.orderBlock===true,pd:c.premiumDiscountOk===true,momentum:c.technicalMomentumOk===true,trend:c.trendStrengthOk===true,spread:c.spreadOk===true,realCandle};";
    const newGates="const srcG=a?.checks||c;const gates={mtf:c.mtfAligned===true||c.mtfCount>=2||Number(a?.available)>=2,sweep:srcG.liquiditySweep===true||srcG.sweep===true,mss:srcG.mss===true,bos:srcG.bos===true,displacement:srcG.displacement?.confirmed===true||srcG.displacement===true,fvg:srcG.fvg===true||srcG.freshFvg===true,ob:srcG.orderBlock===true||srcG.ob===true||c.freshOb===true||c.orderBlock===true,pd:srcG.premiumDiscount===true||srcG.premiumDiscountOk===true||c.premiumDiscountOk===true,momentum:srcG.momentum===true||srcG.technicalMomentumOk===true||c.technicalMomentumOk===true,trend:srcG.trend===true||c.trendStrengthOk===true,spread:srcG.spreadOk===true||c.spreadOk===true,realCandle};";
    if(s.includes(oldGates)) s=s.replace(oldGates,newGates);
    const oldLevels="const hasTradeLevels=n(a?.entry)!=null&&n(a?.stopLoss)!=null&&tp.length>=3;";
    const newLevels="const ex=a?.execution||{};const entryValue=a?.entry??ex.entry;const slValue=a?.stopLoss??ex.sl;const tpValue=tp.length?tp:(Array.isArray(ex.tp)?ex.tp:[]);const hasTradeLevels=n(entryValue)!=null&&n(slValue)!=null&&tpValue.length>=3;";
    if(s.includes(oldLevels)) s=s.replace(oldLevels,newLevels);
    const oldAuth="const authorized=signal!=='WAIT'&&canonicalPassed&&brokerFresh&&realCandle&&hasTradeLevels&&candleGuard&&rsSpGuard;";
    const newAuth="const authorized=signal!=='WAIT'&&canonicalPassed&&brokerFresh&&realCandle&&hasTradeLevels&&candleGuard&&rsSpGuard;";
    if(s.includes(oldAuth)) s=s.replace(oldAuth,newAuth);
    s += '\n// '+marker+'\n';
    fs.writeFileSync(TELEGRAM,s,'utf8');
    console.log('[V-TRADE PRE-MARKET SIGNAL V2] Telegram consumer now prefers canonical MT5 authority V2');
  }
}

if(!fs.__vtradeRuntimeWriteGuard){
  const originalWriteFileSync=fs.writeFileSync.bind(fs);
  fs.writeFileSync=function(file,data,options){
    try{
      if(path.resolve(String(file))===FILE && typeof data==='string') data=sanitizeServer(data);
    }catch(e){console.error('[V-TRADE PRE-MARKET SIGNAL V2] write guard failed:',e.message);}
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
  patchTelegramConsumer();
  console.log('[V-TRADE PRE-MARKET SIGNAL V2] runtime safety/write-guard + canonical Telegram consumer fix active');
}catch(e){console.error('[V-TRADE PRE-MARKET SIGNAL V2] runtime safety fix failed:',e.stack||e.message||e);}
module.exports={MARK};
