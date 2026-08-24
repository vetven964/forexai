// V-TRADE AI — Telegram compact formatter V7
// Telegram Bot ONLY presentation layer. Does not change ICT authorization.
'use strict';
const fs=require('fs');
const path=require('path');
const TARGET=path.resolve(__dirname,'telegram-bot-ai-service-v4.js');
const MARKER='VTRADE_TELEGRAM_COMPACT_FORMAT_V7';
function patch(){
  if(!fs.existsSync(TARGET))throw new Error('telegram-bot-ai-service-v4.js not found');
  let source=fs.readFileSync(TARGET,'utf8');
  if(source.includes(MARKER))return;
  const start=source.indexOf('function formatSignal(a)');
  const end=source.indexOf('\nasync function scan(',start);
  if(start<0||end<0)throw new Error('formatSignal anchors not found');
  const replacement=[
    'function formatSignal(a){',
    '  // '+MARKER,
    "  const side=a.signal==='BUY'?'🟢 BUY':a.signal==='SELL'?'🔴 SELL':'🟡 WAIT';",
    '  const tp=Array.isArray(a.takeProfit)?a.takeProfit:[];',
    "  const fmt=v=>v==null||!Number.isFinite(Number(v))?'WAIT':Number(v).toFixed(2);",
    '  const auth=a.tradeAuthorized===true;',
    "  const gates=a.gates||{};",
    "  const gate=(k)=>gates[k]?'PASS':'WAIT';",
    '  const lines=[',
    "    '🤖 *V TRADE AI — XAUUSD*',",
    "    '💰 '+fmt(a.price)+' | *'+side+'*',",
    "    '📈 *'+String(a.bias||'NEUTRAL')+'* | Score *'+Math.round(Number(a.directionScore)||0)+'/100* | Conf *'+Math.round(Number(a.confidence)||0)+'/100*',",
    "    '⏱️ '+String(a.transition?.phase||'LIVE_MARKET').replaceAll('_',' '),",
    "    '🔎 ICT *'+String(a.gateCount||'0/10')+'*',",
    "    '💧 Sweep '+gate('liquiditySweep')+' | MSS '+gate('mss')+' | BOS '+gate('bos'),",
    "    '⚡ Disp '+gate('displacement')+' | FVG '+gate('fvg')+' | OB '+gate('orderBlock'),",
    "    '📍 P/D '+gate('premiumDiscount')+' | Mom '+gate('momentum')+' | Spread '+gate('spread'),",
    "    '🎯 Entry '+(auth?fmt(a.entry):'WAIT')+' | SL '+(auth?fmt(a.stopLoss):'WAIT'),",
    "    '🎯 TP1 '+(auth?fmt(tp[0]):'WAIT')+' | TP2 '+(auth?fmt(tp[1]):'WAIT')+' | TP3 '+(auth?fmt(tp[2]):'WAIT'),
    "    '',",
    "    auth?'🔐 *TRADE AUTHORIZED*':'⏳ *WAIT — NO ORDER*',",
    "    '🧠 '+(auth?'ICT setup confirmed':'Setup incomplete')",
    '  ];',
    "  return lines.join('\\n');",
    '}'
  ].join('\n');
  source=source.slice(0,start)+replacement+source.slice(end);
  fs.writeFileSync(TARGET,source,'utf8');
  console.log('[V-TRADE TELEGRAM] compact formatter V7 installed | target=telegram-bot-ai-service-v4.js');
}
try{patch();}catch(e){console.error('[V-TRADE TELEGRAM] compact formatter V7 failed:',e.stack||e.message);throw e;}
