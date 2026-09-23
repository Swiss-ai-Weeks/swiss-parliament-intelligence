import {spawn} from 'node:child_process';
import {existsSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const queueFile=resolve(root,'data/parliament/archive-text-queue.json');
if(!existsSync(queueFile))throw new Error('ARCHIVE_QUEUE_MISSING: run npm run archive:discover first');
const queue=JSON.parse(readFileSync(queueFile,'utf8'));
if(queue.schemaVersion!==1||!Array.isArray(queue.sessions))throw new Error('INVALID_ARCHIVE_QUEUE');
const rawLimit=process.argv.find(value=>value.startsWith('--limit='))?.split('=')[1];
const limit=rawLimit===undefined?queue.sessions.length:Number(rawLimit);
if(!Number.isInteger(limit)||limit<0)throw new Error('INVALID_IMPORT_LIMIT');
const selected=queue.sessions.slice(0,limit);
if(selected.some(item=>!/^\d{4}$/.test(String(item.sessionId))))throw new Error('INVALID_SESSION_IN_QUEUE');
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({boundary:queue.boundary,totalQueued:queue.sessions.length,selected:selected.map(item=>item.sessionId)},null,2));process.exit(0);}

const reportFile=resolve(root,'data/parliament/archive-import-run.json');
const report={schemaVersion:1,startedAt:new Date().toISOString(),boundary:queue.boundary,requested:selected.length,completed:[],failed:[]};
const save=()=>{const temporary=`${reportFile}.tmp`;writeFileSync(temporary,JSON.stringify(report,null,2));renameSync(temporary,reportFile);};
save();

const run=sessionId=>new Promise(resolveRun=>{
  const child=spawn(process.execPath,['scripts/ingest-session.mjs',`--session=${sessionId}`],{cwd:root,stdio:'inherit'});
  child.once('error',error=>resolveRun({ok:false,error:error.message}));
  child.once('exit',(code,signal)=>resolveRun(code===0?{ok:true}:{ok:false,error:signal?`signal ${signal}`:`exit ${code}`}));
});

for(const [index,item] of selected.entries()){
  console.log(`\nArchive text ${index+1}/${selected.length}: session ${item.sessionId} — ${item.title}`);
  const startedAt=new Date().toISOString(),result=await run(String(item.sessionId));
  const record={sessionId:String(item.sessionId),startedAt,finishedAt:new Date().toISOString(),...result};
  (result.ok?report.completed:report.failed).push(record);save();
  if(!result.ok)console.error(`Session ${item.sessionId} failed: ${result.error}. Continuing with the next checkpointed session.`);
}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({requested:report.requested,completed:report.completed.length,failed:report.failed.length,report:reportFile},null,2));
if(report.failed.length)process.exitCode=1;
