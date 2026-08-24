// V-TRADE AI — Telegram compact signal formatter V6
// Presentation-only patch: keeps ICT gates, authorization and execution logic unchanged.
'use strict';
const fs=require('fs');
const path=require('path');

const TARGET=path.resolve(__dirname,'telegram-bot-ai-service.js');
const MARKER='VTRADE_TELEGRAM_COMPACT_FORMAT_V6';

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
    '  const g=a.gates||{};',
    "  const fmt=v=>v==null||!Number.isFinite(Number(v))?'WAIT':Number(v).toFixed(2);",
    '  const context=transitionLabel(a.transition);',
    '  const isAuth=a.tradeAuthorized===true;',
    "  const reasons=String(a.reason||'Setup incomplete').split(';').map(x=>x.trim()).filter(Boolean);",
    "  const compactReason=isAuth?'All gates passed':(reasons.length?reasons[0]:'Setup incomplete');",
    '  const lines=[',
    "    '🤖 *V TRADE AI — XAUUSD*',",
    "    '💰 '+fmt(a.price)+' | *'+side+'*',",
    "    '📈 *'+String(a.bias||'NEUTRAL')+'* | Score *'+fmt(a.directionScore)+'/100* | Confidence *'+fmt(a.confidence)+'/100*',",
    "    '⏱️ *'+context+'*',",
    "    '🔎 ICT *'+(a.gateCount||'0/10')+'*',",
    "    '💧 Sweep *'+(g.liquiditySweep?'PASS':'WAIT')+'* | MSS *'+(g.mss?'PASS':'WAIT')+'* | BOS *'+(g.bos?'PASS':'WAIT')+'*',",
    "    '⚡ Disp *'+(g.displacement?'PASS':'WAIT')+'* | FVG *'+(g.fvg?'PASS':'WAIT')+'* | OB *'+(g.orderBlock?'PASS':'WAIT')+'*',",
    "    '📍 P/D *'+(g.premiumDiscount?'PASS':'WAIT')+'* | Mom *'+(g.momentum?'PASS':'WAIT')+'* | Spread *'+(g.spread?'PASS':'WAIT')+'*'",
    '  ];',
    '  if(isAuth){',
    '    lines.push(',
    "      '🎯 Entry *'+fmt(a.entry)+'* | SL *'+fmt(a.stopLoss)+'*',",
    "      '🎯 TP1 *'+fmt(tp[0])+'* | TP2 *'+fmt(tp[1])+'* | TP3 *'+fmt(tp[2])+'*',",
    "      '📐 RR *'+String(a.rr||'WAIT')+'*',",
    "      '',",
    "      '🔐 *SIGNAL AUTHORIZED — AUTO ORDER OFF*'",
    '    );',
    '  }else{',
    '    lines.push(',
    "      '🎯 Entry *WAIT* | SL *WAIT*',",
    "      '🎯 TP1 *WAIT* | TP2 *WAIT* | TP3 *WAIT*',",
    "      '',",
    "      '⏳ *WAIT — NO ORDER*',",
    "      '🧠 '+compactReason",
    '    );',
    '  }',
    "  return lines.join('\\n');",
    '}'
  ].join('\n');
  source=source.slice(0,start)+replacement+source.slice(end);
  fs.writeFileSync(TARGET,source,'utf8');
  console.log('[V-TRADE TELEGRAM] compact formatter V6 installed');
}
try{patch();}catch(e){console.error('[V-TRADE TELEGRAM] compact formatter V6 failed:',e.stack||e.message);throw e;}
