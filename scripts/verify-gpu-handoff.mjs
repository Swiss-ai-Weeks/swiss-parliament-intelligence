import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..','artifacts/gpu-handoff'),manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
if(manifest.schemaVersion!==1||!Array.isArray(manifest.files))throw new Error('INVALID_GPU_HANDOFF_MANIFEST');
for(const item of manifest.files){const file=resolve(root,item.name);if(!file.startsWith(root+'\\')||statSync(file).size!==item.bytes||createHash('sha256').update(readFileSync(file)).digest('hex')!==item.sha256)throw new Error(`GPU_HANDOFF_MISMATCH ${item.name}`);}
const queue=JSON.parse(readFileSync(resolve(root,'public-session-pending.json'),'utf8'));if(queue.length!==manifest.pendingAsrJobs||queue.some(job=>job.asr==='complete'))throw new Error('GPU_HANDOFF_QUEUE_MISMATCH');
console.log(JSON.stringify({status:'verified',files:manifest.files.length,pendingAsrJobs:manifest.pendingAsrJobs,embeddingPassages:manifest.embeddingPassages}));
