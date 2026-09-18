import test from 'node:test';import assert from 'node:assert/strict';import {answerParliament} from '../parliament-ai.mjs';
test('a passage follow-up stays within its source and rejects a mismatched speaker',async()=>{
 const passage={id:'focused',personId:'1',businessId:'b',text:'Protection des données dans le système de santé.',speaker:'Speaker',language:'fr',sha256:'one',officialUrl:'https://example.test/source'};
 const other={...passage,id:'other',text:'Un autre objet.',sha256:'two'};
 const store={people:()=>[],person:()=>null,get:(_kind,id)=>id==='focused'?passage:null,speeches:()=>[passage,other],search:()=>[other]};
 const env={INFERENCE_BASE_URL:'https://example.test',INFERENCE_MODEL:'focused-fixture'};
 const fetcher=async(_url,options)=>{const body=JSON.parse(options.body);const value=body.response_format.json_schema.name==='claim_support_review'?{'0':true}:{claims:[{text:'The passage concerns health data protection.',evidenceId:'parl-focused',quote:passage.text}]};return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(value)}}]})};};
 const result=await answerParliament(store,{passageId:'focused',personId:'1',question:'Explain this passage',language:'en'},env,fetcher);
 assert.deepEqual(result.passages.map(p=>p.id),['focused']);assert.equal(result.retrieval.method,'selected-passage');assert.equal(result.status,'ok');
 assert.equal((await answerParliament(store,{passageId:'focused',personId:'2',question:'Explain this passage'},env,fetcher)).status,'insufficient-evidence');
});
