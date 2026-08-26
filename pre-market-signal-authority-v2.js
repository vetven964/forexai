/* V-TRADE PRE-MARKET SIGNAL AUTHORITY V2
 * One server-side source for MTF direction + ICT setup + Entry/SL/TP.
 * Signal-only: never places orders and never sends Telegram.
 * Uses broker-native closed candles and live quote.
 */
'use strict';
const MARKER='VTRADE_PREMARKET_SIGNAL_AUTHORITY_V2';
const BLOCKS=['VTRADE_PREMARKET_DIRECT_ROUTE_HOTFIX_V8','VTRADE_PREMARKET_AUTHORITY_ROUTE_V4','VTRADE_PREMARKET_STRUCTURE_V2'];
function stripBlocks(source){
  for(const marker of BLOCKS){
    let p=source.indexOf('/* '+marker+' */');
    while(p>=0){
      const end=source.indexOf('})(app);',p);
      if(end<0)break;
      source=source.slice(0,p)+source.slice(end+'})(app);'.length);
      p=source.indexOf('/* '+marker+' */');
    }
  }
  return source;
}
function inject(source){
  if(!source||source.includes(MARKER))return source;
  const anchor='const app = express();';
  if(!source.includes(anchor))throw new Error('server app marker not found');
  source=stripBlocks(source);
  const code=String.raw`
/* ${MARKER} */
(function installPreMarketSignalAuthorityV2(app){
 if(!app||app.__VTRADE_PREMARKET_SIGNAL_AUTHORITY_V2__)return;
 app.__VTRADE_PREMARKET_SIGNAL_AUTHORITY_V2__=true;
 const TFS=['D1','H4','H1','M15','M5'],CORE=['M5','M15','H1','H4'];
 const W={M5:1,M15:2,H1:3,H4:4,D1:5},MIN=30;
 const n=v=>Number.isFinite(Number(v))?Number(v):null;
 const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
 const arr=x=>Array.isArray(x)?x:Array.isArray(x?.candles)?x.candles:Array.isArray(x?.bars)?x.bars:Array.isArray(x?.history)?x.history:[];
 const clean=a=>arr(a).map(x=>({t:n(x?.t??x?.time??x?.timestamp??x?.timeMs),o:n(x?.o??x?.open),h:n(x?.h??x?.high),l:n(x?.l??x?.low),c:n(x?.c??x?.close)})).filter(x=>[x.o,x.h,x.l,x.c].every(Number.isFinite)).sort((a,b)=>(a.t??0)-(b.t??0));
 const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 function atr(c,p=14){if(c.length<p+1)return null;const tr=[];for(let i=1;i<c.length;i++)tr.push(Math.max(c[i].h-c[i].l,Math.abs(c[i].h-c[i-1].c),Math.abs(c[i].l-c[i-1].c)));return avg(tr.slice(-p));}
 function feed(tf){let f=[];try{f=clean(typeof brokerFeed!=='undefined'?brokerFeed?.timeframes?.[tf]:null)}catch(_){}if(f.length>=MIN)return f;try{if(typeof parseBrokerCandles==='function'){const p=clean(parseBrokerCandles(tf));if(p.length>=MIN)return p}}catch(_){}return f}
 function live(){try{if(typeof brokerLivePrice==='function'){const q=brokerLivePrice();if(q&&n(q.price)!=null)return q}}catch(_){}return null}
 function candle(c){if(c.length<2)return{ready:false};const x=c[c.length-1],p=c[c.length-2],r=Math.max(x.h-x.l,1e-9),b=Math.abs(x.c-x.o),up=x.h-Math.max(x.o,x.c),lo=Math.min(x.o,x.c)-x.l,pos=(x.c-x.l)/r;return{ready:true,open:x.o,high:x.h,low:x.l,close:x.c,bodyPct:b/r*100,upperWickPct:up/r*100,lowerWickPct:lo/r*100,closePosition:pos*100,hammer:lo>=b*2&&up<=Math.max(b*.8,r*.15)&&pos>.55,shootingStar:up>=b*2&&lo<=Math.max(b*.8,r*.15)&&pos<.45,bullishEngulfing:x.c>x.o&&p.c<p.o&&x.o<=p.c&&x.c>=p.o,bearishEngulfing:x.c<x.o&&p.c>p.o&&x.o>=p.c&&x.c<=p.o,candleTime:x.t}
 }
 function liquidity(c){if(c.length<7)return{status:'WAIT',side:'NONE'};const x=c[c.length-1],p=c.slice(-7,-1),hi=Math.max(...p.map(z=>z.h)),lo=Math.min(...p.map(z=>z.l)),sell=x.l<lo&&x.c>lo,buy=x.h>hi&&x.c<hi;return{status:sell||buy?'PASS':'WAIT',side:sell?'SELL_SIDE_SWEPT':buy?'BUY_SIDE_SWEPT':'NONE',referenceHigh:hi,referenceLow:lo}}
 function structure(c){if(c.length<17)return{mss:'WAIT',bos:'WAIT'};const x=c[c.length-1],a=c.slice(-9,-1),b=c.slice(-17,-9),hi=Math.max(...a.map(z=>z.h)),lo=Math.min(...a.map(z=>z.l)),hi2=Math.max(...b.map(z=>z.h)),lo2=Math.min(...b.map(z=>z.l));return{mss:x.c>hi2?'BULLISH':x.c<lo2?'BEARISH':'WAIT',bos:x.c>hi?'BULLISH':x.c<lo?'BEARISH':'WAIT',rangeHigh:hi,rangeLow:lo}}
 function fvg(c){const out=[];for(let i=2;i<c.length;i++){const a=c[i-2],x=c[i];if(a.h<x.l)out.push({type:'BULLISH',low:a.h,high:x.l,index:i,time:x.t});if(a.l>x.h)out.push({type:'BEARISH',low:x.h,high:a.l,index:i,time:x.t})}return out.reverse().map(z=>{const later=c.slice(z.index+1),filled=z.type==='BULLISH'?later.some(x=>x.l<=z.low):later.some(x=>x.h>=z.high);return{...z,filled}}).filter(z=>!z.filled).slice(0,8)}
 function ob(c,want){const out=[];for(let i=c.length-2;i>=Math.max(0,c.length-14);i--){const z=c[i];if(want==='BULLISH'&&z.c<z.o){out.push({type:'BULLISH',low:z.l,high:z.o,index:i,time:z.t});break}if(want==='BEARISH'&&z.c>z.o){out.push({type:'BEARISH',low:z.o,high:z.h,index:i,time:z.t});break}}return out}
 function row(c,tf,price){if(c.length<MIN)return{tf,ready:false,bars:c.length};const x=c[c.length-1],cs=candle(c),liq=liquidity(c),st=structure(c),g=fvg(c),a=atr(c);let buy=50,sell=50;if(x.c>x.o)buy+=10;else if(x.c<x.o)sell+=10;if(st.mss==='BULLISH')buy+=9;if(st.mss==='BEARISH')sell+=9;if(st.bos==='BULLISH')buy+=10;if(st.bos==='BEARISH')sell+=10;if(liq.side==='SELL_SIDE_SWEPT')buy+=8;if(liq.side==='BUY_SIDE_SWEPT')sell+=8;if(cs.hammer||cs.bullishEngulfing)buy+=5;if(cs.shootingStar||cs.bearishEngulfing)sell+=5;const t=Math.max(1,buy+sell),bp=clamp(buy/t*100);return{tf,ready:true,bars:c.length,open:x.o,high:x.h,low:x.l,close:x.c,currentPrice:price,buyPct:Math.round(bp),sellPct:Math.round(100-bp),bias:bp>50?'BULLISH':bp<50?'BEARISH':'NEUTRAL',atr:a,candle:cs,liquidity:liq,structure:st,fvg:g}}
 function nearestZone(rows,side,price){const want=side==='BUY'?'BULLISH':'BEARISH',c=[];for(const tf of ['M5','M15','H1','H4']){const r=rows[tf];for(const z of r?.fvg||[])if(z.type===want)c.push({...z,source:'FVG',tf});for(const z of ob(r?.candles||[],want))c.push({...z,source:'ORDER_BLOCK',tf})}
  const valid=c.filter(z=>Number.isFinite(z.low)&&Number.isFinite(z.high)&& (side==='BUY'?z.high<=price+Math.max(1,(rows.M5?.atr||rows.M15?.atr||5)*.35):z.low>=price-Math.max(1,(rows.M5?.atr||rows.M15?.atr||5)*.35)));
  if(valid.length){valid.sort((a,b)=>Math.abs(price-(a.low+a.high)/2)-Math.abs(price-(b.low+b.high)/2));const z=valid[0];return{low:Math.min(z.low,z.high),high:Math.max(z.low,z.high),source:z.source,timeframe:z.tf,inZone:price>=Math.min(z.low,z.high)&&price<=Math.max(z.low,z.high)}}
  const r=rows.M15?.ready?rows.M15:rows.M5;if(!r?.ready)return null;const a=r.atr||Math.abs(r.high-r.low)||5;const base=side==='BUY'?[Math.min(r.open,r.close),Math.max(r.open,r.close)]:[Math.min(r.open,r.close),Math.max(r.open,r.close)];const center=(base[0]+base[1])/2;return{low:side==='BUY'?Math.max(r.low,center-a*.25):Math.max(r.low,center-a*.15),high:side==='BUY'?Math.min(r.high,center+a*.15):Math.min(r.high,center+a*.25),source:'RETRACE_CANDLE_BASE',timeframe:r.tf,inZone:price>=r.low&&price<=r.high}}
 function analyze(){const q=live(),price=q?.price??null,rows={};let wb=0,wt=0;for(const tf of TFS){rows[tf]=row(feed(tf),tf,price);if(rows[tf].ready){wb+=rows[tf].buyPct*W[tf];wt+=100*W[tf]}}
  const ready=CORE.filter(tf=>rows[tf].ready).length,buy=wt?wb/wt*100:50,sell=100-buy,bias=buy>sell?'BULLISH':sell>buy?'BEARISH':'NEUTRAL',side=bias==='BULLISH'?'BUY':bias==='BEARISH'?'SELL':null,edge=Math.abs(buy-sell),aligned=CORE.filter(tf=>rows[tf].bias===bias).length,m5=rows.M5,m15=rows.M15,h1=rows.H1,h4=rows.H4,liq=CORE.some(tf=>rows[tf].liquidity?.side===(side==='BUY'?'SELL_SIDE_SWEPT':'BUY_SIDE_SWEPT')),mss=CORE.some(tf=>rows[tf].structure?.mss===bias),bos=CORE.some(tf=>rows[tf].structure?.bos===bias),fvg=CORE.some(tf=>(rows[tf].fvg||[]).some(z=>z.type===bias)),ob=CORE.some(tf=>ob(rows[tf]?.candles||[],bias).length>0),pressure=(side==='BUY'?(m5?.buyPct||0):(m5?.sellPct||0))>=55,confirmations=aligned+(liq?1:0)+(mss?1:0)+(bos?1:0)+(fvg?1:0)+(ob?1:0)+(pressure?1:0),zone=side?nearestZone(rows,side,price):null,atrM=m5?.atr||m15?.atr||h1?.atr||5,spread=n(q?.spread),maxSpread=Math.max(.01,n(process.env.VTRADE_PREMARKET_MAX_SPREAD)??.80),spreadOk=spread==null||spread<=maxSpread;
  const score=Math.round(Math.min(100,50+edge*.75+aligned*5+(liq?5:0)+(mss?5:0)+(bos?5:0)+(fvg?4:0)+(ob?4:0)+(pressure?3:0)));const quality=ready===4&&side&&aligned>=2&&edge>=5&&confirmations>=5&&zone&&spreadOk;const risk=Math.max(atrM*.45,Math.abs((zone?.high??price)-(zone?.low??price)),2.5);const entry=zone?Math.min(Math.max(price??zone.low,zone.low),zone.high):price;const sl=side==='BUY'?Math.min(zone?.low??entry,entry-risk):Math.max(zone?.high??entry,entry+risk);const R=Math.abs(entry-sl);const expected=Math.max(R*1.5,atrM*.8);const count=expected<=20?1:expected<=50?2:3;const tp=[];for(let i=1;i<=count;i++){const mult=count===1?1.5:i===1?1.5:i===2?2.5:3.5;tp.push(side==='BUY'?entry+R*mult:entry-R*mult)}
  const reason=!ready?'MT5 M5/M15/H1/H4 history not ready':!side?'No directional bias':aligned<2?'MTF alignment below 2 timeframes':edge<5?'Direction edge too small':!zone?'No valid structure/retrace zone':confirmations<5?'Waiting for additional ICT confirmations':!spreadOk?'Spread gate blocked':'READY';
  return{success:true,symbol:'XAUUSD',source:'MT5_PREMARKET_SIGNAL_AUTHORITY_V2',price,livePrice:price,bid:n(q?.bid),ask:n(q?.ask),spread,available:ready,required:4,optionalD1:!!rows.D1.ready,timeframes:rows,frames:rows,buyStrengthPct:Math.round(buy),sellStrengthPct:Math.round(sell),bias,directionScore:Math.round(Math.max(buy,sell)),edge:Math.round(edge),confidence:Math.round(Math.min(95,45+aligned*8+edge*.35)),signal:quality?'BUY/SELL':'WAIT',signalSide:quality?side:null,signalEligible:!!quality,setupQuality:quality?'QUALIFIED':'WATCH',score,alignedTimeframes:aligned,confirmations,checks:{liquiditySweep:liq,mss,bos,fvg,orderBlock:ob,pressure,spreadOk},zone:zone?{entryZone:[zone.low,zone.high],source:zone.source,timeframe:zone.timeframe,inZone:zone.inZone,authorization:false}:null,execution:{status:quality?'ENTRY_READY':'WAIT',reason,side:quality?side:null,entry:quality?entry:null,entryZone:zone?[zone.low,zone.high]:null,sl:quality?sl:null,tp:quality?tp:[],expectedMove:quality?expected:null,authorization:false,orderAuthorization:false,signalOnly:true},tpPolicy:{expectedMove:expected,count,rule:'<=20:TP1 | 20-50:TP1/TP2 | >50:TP1/TP2/TP3'},processing:{stage:quality?'SIGNAL_READY':'SETUP_BUILDING',source:'MT5_PREMARKET_SIGNAL_AUTHORITY_V2',orderAuthorization:false,aiRole:'CONFIRMATION_ONLY',telegramIndependent:true,sequence:['D1','H4','H1','M15','M5','MTF_DIRECTION','HISTORY_CONTEXT','LIQUIDITY','MSS_BOS','FVG_OB','RETRACE_ZONE','ENTRY','SL','TP_LADDER','AI_CONFIRMATION','TELEGRAM_SIGNAL']},workflow:{entryAuthorization:false,orderAuthorization:false,signalEligible:!!quality,telegramIndependent:true},generatedAt:new Date().toISOString()};}
 function handler(req,res){res.set('Cache-Control','no-store');res.set('X-V-TRADE-Processing','MT5_PREMARKET_SIGNAL_AUTHORITY_V2');try{return res.json(analyze())}catch(e){console.error('[V-TRADE PRE-MARKET V2] ERROR',e?.stack||e);return res.status(502).json({success:false,error:String(e?.message||e)})}}
 for(const p of ['/api/pre-market/intelligence','/api/pre-market/candle-open','/api/pre-market/xauusd','/api/pre-market/mt5-authoritative']){app.get(p,handler);app.options(p,(req,res)=>res.status(204).end())}
 console.log('[V-TRADE PRE-MARKET SIGNAL V2] MTF history + ICT setup + dynamic Entry/SL/TP authority ACTIVE');
})(app);
`;
 return source.replace(anchor,anchor+'\n'+code);
}
module.exports={inject,MARKER};
