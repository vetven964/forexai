/* V-TRADE AI — Telegram Bot Service V4.1
 * PROCESS SEPARATION CONTRACT:
 * - Telegram owns Telegram commands/alerts only.
 * - Telegram reads broker-native MT5 market data only.
 * - Telegram may READ the shared Friday/Sunday/Monday transition contract.
 * - Telegram MUST NOT patch or own CORE Pre-Market state.
 */
'use strict';

process.env.VTRADE_TELEGRAM_CHILD='1';
console.log('[V-TRADE TELEGRAM AI] V4.1 ENTRY | Telegram=ONLY | FridayMonday=READ_ONLY | PreMarket=NOT_LOADED');
require('./telegram-canonical-authority-bridge-v1.js');
require('./telegram-format-hotfix-v6.js');
require('./telegram-bot-ai-service.js');
