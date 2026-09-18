import test from 'node:test';import assert from 'node:assert/strict';import {officialPortrait} from '../official-portrait.mjs';
test('portrait identity uses the mapped councillor number and rejects wrong identity',async()=>{
 const calls=[];const fetcher=async url=>{calls.push(url);return calls.length===1?{ok:true,json:async()=>({id:4318,number:3214})}:{ok:true,headers:new Headers({'content-type':'image/jpeg'})};};
 const p=await officialPortrait('4318',fetcher);assert.ok(p.portraitIdentityVerified);assert.match(p.portraitUrl,/3214\.jpg$/);assert.match(calls[0],/4318/);
 await assert.rejects(()=>officialPortrait('4318',async()=>({ok:true,json:async()=>({id:1,number:3214})})),/MISMATCH/);
});
