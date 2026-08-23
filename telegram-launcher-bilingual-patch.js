'use strict';
// Patches the production launcher WAIT renderer so its final runtime output
// remains bilingual even after server-launcher replaces telegramWaitText().
const fs=require('fs');
const path=require('path');
const FILE=path.resolve(__dirname,'server-launcher.js');
const MARK='VTRADE_LAUNCHER_BILINGUAL_WAIT_V1';
try{
  if(fs.existsSync(FILE)){
    let s=fs.readFileSync(FILE,'utf8');
    if(!s.includes(MARK)){
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
      s=s.replace(/\/\* VTRADE_LAUNCHER_BILINGUAL_WAIT_V1 \*\//g,'');
      s='// '+MARK+'\n'+s;
      fs.writeFileSync(FILE,s,'utf8');
      console.log('[V-TRADE TELEGRAM] launcher bilingual WAIT renderer patch active');
    }
  }
}catch(e){console.warn('[V-TRADE TELEGRAM] launcher bilingual patch skipped:',e.message);}
