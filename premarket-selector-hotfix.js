/* V-TRADE AI — Pre-Market timeframe selector hotfix V1
 * Server-side patcher: injects the desktop/mobile V91 selector handler
 * inside terminal-pre-market.js so it can call the existing authoritative
 * api() + render() functions directly.
 */
'use strict';
const fs=require('fs');
const path=require('path');

const FILE=path.join(__dirname,'terminal-pre-market.js');
const MARK='VTRADE_PREMARKET_SELECTOR_HOTFIX_V1';

if(!fs.existsSync(FILE)){
  console.warn('[V-TRADE PRE-MARKET SELECTOR V1] terminal-pre-market.js missing; skipping');
}else{
  let s=fs.readFileSync(FILE,'utf8');
  if(!s.includes(MARK)){
    const anchor='window.__VTRADE_PREMARKET_V91__=true;';
    const guard=`\n/* ${MARK} */\n`;
    const handler=`\n/* ${MARK}: authoritative click bridge for M5/M15/H1/H4/D1 */\nfunction bindV91TimeframeSelector(){\n  if(window.__VTRADE_PREMARKET_SELECTOR_BOUND_V1__)return;\n  window.__VTRADE_PREMARKET_SELECTOR_BOUND_V1__=true;\n  document.addEventListener('click',async ev=>{\n    const btn=ev.target?.closest?.('#vtradePreMarket [data-v91tf]');\n    if(!btn)return;\n    const tf=String(btn.getAttribute('data-v91tf')||'').toUpperCase();\n    if(!TFS.includes(tf))return;\n    ev.preventDefault();\n    ev.stopImmediatePropagation();\n    if(window.__VTRADE_PREMARKET_SELECTOR_BUSY_V1__)return;\n    window.__VTRADE_PREMARKET_SELECTOR_BUSY_V1__=true;\n    document.querySelectorAll('#vtradePreMarket [data-v91tf]').forEach(x=>x.classList.toggle('on',x===btn));\n    try{\n      const raw=await api('/api/pre-market/mt5-authoritative?_='+Date.now());\n      render(raw,tf);\n    }catch(err){\n      console.error('[V-TRADE PRE-MARKET SELECTOR V1]',err);\n      render({},tf,err?.message||String(err));\n    }finally{\n      window.__VTRADE_PREMARKET_SELECTOR_BUSY_V1__=false;\n    }\n  },true);\n}\nbindV91TimeframeSelector();\n`;
    const pos=s.lastIndexOf('\n})();');
    if(pos<0){
      console.warn('[V-TRADE PRE-MARKET SELECTOR V1] IIFE end anchor missing; skipping safely');
    }else{
      s=s.slice(0,pos)+handler+s.slice(pos);
      fs.writeFileSync(FILE,s,'utf8');
      console.log('[V-TRADE PRE-MARKET SELECTOR] M5/M15/H1/H4/D1 click bridge injected');
    }
  }
}
