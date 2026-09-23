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
 const fetchImpl=async(_u,options)=>{calls++;const p=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(p.response_format.json_schema.name==='claim_support_review'?{'0':true}:p.response_format.json_schema.name==='search_terms'?{fr:'protection données',de:'Datenschutz',it:'protezione dati'}:p.response_format.json_schema.name==='cleisthenes_answer'?{lead:{text:'Test fixture says that the passage is about the protection of data.',units:['u1']},sections:[],followUps:['What else was said about it?']}:{claims:[{text:'The passage concerns data protection.',evidenceId:'parl-cache-test',quote:speech.text}]})}}]})};};
 const input={question:'Explain data protection',language:'en',businessId:'b'};
 const first=await answerParliament(store,input,env,fetchImpl);assert.equal(first.status,'ok');assert.equal(first.cacheHit,false);assert.equal(calls,5);assert.equal(first.answer.lead.citationIds[0],'c1');assert.equal(first.citations[0].passageId,'cache-test');
 assert.equal((await answerParliament(store,input,env,fetchImpl)).cacheHit,true);assert.equal(calls,5);
 speech.sha256='v2';assert.equal((await answerParliament(store,input,env,fetchImpl)).cacheHit,false);assert.equal(calls,9);
});

test('voting advice and predictions are refused before retrieval, with a neutral alternative',async()=>{
 let calls=0;const store={speeches:()=>[],search:()=>{calls++;return [];}};
 const env={INFERENCE_BASE_URL:'https://example.test/v1',INFERENCE_MODEL:'fixture'};
 const fetchImpl=async()=>{calls++;throw new Error('model must not be called');};
 const refused=await answerParliament(store,{question:'How should I vote on the neutrality initiative?',language:'en'},env,fetchImpl);
 assert.equal(refused.status,'refused');assert.equal(refused.reason,'voting-advice');assert.equal(calls,0);
 assert.deepEqual(refused.suggestedFollowUps,['What are the arguments for and against the neutrality initiative?']);
 for(const q of ['Comment dois-je voter sur la neutralité ?','Wie soll ich abstimmen?','Who will win the vote?'])assert.equal((await answerParliament(store,{question:q,language:'en'},env,fetchImpl)).status,'refused');
 assert.equal(calls,0);
});

test('a follow-up that finds nothing in its passage widens once to the whole debate and says so',async()=>{
 const focus={id:'900-1',text:'Merci, Madame la présidente, je serai bref sur ce point de procédure.',language:'fr',speaker:'Chair',sha256:'a',businessId:'b1',transcriptId:'900',officialUrl:'https://example.test/1'};
 const other={id:'901-1',text:'La protection des données doit rester au centre de cette réforme, car elle touche chaque citoyen.',language:'fr',speaker:'Member',sha256:'b',businessId:'b1',transcriptId:'901',officialUrl:'https://example.test/2'};
 const store={speeches:()=>[focus,other],get:(kind,id)=>kind==='speech'?[focus,other].find(s=>s.id===id):kind==='business'?{id:'b1',title:'Réforme des données'}:null,search:()=>[other]};
 let reviews=0;
 const fetchImpl=async(_u,o)=>{const p=JSON.parse(o.body),name=p.response_format?.json_schema?.name;
  const content=name==='claim_support_review'?(reviews++===0?{'0':false}:Object.fromEntries(Object.keys(p.response_format.json_schema.schema.properties).map(k=>[k,true])))
   :name==='search_terms'?{fr:'données',de:'Daten',it:'dati'}
   :name==='cleisthenes_answer'?{lead:{text:'Member says that the protection of data must stay at the centre of the reform.',units:['u1']},sections:[],followUps:[]}
   :{claims:[{text:(JSON.parse(p.messages[1].content).evidence[0].speaker)+' says data protection is central to the reform.',evidenceId:JSON.parse(p.messages[1].content).evidence[0].id}]};
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(content)}}]})};};
 const answer=await answerParliament(store,{question:'What was said about data protection?',language:'en',passageId:'900-1'},{INFERENCE_BASE_URL:'https://example.test/v1',INFERENCE_MODEL:'fixture'},fetchImpl);
 assert.equal(answer.status,'ok');assert.equal(answer.researchSummary.broadened.to,'debate');assert.equal(answer.researchSummary.broadened.businessId,'b1');
});
