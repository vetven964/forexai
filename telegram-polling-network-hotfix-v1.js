/* V-TRADE Telegram polling/network + compact signal hotfix V2
 * Preloaded before the independent Telegram AI child.
 * - Keeps transient polling AggregateError non-fatal.
 * - Compacts only V-TRADE ICT signal messages; news/help/price are untouched.
 * - Never changes signal, gates, entry authorization, or execution logic.
 */
'use strict';
const TelegramBot=require('node-telegram-bot-api');
const proto=TelegramBot&&TelegramBot.prototype;
if(proto&&!proto.__VTRADE_POLLING_NETWORK_HOTFIX_V2__){
  const originalEmit=proto.emit;
  proto.emit=function(event,...args){
    if(event==='polling_error'&&args[0]){
      const e=args[0];
      if(e&&e.name==='AggregateError'){
        const causes=Array.isArray(e.errors)?e.errors.map(x=>`${x?.code||x?.name||'ERR'}:${x?.message||String(x)}`).join(' | '):'';
        e.message=`Telegram polling network transient${causes?` [${causes}]`:''}`;
        e.code='ETRANSIENT';
        if(!e.stack||e.stack.includes('EFATAL: AggregateError'))e.stack=`TelegramPollingNetworkError: ${e.message}`;
      }
    }
    return originalEmit.call(this,event,...args);
  };
  const originalSendMessage=proto.sendMessage;
  proto.sendMessage=function(chatId,text,options,...rest){
    let out=text;
    try{
      if(typeof text==='string'&&text.includes('V TRADE AI — TELEGRAM INDEPENDENT ICT')&&text.includes('ICT Gates:')){
        const pick=(re,f='WAIT')=>{const m=text.match(re);return m?m[1]:f;};
        const price=pick(/💰 Price:\s*\*([^*]+)\*/);
        const action=pick(/⚡ Action:\s*\*([^*]+)\*/);
        const bias=pick(/📈 Bias:\s*\*([^*]+)\*/);
        const score=pick(/📊 Direction Score:\s*\*([^*]+)\*/);
        const conf=pick(/🧠 Confidence:\s*\*([^*]+)\*/);
        const context=pick(/⏱️ Context:\s*\*([^*]+)\*/);
        const gates=pick(/🔎 ICT Gates:\s*\*([^*]+)\*/);
        const sweep=pick(/💧 Liquidity Sweep:\s*\*([^*]+)\*/);
        const mss=pick(/MSS:\s*\*([^*]+)\*/);
        const bos=pick(/BOS:\s*\*([^*]+)\*/);
        const displacement=pick(/⚡ Displacement:\s*\*([^*]+)\*/);
        const fvg=pick(/FVG:\s*\*([^*]+)\*/);
        const ob=pick(/OB:\s*\*([^*]+)\*/);
        const pd=pick(/📍 Premium\/Discount:\s*\*([^*]+)\*/);
        const momentum=pick(/Momentum:\s*\*([^*]+)\*/);
        const spread=pick(/Spread:\s*\*([^*]+)\*/);
        const entry=pick(/🎯 Entry:\s*\*([^*]+)\*/);
        const sl=pick(/🛑 SL:\s*\*([^*]+)\*/);
        const tps=text.match(/🎯 TP1:\s*\*([^*]+)\*\s*\|\s*TP2:\s*\*([^*]+)\*\s*\|\s*TP3:\s*\*([^*]+)\*/);
        const auth=/TRADE AUTHORIZED/.test(text)?'🔐 *TRADE AUTHORIZED*':'⏳ *WAIT — NO ORDER*';
        const reason=text.match(/🧠 ([\s\S]+)$/)?.[1]||'';
        out=['🤖 *V TRADE AI — XAUUSD*','💰 '+price+' | '+action,'📈 '+bias+' | Score '+score+' | Confidence '+conf,'⏱️ '+context,'🔎 ICT '+gates,'💧 Sweep '+sweep+' | MSS '+mss+' | BOS '+bos,'⚡ Disp '+displacement+' | FVG '+fvg+' | OB '+ob,'📍 P/D '+pd+' | Mom '+momentum+' | Spread '+spread,'🎯 Entry '+entry+' | SL '+sl,'🎯 TP1 '+(tps?tps[1]:'WAIT')+' | TP2 '+(tps?tps[2]:'WAIT')+' | TP3 '+(tps?tps[3]:'WAIT'),auth,reason?('🧠 '+reason):''].filter(Boolean).join('\n');
      }
    }catch(e){console.warn('[V-TRADE TELEGRAM] compact formatter skipped:',e.message);}
    return originalSendMessage.call(this,chatId,out,options,...rest);
  };
  Object.defineProperty(proto,'__VTRADE_POLLING_NETWORK_HOTFIX_V2__',{value:true,enumerable:false});
  console.log('[V-TRADE TELEGRAM] polling/network + compact signal hotfix V2 active');
}
