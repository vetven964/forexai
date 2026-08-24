/* V TRADE AI — Cross UI TF Sync V1
 * One selected timeframe for Header + Pre-Market on the same terminal.
 * UI synchronization only; MT5/ICT calculations remain backend-authoritative.
 */
(()=>{
'use strict';
if(window.__VTRADE_CROSS_UI_SYNC_V1__)return;
window.__VTRADE_CROSS_UI_SYNC_V1__=true;
const TFS=['M5','M15','H1','H4','D1'];
const KEY='vtrade_selected_tf';
let applying=false;
const norm=v=>String(v||'').toUpperCase();
const valid=v=>TFS.includes(norm(v))?norm(v):'M15';
function setTf(tf,source){
  const next=valid(tf);
  localStorage.setItem(KEY,next);
  document.documentElement.dataset.vtradeTf=next;
  window.dispatchEvent(new CustomEvent('vtrade:tf-changed',{detail:{tf:next,source:source||'sync'}}));
  syncHeader(next);
}
function syncHeader(tf){
  document.querySelectorAll('.tfs button').forEach(b=>{
    const v=valid(b.dataset.tf||b.dataset.timeframe||b.textContent);
    b.classList.toggle('active',v===tf);
    b.setAttribute('aria-pressed',String(v===tf));
  });
}
function findPm(tf){return document.querySelector(`#vtradePreMarket [data-v91tf="${tf}"]`)}
function syncPreMarket(tf){
  const btn=findPm(tf);
  if(btn&&!applying){
    applying=true;
    try{btn.click()}catch{}
    finally{setTimeout(()=>{applying=false;},0)}
  }
}
function apply(tf,source){
  const next=valid(tf);
  localStorage.setItem(KEY,next);
  document.documentElement.dataset.vtradeTf=next;
  syncHeader(next);
  if(source!=='premarket')syncPreMarket(next);
}
function onClick(e){
  const t=e.target?.closest?.('button');if(!t)return;
  if(t.matches('.tfs button')){
    const tf=valid(t.dataset.tf||t.dataset.timeframe||t.textContent);
    apply(tf,'header');
    return;
  }
  if(t.matches('#vtradePreMarket [data-v91tf]')){
    const tf=valid(t.dataset.v91tf);
    apply(tf,'premarket');
  }
}
function boot(){
  const saved=valid(localStorage.getItem(KEY));
  apply(saved,'boot');
  document.addEventListener('click',onClick,true);
  window.addEventListener('storage',e=>{if(e.key===KEY)apply(e.newValue||'M15','storage')});
  window.addEventListener('vtrade:tf-changed',e=>{const tf=valid(e.detail?.tf);syncHeader(tf)});
  new MutationObserver(()=>syncHeader(valid(localStorage.getItem(KEY)))).observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
