'use strict';
// V-ZONE AI runtime compatibility shim.
// Some legacy Telegram delivery consumers reference candleGuard as an
// unqualified identifier. Expose the canonical implementation before they load.
const engine=require('./vzone-telegram-engine');
if(typeof global.candleGuard!=='function') global.candleGuard=engine.candleGuard;
console.log('[V-ZONEAI RUNTIME COMPAT] candleGuard binding ACTIVE | canonical engine');
module.exports={candleGuard:global.candleGuard};
