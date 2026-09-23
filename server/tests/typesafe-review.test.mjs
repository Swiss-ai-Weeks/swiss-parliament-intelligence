import test from 'node:test';
import assert from 'node:assert/strict';
import {publicTypeSafeReview,reviewClaimsWithTypeSafe} from '../typesafe-review.mjs';

const evidence=[{id:'parl-1',text:'The committee recommends adoption. The council has not yet voted.',sourceKind:'parliamentary-speech',speaker:'Rapporteur',speakerRole:'committee rapporteur',date:'2026-01-01',language:'en'}];
const claims=[{text:'The committee recommends adoption.',evidenceId:'parl-1',quote:evidence[0].text}];
const env={TYPESAFE_MODE:'shadow',TYPESAFE_API_KEY:'secret',TYPESAFE_MODEL:'jev-latest'};

test('TypeSafe review sends structured public evidence and keeps shadow decisions non-blocking',async()=>{
 let request;const result=await reviewClaimsWithTypeSafe(claims,env,async(url,options)=>{request={url,headers:options.headers,body:JSON.parse(options.body)};return {ok:true,status:200,json:async()=>({model:'jev-1.13.0',answers:{relation_0:{type:'choice',choice:'supports',confidence:.94,probabilities:{supports:.96,contradicts:.01,says_nothing:.03}}},usage:{input_tokens:100,output_tokens:20}})};},{evidence});
 assert.equal(request.url,'https://api.typesafe.ai/v1/systemone');assert.equal(request.body.state.citations[0].source,evidence[0].text);assert.equal(request.body.questions.relation_0.type,'choice');assert.equal(result.claims.length,1);assert.equal(result.decisions[0].relation,'supports');assert.equal(publicTypeSafeReview(result).usage.input_tokens,100);
});

test('enforcement withholds unsupported or uncertain claims',async()=>{
 const result=await reviewClaimsWithTypeSafe(claims,{...env,TYPESAFE_MODE:'enforce',TYPESAFE_AUTO_ACCEPT:'0.8'},async()=>({ok:true,status:200,json:async()=>({model:'jev-test',answers:{relation_0:{type:'choice',choice:'supports',confidence:.6,probabilities:{supports:.6,contradicts:.1,says_nothing:.3}}},usage:{input_tokens:1,output_tokens:1}})}),{evidence});
 assert.equal(result.claims.length,0);assert.equal(result.withheld,1);assert.equal(result.decisions[0].auto,false);
});

test('missing quotations are rejected deterministically without an API call',async()=>{
 let calls=0;const bad=[{...claims[0],quote:'Invented quotation'}];const result=await reviewClaimsWithTypeSafe(bad,{...env,TYPESAFE_MODE:'enforce'},async()=>{calls++;},{evidence});
 assert.equal(calls,0);assert.equal(result.claims.length,0);assert.equal(result.decisions[0].relation,'fabricated');
});

test('off and unconfigured modes never send evidence',async()=>{
 let calls=0;assert.equal((await reviewClaimsWithTypeSafe(claims,{},async()=>{calls++;},{evidence})).status,'off');assert.equal((await reviewClaimsWithTypeSafe(claims,{TYPESAFE_MODE:'shadow'},async()=>{calls++;},{evidence})).status,'unconfigured');assert.equal(calls,0);
});
