// V-Zone AI New UI route installer.
// Mounts the canonical vtrade-new dashboard without changing legacy routes.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SERVER = path.join(ROOT, 'server.js');
const UI = path.join(ROOT, 'vtrade-new');
const MARK = 'VZONE_NEW_UI_ROUTE_V1';

function install() {
  if (!fs.existsSync(SERVER) || !fs.existsSync(path.join(UI, 'index.html'))) {
    throw new Error('V-Zone new UI files are missing');
  }
  let src = fs.readFileSync(SERVER, 'utf8');
  if (src.includes(MARK)) {
    console.log('[V-ZONE UI] route already installed');
    return;
  }
  const anchor = 'const app = express();';
  if (!src.includes(anchor)) throw new Error('server app anchor not found');
  const code = `\n/* ${MARK} */\nconst VZONE_UI_ROOT = path.join(__dirname, 'vtrade-new');\napp.use('/v-zone-ai', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));\napp.use('/vtrade-new', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));\napp.get(['/v-zone-ai','/v-zone-ai/','/vtrade-new','/vtrade-new/','/dashboard-new'], (_req,res)=>res.sendFile(path.join(VZONE_UI_ROOT, 'index.html')));\nconsole.log('[V-ZONE UI] New dashboard routes active | /v-zone-ai | /vtrade-new | /dashboard-new');\n`;
  src = src.replace(anchor, anchor + code, 1);
  fs.writeFileSync(SERVER, src, 'utf8');
  console.log('[V-ZONE UI] New dashboard route installed');
}

install();
module.exports = { install };
