/* V-TRADE AI — Telegram Pre-Market Signal V2
 * Signal-only child. Reads /api/pre-market/intelligence.
 * D1 -> H4 -> H1 -> M15 -> M5; closed-history bias before current candle.
 * Dynamic target ladder is based on expected move class, not a fixed TP count.
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
const MIN_SCORE=Math.max(55,Number(process.env.TELEGRAM_PREMARKET_MIN_SCORE||62));
const MIN_EDGE=Math.max(5,Number(process.env.TELEGRAM_PREMARKET_MIN_EDGE||10));
const STATE=path.join(__dirname,'data','telegram-last-premarket-signal.json');
if(!TOKEN||!CHAT_ID){console.warn('[V-TRADE PRE-MARKET TELEGRAM V2] disabled: missing Telegram credentials');process.exit(0);}
const bot=new TelegramBot(TOKEN,{polling:false});
let lastKey='';try{lastKey=JSON.parse(fs.readFileSync(STATE,'utf8')).key||'';}catch(e){}
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const F=v=>n(v)==null?'—':Number(v).toFixed(2);
async function get(p){const h={'Cache-Control':'no-cache'};if(KEY)h['X-VTRADE-TELEGRAM-KEY']=KEY;const r=await fetch(CORE_URL+p,{headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.error||`HTTP ${r.status}`);return d;}
function build(a){
 const t=a?.timeframes||{};const W={D1:5,H4:4,H1:3,M15:2,M5:1};let buy=0,sell=0,total=0;const rows={};
 for(const tf of Object.keys(W)){const r=t[tf];if(r?.ready){const b=n(r.buyPct)||0,s=n(r.sellPct)||0;rows[tf]={bias:r.bias,buy:b,sell:s};buy+=b*W[tf];sell+=s*W[tf];total+=100*W[tf];}}
 if(!total||n(a.price)==null)return null;
 buy=buy/total*100;sell=sell/total*100;const side=buy>=sell?'BUY':'SELL',edge=Math.abs(buy-sell);
 const dir=side==='BUY'?'BULLISH':'BEARISH';const aligned=['D1','H4','H1','M15'].filter(tf=>rows[tf]?.bias===dir).length;
 const m5=t.M5||{},m15=t.M15||{},h1=t.H1||{};const liq=m5.liquidity?.side=== (side==='BUY'?'SELL_SIDE_SWEPT':'BUY_SIDE_SWEPT') || m15.liquidity?.side===(side==='BUY'?'SELL_SIDE_SWEPT':'BUY_SIDE_SWEPT');
 const struct=[m5.structure,h1.structure,m15.structure].some(s=>s&&(s.mss===dir||s.bos===dir));
 const pressure=(m5.pressure?.[side==='BUY'?'buy':'sell']||0)+(m15.pressure?.[side==='BUY'?'buy':'sell']||0)>=104;
 const fvg=[m5,m15,h1].flatMap(r=>r.fvg||[]).find(g=>!g.filled&&g.type===(side==='BUY'?'BULLISH':'BEARISH'))||null;
 const confirmations=aligned+(liq?1:0)+(struct?1:0)+(pressure?1:0)+(fvg?1:0);
 const score=Math.round(Math.min(100,50+edge*.8+aligned*4+(liq?6:0)+(struct?6:0)+(pressure?4:0)+(fvg?4:0)));
 if(score<MIN_SCORE||edge<MIN_EDGE||aligned<2||confirmations<3)return {eligible:false,side,score,edge,aligned,confirmations};
 const price=n(a.price),atr=n(m5.atr)||n(m15.atr)||n(h1.atr)||10;let z1=price,z2=price;
 if(fvg){z1=Math.min(fvg.low,fvg.high);z2=Math.max(fvg.low,fvg.high);}else{const c=m5.candle||m15.candle;if(c){z1=Math.min(c.open,c.close);z2=Math.max(c.open,c.close);}}
 const zoneSize=Math.max(Math.abs(z2-z1),atr*.08,2);const risk=Math.max(atr*.35,zoneSize,3);const sl=side==='BUY'?Math.min(z1,price-risk):Math.max(z2,price+risk);const R=Math.abs(price-sl);
 // Target count: 10-20 point move => TP1; 20-50 => TP1/TP2; >50 => TP1/TP2/TP3.
 const expected=Math.max(R*1.5,atr*0.75);const count=expected<=20?1:expected<=50?2:3;const tp=[];for(let i=1;i<=count;i++){const mult=count===1?1.5:i===1?1.5:i===2?2.5:3.5;tp.push(side==='BUY'?price+R*mult:price-R*mult);}
 return {eligible:true,side,score,edge,aligned,confirmations,price,entryZone:[z1,z2],entry:price,sl,tp,expectedMove:expected,atr,rows,checks:{liquidity:liq,mssBos:struct,pressure,fvg:!!fvg}};
}
function save(s,key){fs.mkdirSync(path.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify({...s,key,createdAt:new Date().toISOString()},null,2));}
async function send(s){const icon=s.side==='BUY'?'🟢':'🔴';const lines=['🤖 *V TRADE AI — PRE-MARKET SIGNAL*','',`${icon} *${s.side} XAUUSD*`,`📚 History: *D1 → H4 → H1 → M15 → M5*`,`📈 Direction: *${s.side==='BUY'?'UPTRADE':'DOWNTRADE'}*`,`🧠 Score: *${s.score}/100* | Edge: *${F(s.edge)}*`,`🔎 Confirmations: *${s.confirmations}*`,'',`📍 Enter Zone: *${F(s.entryZone[0])} – ${F(s.entryZone[1])}*`,`🎯 Entry: *${F(s.entry)}*`,`🛑 SL: *${F(s.sl)}*`];s.tp.forEach((v,i)=>lines.push(`🎯 TP${i+1}: *${F(v)}*`));lines.push('',`📏 Expected move: *${F(s.expectedMove)} points*`,`💧 Liquidity: *${s.checks.liquidity?'PASS':'context'}*`,`🔀 MSS/BOS: *${s.checks.mssBos?'PASS':'context'}*`,`⚡ FVG: *${s.checks.fvg?'PASS':'context'}*`,`🕯 Pressure: *${s.checks.pressure?'PASS':'context'}*`,'','⚠️ *SIGNAL ONLY — AUTO ORDER OFF*']);await bot.sendMessage(CHAT_ID,lines.join('\n'),{parse_mode:'Markdown'});}
async function scan(){try{const a=await get('/api/pre-market/intelligence');const s=build(a);if(!s?.eligible)return;const key=[s.side,s.entry,s.sl,...s.tp].map(F).join('|');if(key===lastKey)return;await send(s);lastKey=key;save(s,key);console.log(`[V-TRADE PRE-MARKET TELEGRAM V2] SIGNAL SENT | ${s.side} | score=${s.score} | edge=${F(s.edge)} | confirmations=${s.confirmations} | TP=${s.tp.length}`);}catch(e){console.warn('[V-TRADE PRE-MARKET TELEGRAM V2] scan failed:',e.message);}}
console.log(`[V-TRADE PRE-MARKET TELEGRAM V2] ACTIVE | D1/H4/H1/M15/M5 | poll=${POLL_MS}ms | minScore=${MIN_SCORE} | minEdge=${MIN_EDGE}`);setInterval(scan,POLL_MS);scan();
