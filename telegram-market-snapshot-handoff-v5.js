/* V-TRADE AI — Telegram Market Snapshot Handoff V5
 * Uses the canonical in-process Pre-Market V8 route.
 * This avoids accessing server.js module-local MT5 helpers from a child module.
 */
'use strict';
const MARKER='VTRADE_TELEGRAM_MARKET_HANDOFF_V5';
const API_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();

function install(app){
  if(!app||app.__VTRADE_TELEGRAM_MARKET_HANDOFF_V5__)return;
  app.__VTRADE_TELEGRAM_MARKET_HANDOFF_V5__=true;
  app.get('/api/telegram/market-snapshot-v5',async(req,res)=>{
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
      const price=n(data?.livePrice??data?.price);
      const validPrice=price!=null&&price>0?price:null;
      const timeframes={};
      for(const tf of ['M5','M15','H1','H4']){const src=data?.timeframes?.[tf]||{};const bars=Array.isArray(src?.candles)?src.candles:Array.isArray(src?.bars)?src.bars:[];timeframes[tf]={bars,count:bars.length,ready:src?.ready===true||bars.length>=30};}
      const allReady=['M5','M15','H1','H4'].every(tf=>timeframes[tf].ready);
      const age=n(data?.quoteAgeSec??data?.ageSec);
      const connected=validPrice!=null&&allReady;
      const quoteFresh=age==null?connected:(age>=0&&age<=60000&&connected);
      return res.json({success:true,source:'BROKER_NATIVE_MT5',contract:MARKER,symbol:'XAUUSD',price:validPrice,bid:n(data?.bid),ask:n(data?.ask),spread:n(data?.spread),connected:quoteFresh,quoteFresh,quoteAgeSec:age,state:quoteFresh?'READY':'WAIT',timeframes,generatedAt:new Date().toISOString(),telegramRole:'INDEPENDENT_AI_SCAN',preMarketLoaded:true,preMarketAuthority:true,executionLoaded:false,canonicalRoute:'/api/pre-market/xauusd'});
    }catch(e){return res.status(503).json({success:false,error:String(e?.name==='AbortError'?'Canonical Pre-Market timeout':e?.message||e),source:'BROKER_NATIVE_MT5',state:'WAIT'});}
  });
  console.log('[V-TRADE TELEGRAM HANDOFF] V5 ACTIVE | canonical Pre-Market V8 handoff');
}
module.exports={MARKER,install};