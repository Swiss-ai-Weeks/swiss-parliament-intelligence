// CPU semantic search over the int8 E5 index exported from the H100 run (scripts/export-embedding-index.py).
// Exact search (no approximation): every vector is scored, split across worker threads, so ranking only
// differs from float32 by int8 quantisation. A passage scope (proposal, speaker, period) scores only its rows.
import {closeSync,existsSync,openSync,readFileSync,readSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {Worker} from 'node:worker_threads';
import {availableParallelism} from 'node:os';

let index=null;
export function semanticIndexPath(root,env=process.env){return env.SEMANTIC_INDEX_PREFIX||join(root,'data/embeddings/e5-index-20260923');}
export function semanticIndexAvailable(root,env=process.env){const p=semanticIndexPath(root,env);return existsSync(p+'.i8')&&existsSync(p+'.ids.jsonl')&&existsSync(p+'.json');}

export function loadSemanticIndex(root,env=process.env){
 if(index)return index;
 const prefix=semanticIndexPath(root,env),manifest=JSON.parse(readFileSync(prefix+'.json','utf8'));
 const bytes=statSync(prefix+'.i8').size;if(bytes!==manifest.count*manifest.dimensions)throw new Error('SEMANTIC_INDEX_SIZE_MISMATCH');
 // SharedArrayBuffer lets worker threads read the same vectors without copying 1.2 GB.
 // Read straight into the shared buffer in 64 MB chunks: a whole-file read would hold a second 1.2 GB copy.
 const shared=new SharedArrayBuffer(bytes),vectors=new Int8Array(shared),target=new Uint8Array(shared),fd=openSync(prefix+'.i8','r');
 try{for(let at=0;at<bytes;){const n=readSync(fd,target,at,Math.min(64<<20,bytes-at),at);if(!n)throw new Error('SEMANTIC_INDEX_TRUNCATED');at+=n;}}finally{closeSync(fd);}
 const ids=readFileSync(prefix+'.ids.jsonl','utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l));
 const rowsOf=new Map();ids.forEach(([pid],row)=>{const list=rowsOf.get(pid);if(list)list.push(row);else rowsOf.set(pid,[row]);});
 index={manifest,vectors,shared,ids,rowsOf,dims:manifest.dimensions};return index;
}

const WORKER=`const {parentPort,workerData}=require('node:worker_threads');
const v=new Int8Array(workerData.shared),d=workerData.dims;
parentPort.on('message',({q,from,to,rows,k})=>{const top=[];let min=-Infinity;
 const score=r=>{let s=0;const o=r*d;for(let i=0;i<d;i++)s+=v[o+i]*q[i];if(top.length<k||s>min){top.push([s,r]);if(top.length>k){top.sort((a,b)=>b[0]-a[0]);top.length=k;min=top[k-1][0];}}};
 if(rows)for(const r of rows)score(r);else for(let r=from;r<to;r++)score(r);
 parentPort.postMessage(top);});`;
let pool=null;
function workers(ix){
 if(!pool){const n=Math.max(1,Math.min(8,availableParallelism()-1));pool=Array.from({length:n},()=>new Worker(WORKER,{eval:true,workerData:{shared:ix.shared,dims:ix.dims}}));pool.forEach(w=>w.unref());}
 return pool;
}
const ask=(w,msg)=>new Promise(resolve=>{w.once('message',resolve);w.postMessage(msg);});

// Returns [{passageId, chunk, score}] best-first; one entry per passage (best chunk).
// Searches run one at a time so each worker reply belongs to the right query.
let queue=Promise.resolve();
export function semanticSearch(root,queryVector,options={}){const run=queue.then(()=>searchNow(root,queryVector,options));queue=run.catch(()=>{});return run;}
async function searchNow(root,queryVector,{k=40,passageIds=null,env=process.env}={}){
 const ix=loadSemanticIndex(root,env),q=Array.from(queryVector),pool=workers(ix);
 let parts;
 if(passageIds){const rows=[];for(const id of passageIds)for(const r of ix.rowsOf.get(String(id))||[])rows.push(r);if(!rows.length)return [];
  const size=Math.ceil(rows.length/pool.length);parts=pool.map((w,i)=>ask(w,{q,rows:rows.slice(i*size,(i+1)*size),k:k*2}));}
 else{const n=ix.ids.length,size=Math.ceil(n/pool.length);parts=pool.map((w,i)=>ask(w,{q,from:i*size,to:Math.min(n,(i+1)*size),k:k*2}));}
 const best=new Map();
 for(const [s,r] of (await Promise.all(parts)).flat()){const [pid,chunk]=ix.ids[r],score=s/127;if(!best.has(pid)||best.get(pid).score<score)best.set(pid,{passageId:pid,chunk,score});}
 return [...best.values()].sort((a,b)=>b.score-a.score).slice(0,k);
}
