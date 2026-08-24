'use strict';

// CORE Telegram credentials are intentionally blank after the canonical V4 child
// receives its private copy. Do not report that expected separation as an error.
// This shim only normalizes the misleading legacy startup log; it never restores
// credentials and never creates a Telegram client in CORE.
const legacyMessage='[TELEGRAM AUTO] Disabled or Telegram env credentials missing';
const originalLog=console.log;
const originalWarn=console.warn;
function normalize(args, fn){
  const text=args.map(v=>String(v)).join(' ');
  if(text.includes(legacyMessage)){
    fn('[V-TRADE TELEGRAM SEPARATION] CORE delivery disabled by design | canonical Compact V4 child owns Telegram');
    return true;
  }
  return false;
}
console.log=function(...args){ if(!normalize(args,originalLog)) originalLog.apply(console,args); };
console.warn=function(...args){ if(!normalize(args,originalWarn)) originalWarn.apply(console,args); };

console.log('[V-TRADE TELEGRAM SEPARATION] log ownership hotfix active | credentials remain isolated from CORE');
module.exports={legacyMessage};
