import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writePublicEmbeddingInput} from '../public-embedding-export.mjs';

test('public embedding export streams ordered JSONL through backpressure and publishes atomically',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE records(kind TEXT,id TEXT,payload TEXT,source_url TEXT,retrieved_at TEXT,sha256 TEXT)');
 const insert=db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?)');
 for(let index=99;index>=0;index--)insert.run('speech',String(index).padStart(3,'0'),JSON.stringify({text:'public passage '+index,sessionId:'1',personId:'2',businessId:'3',language:'fr'}),'https://ws.parlament.ch/source','2026-09-22','hash-'+index);
 insert.run('person','ignored',JSON.stringify({name:'Ignored'}),'https://ws.parlament.ch/person','2026-09-22','ignored');
 const directory=mkdtempSync(join(tmpdir(),'cleisthenes-embedding-export-')),output=join(directory,'input.jsonl');
 const result=await writePublicEmbeddingInput(db,output,{highWaterMark:32}),lines=readFileSync(output,'utf8').trim().split('\n').map(JSON.parse);db.close();
 assert.deepEqual(result,{publicPassages:100});assert.equal(lines.length,100);assert.equal(lines[0].id,'000');assert.equal(lines.at(-1).id,'099');assert.equal(lines[0].sourceUrl,'https://ws.parlament.ch/source');assert.equal(existsSync(output+'.tmp'),false);
});
