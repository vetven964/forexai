// V-Zone AI — canonical MT5 authority bridge for the new UI.
// Keeps the UI fail-closed while removing the protected legacy analysis dependency.
'use strict';
(() => {
  const nativeFetch = window.fetch.bind(window);
  const API = 'https://forexai-6xw6.onrender.com';
  const targetPath = '/api/analysis/xauusd';

  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

  const adapt = (raw) => {
    const d = raw || {};
    const frames = { ...(d.timeframes || {}) };
    Object.keys(frames).forEach((tf) => {
      const f = frames[tf] || {};
      const direction = String(f.direction || f.trend || 'NEUTRAL').toUpperCase();
      frames[tf] = {
        ...f,
        trend: direction,
        structure: { ...(f.structure || {}), bias: direction },
        score: Number.isFinite(Number(f.score)) ? Number(f.score) : 0
      };
    });

    const gates = d.gates || d.confirmations || {};
    const authorized = gates.allGatesPassed === true && d.execution?.status === 'ENTRY_READY';
    const side = authorized
      ? (String(d.execution?.side || '').toUpperCase() === 'SELL' ? 'SELL' : 'BUY')
      : 'WAIT';

    const zone = d.execution?.zone || null;
    const entry = d.execution?.inZone && Array.isArray(zone)
      ? Number((zone[0] + zone[1]) / 2)
      : null;

    return {
      ...d,
      success: d.success !== false,
      signal: side,
      bias: String(d.bias || 'NEUTRAL').toUpperCase(),
      directionScore: Number(d.directionScore || 0),
      score: Number(d.directionScore || 0),
      entry,
      stopLoss: null,
      takeProfit: [],
      executionTimeframe: 'M15',
      confirmations: gates,
      timeframes: frames,
      opportunities: Object.fromEntries(Object.entries(frames).map(([tf, f]) => [tf, {
        score: Number(f.score || 0),
        direction: f.direction || f.trend || 'NEUTRAL'
      }])),
      decision: { reason: d.execution?.reason || d.workflow?.stage || 'Waiting for canonical ICT gates' },
      status: d.execution?.status || 'WAIT',
      authorized,
      uiSource: 'MT5_AUTHORITATIVE_V4'
    };
  };

  window.fetch = async (input, init) => {
    let url = '';
    try { url = new URL(typeof input === 'string' ? input : input.url, location.href).toString(); } catch (_) {}
    if (!url || !url.startsWith(API + targetPath)) return nativeFetch(input, init);

    try {
      const r = await nativeFetch(API + '/api/pre-market/mt5-authoritative', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'X-V-Zone-UI': 'canonical-authority-v1' }
      });
      const raw = await r.json().catch(() => ({}));
      return jsonResponse(adapt(raw), r.ok ? 200 : r.status);
    } catch (error) {
      return jsonResponse({
        success: false,
        signal: 'WAIT',
        bias: 'NEUTRAL',
        directionScore: 0,
        authorized: false,
        error: String(error?.message || 'Canonical MT5 authority unavailable'),
        uiSource: 'MT5_AUTHORITATIVE_V4'
      }, 503);
    }
  };
})();
