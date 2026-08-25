'use strict';
const fs=require('fs');
const path=require('path');
const FILE=path.join(__dirname,'server.js');
const MARK='VTRADE_CRT_AUTHORITY_V2';

function inject(){
  if(!fs.existsSync(FILE))return;
  let s=fs.readFileSync(FILE,'utf8');
  if(s.includes(MARK))return;
  const anchor='const app = express();';
  if(!s.includes(anchor))throw new Error('server app marker not found');
  const code=`
// ${MARK}
(function(){
  const __crtOriginalBuild=buildXauAnalysis;
  function __crtBars(node){
    if(Array.isArray(node)) return node;
    if(Array.isArray(node?.candles)) return node.candles;
    if(Array.isArray(node?.bars)) return node.bars;
    if(Array.isArray(node?.M5)) return node.M5;
    if(node && typeof node==='object'){
      for(const k of ['M5','m5','history','data','series']){
        if(Array.isArray(node[k])) return node[k];
        if(node[k] && Array.isArray(node[k].candles)) return node[k].candles;
        if(node[k] && Array.isArray(node[k].bars)) return node[k].bars;
      }
    }
    return [];
  }
  function __crtFor(base){
    const root=base?.chartCandles||base?.candles||base?.timeframes||{};
    const raw=__crtBars(root?.M5??root?.m5??root).map(x=>({
      o:Number(x?.o??x?.open),h:Number(x?.h??x?.high),l:Number(x?.l??x?.low),c:Number(x?.c??x?.close),t:Number(x?.t??x?.time??x?.timestamp??x?.timeMs)
    })).filter(x=>[x.o,x.h,x.l,x.c].every(Number.isFinite));
    if(raw.length<14)return{ready:false,range:false,expansion:false,confirm:false,bias:'NEUTRAL',reason:'Insufficient closed M5 candles for CRT'};
    const last=raw.at(-1),prior=raw.slice(-13,-1);
    const hi=Math.max(...prior.map(x=>x.h)),lo=Math.min(...prior.map(x=>x.l)),mid=(hi+lo)/2;
    const avgBody=prior.reduce((sum,x)=>sum+Math.abs(x.c-x.o),0)/prior.length;
    const body=Math.abs(last.c-last.o);
    const bull=last.c>mid&&last.c>last.o;
    const bear=last.c<mid&&last.c<last.o;
    const expansion=body>=avgBody*1.15;
    const confirm=(bull||bear)&&expansion;
    const side=bull?'BULLISH':bear?'BEARISH':'NEUTRAL';
    const baseSide=String(base?.bias||'').toUpperCase();
    const aligned=confirm&&((baseSide==='BULLISH'&&side==='BULLISH')||(baseSide==='BEARISH'&&side==='BEARISH'));
    return{ready:true,range:true,expansion,confirm:aligned,bias:side,equilibrium:Number(mid.toFixed(2)),rangeHigh:Number(hi.toFixed(2)),rangeLow:Number(lo.toFixed(2)),body:Number(body.toFixed(2)),avgBody:Number(avgBody.toFixed(2)),reason:aligned?'CRT range + expansion aligned with MTF bias':'CRT waiting for aligned range expansion'};
  }
  buildXauAnalysis=async function(){
    const base=await __crtOriginalBuild();
    const crt=__crtFor(base);
    const out={...base,crt,confirmations:{...(base.confirmations||{}),crtRange:crt.range===true,crtExpansion:crt.expansion===true,crtConfirm:crt.confirm===true}};
    if(out.signal==='BUY'||out.signal==='SELL'){
      if(crt.confirm!==true){
        out.signal='WAIT';
        out.phase='MIDWAY';
        out.actionable='NO TRADE';
        out.entry=null;
        out.stopLoss=null;
        out.takeProfit=[];
        out.executionPrice=null;
        out.status='WAIT — CRT CONFIRMATION PENDING';
        out.trigger=(out.trigger?out.trigger+'; ':'')+crt.reason;
        out.decision={...(out.decision||{}),state:'WAIT',passed:false,reason:crt.reason};
        out.workflow={...(out.workflow||{}),entryAuthorization:false,executionBlocked:true};
      }
    }
    return out;
  };
  console.log('[V-TRADE CRT] Authority CRT V2 active | closed M5 candles | helper scope fixed | fail-closed');
})();
`;
  s=s.replace(anchor,anchor+code);
  fs.writeFileSync(FILE,s,'utf8');
}
inject();
module.exports={MARK};
