/* V-TRADE TELEGRAM CANONICAL AUTHORITY BRIDGE V1
 * Telegram child processes consume the same canonical MT5 authority as CORE.
 * This bridge only merges broker-native canonical data into /api/telegram/market-snapshot.
 * It never fabricates candles and never upgrades an invalid feed.
 */
'use strict';

if (!global.__VTRADE_TELEGRAM_CANONICAL_AUTHORITY_BRIDGE__) {
  const originalFetch = global.fetch;
  if (typeof originalFetch !== 'function') {
    console.warn('[V-TRADE TELEGRAM AUTHORITY BRIDGE] fetch unavailable; bridge skipped');
  } else {
    const validOhlc = c => {
      const o=Number(c?.o??c?.open), h=Number(c?.h??c?.high), l=Number(c?.l??c?.low), cl=Number(c?.c??c?.close);
      return [o,h,l,cl].every(Number.isFinite) && h>=Math.max(o,cl) && l<=Math.min(o,cl) && h>=l;
    };
    const realGate = a => {
      const g=a?.realCandleGate || {};
      const tf=a?.timeframes || {};
      const core=['M5','M15','H1','H4'];
      const coreReady=g.coreReady===true || g.ok===true;
      const tfReady=core.every(k => {
        const row=tf[k]||{};
        const gateRow=g.timeframes?.[k]||{};
        const bars=Number(row.bars ?? gateRow.bars ?? 0);
        return (row.realCandle===true || gateRow.realCandle===true) && bars>=30;
      });
      const m5=tf.M5||{};
      const candle=m5.candle || (Array.isArray(m5.candles)?m5.candles[m5.candles.length-1]:null);
      return coreReady && tfReady && validOhlc(candle);
    };
    global.fetch = async (...args) => {
      const target=String(args?.[0]?.url || args?.[0] || '');
      const response=await originalFetch(...args);
      if (!target.includes('/api/telegram/market-snapshot')) return response;
      try {
        const baseText=await response.clone().text();
        const base=JSON.parse(baseText);
        if (!base || base.success!==true) return response;
        const baseUrl=new URL(target, 'http://127.0.0.1');
        const origin=baseUrl.origin;
        const headers={'Cache-Control':'no-cache','X-VTRADE-CLIENT':'telegram-canonical-authority-bridge-v1'};
        const key=process.env.TELEGRAM_BRIDGE_API_KEY || process.env.MT5_BRIDGE_API_KEY || '';
        if (key) headers['X-VTRADE-TELEGRAM-KEY']=key;
        const authorityResponse=await originalFetch(origin+'/api/pre-market/mt5-authoritative',{headers,cache:'no-store'});
        const authorityText=await authorityResponse.text();
        let authority=null;
        try { authority=JSON.parse(authorityText); } catch (_) { return response; }
        if (!authorityResponse.ok || authority?.success===false) return response;

        const real=realGate(authority);
        const merged={
          ...base,
          ...authority,
          success:true,
          price: authority.price ?? base.price,
          spread: authority.spread ?? base.spread,
          connected: authority.connected ?? base.connected,
          marketTransition: authority.marketTransition ?? base.marketTransition,
          realCandleGate: authority.realCandleGate || base.realCandleGate || null,
          canonicalAuthority: true,
          realCandle: real,
          candleValid: real,
          fakeCandle: !real,
          syntheticCandle: !real,
          timeframes: authority.timeframes || base.timeframes || {}
        };
        const outHeaders=new Headers(response.headers);
        outHeaders.set('content-type','application/json; charset=utf-8');
        return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers:outHeaders});
      } catch (e) {
        console.warn('[V-TRADE TELEGRAM AUTHORITY BRIDGE] merge skipped:',e?.message||e);
        return response;
      }
    };
    global.__VTRADE_TELEGRAM_CANONICAL_AUTHORITY_BRIDGE__=true;
    console.log('[V-TRADE TELEGRAM AUTHORITY BRIDGE] canonical MT5 authority propagation ACTIVE | synthetic=false only');
  }
}

module.exports={installed:true};
