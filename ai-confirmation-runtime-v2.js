// V-TRADE AI — Local ICT Confirmation Runtime V8
// AI is confirmation-only. Telegram formatting is owned by telegram-final-format-hotfix.js.
// The deterministic broker-native ICT engine remains authoritative.
'use strict';
const fs = require('fs');
const path = require('path');
const SERVER = path.join(__dirname, 'server.js');
const MARK = 'VTRADE_LOCAL_CONFIRM_RUNTIME_V8';

process.env.OPENAI_ENABLED = 'false';
process.env.OPENAI_MODEL = 'local-ict-v1';

function replaceOnce(source, oldText, newText) {
  if (!source.includes(oldText)) return { source, changed: false };
  return { source: source.replace(oldText, newText), changed: true };
}

// IMPORTANT: this runtime must never install or override Telegram presentation.
// A single final formatter is loaded by the launcher.
function install() {
  if (!fs.existsSync(SERVER)) {
    console.warn('[V-TRADE AI] server.js not found; environment hard-disable still active');
    return;
  }

  let s = fs.readFileSync(SERVER, 'utf8');
  let changed = false;

  let r = replaceOnce(s, "const OPENAI_ENABLED = String(process.env.OPENAI_ENABLED || 'false').toLowerCase() === 'true';", "const OPENAI_ENABLED = false;");
  s = r.source; changed ||= r.changed;
  r = replaceOnce(s, "const OPENAI_MODEL = String(process.env.OPENAI_MODEL || 'gpt-5.6-luna').trim();", "const OPENAI_MODEL = 'local-ict-v1';");
  s = r.source; changed ||= r.changed;

  const enabledPattern = /const OPENAI_ENABLED\s*=\s*[^;]+;/;
  if (enabledPattern.test(s)) {
    const next = s.replace(enabledPattern, 'const OPENAI_ENABLED = false;');
    changed ||= next !== s; s = next;
  }
  const modelPattern = /const OPENAI_MODEL\s*=\s*[^;]+;/;
  if (modelPattern.test(s)) {
    const next = s.replace(modelPattern, "const OPENAI_MODEL = 'local-ict-v1';");
    changed ||= next !== s; s = next;
  }

  const start = s.indexOf('async function openAIConfirmXauAnalysis(a) {');
  const end = s.indexOf('\nasync function buildXauAnalysis()', start);
  if (start >= 0 && end > start) {
    const localFn = `async function openAIConfirmXauAnalysis(a) {
  const c = a?.confirmations || {};
  const signal = ['BUY','SELL'].includes(a?.signal) ? a.signal : 'WAIT';
  const allGates = c.allGatesPassed === true;
  const evidence = [
    ['MTF alignment', c.mtfAligned === true],
    ['Liquidity sweep', c.liquiditySweep === true],
    ['MSS', c.mss === true],
    ['BOS', c.bos === true],
    ['Fresh FVG/OB', c.freshFvg === true || c.freshOb === true],
    ['Premium/Discount', c.premiumDiscountOk === true],
    ['Displacement or momentum', c.displacement?.confirmed === true || c.technicalMomentumOk === true],
    ['Trend strength', c.trendStrengthOk === true],
    ['Spread', c.spreadOk === true],
    ['Retest / execution zone', c.retest === true || c.zoneIsNear === true]
  ];
  const passed = evidence.filter(x => x[1]).map(x => x[0]);
  const missing = evidence.filter(x => !x[1]).map(x => x[0]);
  const decision = allGates && signal !== 'WAIT' ? signal : 'WAIT';
  const rawConfidence = Number(a?.confidence ?? a?.setupScore ?? 0);
  const confidence = Number.isFinite(rawConfidence) ? Math.max(0, Math.min(100, rawConfidence)) : 0;
  return {
    enabled: true,
    configured: true,
    provider: 'LOCAL_DETERMINISTIC',
    model: 'local-ict-v1',
    status: 'local',
    decision,
    confidence,
    agreement: decision !== 'WAIT' ? 'AGREE' : 'NEUTRAL',
    reasons: decision !== 'WAIT'
      ? ['Local ICT confirmation agrees with the server-authoritative execution gate.', ...passed.slice(0, 6)]
      : ['External AI confirmation is disabled.', ...missing.slice(0, 6)],
    missingConfirmations: missing,
    riskFlags: [],
    summary: decision !== 'WAIT' ? 'Local ICT confirmation passed.' : 'Local ICT confirmation is waiting for mandatory execution gates.',
    gate: {
      engineSignal: signal,
      engineConfidence: rawConfidence,
      enginePassed: allGates,
      aiEligible: allGates && decision !== 'WAIT',
      finalSignal: decision
    },
    localEvidence: { passed, missing }
  };
}
`;
    s = s.slice(0, start) + localFn + s.slice(end);
    changed = true;
  }

  // Remove legacy runtime-injected Telegram formatter if an older deployment
  // left it embedded in server.js. The production formatter is the only owner.
  const markerNames = [
    'VTRADE_TELEGRAM_FINAL_FORMAT_V5',
    'function telegramTierText(a) {'
  ];
  if (s.includes(markerNames[0])) {
    const markerStart = s.indexOf('// VTRADE_TELEGRAM_FINAL_FORMAT_V5');
    const fnStart = markerStart >= 0 ? s.indexOf('function telegramTierText(a) {', markerStart) : -1;
    const fnEnd = fnStart >= 0 ? s.indexOf('\nfunction ', fnStart + 10) : -1;
    if (fnStart >= 0 && fnEnd > fnStart) {
      s = s.slice(0, markerStart >= 0 ? markerStart : fnStart) + s.slice(fnEnd);
      changed = true;
    }
  }

  if (!s.includes(MARK)) {
    s = '// ' + MARK + ' installed by runtime hotfix\n' + s;
    changed = true;
  }

  if (changed) fs.writeFileSync(SERVER, s, 'utf8');
  console.log('[V-TRADE AI] Local ICT Confirmation V8 active | OPENAI_ENABLED=false | Telegram formatter owned by final V5');
}

try {
  install();
} catch (e) {
  console.error('[V-TRADE AI] confirmation runtime failed:', e && e.stack ? e.stack : e.message);
  process.exitCode = 1;
}
