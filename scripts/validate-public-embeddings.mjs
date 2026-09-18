import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
const source=new DatabaseSync('data/parliament.sqlite',{readOnly:true}),vectors=new DatabaseSync('data/public-embeddings.sqlite',{readOnly:true});
const passages=new Map(source.prepare("SELECT id,sha256,payload FROM records WHERE kind='speech'").all().map(r=>[r.id,{hash:r.sha256,text:JSON.parse(r.payload).text}]));
const covered=new Set(),sessions={};let chunks=0;
for(const r of vectors.prepare('SELECT * FROM embeddings').iterate()){
 const p=passages.get(r.id);if(!p||p.hash!==r.source_hash)throw Error('SOURCE_HASH_MISMATCH '+r.id);
 if(r.dimensions!==1024||r.vector.length!==4096||r.model!=='intfloat/multilingual-e5-large'||!r.revision)throw Error('INVALID_VECTOR_METADATA');
 const a=new Float32Array(Uint8Array.from(r.vector).buffer);let norm=0;for(const v of a){if(!Number.isFinite(v))throw Error('NONFINITE_VECTOR');norm+=v*v;}if(Math.abs(norm-1)>.01)throw Error('UNNORMALIZED_VECTOR');
 if(r.start_char<0||r.end_char<=r.start_char||r.end_char>[...p.text].length)throw Error('INVALID_TEXT_BOUNDARY '+r.id);
 covered.add(r.id);chunks++;const session=JSON.parse(r.metadata).sessionId||'additional-records';sessions[session]=(sessions[session]||0)+1;
}
if(covered.size!==passages.size)throw Error('INCOMPLETE_PASSAGE_COVERAGE');
const report={validatedAt:new Date().toISOString(),passages:covered.size,chunks,sessions,receipt:JSON.parse(vectors.prepare("SELECT value FROM run_metadata WHERE key='receipt'").get().value),checks:['source hashes','finite 1024-dimensional normalized vectors','text boundaries','complete imported-passage coverage']};
writeFileSync('artifacts/public-embedding-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));source.close();vectors.close();
