/* V-TRADE MTF DROPDOWN — PC + PHONE
 * Keeps the authoritative MTF data/cards intact and adds a compact selector.
 * V2 also synchronizes the existing dashboard MTF cards from the authoritative
 * MT5-backed Pre-Market route. It never changes trade authorization.
 */
(function(){
  'use strict';
  const TFS=['M5','M15','H1','H4','D1'];
  const CORE=['H4','H1','M15'];
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const bias=v=>{const s=String(v??'').toUpperCase();return /BULL|BUY/.test(s)?'BULLISH':/BEAR|SELL/.test(s)?'BEARISH':'NEUTRAL'};

  function init(){
    const radar=[...document.querySelectorAll('.radar')].find(x=>x.querySelector('.tf'));
    if(!radar || radar.dataset.vtradeMtfDropdown==='1') return;
    const cards=[...radar.querySelectorAll('.tf')].filter(c=>TFS.some(tf=>new RegExp('(^|\\s)'+tf+'(\\s|$)').test(c.textContent.trim())));
    if(cards.length<2) return;
    radar.dataset.vtradeMtfDropdown='1';
    const available=TFS.filter(tf=>cards.some(c=>new RegExp('(^|\\s)'+tf+'(\\s|$)').test(c.textContent.trim())));
    const bar=document.createElement('div');
    bar.className='vtrade-mtf-selectbar';
    bar.innerHTML='<label for="vtrade-mtf-select">MTF</label><select id="vtrade-mtf-select" aria-label="Select timeframe"></select>';
    const select=bar.querySelector('select');
    available.forEach(tf=>{const o=document.createElement('option');o.value=tf;o.textContent=tf;o.dataset.tf=tf;select.appendChild(o);});
    radar.parentNode.insertBefore(bar,radar);
    const setTf=tf=>{
      cards.forEach(card=>{
        const match=new RegExp('(^|\\s)'+tf+'(\\s|$)').test(card.textContent.trim());
        card.style.display=match?'block':'none';
      });
      select.value=tf;
      radar.dataset.selectedTf=tf;
    };
    select.addEventListener('change',()=>setTf(select.value));
    const saved=localStorage.getItem('vtrade_mtf_tf');
    const initial=available.includes(saved)?saved:available[0];
    select.addEventListener('change',()=>localStorage.setItem('vtrade_mtf_tf',select.value));
    setTf(initial);
  }

  function roots(raw){return [raw?.timeframes,raw?.frames,raw?.analysis?.timeframes,raw?.data?.timeframes,raw?.mtf?.timeframes,raw?.mtf].filter(Boolean);}
  function row(raw,tf){
    const keys={M5:['M5','m5','5m'],M15:['M15','m15','15m'],H1:['H1','h1','1h'],H4:['H4','h4','4h'],D1:['D1','d1','1d']}[tf]||[tf];
    for(const r of roots(raw)){
      for(const k of keys){if(r&&r[k]&&typeof r[k]==='object')return r[k];}
      if(Array.isArray(r)){const z=r.find(x=>String(x?.tf??x?.timeframe??x?.interval??'').toUpperCase()===tf);if(z)return z;}
    }
    return {};
  }
  function frameReady(r){
    if(!r||typeof r!=='object')return false;
    if(r.ready===true||r.confirmed===true||r.aligned===true)return true;
    const n=Number(r.bars??r.feedBars??r.count??r.historyCount??0);
    return n>0 || Array.isArray(r.candles)&&r.candles.length>0 || Array.isArray(r.history)&&r.history.length>0;
  }
  function extract(raw){
    const out={};
    for(const tf of TFS){const r=row(raw,tf);out[tf]={...r,bias:bias(r.bias??r.direction??r.trend??r.signal??r.structure?.bias),score:num(r.directionScore??r.score??r.setupScore),price:num(r.currentPrice??r.price??r.livePrice??r.quote?.price??r.quote?.bid??raw?.price),ready:frameReady(r)};}
    return out;
  }
  function cardTf(card){return TFS.find(tf=>new RegExp('(^|\\s)'+tf+'(\\s|$)').test(card.textContent.trim()))||null;}
  function paintCards(data){
    document.querySelectorAll('.radar .tf').forEach(card=>{
      const tf=cardTf(card); if(!tf||!data[tf])return;
      const r=data[tf], b=r.bias;
      card.dataset.liveReady=r.ready?'1':'0';
      card.dataset.liveBias=b;
      card.classList.remove('bull','bear','neutral');
      card.classList.add(b==='BULLISH'?'bull':b==='BEARISH'?'bear':'neutral');
      const pill=card.querySelector('.pill');
      if(pill){pill.textContent=r.ready?(b==='NEUTRAL'?'WAIT':b):'WAIT';pill.classList.remove('bull','bear','neutral');pill.classList.add(b==='BULLISH'?'bull':b==='BEARISH'?'bear':'neutral');}
    });
  }
  function paintCoreSummary(data){
    const ready=CORE.filter(tf=>data[tf]?.ready).length;
    const bull=CORE.filter(tf=>data[tf]?.bias==='BULLISH').length;
    const bear=CORE.filter(tf=>data[tf]?.bias==='BEARISH').length;
    const aligned=Math.max(bull,bear);
    document.querySelectorAll('.cards .card').forEach(card=>{
      const text=String(card.textContent||'');
      if(!/MTF/i.test(text))return;
      const big=card.querySelector('.huge,.big');
      if(big&&/—\/3|\d+\/3/.test(big.textContent||''))big.textContent=`${aligned}/3`;
      card.dataset.mtfLiveReady=ready===3?'1':'0';
      const sub=[...card.querySelectorAll('.kv,small,.sub')].find(x=>/Core:/i.test(x.textContent||''));
      if(sub&&ready<3)sub.setAttribute('title',`Live core data: ${ready}/3`);
    });
  }
  async function syncLive(){
    const c=window.VTRADE_CONNECTION;
    if(!c?.fetch||!c?.api)return;
    try{
      const r=await c.fetch(c.api('/api/pre-market/mt5-authoritative'),{credentials:'omit',cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d?.success===false)return;
      const data=extract(d); paintCards(data); paintCoreSummary(data);
      window.dispatchEvent(new CustomEvent('vtrade:mtf-live',{detail:{raw:d,timeframes:data}}));
      console.info('[V-TRADE MTF UI] live sync | '+TFS.map(tf=>tf+':'+(data[tf].ready?'READY':'WAIT')).join(' '));
    }catch(_){/* keep existing UI state */}
  }
  function boot(){
    init();
    syncLive();
    setInterval(syncLive,15000);
    const mo=new MutationObserver(()=>init());
    mo.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();