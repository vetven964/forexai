/* V-TRADE Telegram polling network hotfix V1
 * Loaded before telegram-bot-ai-service-v4.js in the child process.
 * Network AggregateError can be emitted by node-telegram-bot-api while the
 * long-poll loop is still healthy. Normalize the diagnostic and avoid treating
 * a transient polling error as a service crash.
 */
'use strict';
const TelegramBot=require('node-telegram-bot-api');
const proto=TelegramBot&&TelegramBot.prototype;
if(proto&&!proto.__VTRADE_POLLING_NETWORK_HOTFIX_V1__){
  const originalEmit=proto.emit;
  proto.emit=function(event,...args){
    if(event==='polling_error'&&args[0]){
      const e=args[0];
      if(e&&e.name==='AggregateError'){
        const causes=Array.isArray(e.errors)?e.errors.map(x=>`${x?.code||x?.name||'ERR'}:${x?.message||String(x)}`).join(' | '):'';
        e.message=`Telegram polling network AggregateError${causes?` [${causes}]`:''}`;
        if(!e.stack||e.stack.includes('EFATAL: AggregateError'))e.stack=`${e.name}: ${e.message}`;
      }
    }
    return originalEmit.call(this,event,...args);
  };
  Object.defineProperty(proto,'__VTRADE_POLLING_NETWORK_HOTFIX_V1__',{value:true,enumerable:false});
  console.log('[V-TRADE TELEGRAM] polling network diagnostics V1 active');
}
