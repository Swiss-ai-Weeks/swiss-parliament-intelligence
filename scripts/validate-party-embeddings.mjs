import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
const documents=new Map(readFileSync(process.argv[2]||'data/parties/embedding-input.jsonl','utf8').trim().split('\n').map(line=>{const row=JSON.parse(line);return [row.id,row];}));
const db=new DatabaseSync(process.argv[3]||'data/parties/party-staging-embeddings.sqlite',{readOnly:true}),seen=new Set();let chunks=0;
for(const r of db.prepare('SELECT * FROM embeddings').iterate()){
 const doc=documents.get(r.id);if(!doc||doc.sha256!==r.source_hash)throw Error('SOURCE_HASH_MISMATCH');
 if(r.model!=='intfloat/multilingual-e5-large'||r.revision!=='3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3'||r.dimensions!==1024||r.vector.length!==4096)throw Error('MODEL_MISMATCH');
 if(r.start_char<0||r.end_char<=r.start_char||r.end_char>[...doc.text].length)throw Error('INVALID_BOUNDARY');
 const vector=new Float32Array(Uint8Array.from(r.vector).buffer);const norm=vector.reduce((sum,v)=>sum+v*v,0);if(!Number.isFinite(norm)||Math.abs(norm-1)>.01)throw Error('INVALID_VECTOR');seen.add(r.id);chunks++;
}
if(seen.size!==documents.size)throw Error('INCOMPLETE_INDEX');
const report={at:new Date().toISOString(),documents:seen.size,chunks,receipt:JSON.parse(db.prepare("SELECT value FROM run_metadata WHERE key='receipt'").get().value),publication:'staging-only; independent review pending'};
writeFileSync('artifacts/party-embedding-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));db.close();
