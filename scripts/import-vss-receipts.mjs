import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const dir='data/parliament/session-5214/',jobs=JSON.parse(readFileSync(dir+'media-jobs.json')),report=[];
for(const job of jobs){const id=job.id;if(!/^\d+$/.test(id))throw Error('Invalid ID');if(!existsSync(dir+id+'-vss.json')||!existsSync(dir+id+'-embeddings.json'))continue;
 const r=JSON.parse(readFileSync(dir+id+'-vss.json')),e=JSON.parse(readFileSync(dir+id+'-embeddings.json'));
 if(r.httpStatus!==200||!r.processing.chunks_processed||r.processing.chunks_processed!==e.chunk_responses.length||r.sha256!==job.mediaSha256)throw Error('Receipt mismatch '+id);
 Object.assign(job,{vss:'complete',vssChunks:r.processing.chunks_processed,vssModel:e.model,vssReceipt:id+'-vss.json',vssEmbeddings:id+'-embeddings.json'});report.push({id,language:job.language,chunks:job.vssChunks,seconds:r.latencySeconds,duration:job.durationHintSeconds});
}writeFileSync(dir+'media-jobs.json',JSON.stringify(jobs,null,2));writeFileSync('artifacts/vss-batch-evaluation.json',JSON.stringify(report,null,2));console.log(report);
