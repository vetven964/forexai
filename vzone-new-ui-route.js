// V-Zone AI New UI route installer.
// Mounts the canonical vtrade-new dashboard before server.js is loaded.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SERVER = path.join(ROOT, 'server.js');
const UI = path.join(ROOT, 'vtrade-new');
const MARK = 'VZONE_NEW_UI_ROUTE_V1';
const LAUNCHER = path.join(ROOT, 'server-launcher.js');
const LAUNCHER_MARK = 'VZONE_NEW_UI_LAUNCHER_PATCH_V2';

function installServerRoute() {
  if (!fs.existsSync(SERVER)) throw new Error('server.js missing');
  if (!fs.existsSync(path.join(UI, 'index.html'))) throw new Error('vtrade-new/index.html missing');

  let src = fs.readFileSync(SERVER, 'utf8');
  if (src.includes(MARK)) {
    console.log('[V-ZONE UI] server route already installed');
    return;
  }

  const anchor = 'const app = express();';
  if (!src.includes(anchor)) throw new Error('server app anchor not found');

  const code = `
/* ${MARK} */
const VZONE_UI_ROOT = path.join(__dirname, 'vtrade-new');
app.use('/v-zone-ai', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));
app.use('/vtrade-new', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));
app.get(['/v-zone-ai','/v-zone-ai/','/vtrade-new','/vtrade-new/','/dashboard-new'], (_req,res)=>res.sendFile(path.join(VZONE_UI_ROOT, 'index.html')));
console.log('[V-ZONE UI] New dashboard routes active | /v-zone-ai | /vtrade-new | /dashboard-new');
`;

  src = src.replace(anchor, anchor + code, 1);
  fs.writeFileSync(SERVER, src, 'utf8');
  console.log('[V-ZONE UI] server.js route installed');
}

function patchLauncherBestEffort() {
  // Optional hardening only. The server.js patch above is the authoritative fix.
  // Never let this optional patch block the real route installation.
  try {
    if (!fs.existsSync(LAUNCHER)) return;
    let s = fs.readFileSync(LAUNCHER, 'utf8');
    if (s.includes(LAUNCHER_MARK)) return;

    const anchor = 'function patchExecutionLogic(source) {';
    const call = '  source = patchCors(source);';
    if (!s.includes(anchor) || !s.includes(call)) {
      console.log('[V-ZONE UI] optional launcher hardening skipped | anchors unavailable');
      return;
    }

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
    s = s.replace(call, call + '\n  source = patchVZoneNewUI(source);', 1);
    fs.writeFileSync(LAUNCHER, s, 'utf8');
    console.log('[V-ZONE UI] optional launcher hardening installed');
  } catch (e) {
    console.warn('[V-ZONE UI] optional launcher hardening skipped:', e.message);
  }
}

function install() {
  // IMPORTANT: install server.js first. Optional launcher patch must never be
  // able to prevent the actual Render route from being installed.
  installServerRoute();
  patchLauncherBestEffort();
}

install();
module.exports = { install };
