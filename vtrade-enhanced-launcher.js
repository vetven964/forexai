// V TRADE AI enhanced launcher.
// CORE = MT5/MTF/ICT/Pre-Market/AI analysis only.
// TELEGRAM = independent child process using the canonical Telegram Bot ONLY V6 service.
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const ROOT=__dirname;
const DASHBOARD=path.join(ROOT,'premium-dashboard-live.html');
const POST=path.join(ROOT,'pre-market-post-open-ai.js');
const AUTH_UI=path.join(ROOT,'pre-market-authority-ui-hotfix.js');
const V9=path.join(ROOT,'pre-market-v9.js');
const TELEGRAM_SERVICE=path.join(ROOT,'telegram-bot-ai-service-v6.js');
const UI_MARK='VTRADE_PREMARKET_INTELLIGENCE_UI_V2';
const AUTH_UI_MARK='VTRADE_PREMARKET_AUTHORITY_UI_V1';
const V9_MARK='VTRADE_PREMARKET_V9_UI';
const NEWS_GATE_MARK='VTRADE_NEWS_CALENDAR_GATE_V1';
function installDashboardUI(){
  if(!fs.existsSync(DASHBOARD)||!fs.existsSync(POST)||!fs.existsSync(V9))return;
  let s=fs.readFileSync(DASHBOARD,'utf8');
  const anchor='  <script src="terminal-pre-market.js"></script>';
  if(!s.includes(anchor))return;
  s=s.replace(/\s*<script src="pre-market-intelligence-ui\.js[^>]*><\/script>(?:<!--[^>]*-->)?/g,'');
  s=s.replace(/\s*<script src="pre-market-v8\.js[^>]*><\/script>(?:<!--[^>]*-->)?/g,'');
  const v9Tag=`  <script src="pre-market-v9.js?v=20260821-v9"></script><!-- ${V9_MARK} -->\n`;
  if(!s.includes(V9_MARK))s=s.replace(anchor,v9Tag+anchor);
  if(fs.existsSync(AUTH_UI)&&!s.includes(AUTH_UI_MARK))s=s.replace(anchor,`  <script src="pre-market-authority-ui-hotfix.js?v=20260821-v1"></script><!-- ${AUTH_UI_MARK} -->\n`+anchor);
  if(!s.includes('pre-market-post-open-ai.js'))s=s.replace('</body>',`  <script src="pre-market-post-open-ai.js?v=20260819-post-open"></script>\n</body>`);
  fs.writeFileSync(DASHBOARD,s,'utf8');
  console.log('[V-TRADE START] Pre-Market V9 active; duplicate renderers removed');
}
function installTelegramBridge(){
  const server=path.join(ROOT,'server.js');
  if(!fs.existsSync(server))throw new Error('server.js not found');
  let s=fs.readFileSync(server,'utf8');
  const anchor='const app = express();';
  const marker='VTRADE_TELEGRAM_SIGNAL_BRIDGE_V1';
  if(!s.includes(marker)){
    if(!s.includes(anchor))throw new Error('server app marker not found');
    const code=`\n/* ${marker} */\ntry{require('./telegram-signal-bridge.js').install(app);}catch(e){console.error('[V-TRADE TELEGRAM BRIDGE] install failed:',e.message);throw e;}\n`;
    s=s.replace(anchor,anchor+code);
    fs.writeFileSync(server,s,'utf8');
    console.log('[V-TRADE TELEGRAM BRIDGE] installed into CORE');
  }
}
function installNewsCalendarGate(){
  const server=path.join(ROOT,'server.js');
  if(!fs.existsSync(server))throw new Error('server.js not found');
  let s=fs.readFileSync(server,'utf8');
  if(s.includes(NEWS_GATE_MARK)){
    console.log('[V-TRADE NEWS V1] authoritative calendar gate already installed');
    return;
  }
  const anchor='const app = express();';
  if(!s.includes(anchor))throw new Error('server app marker not found for news gate');
  const code=`\n/* ${NEWS_GATE_MARK} */\ntry{require('./pre-market-news-calendar-hotfix-v1')(app);}catch(e){console.error('[V-TRADE NEWS V1] install failed:',e.message);throw e;}\n`;
  s=s.replace(anchor,anchor+code,1);
  fs.writeFileSync(server,s,'utf8');
  console.log('[V-TRADE NEWS V1] authoritative economic calendar gate installed before CORE routes');
}
function startIndependentTelegram(){
  if(String(process.env.VTRADE_TELEGRAM_SEPARATE||'true').toLowerCase()!=='true'){console.log('[V-TRADE TELEGRAM AI] separate service disabled');return;}
  const token=process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_AUTO_TOKEN||'';
  const chat=process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_CHAT_ID||'';
  if(!token||!chat){console.warn('[V-TRADE TELEGRAM AI] not started: Telegram credentials missing');return;}
  if(!fs.existsSync(TELEGRAM_SERVICE))throw new Error('telegram-bot-ai-service-v6.js not found');
  const existingNodeOptions=String(process.env.NODE_OPTIONS||'').trim();
  const nodeOptions=existingNodeOptions;
  const childEnv={...process.env,TELEGRAM_TOKEN:token,TELEGRAM_CHAT_ID:chat,TELEGRAM_AUTO_TOKEN:'',TELEGRAM_AUTO_CHAT_ID:'',TELEGRAM_AUTO_ALERT_ENABLED:'false',VTRADE_CORE_URL:process.env.VTRADE_CORE_URL||`http://127.0.0.1:${process.env.PORT||10000}`,VTRADE_TELEGRAM_SEPARATE:'true',NODE_OPTIONS:nodeOptions};
  process.env.TELEGRAM_TOKEN='';process.env.TELEGRAM_CHAT_ID='';process.env.TELEGRAM_AUTO_TOKEN='';process.env.TELEGRAM_AUTO_CHAT_ID='';process.env.TELEGRAM_AUTO_ALERT_ENABLED='false';process.env.VTRADE_TELEGRAM_SEPARATE='true';
  console.log('[V-TRADE TELEGRAM SEPARATION] Legacy CORE Telegram Auto Scanner = DISABLED');
  console.log('[V-TRADE TELEGRAM SEPARATION] Canonical Telegram Bot V6 = ONLY sender');
  const launch=()=>{
    if(global.__vtradeTelegramChild&&!global.__vtradeTelegramChild.killed)return;
    console.log('[V-TRADE TELEGRAM AI] delayed child boot | CORE startup grace complete');
    const child=spawn(process.execPath,[TELEGRAM_SERVICE],{env:childEnv,stdio:'inherit'});
    child.on('exit',(code,signal)=>console.warn('[V-TRADE TELEGRAM AI] child exited | code='+(code??'')+' signal='+(signal||'')));
    child.on('error',e=>console.error('[V-TRADE TELEGRAM AI] child error:',e.message));
    global.__vtradeTelegramChild=child;
  };
  setTimeout(launch,8000);
  console.log('[V-TRADE PROCESS SEPARATION] CORE=PRE-MARKET/AI | TELEGRAM=BOT-V6 CHILD | canonical authority consumer | delayed=8000ms');
}
try{require('./vtrade-crt-authority-v1.js');console.log('[V-TRADE START] CRT scope hotfix loaded before server boot');}catch(e){console.error('[V-TRADE CRT] FATAL:',e.stack||e.message);throw e;}
try{require('./telegram-authority-contract-v2.js');}catch(e){console.error('[V-TRADE TELEGRAM AUTHORITY] contract patch failed:',e.stack||e.message);throw e;}
installDashboardUI();
installTelegramBridge();
installNewsCalendarGate();
try{require('./package-access-hotfix.js');console.log('[V-TRADE START] Package/RBAC access gate loaded');}catch(e){console.error('[V-TRADE PACKAGE] FATAL:',e.stack||e.message);throw e;}
try{require('./pre-market-route-boot-hotfix.js');console.log('[V-TRADE START] Pre-Market route boot hotfix loaded');}catch(e){console.error('[V-TRADE PRE-MARKET] FATAL:',e.stack||e.message);throw e;}
try{require('./pre-market-signal-authority-v2.js').inject(fs.readFileSync(path.join(ROOT,'server.js'),'utf8'));}catch(e){console.error('[V-TRADE PRE-MARKET SIGNAL V2] patch failed:',e.stack||e.message);throw e;}
try{const f=path.join(ROOT,'server.js');const mod=require('./pre-market-signal-authority-v2.js');const src=fs.readFileSync(f,'utf8');const patched=mod.inject(src);if(patched!==src)fs.writeFileSync(f,patched,'utf8');console.log('[V-TRADE PRE-MARKET SIGNAL V2] canonical signal authority installed');}catch(e){console.error('[V-TRADE PRE-MARKET SIGNAL V2] install failed:',e.stack||e.message);throw e;}
try{require('./ai-confirmation-runtime-v2.js');console.log('[V-TRADE START] AI Confirmation Runtime V3 bootstrapped');}catch(e){console.error('[V-TRADE AI] FATAL:',e.stack||e.message);throw e;}
require('./pre-market-structure-hook.js');
require('./predeploy-consistency-hotfix.js');
require('./vtrade-start.js');
try{require('./telegram-core-log-ownership-hotfix.js');}catch(e){console.error('[V-TRADE TELEGRAM] log ownership hotfix failed:',e.message);throw e;}
require('./telegram-single-renderer-lock.js');
require('./server-launcher.js');
startIndependentTelegram();
