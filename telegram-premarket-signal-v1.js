/* V-TRADE AI — Telegram Pre-Market Signal V1
 * PURPOSE: use closed MT5 history BEFORE/AT candle-open to create a practical
 * BUY/SELL candidate for Telegram. This is not an order executor.
 * History: D1 -> H4 -> H1 -> M15 -> M5.
 * Uses weighted MTF direction + liquidity + MSS/BOS + FVG + candle pressure.
 * Dynamic target count: short move=TP1, medium=TP1/TP2, large=TP1/TP2/TP3.
 */
'use strict';
require('dotenv').config();
const TelegramBot=require('node-telegram-bot-api');
const fs=require('fs');
const path=require('path');
const TOKEN=String(process.env.TELEGRAM_TOKEN||'').trim();
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const CORE_URL=String(process.env.VTRADE_CORE_URL||process.env.APP_BASE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const KEY=String(process.env.TELEGRAM_BRIDGE_API_KEY||process.env.MT5_BRIDGE_API_KEY||'').trim();
const POLL_MS=Math.max(15000,Number(process.env.TELEGRAM_PREMARKET_POLL_MS||30000));
const MIN_SCORE=Math.max(55,Number(process.env.TELEGRAM_PREMARKET_MIN_SCORE||68));
const MIN_EDGE=Math.max(8,Number(process.env.TELEGRAM_PREMARKET_MIN_EDGE||18));
const STATE=path.join(__dirname,'data','telegram-last-signal.json');
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE PRE-MARKET TELEGRAM] disabled: missing Telegram credentials');process.exit(0);}
const bot=new TelegramBot(TOKEN,{polling:false});
let lastKey='';
try{lastKey=JSON.parse(fs.readFileSync(STATE,'utf8')).key||'';}catch(e){}
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const F=v=>n(v)==null?'—':Number(v).toFixed(2);
async function get(p){const h={'Cache-Control':'no-cache'};if(KEY)h['X-VTRADE-TELEGRAM-KEY']=KEY;const r=await fetch(CORE_URL+p,{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);return d;}
function tfRows(x){return x?.timeframes||{};}
function scoreRow(r){return r?.ready?{buy:n(r.buyPct)||0,sell:n(r.sellPct)||0,bias:String(r.bias||'NEUTRAL')}:null;}
function build(a){
 const t=tfRows(a);const weights={M5:1,M15:2,H1:3,H4:4,D1:5};let buy=0,sell=0,total=0;const rows={};
 for(const tf of Object.keys(weights)){const r=scoreRow(t[tf]);rows[tf]=r;if(r){buy+=r.buy*weights[tf];sell+=r.sell*weights[tf];total+=100*weights[tf];}}
 if(!total)return null;
 buy=buy/total*100;sell=sell/total*100;const edge=Math.abs(buy-sell);const side=buy>sell?'BUY':'SELL';
 const aligned=['D1','H4','H1'].filter(tf=>rows[tf]?.bias===(side==='BUY'?'BULLISH':'BEARISH')).length;
 const last=t.M5||t.M15||{};const m15=t.M15||{};const liq=m15.liquidity||last.liquidity||{};const st=m15.structure||last.structure||{};const fvg=(m15.fvg||last.fvg||[]).find(g=>!g.filled&&g.type===(side==='BUY'?'BULLISH':'BEARISH'))||null;
 const pressure=m15.pressure||last.pressure||{};const atr=n(m15.atr||last.atr)||10;const price=n(a.price||last.price||m15.price);if(price==null)return null;
 const liqPass=side==='BUY'?liq.side==='SELL_SIDE_SWEPT':liq.side==='BUY_SIDE_SWEPT';
 const structPass=side==='BUY'?(st.mss==='BULLISH'||st.bos==='BULLISH'):(st.mss==='BEARISH'||st.bos==='BEARISH');
 const fvgPass=!!fvg;const pressurePass=side==='BUY'?pressure.buy>=52:pressure.sell>=52;
 const confirmations=aligned+(liqPass?1:0)+(structPass?1:0)+(fvgPass?1:0)+(pressurePass?1:0);
 const score=Math.round(Math.min(100,50+edge*.65+aligned*5+(liqPass?5:0)+(structPass?5:0)+(fvgPass?3:0)));
 if(score<MIN_SCORE||edge<MIN_EDGE||aligned<2||confirmations<4)return {eligible:false,score,edge,side,confirmations,aligned,price,reason:'pre-market confirmation not strong enough'};
 let zoneLow=price,zoneHigh=price;
 if(fvg){zoneLow=Math.min(fvg.low,fvg.high);zoneHigh=Math.max(fvg.low,fvg.high);} else if(m15.candle){const c=m15.candle;zoneLow=Math.min(c.open,c.close);zoneHigh=Math.max(c.open,c.close);}
 const entry=price;const risk=Math.max(atr*.45,Math.abs(zoneHigh-zoneLow),3);let sl;
 if(side==='BUY')sl=Math.min(zoneLow,entry-risk);else sl=Math.max(zoneHigh,entry+risk);
 const r=Math.max(0.01,Math.abs(entry-sl));
 const move=r*1.5;const count=move<=15?1:move<=30?2:3;const tp=[];for(let i=1;i<=count;i++)tp.push(side==='BUY'?entry+r*(1.5+(i-1)):entry-r*(1.5+(i-1)));
 return {eligible:true,side,price,score,edge,aligned,confirmations,entry,entryZone:[zoneLow,zoneHigh],sl,tp,atr,move,count,mtf:rows,checks:{liquidity:liqPass,mssBos:structPass,fvg:fvgPass,pressure:pressurePass}};
}
function save(s,key){fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify({...s,key,createdAt:new Date().toISOString()},null,2));}
async function send(s){const icon=s.side==='BUY'?'🟢':'🔴';const t=s.tp;const lines=['🤖 *V TRADE AI — PRE-MARKET SIGNAL*','',`${icon} *${s.side} XAUUSD*`,`📊 MTF History: *D1 → H4 → H1 → M15 → M5*`,`💰 Price: *${F(s.price)}*`,`📈 Direction: *${s.side==='BUY'?'UPTRADE':'DOWNTRADE'}*`,`🧠 Score: *${s.score}/100*`,`📐 MTF Edge: *${F(s.edge)}*`,`🔎 Confirmations: *${s.confirmations}*`,``,`🎯 Entry Zone: *${F(s.entryZone[0])} – ${F(s.entryZone[1])}*`,`🎯 Entry: *${F(s.entry)}*`,`🛑 SL: *${F(s.sl)}*`];t.forEach((v,i)=>lines.push(`🎯 TP${i+1}: *${F(v)}*`));lines.push('',`💹 Move class: *${F(s.move)}*`,`🔹 Liquidity: *${s.checks.liquidity?'PASS':'context'}*`,`🔹 MSS/BOS: *${s.checks.mssBos?'PASS':'context'}*`,`🔹 FVG: *${s.checks.fvg?'PASS':'context'}*`,`🔹 Candle pressure: *${s.checks.pressure?'PASS':'context'}*`,'','⚠️ *SIGNAL ONLY — AUTO ORDER OFF*');await bot.sendMessage(CHAT_ID,lines.join('\n'),{parse_mode:'Markdown'});}
async function scan(){try{const d=await get('/api/pre-market/intelligence');const s=build(d);if(!s?.eligible)return;const key=[s.side,s.entry,s.sl,...s.tp].map(F).join('|');if(key===lastKey)return;await send(s);lastKey=key;save(s,key);console.log(`[V-TRADE PRE-MARKET TELEGRAM] SIGNAL SENT | ${s.side} | score=${s.score} | confirmations=${s.confirmations} | TP=${s.count}`);}catch(e){console.warn('[V-TRADE PRE-MARKET TELEGRAM] scan failed:',e.message);}}
console.log(`[V-TRADE PRE-MARKET TELEGRAM] ACTIVE | history=D1/H4/H1/M15/M5 | poll=${POLL_MS}ms | minScore=${MIN_SCORE} | minEdge=${MIN_EDGE}`);
setInterval(()=>scan().catch(()=>{}),POLL_MS);scan().catch(()=>{});
