# V-TRADE AI — Sunday → Monday Market Transition

- Sunday pre-open is analysis-only.
- Friday closed candles remain historical reference data.
- No entry, SL, TP, or order authorization is allowed during Sunday pre-open.
- Monday execution requires a broker-native MT5 M5 candle whose local date is Monday and whose timestamp is no more than 10 minutes old.
- Once fresh Monday M5 data exists, M5/M15/H1/H4 ICT gates are revalidated from the live MT5 feed.
- Only the canonical authority route may authorize an order.
