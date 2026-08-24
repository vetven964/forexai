/* V TRADE AI — PHONE INTERACTION V17
 * Phone-only: direct delegation for the real Pre-Market controls.
 * Uses the LIVE server routes that actually exist: /api/pre-market/xauusd + /api/pre-market/ai.
 */
(()=>{
'use strict';
if(!window.matchMedia||!matchMedia('(max-width:900px)').matches||window.__VTRADE_PHONE_INTERACTION_V17__)return;
window.__VTRADE_PHONE_INTERACTION_V17__=true;
const TFS=['M5','M15','H1','H4','D1'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const fmt=v=>num(v)==null?'—':Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const conn=()=>window.VTRADE_CONNECTION;
async function get(path){
 const c=conn();
 if(!c?.fetch||!c?.api)throw Error('Backend connection layer unavailable');
 const r=await c.fetch(c.api(path),{credentials:'omit',cache:'no-store',mode:'cors'});
 const d=await r.json().catch(()=>({}));
 if(!r.ok||d?.success===false)throw Error(d?.error||`HTTP ${r.status}`);
 return d;
}
function row(s,tf){return s?.timeframes?.[tf]||s?.frames?.[tf]||s?.mtf?.timeframes?.[tf]||s?.mtf?.[tf]||s?.analysis?.timeframes?.[tf]||{};}
function host(){return document.getElementById('vtradePreMarket');}
function panel(){let p=document.getElementById('vtradePhoneSelectedTF');const h=host();if(!h)return null;if(!p){p=document.createElement('div');p.id='vtradePhoneSelectedTF';p.style.cssText='margin-top:10px;padding:12px;border:1px solid #263650;border-radius:13px;background:#080f1b;color:#dbe5f5;font-size:11px;line-height:1.55;position:relative;z-index:10050;';h.insertBefore(p,h.firstChild)}return p;}
function busy(tf){const p=panel();if(p)p.innerHTML=`<b style="color:#35d8ff">PHONE ANALYZE · ${esc(tf)}</b><br>Loading live MT5 XAUUSD snapshot…`;}
function render(s,tf,ai){
 const p=panel();if(!p)return;
 const r=row(s,tf),c=r.candle||r.openCandle||r.lastCandle||{};
 const bias=String(r.bias||r.direction||s?.bias||s?.directionBand||'NEUTRAL').toUpperCase();
 const score=num(r.directionScore??r.score??s?.directionScore);
 const buy=num(r.buyPct??r.buyStrengthPct??r.buyScore??s?.buyStrengthPct);
 const sell=num(r.sellPct??r.sellStrengthPct??r.sellScore??s?.sellStrengthPct);
 const ac=ai?.ai||ai||{};const decision=String(ac.decision||ac.signal||'WAIT').toUpperCase();
 const color=decision.includes('BUY')?'#22e58a':decision.includes('SELL')?'#ff5968':'#f2c94c';
 const gates=r.gates||r.confirmations||s?.gates||s?.confirmations||{};
 const keys=['liquiditySweep','mss','bos','displacement','fvg','orderBlock','premiumDiscountOk','executionZone','technicalMomentumOk','spreadOk'];
 const passed=keys.filter(k=>gates[k]===true||String(gates[k]).toUpperCase()==='PASS').length;
 const candle={open:c.open??r.open,high:c.high??r.high,low:c.low??r.low,close:c.close??r.close};
 p.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:14px">Selected TF · ${esc(tf)}</b><b style="color:${color}">${esc(decision)}</b></div><div style="margin-top:7px">MTF Bias: <b style="color:${bias==='BULLISH'?'#22e58a':bias==='BEARISH'?'#ff5968':'#f2c94c'}">${esc(bias)}</b> · Score ${score??'—'}/100 · BUY ${buy??'—'}% / SELL ${sell??'—'}%</div><div style="margin-top:7px"><b>Open Candle</b> · O ${fmt(candle.open)} · H ${fmt(candle.high)} · L ${fmt(candle.low)} · C ${fmt(candle.close)}</div><div style="margin-top:7px"><b>ICT Gates</b> · ${passed}/10 passed · ${s?.complete?'MT5 5/5 mapped':'MT5 core live'}</div>${ac.confidence!=null?`<div style="margin-top:7px"><b>AI Confirmation</b> · ${num(ac.confidence)}/100</div>`:''}<div style="margin-top:7px;color:#8493ab">AI confirmation only · no order authorization.</div>`;
}
async function analyze(tf){
 tf=TFS.includes(tf)?tf:'M15';busy(tf);
 try{
  /* IMPORTANT: mt5-authoritative is not a server route in the current build. */
  const s=await get(`/api/pre-market/xauusd?_=${Date.now()}`);
  let ai=null;
  try{ai=await get(`/api/pre-market/ai?tf=${encodeURIComponent(tf)}&_=${Date.now()}`)}catch(e){console.warn('[V-TRADE PHONE V17] AI optional confirmation unavailable:',e?.message||e)}
  render(s,tf,ai);
 }catch(e){const p=panel();if(p)p.innerHTML=`<b style="color:#ff5968">PHONE ANALYZE FAILED</b><br>${esc(e?.message||e)}<br><span style="color:#8493ab">No fabricated market data or signal.</span>`;console.error('[V-TRADE PHONE V17]',e)}
}
function wire(){
 const h=host();if(!h)return;
 /* Directly own the actual V91 buttons; do not depend on the extra phone bridge. */
 h.querySelectorAll('[data-v91tf]').forEach(b=>{if(b.dataset.v17==='1')return;b.dataset.v17='1';const go=e=>{e.preventDefault();e.stopPropagation();const tf=String(b.getAttribute('data-v91tf')).toUpperCase();if(TFS.includes(tf))analyze(tf)};b.addEventListener('click',go,{capture:true});b.addEventListener('pointerup',go,{capture:true});b.addEventListener('touchend',go,{capture:true,passive:false})});
 const ai=h.querySelector('#v91Analyze');if(ai&&ai.dataset.v17!=='1'){ai.dataset.v17='1';const go=e=>{e.preventDefault();e.stopPropagation();const tf=h.querySelector('[data-v91tf].on')?.getAttribute('data-v91tf')||'M15';analyze(tf)};ai.addEventListener('click',go,{capture:true});ai.addEventListener('pointerup',go,{capture:true});ai.addEventListener('touchend',go,{capture:true,passive:false})}
 const phone=document.getElementById('vtradePhoneTfHost');if(phone&&phone.dataset.v17!=='1'){phone.dataset.v17='1';const s=phone.querySelector('select'),b=phone.querySelector('button');const go=e=>{e?.preventDefault();e?.stopPropagation();analyze(TFS.includes(s?.value)?s.value:'M15')};s?.addEventListener('change',go,{capture:true});s?.addEventListener('input',go,{capture:true});b?.addEventListener('click',go,{capture:true});b?.addEventListener('pointerup',go,{capture:true});b?.addEventListener('touchend',go,{capture:true,passive:false})}
}
const run=()=>{if(!matchMedia('(max-width:900px)').matches)return;wire();setTimeout(run,300)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
})();
