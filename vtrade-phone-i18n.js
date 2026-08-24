/* V TRADE AI — Mobile bilingual UI V3
 * Phone language switcher: English / Khmer.
 * Language state is mirrored to the terminal language key and emits a shared event.
 */
(()=>{
'use strict';
if(window.__VTRADE_MOBILE_I18N_V3__)return;
window.__VTRADE_MOBILE_I18N_V3__=true;
const phone=()=>window.matchMedia?.('(max-width:900px)').matches;
const KEY='vtrade_phone_lang';
const GLOBAL='vtrade_lang';
const dict={
'Dashboard':'ផ្ទាំងគ្រប់គ្រង','Terminal':'តេមីណាល់','Signals':'សញ្ញា','AI Intelligence':'បញ្ញា AI','News Intelligence':'ព័ត៌មានសំខាន់','Telegram':'Telegram','Risk Calculator':'គណនាហានិភ័យ','Trade History':'ប្រវត្តិជួញដូរ','Settings':'ការកំណត់','Home':'ទំព័រដើម','Analyzer':'វិភាគ','Chart':'ក្រាហ្វ','News':'ព័ត៌មាន',
'Pre-Market Zone Analysis':'វិភាគតំបន់មុនទីផ្សារ','Analyze AI':'វិភាគ AI','PRE-MARKET MTF DIRECTION STRENGTH':'កម្លាំងទិសដៅ MTF មុនទីផ្សារ','BUY Strength':'កម្លាំង BUY','SELL Strength':'កម្លាំង SELL','MTF Bias':'ទិសដៅ MTF','MT5 LIVE DATA CONNECTED':'MT5 ភ្ជាប់ទិន្នន័យផ្ទាល់','AI WAIT — BUY RETEST INTO ZONE':'AI រង់ចាំ — BUY ត្រឡប់ចូល Zone','VALID EXECUTION ZONE':'តំបន់ប្រតិបត្តិដែលមានសុពលភាព','BUY ZONE':'តំបន់ BUY','SELL ZONE':'តំបន់ SELL','Current Price':'តម្លៃបច្ចុប្បន្ន','Entry area':'តំបន់ចូល','Execution':'ការប្រតិបត្តិ','WAIT':'រង់ចាំ','Waiting for liquidity sweep':'កំពុងរង់ចាំ Liquidity Sweep','BACKEND LIVE':'Backend ដំណើរការ','MT5 LIVE':'MT5 ផ្ទាល់','BULLISH':'ទិសដៅឡើង','BEARISH':'ទិសដៅចុះ','PASS':'ជោគជ័យ','FAIL':'បរាជ័យ','ICT gates':'ICT Gates','Execution Status':'ស្ថានភាពប្រតិបត្តិ','Entry Zone':'តំបន់ចូល','BUY':'BUY','SELL':'SELL','M5':'M5','M15':'M15','H1':'H1','H4':'H4','D1':'D1',
'Liquidity Sweep':'Liquidity Sweep','Market Structure Shift':'Market Structure Shift','Break of Structure':'Break of Structure','Fair Value Gap':'Fair Value Gap','Order Block':'Order Block','Entry':'ចូល','Stop Loss':'Stop Loss','Take Profit':'Take Profit','Signal':'សញ្ញា','Confidence':'ទំនុកចិត្ត','Direction':'ទិសដៅ','Price':'តម្លៃ','Live':'ផ្ទាល់','Connected':'បានភ្ជាប់','Waiting':'កំពុងរង់ចាំ','Ready':'រួចរាល់','No signal':'មិនមានសញ្ញា','No data':'មិនមានទិន្នន័យ'
};
const originals=new WeakMap();
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const escapeRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function isKh(){return localStorage.getItem(KEY)==='km'||localStorage.getItem(GLOBAL)==='km'}
function translateString(raw,kh){const source=String(raw??'');if(!kh)return source;let out=source;Object.keys(dict).sort((a,b)=>b.length-a.length).forEach(k=>{out=out.replace(new RegExp(escapeRx(k),'g'),dict[k])});return out}
function walk(){
 const root=document.body;if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let n;
 while((n=walker.nextNode())){const p=n.parentElement;if(!p||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName))continue;if(p.closest('#vtradePhoneLang'))continue;nodes.push(n)}
 const kh=isKh();
 for(const node of nodes){if(!originals.has(node))originals.set(node,node.nodeValue||'');const raw=originals.get(node);if(!norm(raw))continue;const next=translateString(raw,kh);if(node.nodeValue!==next)node.nodeValue=next}
 document.documentElement.lang=kh?'km':'en';document.documentElement.dataset.vtradeLang=kh?'km':'en';
 document.querySelectorAll('#vtradePhoneLang button').forEach(b=>{const active=b.dataset.lang===(kh?'km':'en');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
}
function setLang(lang){const value=lang==='km'?'km':'en';localStorage.setItem(KEY,value);localStorage.setItem(GLOBAL,value);document.documentElement.lang=value;window.dispatchEvent(new CustomEvent('vtrade:language-changed',{detail:{lang:value,source:'phone-i18n'}}));walk()}
function add(){
 if(!phone()||document.getElementById('vtradePhoneLang'))return;
 const host=document.createElement('div');host.id='vtradePhoneLang';host.innerHTML='<button type="button" data-lang="en">EN</button><button type="button" data-lang="km">ខ្មែរ</button>';
 const style=document.createElement('style');style.id='vtradePhoneLangStyle';style.textContent=`@media(max-width:900px){#vtradePhoneLang{position:fixed;right:10px;top:max(72px,calc(68px + env(safe-area-inset-top)));z-index:4999;display:flex;gap:3px;padding:3px;border:1px solid #263957;border-radius:11px;background:rgba(5,10,18,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 8px 24px #0008}#vtradePhoneLang button{border:0;border-radius:8px;background:transparent;color:#8ea0b8;font:800 10px/1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;padding:7px 9px;min-height:30px;-webkit-tap-highlight-color:transparent}#vtradePhoneLang button.active{background:#5827d2;color:#fff}}`;
 document.head.appendChild(style);document.body.appendChild(host);host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang),true));
}
function safeArea(){if(!phone())return;let s=document.getElementById('vtradePhoneSafeArea');if(!s){s=document.createElement('style');s.id='vtradePhoneSafeArea';document.head.appendChild(s)}s.textContent='@media(max-width:900px){body.vtrade-mobile{padding-bottom:calc(154px + env(safe-area-inset-bottom))!important}body.vtrade-mobile .wrap{padding-bottom:154px!important;scroll-padding-bottom:154px!important}#vtradePreMarket{scroll-margin-bottom:154px!important}.footerline{padding-bottom:12px!important}}'}
let scheduled=0;
function run(){if(!phone())return;safeArea();add();walk()}
function schedule(){if(scheduled)return;scheduled=1;requestAnimationFrame(()=>{scheduled=0;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('storage',e=>{if(e.key===KEY||e.key===GLOBAL) schedule()});window.addEventListener('vtrade:language-changed',schedule);
})();
