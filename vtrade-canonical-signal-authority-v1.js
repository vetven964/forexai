/* V-TRADE Canonical Signal Authority V1
 * Single authority for direction truth and Telegram market readiness.
 * - Direction: H4/H1/M15 core structure, 2-of-3.
 * - Telegram: same canonical Pre-Market route, never synthetic.
 * - Fail closed: no directional execution from score alone.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const MARKER = 'VTRADE_CANONICAL_SIGNAL_AUTHORITY_V1';

function patchPreMarketRoute() {
  const file = path.join(__dirname, 'pre-market-direct-route-hotfix.js');
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(MARKER)) return;

  const old = "const rows={};for(const tf of TFS)rows[tf]=frame(a,tf,live);const ready=CORE.filter(tf=>rows[tf].ready).length,score=n(a?.directionScore??a?.aiScore??a?.score?.directionScore),buy=score==null?null:Math.max(0,Math.min(100,Math.round(score))),sell=buy==null?null:100-buy,bias=side(a?.bias??a?.directionBand??a?.macroBias),confidence=n(a?.confidence??a?.score?.confidence??a?.setupScore),complete=ready===4;";
  const replacement = "/* " + MARKER + " */\n  const rows={};for(const tf of TFS)rows[tf]=frame(a,tf,live);const ready=CORE.filter(tf=>rows[tf].ready).length,score=n(a?.directionScore??a?.aiScore??a?.score?.directionScore),buy=score==null?null:Math.max(0,Math.min(100,Math.round(score))),sell=buy==null?null:100-buy;const coreSides=CORE.map(tf=>side(rows[tf]?.structure?.bias??rows[tf]?.resolvedBias??rows[tf]?.trend??rows[tf]?.bias??rows[tf]?.direction));const coreBull=coreSides.filter(x=>x==='BULLISH').length;const coreBear=coreSides.filter(x=>x==='BEARISH').length;const coreBias=coreBull>=2?'BULLISH':coreBear>=2?'BEARISH':'NEUTRAL';const bias=coreBias;const confidence=n(a?.confidence??a?.score?.confidence??a?.setupScore),complete=ready===4;";
  if (!s.includes(old)) {
    console.warn('[V-TRADE AUTHORITY] Pre-Market calc anchor not found; no unsafe patch applied');
  } else {
    s = s.replace(old, replacement);
    const oldReturn = "canonical:{source:'buildXauAnalysis + brokerFeed.timeframes + parseBrokerCandles',directionScore:score,buyStrengthPct:buy,sellStrengthPct:sell,bias,confidence,status:a?.status||'WAIT',signal:a?.signal||'WAIT',phase:a?.phase||'WAIT'},";
    const newReturn = "canonical:{source:'H4/H1/M15 core confluence',directionScore:score,buyStrengthPct:buy,sellStrengthPct:sell,bias,coreBias,coreBiasVotes:{BULLISH:coreBull,BEARISH:coreBear},directionSource:'H4/H1/M15 core confluence 2-of-3',confidence,status:a?.status||'WAIT',signal:a?.signal||'WAIT',phase:a?.phase||'WAIT'},";
    if (s.includes(oldReturn)) s = s.replace(oldReturn, newReturn);
    fs.writeFileSync(file, s, 'utf8');
    console.log('[V-TRADE AUTHORITY] Pre-Market core direction V1 installed | H4/H1/M15 2-of-3');
  }
}

function patchTelegramBridge() {
  const file = path.join(__dirname, 'telegram-signal-bridge.js');
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(MARKER)) return;
  const old = "const timeframes={};\n      for(const tf of ['M5','M15','H1','H4']){\n        const src=data?.timeframes?.[tf]||{};\n        const bars=Array.isArray(src?.candles)?src.candles:Array.isArray(src?.bars)?src.bars:[];\n        timeframes[tf]={bars,count:bars.length,ready:src?.ready===true||bars.length>=30};\n      }\n      const allReady=['M5','M15','H1','H4'].every(tf=>timeframes[tf].ready);\n      const age=n(data?.quoteAgeSec??data?.ageSec);\n      const connected=price!=null&&allReady;\n      const quoteFresh=age==null?connected:(age>=0&&age<=60000&&connected);";
  const replacement = "/* " + MARKER + " */\n      const timeframes={};\n      for(const tf of ['M5','M15','H1','H4']){\n        const src=data?.timeframes?.[tf]||data?.frames?.[tf]||{};\n        const bars=Array.isArray(src?.candles)?src.candles:Array.isArray(src?.bars)?src.bars:[];\n        const ready=src?.ready===true||bars.length>=20||Number(src?.feedBars||0)>=30||Number(src?.bars||0)>=30;\n        timeframes[tf]={bars,count:bars.length,ready};\n      }\n      const allReady=['M5','M15','H1','H4'].every(tf=>timeframes[tf].ready);\n      const age=n(data?.quoteAgeSec??data?.ageSec);\n      const connected=price!=null&&allReady;\n      const quoteFresh=age==null?connected:(age>=0&&age<=60&&connected);";
  if (!s.includes(old)) {
    console.warn('[V-TRADE AUTHORITY] Telegram bridge anchor not found; no unsafe patch applied');
  } else {
    s = s.replace(old, replacement);
    s = s.replace("telegramRole:'INDEPENDENT_AI_SCAN',preMarketLoaded:true", "telegramRole:'CANONICAL_PREMARKET_CONSUMER',preMarketLoaded:true,marketContractVersion:'V1',coreHistoryReady:allReady");
    fs.writeFileSync(file, s, 'utf8');
    console.log('[V-TRADE AUTHORITY] Telegram canonical market readiness V1 installed');
  }
}

try {
  patchPreMarketRoute();
  patchTelegramBridge();
} catch (e) {
  console.error('[V-TRADE AUTHORITY] patch failed:', e.stack || e.message || e);
  process.exitCode = 1;
}

module.exports = { MARKER };
