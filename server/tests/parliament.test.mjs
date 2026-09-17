import test from 'node:test';
import assert from 'node:assert/strict';
import {openParliament,officialDate,statusGroup,plainText} from '../parliament.mjs';
import {assessComparability,answerParliament} from '../parliament-ai.mjs';

test('parliamentary status is not a scheduled popular vote',()=>{
 assert.equal(statusGroup('Liquidé'),'concluded');assert.equal(statusGroup('Déposé'),'proceedings');assert.equal(statusGroup('Unknown status'),'unclassified');
 assert.equal(officialDate('/Date(0+0060)/'),'1970-01-01T00:00:00.000Z');assert.equal(officialDate(null),null);assert.equal(plainText('<p>A &amp; B</p>'),'A & B');
});
test('speech retrieval scopes people and proposals without interpreting query syntax',()=>{
 const s=openParliament(':memory:');try{
 for(const [id,person,business]of [['one','p1','b1'],['two','p2','b1'],['three','p1','b2']]){const payload={id,personId:person,businessId:business,text:'Protection des données'};s.db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?)').run('speech',id,JSON.stringify(payload),'https://ws.parlament.ch/example','2026-09-17','test');s.db.prepare('INSERT INTO speech_search VALUES(?,?,?,?)').run(id,person,business,payload.text);}
 assert.deepEqual(s.search('Que dit la protection des données ?', {personId:'p1',businessId:'b1'}).map(r=>r.id),['one']);assert.deepEqual(s.search('"* OR NOT'),[]);assert.deepEqual(s.search('weather forecast'),[]);
 }finally{s.close();}
});
test('comparison refuses unreviewed attribution, different speakers and same-day repetition',()=>{
 const a={id:'a',personId:'p1',businessId:'b1',date:'2024-01-01'},b={...a,id:'b',date:'2025-01-01'};
 assert.match(assessComparability(a,b),/editorial review/);assert.match(assessComparability(a,{...b,personId:'p2'}),/same identified speaker/);assert.match(assessComparability(a,{...b,date:a.date}),/different dates/);assert.match(assessComparability(a,{...b,businessId:'b2'}),/equivalence/);
});
test('unavailable provider is explicit and empty retrieval never calls a model',async()=>{
 const store={search:()=>[],speeches:()=>[]};let calls=0;const fetchImpl=()=>{calls++;throw new Error('unexpected');};
 assert.equal((await answerParliament(store,{question:'missing'},{},fetchImpl)).status,'provider-unavailable');
 assert.equal((await answerParliament(store,{question:'missing'},{INFERENCE_BASE_URL:'http://test',INFERENCE_MODEL:'test'},fetchImpl)).status,'insufficient-evidence');assert.equal(calls,0);
});
test('multilingual answers cache only the same question, scope and evidence revision',async()=>{
 let calls=0;const speech={id:'cache-test',text:'Protection des données.',language:'fr',speaker:'Test fixture',sha256:'v1',businessId:'b',officialUrl:'https://example.test/source'};
 const store={speeches:()=>[speech],search:q=>/données/.test(q)?[speech]:[]};
 const env={INFERENCE_BASE_URL:'https://example.test/v1',INFERENCE_MODEL:'cache-fixture'};
 const fetchImpl=async(_u,options)=>{calls++;const p=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(p.response_format.json_schema.name==='claim_support_review'?{'0':true}:p.response_format.json_schema.name==='search_terms'?{fr:'protection données',de:'Datenschutz',it:'protezione dati'}:{claims:[{text:'The passage concerns data protection.',evidenceId:'parl-cache-test',quote:speech.text}]})}}]})};};
 const input={question:'Explain data protection',language:'en',businessId:'b'};
 const first=await answerParliament(store,input,env,fetchImpl);assert.equal(first.status,'ok');assert.equal(first.cacheHit,false);assert.equal(calls,3);
 assert.equal((await answerParliament(store,input,env,fetchImpl)).cacheHit,true);assert.equal(calls,3);
 speech.sha256='v2';assert.equal((await answerParliament(store,input,env,fetchImpl)).cacheHit,false);assert.equal(calls,5);
});
