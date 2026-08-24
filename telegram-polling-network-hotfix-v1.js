/* V-TRADE Telegram polling/network hotfix V4
 * Telegram ONLY. Never changes ICT signal/authorization/execution logic.
 * Suppresses only transient Telegram polling AggregateError noise and keeps polling alive.
 */
'use strict';
const TelegramBot=require('node-telegram-bot-api');
const proto=TelegramBot&&TelegramBot.prototype;
if(proto&&!proto.__VTRADE_POLLING_NETWORK_HOTFIX_V4__){
  const originalEmit=proto.emit;
  proto.emit=function(event,...args){
    if(event==='polling_error'&&args[0]){
      const e=args[0];
      const msg=String(e?.message||'');
      const isAggregate=e?.name==='AggregateError'||msg.includes('AggregateError')||msg.includes('EFATAL: AggregateError');
      if(isAggregate){
        const causes=Array.isArray(e?.errors)?e.errors.map(x=>`${x?.code||x?.name||'ERR'}:${x?.message||String(x)}`).join(' | '):'';
        console.warn('[V-TRADE TELEGRAM] polling transient network error | AggregateError suppressed'+(causes?` | ${causes}`:''));
        return true;
      }
    }
    return originalEmit.call(this,event,...args);
  };
  Object.defineProperty(proto,'__VTRADE_POLLING_NETWORK_HOTFIX_V4__',{value:true,enumerable:false});
  console.log('[V-TRADE TELEGRAM] polling/network hotfix V4 active | AggregateError suppressed');
}
