'use strict';
const express=require('express');
const router=express.Router();
router.get('/v-zone-ai/health',(req,res)=>res.json({ok:true,app:'V-ZONE AI',web:true,signalOwner:'TELEGRAM',mt5:'READY_CHECK_REQUIRED',candlePolicy:'CLOSED_REAL_OHLC_ONLY',version:'V-ZONE-WEB-1.0'}));
module.exports=router;
