/* V TRADE AI — PHONE CONTROLS V20
 * Self-contained: no external phone CSS/i18n dependency.
 */
(()=>{
'use strict';
if(!window.matchMedia || !window.matchMedia('(max-width:900px)').matches || window.__VTRADE_PHONE_CONTROLS_V20__) return;
window.__VTRADE_PHONE_CONTROLS_V20__=true;
const TFS=['M5','M15','H1','H4','D1'];
const style=document.createElement('style');style.textContent=`
@media(max-width:900px){
 #vtradePhoneTfHost{display:grid!important;grid-template-columns:minmax(0,1fr) 42%!important;gap:8px!important;width:100%!important;margin:10px 0!important;position:relative!important;z-index:100000!important;pointer-events:auto!important;touch-action:manipulation!important}
 #vtradePhoneTfHost select,#vtradePhoneTfHost button{height:54px!important;width:100%!important;min-width:0!important;border:1px solid #2b3f5d!important;border-radius:14px!important;background:#09111e!important;color:#f5f8ff!important;font-size:16px!important;font-weight:900!important;outline:none!important;pointer-events:auto!important;touch-action:manipulation!important;position:relative!important;z-index:100001!important;-webkit-tap-highlight-color:transparent!important}
 #vtradePhoneTfHost button{border-color:#8050ff!important;background:linear-gradient(135deg,#5523c9,#7136e8)!important;cursor:pointer!important}
 .vtrade-phone-result{margin:10px 0!important;padding:14px!important;border:1px solid #263650!important;border-radius:14px!important;background:#080f1b!important;color:#dbe5f5!important;font-size:12px!important;line-height:1.7!important;position:relative!important;z-index:10050!important}
 .vtrade-phone-result-head{display:flex!important;justify-content:space-between!important;gap:8px!important;align-items:center!important;margin-bottom:6px!important;font-size:14px!important}
 .vtrade-phone-muted{color:#8493ab!important;margin-top:5px!important}.green{color:#22e58a!important}.red{color:#ff5968!important}.gold{color:#f2c94c!important}.cyan{color:#35d8ff!important}
}
`;(document.head||document.documentElement).appendChild(style);
const pre=()=>document.getElementById('vtradePreMarket');
function i18n(){
 const map={'Pre-Market Zone Analysis':'វិភាគតំបន់ Pre-Market','Analyze AI':'វិភាគ AI','BUY Strength':'កម្លាំង BUY','SELL Strength':'កម្លាំង SELL','MTF Bias':'ទិសដៅ MTF','MT5 LIVE DATA CONNECTED':'MT5 ភ្ជាប់ទិន្នន័យ Live','VALID EXECUTION ZONE':'តំបន់ចូល Order ត្រឹមត្រូវ','Current Price':'តម្លៃបច្ចុប្បន្ន','Entry area':'តំបន់ចូល','Execution':'ការប្រតិបត្តិ','Waiting for liquidity sweep':'រង់ចាំ Liquidity Sweep','Waiting for MSS aligned with MTF bias':'រង់ចាំ MSS ស្របតាម MTF Bias'};
 document.querySelectorAll('[data-i18n]').forEach(el=>{const en=el.getAttribute('data-i18n');if(en&&map[en]&&!el.dataset.vtradeI18nOriginal)el.dataset.vtradeI18nOriginal=en});
 window.VTRADE_PHONE_LANG={set(lang){document.documentElement.lang=lang==='km'?'km':'en';document.querySelectorAll('[data-i18n]').forEach(el=>{const en=el.dataset.vtradeI18nOriginal||el.getAttribute('data-i18n');if(!en)return;el.textContent=lang==='km'?(map[en]||en):en})}};
}
function wire(){
 const h=pre();if(!h)return false;
 let host=document.getElementById('vtradePhoneTfHost');
 if(!host){
  host=document.createElement('div');host.id='vtradePhoneTfHost';
  const s=document.createElement('select');s.setAttribute('aria-label','Timeframe');s.autocomplete='off';
  TFS.forEach(tf=>{const o=document.createElement('option');o.value=tf;o.textContent=tf;s.appendChild(o)});
  const b=document.createElement('button');b.type='button';b.textContent='Analyze AI';
  host.append(s,b);
  const run=e=>{if(e){e.preventDefault();e.stopPropagation()}const tf=TFS.includes(s.value)?s.value:'M15';window.VTRADE_PHONE_ANALYZE_V20?.(tf)};
  s.addEventListener('change',run,{capture:true});s.addEventListener('input',run,{capture:true});
  b.addEventListener('click',run,{capture:true});b.addEventListener('pointerup',run,{capture:true});b.addEventListener('touchend',run,{capture:true,passive:false});
  const parent=h.querySelector('.v91h')||h.firstElementChild||h;parent.appendChild(host);
 }
 const native=h.querySelector('.v91a');if(native)native.style.setProperty('display','none','important');
 return true;
}
function run(){if(!window.matchMedia('(max-width:900px)').matches)return;i18n();wire()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',run,{passive:true});
})();
