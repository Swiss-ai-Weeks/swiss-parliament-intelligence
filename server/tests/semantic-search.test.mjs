import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {semanticSearch} from '../semantic-search.mjs';

test('int8 semantic search ranks by cosine, keeps the best chunk per passage and honours a scope',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'e5-')),prefix=join(dir,'index');
 const rows=[['a-1',0,[127,0,0,0]],['a-1',1,[90,90,0,0]],['b-2',0,[0,127,0,0]],['c-3',0,[0,0,127,0]]];
 writeFileSync(prefix+'.i8',Buffer.from(Int8Array.from(rows.flatMap(r=>r[2])).buffer));
 writeFileSync(prefix+'.ids.jsonl',rows.map(([id,chunk])=>JSON.stringify([id,chunk,0,10])).join('\n')+'\n');
 writeFileSync(prefix+'.json',JSON.stringify({count:rows.length,dimensions:4,files:{}}));
 const env={SEMANTIC_INDEX_PREFIX:prefix};
 const hits=await semanticSearch(dir,Float32Array.from([1,0,0,0]),{k:3,env});
 assert.deepEqual(hits.map(h=>h.passageId),['a-1','b-2','c-3']);
 assert.equal(hits[0].chunk,0);assert.ok(Math.abs(hits[0].score-1)<1e-6);
 const scoped=await semanticSearch(dir,Float32Array.from([0,0,1,0]),{k:3,env,passageIds:['b-2','c-3']});
 assert.deepEqual(scoped.map(h=>h.passageId),['c-3','b-2']);
});
