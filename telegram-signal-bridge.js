/* V-TRADE AI — Telegram Market Bridge V5
 * READ-ONLY MT5 MARKET DATA ONLY.
 * Telegram consumes the same canonical Pre-Market V8 route as CORE.
 * Never access server.js module-local MT5 helpers from this child module.
 */
'use strict';
const MARKER='VTRADE_TELEGRAM_MARKET_BRIDGE_V5';
const API_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
function install(app){
  if(!app||app.__VTRADE_TELEGRAM_MARKET_BRIDGE_V5__)return;
  app.__VTRADE_TELEGRAM_MARKET_BRIDGE_V5__=true;
  app.get('/api/telegram/market-snapshot',async(req,res)=>{
    res.set('Cache-Control','no-store, no-cache, must-revalidate');
    if(API_KEY&&String(req.get('X-VTRADE-TELEGRAM-KEY')||'')!==API_KEY)return res.status(401).json({success:false,error:'Telegram market bridge unauthorized'});
    try{
      const port=Number(process.env.PORT||10000);
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      let upstream;
      try{upstream=await fetch(`http://127.0.0.1:${port}/api/pre-market/xauusd`,{headers:{'Cache-Control':'no-cache'},signal:controller.signal});}
      finally{clearTimeout(timer);}
      const data=await upstream.json().catch(()=>({success:false,error:'invalid-pre-market-json'}));
      if(!upstream.ok||data?.success===false)return res.status(503).json({success:false,error:data?.error||`Canonical Pre-Market unavailable (HTTP ${upstream.status})`,source:'BROKER_NATIVE_MT5',state:'WAIT'});
      const n=v=>Number.isFinite(Number(v))?Number(v):null;
      const rawPrice=n(data?.livePrice??data?.price);
      const price=rawPrice!=null&&rawPrice>0?rawPrice:null;
      const timeframes={};
      for(const tf of ['M5','M15','H1','H4']){
        const src=data?.timeframes?.[tf]||{};
        const bars=Array.isArray(src?.candles)?src.candles:Array.isArray(src?.bars)?src.bars:[];
        timeframes[tf]={bars,count:bars.length,ready:src?.ready===true||bars.length>=30};
      }
      const allReady=['M5','M15','H1','H4'].every(tf=>timeframes[tf].ready);
      const age=n(data?.quoteAgeSec??data?.ageSec);
      const connected=price!=null&&allReady;
      const quoteFresh=age==null?connected:(age>=0&&age<=60000&&connected);
      return res.json({success:true,source:'BROKER_NATIVE_MT5',contract:MARKER,symbol:'XAUUSD',price,bid:n(data?.bid),ask:n(data?.ask),spread:n(data?.spread),connected:quoteFresh,quoteFresh,quoteAgeSec:age,state:quoteFresh?'READY':'WAIT',timeframes,generatedAt:new Date().toISOString(),telegramRole:'INDEPENDENT_AI_SCAN',preMarketLoaded:true,preMarketAuthority:true,executionLoaded:false,canonicalRoute:'/api/pre-market/xauusd'});
    }catch(e){
      const message=String(e?.name==='AbortError'?'Canonical Pre-Market timeout':e?.message||e);
      console.error('[V-TRADE TELEGRAM BRIDGE] snapshot failed:',message);
      return res.status(503).json({success:false,error:message,source:'BROKER_NATIVE_MT5',state:'WAIT'});
    }
  });
  console.log('[V-TRADE TELEGRAM BRIDGE] V5 ACTIVE | canonical Pre-Market V8 handoff | no module-local helper access');
}
module.exports={MARKER,install};