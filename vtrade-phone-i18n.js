/* V TRADE AI — Mobile bilingual UI V1
 * Phone-only language switcher: English / Khmer.
 * Does not modify trading calculations, MT5 feed, ICT gates, or execution logic.
 */
(()=>{'use strict';
if(window.__VTRADE_MOBILE_I18N_V1__)return;
window.__VTRADE_MOBILE_I18N_V1__=true;
const phone=()=>matchMedia('(max-width:900px)').matches;
const dict={
'Dashboard':'ផ្ទាំងគ្រប់គ្រង','Terminal':'តេមីណាល់','Signals':'សញ្ញា','AI Intelligence':'បញ្ញា AI',
'News Intelligence':'ព័ត៌មានសំខាន់','Telegram':'Telegram','Risk Calculator':'គណនាហានិភ័យ',
'Trade History':'ប្រវត្តិជួញដូរ','Settings':'ការកំណត់','Home':'ទំព័រដើម','Analyzer':'វិភាគ',
'Chart':'ក្រាហ្វ','News':'ព័ត៌មាន','Pre-Market Zone Analysis':'វិភាគតំបន់មុនទីផ្សារ',
'Analyze AI':'វិភាគ AI','MTF Bias':'ទិសដៅ MTF','BUY Strength':'កម្លាំង BUY',
'SELL Strength':'កម្លាំង SELL','Current Price':'តម្លៃបច្ចុប្បន្ន','Entry area':'តំបន់ចូល',
'Execution':'ការប្រតិបត្តិ','VALID EXECUTION ZONE':'តំបន់ប្រតិបត្តិដែលមានសុពលភាព',
'MT5 LIVE DATA CONNECTED':'MT5 ភ្ជាប់ទិន្នន័យផ្ទាល់','WAIT':'រង់ចាំ','PASS':'ជោគជ័យ',
'Waiting for liquidity sweep':'កំពុងរង់ចាំ Liquidity Sweep',
'WAIT — BUY RETEST INTO ZONE':'រង់ចាំ — BUY ត្រឡប់ចូល Zone',
'WAIT — SELL RETEST INTO ZONE':'រង់ចាំ — SELL ត្រឡប់ចូល Zone',
'BUY ZONE':'តំបន់ BUY','SELL ZONE':'តំបន់ SELL','ICT gates':'ICT Gates',
'M5':'M5','M15':'M15','H1':'H1','H4':'H4','D1':'D1'
};
const originals=new WeakMap();
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
function translateText(el,kh){
 if(!el||el.children.length)return;
 const raw=originals.has(el)?originals.get(el):el.textContent;
 if(!originals.has(el))originals.set(el,raw);
 const key=norm(raw);if(!key)return;
 if(dict[key])el.textContent=kh?dict[key]:raw;
 else if(kh){let out=raw;Object.keys(dict).sort((a,b)=>b.length-a.length).forEach(k=>{out=out.split(k).join(dict[k])});if(out!==raw)el.textContent=out;}
}
function apply(kh){
 if(!phone())return;
 document.documentElement.lang=kh?'km':'en';document.documentElement.dataset.vtradeLang=kh?'km':'en';
 document.querySelectorAll('#vtradeMobileBar a span:last-child,.nav [data-i18n],#vtradePreMarket .v91t,#vtradePreMarket .v91s,#vtradePreMarket .v91l,#vtradePreMarket .v91r span,#vtradePreMarket .v91st,#vtradePreMarket .v91tf span,#vtradePreMarket .v91metric span,.backend,.live').forEach(el=>translateText(el,kh));
 document.querySelectorAll('#vtradePhoneLang button').forEach(b=>{const on=b.dataset.lang===(kh?'km':'en');b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
}
function add(){
 if(!phone()||document.getElementById('vtradePhoneLang'))return;
 const host=document.createElement('div');host.id='vtradePhoneLang';host.innerHTML='<button type="button" data-lang="en">EN</button><button type="button" data-lang="km">ខ្មែរ</button>';
 const s=document.createElement('style');s.id='vtradePhoneLangStyle';s.textContent=`@media(max-width:900px){#vtradePhoneLang{position:fixed;right:10px;top:max(8px,env(safe-area-inset-top));z-index:4900;display:flex;gap:3px;padding:3px;border:1px solid #263957;border-radius:11px;background:rgba(5,10,18,.92);backdrop-filter:blur(12px)}#vtradePhoneLang button{border:0;border-radius:8px;background:transparent;color:#8ea0b8;font:800 10px/1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;padding:7px 8px;min-height:30px}#vtradePhoneLang button.active{background:#5827d2;color:#fff}}`;
 document.head.appendChild(s);document.body.appendChild(host);
 host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const kh=b.dataset.lang==='km';localStorage.setItem('vtrade_phone_lang',kh?'km':'en');apply(kh)}));
}
function run(){if(!phone())return;add();apply(localStorage.getItem('vtrade_phone_lang')==='km')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
new MutationObserver(()=>{if(phone())run()}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('resize',run,{passive:true});
})();