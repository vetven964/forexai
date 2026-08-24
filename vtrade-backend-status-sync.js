/* V-TRADE AI — Backend Truth Status Sync V3
 * Backend status remains authoritative in the compact header badge.
 * The verbose Backend Connection panel is hidden from the normal terminal UI
 * on both PC and phone so it cannot cover the trading interface or surface
 * implementation-level DOM/CORS errors to normal users.
 */
(()=>{
'use strict';
if(window.__VTRADE_BACKEND_STATUS_SYNC_V3__)return;
window.__VTRADE_BACKEND_STATUS_SYNC_V3__=true;
const $=s=>document.querySelector(s);
const conn=()=>window.VTRADE_CONNECTION;
const hideVerbosePanel=()=>{
  document.querySelectorAll('.backend-section').forEach(el=>{
    el.style.display='none';
    el.setAttribute('aria-hidden','true');
  });
};
const set=(ok,msg='')=>{
  hideVerbosePanel();
  const el=$('.backend');
  if(!el)return;
  el.textContent=ok?'BACKEND LIVE':'BACKEND ERROR';
  el.style.color=ok?'#22e58a':'#ff5968';
  el.style.background=ok?'#062d20':'#2b0c13';
  el.style.borderColor=ok?'#147850':'#7c2532';
  el.title=msg|| (ok?'Authoritative MT5 route reachable':'Authoritative backend route unavailable');
};
async function check(){
  hideVerbosePanel();
  const c=conn();
  if(!c?.fetch||!c?.api){set(false,'Connection layer unavailable');return;}
  try{
    const r=await c.fetch(c.api('/api/pre-market/mt5-authoritative'),{credentials:'omit',cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(d?.error||`HTTP ${r.status}`);
    if(d?.success===false)throw Error(d?.error||'Backend returned success=false');
    set(true,`MT5 authoritative route OK · HTTP ${r.status}`);
  }catch(e){
    set(false,'Authoritative backend route unavailable');
  }
}
function boot(){
  hideVerbosePanel();
  check();
  setInterval(check,30000);
  new MutationObserver(hideVerbosePanel).observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
