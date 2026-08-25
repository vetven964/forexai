/* V-TRADE AI — Telegram Bot ONLY V5
 * Hard ownership boundary: this process owns Telegram delivery only.
 * It reads broker-native MT5 snapshot data and never creates/fakes candles.
 * PRE-MARKET UI/CORE never sends Telegram messages.
 * Authorization is fail-closed: ICT + CRT + MTF + fresh data must pass.
 * AUTO DELIVERY: confirmed BUY/SELL only. WAIT is never auto-broadcast.
 */
'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(30000,Number(process.env.TELEGRAM_AI_POLL_MS||60000));
const MAX_SPREAD=Math.max(.01,Number(process.env.TELEGRAM_MAX_SPREAD||5));
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE TELEGRAM V5] disabled: missing Telegram credentials');process.exit(0);}
const bot=new TelegramBot(TOKEN,{polling:{interval:3000,autoStart:true,params:{timeout:25}}});
let busy=false,lastSentKey='',lastAnalysis=null;
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const arr=(s,tf)=>{const x=s?.timeframes?.[tf];const raw=Array.isArray(x?.bars)?x.bars:Array.isArray(x?.candles)?x.candles:Array.isArray(x)?x:[];return raw.map(b=>{if(!b)return null;const o=n(b.o??b.open),h=n(b.h??b.high),l=n(b.l??b.low),c=n(b.c??b.close);return [o,h,l,c].every(v=>v!=null)?{...b,o,h,l,c}:null}).filter(Boolean);};
const avg=(a)=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
function tfScore(b){if(b.length<20)return null;const c=b.map(x=>x.c),m20=avg(c.slice(-20)),m5=avg(c.slice(-5)),last=c.at(-1),prev=c.at(-6);let s=50;if(last>m20)s+=8;else if(last<m20)s-=8;if(m5>m20)s+=5;else if(m5<m20)s-=5;if(last>prev)s+=4;else if(last<prev)s-=4;return clamp(Math.round(s),0,100);}
function ict(raw,side){
 if(raw.length<22)return{swap:false,mss:false,disp:false,fvg:false,ob:false,low:null,high:null};
 const last=raw.at(-1),p=raw.slice(-11,-1),hi=Math.max(...p.map(x=>x.h)),lo=Math.min(...p.map(x=>x.l));
 const sweep=side==='BULLISH'?last.l<lo&&last.c>lo:last.h>hi&&last.c<hi;
 const s=raw.slice(-7,-1),sh=Math.max(...s.map(x=>x.h)),sl=Math.min(...s.map(x=>x.l));
 const mss=side==='BULLISH'?last.c>sh:last.c<sl;
 const prior=raw.slice(-21,-1),ranges=prior.map(x=>x.h-x.l),r=last.h-last.l,body=Math.abs(last.c-last.o),disp=r>=avg(ranges)*1.2&&body/r>=.6&&(side==='BULLISH'?last.c>last.o:last.c<last.o);
 const a=raw.at(-3),c=last;const fvg=side==='BULLISH'?c.l>a.h:c.h<a.l;
 const obC=raw.at(-2);const opposite=side==='BULLISH'?obC.c<obC.o:obC.c>obC.o;const ob=opposite&&disp;
 return{swap:sweep,mss,disp,fvg,ob,low:side==='BULLISH'?lo:hi,high:side==='BULLISH'?hi:lo};
}
function crt(raw,side,price){
 if(raw.length<12||price==null)return{range:false,eq:false,exp:false,confirm:false};
 const base=raw.slice(-12,-1),hi=Math.max(...base.map(x=>x.h)),lo=Math.min(...base.map(x=>x.l)),mid=(hi+lo)/2,last=raw.at(-1),r=last.h-last.l,baseR=avg(base.map(x=>x.h-x.l));
 const range=side==='BULLISH'?price<=mid:side==='BEARISH'?price>=mid:false;
 const exp=r>=baseR*1.15;
 const eq=side==='BULLISH'?price<mid:side==='BEARISH'?price>mid:false;
 const confirm=exp&&(side==='BULLISH'?last.c>last.o:last.c<last.o);
 return{range,eq,exp,confirm,hi,lo,mid};
}
function analyze(s){
 const tfs=['M5','M15','H1','H4'];const rows=tfs.map(tf=>({tf,count:arr(s,tf).length,score:tfScore(arr(s,tf))}));const ready=rows.every(x=>Number.isFinite(x.score));const score=ready?Math.round(avg(rows.map(x=>x.score))):50;const bias=score>=55?'BULLISH':score<=45?'BEARISH':'NEUTRAL';const raw=arr(s,'M5');const price=n(s.price??raw.at(-1)?.c);const side=bias;const i=side==='NEUTRAL'?{swap:false,mss:false,disp:false,fvg:false,ob:false}:ict(raw,side);const c=side==='NEUTRAL'?{range:false,eq:false,exp:false,confirm:false}:crt(raw,side,price);const spread=n(s.spread);const spreadPass=spread==null||spread<=MAX_SPREAD;const transition=s.marketTransition||{};const temporal=transition.phase==='LIVE_MARKET'||(transition.phase==='MONDAY_LIVE_REVALIDATION'&&transition.mondayFreshM5===true);const gates={sweep:i.swap,mss:i.mss,bos:i.mss,displacement:i.disp,fvg:i.fvg,ob:i.ob,crtRange:c.range,crtExpansion:c.exp,crtConfirm:c.confirm,momentum:side==='BULLISH'?rows[0].score>50:side==='BEARISH'?rows[0].score<50:false,spread:spreadPass};const passed=Object.values(gates).filter(Boolean).length;const confidence=clamp(Math.round(score*.65+passed/Object.keys(gates).length*35),0,100);const authorized=ready&&s.connected===true&&side!=='NEUTRAL'&&temporal&&i.swap&&i.mss&&i.disp&&(i.fvg||i.ob)&&c.exp&&c.confirm&&spreadPass&&confidence>=78;let entry=null,sl=null,tp=[];if(authorized&&price!=null){entry=price;if(side==='BULLISH'){sl=Math.min(...raw.slice(-8).map(x=>x.l));const risk=Math.max(entry-sl,.5);tp=[entry+1.5*risk,entry+2.5*risk,entry+3.5*risk];}else{sl=Math.max(...raw.slice(-8).map(x=>x.h));const risk=Math.max(sl-entry,.5);tp=[entry-1.5*risk,entry-2.5*risk,entry-3.5*risk];}}
 const reasons=[];if(!s.connected)reasons.push('MT5 not ready');if(!ready)reasons.push('MTF data incomplete');if(!temporal)reasons.push('fresh execution candle not confirmed');if(!i.swap)reasons.push('liquidity sweep WAIT');if(!i.mss)reasons.push('MSS/BOS WAIT');if(!i.disp)reasons.push('displacement WAIT');if(!(i.fvg||i.ob))reasons.push('FVG/OB WAIT');if(!c.exp||!c.confirm)reasons.push('CRT confirmation WAIT');if(!spreadPass)reasons.push('spread WAIT');if(confidence<78)reasons.push('confidence below authorization threshold');
 return{price,bias,score,confidence,signal:authorized?(side==='BULLISH'?'BUY':'SELL'):'WAIT',authorized,gates,passed,total:Object.keys(gates).length,entry,sl,tp,transition,reason:reasons.join('; ')||'ICT + CRT execution gates confirmed',candleTime:raw.at(-1)?.candleTime??raw.at(-1)?.timeMs??raw.at(-1)?.timestamp??null};
}
async function snapshot(){const h={};if(BRIDGE_KEY)h['X-VTRADE-TELEGRAM-KEY']=BRIDGE_KEY;const r=await fetch(CORE_URL+'/api/telegram/market-snapshot',{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d.success!==true)throw new Error(d.error||`HTTP ${r.status}`);return d;}
const F=v=>v==null?'WAIT':Number(v).toFixed(2);const G=(x,k)=>x.gates[k]?'PASS':'WAIT';
function format(a){const side=a.signal==='BUY'?'🟢 BUY':a.signal==='SELL'?'🔴 SELL':'🟡 WAIT';return[`🤖 *V TRADE AI — XAUUSD*`,`💰 ${F(a.price)} | *${side}*`,`📈 *${a.bias}* | Score *${a.score}/100* | Conf *${a.confidence}/100*`,`🔎 ICT/CRT *${a.passed}/${a.total}*`,`💧 Sweep ${G(a,'sweep')} | MSS ${G(a,'mss')} | BOS ${G(a,'bos')}`,`⚡ Disp ${G(a,'displacement')} | FVG ${G(a,'fvg')} | OB ${G(a,'ob')}`,`🧠 CRT Exp ${G(a,'crtExpansion')} | Confirm ${G(a,'crtConfirm')}`,`📍 Mom ${G(a,'momentum')} | Spread ${G(a,'spread')}`,`🎯 Entry ${F(a.entry)} | SL ${F(a.sl)}`,`🎯 TP1 ${F(a.tp[0])} | TP2 ${F(a.tp[1])} | TP3 ${F(a.tp[2])}`,'',a.authorized?'🔐 *TRADE AUTHORIZED*':'⏳ *WAIT — NO ORDER*',`🧠 ${a.reason||'Setup incomplete'}`].join('\n');}
async function scan(force=false,manual=false){if(busy)return;busy=true;try{const a=analyze(await snapshot());lastAnalysis=a;console.log(`[V-TRADE TELEGRAM V5] Scan | ${a.signal} | ${a.bias} | score=${a.score} | conf=${a.confidence} | gates=${a.passed}/${a.total}`);
  // AUTOMATIC delivery is ENTRY-ONLY. WAIT stays internal and is never broadcast.
  if(!manual&&!a.authorized){console.log('[V-TRADE TELEGRAM V5] WAIT suppressed | automatic delivery is ENTRY-ONLY');return;}
  // Confirmed setups are deduplicated by setup/candle, never by polling minute.
  const key=a.authorized?`${a.signal}|${a.candleTime}|${a.entry}|${a.sl}|${(a.tp||[]).join(',')}`:`MANUAL|${a.signal}|${a.candleTime}|${a.price}|${a.passed}|${a.confidence}`;
  if(!force&&key===lastSentKey)return;
  await bot.sendMessage(CHAT_ID,format(a),{parse_mode:'Markdown'});lastSentKey=key;console.log(`[V-TRADE TELEGRAM V5] SENT | signal=${a.signal} | authorized=${a.authorized} | manual=${manual}`);
 }catch(e){console.warn('[V-TRADE TELEGRAM V5] delivery/analysis failed:',e.message);}finally{busy=false;}}
bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V5] polling_error:',e.message));
bot.onText(/^\/(start|signal)(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await scan(true,true);});
console.log('[V-TRADE TELEGRAM V5] Telegram Bot ONLY | ICT+CRT | broker-native candles | fail-closed | WAIT auto-suppressed');
setTimeout(()=>scan(false,false),5000);setInterval(()=>scan(false,false),POLL_MS);