/* V TRADE AI — PHONE INTERACTION V20
 * Phone-only interaction owner for M5/M15/H1/H4/D1 + Analyze AI.
 * Delegates to the existing native V91 renderer and keeps MT5/ICT logic untouched.
 */
(()=>{
'use strict';
if(!window.matchMedia||!matchMedia('(max-width:900px)').matches||window.__VTRADE_PHONE_INTERACTION_V20__)return;
window.__VTRADE_PHONE_INTERACTION_V20__=true;
const TFS=['M5','M15','H1','H4','D1'];
const text=el=>(el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();
const getHost=()=>document.getElementById('vtradePreMarket');
const findNative=(tf)=>getHost()?.querySelector(`[data-v91tf="${tf}"]`);
const nativeActive=()=>getHost()?.querySelector('.v91b.on')?.getAttribute('data-v91tf')||'M15';
function fire(el){
  if(!el)return false;
  try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch(_){try{el.click();return true}catch(e){return false}}
}
function activate(tf){
  if(!TFS.includes(tf))return false;
  const b=findNative(tf);if(!b)return false;
  if(typeof PointerEvent==='function'){
    try{b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch'}));b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch'}))}catch(_){ }
  }
  return fire(b);
}
function analyze(){
  const h=getHost();if(!h)return false;
  const b=h.querySelector('#v91Analyze')||[...h.querySelectorAll('button,a')].find(x=>/analy[sz]e\s*ai/i.test(text(x)));
  return fire(b);
}
function syncSelect(){
  const s=document.querySelector('#vtradePhoneTfHost select');if(!s)return;
  const tf=nativeActive();if(TFS.includes(tf)&&s.value!==tf)s.value=tf;
}
function wire(){
  const host=document.getElementById('vtradePhoneTfHost');if(!host||host.dataset.v20==='1')return;
  host.dataset.v20='1';
  const s=host.querySelector('select');
  const b=host.querySelector('button');
  if(s){
    const go=e=>{e.preventDefault();e.stopPropagation();const tf=s.value;if(TFS.includes(tf)){activate(tf);setTimeout(syncSelect,80)}};
    s.addEventListener('change',go,{capture:true});
    s.addEventListener('input',go,{capture:true});
    s.addEventListener('pointerup',e=>e.stopPropagation(),{capture:true});
  }
  if(b){
    const go=e=>{e.preventDefault();e.stopPropagation();const tf=TFS.includes(s?.value)?s.value:nativeActive();activate(tf);setTimeout(analyze,120)};
    b.addEventListener('click',go,{capture:true});
    b.addEventListener('pointerup',go,{capture:true});
    b.addEventListener('touchend',go,{capture:true,passive:false});
  }
}
function hardenNative(){
  const h=getHost();if(!h)return;
  h.querySelectorAll('[data-v91tf]').forEach(el=>{el.style.setProperty('pointer-events','auto','important');el.style.setProperty('touch-action','manipulation','important')});
  const a=h.querySelector('#v91Analyze');if(a){a.style.setProperty('pointer-events','auto','important');a.style.setProperty('touch-action','manipulation','important')}
  syncSelect();
}
function run(){if(!matchMedia('(max-width:900px)').matches)return;wire();hardenNative()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',run,{passive:true});
})();
