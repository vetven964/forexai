/* V-TRADE AI — Pre-Market timeframe selector + MTF dropdown hotfix V2
 * Keeps the authoritative MT5 route untouched.
 * Adds a compact MTF Processing dropdown for desktop + phone.
 */
'use strict';
const fs=require('fs');
const path=require('path');

const FILE=path.join(__dirname,'terminal-pre-market.js');
const MARK='VTRADE_PREMARKET_SELECTOR_HOTFIX_V1';
const DROPDOWN='VTRADE_PREMARKET_MTF_DROPDOWN_V2';

if(!fs.existsSync(FILE)){
  console.warn('[V-TRADE PRE-MARKET SELECTOR V2] terminal-pre-market.js missing; skipping');
}else{
  let s=fs.readFileSync(FILE,'utf8');

  if(!s.includes(MARK)){
    const handler=`\n/* ${MARK}: authoritative click bridge for M5/M15/H1/H4/D1 */\nfunction bindV91TimeframeSelector(){\n  if(window.__VTRADE_PREMARKET_SELECTOR_BOUND_V1__)return;\n  window.__VTRADE_PREMARKET_SELECTOR_BOUND_V1__=true;\n  document.addEventListener('click',async ev=>{\n    const btn=ev.target?.closest?.('#vtradePreMarket [data-v91tf]');\n    if(!btn)return;\n    const tf=String(btn.getAttribute('data-v91tf')||'').toUpperCase();\n    if(!TFS.includes(tf))return;\n    ev.preventDefault();\n    ev.stopImmediatePropagation();\n    if(window.__VTRADE_PREMARKET_SELECTOR_BUSY_V1__)return;\n    window.__VTRADE_PREMARKET_SELECTOR_BUSY_V1__=true;\n    document.querySelectorAll('#vtradePreMarket [data-v91tf]').forEach(x=>x.classList.toggle('on',x===btn));\n    try{\n      const raw=await api('/api/pre-market/mt5-authoritative?_='+Date.now());\n      render(raw,tf);\n    }catch(err){\n      console.error('[V-TRADE PRE-MARKET SELECTOR V1]',err);\n      render({},tf,err?.message||String(err));\n    }finally{\n      window.__VTRADE_PREMARKET_SELECTOR_BUSY_V1__=false;\n    }\n  },true);\n}\nbindV91TimeframeSelector();\n`;
    const pos=s.lastIndexOf('\n})();');
    if(pos<0){
      console.warn('[V-TRADE PRE-MARKET SELECTOR V1] IIFE end anchor missing; skipping safely');
    }else{
      s=s.slice(0,pos)+handler+s.slice(pos);
      console.log('[V-TRADE PRE-MARKET SELECTOR] M5/M15/H1/H4/D1 click bridge injected');
    }
  }

  if(!s.includes(DROPDOWN)){
    const css=`\n/* ${DROPDOWN}: compact collapsible MTF processing */\nfunction installMtfDropdownV2(){\n  if(window.__VTRADE_MTF_DROPDOWN_V2__)return;\n  window.__VTRADE_MTF_DROPDOWN_V2__=true;\n  const STYLE_ID='vtradeMtfDropdownV2Css';\n  function css(){\n    if(document.getElementById(STYLE_ID))return;\n    const st=document.createElement('style');st.id=STYLE_ID;\n    st.textContent=\`#vtradePreMarket .vtrade-mtf-dd{margin-top:10px;border:1px solid #1d2c44;border-radius:12px;background:#080f1b;overflow:hidden}#vtradePreMarket .vtrade-mtf-dd-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;background:transparent;color:#cbd5e5;padding:12px 13px;font:800 12px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;cursor:pointer;text-align:left}#vtradePreMarket .vtrade-mtf-dd-head:hover{background:#0c1625}#vtradePreMarket .vtrade-mtf-dd-arrow{font-size:15px;transition:transform .18s ease}#vtradePreMarket .vtrade-mtf-dd.open .vtrade-mtf-dd-arrow{transform:rotate(180deg)}#vtradePreMarket .vtrade-mtf-dd-body{display:none;padding:0 10px 10px}#vtradePreMarket .vtrade-mtf-dd.open .vtrade-mtf-dd-body{display:grid}#vtradePreMarket .vtrade-mtf-dd-body .v91mtf{margin-top:0}\`;\n    document.head.appendChild(st);\n  }\n  function apply(){\n    const host=document.getElementById('vtradePreMarket');if(!host)return;\n    css();\n    const mtf=host.querySelector('.v91mtf');if(!mtf)return;\n    if(mtf.parentElement?.classList.contains('vtrade-mtf-dd-body'))return;\n    const box=mtf.closest('.v91x');if(!box)return;\n    const label=box.querySelector('.v91l');\n    if(!label||!/CANDLE-OPEN MTF PROCESSING/i.test(label.textContent||''))return;\n    const dd=document.createElement('div');dd.className='vtrade-mtf-dd';\n    const head=document.createElement('button');head.type='button';head.className='vtrade-mtf-dd-head';head.setAttribute('aria-expanded','false');\n    head.innerHTML='<span>MTF Processing · M5 / M15 / H1 / H4 / D1</span><span class="vtrade-mtf-dd-arrow">▾</span>';\n    const body=document.createElement('div');body.className='vtrade-mtf-dd-body';\n    mtf.parentNode.insertBefore(dd,mtf);body.appendChild(mtf);dd.appendChild(head);dd.appendChild(body);\n    head.addEventListener('click',()=>{const open=dd.classList.toggle('open');head.setAttribute('aria-expanded',String(open));});\n  }\n  function boot(){apply();const host=document.getElementById('vtradePreMarket');if(host)new MutationObserver(()=>{requestAnimationFrame(apply)}).observe(host,{childList:true,subtree:true});}\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();\n}\ninstallMtfDropdownV2();\n`;
    const pos=s.lastIndexOf('\n})();');
    if(pos>=0)s=s.slice(0,pos)+css+s.slice(pos);
    else console.warn('[V-TRADE PRE-MARKET DROPDOWN V2] IIFE end anchor missing; skipping safely');
  }

  fs.writeFileSync(FILE,s,'utf8');
  console.log('[V-TRADE PRE-MARKET] selector + MTF dropdown V2 active');
}
