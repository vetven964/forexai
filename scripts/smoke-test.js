'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');

// Validate the real Render production chain plus the phone/PWA frontend contract.
const required=[
  'package.json','package-lock.json','render.yaml','index.html','vtrade-runtime-env-lock.js','vtrade-final-launcher.js',
  'vtrade-enhanced-launcher.js','server-launcher.js','server.js','telegram-bot-ai-service-v4.js','telegram-signal-bridge.js',
  'telegram-core-log-ownership-hotfix.js','package-access-hotfix.js','pre-market-route-boot-hotfix.js','ai-confirmation-runtime-v2.js',
  'pre-market-structure-hook.js','predeploy-consistency-hotfix.js','vtrade-start.js','vtrade-canonical-data-contract.js',
  'telegram-single-renderer-guard.js','telegram-launcher-bilingual-patch.js','telegram-auto-symbol-hotfix.js',
  'telegram-auto-mt5-readiness-bridge.js','sunday-weekly-preopen.js','monday-fresh-candle-contract.js','terminal-pre-market.js',
  'premium-dashboard-live.html','terminal-live-phone.html','vtrade-responsive.css','vtrade-responsive.js',
  'vtrade-phone-controls-v1.js','vtrade-phone-i18n.js','vtrade-phone-i18n-v2.js'
];
let failed=false;
for(const file of required){const ok=fs.existsSync(path.join(root,file));console.log(`[SMOKE] ${ok?'PASS':'FAIL'} required: ${file}`);if(!ok)failed=true;}
const syntaxFiles=[...required.filter(f=>f.endsWith('.js')),'scripts/smoke-test.js'];
for(const file of syntaxFiles){const r=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});const ok=r.status===0;console.log(`[SMOKE] ${ok?'PASS':'FAIL'} syntax: ${file}`);if(!ok){console.error(r.stderr||r.stdout);failed=true;}}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const start=String(pkg.scripts?.start||''),telegramScript=String(pkg.scripts?.['telegram:ai']||'');
const render=fs.readFileSync(path.join(root,'render.yaml'),'utf8');
const lock=fs.readFileSync(path.join(root,'vtrade-runtime-env-lock.js'),'utf8');
const enhanced=fs.readFileSync(path.join(root,'vtrade-enhanced-launcher.js'),'utf8');
const final=fs.readFileSync(path.join(root,'vtrade-final-launcher.js'),'utf8');
const telegramLogHotfix=fs.readFileSync(path.join(root,'telegram-core-log-ownership-hotfix.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const phoneControls=fs.readFileSync(path.join(root,'vtrade-phone-controls-v1.js'),'utf8');
const phoneI18nV2=fs.readFileSync(path.join(root,'vtrade-phone-i18n-v2.js'),'utf8');
const phoneShell=fs.readFileSync(path.join(root,'terminal-live-phone.html'),'utf8');
const dashboard=fs.readFileSync(path.join(root,'premium-dashboard-live.html'),'utf8');
const preMarket=fs.readFileSync(path.join(root,'terminal-pre-market.js'),'utf8');
const weeklyPreopen=fs.readFileSync(path.join(root,'sunday-weekly-preopen.js'),'utf8');
const mondayCandle=fs.readFileSync(path.join(root,'monday-fresh-candle-contract.js'),'utf8');
const responsive=fs.readFileSync(path.join(root,'vtrade-responsive.js'),'utf8');
const checks=[
 ['package start uses final launcher',start==='node vtrade-final-launcher.js'],
 ['package Telegram script uses canonical V4',telegramScript==='node telegram-bot-ai-service-v4.js'],
 ['Render start uses runtime lock + final launcher',render.includes('node --require ./vtrade-runtime-env-lock.js vtrade-final-launcher.js')],
 ['Render enables Telegram V4 separation',/VTRADE_TELEGRAM_SEPARATE\s*\n\s*value:\s*"true"/.test(render)],
 ['GitHub Pages base URL uses repository path',render.includes('APP_BASE_URL')&&render.includes('https://vetven964.github.io/forexai/')],
 ['CORS allowlist uses repository Pages origin',render.includes('ALLOWED_ORIGINS')&&render.includes('https://vetven964.github.io/forexai')],
 ['health endpoint configured',render.includes('healthCheckPath: /health')],
 ['Enhanced launcher points to Telegram V4',enhanced.includes('telegram-bot-ai-service-v4.js')],
 ['Enhanced launcher loads Telegram ownership log hotfix',enhanced.includes('telegram-core-log-ownership-hotfix.js')],
 ['Final launcher requires enhanced launcher',final.includes("require('./vtrade-enhanced-launcher.js')")],
 ['Final launcher validates production files',final.includes('validateProductionFiles')],
 ['CORE runtime lock disables legacy Telegram Auto Scanner',lock.includes("process.env.TELEGRAM_AUTO_ALERT_ENABLED = 'false'")],
 ['CORE runtime lock declares canonical V4 ownership',lock.includes('canonical V4 child owns Telegram')],
 ['Telegram ownership hotfix never restores credentials',telegramLogHotfix.includes('never restores credentials')],
 ['Pages index exists and links to login',index.includes('login.html')],
 ['Phone wrapper embeds full Premium Terminal',phoneShell.includes('premium-dashboard-live.html?phone=1')&&phoneShell.includes('phone-pre-market=all')&&phoneShell.includes('phone-telegram=all')],
 ['Phone wrapper injects V14 reliable controls',phoneShell.includes('vtrade-phone-controls-v1.js?v=20260824-v14')],
 ['Phone controls provide M5/M15/H1/H4/D1 + Analyze AI',phoneControls.includes("const TFS=['M5','M15','H1','H4','D1']")&&phoneControls.includes('Analyze AI')],
 ['Phone controls use touch/click bridge',phoneControls.includes('touchend')&&phoneControls.includes('nativeClick')],
 ['Phone controls load canonical bilingual V2',phoneControls.includes('vtrade-phone-i18n-v2.js?v=20260824-v4')],
 ['Phone bilingual V2 provides English and Khmer',phoneI18nV2.includes('data-lang="en"')&&phoneI18nV2.includes('data-lang="km"')&&phoneI18nV2.includes('ផ្ទាំងគ្រប់គ្រង')],
 ['Phone bilingual V2 is phone-only',phoneI18nV2.includes('max-width:900px')&&phoneI18nV2.includes('const phone=()=>')],
 ['Pre-Market supports all M5/M15/H1/H4/D1 candle analysis',preMarket.includes("const TFS=['M5','M15','H1','H4','D1']")&&preMarket.includes('CANDLE-OPEN MTF PROCESSING')&&preMarket.includes('Analyze AI')],
 ['Friday context + Monday fresh M5 revalidation exists',mondayCandle.includes('fridayContext')&&mondayCandle.includes('MONDAY_LIVE_REVALIDATION')&&mondayCandle.includes('mondayFreshM5')],
 ['Sunday weekly pre-open is analysis-only and fail-closed',weeklyPreopen.includes('analysis-only')&&weeklyPreopen.includes('NO ORDER AUTHORIZED')],
 ['Premium dashboard exposes Telegram navigation',dashboard.includes('data-target="telegram"')&&dashboard.includes('data-i18n="Telegram"')],
 ['Responsive system creates mobile navigation',responsive.includes('vtradeMobileBar')&&responsive.includes('addMobileNav')],
 ['Responsive phone content reserves bottom navigation space',phoneI18nV2.includes('padding-bottom:154px')],
 ['Premium dashboard loads responsive phone system',dashboard.includes('vtrade-responsive.js')&&dashboard.includes('vtrade-responsive.css')]
];
for(const [name,ok] of checks){console.log(`[SMOKE] ${ok?'PASS':'FAIL'} contract: ${name}`);if(!ok)failed=true;}
if(failed){console.error('[SMOKE] RESULT: FAIL');process.exit(1);}
console.log('[SMOKE] RESULT: PASS');
