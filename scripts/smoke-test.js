'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');let failed=false;
const required=['package.json','package-lock.json','render.yaml','server.js','vtrade-final-launcher.js','vtrade-enhanced-launcher.js','vtrade-runtime-env-lock.js','telegram-bot-ai-service-v4.js','telegram-signal-bridge.js','telegram-core-log-ownership-hotfix.js','terminal-pre-market.js','sunday-weekly-preopen.js','monday-fresh-candle-contract.js','premium-dashboard-live.html','terminal-live-phone.html','vtrade-phone-controls-v1.js','vtrade-phone-interaction-v16.js','vtrade-phone-i18n-v2.js','vtrade-phone-layout-v1.css','vtrade-responsive.js','vtrade-responsive.css'];
for(const f of required){const ok=fs.existsSync(path.join(root,f));console.log(`[SMOKE] ${ok?'PASS':'FAIL'} required: ${f}`);if(!ok)failed=true;}
for(const f of required.filter(f=>f.endsWith('.js'))){const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});const ok=r.status===0;console.log(`[SMOKE] ${ok?'PASS':'FAIL'} syntax: ${f}`);if(!ok){console.error(r.stderr||r.stdout);failed=true;}}
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(read('package.json')),render=read('render.yaml'),lock=read('vtrade-runtime-env-lock.js'),enhanced=read('vtrade-enhanced-launcher.js'),final=read('vtrade-final-launcher.js'),tg=read('telegram-core-log-ownership-hotfix.js'),phone=read('terminal-live-phone.html'),controls=read('vtrade-phone-controls-v1.js'),interaction=read('vtrade-phone-interaction-v16.js'),i18n=read('vtrade-phone-i18n-v2.js'),layout=read('vtrade-phone-layout-v1.css'),pre=read('terminal-pre-market.js'),monday=read('monday-fresh-candle-contract.js'),weekly=read('sunday-weekly-preopen.js'),dash=read('premium-dashboard-live.html');
const checks=[
['start uses final launcher',pkg.scripts?.start==='node vtrade-final-launcher.js'],
['Telegram script uses canonical V6',pkg.scripts?.['telegram:ai']==='node telegram-bot-ai-service-v6.js'],
['Render uses runtime lock + final launcher',render.includes('vtrade-runtime-env-lock.js')&&render.includes('vtrade-final-launcher.js')],
['Pages origin is configured',render.includes('https://vetven964.github.io/forexai')],
['health endpoint configured',render.includes('healthCheckPath: /health')],
['enhanced launcher uses Telegram V6',enhanced.includes('telegram-bot-ai-service-v6.js')],
['final launcher loads enhanced launcher',final.includes("require('./vtrade-enhanced-launcher.js')")],
['legacy Telegram Auto Scanner stays disabled',lock.includes("TELEGRAM_AUTO_ALERT_ENABLED = 'false'")],
['Telegram ownership remains fail-safe',/never restores[\\s\\S]*credentials/.test(tg)&&tg.includes('never creates a Telegram client in CORE')],
['Phone shell contains pre-market + Telegram routes',phone.includes('phone-pre-market=all')&&phone.includes('phone-telegram=all')],
['Phone shell loads current V21 interaction + layout',phone.includes('phone-interaction=v21')&&phone.includes('vtrade-phone-interaction-v20.js?v=20260824-v21')&&phone.includes('vtrade-phone-layout-v1.css?v=20260824-v1')&&phone.includes('vtrade-phone-controls-v1.js?v=20260824-v21')],
['Phone controls expose M5/M15/H1/H4/D1',controls.includes("const TFS=['M5','M15','H1','H4','D1']")],
['Phone controls expose Analyze AI',controls.includes('Analyze AI')],
['Phone controls support native V91 delegation',interaction.includes('data-v91tf')&&interaction.includes('analyze(tf)')],
['Current phone interaction owns V17 bridge guard',interaction.includes('window.__VTRADE_PHONE_INTERACTION_V17__=true')],
['V17/V18 source keeps real XAUUSD route',interaction.includes('/api/pre-market/xauusd')&&!interaction.includes('/api/pre-market/mt5-authoritative')],
['Phone-only guard exists',interaction.includes('max-width:900px')],
['Dedicated phone layout protects MTF cards',layout.includes('.v91tf>strong')&&layout.includes('.v91tf>span:nth-of-type(2)')],
['Phone i18n contains Khmer + English',i18n.includes('data-lang="en"')&&i18n.includes('data-lang="km"')],
['Pre-Market supports all five TFs',pre.includes("const TFS=['M5','M15','H1','H4','D1']")],
['Friday context + fresh Monday M5',monday.includes('fridayContext')&&monday.includes('MONDAY_LIVE_REVALIDATION')&&monday.includes('mondayFreshM5')],
['Sunday pre-open fail-closed',weekly.includes('analysis-only')&&weekly.includes('NO ORDER AUTHORIZED')],
['Telegram navigation exists',dash.includes('data-target="telegram"')]
];
for(const [n,ok] of checks){console.log(`[SMOKE] ${ok?'PASS':'FAIL'} contract: ${n}`);if(!ok)failed=true;}
console.log(`[SMOKE] RESULT: ${failed?'FAIL':'PASS'}`);if(failed)process.exit(1);
