'use strict';
// Adds the full CORE-authoritative analysis payload to the Telegram bridge.
// Telegram V6 consumes this payload; it does not recalculate ICT/CRT or fabricate candles.
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'telegram-signal-bridge.js');
const MARK='VTRADE_TELEGRAM_AUTHORITY_CONTRACT_V2';
if(fs.existsSync(FILE)){
  let s=fs.readFileSync(FILE,'utf8');
  if(!s.includes(MARK)){
    const needle="telegramRole:'INDEPENDENT_AI_SCAN',preMarketLoaded:true,preMarketAuthority:true";
    const replacement=`/* ${MARK} */ telegramRole:'CANONICAL_PREMARKET_CONSUMER',preMarketLoaded:true,preMarketAuthority:true,authority:data,authoritySource:'CORE_PREMARKET_XAUUSD',authorityContract:'V1'`;
    if(s.includes(needle)){
      s=s.replace(needle,replacement);
    }else{
      const fallback="telegramRole:'INDEPENDENT_AI_SCAN'";
      if(!s.includes(fallback))throw new Error('Telegram bridge authority anchor not found');
      s=s.replace(fallback,`/* ${MARK} */ telegramRole:'CANONICAL_PREMARKET_CONSUMER',authority:data,authoritySource:'CORE_PREMARKET_XAUUSD',authorityContract:'V1'`);
    }
    fs.writeFileSync(FILE,s,'utf8');
    console.log('[V-TRADE TELEGRAM AUTHORITY] V2 contract installed | full CORE analysis payload forwarded');
  }
}
module.exports={MARK};
