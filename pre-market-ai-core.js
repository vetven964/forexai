/* V-TRADE AI — Pre-Market AI Core CONTRACT V1
 * OWNERSHIP: PRE-MARKET AI ONLY
 *
 * This file is the explicit boundary for the Pre-Market engine.
 * It must not import Telegram services or Telegram credentials.
 * It must not own Friday/Monday transition state.
 * It must not send Telegram messages.
 *
 * CORE pipeline:
 * MT5 -> M5/M15/H1/H4/D1 -> Liquidity -> MSS/BOS -> FVG/OB
 * -> Premium/Discount -> Execution Zone -> AI decision.
 */
'use strict';

const OWNER='PRE_MARKET_AI';
const PIPELINE=['MT5','M5','M15','H1','H4','D1','LIQUIDITY','MSS_BOS','FVG_OB','PREMIUM_DISCOUNT','EXECUTION_ZONE','AI'];

function assertOwnership(){
  if(process.env.TELEGRAM_TOKEN||process.env.TELEGRAM_CHAT_ID||process.env.TELEGRAM_AUTO_TOKEN||process.env.TELEGRAM_AUTO_CHAT_ID){
    console.warn('[V-TRADE PRE-MARKET CORE] Telegram credentials detected in environment; credentials are not consumed by this module');
  }
  return {owner:OWNER,telegram:false,telegramSend:false,fridayMondayTransition:false,pipeline:PIPELINE.slice()};
}

module.exports={OWNER,PIPELINE,assertOwnership};
console.log('[V-TRADE PRE-MARKET CORE] isolated file active | Telegram=NOT_LOADED | FridayMonday=NOT_OWNED');
