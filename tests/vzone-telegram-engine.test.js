'use strict';
const assert=require('node:assert/strict');
const {TIERS,scoreSnapshot,formatTelegram}=require('../vzone-telegram-engine');
assert.deepEqual(TIERS,[10,15,25,35,45,55,65,75,85,95,100]);
function bar(t,o,h,l,c){return {t,o,h,l,c};}
function makeSnapshot(){
 const make=(n,base)=>Array.from({length:n},(_,i)=>bar(i,base+i*0.1,base+i*0.1+1,base+i*0.1-1,base+i*0.1+0.5));
 return {connected:true,price:101,timeframes:{M5:{bars:make(25,100)},M15:{bars:make(25,100)},H1:{bars:make(25,100)},H4:{bars:make(25,100)}}};
}
const a=scoreSnapshot(makeSnapshot());
assert.ok(['BuyBullish','SellBearish','WAIT'].includes(a.signal));
assert.ok(TIERS.includes(Math.abs(a.score))||a.score===0);
assert.equal(a.realtime,true);
assert.equal(a.authorized,false,'synthetic data must not auto-authorize a trade');
const text=formatTelegram(a);
assert.match(text,/V-Zone AI/);
assert.match(text,/Entry/);
assert.match(text,/TP1/);
assert.match(text,/TP2/);
assert.match(text,/TP3/);
assert.match(text,/SL/);
assert.match(text,/NO ORDER AUTHORIZED/);
console.log('V-Zone Telegram engine tests: PASS');
