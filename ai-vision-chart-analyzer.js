'use strict';

const crypto = require('crypto');

const MAX_DATA_URL_CHARS = Math.max(250_000, Number(process.env.AI_VISION_MAX_DATA_URL_CHARS || 8_000_000));
const TIMEOUT_MS = Math.max(5_000, Number(process.env.AI_VISION_TIMEOUT_MS || 45_000));
const MODEL = String(process.env.AI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-5.6-luna').trim();
const ENABLED = String(process.env.AI_VISION_ENABLED || 'true').toLowerCase() === 'true';
const ALLOWED_MIME = new Set(['image/png','image/jpeg','image/webp']);
const requestHits = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = Math.max(1, Number(process.env.AI_VISION_RATE_LIMIT || 6));

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    imageQuality: {type:'string', enum:['GOOD','LIMITED','INVALID']},
    symbol: {type:'string'}, timeframe: {type:'string'}, price: {type:['number','null']},
    trend: {type:'string', enum:['BULLISH','BEARISH','RANGE','UNKNOWN']},
    bias: {type:'string', enum:['BULLISH','BEARISH','NEUTRAL']},
    signal: {type:'string', enum:['BUY','SELL','WAIT']},
    confidence: {type:'integer', minimum:0, maximum:100},
    reason: {type:'string'},
    liquiditySweep: {type:'string', enum:['BULLISH','BEARISH','NONE','UNCLEAR']},
    mssBos: {type:'string', enum:['BULLISH','BEARISH','NONE','UNCLEAR']},
    fvg: {type:'string', enum:['BULLISH','BEARISH','NONE','UNCLEAR']},
    orderBlock: {type:'string', enum:['BULLISH','BEARISH','NONE','UNCLEAR']},
    premiumDiscount: {type:'string', enum:['PREMIUM','DISCOUNT','EQUILIBRIUM','UNKNOWN']},
    entryLow: {type:['number','null']}, entryHigh: {type:['number','null']},
    stopLoss: {type:['number','null']},
    tp1: {type:['number','null']}, tp2: {type:['number','null']}, tp3: {type:['number','null']},
    setupQuality: {type:'string', enum:['A','B','C','WAIT','INVALID']},
    confirmations: {type:'array', items:{type:'string'}, maxItems:10},
    blockers: {type:'array', items:{type:'string'}, maxItems:10},
    disclaimer: {type:'string'}
  },
  required:['imageQuality','symbol','timeframe','price','trend','bias','signal','confidence','reason','liquiditySweep','mssBos','fvg','orderBlock','premiumDiscount','entryLow','entryHigh','stopLoss','tp1','tp2','tp3','setupQuality','confirmations','blockers','disclaimer']
};

