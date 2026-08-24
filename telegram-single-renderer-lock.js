// V-TRADE TELEGRAM SINGLE RENDERER LOCK
// Prevent the legacy server-launcher Telegram formatter from emitting the old
// ADVANCED ICT SIGNAL card. Canonical Telegram V4 remains the only delivery owner.
'use strict';
const fs=require('fs');
const path=require('path');
const Module=require('module');
const TARGET=path.resolve(__dirname,'server-launcher.js');
const original=Module._extensions['.js'];
if(!original.__vtradeTelegramSingleRendererLock){
  const loader=function vtradeTelegramSingleRendererLoader(mod,filename){
    if(path.resolve(filename)!==TARGET)return original(mod,filename);
    let source=fs.readFileSync(filename,'utf8');
    const start=source.indexOf('function patchWaitCard(source) {');
    const end=source.indexOf('\nfunction patchFrontend(source)',start);
    if(start>=0&&end>start){
      source=source.slice(0,start)+'function patchWaitCard(source) { return source; }\n'+source.slice(end);
      console.log('[V-TRADE TELEGRAM] legacy ADVANCED ICT renderer disabled | canonical V4 only');
    }else{
      console.log('[V-TRADE TELEGRAM] legacy renderer anchor not found | leaving launcher safe');
    }
    mod._compile(source,filename);
  };
  loader.__vtradeTelegramSingleRendererLock=true;
  Module._extensions['.js']=loader;
}
