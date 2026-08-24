/* V TRADE AI — PHONE CONTROLS V16
 * PHONE ONLY: stable M5/M15/H1/H4/D1 + Analyze AI.
 * Native V91 renderer remains the sole timeframe owner.
 * Desktop/trading logic untouched.
 */
(()=>{
'use strict';
if(!window.matchMedia||!matchMedia('(max-width:900px)').matches||window.__VTRADE_PHONE_CONTROLS_V16__)return;
window.__VTRADE_PHONE_CONTROLS_V16__=true;
window.__VTRADE_PHONE_INTERACTION_V17__=true;
const TFS=['M5','M15','H1','H4','D1'];
const style=document.createElement('style');style.id='vtrade-phone-controls-v16-style';style.textContent=`
@media(max-width:900px){
 .top>.tfs,#vtradePreMarket .v91a{display:none!important}
 #vtradePhoneTfHost{position:relative!important;z-index:10000!important;display:flex!important;pointer-events:auto!important;touch-action:manipulation!important}
 .vtrade-phone-tf-controls{display:flex!important;gap:8px!important;width:100%!important;max-width:100%!important;align-items:stretch!important;margin:8px 0 0!important;box-sizing:border-box!important;position:relative!important;z-index:10000!important;pointer-events:auto!important;touch-action:manipulation!important}
 .vtrade-phone-tf-select{flex:1 1 auto!important;min-width:0!important;width:100%!important;height:52px!important;padding:0 12px!important;border:1px solid #1d2c44!important;border-radius:14px!important;background:#09111e!important;color:#f5f8ff!important;font-weight:800!important;font-size:16px!important;outline:none!important;box-sizing:border-box!important;position:relative!important;z-index:10001!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
 .vtrade-phone-tf-button{flex:0 0 42%!important;width:42%!important;height:52px!important;border:1px solid #8050ff!important;border-radius:14px!important;background:linear-gradient(135deg,#5523c9,#7136e8)!important;color:#fff!important;font-weight:900!important;font-size:16px!important;box-sizing:border-box!important;position:relative!important;z-index:10001!important;pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important}
 .vtrade-phone-hide-admin,.vtrade-phone-hide-admin *{display:none!important;visibility:hidden!important;pointer-events:none!important}
}
@media(min-width:901px){#vtradePhoneTfHost{display:none!important}}
`;
document.head.appendChild(style);
const isPhone=()=>matchMedia('(max-width:900px)').matches;
const isTerminal=()=>{const p=(location.pathname.split('/').pop()||'').toLowerCase();return /(?:premium-dashboard-live|premium-dashboard-v4|premium-dashboard|dashboard)\\.html$/i.test(p)||!!document.getElementById('vtradePreMarket')};
const textOf=el=>(el?.innerText||el?.textContent||'').replace(/\\s+/g,' ').trim();
const isIdentity=t=>/\\bVET\\s+VEN\\b/i.test(t)&&/\\bAdministrator\\b/i.test(t);
function hide(el){if(!el||el===document.body||el===document.documentElement||el.id==='side'||el.id==='vtradeMobileBar'||el.closest('.side'))return false;el.classList.add('vtrade-phone-hide-admin');el.setAttribute('data-vtrade-phone-admin-hidden','1');el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');el.style.setProperty('pointer-events','none','important');return true}
function hideAdminCard(){if(!isPhone())return;const vw=window.innerWidth;for(const el of document.querySelectorAll('[id*="profile" i],[class*="profile" i],[id*="account" i],[class*="account" i]')){const t=textOf(el);if(!isIdentity(t))continue;const r=el.getBoundingClientRect();if(r.width>=180&&r.height>=45&&r.left>vw*.20){hide(el);return}}}
function activateTf(tf){const pre=document.getElementById('vtradePreMarket');const row=pre?.querySelector('.v91a');const target=row?.querySelector('[data-v91tf="'+tf+'"]');if(!target)return false;try{target.click();return true}catch(e){try{target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch(_){return false}}}
function analyzeNow(){const pre=document.getElementById('vtradePreMarket');const a=pre?.querySelector('#v91Analyze')||[...(pre?.querySelectorAll('button,a')||[])].find(x=>/analy[sz]e\\s*ai/i.test(textOf(x)));if(!a)return false;try{a.click();return true}catch(e){try{a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch(_){return false}}}
function wireTimeframe(){if(!isPhone()||!isTerminal())return false;const pre=document.getElementById('vtradePreMarket');if(!pre)return false;const sourceRow=pre.querySelector('.v91a');if(!sourceRow)return false;let host=document.getElementById('vtradePhoneTfHost');if(!host){host=document.createElement('div');host.id='vtradePhoneTfHost';host.className='vtrade-phone-tf-controls';const select=document.createElement('select');select.className='vtrade-phone-tf-select';select.setAttribute('aria-label','Timeframe');select.setAttribute('autocomplete','off');TFS.forEach(tf=>{const o=document.createElement('option');o.value=tf;o.textContent=tf;select.appendChild(o)});const button=document.createElement('button');button.type='button';button.className='vtrade-phone-tf-button';button.textContent='Analyze AI';let last='';const go=()=>{const tf=select.value;if(!TFS.includes(tf)||tf===last)return;last=tf;activateTf(tf);setTimeout(()=>{const s=document.querySelector('#vtradePhoneTfHost select');if(s)s.value=tf},150)};select.addEventListener('change',go,{passive:true});select.addEventListener('input',go,{passive:true});button.addEventListener('click',()=>{activateTf(select.value);setTimeout(analyzeNow,250)});button.addEventListener('touchend',e=>{e.preventDefault();activateTf(select.value);setTimeout(analyzeNow,250)},{passive:false});host.append(select,button)}const parent=pre.querySelector('.v91h')||pre;if(host.parentElement!==parent)parent.appendChild(host);const active=pre.querySelector('.v91b.on')?.getAttribute('data-v91tf');const select=host.querySelector('select');if(active&&TFS.includes(active))select.value=active;return true}
function loadPhoneI18n(){if(!isPhone()||document.getElementById('vtradePhoneI18nScript'))return;const s=document.createElement('script');s.id='vtradePhoneI18nScript';s.src='vtrade-phone-i18n-v2.js?v=20260824-v6';s.async=false;(document.head||document.documentElement).appendChild(s)}
let tries=0;const run=()=>{if(!isPhone())return;hideAdminCard();wireTimeframe();loadPhoneI18n();if(tries++<240)setTimeout(run,250)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();new MutationObserver(()=>{if(isPhone()){hideAdminCard();wireTimeframe();loadPhoneI18n()}}).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('hashchange',()=>setTimeout(run,50));window.addEventListener('resize',()=>setTimeout(run,50),{passive:true});
})();
