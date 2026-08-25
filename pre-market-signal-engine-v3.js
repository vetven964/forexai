/* V-TRADE AI — Pre-Market Signal Engine V3
 * Computes a candidate from closed MTF history and result feedback.
 * Safety: no order execution. Feedback can reduce confidence but never bypasses hard gates.
 */
'use strict';
const fs=require('fs');const path=require('path');
const FEEDBACK_FILE=path.join(__dirname,'data','pre-market-result-feedback.json');
const MIN_SCORE=Number(process.env.PREMARKET_V3_MIN_SCORE||58);
const MIN_EDGE=Number(process.env.PREMARKET_V3_MIN_EDGE||6);
function n(v){const x=Number(v);return Number.isFinite(x)?x:null;}
function loadFeedback(){try{return JSON.parse(fs.readFileSync(FEEDBACK_FILE,'utf8'));}catch{return null;}}
function feedbackPenalty(side,fb){return Math.max(0,Math.min(12,n(fb?.stats?.[side]?.penalty)||0));}
function evaluate(input){
 const t=input?.timeframes||{};const w={D1:5,H4:4,H1:3,M15:2,M5:1};let buy=0,sell=0,total=0;
 for(const [tf,wt] of Object.entries(w)){const r=t[tf];if(!r?.ready)continue;buy+=(n(r.buyPct)||0)*wt;sell+=(n(r.sellPct)||0)*wt;total+=100*wt;}
 if(!total)return {eligible:false,reason:'MTF history not ready'};
 buy=buy/total*100;sell=sell/total*100;const rawSide=buy>=sell?'BUY':'SELL';const edge=Math.abs(buy-sell);const fb=loadFeedback();const penalty=feedbackPenalty(rawSide,fb);const score=Math.max(0,Math.round(Math.min(100,50+edge*.65)-penalty));
 const bias=rawSide==='BUY'?'BULLISH':'BEARISH';const aligned=['D1','H4','H1'].filter(tf=>String(t[tf]?.bias||'').toUpperCase()===bias).length;
 const m=t.M15||t.M5||{};const liq=m.liquidity||{};const st=m.structure||{};const pressure=m.pressure||{};const fvg=(m.fvg||[]).some(x=>!x.filled&&String(x.type||'').toUpperCase()===(rawSide==='BUY'?'BULLISH':'BEARISH'));
 const liquidity=rawSide==='BUY'?liq.side==='SELL_SIDE_SWEPT':liq.side==='BUY_SIDE_SWEPT';
 const structure=rawSide==='BUY'?(st.mss==='BULLISH'||st.bos==='BULLISH'):(st.mss==='BEARISH'||st.bos==='BEARISH');
 const candle=rawSide==='BUY'?(n(pressure.buy)||0)>=52:(n(pressure.sell)||0)>=52;
 const confirmations=aligned+(liquidity?1:0)+(structure?1:0)+(fvg?1:0)+(candle?1:0);
 const hardReady=aligned>=2&&confirmations>=4&&edge>=MIN_EDGE&&score>=MIN_SCORE;
 return {eligible:hardReady,side:rawSide,buy:Number(buy.toFixed(2)),sell:Number(sell.toFixed(2)),edge:Number(edge.toFixed(2)),score,feedbackPenalty:penalty,aligned,confirmations,checks:{liquidity,structure,fvg,candle},reason:hardReady?'AUTHORIZED':'confirmation threshold not met'};
}
module.exports={evaluate};
if(require.main===module){console.log(JSON.stringify(evaluate({timeframes:{}}),null,2));}
