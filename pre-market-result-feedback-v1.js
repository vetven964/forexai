/* V-TRADE AI — Pre-Market Result Feedback V1
 * Read-only feedback layer. It never places orders and never weakens hard safety gates.
 * Uses persisted Telegram result history to identify repeated losing directions/setups.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const HISTORY_FILE=path.join(__dirname,'data','telegram-signal-history.jsonl');
const OUT_FILE=path.join(__dirname,'data','pre-market-result-feedback.json');
const MIN_SAMPLE=Math.max(3,Number(process.env.VTRADE_FEEDBACK_MIN_SAMPLE||5));
const LOOKBACK=Math.max(20,Number(process.env.VTRADE_FEEDBACK_LOOKBACK||100));
function num(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function read(){if(!fs.existsSync(HISTORY_FILE))return [];return fs.readFileSync(HISTORY_FILE,'utf8').split(/\r?\n/).filter(Boolean).slice(-LOOKBACK).map(x=>{try{return JSON.parse(x);}catch{return null;}}).filter(Boolean);}
function side(x){const s=String(x?.side||x?.signal||x?.direction||'').toUpperCase();return s==='BUY'||s==='SELL'?s:null;}
function result(x){const r=String(x?.result||x?.finalResult||x?.status||'').toUpperCase();if(r.includes('SL')||r.includes('LOSS'))return 'LOSS';if(r.includes('TP')||r.includes('WIN'))return 'WIN';return null;}
function build(){const rows=read();const stats={BUY:{wins:0,losses:0},SELL:{wins:0,losses:0}};for(const r of rows){const s=side(r),z=result(r);if(s&&z)stats[s][z==='WIN'?'wins':'losses']++;}
 const out={generatedAt:new Date().toISOString(),sample:rows.length,minSample:MIN_SAMPLE,stats};
 for(const s of ['BUY','SELL']){const t=stats[s].wins+stats[s].losses;out.stats[s].count=t;out.stats[s].winRate=t?Number((stats[s].wins/t*100).toFixed(1)):null;out.stats[s].penalty=t>=MIN_SAMPLE&&stats[s].winRate<40?Math.min(12,Math.round((40-stats[s].winRate)/3)):0;out.stats[s].reason=out.stats[s].penalty?`Repeated ${s} losses in recent history`:'No feedback penalty';}
 fs.mkdirSync(path.dirname(OUT_FILE),{recursive:true});fs.writeFileSync(OUT_FILE,JSON.stringify(out,null,2));return out;}
const out=build();
console.log(`[V-TRADE FEEDBACK] ACTIVE | samples=${out.sample} | BUY=${out.stats.BUY.winRate??'N/A'}% | SELL=${out.stats.SELL.winRate??'N/A'}%`);
module.exports={build,OUT_FILE};
