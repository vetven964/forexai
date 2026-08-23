/** V-TRADE AI — Broker Execution Replay / Stale Result Guard #121 */
'use strict';
const crypto=require('crypto');
function s(v){return String(v??'').trim();}
function stable(v){
  if(v===null||v===undefined) return null;
  if(Array.isArray(v)) return v.map(stable);
  if(typeof v==='object') return Object.keys(v).sort().reduce((o,k)=>{o[k]=stable(v[k]);return o;},{});
  return v;
}
function fingerprint(v){return crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');}
class ExecutionReplayGuard{
  constructor({ttlMs=120000,maxEntries=5000}={}){this.ttlMs=Math.max(1000,Number(ttlMs)||120000);this.maxEntries=Math.max(100,Number(maxEntries)||5000);this.entries=new Map();}
  _purge(now){for(const [k,v] of this.entries)if(now-v.at>this.ttlMs)this.entries.delete(k);while(this.entries.size>this.maxEntries)this.entries.delete(this.entries.keys().next().value);}
  assess({response,command,now=Date.now(),maxAgeMs=30000}={}){
    const r=response||{}, c=command||{}, status=s(r.status||r.state||r.result).toUpperCase();
    const executionId=s(r.executionId||r.dealId||r.execution_id);
    if(!['FILLED','PARTIAL'].includes(status)) return Object.freeze({state:'NOT_APPLICABLE',ready:true,replay:false});
    if(!executionId) return Object.freeze({state:'EXECUTION_ID_REQUIRED',ready:false,replay:false,reason:'Broker executionId/dealId is required for filled/partial results'});
    const timestamp=r.timestamp==null?null:Number(r.timestamp);
    if(timestamp!==null && (!Number.isFinite(timestamp)||timestamp>now||now-timestamp>maxAgeMs)) return Object.freeze({state:'STALE_EXECUTION_RESULT',ready:false,replay:false,executionId,reason:'Broker execution result is stale or timestamp is invalid'});
    const fp=fingerprint({commandId:c.commandId||c.id,status,executionId,orderId:r.orderId||r.ticket||null,positionId:r.positionId||null,filledVolume:r.filledVolume??r.executedVolume??r.volume??null,executionPrice:r.executionPrice??r.price??null,symbol:r.symbol||null,side:r.side||null});
    this._purge(now);
    const old=this.entries.get(executionId);
    if(old){
      if(old.fingerprint===fp) return Object.freeze({state:'REPLAY_DUPLICATE',ready:false,replay:true,duplicate:true,executionId,reason:'Execution result already processed'});
      return Object.freeze({state:'EXECUTION_ID_REUSE_CONFLICT',ready:false,replay:true,duplicate:false,executionId,reason:'Execution ID was previously bound to different broker evidence'});
    }
    this.entries.set(executionId,{fingerprint:fp,commandId:s(c.commandId||c.id),at:now});
    return Object.freeze({state:'NEW_EXECUTION',ready:true,replay:false,executionId});
  }
}
module.exports={ExecutionReplayGuard,fingerprint};
