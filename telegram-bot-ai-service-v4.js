/* V-TRADE AI — Telegram Bot Service V4
 * PROCESS SEPARATION CONTRACT:
 * - Telegram owns Telegram commands/alerts only.
 * - Telegram reads broker-native MT5 market data only.
 * - Telegram MUST NOT load Pre-Market AI, ICT execution zones, or Friday/Monday transition state.
 * - Pre-Market AI and Friday->Monday transition remain CORE-owned services.
 *
 * The independent V3 Telegram engine already implements the raw-MT5-only contract.
 * Keep this V4 filename as the canonical child entrypoint so the production launcher
 * does not need another architectural change.
 */
'use strict';

console.log('[V-TRADE TELEGRAM AI] V4 SEPARATED ENTRYPOINT | Telegram=ONLY | PreMarket=NOT_LOADED | FridayMonday=NOT_LOADED');
require('./telegram-bot-ai-service.js');
