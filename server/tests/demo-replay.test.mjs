import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {findRecordedAnswer,replayRecorded,infrastructureFailure} from '../demo-replay.mjs';

test('recorded demo answers match only the prepared question and language, and are labelled',()=>{
 const root=mkdtempSync(join(tmpdir(),'demo-'));mkdirSync(join(root,'config'));
 writeFileSync(join(root,'config/demo-answers.json'),JSON.stringify({answers:[
  {id:'a',question:"What are the arguments about X?",language:'en',recordedAt:'2026-09-23T10:00:00Z',model:'m',answer:{status:'ok',answer:{lead:{text:'Lead',citationIds:['c1']}}}},
  {id:'b',question:'Unsupported',language:'en',recordedAt:'2026-09-23T10:00:00Z',answer:{status:'insufficient-evidence'}}]}));
 assert.ok(findRecordedAnswer(root,'what are the arguments about x ?  ','en'));
 assert.equal(findRecordedAnswer(root,'What are the arguments about X?','fr'),null);
 assert.equal(findRecordedAnswer(root,'Unsupported','en'),null,'only verified answers are recorded');
 const replay=replayRecorded(findRecordedAnswer(root,'What are the arguments about X?','en'));
 assert.equal(replay.mode,'recorded-replay');assert.equal(replay.recordedAt,'2026-09-23T10:00:00Z');assert.match(replay.notice,/Recorded answer/);
});
test('only infrastructure failures trigger the recorded fallback',()=>{
 assert.equal(infrastructureFailure({status:'provider-unavailable'}),true);
 assert.equal(infrastructureFailure({status:'sources-only',mode:'source-fallback'}),true);
 assert.equal(infrastructureFailure({status:'insufficient-evidence',mode:'live-inference'}),false);
 assert.equal(infrastructureFailure({status:'refused'}),false);
});
