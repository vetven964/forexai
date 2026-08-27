'use strict';
const {filterValidBars}=require('./vzone-candle-integrity');
const TF_MS={M5:300000,M15:900000,H1:3600000,H4:14400000};
const REQUIRED=['M5','M15','H1','H4'];
const num=v=>Number.isFinite(Number(v))?Number(v):null;
function bars(snapshot,tf){
  const src=snapshot?.timeframes?.[tf];
  const raw=Array.isArray(src?.bars)?src.bars:Array.isArray(src?.candles)?src.candles:Array.isArray(src)?src:[];
  return filterValidBars(raw,Date.now(),TF_MS[tf]||0)
    .map(x=>({...x,o:num(x.o??x.open),h:num(x.h??x.high),l:num(x.l??x.low),c:num(x.c??x.close),t:x.t??x.time??x.timestamp??x.openTime??x.candleTime}))
    .filter(x=>[x.o,x.h,x.l,x.c,x.t].every(v=>v!==null));
}
function candleGuard(snapshot){
  const frames={};
  for(const tf of REQUIRED){
    const src=snapshot?.timeframes?.[tf];
    const raw=Array.isArray(src?.bars)?src.bars:Array.isArray(src?.candles)?src.candles:Array.isArray(src)?src:[];
    const valid=bars(snapshot,tf);
    const source=String(src?.source??src?.feedSource??snapshot?.source??'').toUpperCase();
    frames[tf]={raw:raw.length,valid:valid.length,ready:valid.length>=25,source};
  }
  const ready=REQUIRED.every(tf=>frames[tf].ready);
  return {ready,mode:'CLOSED_CANDLE_ONLY',fakeCandleRejected:true,activeCandleRejected:true,futureCandleRejected:true,frames,reason:ready?'All required timeframes have valid closed OHLC candles':'WAIT — missing/invalid/active candle data'};
}
const sma=(xs,n)=>xs.length<n?null:xs.slice(-n).reduce((a,b)=>a+b,0)/n;
const avgRange=xs=>xs.length?xs.reduce((s,b)=>s+Math.max(0,b.h-b.l),0)/xs.length:null;
function liquidity(raw){if(raw.length<12)return{bull:false,bear:false,low:null,high:null};const last=raw.at(-1),prior=raw.slice(-11,-1),low=Math.min(...prior.map(b=>b.l)),high=Math.max(...prior.map(b=>b.h));return{bull:last.l<low&&last.c>low,bear:last.h>high&&last.c<high,low,high};}
function mss(raw){if(raw.length<10)return{bull:false,bear:false};const last=raw.at(-1),p=raw.slice(-7,-1);return{bull:last.c>Math.max(...p.map(b=>b.h)),bear:last.c<Math.min(...p.map(b=>b.l))};}
function crt(raw){if(raw.length<6)return{bull:false,bear:false};const last=raw.at(-1),prev=raw.at(-2),range=last.h-last.l,prevRange=prev.h-prev.l;if(!(range>0&&prevRange>0))return{bull:false,bear:false};return{bull:last.c>last.o&&last.c>=last.l+range*.7&&range>=prevRange*1.15,bear:last.c<last.o&&last.c<=last.l+range*.3&&range>=prevRange*1.15};}
function fvg(raw){if(raw.length<3)return{bull:false,bear:false,low:null,high:null};const a=raw.at(-3),c=raw.at(-1);if(c.l>a.h)return{bull:true,bear:false,low:a.h,high:c.l};if(c.h<a.l)return{bull:false,bear:true,low:c.h,high:a.l};return{bull:false,bear:false,low:null,high:null};}
function ob(raw,side){if(raw.length<5)return{found:false,low:null,high:null};const d=raw.at(-2),last=raw.at(-1),bull=side==='BUY'&&d.c<d.o&&last.c>last.o,bear=side==='SELL'&&d.c>d.o&&last.c<last.o;return{found:bull||bear,low:d.l,high:d.h};}
function mtf(s){const out=[];for(const tf of REQUIRED){const r=bars(s,tf),cl=r.map(b=>b.c),last=cl.at(-1),m20=sma(cl,20),m5=sma(cl,5);if(last==null||m20==null||m5==null)continue;out.push({tf,bias:last>m20&&m5>m20?'BUY':last<m20&&m5<m20?'SELL':'NEUTRAL'});}return out;}
function scoreSnapshot(s){
  const guard=candleGuard(s),raw=bars(s,'M15'),price=num(s.price);
  if(raw.length<25||!guard.ready)return{symbol:'XAUUSD',price,side:'NEUTRAL',signal:'WAIT',score:0,scoreTier:0,bias:'Neutral',timeframe:'M15',realtime:s.connected===true,mtf:[],candleGuard:guard,gates:{CandleIntegrity:guard.ready,ClosedCandle:guard.ready,MT5Realtime:s.connected===true},gateCount:'0/3',authorized:false,entry:null,sl:null,tp:[],riskZones:{support:null,resistance:null},generatedAt:new Date().toISOString(),reason:guard.reason};
  const lq=liquidity(raw),ms=mss(raw),cr=crt(raw),gap=fvg(raw),rows=mtf(s),sideCounts={BUY:rows.filter(x=>x.bias==='BUY').length,SELL:rows.filter(x=>x.bias==='SELL').length},side=sideCounts.BUY>sideCounts.SELL?'BUY':sideCounts.SELL>sideCounts.BUY?'SELL':'NEUTRAL',closes=raw.map(b=>b.c),m5=sma(closes,5),m20=sma(closes,20),momentum=side==='BUY'?m5>m20:side==='SELL'?m5<m20:false,r20=raw.slice(-20),hi=Math.max(...r20.map(b=>b.h)),lo=Math.min(...r20.map(b=>b.l)),mid=(hi+lo)/2,pd=side==='BUY'?price!=null&&price<=mid:side==='SELL'?price!=null&&price>=mid:false,disp=(()=>{const last=raw.at(-1),ar=avgRange(raw.slice(-21,-1)),r=last.h-last.l;return{bull:last.c>last.o&&r>=ar*1.2,bear:last.c<last.o&&r>=ar*1.2};})(),obx=ob(raw,side);
  const gates={CandleIntegrity:guard.ready,ClosedCandle:guard.ready,ICT_Liquidity:side==='BUY'?lq.bull:side==='SELL'?lq.bear:false,ICT_MSS:side==='BUY'?ms.bull:side==='SELL'?ms.bear:false,ICT_FVG:side==='BUY'?gap.bull:side==='SELL'?gap.bear:false,ICT_OB:obx.found,CRT:side==='BUY'?cr.bull:side==='SELL'?cr.bear:false,Displacement:side==='BUY'?disp.bull:side==='SELL'?disp.bear:false,MTF:rows.length===4&&rows.filter(x=>x.bias===side).length>=3,PremiumDiscount:pd,Momentum:momentum,MT5Realtime:s.connected===true};
  const total=Object.keys(gates).length,passed=Object.values(gates).filter(Boolean).length;
  // Direction score is signed. +10 or higher = Bullish; -10 or lower = Bearish.
  // This is bias only. BUY/SELL execution still requires every gate to pass.
  const directionalPasses=side==='BUY'?[sideCounts.BUY>=2, lq.bull,ms.bull,gap.bull,obx.found,cr.bull,disp.bull,sideCounts.BUY===4,momentum,pd].filter(Boolean).length:side==='SELL'?[sideCounts.SELL>=2,lq.bear,ms.bear,gap.bear,obx.found,cr.bear,disp.bear,sideCounts.SELL===4,momentum,pd].filter(Boolean).length:0;
  const directionMax=10;
  const magnitude=Math.round((directionalPasses/directionMax)*100);
  const signedScore=side==='BUY'?magnitude:side==='SELL'?-magnitude:0;
  const bias=signedScore>=10?'Bullish':signedScore<=-10?'Bearish':'Neutral';
  const signal=bias==='Bullish'?'BUY_BIAS':bias==='Bearish'?'SELL_BIAS':'WAIT';
  const authorized=Math.abs(signedScore)>=75&&Object.values(gates).every(Boolean)&&raw.length>=25&&rows.length===4&&s.connected===true&&guard.ready;
  let entry=null,sl=null,tp=[],riskZones={support:lq.low,resistance:lq.high};
  if(authorized&&price!=null){entry=price;if(side==='BUY'){const base=Math.min(...raw.slice(-8).map(b=>b.l)),safe=Math.min(base,lq.low??base);riskZones={support:safe,resistance:lq.high};sl=safe-Math.max((price-safe)*.12,.15);const risk=price-sl;tp=[price+risk*1.5,price+risk*2.5,price+risk*3.5];}else{const base=Math.max(...raw.slice(-8).map(b=>b.h)),safe=Math.max(base,lq.high??base);riskZones={support:lq.low,resistance:safe};sl=safe+Math.max((safe-price)*.12,.15);const risk=sl-price;tp=[price-risk*1.5,price-risk*2.5,price-risk*3.5];}}
  const reason=authorized?'All V-Zone direction + ICT/CRT execution gates passed':`WAIT — ${passed}/${total} execution gates passed`;
  return{symbol:'XAUUSD',price,side,signal,score:signedScore,scoreTier:Math.abs(signedScore),bias,timeframe:'M15',realtime:s.connected===true,mtf:rows,candleGuard:guard,gates,gateCount:`${passed}/${total}`,directionalPasses,authorized,entry,sl,tp,riskZones,generatedAt:new Date().toISOString(),reason};
}
function formatTelegram(a){
  const action=a.authorized?(a.signal==='BUY_BIAS'?'🟢 BUY / BULLISH':'🔴 SELL / BEARISH'):(a.signal==='BUY_BIAS'?'🟢 BUY BIAS — WAIT':a.signal==='SELL_BIAS'?'🔴 SELL BIAS — WAIT':'🟡 WAIT'),f=v=>v==null?'WAIT':Number(v).toFixed(2),rz=a.riskZones||{};
  if(!a.authorized)return['🤖 *V-Zone AI*','',`📊 XAUUSD | ${a.timeframe} REALTIME`,`💰 Price: *${f(a.price)}*`,`⚡ Action: *${action}*`,`📈 Score: *${a.score>=0?'+':''}${a.score}/100* | Bias: *${a.bias}*`,`🧠 Direction: *${a.directionalPasses??0}/10*`,`🔐 Execution Gates: *${a.gateCount}*`,'',`🕯️ Candle Guard: *${a.candleGuard?.ready?'PASS — CLOSED REAL OHLC':'WAIT — FAKE/ACTIVE CANDLE REJECTED'}*`,'','⏳ *WAIT — NO ORDER*','🧠 Bias threshold: +10 Bullish / -10 Bearish.','🔒 BUY/SELL requires full execution authorization.',`🕒 ${a.generatedAt}`].join('\n');
  const protection=a.side==='BUY'?`🛡️ Support *${f(rz.support)}* → SL *${f(a.sl)}*`:`🛡️ Resistance *${f(rz.resistance)}* → SL *${f(a.sl)}*`;
  return['🤖 *V-Zone AI*','',`📊 XAUUSD | ${a.timeframe} REALTIME`,`💰 Price: *${f(a.price)}*`,`⚡ *${a.signal==='BUY_BIAS'?'🟢 BUY / BULLISH':'🔴 SELL / BEARISH'}*`,`📈 Score: *${a.score>=0?'+':''}${a.score}/100* | Bias: *${a.bias}*`,`🧠 Direction: *${a.directionalPasses}/10*`,`🔐 Execution Gates: *${a.gateCount}*`,'',`🎯 Entry: *${f(a.entry)}*`,`🛑 SL: *${f(a.sl)}*`,`🎯 TP1: *${f(a.tp[0])}*`,`🎯 TP2: *${f(a.tp[1])}*`,`🎯 TP3: *${f(a.tp[2])}*`,'',`🛡️ ${protection}`,'🕯️ Real Closed Candle: *PASS*','🚫 Fake Candle/Wick: *REJECTED*','🧠 ICT + CRT + MTF: *CONFIRMED*','🔐 *ENTRY READY*',`🕒 ${a.generatedAt}`].join('\n');
}
module.exports={bars,candleGuard,scoreSnapshot,formatTelegram};
