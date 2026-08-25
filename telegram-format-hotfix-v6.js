// V-TRADE AI — Telegram compact signal formatter V7.2
// Presentation + delivery wiring hotfix. ICT authorization remains unchanged.
'use strict';
const fs=require('fs');
const path=require('path');
const TARGET=path.resolve(__dirname,'telegram-bot-ai-service.js');
const FORMAT_MARKER='VTRADE_TELEGRAM_COMPACT_FORMAT_V7_1';
const DELIVERY_MARKER='VTRADE_TELEGRAM_CANONICAL_WAIT_DELIVERY_V2';
function patch(){
  if(!fs.existsSync(TARGET))throw new Error('telegram-bot-ai-service.js not found');
  let source=fs.readFileSync(TARGET,'utf8');
  if(!source.includes(FORMAT_MARKER)){
    const start=source.indexOf('function formatSignal(a)');
    const end=source.indexOf('\nasync function scan(',start);
    if(start<0||end<0)throw new Error('formatSignal anchors not found');
    const replacement=[
      'function formatSignal(a){',
      '  // '+FORMAT_MARKER,
      "  const side=a.signal==='BUY'?'🟢 BUY':a.signal==='SELL'?'🔴 SELL':'🟡 WAIT';",
      '  const tp=Array.isArray(a.takeProfit)?a.takeProfit:[];',
      "  const fmt=v=>v==null||!Number.isFinite(Number(v))?'WAIT':Number(v).toFixed(2);",
      '  const isAuth=a.tradeAuthorized===true;',
      '  const g=a.gates&&typeof a.gates===\'object\'?a.gates:{};',
      "  const gate=v=>v===true?'PASS':v===false?'WAIT':String(v??'WAIT').toUpperCase();",
      "  const transition=typeof a.transition==='string'?a.transition:(a.transition?.phase||'LIVE MARKET');",
      "  const gates=[gate(g.liquiditySweep),gate(g.mss),gate(g.bos),gate(g.displacement),gate(g.fvg),gate(g.orderBlock),gate(g.premiumDiscount),gate(g.executionZone)].join(' | ');",
      "  const mom=gate(g.momentum);",
      "  const spread=gate(g.spread);",
      '  const lines=[',
      "    '🤖 *V TRADE AI — XAUUSD*',",
      "    '💰 '+fmt(a.price)+' | *'+side+'*',",
      "    '📈 *'+String(a.bias||'NEUTRAL')+'* | Score *'+Math.round(Number(a.directionScore)||0)+'/100* | Conf *'+Math.round(Number(a.confidence)||0)+'/100*',",
      "    '⏱️ *'+String(transition).replaceAll('_',' ')+'* | 🔎 ICT *'+String(a.gateCount||'0/10')+'*',",
      "    '💧 '+gates,",
      "    '📍 Mom '+mom+' | Spread '+spread,",
      "    '🎯 Entry *'+(isAuth?fmt(a.entry):'WAIT')+'* | SL *'+(isAuth?fmt(a.stopLoss):'WAIT')+'*',",
      "    '🎯 TP1 *'+(isAuth?fmt(tp[0]):'WAIT')+'* | TP2 *'+(isAuth?fmt(tp[1]):'WAIT')+'* | TP3 *'+(isAuth?fmt(tp[2]):'WAIT')+'*',",
      "    '',",
      "    (isAuth?'🔐 *SIGNAL AUTHORIZED*':'⏳ *WAIT — NO ORDER*'),",
      "    '🧠 '+String(a.reason||'Setup incomplete')",
      '  ];',
      "  return lines.join('\\n');",
      '}'
    ].join('\n');
    source=source.slice(0,start)+replacement+source.slice(end);
    fs.writeFileSync(TARGET,source,'utf8');
    console.log('[V-TRADE TELEGRAM] compact formatter V7.1 installed');
  }
  source=fs.readFileSync(TARGET,'utf8');
  if(!source.includes(DELIVERY_MARKER)){
    const scanSig='async function scan(sendWait=false)';
    if(source.includes(scanSig)){
      source=source.replace(scanSig,`async function scan(sendWait=true)\n/* ${DELIVERY_MARKER}: canonical Telegram AI owns WAIT delivery; interval scans may deliver WAIT once per signal/candle key. */`);
      fs.writeFileSync(TARGET,source,'utf8');
      console.log('[V-TRADE TELEGRAM] canonical WAIT delivery V2 active | scan default=send');
    }else{
      throw new Error('scan delivery anchor not found');
    }
  }
}
try{patch();}catch(e){console.error('[V-TRADE TELEGRAM] V7.2 hotfix failed:',e.stack||e.message);throw e;}
