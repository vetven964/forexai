// V-TRADE AI — Telegram Auto Scanner watchdog / startup hotfix
// V-TRADE V18 — Pre-Market-authoritative confirmed-entry delivery guard
'use strict';
const fs = require('fs');
const path = require('path');
const serverFile = path.join(__dirname, 'server.js');
const marker = 'VTRADE_TELEGRAM_AUTO_WATCHDOG_V18_PREMARKET_AUTHORITY';
const READINESS = 'globalThis.__vtradeTelegramAutoReadinessLog';

try { require('./pre-market-launcher-hook.js'); console.log('[V-TRADE PROCESS SEPARATION] Pre-Market Zone Analysis hook loaded | Telegram=INDEPENDENT | mode=ANALYSIS_ONLY'); }
catch (e) { console.error('[V-TRADE PROCESS SEPARATION] Pre-Market hook load failed:', e.stack || e.message); throw e; }

function patchServer() {
  if (!fs.existsSync(serverFile)) throw new Error('server.js not found');
  let source=fs.readFileSync(serverFile,'utf8'), changed=false;
  const malformedGlobalDecl=new RegExp('\\b(?:let|const|var)\\s+'+READINESS.replace('.','\\.')+'\\s*=\\s*([^;]*);','g');
  if(malformedGlobalDecl.test(source)){source=source.replace(malformedGlobalDecl,READINESS+' = $1;');changed=true;}
  if(source.indexOf('telegramAutoLastReadinessLog')>=0){source=source.split('telegramAutoLastReadinessLog').join(READINESS);source=source.replace(new RegExp('\\b(?:let|const|var)\\s+'+READINESS.replace('.','\\.')+'\\s*=','g'),READINESS+' =');changed=true;}
  if(source.indexOf(READINESS+" = String("+READINESS+" || '')")<0){source="// VTRADE_TELEGRAM_AUTO_WATCHDOG_V18_PREMARKET_AUTHORITY\n"+READINESS+" = String("+READINESS+" || '');\n"+source;changed=true;}
  const stateDefs=[['telegramAutoLastState',"''"],['telegramAutoLastWaitSentAt','0'],['telegramAutoScanCount','0']];
  for(const [name,value] of stateDefs){const globalName='globalThis.__vtrade_'+name;if(source.indexOf(globalName)<0){source=globalName+' = '+globalName+' ?? '+value+';\n'+source;changed=true;}const decl=new RegExp('\\b(?:let|const|var)\\s+'+name+'\\s*=\\s*[^;]+;\\n?','m');if(decl.test(source)){source=source.replace(decl,'');changed=true;}source=source.replace(new RegExp('(?<![A-Za-z0-9_.$])'+name+'\\b','g'),globalName);}
  const envNeedle="const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';";
  const envPatch=`const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_AUTO_TOKEN = process.env.TELEGRAM_AUTO_TOKEN || '';
const TELEGRAM_AUTO_CHAT_ID = process.env.TELEGRAM_AUTO_CHAT_ID || '';
let telegramAutoBot = null;
try { if (TELEGRAM_AUTO_TOKEN) telegramAutoBot = new TelegramBot(TELEGRAM_AUTO_TOKEN, { polling:false }); } catch(e) { console.warn('[TELEGRAM AUTO] isolated bot init failed:',e.message); }
`;
  if(source.indexOf(envNeedle)>=0&&source.indexOf('const TELEGRAM_AUTO_TOKEN =')<0){source=source.replace(envNeedle,envPatch);changed=true;}

  const deliveryMarker='VTRADE_TELEGRAM_CONFIRMED_ENTRY_DELIVERY_V8';
  if(source.indexOf(deliveryMarker)<0){
    const deliveryFn=`
// ${deliveryMarker}
// IMPORTANT: appended after legacy V6/V7 delivery functions so this is the final runtime authority.
globalThis.maybeTelegramAlert = async function(a,tg){
  const signal=String(a?.signal||'').toUpperCase();
  const status=String(a?.status||'').toUpperCase();
  const pre=globalThis.__vtradePreMarketGate||null;
  const preReady=pre?.success===true&&Number(pre?.available||0)>=4;
  const preAll=pre?.gates?.allGatesPassed===true;
  // Pre-Market is analysis-only; broker/order authorization remains false by design.
  // Telegram delivery is allowed only when the same Pre-Market gates reach ENTRY_READY.
  const preEntryReady=pre?.execution?.status==='ENTRY_READY';
  if(!preReady||!preAll||!preEntryReady){
    console.log('[TELEGRAM AUTO] BLOCKED by Pre-Market authority | ready='+!!preReady+' | allGates='+!!preAll+' | entryReady='+!!preEntryReady+' | reason='+String(pre?.execution?.reason||pre?.error||'PREMARKET_NOT_AUTHORIZED'));
    return false;
  }
  const confirmed=(signal==='BUY'||signal==='SELL')&&status.includes('ENTRY CONFIRMED')&&a?.confirmations?.allGatesPassed===true&&Number.isFinite(Number(a?.entry));
  if(!confirmed)return false;
  const tf=String(a.executionTimeframe||a.timeframe||'').trim().toUpperCase();
  const entry=Number(a.entry),sl=Number(a.stopLoss!=null?a.stopLoss:(a.sl!=null?a.sl:a.stop_loss));
  const tps=Array.isArray(a.takeProfit)?a.takeProfit:[];
  const tp1=Number(a.tp1!=null?a.tp1:tps[0]);
  const tp2=a.tp2!=null?Number(a.tp2):(Number.isFinite(Number(tps[1]))?Number(tps[1]):NaN);
  const tp3=a.tp3!=null?Number(a.tp3):(Number.isFinite(Number(tps[2]))?Number(tps[2]):NaN);
  const risk=Math.abs(entry-sl);
  const finite=Number.isFinite(entry)&&Number.isFinite(sl)&&Number.isFinite(tp1)&&Number.isFinite(tp2)&&Number.isFinite(tp3)&&risk>0;
  const geometry=tf&&tf!=='—'&&tf!=='-'&&finite&&(signal==='BUY'?(sl<entry&&entry<tp1&&tp1<tp2&&tp2<tp3):(sl>entry&&entry>tp1&&tp1>tp2&&tp2>tp3));
  const spacing=finite&&(signal==='BUY'?(tp1>=entry+risk&&tp2>=entry+risk*1.5&&tp3>=entry+risk*2):(tp1<=entry-risk&&tp2<=entry-risk*1.5&&tp3<=entry-risk*2));
  const rr=risk>0?Math.abs(tp1-entry)/risk:0;
  if(!geometry||!spacing||!Number.isFinite(rr)||rr<1.3){console.warn('[TELEGRAM AUTO] BLOCKED invalid execution geometry/spacing | signal='+signal+' | tf='+(tf||'MISSING')+' | rr='+rr.toFixed(2));return false;}
  if(!tg?.bot||!tg?.chatId){console.warn('[TELEGRAM AUTO] confirmed valid entry ready but delivery is not configured');return false;}
  const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(2):'WAIT';
  const lines=['🤖 *V TRADE AI — XAUUSD*','',signal==='BUY'?'🟢 *BUY*':'🔴 *SELL*','⏱️ TF: *'+tf+'*','🎯 Entry: *'+fmt(entry)+'*','🛑 SL: *'+fmt(sl)+'*','🎯 TP1: *'+fmt(tp1)+'*','🎯 TP2: *'+fmt(tp2)+'*','🎯 TP3: *'+fmt(tp3)+'*'];
  const confidence=Number(a.confidence);if(Number.isFinite(confidence))lines.push('🧠 Confidence: *'+Math.max(0,Math.min(100,confidence)).toFixed(0)+'/100*');
  await tg.bot.sendMessage(tg.chatId,lines.join('\\n'),{parse_mode:'Markdown'});
  console.log('[TELEGRAM AUTO] VALID ENTRY sent | signal='+signal+' | tf='+tf+' | rr='+rr.toFixed(2)+' | chat='+String(tg.chatId).slice(-4));
  return true;
};
`;
    source=source+'\n'+deliveryFn;
    changed=true;
  }
  if(source.indexOf(marker)<0){source='// '+marker+'\n'+source;changed=true;}
  if(changed)fs.writeFileSync(serverFile,source,'utf8');
  console.log('[V-TRADE TELEGRAM WATCHDOG] active | PreMarket=AUTHORITY | FridayHistory=REFERENCE_ONLY | MondayFreshM5=REQUIRED | finalDeliveryGuard=V8');
}
patchServer();
if(process.env.VTRADE_WATCHDOG_NO_LAUNCHER!=='1')require('./server-launcher.js');
