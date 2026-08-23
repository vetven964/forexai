// V-TRADE AI — Telegram gate diagnostic (non-invasive)
'use strict';
const marker = 'VTRADE_TELEGRAM_GATE_DIAGNOSTIC_V1';
function normalize(v) { if (v === true) return 'PASS'; if (v === false) return 'WAIT'; if (v == null || v === '') return 'MISSING'; return String(v); }
function diagnose(a) {
  const c = a && a.confirmations || {}, wf = a && a.workflow || {}, ict = a && a.ict || {};
  const gates = {'MSS/BOS':normalize(c.mssBos??c.mss??ict.mssBos??a.mssBos),'Liquidity':normalize(c.liquiditySweep??c.liquidity??ict.liquiditySweep??a.liquiditySweep),'FVG':normalize(c.fvg??ict.fvg??a.fvg),'OB':normalize(c.ob??ict.ob??a.ob),'MTF':normalize(c.mtf??c.mtfAlignment??wf.mtf??a.mtf),'Entry Zone':normalize(c.entryZone??c.zone??wf.entryZone??a.entryZone),'RR':normalize(c.rr??c.riskReward??wf.riskReward??a.riskReward),'AI Confirm':normalize(c.aiConfirmation??c.aiConfirm??a.aiConfirmation??a.aiConfirm)};
  const failed=Object.entries(gates).filter(([,v])=>v!=='PASS');
  console.log('[V-TRADE GATES] '+Object.entries(gates).map(([k,v])=>k+'='+v).join(' | '));
  console.log('[V-TRADE GATES] result='+(failed.length?'WAIT':'PASS')+' | failed='+(failed.length?failed.map(([k])=>k).join(','):'none'));
  return gates;
}
globalThis.__vtradeGateDiagnose=globalThis.__vtradeGateDiagnose||diagnose;
console.log('[V-TRADE GATES] diagnostic module active | '+marker);
module.exports={diagnose};
