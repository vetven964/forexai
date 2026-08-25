(() => {
  'use strict';
  if (window.__VTRADE_AUTO_TRADE_UI__) return;
  window.__VTRADE_AUTO_TRADE_UI__ = true;

  const css = document.createElement('style');
  css.id = 'vtrade-auto-trade-ui-css';
  css.textContent = `
  #vtradeAutoFab{position:fixed;right:14px;bottom:76px;z-index:99990;border:1px solid #147850;background:linear-gradient(135deg,#0b3b29,#075f3b);color:#d8ffe9;border-radius:16px;padding:11px 14px;font-weight:900;font-size:11px;box-shadow:0 12px 35px #0009;display:flex;align-items:center;gap:8px}
  #vtradeAutoFab .dot{width:9px;height:9px;border-radius:50%;background:#22e58a;box-shadow:0 0 12px #22e58a}
  #vtradeAutoOverlay{position:fixed;inset:0;z-index:99999;background:#0009;backdrop-filter:blur(5px);display:none;align-items:flex-end;justify-content:center}
  #vtradeAutoOverlay.show{display:flex}
  #vtradeAutoPanel{width:min(560px,100%);max-height:92dvh;overflow:auto;background:linear-gradient(145deg,#0b1423,#060b13);border:1px solid #263650;border-bottom:0;border-radius:22px 22px 0 0;box-shadow:0 -25px 80px #000c;color:#f5f8ff;padding:16px;box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}
  .vta-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.vta-head b{font-size:17px}.vta-head small{display:block;color:#8493ab;font-size:10px;margin-top:3px}.vta-close{border:1px solid #263650;background:#09111e;color:#fff;border-radius:10px;width:40px;height:40px;font-size:18px}
  .vta-status{display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #147850;background:#062d20;border-radius:14px;margin-bottom:12px}.vta-status span{color:#a8ffd6;font-size:11px;font-weight:900}.vta-switch{width:48px;height:27px;border:0;border-radius:99px;background:#334155;position:relative}.vta-switch i{position:absolute;top:4px;left:4px;width:19px;height:19px;border-radius:50%;background:#fff;transition:.18s}.vta-switch.on{background:#16a06a}.vta-switch.on i{left:25px}
  .vta-section{border:1px solid #1d2c44;background:#080f1b;border-radius:15px;padding:13px;margin-top:10px}.vta-title{font-size:10px;color:#8493ab;letter-spacing:.12em;text-transform:uppercase;font-weight:900;margin-bottom:10px}.vta-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.vta-field{display:grid;gap:5px}.vta-field label{font-size:10px;color:#9eacc0}.vta-field input,.vta-field select{width:100%;min-height:42px;box-sizing:border-box;border:1px solid #29405e;border-radius:10px;background:#09111e;color:#fff;padding:8px 10px;outline:none}.vta-field input:focus,.vta-field select:focus{border-color:#8050ff}.vta-symbols{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.vta-symbol{display:flex;align-items:center;justify-content:space-between;border:1px solid #263650;border-radius:10px;padding:9px 10px;background:#09111e;font-size:11px}.vta-symbol.on{border-color:#147850;background:#062d20}.vta-mini{font-size:9px;color:#8493ab}.vta-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.vta-btn{min-height:45px;border-radius:11px;border:1px solid #263650;background:#0a1220;color:#fff;font-weight:900}.vta-btn.primary{background:#0a8f5b;border-color:#22e58a}.vta-btn.danger{background:#2b0c13;border-color:#7c2532;color:#ff9aa5}.vta-note{font-size:9px;color:#8493ab;line-height:1.5;margin-top:9px}.vta-auto-lot{font-size:16px;font-weight:900;color:#22e58a}
  @media(max-width:520px){#vtradeAutoPanel{padding:13px}.vta-grid{grid-template-columns:1fr 1fr}.vta-symbols{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(css);

  const fab = document.createElement('button');
  fab.id = 'vtradeAutoFab';
  fab.type = 'button';
  fab.innerHTML = '<span class="dot"></span><span>AUTO TRADE</span>';

  const overlay = document.createElement('div');
  overlay.id = 'vtradeAutoOverlay';
  overlay.innerHTML = `
    <section id="vtradeAutoPanel" role="dialog" aria-label="Auto Trade Settings">
      <div class="vta-head"><div><b>Auto Trade Control</b><small>MT5 execution settings</small></div><button class="vta-close" id="vtaClose" type="button">×</button></div>
      <div class="vta-status"><span id="vtaStatusText">MT5 Connection • Ready</span><button class="vta-switch" id="vtaMaster" type="button" aria-label="Auto Trade"><i></i></button></div>
      <div class="vta-section"><div class="vta-title">Symbol Manager</div><div class="vta-symbols" id="vtaSymbols"></div></div>
      <div class="vta-section"><div class="vta-title">Lot & Risk</div><div class="vta-grid">
        <div class="vta-field"><label>Lot Mode</label><select id="vtaLotMode"><option value="auto">AUTO</option><option value="fixed">FIXED</option></select></div>
        <div class="vta-field"><label>Risk %</label><input id="vtaRisk" type="number" min="0.1" max="10" step="0.1" value="1.0"></div>
        <div class="vta-field"><label>Fixed Lot</label><input id="vtaFixedLot" type="number" min="0.01" step="0.01" value="0.01"></div>
        <div class="vta-field"><label>Max Lot</label><input id="vtaMaxLot" type="number" min="0.01" step="0.01" value="0.20"></div>
      </div><div class="vta-note">AUTO lot uses MT5 account risk and the validated SL distance. Max Lot is always enforced.</div></div>
      <div class="vta-section"><div class="vta-title">Execution Protection</div><div class="vta-grid">
        <div class="vta-field"><label>Max Open Trades</label><input id="vtaMaxTrades" type="number" min="1" max="20" value="1"></div>
        <div class="vta-field"><label>Daily Loss Limit %</label><input id="vtaDailyLoss" type="number" min="0.5" max="20" step="0.5" value="5"></div>
        <div class="vta-field"><label>Break Even</label><select id="vtaBE"><option value="1">1.0R</option><option value="1.5">1.5R</option><option value="2">2.0R</option></select></div>
        <div class="vta-field"><label>Trailing Start</label><select id="vtaTrail"><option value="1.5">1.5R</option><option value="2">2.0R</option><option value="3">3.0R</option></select></div>
      </div></div>
      <div class="vta-section"><div class="vta-title">Calculated Lot</div><div class="vta-auto-lot" id="vtaAutoLot">Waiting for MT5 data…</div><div class="vta-note" id="vtaCalcNote">Connect MT5 to calculate the live lot size.</div></div>
      <div class="vta-actions"><button class="vta-btn primary" id="vtaConnect" type="button">Connect & Enable</button><button class="vta-btn danger" id="vtaKill" type="button">Kill Switch</button></div>
      <div class="vta-note">Auto Trade must be validated on MT5 Demo before using a live account.</div>
    </section>`;

  document.body.appendChild(fab);
  document.body.appendChild(overlay);

  const state = JSON.parse(localStorage.getItem('vtrade_auto_settings') || '{}');
  const symbols = ['XAUUSD','GBPUSD','EURUSD','USDJPY','NAS100','US30'];
  const enabled = new Set(state.symbols || ['XAUUSD']);
  const symbolsEl = overlay.querySelector('#vtaSymbols');
  symbols.forEach(sym => {
    const b = document.createElement('button'); b.type='button'; b.className='vta-symbol' + (enabled.has(sym)?' on':'');
    b.innerHTML = `<span>${sym}</span><span class="vta-mini">${enabled.has(sym)?'ON':'OFF'}</span>`;
    b.onclick=()=>{enabled.has(sym)?enabled.delete(sym):enabled.add(sym); b.classList.toggle('on',enabled.has(sym)); b.lastElementChild.textContent=enabled.has(sym)?'ON':'OFF'; save();};
    symbolsEl.appendChild(b);
  });

  const $ = id => overlay.querySelector(id);
  if(state.lotMode) $('#vtaLotMode').value=state.lotMode;
  if(state.risk) $('#vtaRisk').value=state.risk;
  if(state.fixedLot) $('#vtaFixedLot').value=state.fixedLot;
  if(state.maxLot) $('#vtaMaxLot').value=state.maxLot;
  if(state.maxTrades) $('#vtaMaxTrades').value=state.maxTrades;
  if(state.dailyLoss) $('#vtaDailyLoss').value=state.dailyLoss;

  function save(){
    const s={symbols:[...enabled],lotMode:$('#vtaLotMode').value,risk:$('#vtaRisk').value,fixedLot:$('#vtaFixedLot').value,maxLot:$('#vtaMaxLot').value,maxTrades:$('#vtaMaxTrades').value,dailyLoss:$('#vtaDailyLoss').value};
    localStorage.setItem('vtrade_auto_settings',JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('vtrade:auto-settings',{detail:s}));
  }
  overlay.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',save));

  let autoOn = false;
  const master = $('#vtaMaster');
  const setMaster = on => { autoOn=!!on; master.classList.toggle('on',autoOn); $('#vtaStatusText').textContent=autoOn?'MT5 Connection • AUTO TRADE ON':'MT5 Connection • Ready'; fab.querySelector('span:last-child').textContent=autoOn?'AUTO TRADE ON':'AUTO TRADE'; };
  fab.onclick=()=>overlay.classList.add('show');
  $('#vtaClose').onclick=()=>overlay.classList.remove('show');
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('show')});
  master.onclick=()=>setMaster(!autoOn);
  $('#vtaKill').onclick=()=>{setMaster(false); window.dispatchEvent(new CustomEvent('vtrade:auto-kill')); $('#vtaStatusText').textContent='KILL SWITCH • AUTO TRADE OFF';};
  $('#vtaConnect').onclick=async()=>{
    if(window.VTRADE_CONNECTION?.status){const r=await window.VTRADE_CONNECTION.status(); if(r.ok){setMaster(true); $('#vtaAutoLot').textContent='MT5 connected • Auto calculation ready'; $('#vtaCalcNote').textContent='Live balance/equity and validated SL will determine the final lot.';}else{$('#vtaStatusText').textContent='MT5/Backend connection unavailable';}} else {setMaster(true); $('#vtaAutoLot').textContent='Connection layer ready';}
    save();
  };
  window.addEventListener('vtrade:auto-lot',e=>{const v=e.detail?.lot;if(v)$('#vtaAutoLot').textContent=`${Number(v).toFixed(2)} lot`;});
})();
