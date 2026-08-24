'use strict';

const assert = require('assert');
const { telegramWaitText } = require('./telegram-final-format-hotfix');

function lines(text) {
  return text.split('\n');
}

// WAIT/Bias must stay compact and must never manufacture an order.
const wait = telegramWaitText({
  signal: 'WAIT',
  bias: 'BULLISH',
  directionScore: 74,
  confidence: 17,
  price: 4635.83,
  mtfReady: true,
  gates: {
    mss: false,
    liquiditySweep: false,
    fvg: false,
    orderBlock: false
  }
});
const waitLines = lines(wait);
assert(wait.includes('🟡 WAIT — BUY BIAS'));
assert(wait.includes('⏱️ TF: M5'));
assert(wait.includes('🎯 Entry: '));
assert(wait.includes('🛑 SL: '));
assert(wait.includes('🎯 TP1: '));
assert(!wait.includes('BUY — AUTHORIZED'));
assert(!wait.includes('SELL — AUTHORIZED'));
assert(waitLines.length <= 12);

// Authorized BUY must expose the compact execution fields only.
const buy = telegramWaitText({
  signal: 'BUY',
  bias: 'BULLISH',
  directionScore: 88,
  confidence: 76,
  price: 4635.83,
  tradeAuthorized: true,
  mtfReady: true,
  mtf: {
    timeframes: {
      M5: { bars: 100 },
      M15: { bars: 100 },
      H1: { bars: 100 },
      H4: { bars: 100 }
    }
  },
  gates: {
    mss: true,
    liquiditySweep: true,
    fvg: true,
    orderBlock: false
  },
  entryZone: { low: 4634.10, high: 4635.20 },
  entry: 4635.10,
  stopLoss: 4631.90,
  tp1: 4639.50,
  tp2: 4643.00,
  tp3: 4648.00
});
assert(buy.includes('🟢 BUY — AUTHORIZED'));
assert(buy.includes('⏱️ TF: M5 / M15 / H1 / H4'));
assert(buy.includes('📍 Zone: 4634.10–4635.20'));
assert(buy.includes('🎯 Entry: 4635.10'));
assert(buy.includes('🛑 SL: 4631.90'));
assert(buy.includes('🎯 TP1: 4639.50'));
assert(buy.includes('🎯 TP2: 4643.00'));
assert(buy.includes('🎯 TP3: 4648.00'));
assert(!buy.includes('ICT ENTRY GATES'));
assert(!buy.includes('No order until'));

console.log('PASS: Telegram compact WAIT/Bias + authorized BUY renderer');
