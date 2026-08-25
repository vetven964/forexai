/* V TRADE AI — Auto Trade UI v1
 * UI/config layer only. Real order execution remains governed by the MT5 EA/server.
 */
'use strict';
(function(){
  if(window.__VTRADE_AUTO_TRADE_UI_V1__) return;
  window.__VTRADE_AUTO_TRADE_UI_V1__=true;

  const css=`
  #vtradeAutoPanel{position:fixed;right:14px;top:82px;width:min(390px,calc(100vw - 28px));max-height:calc(100dvh - 96px);overflow:auto;z-index:99999;background:linear-gradient(145deg,#091523f7,#050a12f8);border:1px solid #29405e;border-radius:18px;box-shadow:0 24px 70px #000b;color:#f5f8ff;font:13px Segoe UI,Arial,sans-serif;backdrop-filter:blur(18px)}
  #vtradeAutoPanel *{box-sizing:border-box}#vtradeAutoPanel .vta-head{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-bottom:1px solid #20324d;position:sticky;top:0;background:#07101bf2;z-index:2}#vtradeAutoPanel .vta-title{font-weight:900;font-size:15px}.vta-sub{font-size:10px;color:#8394ad;margin-top:2px}.vta-x{border:1px solid #29405e;background:#0b1422;color:#9eb0c8;border-radius:9px;width:34px;height:34px}
  #vtradeAutoPanel .vta-body{padding:13px}.vta-section{border:1px solid #1d2c44;border-radius:13px;background:#080f1b;padding:12px;margin-bottom:10px}.vta-label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#8394ad;margin-bottom:8px}.vta-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0}.vta-row label{color:#a9b7ca;font-size:11px}.vta-input,.vta-select{width:150px;min-height:38px;border:1px solid #29405e;background:#09111e;color:#fff;border-radius:9px;padding:7px 9px;outline:none}.vta-input:focus,.vta-select:focus{border-color:#8050ff}.vta-symbols{display:grid;grid-template-columns:1fr 1fr;gap:7px}.vta-symbol{display:flex;align-items:center;justify-content:space-between;padding:9px;border:1px solid #263650;border-radius:9px;background:#09111e;font-size:11px}.vta-toggle{position:relative;width:42px;height:23px;border:0;border-radius:99px;background:#263650;padding:0}.vta-toggle i{position:absolute;width:17px;height:17px;top:3px;left:3px;border-radius:50%;background:#8796aa;transition:.18s}.vta-toggle.on{background:#087b4e}.vta-toggle.on i{left:22px;background:#fff}.vta-auto{display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid #147850;background:#062d20;border-radius:11px;margin-bottom:10px}.vta-auto strong{color:#22e58a}.vta-connect{width:100%;min-height:44px;border:1px solid #8050ff;background:#5523c9;color:#fff;border-radius:10px;font-weight:900}.vta-danger{width:100%;min-height:42px;border:1px solid #7c2532;background:#2b0c13;color:#ff8c98;border-radius:10px;font-weight:900;margin-top:7px}.vta-note{font-size:10px;color:#7f91aa;line-height:1.5;margin-top:8px}.vta-status{font-size:10px;color:#22e58a}.vta-mini{font-size:10px;color:#a7b5c8}
  #vtradeAutoLauncher{position:fixed;right:16px;bottom:18px;z-index:99998;border:1px solid #8050ff;background:#5523c9;color:#fff;border-radius:13px;padding:11px 14px;font-weight:900;box-shadow:0 12px 40px #0008}
  @media(max-width:900px){#vtradeAutoPanel{top:10px;right:10px;width:calc(100vw - 20px);max-height:calc(100dvh - 20px)}#vtradeAutoLauncher{right:12px;bottom:12px}}
  `;
  const style=document.createElement('style');style.id='vtrade-auto-trade-ui-v1-css';style.textContent=css;document.head.appendChild(style);

  const saved=JSON.parse(localStorage.getItem('vtrade_auto_trade_settings')||'{}');
  const state={auto:!!saved.auto,symbols:saved.symbols||{XAUUSD:true,GBPUSD:false,EURUSD:false,USDJPY:false,NAS100:false,US30:false},lotMode:saved.lotMode||'AUTO',risk:Number(saved.risk||1),maxLot:Number(saved.maxLot||0.20),session:saved.session||'ALL'};
  const save=()=>localStorage.setItem('vtrade_auto_trade_settings',JSON.stringify(state));
  const toggle=(s)=>{state.symbols[s]=!state.symbols[s];save();render();};

  function render(){
    let p=document.getElementById('vtradeAutoPanel'); if(!p){p=document.createElement('div');p.id='vtradeAutoPanel';document.body.appendChild(p)}
    p.innerHTML=`<div class="vta-head"><div><div class="vta-title">⚡ AUTO TRADE SETTINGS</div><div class="vta-sub">V TRADE AI · MT5 execution control</div></div><button class="vta-x" id="vtaClose">×</button></div>
      <div class="vta-body">
        <div class="vta-auto"><div><strong>${state.auto?'AUTO TRADE ON':'AUTO TRADE OFF'}</strong><div class="vta-mini">${state.auto?'Ready for validated execution':'Safe mode — no automatic order'}</div></div><button class="vta-toggle ${state.auto?'on':''}" id="vtaAuto"><i></i></button></div>
        <div class="vta-section"><div class="vta-label">MT5 Connection</div><div class="vta-row"><span class="vta-status">● Connection status</span><b id="vtaConn">Checking…</b></div><button class="vta-connect" id="vtaConnect">🔗 CONNECT & SYNC MT5</button></div>
        <div class="vta-section"><div class="vta-label">Allowed Symbols</div><div class="vta-symbols">${Object.keys(state.symbols).map(s=>`<div class="vta-symbol"><span>${s}</span><button class="vta-toggle ${state.symbols[s]?'on':''}" data-symbol="${s}"><i></i></button></div>`).join('')}</div></div>
        <div class="vta-section"><div class="vta-label">Lot & Risk</div>
          <div class="vta-row"><label>Lot Mode</label><select class="vta-select" id="vtaLotMode"><option value="AUTO" ${state.lotMode==='AUTO'?'selected':''}>AUTO — MT5 Risk</option><option value="FIXED" ${state.lotMode==='FIXED'?'selected':''}>FIXED LOT</option></select></div>
          <div class="vta-row"><label>Risk % / Trade</label><input class="vta-input" id="vtaRisk" type="number" min="0.1" max="5" step="0.1" value="${state.risk}"></div>
          <div class="vta-row"><label>Max Lot</label><input class="vta-input" id="vtaMaxLot" type="number" min="0.01" step="0.01" value="${state.maxLot}"></div>
          <div class="vta-note">AUTO Lot uses the MT5 account/symbol data plus the validated SL to calculate position size. Max Lot remains a hard cap.</div>
        </div>
        <div class="vta-section"><div class="vta-label">Execution Protection</div>
          <div class="vta-row"><label>Session</label><select class="vta-select" id="vtaSession"><option>ALL</option><option>LONDON</option><option>NEW YORK</option><option>LONDON + NY</option></select></div>
          <div class="vta-row"><label>Duplicate Order Guard</label><span class="vta-status">● ON</span></div>
          <div class="vta-row"><label>SL Required</label><span class="vta-status">● ON</span></div>
          <div class="vta-row"><label>BE / Trailing</label><span class="vta-status">● R-BASED</span></div>
        </div>
        <button class="vta-danger" id="vtaKill">⛔ KILL SWITCH — STOP AUTO TRADE</button>
        <div class="vta-note">UI settings are saved locally. Live order execution must still pass the V TRADE server gates and MT5 EA controls.</div>
      </div>`;
    document.getElementById('vtaAuto').onclick=()=>{state.auto=!state.auto;save();render()};
    document.getElementById('vtaClose').onclick=()=>{p.remove();};
    document.querySelectorAll('[data-symbol]').forEach(b=>b.onclick=()=>toggle(b.dataset.symbol));
    document.getElementById('vtaLotMode').onchange=e=>{state.lotMode=e.target.value;save()};
    document.getElementById('vtaRisk').onchange=e=>{state.risk=Math.max(.1,Number(e.target.value)||1);save()};
    document.getElementById('vtaMaxLot').onchange=e=>{state.maxLot=Math.max(.01,Number(e.target.value)||.2);save()};
    document.getElementById('vtaSession').value=state.session;document.getElementById('vtaSession').onchange=e=>{state.session=e.target.value;save()};
    document.getElementById('vtaKill').onclick=()=>{state.auto=false;save();render()};
    document.getElementById('vtaConnect').onclick=()=>{const c=document.getElementById('vtaConn');c.textContent='Sync requested';setTimeout(()=>{c.textContent='Use MT5 EA connection'},1200)};
    document.getElementById('vtaConn').textContent=window.vtradeConnection?'Connected':'MT5 EA required';
  }
  function launcher(){
    if(document.getElementById('vtradeAutoLauncher'))return;
    const b=document.createElement('button');b.id='vtradeAutoLauncher';b.textContent='⚡ Auto Trade';b.onclick=render;document.body.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launcher,{once:true});else launcher();
})();
