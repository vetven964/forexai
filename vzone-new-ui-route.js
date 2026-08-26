// V-Zone AI New UI route installer.
// Mounts the canonical vtrade-new dashboard without changing legacy routes.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SERVER = path.join(ROOT, 'server.js');
const UI = path.join(ROOT, 'vtrade-new');
const LAUNCHER = path.join(ROOT, 'server-launcher.js');
const MARK = 'VZONE_NEW_UI_ROUTE_V1';
const LAUNCHER_MARK = 'VZONE_NEW_UI_LAUNCHER_PATCH_V2';

function patchLauncher() {
  if (!fs.existsSync(LAUNCHER)) throw new Error('server-launcher.js missing');
  let s = fs.readFileSync(LAUNCHER, 'utf8');
  if (s.includes(LAUNCHER_MARK)) return;
  const anchor = 'function patchExecutionLogic(source) {';
  if (!s.includes(anchor)) throw new Error('server-launcher patch anchor missing');
  const fn = `
function patchVZoneNewUI(source) {
  const marker = '${MARK}';
  if (!source.includes("const app = express();") || source.includes(marker)) return source;
  const code = \`
/* ${MARK} */
const VZONE_UI_ROOT = path.join(__dirname, 'vtrade-new');
app.use('/v-zone-ai', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));
app.use('/vtrade-new', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));
app.get(['/v-zone-ai','/v-zone-ai/','/vtrade-new','/vtrade-new/','/dashboard-new'], (_req,res)=>res.sendFile(path.join(VZONE_UI_ROOT, 'index.html')));
console.log('[V-ZONE UI] New dashboard routes active | /v-zone-ai | /vtrade-new | /dashboard-new');
\`;
  return source.replace("const app = express();", "const app = express();" + code, 1);
}
`;
  s = s.replace(anchor, fn + '\n' + anchor, 1);
  const call = '  source = patchCors(source);';
  if (!s.includes(call)) throw new Error('server-launcher patchCors call missing');
  s = s.replace(call, call + '\n  source = patchVZoneNewUI(source);', 1);
  fs.writeFileSync(LAUNCHER, s, 'utf8');
  console.log('[V-ZONE UI] launcher route patch installed');
}

function install() {
  if (!fs.existsSync(UI) || !fs.existsSync(path.join(UI, 'index.html'))) {
    throw new Error('V-Zone new UI files are missing');
  }
  patchLauncher();
  if (fs.existsSync(SERVER)) {
    let src = fs.readFileSync(SERVER, 'utf8');
    if (!src.includes(MARK) && src.includes('const app = express();')) {
      const code = `\n/* ${MARK} */\nconst VZONE_UI_ROOT = path.join(__dirname, 'vtrade-new');\napp.use('/v-zone-ai', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));\napp.use('/vtrade-new', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));\napp.get(['/v-zone-ai','/v-zone-ai/','/vtrade-new','/vtrade-new/','/dashboard-new'], (_req,res)=>res.sendFile(path.join(VZONE_UI_ROOT, 'index.html')));\nconsole.log('[V-ZONE UI] New dashboard routes active | /v-zone-ai | /vtrade-new | /dashboard-new');\n`;
      src = src.replace('const app = express();', 'const app = express();' + code, 1);
      fs.writeFileSync(SERVER, src, 'utf8');
    }
  }
}

install();
module.exports = { install };
