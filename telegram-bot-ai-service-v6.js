'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const BRIDGE_KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(30000,Number(process.env.TELEGRAM_AI_POLL_MS||60000));
const MAX_AGE_SEC=Math.max(5,Number(process.env.TELEGRAM_MAX_PRICE_AGE_SEC||15));
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE TELEGRAM V6] disabled: missing Telegram credentials');process.exit(0);}
const bot=new TelegramBot(TOKEN,{polling:{interval:3000,autoStart:true,params:{timeout:25}}});
let busy=false,lastSentKey='';
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const F=v=>v==null?'WAIT':Number(v).toFixed(2);
const yes=v=>v===true?'PASS':'WAIT';
function authorityFrom(snapshot){return snapshot?.authority&&typeof snapshot.authority==='object'?snapshot.authority:null;}
async function snapshot(){const headers={'Cache-Control':'no-cache'};if(BRIDGE_KEY)headers['X-VTRADE-TELEGRAM-KEY']=BRIDGE_KEY;const r=await fetch(CORE_URL+'/api/telegram/market-snapshot',{headers,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d.success!==true)throw new Error(d.error||`HTTP ${r.status}`);return d;}
function normalize(a){
 const c=a?.confirmations||{},qAge=n(a?.priceAgeSec),news=a?.news||{};
 const newsPass=news.available===true&&news.trusted===true&&news.degraded!==true&&!['LIVE','LOCK','POST_NEWS'].includes(String(news.state||'').toUpperCase());
 const brokerFresh=a?.brokerConnected===true&&a?.stalePrice!==true&&(qAge==null||qAge<=MAX_AGE_SEC);
 const signal=['BUY','SELL'].includes(String(a?.signal||'').toUpperCase())?String(a.signal).toUpperCase():'WAIT';
 const decisionPassed=a?.decision?.passed===true||a?.confirmations?.allGatesPassed===true;
 const dataOk=!a?.dataQuality||Number(a.dataQuality.score||0)>=Number(a.dataQuality.minRequired||0);
 const tp=Array.isArray(a?.takeProfit)?a.takeProfit:[];
 const executionReady=a?.execution?.status!=='WAIT';
 const hasTradeLevels=n(a?.entry)!=null&&n(a?.stopLoss)!=null&&tp.length>=3;
 const authorized=signal!=='WAIT'&&decisionPassed&&newsPass&&brokerFresh&&dataOk&&executionReady&&hasTradeLevels;
 const gates={mtf:c.mtfAligned===true,sweep:c.liquiditySweep===true,mss:c.mss===true,bos:c.bos===true,displacement:c.displacement?.confirmed===true||c.displacement===true,fvg:c.freshFvg===true,ob:c.freshOb===true,crt:c.crtConfirm===true,pd:c.premiumDiscountOk===true,momentum:c.technicalMomentumOk===true,trend:c.trendStrengthOk===true,spread:c.spreadOk===true};
 const reasons=[];
 if(signal==='WAIT')reasons.push('signal=WAIT');
 if(!decisionPassed)reasons.push('decision-gates');
 if(!newsPass)reasons.push('news-gate');
 if(!brokerFresh)reasons.push('broker-freshness');
 if(!dataOk)reasons.push('data-quality');
 if(!executionReady)reasons.push('execution-not-ready');
 if(!hasTradeLevels)reasons.push('entry/sl/tp-incomplete');
 return {a,signal:authorized?signal:'WAIT',rawSignal:signal,authorized,newsPass,brokerFresh,dataOk,qAge,gates,passed:Object.values(gates).filter(Boolean).length,total:Object.keys(gates).length,reasons};
}
function format(x,manual=false){const a=x.a,g=x.gates,side=x.signal==='BUY'?'🟢 BUY':x.signal==='SELL'?'🔴 SELL':'🟡 WAIT';const lines=['🤖 *V TRADE AI — XAUUSD*',`💰 ${F(a.livePrice??a.price)} | *${side}*`,`📈 *${a.bias||'NEUTRAL'}* | Score *${a.setupScore??a.confidence??0}/100* | Conf *${a.confidence??0}/100*`,`🔎 ICT/CRT *${x.passed}/${x.total}*`,`💧 Sweep ${yes(g.sweep)} | MSS ${yes(g.mss)} | BOS ${yes(g.bos)}`,`⚡ Disp ${yes(g.displacement)} | FVG ${yes(g.fvg)} | OB ${yes(g.ob)}`,`🧠 CRT Confirm ${yes(g.crt)} | MTF ${yes(g.mtf)} | PD ${yes(g.pd)}`,`📍 Mom ${yes(g.momentum)} | ADX ${yes(g.trend)} | Spread ${yes(g.spread)}`,`📰 News ${x.newsPass?'PASS':'WAIT'}`,`🎯 Entry ${F(a.entry)} | SL ${F(a.stopLoss)}`,`🎯 TP1 ${F(a.takeProfit?.[0])} | TP2 ${F(a.takeProfit?.[1])} | TP3 ${F(a.takeProfit?.[2])}`,'',x.authorized?'🔐 *TRADE AUTHORIZED*':'⏳ *WAIT — NO ORDER*',`🧠 ${a.decision?.reason||a.trigger||a.crt?.reason||'Mandatory confirmation gates are not complete.'}`];if(manual){lines.splice(3,0,'🖐️ *MANUAL STATUS REQUEST*');if(x.reasons.length)lines.push(`🔐 Gate reason: ${x.reasons.join(', ')}`);}return lines.join('\n');}
async function scan(force=false,manual=false){if(busy)return;busy=true;try{const snap=await snapshot();const a=authorityFrom(snap);if(!a)throw new Error('Canonical authority payload missing');const x=normalize(a);console.log(`[V-TRADE TELEGRAM V6] Scan | raw=${x.rawSignal} | final=${x.signal} | bias=${a.bias||'NEUTRAL'} | score=${a.setupScore??a.confidence??0} | conf=${a.confidence??0} | gates=${x.passed}/${x.total} | CRT=${x.gates.crt?'PASS':'WAIT'} | authority=${x.authorized} | reasons=${x.reasons.join(',')||'none'}`);if(!manual&&!x.authorized){console.log('[V-TRADE TELEGRAM V6] WAIT suppressed | ENTRY-ONLY policy | canonical authority not authorized');return;}const key=x.authorized?`${x.signal}|${a.candleAgeSec}|${a.executionTimeframe}|${a.entry}|${a.stopLoss}|${(a.takeProfit||[]).join(',')}`:`MANUAL|${a.signal}|${a.timestamp}|${a.livePrice}|${x.passed}|${x.reasons.join(',')}`;if(!force&&key===lastSentKey)return;await bot.sendMessage(CHAT_ID,format(x,manual),{parse_mode:'Markdown'});lastSentKey=key;console.log(`[V-TRADE TELEGRAM V6] SENT | signal=${x.signal} | authorized=${x.authorized} | manual=${manual}`);}catch(e){console.warn('[V-TRADE TELEGRAM V6] delivery failed:',e.message);}finally{busy=false;}}
bot.on('polling_error',e=>console.warn('[V-TRADE TELEGRAM V6] polling_error:',e.message));
bot.onText(/^\/(start|signal|status)(?:@\w+)?$/i,async msg=>{if(String(msg.chat.id)!==CHAT_ID)return;await scan(true,true);});
console.log('[V-TRADE TELEGRAM V6] CANONICAL AUTHORITY ONLY | CORE ICT+CRT owner | Telegram delivery owner | broker-native MT5 | fail-closed | WAIT auto-suppressed');
setTimeout(()=>scan(false,false),5000);setInterval(()=>scan(false,false),POLL_MS);
