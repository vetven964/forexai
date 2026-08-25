/* V-TRADE Telegram polling/network hotfix V5
 * Telegram ONLY. Never changes ICT signal/authorization/execution logic.
 * Handles transient polling AggregateError noise at the process boundary.
 * Keeps the Telegram child alive; CORE/MT5/ICT are untouched.
 */
'use strict';
const TelegramBot=require('node-telegram-bot-api');
const proto=TelegramBot&&TelegramBot.prototype;
const isAggregateError=(e)=>{
  const msg=String(e?.message||e||'');
  return e?.name==='AggregateError'||msg.includes('AggregateError')||msg.includes('EFATAL: AggregateError');
};
const describe=(e)=>{
  const causes=Array.isArray(e?.errors)?e.errors.map(x=>`${x?.code||x?.name||'ERR'}:${x?.message||String(x)}`).join(' | '):'';
  return causes||String(e?.message||e||'AggregateError');
};
if(proto&&!proto.__VTRADE_POLLING_NETWORK_HOTFIX_V5__){
  const originalEmit=proto.emit;
  proto.emit=function(event,...args){
    if(event==='polling_error'&&isAggregateError(args[0])){
      console.warn('[V-TRADE TELEGRAM] transient polling network error handled | '+describe(args[0]));
      return true;
    }
    return originalEmit.call(this,event,...args);
  };
  Object.defineProperty(proto,'__VTRADE_POLLING_NETWORK_HOTFIX_V5__',{value:true,enumerable:false});
}
const originalConsoleError=console.error.bind(console);
console.error=(...args)=>{
  const line=args.map(x=>String(x)).join(' ');
  if(line.includes('[polling_error]')&&line.includes('EFATAL')&&line.includes('AggregateError')){
    console.warn('[V-TRADE TELEGRAM] polling AggregateError suppressed by V5');
    return;
  }
  originalConsoleError(...args);
};
const originalStderrWrite=process.stderr.write.bind(process.stderr);
process.stderr.write=(chunk,...rest)=>{
  const line=String(chunk??'');
  if(line.includes('[polling_error]')&&line.includes('EFATAL')&&line.includes('AggregateError')){
    originalConsoleError('[V-TRADE TELEGRAM] polling AggregateError stderr suppressed by V5');
    return true;
  }
  return originalStderrWrite(chunk,...rest);
};
process.on('unhandledRejection',(reason)=>{
  if(isAggregateError(reason)){
    console.warn('[V-TRADE TELEGRAM] unhandled polling AggregateError recovered | '+describe(reason));
    return;
  }
  console.warn('[V-TRADE TELEGRAM] unhandled rejection:',reason);
});
console.log('[V-TRADE TELEGRAM] polling/network hotfix V5 active | AggregateError recovery + stderr filter');
try{require('./telegram-wait-delivery-hotfix-v1.js');}catch(e){console.error('[V-TRADE TELEGRAM WAIT] hotfix load failed:',e.message);}
