'use strict';
const fs=require('fs');
const path=require('path');
const AI=path.resolve(__dirname,'ai-confirmation-runtime-v2.js');
const MARK='VTRADE_FINAL_RUNTIME_HOOK_V1';
try{
 if(fs.existsSync(AI)){
  let s=fs.readFileSync(AI,'utf8');
  if(!s.includes(MARK)){
   const needle='install();';
   const i=s.lastIndexOf(needle);
   if(i>=0){
    s=s.slice(0,i)+needle+'\n// '+MARK+'\ntry { require(\'./telegram-final-apply.js\'); } catch (e) { console.warn(\'[V-TRADE TELEGRAM] final apply hook skipped:\',e.message); }'+s.slice(i+needle.length);
    fs.writeFileSync(AI,s,'utf8');
    console.log('[V-TRADE TELEGRAM] final formatter runtime hook installed');
   }
  }
 }
}catch(e){console.warn('[V-TRADE TELEGRAM] final runtime hook skipped safely:',e.message);}
