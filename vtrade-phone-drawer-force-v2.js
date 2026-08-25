/* V TRADE AI — PHONE DRAWER FORCE V2
 * Phone-only. Fixes drawer/scrim state getting stuck after navigation,
 * disabled controls, or competing mobile handlers.
 * PC is untouched.
 */
(()=>{
'use strict';
if(!window.matchMedia?.('(max-width:900px)').matches||window.__VTRADE_PHONE_DRAWER_FORCE_V2__)return;
window.__VTRADE_PHONE_DRAWER_FORCE_V2__=true;

const style=document.createElement('style');
style.id='vtradePhoneDrawerForceV2Style';
style.textContent=`
@media(max-width:900px){
  .side{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(310px,84vw)!important;height:100dvh!important;z-index:9000!important;transform:translate3d(-110%,0,0)!important;transition:transform .22s ease!important;pointer-events:none!important;visibility:hidden!important}
  .side.open,.side.vtrade-open{transform:translate3d(0,0,0)!important;pointer-events:auto!important;visibility:visible!important}
  #scrim,.scrim{position:fixed!important;inset:0!important;z-index:8500!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;background:rgba(0,0,0,.58)!important}
  #scrim.show,.scrim.show{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
  #vtradeMobileBar{z-index:8000!important}
  body{overflow-x:hidden!important}
}
`;
(document.head||document.documentElement).appendChild(style);

const side=()=>document.querySelector('.side');
const scrims=()=>[...document.querySelectorAll('#scrim,.scrim')];
const close=()=>{const s=side();s?.classList.remove('open','vtrade-open');scrims().forEach(x=>x.classList.remove('show'));};
const open=()=>{const s=side();if(!s)return;s.classList.add('open');scrims().forEach(x=>x.classList.add('show'));};

// Never leave the drawer open on a fresh phone page.
if(side()?.classList.contains('open')||side()?.classList.contains('vtrade-open'))close();

// Outside tap always closes the drawer.
scrims().forEach(x=>x.addEventListener('touchend',e=>{e.preventDefault();close();},{passive:false,capture:true}));
scrims().forEach(x=>x.addEventListener('click',close,true));

// Menu button: force a single authoritative open/close state.
const menu=document.querySelector('.top>.mobile');
if(menu){
  menu.addEventListener('touchend',e=>{e.preventDefault();e.stopImmediatePropagation();const s=side();s?.classList.contains('open')||s?.classList.contains('vtrade-open')?close():open();},{passive:false,capture:true});
  menu.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const s=side();s?.classList.contains('open')||s?.classList.contains('vtrade-open')?close():open();},true);
}

// Any real navigation from the drawer closes it before route/hash handling.
document.addEventListener('click',e=>{
  const target=e.target?.closest?.('.side a,.side button,[data-nav]');
  if(target)setTimeout(close,0);
},true);
document.addEventListener('touchend',e=>{
  const target=e.target?.closest?.('.side a,.side button,[data-nav]');
  if(target)setTimeout(close,0);
},{passive:true,capture:true});

window.VTRADE_PHONE_DRAWER_CLOSE_V2=close;
window.VTRADE_PHONE_DRAWER_OPEN_V2=open;
})();