function safeEqual(a,b){const aa=Buffer.from(String(a||''));const bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function clientKey(req){return String(req.ip||req.headers['x-forwarded-for']||'unknown').split(',')[0].trim().slice(0,100)}
function rateOk(req){const now=Date.now(),key=clientKey(req),old=requestHits.get(key)||[];const fresh=old.filter(t=>now-t<WINDOW_MS);if(fresh.length>=MAX_REQUESTS_PER_WINDOW){requestHits.set(key,fresh);return false}fresh.push(now);requestHits.set(key,fresh);return true}
function validateDataUrl(dataUrl){
  const value=String(dataUrl||'').trim();
  if(value.length<100||value.length>MAX_DATA_URL_CHARS)return {ok:false,error:'Image payload is missing or too large'};
  const m=value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if(!m||!ALLOWED_MIME.has(m[1].toLowerCase()))return {ok:false,error:'Only PNG, JPEG and WebP chart images are supported'};
  const bytes=Math.floor((m[2].length*3)/4);
  if(bytes>6*1024*1024)return {ok:false,error:'Chart image must be 6 MB or smaller'};
  return {ok:true,mime:m[1].toLowerCase(),dataUrl:value,bytes};
}
function extractText(body){
  if(typeof body?.output_text==='string'&&body.output_text.trim())return body.output_text.trim();
  const out=Array.isArray(body?.output)?body.output:[];
  for(const item of out){for(const c of (Array.isArray(item?.content)?item.content:[])){if(typeof c?.text==='string'&&c.text.trim())return c.text.trim();}}
  return '';
}
function parseJson(text){
  const clean=String(text||'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/\s*```$/,'');
  try{return JSON.parse(clean)}catch(_){const a=clean.indexOf('{'),b=clean.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(clean.slice(a,b+1))}catch(__){}}}
  return null;
}
function normalizeResult(r){
  const out={...r};
  out.confidence=Math.max(0,Math.min(100,Number(out.confidence)||0));
  if(out.imageQuality!=='GOOD'){out.signal='WAIT';out.setupQuality=out.imageQuality==='INVALID'?'INVALID':'WAIT';out.confidence=Math.min(out.confidence,35)}
  if(out.signal!=='BUY'&&out.signal!=='SELL')out.signal='WAIT';
  if(out.signal==='BUY'&&out.bias!=='BULLISH')out.signal='WAIT';
  if(out.signal==='SELL'&&out.bias!=='BEARISH')out.signal='WAIT';
  if(out.signal==='WAIT'){out.entryLow=null;out.entryHigh=null;out.stopLoss=null;out.tp1=null;out.tp2=null;out.tp3=null}
  out.confirmations=Array.isArray(out.confirmations)?out.confirmations.map(String).slice(0,10):[];
  out.blockers=Array.isArray(out.blockers)?out.blockers.map(String).slice(0,10):[];
  return out;
}
async function callOpenAI(dataUrl){
  const key=String(process.env.OPENAI_API_KEY||'').trim();
  if(!key)return {enabled:false,configured:false,status:'not_configured',error:'OPENAI_API_KEY is not configured'};
  if(!ENABLED)return {enabled:false,configured:true,status:'disabled'};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const prompt=`You are the V-TRADE AI Vision Chart Analyzer. Analyze ONLY the supplied chart screenshot. Do not invent candles, prices, timeframes, indicators, liquidity or market data that are not visible. This is screenshot analysis, not live MT5 data.\n\nReturn the required JSON schema. Use ICT concepts carefully: liquidity sweep, MSS/BOS, FVG, order block, premium/discount. A screenshot alone is never enough to claim certainty. If the image is cropped, blurry, missing candles/price scale, or the setup is not confirmed, use WAIT and explain blockers. BUY requires visible bullish structure plus a credible entry area; SELL requires visible bearish structure plus a credible entry area. Never fabricate SL/TP.\n\nThe result is decision support, not guaranteed financial advice.`;
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},signal:controller.signal,body:JSON.stringify({model:MODEL,input:[{role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:dataUrl,detail:'high'}]}],text:{format:{type:'json_schema',name:'vtrade_chart_analysis',strict:true,schema}}})});
    const text=await response.text();let body={};try{body=JSON.parse(text)}catch(_){body={error:{message:text.slice(0,500)}}}
    if(!response.ok)throw new Error(body?.error?.message||`OpenAI HTTP ${response.status}`);
    const parsed=parseJson(extractText(body));
    if(!parsed)throw new Error('AI returned invalid structured output');
    return {enabled:true,configured:true,status:'ok',model:MODEL,result:normalizeResult(parsed)};
  }catch(e){return {enabled:true,configured:true,status:e?.name==='AbortError'?'timeout':'error',model:MODEL,error:String(e?.message||e)}}finally{clearTimeout(timer)}
}

function install(app, requireAuth){
  if(!app||typeof app.post!=='function')throw new Error('Express app is required');
  if(app.__vtradeVisionAnalyzerInstalled)return;
  app.__vtradeVisionAnalyzerInstalled=true;
  app.get('/api/v5/ai/vision/health',requireAuth,(req,res)=>res.json({success:true,enabled:ENABLED,configured:!!process.env.OPENAI_API_KEY,model:MODEL,maxImageBytes:6*1024*1024}));
  app.post('/api/v5/ai/vision/chart',requireAuth,async(req,res)=>{
    if(!rateOk(req))return res.status(429).json({success:false,error:'Too many chart analyses. Please wait a minute.'});
    const checked=validateDataUrl(req.body?.imageDataUrl);
    if(!checked.ok)return res.status(400).json({success:false,error:checked.error});
    const result=await callOpenAI(checked.dataUrl);
    if(result.status!=='ok')return res.status(result.status==='not_configured'||result.status==='disabled'?503:502).json({success:false,error:result.error||'AI Vision analysis unavailable',ai:result});
    const r=result.result;
    console.log(`[V-TRADE AI VISION] ${r.symbol||'UNKNOWN'} ${r.timeframe||'UNKNOWN'} | signal=${r.signal} | bias=${r.bias} | confidence=${r.confidence}`);
    res.set('Cache-Control','no-store');
    res.json({success:true,source:'AI Vision Screenshot',analysis:r,ai:{model:result.model,status:result.status}});
  });
  console.log('[V-TRADE AI VISION] Screenshot analyzer route installed');
}
module.exports={install};
