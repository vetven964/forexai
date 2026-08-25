// V-TRADE AI — Early Direction Watch V1
// IMPORTANT: uses broker-provided CLOSED candles only. Never creates/synthesizes OHLC candles.
'use strict';
const fs=require('fs');
const path=require('path');
const TARGET=path.resolve(__dirname,'telegram-bot-ai-service.js');
const MARK='VTRADE_EARLY_WATCH_CLOSED_CANDLE_V1';

function patch(){
  if(!fs.existsSync(TARGET)) throw new Error('telegram-bot-ai-service.js not found');
  let s=fs.readFileSync(TARGET,'utf8');
  if(s.includes(MARK)) return;

  const barsNeedle="function bars(s,tf){const src=s?.timeframes?.[tf];const raw=Array.isArray(src?.bars)?src.bars:Array.isArray(src?.candles)?src.candles:Array.isArray(src)?src:[];return raw.map(normalizeBar).filter(Boolean);}";
  if(!s.includes(barsNeedle)) throw new Error('bars anchor not found');
  const closedHelper=[
    "function barTime(b){const v=b?.candleTime??b?.timeMs??b?.timestamp??b?.openTime??b?.time??b?.t;const n=Number(v);if(Number.isFinite(n))return n<1e12?n*1000:n;const d=Date.parse(String(v||''));return Number.isFinite(d)?d:null;}",
    "function closedBars(s,tf){const raw=bars(s,tf),ms={M5:300000,M15:900000,H1:3600000,H4:14400000}[tf]||300000,now=Date.now();return raw.filter(b=>{const t=barTime(b);return t!=null&&t+ms<=now;});}",
    "function earlyDirectionWatch(s){",
    "  // "+MARK,
    "  const tfs=['M5','M15','H1','H4'],rows=tfs.map(tf=>{const b=closedBars(s,tf);return{tf,bars:b,score:tfScore(b)};});",
    "  if(rows.some(r=>!Number.isFinite(r.score)||r.bars.length<20))return{stage:'WAIT',bias:null,confidence:0,reason:'Closed-candle history unavailable'};",
    "  const bull=rows.filter(r=>r.score>=55).length,bear=rows.filter(r=>r.score<=45).length,avg=Math.round(rows.reduce((a,r)=>a+r.score,0)/rows.length),m5=rows[0],m15=rows[1],m5last=m5.bars.at(-1),m5prev=m5.bars.at(-2),m15last=m15.bars.at(-1);",
    "  const bullMomentum=Number(m5last.c)>Number(m5last.o)&&Number(m5last.c)>=Number(m5prev.c);",
    "  const bearMomentum=Number(m5last.c)<Number(m5last.o)&&Number(m5last.c)<=Number(m5prev.c);",
    "  const bullReady=bull>=3&&avg>=62&&m5.score>=60&&m15.score>=58&&bullMomentum;",
    "  const bearReady=bear>=3&&avg<=38&&m5.score<=40&&m15.score<=42&&bearMomentum;",
    "  if(bullReady)return{stage:'EARLY_BUY_WATCH',bias:'BULLISH',confidence:Math.min(74,Math.max(60,avg)),reason:'Bullish direction developing from closed MTF candles; waiting for ICT execution confirmation'};",
    "  if(bearReady)return{stage:'EARLY_SELL_WATCH',bias:'BEARISH',confidence:Math.min(74,Math.max(60,100-avg)),reason:'Bearish direction developing from closed MTF candles; waiting for ICT execution confirmation'};",
    "  return{stage:'WAIT',bias:avg>=55?'BULLISH':avg<=45?'BEARISH':'NEUTRAL',confidence:Math.max(0,Math.min(59,Math.abs(avg-50)+40)),reason:'Direction not strong enough on closed MTF candles'};",
    "}"
  ].join('\n');
  s=s.replace(barsNeedle,barsNeedle+'\n'+closedHelper);

  const signalNeedle="const signal=authorized?(side==='BULLISH'?'BUY':'SELL'):'WAIT',reasons=[];";
  if(!s.includes(signalNeedle)) throw new Error('signal anchor not found');
  const signalReplacement="const signal=authorized?(side==='BULLISH'?'BUY':'SELL'):'WAIT',earlyWatch=authorized?{stage:'WAIT',bias:null,confidence:0,reason:''}:earlyDirectionWatch(s),reasons=[];";
  s=s.replace(signalNeedle,signalReplacement);

  const returnNeedle="executionLoaded:authorized,generatedAt:new Date().toISOString()};";
  if(!s.includes(returnNeedle)) throw new Error('return anchor not found');
  const returnReplacement="executionLoaded:authorized,setupStage:authorized?'AUTHORIZED':earlyWatch.stage,earlyWatchBias:earlyWatch.bias,earlyWatchConfidence:earlyWatch.confidence,earlyWatchReason:earlyWatch.reason,generatedAt:new Date().toISOString()};";
  s=s.replace(returnNeedle,returnReplacement);

  fs.writeFileSync(TARGET,s,'utf8');
  console.log('[V-TRADE TELEGRAM] Early Direction Watch V1 active | CLOSED CANDLES ONLY | no synthetic OHLC');
}
try{patch();}catch(e){console.warn('[V-TRADE TELEGRAM] early watch patch skipped safely:',e.message);}
