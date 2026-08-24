/* V-TRADE AI — Economic Calendar + News Risk Gate V1
 * Single server-side calendar source for XAUUSD pre-market safety.
 * Source: ForexFactory/FairEconomy weekly JSON. Cached to avoid repeated requests.
 * Fail-closed: if the calendar cannot be verified, AI/trade promotion is blocked.
 * This layer never places orders and never sends Telegram.
 */
'use strict';

module.exports = function installPreMarketNewsCalendarHotfix(app) {
  if (!app || app.__VTRADE_NEWS_CALENDAR_V1__) return;
  app.__VTRADE_NEWS_CALENDAR_V1__ = true;

  const SOURCE = String(process.env.VTRADE_CALENDAR_URL || 'https://nfs.faireconomy.media/ff_calendar_thisweek.json').trim();
  const CACHE_MS = Math.max(5 * 60 * 1000, Number(process.env.VTRADE_CALENDAR_CACHE_MS || 10 * 60 * 1000));
  const NEWS_BLOCK_MIN = Math.max(5, Number(process.env.VTRADE_NEWS_BLOCK_MIN || 10));
  const NEWS_CAUTION_MIN = Math.max(NEWS_BLOCK_MIN, Number(process.env.VTRADE_NEWS_CAUTION_MIN || 30));
  const LOOKAHEAD_MIN = Math.max(60, Number(process.env.VTRADE_NEWS_LOOKAHEAD_MIN || 24 * 60));
  const TZ = 'Asia/Phnom_Penh';
  let cache = { at: 0, events: null, error: null };

  const json = (res, status, body) => res.status(status).json(body);
  const clean = v => String(v ?? '').trim();
  const impact = v => {
    const s = clean(v).toUpperCase();
    return s === 'HIGH' ? 'HIGH' : s === 'MEDIUM' ? 'MEDIUM' : s === 'LOW' ? 'LOW' : 'UNKNOWN';
  };
  const isUsd = e => clean(e?.country || e?.currency).toUpperCase() === 'USD';
  const eventTime = e => {
    const d = new Date(e?.date || e?.datetime || e?.time);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  async function fetchCalendar() {
    const r = await fetch(SOURCE, {
      cache: 'no-store',
      headers: { accept: 'application/json', 'user-agent': 'V-TRADE-AI-NewsGate/1.0' },
      signal: AbortSignal.timeout(7000)
    });
    if (!r.ok) throw new Error(`Calendar HTTP ${r.status}`);
    const text = await r.text();
    if (/<!doctype|<html/i.test(text)) throw new Error('Calendar returned HTML instead of JSON');
    let raw;
    try { raw = JSON.parse(text); } catch (_) { throw new Error('Calendar JSON parse failed'); }
    if (!Array.isArray(raw)) throw new Error('Calendar payload is not an array');
    return raw.map((e, i) => ({
      id: `${e.id || e.date || i}-${clean(e.country || e.currency)}-${clean(e.title)}`,
      title: clean(e.title || e.event || e.name) || 'Economic event',
      country: clean(e.country || e.currency).toUpperCase(),
      impact: impact(e.impact),
      date: eventTime(e)?.toISOString() || null,
      forecast: clean(e.forecast),
      previous: clean(e.previous),
      actual: clean(e.actual),
      source: 'ForexFactory Calendar',
      sourceUrl: SOURCE
    })).filter(e => e.date && e.title);
  }

  async function getEvents() {
    if (cache.events && Date.now() - cache.at < CACHE_MS) return { events: cache.events, cached: true, error: null };
    try {
      const events = await fetchCalendar();
      cache = { at: Date.now(), events, error: null };
      return { events, cached: false, error: null };
    } catch (e) {
      cache = { at: Date.now(), events: null, error: String(e?.message || e) };
      return { events: null, cached: false, error: cache.error };
    }
  }

  function classify(events) {
    const now = Date.now();
    const horizon = now + LOOKAHEAD_MIN * 60 * 1000;
    const relevant = events.filter(e => isUsd(e) && e.impact === 'HIGH').map(e => {
      const t = new Date(e.date).getTime();
      return { ...e, minutesUntil: Math.round((t - now) / 60000) };
    }).filter(e => e.minutesUntil >= -15 && e.minutesUntil <= LOOKAHEAD_MIN).sort((a,b) => a.minutesUntil - b.minutesUntil);

    const next = relevant.find(e => e.minutesUntil >= 0) || null;
    const active = relevant.find(e => e.minutesUntil < 0 && e.minutesUntil >= -15) || null;
    let state = 'CLEAR';
    let action = 'NEWS_CLEAR';
    let reason = 'No verified high-impact USD event is inside the configured risk window.';
    if (active) {
      state = 'BLOCK'; action = 'WAIT_NEWS_RISK';
      reason = `High-impact USD event is active/recent: ${active.title}`;
    } else if (next && next.minutesUntil <= NEWS_BLOCK_MIN) {
      state = 'BLOCK'; action = 'WAIT_NEWS_RISK';
      reason = `High-impact USD news in ${Math.max(0, next.minutesUntil)} minutes: ${next.title}`;
    } else if (next && next.minutesUntil <= NEWS_CAUTION_MIN) {
      state = 'CAUTION'; action = 'REDUCE_CONFIDENCE_WAIT_CONFIRMATION';
      reason = `High-impact USD news in ${next.minutesUntil} minutes: ${next.title}`;
    }
    return { state, action, reason, nextHighImpactUsd: next, recentHighImpactUsd: active, relevantEvents: relevant.slice(0, 12), timezone: TZ, blockMinutes: NEWS_BLOCK_MIN, cautionMinutes: NEWS_CAUTION_MIN };
  }

  async function snapshot() {
    const r = await getEvents();
    if (!r.events) return {
      success: false,
      verified: false,
      state: 'UNKNOWN',
      action: 'WAIT_NEWS_UNKNOWN',
      reason: 'Economic calendar could not be verified. Signal promotion is blocked fail-closed.',
      error: r.error,
      source: SOURCE,
      timezone: TZ,
      generatedAt: new Date().toISOString()
    };
    const risk = classify(r.events);
    return { success: true, verified: true, cached: r.cached, source: SOURCE, generatedAt: new Date().toISOString(), ...risk };
  }

  /* Register BEFORE the legacy pre-market engine so this becomes the authoritative route. */
  app.get('/api/economic-calendar', async (_req, res) => {
    try { return json(res, 200, await snapshot()); }
    catch (e) { return json(res, 502, { success:false, verified:false, state:'UNKNOWN', action:'WAIT_NEWS_UNKNOWN', reason:'Calendar verification failed; fail-closed.', error:String(e?.message || e) }); }
  });

  app.get('/api/news-risk', async (_req, res) => {
    try { return json(res, 200, await snapshot()); }
    catch (e) { return json(res, 502, { success:false, verified:false, state:'UNKNOWN', action:'WAIT_NEWS_UNKNOWN', reason:'News verification failed; fail-closed.', error:String(e?.message || e) }); }
  });

  /* Replace the broken/legacy market-news response with a verified calendar response. */
  app.get('/api/market-news', async (_req, res) => {
    const s = await snapshot();
    const items = s.verified ? (s.relevantEvents || []).map(e => ({
      id: e.id, source: e.source, title: `${e.country} · ${e.title}`, text: `${e.impact} impact · ${e.country}`,
      publishedAt: e.date, impact: e.impact, relevance: e.country === 'USD' ? 'XAUUSD_RELEVANT' : 'MACRO', url: e.sourceUrl, type: 'CALENDAR'
    })) : [];
    return json(res, 200, {
      success: s.success, verified: s.verified, state: s.state, action: s.action, reason: s.reason,
      error: s.error || null, generatedAt: s.generatedAt, items, highImpactCount: items.filter(x => x.impact === 'HIGH').length,
      sourcePolicy: 'ForexFactory/FairEconomy economic calendar · cached server-side · fail-closed',
      calendar: s
    });
  });

  /* Hard gate the existing AI route. If news is risky/unknown, do not allow BUY/SELL promotion. */
  app.use('/api/pre-market/ai', async (req, res, next) => {
    try {
      const s = await snapshot();
      if (!s.verified) return json(res, 200, { success:true, ai:true, newsVerified:false, decision:'WAIT', verdict:'WAIT — NEWS UNKNOWN', confidence:0, agreement:'BLOCKED', newsRisk:s, reason:s.reason });
      if (s.state === 'BLOCK') return json(res, 200, { success:true, ai:true, newsVerified:true, decision:'WAIT', verdict:'WAIT — NEWS RISK', confidence:0, agreement:'BLOCKED', newsRisk:s, reason:s.reason });
      if (s.state === 'CAUTION') {
        req.vtradeNewsRisk = s;
        return next();
      }
      req.vtradeNewsRisk = s;
      return next();
    } catch (e) {
      return json(res, 200, { success:true, ai:true, newsVerified:false, decision:'WAIT', verdict:'WAIT — NEWS UNKNOWN', confidence:0, agreement:'BLOCKED', reason:'News verification failed; fail-closed.' });
    }
  });

  console.log('[V-TRADE NEWS V1] economic calendar + fail-closed news gate active | source=ForexFactory | tz=Asia/Phnom_Penh');
};
