/* V TRADE AI — Responsive Shell V20 | PC + PHONE FINAL */
(()=>{
'use strict';
if(window.__VTRADE_RESPONSIVE_V20__)return;
window.__VTRADE_RESPONSIVE_V20__=true;
const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
const path=location.pathname.split('/').pop().toLowerCase();

function css(){
 if(document.getElementById('vtradeResponsiveV20'))return;
 const s=document.createElement('style');s.id='vtradeResponsiveV20';
 s.textContent=`
 html,body{width:100%;max-width:100%;overflow-x:hidden!important}
 *,*::before,*::after{box-sizing:border-box;min-width:0}
 img,svg,canvas,video{max-width:100%}
 button,select,input,textarea{max-width:100%;touch-action:manipulation}
 @media(min-width:901px){
   .app,.main,.wrap{width:100%;min-width:0}
   .wrap{max-width:1750px;margin-inline:auto}
   .cards{grid-template-columns:repeat(5,minmax(170px,1fr))!important}
   .radar{grid-template-columns:repeat(3,minmax(0,1fr))!important}
   .gategrid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
   .mainrow{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr)!important}
   .chart{width:100%;min-width:0;overflow:hidden}
   .chart svg,.chart canvas{display:block;width:100%!important;height:100%!important;max-width:100%!important}
   #vtradeMobileBar,#vtradeAdminMobileBar,#vtradeAdminScrim,#vtradePhoneTfHost,.vtrade-phone-profile{display:none!important}
 }
 @media(max-width:900px){
   html,body{overflow-x:hidden!important}
   body{padding-bottom:calc(0px + env(safe-area-inset-bottom))}
   .app{display:block!important;width:100%!important;min-height:100dvh!important}
   .main{display:block!important;width:100%!important;min-width:0!important;overflow-x:hidden!important}
   .side{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(310px,84vw)!important;height:100dvh!important;max-height:100dvh!important;z-index:7000!important;transform:translateX(-110%)!important;transition:transform .22s ease!important;overflow-y:auto!important;overflow-x:hidden!important}
   .side.open,.side.vtrade-open{transform:translateX(0)!important}
   .scrim,#scrim,#vtradeAdminScrim{z-index:6990!important}
   .wrap{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;padding:10px 9px calc(94px + env(safe-area-inset-bottom))!important;overflow:hidden!important}
   .top{position:sticky!important;top:0!important;z-index:2000!important;width:100%!important;min-height:0!important;padding:max(8px,env(safe-area-inset-top)) 8px 8px!important;display:grid!important;grid-template-columns:42px minmax(0,1fr)!important;gap:6px!important;overflow:visible!important}
   .top .pair{min-width:0!important;overflow:hidden!important;display:flex!important;flex-wrap:wrap!important}
   .top .pair .price{font-size:clamp(21px,7.2vw,28px)!important;line-height:1!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important}
   .top .pair .live{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
   .top .backend{max-width:42vw!important;overflow:hidden!important;text-overflow:ellipsis!important}
   .tfs{grid-column:2!important;display:flex!important;width:100%!important;max-width:100%!important;gap:5px!important;overflow-x:auto!important;scrollbar-width:none!important}
   .tfs::-webkit-scrollbar{display:none}
   .tfs button,.lang-btn{min-height:42px!important;height:42px!important;flex:0 0 auto!important;padding:8px 11px!important}
   .cards,.radar,.gategrid,.mainrow,.news-top,.news-grid{grid-template-columns:1fr!important}
   .card,.panel,.box,#vtradePreMarket{width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important}
   .card{padding:13px!important;border-radius:14px!important}
   .toolbar{display:grid!important;grid-template-columns:1fr!important;width:100%!important;gap:8px!important}
   .toolbar>*{width:100%!important;min-width:0!important}
   .section{margin-top:10px!important;max-width:100%!important}
   .section-title{gap:8px!important;align-items:flex-start!important}
   .section-title h2{font-size:17px!important;line-height:1.25!important}
   .section-title span{white-space:normal!important;text-align:right!important}
   .huge{font-size:clamp(28px,9vw,36px)!important}
   .big{font-size:22px!important}
   .kv,.level,.footerline,.news-foot{flex-wrap:wrap!important}
   .gategrid{gap:8px!important}
   .gate{padding:10px!important;min-height:58px!important}
   .signal{display:block!important}
   .signal-state{font-size:28px!important}
   .setup,.notice{max-width:100%!important;overflow-wrap:anywhere!important}
   .chart{width:100%!important;height:230px!important;max-width:100%!important;overflow:hidden!important}
   .chart svg,.chart canvas{display:block!important;width:100%!important;height:100%!important;max-width:100%!important}
   .news-state{align-items:flex-start!important;flex-wrap:wrap!important}
   .news-item{grid-template-columns:auto minmax(0,1fr)!important}
   .news-actions{grid-column:2!important;display:flex!important;flex-wrap:wrap!important}
   .vtrade-mtf-selectbar{width:100%!important;justify-content:stretch!important;flex-wrap:wrap!important}
   .vtrade-mtf-selectbar label{min-width:42px!important}
   .vtrade-mtf-selectbar select{flex:1 1 180px!important;width:100%!important;min-width:0!important;min-height:44px!important}
   #vtradePreMarket .radar,#vtradePreMarket .mtf-grid,#vtradePreMarket [data-mtf-grid]{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;width:100%!important;max-width:100%!important}
   #vtradePreMarket .radar>* ,#vtradePreMarket .mtf-grid>* ,#vtradePreMarket [data-mtf-grid]>*{width:100%!important;min-width:0!important;max-width:100%!important}
   #vtradePreMarket .tf{width:100%!important;min-width:0!important;overflow:hidden!important}
   #vtradePreMarket .tf-head{flex-wrap:wrap!important}
   #vtradePreMarket .tf .kv{flex-wrap:wrap!important}
   #vtradePreMarket select[data-mtf-selector],#vtradePreMarket .mtf-dropdown,#vtradePreMarket #vtradePhoneTfHost{display:none!important}
   body.vtrade-mobile{padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}
   body:not(.vtrade-admin-mobile) #vtradeMobileBar{position:fixed!important;left:8px!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;width:auto!important;height:64px!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;padding:6px!important;z-index:8000!important;border:1px solid #263957!important;border-radius:20px!important;background:rgba(5,10,18,.97)!important;backdrop-filter:blur(18px)!important;overflow:hidden!important}
   body:not(.vtrade-admin-mobile) #vtradeMobileBar a{min-width:0!important;height:50px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;padding:4px 2px!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#8ea0b8!important;font:600 10px/1.1 system-ui,sans-serif!important;text-decoration:none!important;white-space:nowrap!important;overflow:hidden!important}
   body:not(.vtrade-admin-mobile) #vtradeMobileBar a.active,body:not(.vtrade-admin-mobile) #vtradeMobileBar a[aria-current="page"]{color:#fff!important;background:rgba(91,45,214,.28)!important;border-color:rgba(128,80,255,.7)!important}
   body:not(.vtrade-admin-mobile) #vtradeMobileBar .mi{display:grid!important;place-items:center!important;width:28px!important;height:25px!important;font-size:20px!important;line-height:1!important}
 }
 @media(max-width:480px){
   .top{grid-template-columns:40px minmax(0,1fr)!important}
   .mobile{width:40px!important;height:40px!important}
   .price{font-size:22px!important}
   .live{font-size:9px!important}
   .backend{font-size:8px!important;padding:5px 7px!important;max-width:38vw!important}
   .wrap{padding-left:8px!important;padding-right:8px!important}
   .card{padding:12px!important}
   .gate b{font-size:10px!important}.gate small{font-size:9px!important}
   .chart{height:215px!important}
 }
 @media(max-width:380px){
   .top{padding-left:6px!important;padding-right:6px!important}
   .price{font-size:20px!important}
   .tfs{gap:3px!important}.tfs button{min-width:42px!important;padding-inline:7px!important;font-size:12px!important}
   .wrap{padding-left:7px!important;padding-right:7px!important}.chart{height:205px!important}
 }
 @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
 /* ADMIN PHONE SHELL */
 @media(max-width:900px){
   body.vtrade-admin-mobile{padding:0!important}
   body.vtrade-admin-mobile .app{display:block!important;min-height:100dvh!important}
   body.vtrade-admin-mobile .main{display:block!important;width:100%!important;min-width:0!important}
   body.vtrade-admin-mobile .side{display:flex!important;padding:18px 10px 105px!important;background:#11141b!important;box-shadow:22px 0 60px rgba(0,0,0,.55)!important}
   body.vtrade-admin-mobile .content{width:100%!important;max-width:100%!important;padding:88px 10px 105px!important;overflow:hidden!important}
   body.vtrade-admin-mobile .page-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:8px!important}
   body.vtrade-admin-mobile .stats,.packages,.quick,.lower{grid-template-columns:1fr!important}
   body.vtrade-admin-mobile .table-wrap{max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
   body.vtrade-admin-mobile .table{min-width:850px!important}
   #vtradeAdminMobileBar{position:fixed!important;left:8px!important;right:8px!important;top:max(8px,env(safe-area-inset-top))!important;height:64px!important;z-index:8100!important;display:grid!important;grid-template-columns:48px minmax(0,1fr) 46px 46px!important;gap:6px!important;padding:6px!important;border:1px solid #263957!important;border-radius:18px!important;background:rgba(6,10,17,.97)!important;backdrop-filter:blur(16px)!important}
   #vtradeAdminMobileBar button,#vtradeAdminMobileBar a{height:50px!important;border:1px solid #263957!important;border-radius:13px!important;background:#091321!important;color:#fff!important;display:grid!important;place-items:center!important;text-decoration:none!important;font-size:20px!important}
   #vtradeAdminMobileBar #vtradeAdminMenu{background:#5827d2!important;border-color:#8050ff!important}
   #vtradeAdminMobileBar .title{min-width:0!important;overflow:hidden!important}.title b,.title small{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
   #vtradeAdminScrim{display:block!important;position:fixed!important;inset:0!important;background:rgba(0,0,0,.58)!important;opacity:0!important;pointer-events:none!important;z-index:7990!important}
   #vtradeAdminScrim.show{opacity:1!important;pointer-events:auto!important}
 }
 `;
 document.head.appendChild(s);
}
function load(id,src){if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=src;s.async=false;(document.head||document.documentElement).appendChild(s)}
function addAdminShell(){
 if(!isMobile()||path!=='admin-dashboard.html'||document.getElementById('vtradeAdminMobileBar'))return;
 document.body.classList.add('vtrade-admin-mobile');
 const scrim=document.createElement('div');scrim.id='vtradeAdminScrim';document.body.appendChild(scrim);
 const bar=document.createElement('div');bar.id='vtradeAdminMobileBar';bar.innerHTML='<button id="vtradeAdminMenu" aria-label="Open menu">☰</button><div class="title"><b>Admin Dashboard</b><small>V TRADE AI · Administrator</small></div><a href="profile.html" aria-label="Profile">♙</a><button id="vtradeAdminLogout" aria-label="Logout">↪</button>';document.body.appendChild(bar);
 const side=document.querySelector('.side');
 const close=()=>{side?.classList.remove('vtrade-open');scrim.classList.remove('show')};
 const open=()=>{side?.classList.add('vtrade-open');scrim.classList.add('show')};
 document.getElementById('vtradeAdminMenu').onclick=e=>{e.preventDefault();e.stopPropagation();side?.classList.contains('vtrade-open')?close():open()};
 scrim.onclick=close;side?.querySelectorAll('a,button').forEach(el=>el.addEventListener('click',()=>setTimeout(close,100)));
 document.getElementById('vtradeAdminLogout').onclick=()=>document.getElementById('sideLogout')?.click();
}
function addMobileNav(){
 if(!isMobile()||document.getElementById('vtradeMobileBar'))return;
 const bar=document.createElement('nav');bar.id='vtradeMobileBar';bar.setAttribute('aria-label','V TRADE AI mobile navigation');
 const items=[['#dashboard','⌂','Home'],['#ai','▣','Analyzer'],['#terminal','⌁','Chart'],['#signals','◈','Signals'],['#news','◉','News']];
 bar.innerHTML=items.map(([href,icon,label])=>`<a href="${href}"><span class="mi" aria-hidden="true">${icon}</span><span>${label}</span></a>`).join('');
 document.body.appendChild(bar);document.body.classList.add('vtrade-mobile');
 const set=()=>{const cur=(location.hash||'#dashboard').toLowerCase();bar.querySelectorAll('a').forEach(a=>{const on=a.getAttribute('href')?.toLowerCase()===cur;a.classList.toggle('active',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')})};
 set();window.addEventListener('hashchange',set,{passive:true});
}
function init(){
 css();
 if(path==='admin-dashboard.html'){addAdminShell();return}
 if(['premium-dashboard-live.html','premium-dashboard-v4.html','premium-dashboard.html','dashboard.html','profile.html','pricing.html'].includes(path)){
   load('vtradeDirectPhoneShellScript','vtrade-phone-shell-direct-v1.js?v=20260822-direct12');
   load('vtradePhoneControlsScript','vtrade-phone-controls-v1.js?v=20260822-phone11');
   addMobileNav();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
