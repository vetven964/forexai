/* V-TRADE MTF DROPDOWN — PC + PHONE
 * Keeps the authoritative MTF data/cards intact and adds a compact selector.
 */
(function(){
  'use strict';
  const TFS=['M5','M15','H1','H4','D1'];
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
  function boot(){
    init();
    const mo=new MutationObserver(()=>init());
    mo.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),15000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
