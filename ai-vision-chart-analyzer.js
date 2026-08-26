'use strict';

const crypto = require('crypto');

// V-TRADE FREE / NO-OPENAI Vision Analyzer.
// Uses a self-hosted Ollama Vision model when configured.
// If Ollama is unavailable, the endpoint returns a safe WAIT result instead of guessing.
const MAX_DATA_URL_CHARS = Math.max(250_000, Number(process.env.AI_VISION_MAX_DATA_URL_CHARS || 8_000_000));
const TIMEOUT_MS = Math.max(5_000, Number(process.env.AI_VISION_TIMEOUT_MS || 90_000));
const ENABLED = String(process.env.AI_VISION_ENABLED || 'true').toLowerCase() === 'true';
const OLLAMA_URL = String(process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = String(process.env.OLLAMA_VISION_MODEL || 'qwen2.5vl:3b').trim();
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const requestHits = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = Math.max(1, Number(process.env.AI_VISION_RATE_LIMIT || 6));

const schema = {
  imageQuality: 'GOOD|LIMITED|INVALID',
  symbol: 'string', timeframe: 'string', price: 'number|null',
  trend: 'BULLISH|BEARISH|RANGE|UNKNOWN', bias: 'BULLISH|BEARISH|NEUTRAL',
  signal: 'BUY|SELL|WAIT', confidence: 'integer 0-100', reason: 'string',
  liquiditySweep: 'BULLISH|BEARISH|NONE|UNCLEAR',
  mssBos: 'BULLISH|BEARISH|NONE|UNCLEAR',
  fvg: 'BULLISH|BEARISH|NONE|UNCLEAR',
  orderBlock: 'BULLISH|BEARISH|NONE|UNCLEAR',
  premiumDiscount: 'PREMIUM|DISCOUNT|EQUILIBRIUM|UNKNOWN',
  entryLow: 'number|null', entryHigh: 'number|null', stopLoss: 'number|null',
  tp1: 'number|null', tp2: 'number|null', tp3: 'number|null',
  setupQuality: 'A|B|C|WAIT|INVALID',
  confirmations: 'string[]', blockers: 'string[]', disclaimer: 'string'
};

function clientKey(req) {
  return String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim().slice(0, 100);
}
function rateOk(req) {
  const now = Date.now();
  const key = clientKey(req);
  const fresh = (requestHits.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS_PER_WINDOW) { requestHits.set(key, fresh); return false; }
  fresh.push(now); requestHits.set(key, fresh); return true;
}
function validateDataUrl(dataUrl) {
  const value = String(dataUrl || '').trim();
  if (value.length < 100 || value.length > MAX_DATA_URL_CHARS) return { ok: false, error: 'Image payload is missing or too large' };
  const m = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!m || !ALLOWED_MIME.has(m[1].toLowerCase())) return { ok: false, error: 'Only PNG, JPEG and WebP chart images are supported' };
  const bytes = Math.floor((m[2].length * 3) / 4);
  if (bytes > 6 * 1024 * 1024) return { ok: false, error: 'Chart image must be 6 MB or smaller' };
  return { ok: true, mime: m[1].toLowerCase(), base64: m[2], bytes };
}
function extractJson(text) {
  const clean = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch (_) {
    const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(clean.slice(a, b + 1)); } catch (__) {} }
  }
  return null;
}
function normalizeResult(r) {
  const out = { ...r };
  out.imageQuality = ['GOOD','LIMITED','INVALID'].includes(out.imageQuality) ? out.imageQuality : 'INVALID';
  out.signal = ['BUY','SELL','WAIT'].includes(out.signal) ? out.signal : 'WAIT';
  out.bias = ['BULLISH','BEARISH','NEUTRAL'].includes(out.bias) ? out.bias : 'NEUTRAL';
  out.confidence = Math.max(0, Math.min(100, Number(out.confidence) || 0));
  out.confirmations = Array.isArray(out.confirmations) ? out.confirmations.map(String).slice(0, 10) : [];
  out.blockers = Array.isArray(out.blockers) ? out.blockers.map(String).slice(0, 10) : [];
  if (out.imageQuality !== 'GOOD') { out.signal = 'WAIT'; out.setupQuality = out.imageQuality === 'INVALID' ? 'INVALID' : 'WAIT'; out.confidence = Math.min(out.confidence, 35); }
  if (out.signal === 'BUY' && out.bias !== 'BULLISH') out.signal = 'WAIT';
  if (out.signal === 'SELL' && out.bias !== 'BEARISH') out.signal = 'WAIT';
  if (out.signal === 'WAIT') {
    out.entryLow = out.entryHigh = out.stopLoss = out.tp1 = out.tp2 = out.tp3 = null;
  }
  return out;
}
function safeWait(reason) {
  return normalizeResult({
    imageQuality: 'LIMITED', symbol: 'XAUUSD', timeframe: 'UNKNOWN', price: null,
    trend: 'UNKNOWN', bias: 'NEUTRAL', signal: 'WAIT', confidence: 0,
    reason, liquiditySweep: 'UNCLEAR', mssBos: 'UNCLEAR', fvg: 'UNCLEAR',
    orderBlock: 'UNCLEAR', premiumDiscount: 'UNKNOWN', entryLow: null, entryHigh: null,
    stopLoss: null, tp1: null, tp2: null, tp3: null, setupQuality: 'WAIT',
    confirmations: [], blockers: [reason],
    disclaimer: 'Free self-hosted screenshot analysis. Not guaranteed financial advice.'
  });
}
async function callOllama(checked) {
  if (!ENABLED) return { status: 'disabled', error: 'AI Vision is disabled' };
  const prompt = `You are V-TRADE AI FREE Vision Chart Analyzer. Analyze ONLY this screenshot. Never invent hidden/live market data. Identify only visible symbol, timeframe, price, candles and visible indicators. Apply ICT concepts conservatively: liquidity sweep, MSS/BOS, FVG, order block and premium/discount. If the screenshot is blurry, cropped, lacks enough candles/price scale, or the setup is not clearly confirmed, output WAIT. BUY requires visible bullish structure and a credible visible entry area. SELL requires visible bearish structure and a credible visible entry area. Never fabricate SL/TP.\n\nReturn ONLY valid JSON matching this exact shape and enum values:\n${JSON.stringify(schema)}\n\nThis is decision support, not guaranteed financial advice.`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, images: [checked.base64], stream: false, format: 'json', options: { temperature: 0.1 } })
    });
    const text = await response.text();
    let body = {}; try { body = JSON.parse(text); } catch (_) {}
    if (!response.ok) throw new Error(body?.error || `Ollama HTTP ${response.status}`);
    const parsed = extractJson(body?.response || '');
    if (!parsed) throw new Error('Ollama returned invalid JSON');
    return { status: 'ok', model: OLLAMA_MODEL, result: normalizeResult(parsed) };
  } catch (e) {
    return { status: e?.name === 'AbortError' ? 'timeout' : 'unavailable', model: OLLAMA_MODEL, error: String(e?.message || e) };
  } finally { clearTimeout(timer); }
}

