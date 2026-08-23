// V-TRADE AI — Sunday Weekly Pre-Open Telegram Outlook V4
// Sunday-only weekly context report. Analysis-only; never authorizes orders.
// Strong Long/Short requires real MTF readiness AND all ICT gates.
'use strict';

const TELEGRAM_TOKEN = String(process.env.TELEGRAM_AUTO_TOKEN || process.env.TELEGRAM_TOKEN || '').trim();
const TELEGRAM_CHAT_ID = String(process.env.TELEGRAM_AUTO_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '').trim();
const ENABLED = String(process.env.SUNDAY_PREOPEN_ENABLED || 'true').toLowerCase() === 'true';
const TZ = String(process.env.SUNDAY_PREOPEN_TZ || 'Asia/Phnom_Penh');
const HOUR = Math.max(0, Math.min(23, Number(process.env.SUNDAY_PREOPEN_HOUR || 20)));
const MINUTE = Math.max(0, Math.min(59, Number(process.env.SUNDAY_PREOPEN_MINUTE || 0)));
const POLL_MS = 15 * 1000;
const INTERNAL_HOST = String(process.env.INTERNAL_HOST || '127.0.0.1');
const PORT = Number(process.env.PORT || 10000);
const STATE = globalThis.__vtradeSundayPreopenState || (globalThis.__vtradeSundayPreopenState = { lastKey: '' });

function parts(d) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false });
  return Object.fromEntries(f.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
}
function sundayKey(d) { const p = parts(d); return `${p.year}-${p.month}-${p.day}`; }
function isSunday(d) { return parts(d).weekday === 'Sun'; }
function minuteOfDay(d) { const p = parts(d); return Number(p.hour) * 60 + Number(p.minute); }
function scheduledMinute() { return HOUR * 60 + MINUTE; }
function fmt(v) { return Number.isFinite(Number(v)) ? Number(v).toFixed(2) : '—'; }
function clamp(v) { return Math.max(0, Math.min(100, Number(v) || 0)); }

