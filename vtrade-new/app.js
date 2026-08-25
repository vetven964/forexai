(() => {
  'use strict';
  const KEY = 'vtrade-new-settings-v1';
  const defaults = {
    autoTrade: false, autoLot: true, risk: 1, fixedLot: 0.01, maxLot: 0.02,
    maxTrades: 1, dailyLoss: 5, killSwitch: false,
    symbols: { XAUUSD: true, GBPUSD: false, EURUSD: false, USDJPY: false, NAS100: false, US30: false }
  };
  const load = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || '{}'); return { ...defaults, ...x, symbols: { ...defaults.symbols, ...(x.symbols || {}) } }; } catch { return structuredClone(defaults); } };
  const state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const $ = (s) => document.querySelector(s);
  const content = $('#main'), app = $('#app'), shade = $('#drawerShade');
  const pages = {
    dashboard: () => `<div class="hero"><div><div class="muted">LIVE MARKET</div><div class="title">XAUUSD</div></div><div class="price">4,636.88</div></div><div class="grid"><div class="card"><div class="muted">MT5 CONNECTION</div><h2 class="green">CONNECTED</h2><small>Live feed ready</small></div><div class="card"><div class="muted">BIAS</div><h2 class="green">BULLISH</h2><small>MTF ICT confirmation</small></div><div class="card"><div class="muted">SIGNAL</div><h2>WAIT</h2><small>Waiting for valid entry</small></div><div class="card"><div class="muted">AUTO TRADE</div><h2 id="dashAuto">${state.autoTrade&&!state.killSwitch?'ON':'OFF'}</h2><small>${state.killSwitch?'Kill switch active':'Execution guarded'}</small></div></div><div class="section card"><div class="row"><b>ICT Flow</b><span class="muted">M5 · M15 · H1 · H4</span></div><div class="tabs" style="margin-top:12px"><span class="tab active">Liquidity</span><span class="tab">MSS / BOS</span><span class="tab">FVG / OB</span><span class="tab">Entry</span><span class="tab">SL / TP</span></div><div class="status">No valid auto-entry yet. The engine must validate structure, zone and risk before an order is allowed.</div></div>`,
    terminal: () => `<div class="hero"><div><div class="muted">MT5 TERMINAL</div><div class="title">Auto Trade Control</div></div><button class="btn ${state.killSwitch?'danger':''}" id="kill">${state.killSwitch?'KILL SWITCH ON':'KILL SWITCH'}</button></div><div class="card"><div class="row"><div><b>Auto Trade</b><div class="muted">Allow validated signals to reach MT5</div></div><button class="switch ${state.autoTrade&&!state.killSwitch?'on':''}" id="auto" aria-label="Auto Trade"><i></i></button></div></div><div class="section card"><div class="row"><b>Manage Tradable Symbols</b><span class="muted">Allowed only</span></div><div class="symbol-grid" style="margin-top:10px">${Object.entries(state.symbols).map(([s,v])=>`<div class="symbol"><b>${s}</b><button class="switch ${v?'on':''}" data-symbol="${s}" aria-label="${s}"><i></i></button></div>`).join('')}</div></div><div class="section card"><div class="row"><b>Lot & Risk</b><select id="lotMode"><option value="auto" ${state.autoLot?'selected':''}>AUTO — MT5 Risk</option><option value="fixed" ${!state.autoLot?'selected':''}>FIXED LOT</option></select></div><div class="controls" style="margin-top:10px"><div class="field"><label>Risk %</label><input id="risk" type="number" min="0.1" max="10" step="0.1" value="${state.risk}"></div><div class="field"><label>Fixed Lot</label><input id="fixedLot" type="number" min="0.01" step="0.01" value="${state.fixedLot}"></div><div class="field"><label>Max Lot</label><input id="maxLot" type="number" min="0.01" step="0.01" value="${state.maxLot}"></div><div class="field"><label>Max Open Trades</label><input id="maxTrades" type="number" min="1" max="20" value="${state.maxTrades}"></div><div class="field"><label>Daily Loss Limit %</label><input id="dailyLoss" type="number" min="0.5" max="50" step="0.5" value="${state.dailyLoss}"></div><div class="field"><label>Calculated Lot</label><strong class="green">${state.autoLot?'AUTO':'FIXED '+Number(state.fixedLot).toFixed(2)}</strong></div></div></div><div class="section card"><div class="row"><div><b>Execution Guard</b><div class="muted">Signal → Risk → MT5 Order</div></div><span class="green">${state.killSwitch?'BLOCKED':'ARMED'}</span></div><div class="status" style="margin-top:10px">SL, TP1/TP2/TP3, duplicate-order protection, spread guard and max-loss rules are required before live execution.</div></div>`,
    signals: () => `<div class="title">Signals</div><div class="section grid"><div class="card"><div class="muted">XAUUSD</div><h2 class="green">WAIT · BUY BIAS</h2><div>Liquidity → MSS/BOS → FVG/OB</div></div><div class="card"><div class="muted">CONFIDENCE</div><h2>—</h2><div class="muted">No executable setup</div></div></div>`,
    trades: () => `<div class="title">Trade History</div><div class="section card"><table class="table"><thead><tr><th>Symbol</th><th>Side</th><th>Lot</th><th>Status</th></tr></thead><tbody><tr><td>XAUUSD</td><td>—</td><td>—</td><td class="muted">No live order</td></tr></tbody></table></div>`,
    settings: () => `<div class="title">Settings</div><div class="section card"><div class="row"><b>Backend</b><span class="green">LIVE</span></div><div class="row" style="margin-top:14px"><b>MT5 Execution</b><span class="muted">Demo-first</span></div><div class="row" style="margin-top:14px"><b>Telegram</b><span class="muted">Ready for API connection</span></div><div class="status" style="margin-top:14px">New Website UI is isolated from the legacy phone UI. Production orders remain disabled until the MT5 execution API is connected and validated.</div></div>`,
  };
  function closeDrawer(){ app.classList.remove('drawer-open'); shade.classList.remove('show'); }
  function openDrawer(){ app.classList.add('drawer-open'); shade.classList.add('show'); }
  function render(page='dashboard') {
    content.innerHTML = pages[page] ? pages[page]() : pages.dashboard();
    document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    bindPage(page); closeDrawer();
  }
  function bindPage(page){
    if(page !== 'terminal') return;
    $('#auto')?.addEventListener('click',()=>{ if(state.killSwitch)return; state.autoTrade=!state.autoTrade; save(); render('terminal'); });
    $('#kill')?.addEventListener('click',()=>{ state.killSwitch=!state.killSwitch; if(state.killSwitch)state.autoTrade=false; save(); render('terminal'); });
    $('#lotMode')?.addEventListener('change',e=>{state.autoLot=e.target.value==='auto';save();render('terminal');});
    [['risk','risk'],['fixedLot','fixedLot'],['maxLot','maxLot'],['maxTrades','maxTrades'],['dailyLoss','dailyLoss']].forEach(([id,k])=>$('#'+id)?.addEventListener('change',e=>{state[k]=Number(e.target.value)||state[k];save();}));
    document.querySelectorAll('[data-symbol]').forEach(b=>b.addEventListener('click',()=>{state.symbols[b.dataset.symbol]=!state.symbols[b.dataset.symbol];save();render('terminal');}));
  }
  document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>render(b.dataset.page)));
  $('#menu').addEventListener('click',()=>app.classList.contains('drawer-open')?closeDrawer():openDrawer());
  shade.addEventListener('click',closeDrawer);
  render('dashboard');
})();
