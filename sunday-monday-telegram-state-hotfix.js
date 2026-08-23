/* V-TRADE AI — Sunday/Monday Telegram state hotfix V1 */
'use strict';
const MARKER='VTRADE_SUNDAY_MONDAY_TELEGRAM_STATE_V1';

function patch(source){
  if(!source || source.includes(MARKER)) return source;
  const marker=`/* ${MARKER} */`;
  let out=source;
  const oldWeekend='var weekend=new Date().getUTCDay()===0||new Date().getUTCDay()===6;';
  const newWeekend=`var localDay=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Phnom_Penh',weekday:'short'}).format(new Date());\n    var weekend=localDay==='Sun';\n    var monday=localDay==='Mon';`;
  if(out.includes(oldWeekend)) out=out.replace(oldWeekend,newWeekend);
  const oldClosed=`if(/Closed-candle data is stale/i.test(s)&&weekend)return "• Market closed / ទីផ្សារបិទ — closed-candle history is intentionally retained until fresh MT5 history arrives at market open / ទិន្នន័យ candle ចុងក្រោយត្រូវរក្សាទុក រហូតដល់ MT5 បើក និងផ្តល់ទិន្នន័យថ្មី";`;
  const newClosed=`if(/Closed-candle data is stale/i.test(s)&&weekend)return "• Sunday pre-open / មុនទីផ្សារបើក — Friday closed candle is historical reference only; wait for Monday fresh MT5 M5 history / Candle ថ្ងៃសុក្រ គ្រាន់តែជាទិន្នន័យប្រវត្តិសាស្ត្រ; រង់ចាំ M5 ថ្មីពី MT5 នៅថ្ងៃចន្ទ";\n    if(/Closed-candle data is stale/i.test(s)&&monday)return "• Monday fresh M5 candle required / ត្រូវការទិន្នន័យ M5 ថ្មីថ្ងៃចន្ទ — Friday candle remains historical reference / Candle ថ្ងៃសុក្រ នៅតែជាប្រវត្តិសាស្ត្រ";`;
  if(out.includes(oldClosed)) out=out.replace(oldClosed,newClosed);
  const anchor='function telegramWaitText(a) {';
  if(out.includes(anchor)) out=out.replace(anchor,marker+'\n'+anchor);
  return out;
}

module.exports={patch};
