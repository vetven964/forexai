/* V-TRADE TELEGRAM PRE-MARKET SIGNAL V6
 * Telegram is a read-only consumer of the single MT5-authoritative Pre-Market route.
 * It NEVER creates an independent BUY/SELL decision and NEVER enables auto-order.
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

process.on('uncaughtException',e=>console.error('[V-TRADE PRE-MARKET TELEGRAM V6] uncaughtException — child kept alive:',e?.stack||e));
process.on('unhandledRejection',e=>console.error('[V-TRADE PRE-MARKET TELEGRAM V6] unhandledRejection — child kept alive:',e));
process.on('SIGTERM',()=>{console.warn('[V-TRADE PRE-MARKET TELEGRAM V6] SIGTERM received');process.exitCode=0;});
process.on('SIGINT',()=>{console.warn('[V-TRADE PRE-MARKET TELEGRAM V6] SIGINT received');process.exitCode=0;});

const num=v=>Number.isFinite(Number(v))?Number(v):null;
const F=v=>num(v)!=null?num(v).toFixed(2):'—';
const bool=v=>v===true;

if(!TOKEN||!CHAT_ID){
  console.warn('[V-TRADE PRE-MARKET TELEGRAM V6] disabled: missing Telegram credentials');
  setInterval(()=>console.warn('[V-TRADE PRE-MARKET TELEGRAM V6] waiting for credentials — child intentionally alive'),60000);
}else{
  let bot=null;
  try{bot=new TelegramBot(TOKEN,{polling:false});}
  catch(e){console.error('[V-TRADE PRE-MARKET TELEGRAM V6] Telegram client init failed:',e?.stack||e);}

  let state={};
  try{state=JSON.parse(fs.readFileSync(STATE,'utf8'))||{}}catch(_){}
  let lastKey=state.key||'',lastSentAt=Number(state.sentAt||0);

  async function getAuthority(){
    const h={'Cache-Control':'no-cache','X-VTRADE-CLIENT':'telegram-premarket-v6'};
    if(KEY)h['X-VTRADE-TELEGRAM-KEY']=KEY;
    const r=await fetch(CORE_URL+'/api/pre-market/mt5-authoritative',{headers:h,cache:'no-store'});
    const text=await r.text();
    let d={};try{d=JSON.parse(text)}catch(_){throw new Error(`CORE returned non-JSON HTTP ${r.status}: ${text.slice(0,120)}`)}
    if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);
    return d;
  }

  function normalize(a){
    const gates=a?.gates||a?.confirmations||{};
    const processing=a?.processing||{};
    const required=Number(processing.gatesRequired||10);
    const passed=Number(processing.gatesPassed??Object.keys(gates).filter(k=>k!=='allGatesPassed'&&gates[k]===true).length);
    const all=bool(gates.allGatesPassed)&&passed>=required;
    const side=String(a?.execution?.side||a?.signalSide||'').toUpperCase();
    const signal=all&&['BUY','SELL'].includes(side)?side:'WAIT';
    const zone=Array.isArray(a?.execution?.zone)&&a.execution.zone.length>=2
      ? {low:Math.min(Number(a.execution.zone[0]),Number(a.execution.zone[1])),high:Math.max(Number(a.execution.zone[0]),Number(a.execution.zone[1]))}
      : null;
    const price=num(a?.price??a?.livePrice);
    const atr=num(a?.timeframes?.M15?.atr)||num(a?.timeframes?.M5?.atr)||1;
    const inZone=bool(a?.execution?.inZone);
    let entry=null,sl=null,tp=[];
    if(all&&zone&&price!=null){
      entry=inZone?price:(zone.low+zone.high)/2;
      const buffer=Math.max(atr*0.35,0.80);
      sl=side==='BUY'?zone.low-buffer:zone.high+buffer;
      const risk=Math.max(Math.abs(entry-sl),0.50);
      tp=[entry+(side==='BUY'?1.8:-1.8)*risk,entry+(side==='BUY'?2.7:-2.7)*risk,entry+(side==='BUY'?3.8:-3.8)*risk];
    }
    const checks={
      liquiditySweep:bool(gates.liquiditySweep),
      mss:bool(gates.mss),
      bos:bool(gates.bos),
      fvg:bool(gates.fvg),
      orderBlock:bool(gates.orderBlock),
      displacement:bool(gates.displacement),
      premiumDiscount:bool(gates.premiumDiscountOk),
      executionZone:bool(gates.executionZone),
      momentum:bool(gates.technicalMomentumOk),
      spread:bool(gates.spreadOk)
    };
    const missing=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k.toUpperCase());
    return {raw:a,gates,processing,required,passed,all,side,signal,zone,price,entry,sl,tp,checks,missing};
  }

  function buildKey(x){return [x.signal,x.zone?.low,x.zone?.high,x.entry,x.sl,...x.tp].map(v=>v??'').join('|');}

  async function send(x){
    if(!bot)throw new Error('Telegram client unavailable');
    const buy=x.signal==='BUY';
    const icon=buy?'🟢':'🔴';
    const direction=buy?'UPTRADE':'DOWNTRADE';
    const c=x.checks;
    const lines=[
      '🤖 *V TRADE AI — PRE-MARKET SIGNAL*','',
      `${icon} *${x.signal} XAUUSD*`,
      '📚 History: *D1 → H4 → H1 → M15 → M5*',
      `📈 Direction: *${direction}*`,
      `🧠 Score: *${x.raw.directionScore??0}/100* | Confidence: *${x.raw.confidence??0}%*`,
      `🔎 MTF: *${x.raw.available??0}/4* | Gates: *${x.passed}/${x.required}*`,'',
      `📍 Entry Zone: *${F(x.zone?.low)} – ${F(x.zone?.high)}*`,
      `🎯 Entry: *${F(x.entry)}*`,
      `🛑 SL: *${F(x.sl)}*`,
      `🎯 TP1: *${F(x.tp[0])}*`,
      `🎯 TP2: *${F(x.tp[1])}*`,
      `🎯 TP3: *${F(x.tp[2])}*`,'',
      `📏 Spread: *${F(x.raw.spread)}*`,
      `💧 Liquidity: *${c.liquiditySweep?'PASS':'context'}*`,
      `🔀 MSS: *${c.mss?'PASS':'context'}* | BOS: *${c.bos?'PASS':'context'}*`,
      `🟦 FVG: *${c.fvg?'PASS':'context'}* | OB: *${c.orderBlock?'PASS':'context'}*`,
      `⚡ Displacement: *${c.displacement?'PASS':'context'}* | Momentum: *${c.momentum?'PASS':'context'}*`,'',
      '⚠️ *SIGNAL ONLY — AUTO ORDER OFF*'
    ];
    await bot.sendMessage(CHAT_ID,lines.join('\n'),{parse_mode:'Markdown'});
  }

  async function scan(){
    try{
      const raw=await getAuthority();
      const x=normalize(raw);
      const blocked=[];
      if(raw?.complete!==true)blocked.push(`MTF ${raw?.available??0}/4`);
      if(!x.all)blocked.push(...x.missing);
      if(x.signal==='WAIT')blocked.push('canonical authority not ENTRY_READY');
      console.log(`[V-TRADE PRE-MARKET TELEGRAM V6] AUTHORITY | signal=${x.signal} | eligible=${x.all} | side=${x.side||'—'} | bias=${raw.bias||'—'} | score=${raw.directionScore??'—'} | conf=${raw.confidence??'—'} | aligned=${raw.available??0}/4 | gates=${x.passed}/${x.required} | blocked=${blocked.join(',')||'NONE'}`);
      if(!x.all||x.signal==='WAIT'||!x.zone||x.entry==null||x.sl==null||x.tp.length<3)return;
      const now=Date.now(),key=buildKey(x);
      if(key===lastKey||now-lastSentAt<COOLDOWN_MS)return;
      await send(x);
      lastKey=key;lastSentAt=now;
      fs.mkdirSync(path.dirname(STATE),{recursive:true});
      fs.writeFileSync(STATE,JSON.stringify({key,sentAt:now,candleTime:raw.timeframes?.M5?.candle?.candleTime||null,side:x.signal,score:raw.directionScore},null,2));
      console.log(`[V-TRADE PRE-MARKET TELEGRAM V6] SIGNAL SENT | ${x.signal} | score=${raw.directionScore} | gates=${x.passed}/${x.required} | TP=3 | autoOrder=false`);
    }catch(e){console.warn('[V-TRADE PRE-MARKET TELEGRAM V6] scan failed — retrying:',e?.message||e)}
  }

  console.log(`[V-TRADE PRE-MARKET TELEGRAM V6] ACTIVE | SINGLE AUTHORITY | gates=10/10 | CORE=${CORE_URL} | poll=${POLL_MS}ms | cooldown=${COOLDOWN_MS}ms | autoOrder=false`);
  setInterval(scan,POLL_MS);scan();
}
