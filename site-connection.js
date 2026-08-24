/* V TRADE AI — unified website connection/auth layer */
(function(){
  const API=(window.VTRADE_API_BASE||'https://forexai-6xw6.onrender.com').replace(/\/$/,'');
  const TOKEN_KEY='vtrade_auth_token',LEGACY_KEY='vtrade_auth';
  const token=()=>sessionStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(LEGACY_KEY)||localStorage.getItem(TOKEN_KEY)||localStorage.getItem(LEGACY_KEY)||'';
  const publicPaths=['/api/auth/login','/api/auth/2fa/verify','/api/auth/register','/api/auth/forgot-password','/api/auth/health','/api/public/pricing','/api/pricing','/health','/api/health'];
  const isApi=u=>String(u||'').startsWith(API+'/');
  const isPublic=u=>publicPaths.some(p=>String(u||'').includes(API+p));
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){const url=typeof input==='string'?input:(input&&input.url)||'';const opts=Object.assign({},init||{});opts.credentials=opts.credentials||'omit';opts.cache=opts.cache||'no-store';const headers=new Headers(opts.headers||{});const t=token();if(t&&isApi(url))headers.set('x-vtrade-auth',t);opts.headers=headers;const response=await nativeFetch(input,opts);if(response.status===401&&isApi(url)&&!isPublic(url)&&!/\/api\/auth\/logout/.test(url)){sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(LEGACY_KEY);sessionStorage.removeItem('vtrade_user');localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(LEGACY_KEY);if(!/login\.html(?:$|[?#])/.test(location.href))location.href='login.html?reason=session_expired';}return response;};
  const api=path=>API+'/'+String(path||'').replace(/^\/+/,'');
  window.VTRADE={API,token,api,fetch:window.fetch.bind(window),async session(){const t=token();if(!t)return null;const r=await nativeFetch(API+'/api/auth/session',{headers:{'x-vtrade-auth':t},credentials:'omit',cache:'no-store'});if(!r.ok)return null;const j=await r.json().catch(()=>null);return j&&j.user?j:null;},async logout(){const t=token();try{await nativeFetch(API+'/api/auth/logout',{method:'POST',headers:t?{'x-vtrade-auth':t}:{},credentials:'omit',cache:'no-store'});}catch(_){}sessionStorage.clear();localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(LEGACY_KEY);localStorage.removeItem('vtrade_user');location.href='index.html';},clearSession(){sessionStorage.clear();localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(LEGACY_KEY);},hasToken(){return!!token();}};
  if(!window.VTRADE_CONNECTION)window.VTRADE_CONNECTION={api,fetch:window.fetch.bind(window),token,API};
  function mountStatus(){if(document.getElementById('vtrade-connection'))return;const el=document.createElement('div');el.id='vtrade-connection';el.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;padding:7px 10px;border:1px solid #233552;border-radius:999px;background:#07101cf2;color:#9aa9bf;font:11px Segoe UI,Arial,sans-serif;box-shadow:0 8px 25px #0008';el.textContent='● V TRADE connecting…';document.body.appendChild(el);nativeFetch(API+'/health',{cache:'no-store',credentials:'omit'}).then(r=>{el.textContent=r.ok?'● V TRADE backend live':'● V TRADE backend offline';el.style.color=r.ok?'#22e58a':'#ff5968';}).catch(()=>{el.textContent='● V TRADE backend offline';el.style.color='#ff5968';});}
  function loadDashboardAccess(){const file=String(location.pathname.split('/').pop()||'').toLowerCase();if(file!=='dashboard.html')return;if(document.getElementById('vtrade-dashboard-access'))return;const s=document.createElement('script');s.id='vtrade-dashboard-access';s.src='dashboard-access.js?v=20260822-paid-gate-3';s.async=false;(document.head||document.documentElement).appendChild(s);}

  const PRE_I18N={
    'Pre-Market Zone Analysis':'វិភាគតំបន់ Pre-Market','MT5 authoritative · closed candle → MTF → liquidity → MSS/BOS → FVG/OB → execution':'MT5 ជាប្រភពសំខាន់ · Candle បិទ → MTF → Liquidity → MSS/BOS → FVG/OB → Execution',
    'Analyze AI':'វិភាគ AI','PRE-MARKET MTF DIRECTION STRENGTH':'កម្លាំងទិសដៅ MTF មុនទីផ្សារ','BUY Strength':'កម្លាំង BUY','SELL Strength':'កម្លាំង SELL','MTF Bias':'ទិសដៅ MTF','MT5 LIVE DATA CONNECTED':'ទិន្នន័យ MT5 ផ្ទាល់បានភ្ជាប់','WAIT — MT5 DATA INCOMPLETE':'រង់ចាំ — ទិន្នន័យ MT5 មិនទាន់ពេញលេញ','VALID EXECUTION ZONE':'តំបន់ Execution ត្រឹមត្រូវ','BUY ZONE':'តំបន់ BUY','SELL ZONE':'តំបន់ SELL','Current Price':'តម្លៃបច្ចុប្បន្ន','Entry area':'តំបន់ Entry','Execution':'ការប្រតិបត្តិ','CANDLE-OPEN MTF PROCESSING · LIVE':'ដំណើរការ MTF តាម Candle · ផ្ទាល់','CANDLE / WICK / PATTERN':'Candle / Wick / Pattern','Open':'បើក','High':'ខ្ពស់','Low':'ទាប','Close':'បិទ','Body':'តួ Candle','Upper Wick':'Wick ខាងលើ','Lower Wick':'Wick ខាងក្រោម','Pattern':'Pattern','NORMAL':'ធម្មតា','WAIT':'រង់ចាំ','PASS':'ជាប់','ENTRY READY':'ត្រៀមចូល','WAIT — NO VALID DIRECTIONAL ZONE':'រង់ចាំ — មិនមានតំបន់ទិសដៅត្រឹមត្រូវ','WAIT — SELL RETEST INTO ZONE':'រង់ចាំ — SELL Retest ចូលតំបន់','WAIT — SELL RETEST DOWN INTO ZONE':'រង់ចាំ — SELL Retest ចុះចូលតំបន់','WAIT — SELL ZONE ACTIVE · CONFIRM SWEEP/MSS':'រង់ចាំ — SELL Zone សកម្ម · បញ្ជាក់ Sweep/MSS','WAIT — BUY RETEST INTO ZONE':'រង់ចាំ — BUY Retest ចូលតំបន់','WAIT — BUY RETEST UP INTO ZONE':'រង់ចាំ — BUY Retest ឡើងចូលតំបន់','WAIT — BUY ZONE ACTIVE · CONFIRM SWEEP/MSS':'រង់ចាំ — BUY Zone សកម្ម · បញ្ជាក់ Sweep/MSS','WAIT — NO DIRECTIONAL BIAS':'រង់ចាំ — មិនទាន់មានទិសដៅ','No order authorization. Mandatory ICT confirmation is still required.':'មិនទាន់អនុញ្ញាត Order។ ត្រូវការការបញ្ជាក់ ICT ចាំបាច់ជាមុន។','Waiting for mandatory ICT gates':'រង់ចាំ ICT Gates ចាំបាច់','Waiting for broker-native MTF history':'រង់ចាំប្រវត្តិ MTF ពី Broker/MT5','Waiting for confirmation':'រង់ចាំការបញ្ជាក់','Waiting for liquidity sweep':'រង់ចាំ Liquidity Sweep'};
  const translatePre=()=>{const host=document.getElementById('vtradePreMarket');if(!host)return;const km=localStorage.getItem('vtrade_lang')==='km';const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){if(!n.nodeValue.trim())continue;const raw=n.nodeValue;let out=raw;if(km){for(const [en,kh] of Object.entries(PRE_I18N))out=out.split(en).join(kh);if(out===raw&&/[A-Za-z]/.test(raw)&&raw.length<180){const m=raw.match(/^(\s*)([A-Za-z][^·]*?)(\s*)$/);if(m&&PRE_I18N[m[2]])out=m[1]+PRE_I18N[m[2]]+m[3]}}else{for(const [en,kh] of Object.entries(PRE_I18N))out=out.split(kh).join(en)}if(out!==raw)n.nodeValue=out;}};
  const preTruth=()=>{const b=document.getElementById('backend');if(!b||b.textContent!=='BACKEND ERROR')return;const fetcher=window.VTRADE_CONNECTION?.fetch||window.fetch;const url=window.VTRADE_CONNECTION?.api?window.VTRADE_CONNECTION.api('/api/pre-market/mt5-authoritative'):API+'/api/pre-market/mt5-authoritative';fetcher(url,{cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():null).then(d=>{if(d?.success!==false&&d){b.textContent='MT5 LIVE · PRE-MARKET READY';b.className='backend';const s=document.getElementById('status');if(s){s.textContent=localStorage.getItem('vtrade_lang')==='km'?'MT5 ផ្ទាល់បានភ្ជាប់ · Pre-Market Ready':'MT5 live connected · Pre-Market Ready';s.className='notice success';}}}).catch(()=>{});};

  // REAL MT5 OHLC CANDLESTICK CHART V1 — Pre-Market only.
  // Replaces the old close-price polyline without changing Telegram or signal authority.
  function installOhlcChart(){
    const file=String(location.pathname.split('/').pop()||'').toLowerCase();
    if(file!=='premium-dashboard-live.html'||typeof window.renderChart!=='function'||window.__vtradeOhlcChartInstalled)return;
    window.__vtradeOhlcChartInstalled=true;
    const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
    const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
    const candleOf=x=>{
      if(Array.isArray(x)){
        // Common MT5/broker shapes: [time,open,high,low,close] or [open,high,low,close,time].
        if(x.length>=5){
          const a=x.slice(0,5).map(num);
          if(a.every(v=>v!==null)){
            const time=a[0]>1000000000?a[0]:null;
            if(time!==null)return {time,open:a[1],high:a[2],low:a[3],close:a[4]};
            return {time:a[4],open:a[0],high:a[1],low:a[2],close:a[3]};
          }
        }
        return null;
      }
      if(!x||typeof x!=='object')return null;
      const open=num(x.open??x.o),high=num(x.high??x.h),low=num(x.low??x.l),close=num(x.close??x.c);
      if([open,high,low,close].some(v=>v===null))return null;
      return {time:num(x.time??x.timestamp??x.t??x.ts??x.datetime),open,high,low,close};
    };
    window.renderChart=function(a){
      const select=document.getElementById('tfSelect');
      const tf=String(select?.value||window.vtradeSelectedTF||'M15').toUpperCase();
      const src=a?.chartCandles?.[tf]||a?.timeframes?.[tf]?.candles||a?.timeframes?.[tf]?.bars||[];
      const candles=Array.isArray(src)?src.map(candleOf).filter(Boolean).slice(-60):[];
      const host=document.getElementById('chart');
      if(!host)return;
      if(candles.length<3){host.innerHTML=`<div class="empty">${esc(tf)} OHLC candles unavailable — MT5 feed remains authoritative</div>`;return;}
      const W=1000,H=320,padL=18,padR=10,padT=30,padB=28;
      const hi=Math.max(...candles.map(c=>c.high)),lo=Math.min(...candles.map(c=>c.low)),range=(hi-lo)||1;
      const y=v=>padT+(hi-v)/range*(H-padT-padB);
      const step=(W-padL-padR)/candles.length;
      const body=Math.max(3,Math.min(10,step*.58));
      const parts=[];
      parts.push(`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="${esc(tf)} MT5 candlestick chart">`);
      // subtle horizontal price grid
      for(let i=0;i<=4;i++){const gy=padT+i*(H-padT-padB)/4;parts.push(`<line x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}" stroke="#142039" stroke-width="1" vector-effect="non-scaling-stroke"/>`);}
      candles.forEach((c,i)=>{
        const x=padL+i*step+step/2;
        const yo=y(c.open),yc=y(c.close),yh=y(c.high),yl=y(c.low);
        const bull=c.close>=c.open;
        const fill=bull?'#22e58a':'#ff5968';
        const top=Math.min(yo,yc),height=Math.max(1,Math.abs(yc-yo));
        parts.push(`<line x1="${x}" y1="${yh}" x2="${x}" y2="${yl}" stroke="${fill}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`);
        parts.push(`<rect x="${x-body/2}" y="${top}" width="${body}" height="${height}" rx="1" fill="${fill}" opacity=".95"><title>O ${c.open.toFixed(2)} · H ${c.high.toFixed(2)} · L ${c.low.toFixed(2)} · C ${c.close.toFixed(2)}</title></rect>`);
      });
      const last=candles[candles.length-1];
      const ly=y(last.close);
      parts.push(`<line x1="${padL}" y1="${ly}" x2="${W-padR}" y2="${ly}" stroke="#35d8ff" stroke-width="1" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>`);
      parts.push(`<text x="${W-padR-2}" y="${Math.max(14,ly-5)}" text-anchor="end" fill="#35d8ff" font-size="12">${last.close.toFixed(2)}</text>`);
      parts.push(`</svg>`);
      const lastTime=last.time?new Date(last.time<1e12?last.time*1000:last.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'';
      host.innerHTML=`<div class="chart-caption" style="position:absolute;left:10px;top:8px;z-index:2;color:#9fb0c7;font-size:11px;font-weight:800">${esc(tf)} · ${candles.length} closed candles · MT5 LIVE · OHLC</div>${parts.join('')}`;
    };
    try{if(typeof latestAnalysis!=='undefined'&&latestAnalysis)window.renderChart(latestAnalysis);}catch(_){}
  };

  const installPremiumTruth=()=>{const file=String(location.pathname.split('/').pop()||'').toLowerCase();if(file!=='premium-dashboard-live.html')return;const run=()=>{translatePre();preTruth();installOhlcChart()};run();new MutationObserver(run).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',run);document.addEventListener('vtrade:language-changed',run);setInterval(run,1500)};
  function init(){mountStatus();loadDashboardAccess();installPremiumTruth();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
