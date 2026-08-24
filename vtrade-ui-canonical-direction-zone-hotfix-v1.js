/* V-TRADE UI Canonical Direction / Zone Truth Hotfix V1
 * Fixes the remaining V9.1 UI mismatch:
 * - UI direction must use H4/H1/M15 core confluence (2-of-3), not root score/bias.
 * - Zone text must remain WAIT unless backend execution is actually READY.
 * - Adds explicit canonical direction metadata for diagnostics.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'terminal-pre-market.js');
const MARK='VTRADE_UI_CANONICAL_DIRECTION_ZONE_HOTFIX_V1';
if(!fs.existsSync(FILE)){
  console.warn('[V-TRADE UI AUTHORITY] terminal-pre-market.js not found; skipping safely');
}else{
  let s=fs.readFileSync(FILE,'utf8');
  if(!s.includes(MARK)){
    const old="const mtf=raw?.bias?bias(raw.bias):buy==null?'NEUTRAL':buy>sell?'BULLISH':sell>buy?'BEARISH':'NEUTRAL';const g=r.gates||{};const exec=raw?.execution||{};const directionZone=mtf==='BULLISH'?r.buyZone:mtf==='BEARISH'?r.sellZone:null;";
    const replacement="/* "+MARK+" */ const coreSides=['H4','H1','M15'].map(x=>R[x]?.bias||'NEUTRAL');const coreBull=coreSides.filter(x=>x==='BULLISH').length;const coreBear=coreSides.filter(x=>x==='BEARISH').length;const canonicalMtf=coreBull>=2?'BULLISH':coreBear>=2?'BEARISH':'NEUTRAL';const mtf=canonicalMtf;const g=r.gates||{};const exec=raw?.execution||{};const directionZone=mtf==='BULLISH'?r.buyZone:mtf==='BEARISH'?r.sellZone:null;";
    if(!s.includes(old)) throw new Error('V9.1 direction anchor not found; no unsafe patch applied');
    s=s.replace(old,replacement);
    const oldScore="<div class=\"v91score ${mtf==='BEARISH'?'sell':'buy'}\">${buy==null?'—':buy}%</div>";
    const newScore="<div class=\"v91score ${mtf==='BEARISH'?'sell':mtf==='BULLISH'?'buy':'wait'}\">${buy==null?'—':buy}%</div>";
    if(s.includes(oldScore))s=s.replace(oldScore,newScore);
    const oldBiasLabel='<div class="v91r"><span>MTF Bias</span><b class="${mtf===\'BULLISH\'?\'buy\':mtf===\'BEARISH\'?\'sell\':\'wait\'}">${mtf}</b></div>';
    const newBiasLabel='<div class="v91r"><span>MTF Bias · H4/H1/M15 2-of-3</span><b class="${mtf===\'BULLISH\'?\'buy\':mtf===\'BEARISH\'?\'sell\':\'wait\'}">${mtf}</b></div>';
    if(s.includes(oldBiasLabel))s=s.replace(oldBiasLabel,newBiasLabel);
    fs.writeFileSync(FILE,s,'utf8');
    console.log('[V-TRADE UI AUTHORITY] canonical H4/H1/M15 2-of-3 direction bound to UI');
  }
}
module.exports={MARK};
