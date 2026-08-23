/* V-TRADE AI — Sunday/Monday Telegram state hotfix V2 */
'use strict';
const MARKER='VTRADE_SUNDAY_MONDAY_TELEGRAM_STATE_V2';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const marker=`/* ${MARKER} */`;
  let out=source;

  // Use broker/user market-state timezone, never UTC weekday classification.
  const oldWeekend='var weekend=new Date().getUTCDay()===0||new Date().getUTCDay()===6;';
  const newWeekend=`var localDay=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'}).format(new Date());\n    var weekend=localDay==='Sun';\n    var monday=localDay==='Mon';`;
  if(out.includes(oldWeekend)) out=out.replace(oldWeekend,newWeekend);

  // Sunday is historical/pre-open only. Monday must prove that the newest M5 candle is actually Monday.
  const oldClosed=`if(/Closed-candle data is stale/i.test(s)&&weekend)return "• Market closed / ទីផ្សារបិទ — closed-candle history is intentionally retained until fresh MT5 history arrives at market open / ទិន្នន័យ candle ចុងក្រោយត្រូវរក្សាទុក រហូតដល់ MT5 បើក និងផ្តល់ទិន្នន័យថ្មី";`;
  const newClosed=`if(/Closed-candle data is stale/i.test(s)&&weekend)return "• Sunday pre-open / មុនទីផ្សារបើក — Friday closed candle is historical reference only; wait for Monday fresh MT5 M5 history / Candle ថ្ងៃសុក្រ គ្រាន់តែជាទិន្នន័យប្រវត្តិសាស្ត្រ; រង់ចាំ M5 ថ្មីពី MT5 នៅថ្ងៃចន្ទ";\n    if(/Closed-candle data is stale/i.test(s)&&monday)return mondayFreshM5?"": "• Monday fresh M5 candle required / ត្រូវការទិន្នន័យ M5 ថ្មីថ្ងៃចន្ទ — Friday candle remains historical reference / Candle ថ្ងៃសុក្រ នៅតែជាប្រវត្តិសាស្ត្រ";`;
  if(out.includes(oldClosed)) out=out.replace(oldClosed,newClosed);

  // Inject transition-aware freshness into the canonical Telegram formatter.
  const reasonAnchor='var reasons=Array.isArray(a.score?.blockedReasons)?a.score.blockedReasons:[];';
  const reasonPatch=`var mondayFreshM5=(function(){try{if(!monday)return false;var r=a.timeframes?.M5||a.frames?.M5||{};var t=r.candle?.candleTime??r.candleTime??r.lastCandleTime??r.timestamp;var n=Number(t);if(!Number.isFinite(n))return false;var ms=n<1e12?n*1000:n;var d=new Date(ms);var day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'}).format(d);return day==='Mon'&&(Date.now()-ms)<=10*60*1000;}catch(_){return false;}})();\n    var reasons=Array.isArray(a.score?.blockedReasons)?a.score.blockedReasons.slice():[];\n    if(mondayFreshM5) reasons=reasons.filter(function(x){return !/Closed-candle data is stale/i.test(String(x||''));});`;
  if(out.includes(reasonAnchor)) out=out.replace(reasonAnchor,reasonPatch);

  // The canonical formatter's MTF flag must reflect actual core history, not a stale reason list.
  const mtfAnchor='var mtfOk=!mtfBlocked&&(confirmed(a.mtfAligned)||confirmed(a.mtfOk)||confirmed(a.mtfAlignmentOk)||confirmed(g.mtfOk)||confirmed(g.mtfAlignmentOk)||mtfRowsReady||canonicalAvailable||canonicalComplete);';
  const mtfPatch='var mtfOk=!mtfBlocked&&(confirmed(a.mtfAligned)||confirmed(a.mtfOk)||confirmed(a.mtfAlignmentOk)||confirmed(g.mtfOk)||confirmed(g.mtfAlignmentOk)||mtfRowsReady||canonicalAvailable||canonicalComplete||((Number(a.available)>=4&&Number(a.required)>=4)));';
  if(out.includes(mtfAnchor)) out=out.replace(mtfAnchor,mtfPatch);

  if(out.includes('function telegramWaitText(a) {')) out=out.replace('function telegramWaitText(a) {',marker+'\nfunction telegramWaitText(a) {');
  return out;
}

module.exports={patch};
