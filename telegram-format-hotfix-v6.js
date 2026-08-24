// V-TRADE AI — Telegram compact signal formatter V7.0
// Presentation-only: ICT gates and authorization logic remain unchanged.
'use strict';
const fs=require('fs');
const path=require('path');

const TARGET=path.resolve(__dirname,'telegram-bot-ai-service.js');
const MARKER='VTRADE_TELEGRAM_COMPACT_FORMAT_V7_0';

function patch(){
  if(!fs.existsSync(TARGET))throw new Error('telegram-bot-ai-service.js not found');
  let source=fs.readFileSync(TARGET,'utf8');
  if(source.includes(MARKER))return;
  const start=source.indexOf('function formatSignal(a)');
  const end=source.indexOf('\nasync function scan(',start);
  if(start<0||end<0)throw new Error('formatSignal anchors not found');

  const replacement=[
    'function formatSignal(a){',
    '  // '+MARKER,
    "  const side=a.signal==='BUY'?'🟢 BUY':a.signal==='SELL'?'🔴 SELL':'🟡 WAIT';",
    '  const tp=a.takeProfit||[];',
    "  const fmt=v=>v==null||!Number.isFinite(Number(v))?'WAIT':Number(v).toFixed(2);",
    '  const isAuth=a.tradeAuthorized===true;',
    "  const gate=v=>v==null?'WAIT':String(v).toUpperCase();",
    "  const gates=[gate(a.liquiditySweep||a.sweep),gate(a.mss),gate(a.bos),gate(a.displacement||a.disp),gate(a.fvg),gate(a.ob),gate(a.premiumDiscount||a.pd)].join(' | ');",
    "  const mom=gate(a.momentum||a.mom);",
    "  const spread=gate(a.spread);",
    '  const lines=[',
    "    '🤖 *V TRADE AI — XAUUSD*',",
    "    '💰 '+fmt(a.price)+' | *'+side+'*',",
    "    '📈 *'+String(a.bias||'NEUTRAL')+'* | Score *'+Math.round(Number(a.directionScore)||0)+'/100* | Conf *'+Math.round(Number(a.confidence)||0)+'/100*',",
    "    '⏱️ *'+String(a.transition||'LIVE MARKET').replaceAll('_',' ')+'* | 🔎 ICT *'+(a.gateCount||'0/10')+'*',",
    "    '💧 '+gates,",
    "    '📍 Mom '+mom+' | Spread '+spread,",
    "    '🎯 Entry *'+(isAuth?fmt(a.entry):'WAIT')+'* | SL *'+(isAuth?fmt(a.stopLoss):'WAIT')+'*',",
    "    '🎯 TP1 *'+(isAuth?fmt(tp[0]):'WAIT')+'* | TP2 *'+(isAuth?fmt(tp[1]):'WAIT')+'* | TP3 *'+(isAuth?fmt(tp[2]):'WAIT')+'*',",
    "    '',",
    "    (isAuth?'🔐 *SIGNAL AUTHORIZED*':'⏳ *WAIT — NO ORDER*'),",
    "    '🧠 '+(isAuth?'Setup confirmed':'Setup incomplete')",
    '  ];',
    "  return lines.join('\\n');",
    '}'
  ].join('\n');

  source=source.slice(0,start)+replacement+source.slice(end);
  fs.writeFileSync(TARGET,source,'utf8');
  console.log('[V-TRADE TELEGRAM] compact formatter V7.0 installed');
}
try{patch();}catch(e){console.error('[V-TRADE TELEGRAM] compact formatter V7.0 failed:',e.stack||e.message);throw e;}