function install(app, requireAuth) {
  if (!app || typeof app.post !== 'function') throw new Error('Express app is required');
  if (app.__vtradeVisionAnalyzerInstalled) return;
  app.__vtradeVisionAnalyzerInstalled = true;

  app.get('/api/v5/ai/vision/health', requireAuth, async (req, res) => {
    res.json({ success: true, enabled: ENABLED, provider: 'ollama-local', model: OLLAMA_MODEL, baseUrlConfigured: !!process.env.OLLAMA_BASE_URL, openai: false, maxImageBytes: 6 * 1024 * 1024 });
  });

  app.post('/api/v5/ai/vision/chart', requireAuth, async (req, res) => {
    if (!rateOk(req)) return res.status(429).json({ success: false, error: 'Too many chart analyses. Please wait a minute.' });
    const checked = validateDataUrl(req.body?.imageDataUrl);
    if (!checked.ok) return res.status(400).json({ success: false, error: checked.error });
    const result = await callOllama(checked);
    if (result.status !== 'ok') {
      return res.status(result.status === 'disabled' ? 503 : 502).json({ success: false, error: result.error || 'Free Vision AI is unavailable', ai: { provider: 'ollama-local', model: OLLAMA_MODEL, status: result.status, openai: false } });
    }
    const r = result.result;
    console.log(`[V-TRADE FREE VISION] ${r.symbol || 'UNKNOWN'} ${r.timeframe || 'UNKNOWN'} | signal=${r.signal} | bias=${r.bias} | confidence=${r.confidence}`);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, source: 'Free Local Vision Screenshot', analysis: r, ai: { provider: 'ollama-local', model: result.model, status: result.status, openai: false } });
  });
  console.log(`[V-TRADE FREE VISION] Ollama analyzer installed | model=${OLLAMA_MODEL} | OpenAI=OFF`);
}
module.exports = { install, safeWait };
