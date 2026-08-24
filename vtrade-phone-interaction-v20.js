/* V TRADE AI — PHONE INTERACTION V20
 * Phone-only, self-contained interaction owner.
 * M5/M15/H1/H4/D1 + Analyze AI use the live pre-market API directly.
 * No dependency on hidden desktop handlers.
 */
(()=>{
'use strict';
if(!window.matchMedia || !window.matchMedia('(max-width:900px)').matches || window.__VTRADE_PHONE_INTERACTION_V20__) return;
window.__VTRADE_PHONE_INTERACTION_V20__=true;
const TFS=['M5','M15','H1','H4','D1'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const fmt=v=>num(v)==null?'—':Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const host=()=>document.getElementById('vtradePreMarket');
const conn=()=>window.VTRADE_CONNECTION;
async function get(path){
 const c=conn();
 if(!c?.fetch || !c?.api) throw Error('Backend connection layer unavailable');
 const r=await c.fetch(c.api(path),{credentials:'omit',cache:'no-store',mode:'cors'});
 const d=await r.json().catch(()=>({}));
 if(!r.ok || d?.success===false) throw Error(d?.error||`HTTP ${r.status}`);
 return d;
}
function row(s,tf){return s?.timeframes?.[tf]||s?.frames?.[tf]||s?.mtf?.timeframes?.[tf]||s?.mtf?.[tf]||s?.analysis?.timeframes?.[tf]||{};}
function panel(){
 const h=host(); if(!h) return null;
 let p=document.getElementById('vtradePhoneSelectedTF');
 if(!p){p=document.createElement('div');p.id='vtradePhoneSelectedTF';p.className='vtrade-phone-result';h.insertBefore(p,h.firstChild)}
 return p;
}
function setSelect(tf){const s=document.querySelector('#vtradePhoneTfHost select');if(s&&TFS.includes(tf))s.value=tf}
function setActiveNative(tf){
 const h=host(); const b=h?.querySelector(`[data-v91tf="${tf}"]`); if(!b) return false;
 try{b.click();return true}catch(_){try{b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch(e){return false}}
}
function busy(tf){const p=panel();if(p)p.innerHTML=`<div class="vtrade-phone-result-head"><b>Selected TF · ${esc(tf)}</b><b class="cyan">ANALYZING…</b></div><div class="vtrade-phone-muted">Loading live MT5 XAUUSD data…</div>`}
function render(s,tf,ai){
 const p=panel(); if(!p)return;
 const r=row(s,tf), c=r.candle||r.openCandle||r.lastCandle||{};
 const bias=String(r.bias||r.direction||s?.bias||'NEUTRAL').toUpperCase();
 const score=num(r.directionScore??r.score??s?.directionScore);
 const buy=num(r.buyPct??r.buyStrengthPct??r.buyScore??s?.buyStrengthPct);
 const sell=num(r.sellPct??r.sellStrengthPct??r.sellScore??s?.sellStrengthPct);
 const ac=ai?.ai||ai||{};
 const decision=String(ac.decision||ac.signal||'WAIT').toUpperCase();
 const color=decision.includes('BUY')?'green':decision.includes('SELL')?'red':'gold';
 const gates=r.gates||r.confirmations||s?.gates||s?.confirmations||{};
 const keys=['liquiditySweep','mss','bos','displacement','fvg','orderBlock','premiumDiscountOk','executionZone','technicalMomentumOk','spreadOk'];
 const passed=keys.filter(k=>gates[k]===true||String(gates[k]).toUpperCase()==='PASS').length;
 const candle={open:c.open??r.open,high:c.high??r.high,low:c.low??r.low,close:c.close??r.close};
 p.innerHTML=`<div class="vtrade-phone-result-head"><b>Selected TF · ${esc(tf)}</b><b class="${color}">${esc(decision)}</b></div><div>MTF Bias: <b class="${bias==='BULLISH'?'green':bias==='BEARISH'?'red':'gold'}">${esc(bias)}</b> · Score ${score??'—'}/100</div><div>BUY ${buy??'—'}% · SELL ${sell??'—'}%</div><div><b>Open Candle</b> · O ${fmt(candle.open)} · H ${fmt(candle.high)} · L ${fmt(candle.low)} · C ${fmt(candle.close)}</div><div><b>ICT Gates</b> · ${passed}/10 passed · MT5 live</div>${ac.confidence!=null?`<div><b>AI Confirmation</b> · ${num(ac.confidence)}/100</div>`:''}<div class="vtrade-phone-muted">AI confirmation only · no order authorization.</div>`;
}
async function analyze(tf){
 tf=TFS.includes(tf)?tf:'M15'; setSelect(tf); setActiveNative(tf); busy(tf);
 try{
  const s=await get(`/api/pre-market/xauusd?_=${Date.now()}`);
  let ai=null;
  try{ai=await get(`/api/pre-market/ai?tf=${encodeURIComponent(tf)}&_=${Date.now()}`)}catch(e){console.warn('[V-TRADE PHONE V20] optional AI unavailable:',e?.message||e)}
  render(s,tf,ai);
  document.dispatchEvent(new CustomEvent('vtrade:phone-timeframe',{detail:{tf,data:s,ai}}));
 }catch(e){
  const p=panel();
  if(p)p.innerHTML=`<div class="vtrade-phone-result-head"><b>Selected TF · ${esc(tf)}</b><b class="red">ERROR</b></div><div class="red">${esc(e?.message||e)}</div><div class="vtrade-phone-muted">No fabricated market data or signal.</div>`;
  console.error('[V-TRADE PHONE V20]',e);
 }
}
/* PHONE DRAWER OVERLAY FIX: hide bottom navigation while sidebar is open. */
function syncPhoneDrawer(){
 const side=document.getElementById('side');
 const bar=document.getElementById('vtradeMobileBar');
 const scrim=document.getElementById('scrim');
 const open=!!side?.classList.contains('open')||!!side?.classList.contains('vtrade-open');
 if(bar){bar.style.setProperty('display',open?'none':'','important');bar.setAttribute('aria-hidden',open?'true':'false')}
 if(scrim&&open){scrim.style.setProperty('z-index','6990','important');scrim.style.setProperty('pointer-events','auto','important')}
 document.documentElement.classList.toggle('vtrade-phone-drawer-open',open);
 document.body.classList.toggle('vtrade-phone-drawer-open',open);
}
if(!document.getElementById('vtrade-phone-drawer-v20-style')){
 const st=document.createElement('style');st.id='vtrade-phone-drawer-v20-style';
 st.textContent=`@media(max-width:900px){body.vtrade-phone-drawer-open{overflow:hidden!important}body.vtrade-phone-drawer-open #vtradeMobileBar{display:none!important}.side.open,.side.vtrade-open{z-index:7000!important}.scrim.show{z-index:6990!important}}`;
 document.head.appendChild(st);
}
syncPhoneDrawer();
new MutationObserver(syncPhoneDrawer).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class','style']});
document.addEventListener('click',()=>setTimeout(syncPhoneDrawer,0),true);
window.VTRADE_PHONE_ANALYZE_V20=analyze;
window.VTRADE_PHONE_SET_TF_V20=tf=>analyze(tf);
})();
