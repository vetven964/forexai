#property strict

// V-TRADE AI — MT5 Auto Lot helper
// Calculates volume from account equity, risk %, and validated SL distance.
// The caller must enforce its own max-lot and execution guards.

double VTradeNormalizeVolume(const string symbol,double volume,double maxLot)
{
   double minV=SymbolInfoDouble(symbol,SYMBOL_VOLUME_MIN);
   double maxV=SymbolInfoDouble(symbol,SYMBOL_VOLUME_MAX);
   double step=SymbolInfoDouble(symbol,SYMBOL_VOLUME_STEP);
   if(minV<=0 || maxV<=0) return 0.0;
   double cap=maxV;
   if(maxLot>0) cap=MathMin(cap,maxLot);
   volume=MathMax(minV,MathMin(cap,volume));
   if(step>0) volume=MathFloor(volume/step+1e-9)*step;
   return NormalizeDouble(volume,2);
}

double VTradeAutoLotByRisk(const string symbol,double riskPercent,double entryPrice,double stopLoss,double maxLot)
{
   if(riskPercent<=0 || entryPrice<=0 || stopLoss<=0) return 0.0;
   double equity=AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity<=0) equity=AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney=equity*(riskPercent/100.0);
   if(riskMoney<=0) return 0.0;

   double tickSize=SymbolInfoDouble(symbol,SYMBOL_TRADE_TICK_SIZE);
   double tickValue=SymbolInfoDouble(symbol,SYMBOL_TRADE_TICK_VALUE_LOSS);
   if(tickValue<=0) tickValue=SymbolInfoDouble(symbol,SYMBOL_TRADE_TICK_VALUE);
   if(tickSize<=0 || tickValue<=0) return 0.0;

   double priceRisk=MathAbs(entryPrice-stopLoss);
   double moneyPerLot=(priceRisk/tickSize)*tickValue;
   if(moneyPerLot<=0 || !MathIsValidNumber(moneyPerLot)) return 0.0;

   double raw=riskMoney/moneyPerLot;
   return VTradeNormalizeVolume(symbol,raw,maxLot);
}
