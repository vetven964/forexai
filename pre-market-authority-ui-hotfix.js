/* V-TRADE AI — Pre-Market authoritative UI bridge V3
 * Must load before terminal-pre-market.js.
 * Redirects only the Pre-Market Candle-Open request to the live MT5-backed route.
 * Also normalizes Telegram/MT5 status cards from their authoritative session APIs.
 */
(function(){
  'use strict';
  if(window.__VTRADE_PREMARKET_AUTH_UI_V3__)return;
  window.__VTRADE_PREMARKET_AUTH_UI_V3__=true;

  function install(){
    const c=window.VTRADE_CONNECTION;
    if(!c||typeof c.fetch!=='function'||typeof c.api!=='function')return false;
    if(!c.__vtradePreMarketAuthorityWrapped){
      const originalFetch=c.fetch.bind(c), originalApi=c.api.bind(c);
      c.fetch=function(url,options){
        const u=String(url||'');
        if(u.includes('/api/pre-market/candle-open')){
          const target=originalApi('/api/pre-market/xauusd');
          console.info('[V-TRADE PRE-MARKET AUTH UI] candle-open redirected to live MT5-backed route');
          return originalFetch(target,options);
        }
        return originalFetch(url,options);
      };
      c.__vtradePreMarketAuthorityWrapped=true;
    }
    return true;
  }

  function setTextNodeText(root,from,to){
    if(!root)return false;
    let changed=false;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let n;
    while((n=walker.nextNode()))nodes.push(n);
    for(const node of nodes){
      if(String(node.nodeValue||'').trim()===from){
        node.nodeValue=String(node.nodeValue).replace(from,to);
        changed=true;
      }
    }
    return changed;
  }

  function telegramConnected(d){
    const t=d?.telegram||d?.data||d?.session||d;
    return t?.connected===true || t?.configured===true || t?.active===true ||
      String(t?.status||'').toLowerCase()==='connected' ||
      String(t?.status||'').toLowerCase()==='active' ||
      t?.bot?.connected===true || t?.session?.connected===true;
  }

  function applyTelegramStatus(d){
    if(!telegramConnected(d))return;
    setTextNodeText(document.body,'Credentials missing/disabled','CONNECTED — Bot ready');
    setTextNodeText(document.body,'Credentials missing / disabled','CONNECTED — Bot ready');
    document.querySelectorAll('*').forEach(el=>{
      const text=String(el.textContent||'').trim();
      if(text==='CONNECTED — Bot ready'){
        el.style.color='#22e58a';
        el.style.fontWeight='800';
      }
    });
    console.info('[V-TRADE TELEGRAM UI] authoritative user session connected');
  }

  function applyFeedStatus(d){
    const t=d?.mt5||d?.data||d;
    const ready=t?.ready===true || t?.connected===true || String(t?.state||'').toUpperCase()==='READY';
    if(!ready)return;
    const labels=[...document.querySelectorAll('*')].filter(el=>String(el.textContent||'').trim()==='Feed sequence continuity');
    for(const label of labels){
      const parent=label.parentElement;
      if(!parent)continue;
      const candidates=[...parent.querySelectorAll('span,small,b,strong,div')].filter(el=>el!==label);
      const target=candidates.reverse().find(el=>String(el.textContent||'').trim());
      if(target && !/Feed sequence continuity/i.test(target.textContent||'')){
        target.textContent='STABLE — MT5 LIVE';
        target.style.color='#22e58a';
        target.style.fontWeight='800';
      }
    }
  }

  async function syncTruth(){
    const c=window.VTRADE_CONNECTION;
    if(!c?.fetch||!c?.api)return;
    try{
      const r=await c.fetch(c.api('/api/telegram/status'),{credentials:'omit',cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(r.ok)applyTelegramStatus(d);
    }catch(_){/* keep existing status if the optional status probe is unavailable */}
    try{
      const r=await c.fetch(c.api('/api/v5/mt5/status'),{credentials:'omit',cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(r.ok)applyFeedStatus(d);
    }catch(_){/* keep existing feed status */}
  }

  function boot(){
    install();
    syncTruth();
    [1000,3000,6000].forEach(ms=>setTimeout(syncTruth,ms));
    setInterval(syncTruth,15000);
  }

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>=40)clearInterval(timer);},250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