async function getPreopen() {
  const url = `http://${INTERNAL_HOST}:${PORT}/api/pre-market/candle-open`;
  let lastError = null;
  // The Sunday module is preloaded before the HTTP server is fully listening on Render.
  // Retry transient startup/network failures instead of logging a false final failure.
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      const raw = await r.json().catch(()=>({success:false,error:'Invalid pre-market response'}));
      if (r.ok && raw?.success !== false) return raw;
      lastError = new Error(raw?.error || `HTTP ${r.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < 5) await new Promise(resolve => setTimeout(resolve, Math.min(1000 * attempt, 4000)));
  }
  throw lastError || new Error('Pre-market endpoint unavailable');
}

function gateState(a) {
  const g = a?.gates || {};
  const available = Number(a?.available ?? a?.mtfAvailable ?? 0);
  const requiredMtf = Number(a?.requiredMtf ?? 4);
  return {
    liquidity: Boolean(g.liquiditySweep),
    mss: Boolean(g.mss),
    bos: Boolean(g.bos),
    fvg: Boolean(g.fvg),
    ob: Boolean(g.orderBlock),
    mtf: available >= requiredMtf
  };
}

function classify(a) {
  const buy = clamp(a?.buyStrengthPct);
  const sell = clamp(a?.sellStrengthPct);
  const bias = buy > sell ? 'BULLISH' : sell > buy ? 'BEARISH' : 'NEUTRAL';
  const strength = Math.max(buy, sell);
  const gates = gateState(a);
  const allGates = Object.values(gates).every(Boolean);
  const strong = strength >= 70 && allGates;
  return { buy, sell, bias, strength, strong, gates };
}

function levels(a, side) {
  const frame = a?.frames?.H4 || a?.timeframes?.H4 || {};
  const atr = Number(frame?.atr);
  const z = side === 'BUY' ? a?.zone?.buyZone : a?.zone?.sellZone;
  if (!Number.isFinite(atr) || atr <= 0 || !Array.isArray(z) || z.length < 2) return null;
  const low = Math.min(Number(z[0]), Number(z[1]));
  const high = Math.max(Number(z[0]), Number(z[1]));
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return null;
  const entry = (low + high) / 2;
  const sl = side === 'BUY' ? low - atr * 0.50 : high + atr * 0.50;
  const risk = Math.abs(entry - sl);
  if (!Number.isFinite(risk) || risk <= 0) return null;
  const mult = [1, 2, 2.5];
  const tps = side === 'BUY' ? mult.map(x=>entry + risk*x) : mult.map(x=>entry - risk*x);
  return { low, high, entry, sl, tp1:tps[0], tp2:tps[1], tp3:tps[2], rr:2.5 };
}

function buildMessage(a) {
  const c = classify(a);
  const side = c.bias === 'BULLISH' ? 'BUY' : c.bias === 'BEARISH' ? 'SELL' : null;
  const lv = c.strong && side ? levels(a, side) : null;
  // IMPORTANT: bias is NOT a trade. Only the fully-gated strong state gets a trade label.
  const title = c.strong && lv
    ? (side === 'BUY' ? '🟢 STRONG LONG' : side === 'SELL' ? '🔴 STRONG SHORT' : '🟡 WAIT')
    : (c.bias === 'BULLISH' ? '🟡 BULLISH BIAS — WAIT' : c.bias === 'BEARISH' ? '🟡 BEARISH BIAS — WAIT' : '🟡 WAIT');
  const g = c.gates;
  const gateLine = [
    `MSS/BOS: ${g.mss && g.bos ? '✅' : '❌'}`,
    `Liquidity: ${g.liquidity ? '✅' : '❌'}`,
    `FVG/OB: ${g.fvg || g.ob ? '✅' : '❌'}`,
    `MTF: ${g.mtf ? '✅' : '❌'}`
  ].join(' | ');
  const lines = [
    '📅 *V TRADE AI — SUNDAY WEEKLY PRE-OPEN*','',
    `🪙 XAUUSD — *${title}*`,
    `📊 Buy Strength: *${c.buy.toFixed(0)}/100*`,
    `📊 Sell Strength: *${c.sell.toFixed(0)}/100*`,
    `🧠 Pre-Open Confidence: *${Number(a?.confidence || 0).toFixed(0)}/100*`,
    `💰 Reference Price: *${fmt(a?.price)}*`,'',
    `🔎 ${gateLine}`
  ];
  if (c.strong && lv) {
    lines.push('', '🎯 *PRE-OPEN PLANNING LEVELS*', `Entry Zone: *${fmt(lv.low)} — ${fmt(lv.high)}*`, `SL: *${fmt(lv.sl)}*`, `TP1: *${fmt(lv.tp1)}*`, `TP2: *${fmt(lv.tp2)}*`, `TP3: *${fmt(lv.tp3)}*`, `RR: *1:${lv.rr.toFixed(1)}*`);
  } else {
    lines.push('', '🎯 Entry Zone: *WAIT*', '🛑 SL: *WAIT*', '🎯 TP1: *WAIT*', '🎯 TP2: *WAIT*', '🎯 TP3: *WAIT*', '🛡️ *NO ORDER AUTHORIZED*');
  }
  lines.push('', '⚠️ *Weekly pre-open outlook — analysis only; not an order authorization.*', '🔐 Market Open must revalidate with Real MT5 before `UPTRADE NOW / DOWNTRADE NOW`.');
  return lines.join('\n');
}

async function send(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) { console.warn('[SUNDAY PREOPEN] Telegram not configured — report skipped'); return false; }
  const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_TOKEN)}/sendMessage`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({chat_id:TELEGRAM_CHAT_ID,text,parse_mode:'Markdown'}), signal:AbortSignal.timeout(10000) });
  const raw = await r.json().catch(()=>({ok:false}));
  if (!r.ok || !raw.ok) throw new Error(raw?.description || `Telegram HTTP ${r.status}`);
  return true;
}

async function run(now = new Date()) {
  if (!ENABLED || !isSunday(now)) return false;
  const key = sundayKey(now);
  if (STATE.lastKey === key) return false;
  if (minuteOfDay(now) < scheduledMinute()) return false;
  const analysis = await getPreopen();
  const text = buildMessage(analysis);
  const sent = await send(text);
  if (!sent) return false;
  STATE.lastKey = key;
  const c = classify(analysis);
  console.log('[SUNDAY PREOPEN] Weekly outlook sent | key=' + key + ' | bias=' + c.bias + ' | strong=' + c.strong + ' | gates=' + Object.values(c.gates).filter(Boolean).length + '/6');
  return true;
}

if (ENABLED) {
  setInterval(() => run().catch(e => console.error('[SUNDAY PREOPEN] failed:', e.message)), POLL_MS);
  console.log(`[SUNDAY PREOPEN] enabled | Sunday ${String(HOUR).padStart(2,'0')}:${String(MINUTE).padStart(2,'0')} | tz=${TZ} | analysis-only | gates-required`);
}

module.exports = { run, classify, buildMessage };
