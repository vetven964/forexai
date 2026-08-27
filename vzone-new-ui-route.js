// V-Zone AI New UI route installer — production-safe and idempotent.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SERVER = path.join(ROOT, 'server.js');
const UI = path.join(ROOT, 'vtrade-new');
const MARK = 'VZONE_NEW_UI_ROUTE_V1';
function install() {
  if (!fs.existsSync(SERVER)) throw new Error('server.js missing');
  if (!fs.existsSync(path.join(UI, 'index.html'))) throw new Error('vtrade-new/index.html missing');
  let src = fs.readFileSync(SERVER, 'utf8');
  if (src.includes(MARK)) { console.log('[V-ZONE UI] route already active | /v-zone-ai'); return; }
  const anchor = 'const app = express();';
  if (!src.includes(anchor)) throw new Error('server app anchor not found');
  const code = `
/* ${MARK} */
const VZONE_UI_ROOT = path.join(__dirname, 'vtrade-new');
app.use('/v-zone-ai', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));
app.use('/vtrade-new', express.static(VZONE_UI_ROOT, { index: 'index.html', fallthrough: true, maxAge: '5m' }));
app.get('/', (_req,res)=>res.redirect(302,'/v-zone-ai'));
app.get(['/v-zone-ai','/v-zone-ai/','/vtrade-new','/vtrade-new/','/dashboard-new'], (_req,res)=>res.sendFile(path.join(VZONE_UI_ROOT, 'index.html')));
console.log('[V-ZONE UI] New dashboard routes active | / | /v-zone-ai | /vtrade-new | /dashboard-new');
`;
  src = src.replace(anchor, anchor + code, 1);
  fs.writeFileSync(SERVER, src, 'utf8');
  console.log('[V-ZONE UI] server.js route installed | root redirects to /v-zone-ai');
}
try { install(); module.exports = { install }; }
catch (e) { console.error('[V-ZONE UI] INSTALL ERROR:', e.stack || e.message || e); throw e; }
