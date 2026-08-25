/* V TRADE AI — PHONE TOUCH HOTFIX V1
 * Fixes mobile tap interception caused by drawer/scrim stacking.
 * Phone-only: does not change PC layout.
 */
(()=>{
  'use strict';
  if(window.__VTRADE_PHONE_TOUCH_HOTFIX_V1__) return;
  window.__VTRADE_PHONE_TOUCH_HOTFIX_V1__=true;

  const mobile=()=>window.matchMedia('(max-width:900px)').matches;

  function apply(){
    if(!mobile()) return;
    const style=document.createElement('style');
    style.id='vtradePhoneTouchHotfixV1';
    style.textContent=`
      @media(max-width:900px){
        html,body{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
        .side,.side.open,.side.vtrade-open{z-index:9000!important;pointer-events:auto!important}
        .side a,.side button,.side [role="button"]{position:relative!important;z-index:9002!important;pointer-events:auto!important;touch-action:manipulation!important}
        #scrim,.scrim{z-index:8500!important}
        #scrim:not(.show),.scrim:not(.show){pointer-events:none!important}
        #vtradeAdminScrim{z-index:8500!important}
        #vtradeMobileBar,#vtradeAdminMobileBar{z-index:9500!important;pointer-events:auto!important}
        #vtradeMobileBar a,#vtradeAdminMobileBar a,#vtradeAdminMobileBar button{pointer-events:auto!important;touch-action:manipulation!important}
        button,select,input,a,[role="button"]{touch-action:manipulation!important}
      }
    `;
    (document.head||document.documentElement).appendChild(style);

    const side=document.querySelector('.side');
    const scrims=[...document.querySelectorAll('#scrim,.scrim,#vtradeAdminScrim')];
    const sync=()=>{
      const open=!!side?.classList.contains('open') || !!side?.classList.contains('vtrade-open');
      if(side){side.style.pointerEvents='auto';side.style.zIndex='9000';}
      scrims.forEach(s=>{
        s.style.zIndex='8500';
        if(!open && !s.classList.contains('show')) s.style.pointerEvents='none';
      });
    };
    sync();
    const observer=new MutationObserver(sync);
    if(side) observer.observe(side,{attributes:true,attributeFilter:['class','style']});
    scrims.forEach(s=>observer.observe(s,{attributes:true,attributeFilter:['class','style']}));

    document.addEventListener('click',e=>{
      const el=e.target?.closest?.('.side a,.side button,.side [role="button"]');
      if(!el) return;
      el.style.pointerEvents='auto';
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  window.addEventListener('resize',apply,{passive:true});
})();
