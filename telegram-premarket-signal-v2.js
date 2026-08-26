/* V-TRADE TELEGRAM PRE-MARKET SIGNAL V4
 * Telegram is a read-only signal consumer.
 * Server authority supplies MTF history, direction, ICT setup, Entry/SL/TP.
 * Child process is fail-safe: transient Telegram/core errors never terminate it.
 */
'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const fs=require('fs');
const path=require('path');
const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||process.env.RENDER_EXTERNAL_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(15000,Number(process.env.TELEGRAM_PREMARKET_POLL_MS||30000));
const COOLDOWN_MS=Math.max(60000,Number(process.env.TELEGRAM_PREMARKET_COOLDOWN_MS||300000));
const STATE=path.join(__dirname,'data','telegram-last-premarket-signal.json');

process.on('uncaughtException',e=>console.error('[V-TRADE PRE-MARKET TELEGRAM V4] uncaughtException — child kept alive:',e?.stack||e));
process.on('unhandledRejection',e=>console.error('[V-TRADE PRE-MARKET TELEGRAM V4] unhandledRejection — child kept alive:',e?.stack||e));
process.on('SIGTERM',()=>{console.warn('[V-TRADE PRE-MARKET TELEGRAM V4] SIGTERM received');process.exitCode=0;});
process.on('SIGINT',()=>{console.warn('[V-TRADE PRE-MARKET TELEGRAM V4] SIGINT received');process.exitCode=0;});

if(!TOKEN||!CHAT_ID){
  console.warn('[V-TRADE PRE-MARKET TELEGRAM V4] disabled: missing Telegram credentials');
  setInterval(()=>console.warn('[V-TRADE PRE-MARKET TELEGRAM V4] waiting for credentials — child intentionally alive'),60000);
}else{
  let bot=null;
  try{bot=new TelegramBot(TOKEN,{polling:false});}
  catch(e){console.error('[V-TRADE PRE-MARKET TELEGRAM V4] Telegram client init failed — retrying:',e?.stack||e);}

  let state={};
  try{state=JSON.parse(fs.readFileSync(STATE,'utf8'))||{}}catch(_){}
  let lastKey=state.key||'',lastSentAt=Number(state.sentAt||0);
  const F=v=>Number.isFinite(Number(v))?Number(v).toFixed(2):'—';

  async function get(){
    const h={'Cache-Control':'no-cache','X-VTRADE-CLIENT':'telegram-premarket-v4'};
    if(KEY)h['X-VTRADE-TELEGRAM-KEY']=KEY;
    const r=await fetch(CORE_URL+'/api/pre-market/intelligence',{headers:h,cache:'no-store'});
    const text=await r.text();
    let d={};try{d=JSON.parse(text)}catch(_){throw new Error(`CORE returned non-JSON HTTP ${r.status}: ${text.slice(0,120)}`)}
    if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);
    return d;
  }

  function buildKey(a){return [a.signalSide,a.execution?.entry,a.execution?.sl,...(a.execution?.tp||[])].map(F).join('|')}

  async function send(a){
    if(!bot)throw new Error('Telegram client unavailable');
    const buy=a.signalSide==='BUY';const icon=buy?'🟢':'🔴';const tp=a.execution?.tp||[];
    const lines=['🤖 *V TRADE AI — PRE-MARKET SIGNAL*','',`${icon} *${a.signalSide||'SETUP'} XAUUSD*`,`📚 History: *D1 → H4 → H1 → M15 → M5*`,`📈 Direction: *${buy?'UPTRADE':'DOWNTRADE'}*`,`🧠 Score: *${a.score||a.directionScore||0}/100* | Confidence: *${a.confidence||0}%*`,`🔎 MTF: *${a.alignedTimeframes||0}/4* | Confirmations: *${a.confirmations||0}*`,'',`📍 Entry Zone: *${F(a.execution?.entryZone?.[0])} – ${F(a.execution?.entryZone?.[1])}*`,`🎯 Entry: *${F(a.execution?.entry)}*`,`🛑 SL: *${F(a.execution?.sl)}*`];
    tp.forEach((v,i)=>lines.push(`🎯 TP${i+1}: *${F(v)}*`));
    lines.push('',`📏 Expected Move: *${F(a.execution?.expectedMove)} points*`,`💧 Liquidity: *${a.checks?.liquiditySweep?'PASS':'context'}*`,`🔀 MSS: *${a.checks?.mss?'PASS':'context'}* | BOS: *${a.checks?.bos?'PASS':'context'}*`,`🟦 FVG: *${a.checks?.fvg?'PASS':'context'}* | OB: *${a.checks?.orderBlock?'PASS':'context'}*`,`⚡ Pressure: *${a.checks?.pressure?'PASS':'context'}*`,'','⚠️ *SIGNAL ONLY — AUTO ORDER OFF*');
    await bot.sendMessage(CHAT_ID,lines.join('\n'),{parse_mode:'Markdown'});
  }

  async function scan(){
    try{
      const a=await get();
      const blocked=[];
      if(!a.signalEligible)blocked.push('signalEligible=false');
      if(!a.signalSide)blocked.push('signalSide missing');
      if(!a.execution?.entry)blocked.push('entry missing');
      if(!a.execution?.sl)blocked.push('SL missing');
      if(!a.execution?.tp?.length)blocked.push('TP missing');
      console.log(`[V-TRADE PRE-MARKET TELEGRAM V4] AUTHORITY | signal=${a.signal||'WAIT'} | eligible=${!!a.signalEligible} | side=${a.signalSide||'—'} | bias=${a.bias||'—'} | score=${a.score??'—'} | conf=${a.confidence??'—'} | aligned=${a.alignedTimeframes??0}/4 | confirmations=${a.confirmations??0} | blocked=${blocked.join(',')||'NONE'}`);
      if(!a.signalEligible||!a.signalSide||!a.execution?.entry||!a.execution?.sl||!a.execution?.tp?.length)return;
      const now=Date.now(),key=buildKey(a);if(key===lastKey||now-lastSentAt<COOLDOWN_MS)return;
      await send(a);lastKey=key;lastSentAt=now;fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify({key,sentAt:now,candleTime:a.timeframes?.M5?.candle?.candleTime||null,side:a.signalSide,score:a.score},null,2));
      console.log(`[V-TRADE PRE-MARKET TELEGRAM V4] SIGNAL SENT | ${a.signalSide} | score=${a.score} | aligned=${a.alignedTimeframes}/4 | confirmations=${a.confirmations} | TP=${a.execution.tp.length}`);
    }catch(e){console.warn('[V-TRADE PRE-MARKET TELEGRAM V4] scan failed — retrying:',e?.message||e)}
  }

  console.log(`[V-TRADE PRE-MARKET TELEGRAM V4] ACTIVE | canonical server authority | core=${CORE_URL} | poll=${POLL_MS}ms | cooldown=${COOLDOWN_MS}ms`);
  setInterval(scan,POLL_MS);scan();
}
