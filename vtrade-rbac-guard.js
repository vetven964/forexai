/* V TRADE AI — Server-authoritative RBAC guard V14 — new UI sidebar link */
(() => {
  'use strict';
  if (window.__VTRADE_RBAC_GUARD_V14__) return;
  window.__VTRADE_RBAC_GUARD_V14__ = true;
  const BACKEND='https://forexai-6xw6.onrender.com';
  const file=String(location.pathname.split('/').pop()||'').toLowerCase();
  const isAdminPage=file==='admin-dashboard.html';
  const isTerminalPage=file==='premium-dashboard-live.html';
  if(!isAdminPage&&!isTerminalPage)return;
  const token=()=>window.VTRADE_CONNECTION?.token?.()||localStorage.getItem('vtrade_auth_token')||localStorage.getItem('vtrade_auth')||sessionStorage.getItem('vtrade_auth_token')||sessionStorage.getItem('vtrade_auth')||'';
  const isAdminRole=r=>['admin','administrator'].includes(String(r||'').trim().toLowerCase());
  const login=r=>location.replace(`login.html?required=login&reason=${encodeURIComponent(r||'login')}`);
  const goTerminal=()=>location.replace('premium-dashboard-live.html?v=20260824-ui-sync-v1');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function verifySession(){
    const t=token();
    if(!t)return{ok:false,reason:'missing-token'};
    let err=null;
    for(let i=1;i<=4;i++){
      try{
        const r=await fetch(BACKEND+'/api/auth/session',{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',headers:{Accept:'application/json','x-vtrade-auth':t}});
        const d=await r.json().catch(()=>({}));
        if(r.ok&&d.user)return{ok:true,user:d.user};
        err=new Error(r.status===401?'Unauthorized':`Session HTTP ${r.status}`);
      }catch(e){err=e}
      if(i<4)await sleep(250*i);
    }
    return{ok:false,reason:err?.message||'session-failed'};
  }
  function persistUser(u){const raw=JSON.stringify(u||{});try{localStorage.setItem('vtrade_user',raw)}catch{}try{sessionStorage.setItem('vtrade_user',raw)}catch{}}
  function loadScript(id,src){if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=src;s.async=false;(document.head||document.documentElement).appendChild(s)}
  function loadDashboardUiFix(){
    if(!isAdminPage&&!isTerminalPage)return;
    loadScript('vtradeDashboardUiFixScript','dashboard-ui-fix.js?v=20260822-mobile-card-v6');
    if(isTerminalPage){
      loadScript('vtradePhoneIdentityRootFixScript','vtrade-phone-identity-root-fix.js?v=20260822-root2');
      loadScript('vtradePhoneIdentityHardHideScript','vtrade-phone-identity-hard-hide.js?v=20260822-hard1');
      loadScript('vtradeHeaderAuthoritySyncScript','vtrade-header-authority-sync.js?v=20260821-authority');
      loadScript('vtradeBackendStatusSyncScript','vtrade-backend-status-sync.js?v=20260821-backend-truth');
      loadScript('vtradeCrossUiSyncScript','vtrade-cross-ui-sync.js?v=20260824-sync-v1');
      loadScript('vtradePhoneI18nScript','vtrade-phone-i18n.js?v=20260824-i18n-v3');
    }
  }
  function installNewVTradeLink(){
    if(!isTerminalPage)return;
    const add=()=>{
      const nav=document.querySelector('.side .nav');
      if(!nav||nav.querySelector('[data-new-vtrade-link]'))return !!nav;
      if(!document.getElementById('newVTradeSidebarStyle')){
        const style=document.createElement('style');style.id='newVTradeSidebarStyle';style.textContent=`
          .nav .new-vtrade-link{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:12px 13px;border:1px solid #8050ff;border-radius:12px;background:linear-gradient(90deg,#32117c,#17102e);color:#fff;text-decoration:none;font:inherit;font-weight:800;box-sizing:border-box;box-shadow:0 0 18px #693cff22}
          .nav .new-vtrade-link:hover{border-color:#a47aff;background:linear-gradient(90deg,#4a1bb0,#20133d);color:#fff}
          .nav .new-vtrade-link .nav-icon{width:22px;text-align:center;font-size:16px;flex:0 0 22px}
          @media(max-width:900px){.nav .new-vtrade-link{min-height:48px;margin-top:2px;padding:13px}.nav .new-vtrade-link .nav-icon{font-size:17px}}
        `;document.head.appendChild(style);
      }
      const link=document.createElement('a');link.className='new-vtrade-link';link.setAttribute('data-new-vtrade-link','1');link.href='vtrade-new/index.html';link.target='_blank';link.rel='noopener noreferrer';link.innerHTML='<span class="nav-icon">🆕</span><span>New V TRADE</span>';
      const terminal=Array.from(nav.querySelectorAll('button,a')).find(el=>/terminal/i.test(el.textContent||''));
      if(terminal)terminal.insertAdjacentElement('afterend',link);else nav.appendChild(link);
      return true;
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
    let tries=0;const timer=setInterval(()=>{tries++;if(add()||tries>30)clearInterval(timer)},200);
  }
  async function verify(){
    const result=await verifySession();
    if(!result.ok)return login(result.reason);
    const u=result.user,role=String(u?.role||'user').trim().toLowerCase();
    persistUser(u);
    document.documentElement.lang=localStorage.getItem('vtrade_lang')==='km'?'km':'en';
    document.documentElement.dataset.role=role;
    if(isAdminPage&&!isAdminRole(role))return goTerminal();
    window.dispatchEvent(new CustomEvent('vtrade:rbac-ready',{detail:{user:u,role,mobile:matchMedia('(max-width:900px)').matches}}));
  }
  loadDashboardUiFix();
  installNewVTradeLink();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',verify,{once:true});else verify();
})();
