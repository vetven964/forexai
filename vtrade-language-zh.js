/* V-TRADE UI Language Pack V1 — Chinese (Simplified) */
(()=>{
'use strict';
if(window.__VTRADE_ZH_LANG_V1__)return;
window.__VTRADE_ZH_LANG_V1__=true;
const KEY='vtrade_ui_lang';
const dict={
 'Home':'首页','Analyzer':'分析器','Chart':'图表','Signals':'信号','News':'新闻','Profile':'个人资料','Logout':'退出登录',
 'Main User Dashboard':'用户主面板','ACCOUNT CONNECTED':'账户已连接','Live Terminal':'实时终端','Signals':'交易信号','AI Intelligence':'AI 智能','News Intelligence':'新闻智能','Telegram':'Telegram','Risk Calculator':'风险计算器','Trade History':'交易历史','Account & Security':'账户与安全',
 'Open Terminal':'打开终端','Open Signals':'打开信号','Open AI':'打开 AI','Open News':'打开新闻','Open Telegram':'打开 Telegram','Open Risk':'打开风险计算器','Open History':'打开历史','Open Profile':'打开资料',
 'XAUUSD ICT Terminal':'XAUUSD ICT 终端','User Home · XAUUSD ICT Terminal':'用户首页 · XAUUSD ICT 终端',
 'MT5 XAUUSD live feed, MTF ICT analysis, execution gates and market state.':'MT5 XAUUSD 实时行情、MTF ICT 分析、执行条件和市场状态。',
 'Confirmed BUY/SELL entries, WAIT state, MTF alignment and risk levels.':'已确认的 BUY/SELL 入场、WAIT 状态、MTF 一致性和风险水平。',
 'Local ICT confirmation and AI-assisted analysis when enabled.':'本地 ICT 确认及 AI 辅助分析。','Macro/news context and pre-market information.':'宏观新闻与开盘前市场信息。','View your configured alert status and confirmed-entry notifications.':'查看 Telegram 提醒状态和已确认入场通知。','Plan position size, stop loss and take profit before execution.':'执行前规划仓位、止损和止盈。','Review recent analysis and execution history.':'查看最近的分析和执行记录。','Profile, password and account settings.':'个人资料、密码和账户设置。',
 'WAIT':'等待','BUY':'买入','SELL':'卖出','BULLISH':'看涨','BEARISH':'看跌','NEUTRAL':'中性','PASS':'通过','READY':'就绪','HIGH':'高','MEDIUM':'中','LOW':'低','CLEAR':'清晰','LIVE':'实时',
 'M5':'M5','M15':'M15','H1':'H1','H4':'H4','D1':'D1','Entry':'入场','Stop Loss':'止损','TP1':'止盈 1','TP2':'止盈 2','TP3':'止盈 3','Zone':'区域','Execution Zone':'执行区域','Order Block':'订单块','Liquidity Sweep':'流动性扫盘','Displacement':'位移','Momentum':'动能','Premium / Discount':'溢价 / 折价','MSS':'MSS','BOS':'BOS','FVG':'FVG','Spread':'点差','ADX Trend':'ADX 趋势','MTF Alignment':'MTF 一致性',
 'CANDLE / WICK / PATTERN':'K线 / 影线 / 形态','ICT EXECUTION GATES':'ICT 执行条件','CANDLE-OPEN MTF PROCESSING · LIVE':'开盘K线 MTF 处理 · 实时','M15 · 60 closed candles · MT5 LIVE':'M15 · 60根已收盘K线 · MT5 实时',
 'News headline feed unavailable right now. Failed to fetch':'新闻标题暂时无法获取，请稍后重试','News Intelligence':'新闻智能','LIVE FEED':'实时新闻源','Auto refresh: 60s':'自动刷新：60秒',
 'Telegram Auto Alert':'Telegram 自动提醒','Auto Trade':'自动交易','Feed sequence continuity':'行情序列连续性','STABLE — MT5 LIVE':'稳定 — MT5 实时',
 'EXECUTION NOT AUTHORIZED — WAIT':'未授权执行 — 等待','WAIT — BULLISH BIAS, NO ENTRY':'等待 — 看涨倾向，暂无入场','WAIT — BEARISH BIAS, NO ENTRY':'等待 — 看跌倾向，暂无入场'
};
const translateText=s=>dict[s]||s;
function walk(root=document.body){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
 for(const n of nodes){const raw=n.nodeValue;const t=raw.trim();if(!t)continue;if(dict[t])n.nodeValue=raw.replace(t,dict[t]);}
 document.documentElement.lang='zh-CN';
}
function addSwitcher(){
 if(document.getElementById('vtradeLangSwitcher'))return;
 const box=document.createElement('div');box.id='vtradeLangSwitcher';box.innerHTML='<button data-lang="km">ខ្មែរ</button><button data-lang="en">EN</button><button class="active" data-lang="zh">中文</button>';
 document.body.appendChild(box);
 box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const lang=b.dataset.lang;if(lang==='zh'){localStorage.setItem(KEY,'zh');location.reload()}else{localStorage.setItem(KEY,lang);location.reload()}});
}
function css(){if(document.getElementById('vtradeLangZHStyle'))return;const s=document.createElement('style');s.id='vtradeLangZHStyle';s.textContent='#vtradeLangSwitcher{position:fixed;right:14px;top:max(14px,env(safe-area-inset-top));z-index:99999;display:flex;gap:4px;padding:4px;border:1px solid #263957;border-radius:13px;background:rgba(5,10,18,.96);backdrop-filter:blur(16px);box-shadow:0 10px 35px #0008}#vtradeLangSwitcher button{border:1px solid transparent;border-radius:9px;background:#09111e;color:#9aa9bf;min-height:34px;padding:5px 9px;font:700 12px/1 system-ui,sans-serif;cursor:pointer}#vtradeLangSwitcher button.active{background:#5827d2;border-color:#8050ff;color:#fff}@media(max-width:520px){#vtradeLangSwitcher{right:8px;top:max(8px,env(safe-area-inset-top));transform:scale(.92);transform-origin:top right}}';document.head.appendChild(s)}
function init(){if(localStorage.getItem(KEY)!=='zh')return;css();addSwitcher();walk();const obs=new MutationObserver(m=>{for(const x of m)if(x.addedNodes.length)walk(x.target.nodeType===1?x.target:document.body)});obs.observe(document.body,{subtree:true,childList:true});setTimeout(()=>obs.disconnect(),30000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
