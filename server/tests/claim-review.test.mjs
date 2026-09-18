import test from 'node:test';import assert from 'node:assert/strict';import {reviewClaims} from '../claim-review.mjs';
const env={INFERENCE_BASE_URL:'https://example.test',INFERENCE_MODEL:'test'},claims=[{text:'supported',quote:'source'},{text:'invented',quote:'source'}];
test('source review drops rejected claims without rewriting source quotations',async()=>{
 const r=await reviewClaims(claims,env,async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"0":true,"1":false}'}}]})}));assert.deepEqual(r,{claims:[claims[0]],withheld:1});
});
test('incomplete or unavailable review fails closed',async()=>{
 await assert.rejects(reviewClaims(claims,env,async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"0":true}'}}]})})),/INVALID_CLAIM_REVIEW/);
 await assert.rejects(reviewClaims(claims,env,async()=>({ok:false})),/CLAIM_REVIEW_UNAVAILABLE/);
});
