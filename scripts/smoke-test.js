'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const required=[
  'package.json','render.yaml','vtrade-final-launcher.js','vtrade-enhanced-launcher.js',
  'server.js','server-launcher.js','telegram-bot-ai-service-v4.js','telegram-signal-bridge.js',
  'package-access-hotfix.js','pre-market-route-boot-hotfix.js','ai-confirmation-runtime-v2.js',
  'pre-market-structure-hook.js','predeploy-consistency-hotfix.js'
];
let failed=false;
for(const file of required){
  const ok=fs.existsSync(path.join(root,file));
  console.log(`[SMOKE] ${ok?'PASS':'FAIL'} required: ${file}`);
  if(!ok)failed=true;
}
const jsFiles=fs.readdirSync(root).filter(f=>f.endsWith('.js'));
for(const file of jsFiles){
  const r=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  const ok=r.status===0;
  console.log(`[SMOKE] ${ok?'PASS':'FAIL'} syntax: ${file}`);
  if(!ok){console.error(r.stderr||r.stdout);failed=true;}
}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const start=String(pkg.scripts?.start||'');
const render=fs.readFileSync(path.join(root,'render.yaml'),'utf8');
const checks=[
  ['package start uses final launcher',start.includes('vtrade-final-launcher.js')],
  ['Render start uses final launcher',render.includes('vtrade-final-launcher.js')],
  ['Render enables Telegram V4 separation',render.includes('VTRADE_TELEGRAM_SEPARATE')&&render.includes('value: "true"')],
  ['health endpoint configured',render.includes('healthCheckPath: /health')]
];
for(const [name,ok] of checks){console.log(`[SMOKE] ${ok?'PASS':'FAIL'} contract: ${name}`);if(!ok)failed=true;}
if(failed){console.error('[SMOKE] RESULT: FAIL');process.exit(1);}
console.log('[SMOKE] RESULT: PASS');
