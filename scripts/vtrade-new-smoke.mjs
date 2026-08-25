import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../vtrade-new/', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8');
const index = read('index.html');
const app = read('app.js');
const css = read('style.css');
const auto = read('auto-trade.js');

const checks = [
  ['index loads CSS', index.includes('style.css')],
  ['index loads app.js', index.includes('app.js')],
  ['index loads auto-trade.js', index.includes('auto-trade.js')],
  ['PC/phone viewport', /viewport[^>]*width=device-width/.test(index)],
  ['dashboard route', app.includes("dashboard")],
  ['terminal route', app.includes("terminal")],
  ['signals route', app.includes("signals")],
  ['trades route', app.includes("trades")],
  ['settings route', app.includes("settings")],
  ['mobile drawer', app.includes('drawer-open') && app.includes('drawerShade')],
  ['auto trade toggle', app.includes('state.autoTrade=!state.autoTrade')],
  ['kill switch', app.includes('state.killSwitch')],
  ['auto lot mode', app.includes('state.autoLot')],
  ['risk control', app.includes('state.risk')],
  ['fixed lot control', app.includes('state.fixedLot')],
  ['max lot control', app.includes('state.maxLot')],
  ['max trades control', app.includes('state.maxTrades')],
  ['daily loss control', app.includes('state.dailyLoss')],
  ['symbol manager', app.includes('data-symbol') && app.includes('state.symbols')],
  ['persistent settings', app.includes('localStorage')],
  ['execution guard', app.includes('Execution Guard')],
  ['auto trade UI module', auto.includes('Auto Trade')],
  ['responsive CSS', css.includes('@media')],
  ['no legacy iframe dependency', !index.includes('iframe')],
];

for (const [name, ok] of checks) console.log(`[NEW-SMOKE] ${ok ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) process.exit(1);

// Parse the application as a JavaScript program without executing browser APIs.
new vm.Script(app, { filename: 'vtrade-new/app.js' });
new vm.Script(auto, { filename: 'vtrade-new/auto-trade.js' });
console.log('[NEW-SMOKE] PASS JavaScript parse');
console.log('[NEW-SMOKE] RESULT: PASS');
