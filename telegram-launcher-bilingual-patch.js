'use strict';
// Patches the production launcher WAIT renderer so its final runtime output
// remains bilingual and uses truthful weekend/pre-open gate wording.
const fs=require('fs');
const path=require('path');
const FILE=path.resolve(__dirname,'server-launcher.js');
const MARK='VTRADE_LAUNCHER_BILINGUAL_WAIT_V3';
try{
  if(fs.existsSync(FILE)){
    let s=fs.readFileSync(FILE,'utf8');
    if(!s.includes(MARK)){
      // Critical ownership rule: the launcher must not replace the canonical
      // V7 renderer after telegram-final-format-hotfix.js has installed it.
      const ownerGuard="function patchWaitCard(source) {\n  if (source.includes('VTRADE_TELEGRAM_FINAL_FORMAT_V7')) return source;";
      const originalFn="function patchWaitCard(source) {";
      if(s.includes(originalFn) && !s.includes("source.includes('VTRADE_TELEGRAM_FINAL_FORMAT_V7')")){
        s=s.replace(originalFn,ownerGuard);
      }

      const replacements=[
        ["'📊 Asset: *XAU/USD (Gold)*'","'📊 Asset / ទ្រព្យ: *XAU/USD (Gold)*'"],
        ["'💰 Price: *'","'💰 Price / តម្លៃ: *'"],
        ["'⚡ Action: *'","'⚡ Action / សកម្មភាព: *'"],
        ["'📈 Bias: *'","'📈 Bias / ទិសដៅ: *'"],
        ["'📊 Direction Score: *'","'📊 Direction Score / ពិន្ទុទិសដៅ: *'"],
        ["'🧠 Confidence: *'","'🧠 Confidence / ទំនុកចិត្ត: *'"],
        ["'🎯 Entry: *'","'🎯 Entry / ចូល: *'"],
        ["'🛑 Stop Loss: *'","'🛑 Stop Loss / ខាតអតិបរមា: *'"],
        ["'🎯 TP1: *'","'🎯 TP1 / គោលដៅ 1: *'"],
        ["'🎯 TP2: *'","'🎯 TP2 / គោលដៅ 2: *'"],
        ["'🎯 TP3: *'","'🎯 TP3 / គោលដៅ 3: *'"],
        ["'🔎 *ICT ENTRY GATES*'","'🔎 *ICT ENTRY GATES / ច្រកបញ្ជាក់ ICT*'"],
        ["'🎯 Execution Zone: *'","'🎯 Execution Zone / តំបន់ប្រតិបត្តិការ: *'"],
        ["'🟢 Entry: *WAIT — gate confirmation required*'","'🟢 Entry / ចូល: *WAIT — រង់ចាំការបញ្ជាក់ Gate*'"],
        ["'🛑 Stop Loss (SL): *WAIT*'","'🛑 Stop Loss (SL) / ខាតអតិបរមា: *WAIT*'"],
        ["'⚡ Status: *WAIT — NO ORDER AUTHORIZED*'","'⚡ Status / ស្ថានភាព: *WAIT — NO ORDER AUTHORIZED*'"],
        ["'🔒 No order until all required ICT execution gates pass.'","'🔒 No order until all required ICT execution gates pass. | មិនអនុញ្ញាតបញ្ជា រហូតដល់ Gate ICT គ្រប់។'"],
        ["'🏦 Broker: *'","'🏦 Broker / ឈ្មួញជើងសារ: *'"]
      ];
      for(const [a,b] of replacements)s=s.split(a).join(b);

      // Replace the launcher gate renderer with a truthful bilingual mapper.
      const oldGate="const gateLine = blocked.length ? blocked.map(x => '• ' + x).join('\\n') : '• No confirmed entry gate';";
      const newGate="const weekendClosed = new Date().getUTCDay() === 0 || new Date().getUTCDay() === 6; const gateReason = x => { const r=String(x||''); if(/Closed-candle data is stale/i.test(r) && weekendClosed) return '• Market closed / ទីផ្សារបិទ — closed-candle history retained until fresh MT5 history at market open / រក្សាទុក candle ចាស់ រហូតដល់ MT5 បើក និងមានទិន្នន័យថ្មី'; if(/Closed-candle data is stale/i.test(r)) return '• Closed-candle data is stale / ទិន្នន័យ candle បិទចាស់ — wait for fresh MT5 history / រង់ចាំ MT5 ផ្តល់ទិន្នន័យថ្មី'; if(/Fresh liquidity sweep not confirmed/i.test(r)) return '• Fresh liquidity sweep not confirmed / មិនទាន់បញ្ជាក់ Liquidity Sweep ថ្មី'; if(/Fresh M5 MSS not confirmed/i.test(r)) return '• Fresh M5 MSS not confirmed / មិនទាន់បញ្ជាក់ MSS ថ្មីលើ M5'; if(/Directional displacement not confirmed/i.test(r)) return '• Directional displacement not confirmed / មិនទាន់បញ្ជាក់ Directional Displacement'; if(/No fresh aligned FVG\\/OB/i.test(r)) return '• No fresh aligned FVG/OB / មិនទាន់មាន FVG/OB ថ្មីដែលស្របទិស'; if(/Price is outside the execution zone/i.test(r)) return '• Price is outside the execution zone / តម្លៃនៅក្រៅតំបន់ប្រតិបត្តិការ'; if(/Fresh M5 MSS\\/BOS structure break not confirmed/i.test(r)) return '• Fresh M5 MSS/BOS structure break not confirmed / មិនទាន់បញ្ជាក់ Structure Break M5 MSS/BOS ថ្មី'; if(/Momentum\\/displacement does not confirm/i.test(r)) return '• Momentum/displacement does not confirm the execution direction / Momentum/Displacement មិនទាន់បញ្ជាក់ទិសប្រតិបត្តិការ'; return '• '+r+' / មិនទាន់បានបញ្ជាក់'; }; const gateLine = blocked.length ? blocked.map(gateReason).join('\\n') : '• No confirmed entry gate / មិនទាន់មាន Gate បញ្ជាក់';";
      if(s.includes(oldGate))s=s.replace(oldGate,newGate);

      s='// '+MARK+'\n'+s;
      fs.writeFileSync(FILE,s,'utf8');
      console.log('[V-TRADE TELEGRAM] launcher bilingual WAIT renderer V3 active | final V7 ownership preserved');
    } else {
      console.log('[V-TRADE TELEGRAM] launcher bilingual WAIT renderer V3 already active');
    }
  }
}catch(e){console.warn('[V-TRADE TELEGRAM] launcher bilingual patch skipped:',e.message);}
