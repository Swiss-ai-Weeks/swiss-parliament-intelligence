import test from 'node:test';
import assert from 'node:assert/strict';
import {needsResolution,cleanThread,resolveQuestion} from '../conversation.mjs';

const thread=[{question:'Who is Lorenzo Quadri?',answer:'Lorenzo Quadri is a National Councillor for Ticino.',person:{id:'4046',name:'Lorenzo Quadri'},speakers:[]}];

test('only questions with references are rewritten, in any national language',()=>{
 for(const q of ['What did he vote last summer?','Quels sont ses votes ?','Was hat er gesagt?','Cosa ha detto lei?','Tell me more about that initiative'])assert.equal(needsResolution(q),true,q);
 for(const q of ['What did Lorenzo Quadri say about asylum?','Arguments for and against the 10-million initiative'])assert.equal(needsResolution(q),false,q);
});

test('thread input is validated and bounded',()=>{
 const t=cleanThread([...Array(5)].map((_,i)=>({question:'q'+i,person:{id:'<script>',name:'x'},proposal:{id:'20250026',title:'T'}})));
 assert.equal(t.length,3);assert.equal(t[0].person,null);assert.equal(t[0].proposal.id,'20250026');
});

test('the model resolves the reference; without a model the last person is attached',async()=>{
 const env={INFERENCE_BASE_URL:'https://example.test/v1',INFERENCE_MODEL:'fixture'};
 const fetchImpl=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({standalone:'What did Lorenzo Quadri vote last summer?'})}}]})});
 const r=await resolveQuestion('What did he vote last summer?',thread,{env,fetchImpl});
 assert.equal(r.resolved,true);assert.equal(r.question,'What did Lorenzo Quadri vote last summer?');
 const offline=await resolveQuestion('What did he vote last summer?',thread,{env:{}});
 assert.equal(offline.question,'What did he vote last summer? (Lorenzo Quadri)');
 const untouched=await resolveQuestion('Who chairs the Council of States?',thread,{env,fetchImpl});
 assert.equal(untouched.resolved,false);
});
