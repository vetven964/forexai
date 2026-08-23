// V-TRADE AI — Canonical MT5 data contract V1
// One deterministic freshness/closed-candle contract shared by the production server.
'use strict';
const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.resolve(__dirname, 'server.js');
const MARKER = 'VTRADE_CANONICAL_DATA_CONTRACT_V1';

function normalizeTimestampMs(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return n < 1e12 ? n * 1000 : n;
}

function patchServer(source) {
  if (!source || source.includes(MARKER)) return source;

  const helperMarker = "const HOST = '0.0.0.0';";
  if (source.includes(helperMarker) && !source.includes('function normalizeTimestampMs(value)')) {
    source = source.replace(helperMarker, `${helperMarker}\n\n/* ${MARKER} */\nfunction normalizeTimestampMs(value) {\n  const n=Number(value);\n  if(!Number.isFinite(n)||n<=0)return NaN;\n  return n<1e12?n*1000:n;\n}`);
  }

  // The old implementation treated the last received candle as closed and used
  // one M5 age for every timeframe. Replace it with per-timeframe normalized ages.
  const old = "const candleAgeSec=m5.length?Math.max(0,(Date.now()-m5[m5.length-1].t)/1000):Infinity,candlesFresh=candleAgeSec<=15*60;";
  const replacement = `const closedCandleMaxAgeSec=Math.max(60,Number(process.env.CLOSED_CANDLE_MAX_AGE_SEC||900));
  const latestClosedM5Ms=m5.length?normalizeTimestampMs(m5[m5.length-1]?.t):NaN;
  const latestClosedM15Ms=m15.length?normalizeTimestampMs(m15[m15.length-1]?.t):NaN;
  const latestClosedH1Ms=h1.length?normalizeTimestampMs(h1[h1.length-1]?.t):NaN;
  const latestClosedH4Ms=h4.length?normalizeTimestampMs(h4[h4.length-1]?.t):NaN;
  const candleAgeSec=Number.isFinite(latestClosedM5Ms)?Math.max(0,(Date.now()-latestClosedM5Ms)/1000):Infinity;
  const closedAgeByTf={
    M5:Number.isFinite(latestClosedM5Ms)?Math.max(0,(Date.now()-latestClosedM5Ms)/1000):Infinity,
    M15:Number.isFinite(latestClosedM15Ms)?Math.max(0,(Date.now()-latestClosedM15Ms)/1000):Infinity,
    H1:Number.isFinite(latestClosedH1Ms)?Math.max(0,(Date.now()-latestClosedH1Ms)/1000):Infinity,
    H4:Number.isFinite(latestClosedH4Ms)?Math.max(0,(Date.now()-latestClosedH4Ms)/1000):Infinity
  };
  const candlesFresh=closedAgeByTf.M5<=Math.min(closedCandleMaxAgeSec,600)
    &&closedAgeByTf.M15<=Math.min(closedCandleMaxAgeSec*2,1800)
    &&closedAgeByTf.H1<=Math.min(closedCandleMaxAgeSec*8,7200)
    &&closedAgeByTf.H4<=Math.min(closedCandleMaxAgeSec*32,28800);`;
  if (source.includes(old)) source = source.replace(old, replacement);

  // Keep a canonical diagnostic object available to downstream formatters.
  if (!source.includes('canonicalMt5DataContract')) {
    const marker = "const autoTradeState = {";
    if (source.includes(marker)) {
      source = source.replace(marker, `function canonicalMt5DataContract(m5,m15,h1,h4,quoteAt){
  const now=Date.now();
  const ages={M5:Infinity,M15:Infinity,H1:Infinity,H4:Infinity};
  const lists={M5:m5,M15:m15,H1:h1,H4:h4};
  for(const tf of Object.keys(lists)){const a=lists[tf];const t=a?.length?normalizeTimestampMs(a[a.length-1]?.t):NaN;ages[tf]=Number.isFinite(t)?Math.max(0,(now-t)/1000):Infinity;}
  const quoteAge=Number.isFinite(Number(quoteAt))?Math.max(0,(now-Number(quoteAt))/1000):null;
  return {version:'V1',quoteAgeSec:quoteAge,closedCandleAgeSec:ages,historyReady:['M5','M15','H1','H4'].every(tf=>Array.isArray(lists[tf])&&lists[tf].length>=30),fresh:['M5','M15','H1','H4'].every(tf=>ages[tf] <= ({M5:600,M15:1800,H1:7200,H4:28800}[tf])),source:'broker-native-MT5'};
}

${marker}`,1);
    }
  }

  return source;
}

try {
  if (fs.existsSync(SERVER_FILE)) {
    const before = fs.readFileSync(SERVER_FILE,'utf8');
    const after = patchServer(before);
    if (after !== before) {
      fs.writeFileSync(SERVER_FILE,after,'utf8');
      console.log('[V-TRADE DATA CONTRACT] canonical MT5 timestamp/freshness contract applied');
    } else {
      console.log('[V-TRADE DATA CONTRACT] already active or source pattern not present');
    }
  }
} catch (e) {
  console.error('[V-TRADE DATA CONTRACT] patch failed:',e.stack||e.message||e);
  process.exitCode=1;
}

module.exports={normalizeTimestampMs,patchServer};
