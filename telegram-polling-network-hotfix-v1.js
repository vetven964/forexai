/* V-TRADE Telegram polling/network hotfix V3
 * Telegram ONLY. Never changes ICT signal/authorization/execution logic.
 * Converts transient polling AggregateError into a non-fatal transient event.
 */
'use strict';
const TelegramBot=require('node-telegram-bot-api');
const proto=TelegramBot&&TelegramBot.prototype;
if(proto&&!proto.__VTRADE_POLLING_NETWORK_HOTFIX_V3__){
  const originalEmit=proto.emit;
  proto.emit=function(event,...args){
    if(event==='polling_error'&&args[0]){
      const e=args[0];
      if(e&&e.name==='AggregateError'){
        const causes=Array.isArray(e.errors)?e.errors.map(x=>`${x?.code||x?.name||'ERR'}:${x?.message||String(x)}`).join(' | '):'';
        e.code='ETRANSIENT';
        e.message=`Telegram polling network transient${causes?` [${causes}]`:''}`;
        if(!e.stack||e.stack.includes('EFATAL: AggregateError'))e.stack=`TelegramPollingNetworkError: ${e.message}`;
        console.warn('[V-TRADE TELEGRAM] polling transient network error | '+e.message);
      }
    }
    return originalEmit.call(this,event,...args);
  };
  Object.defineProperty(proto,'__VTRADE_POLLING_NETWORK_HOTFIX_V3__',{value:true,enumerable:false});
  console.log('[V-TRADE TELEGRAM] polling/network hotfix V3 active | AggregateError non-fatal');
}
