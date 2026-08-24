/* V-TRADE AI — Telegram Market Bridge V4
 * READ-ONLY MT5 MARKET DATA ONLY.
 * Uses the same broker-native helpers as the CORE analysis path so Telegram
 * cannot see a disconnected/null snapshot while the real MT5 feed is READY.
 */
'use strict';

const MARKER='VTRADE_TELEGRAM_MARKET_BRIDGE_V4';
const API_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();

function install(app){
  if(!app||app.__VTRADE_TELEGRAM_MARKET_BRIDGE_V4__)return;
  app.__VTRADE_TELEGRAM_MARKET_BRIDGE_V4__=true;

  app.get('/api/telegram/market-snapshot',async(req,res)=>{
    res.set('Cache-Control','no-store, no-cache, must-revalidate');
    if(API_KEY&&String(req.get('X-VTRADE-TELEGRAM-KEY')||'')!==API_KEY){
      return res.status(401).json({success:false,error:'Telegram market bridge unauthorized'});
    }
    try{
      const n=v=>Number.isFinite(Number(v))?Number(v):null;
      const validPrice=v=>{const x=n(v);return x!=null&&x>0?x:null;};
      const barsFor=tf=>{
        try{
          const raw=typeof parseBrokerCandles==='function'?parseBrokerCandles(tf):[];
          const minutes=tf==='M5'?5:tf==='M15'?15:tf==='H1'?60:240;
          const closed=typeof closedCandles==='function'?closedCandles(raw,minutes):raw;
          return (Array.isArray(closed)?closed:[]).map(x=>({
            t:n(x?.t??x?.time??x?.timestamp??x?.timeMs),
            o:n(x?.o??x?.open),h:n(x?.h??x?.high),l:n(x?.l??x?.low),
            c:n(x?.c??x?.close),v:n(x?.v??x?.volume??x?.tickVolume)??0
          })).filter(x=>[x.o,x.h,x.l,x.c].every(Number.isFinite)).slice(-120);
        }catch(_){return [];}
      };

      const q=typeof brokerLivePrice==='function'?brokerLivePrice():null;
      const price=validPrice(q?.price??q?.last??q?.close??q?.bid&&q?.ask?((Number(q.bid)+Number(q.ask))/2):null);
      const timeframes={};
      for(const tf of ['M5','M15','H1','H4']){
        const bars=barsFor(tf);
        timeframes[tf]={bars,count:bars.length,ready:bars.length>=30};
      }
      const feedFresh=typeof brokerFeedFresh==='function'?brokerFeedFresh()===true:false;
      const bid=validPrice(q?.bid),ask=validPrice(q?.ask);
      const spread=bid!=null&&ask!=null?Math.max(0,ask-bid):null;
      const allReady=['M5','M15','H1','H4'].every(tf=>timeframes[tf].ready);
      const connected=feedFresh&&price!=null&&allReady;
      const age=n(q?.quoteAgeSec??q?.ageSec);
      return res.json({
        success:true,source:'BROKER_NATIVE_MT5',contract:MARKER,symbol:'XAUUSD',
        price,bid,ask,spread,connected,quoteFresh:feedFresh,quoteAgeSec:age,
        state:connected?'READY':'WAIT',timeframes,generatedAt:new Date().toISOString(),
        telegramRole:'INDEPENDENT_AI_SCAN',preMarketLoaded:false,preMarketAuthority:false,executionLoaded:false
      });
    }catch(e){
      return res.status(502).json({success:false,error:String(e?.message||e),source:'BROKER_NATIVE_MT5'});
    }
  });

  console.log('[V-TRADE TELEGRAM BRIDGE] V4 ACTIVE | shared CORE MT5 helpers | synchronized snapshot');
}

module.exports={MARKER,install};