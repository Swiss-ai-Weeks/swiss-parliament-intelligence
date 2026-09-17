import test from 'node:test';
import assert from 'node:assert/strict';
import {overviewEvidence} from '../overview-evidence.mjs';
const question="Summarize the selected proposal's available debate passages.";
const passages=[['1','a'],['2','a'],['3','b'],['4','c']].map(([id,personId])=>({id,personId,text:'An original parliamentary statement with context. '.repeat(3)}));
test('a scoped overview retrieves different speakers without keyword matches',()=>{assert.deepEqual(overviewEvidence({question,businessId:'42'},passages).map(s=>s.id),['1','3','4']);});
test('overview fallback cannot answer arbitrary or unscoped questions',()=>{assert.equal(overviewEvidence({question},passages),null);assert.equal(overviewEvidence({question:'What is the weather?',businessId:'42'},passages),null);assert.deepEqual(overviewEvidence({question,businessId:'42'},[]),[]);});
