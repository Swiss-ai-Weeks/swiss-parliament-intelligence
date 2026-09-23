import {createHash} from 'node:crypto';
import {existsSync,readdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {applyAlignmentCandidates,applyImportedReceipts,mergeProcessingJobs,summarizeProcessingJobs} from '../server/processing-backlog.mjs';

const root=resolve(import.meta.dirname,'..'),parliament=resolve(root,'data/parliament'),queueFile=resolve(root,'data/public-session-queue.json'),manifestFile=resolve(root,'data/public-session-queue-manifest.json');
const previous=existsSync(queueFile)?JSON.parse(readFileSync(queueFile,'utf8')):[];
const sessionQueues=readdirSync(parliament,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&/^session-\d{4}$/.test(entry.name)).map(entry=>{const sessionId=entry.name.slice(8),file=resolve(parliament,entry.name,'media-jobs.json');return [sessionId,existsSync(file)?JSON.parse(readFileSync(file,'utf8')):[]];});
let jobs=mergeProcessingJobs(sessionQueues,previous);if(jobs.rejected.length)console.error(`Set aside ${jobs.rejected.length} media job(s) with invalid source durations: ${jobs.rejected.map(j=>j.sessionId+"/"+j.id).slice(0,10).join(", ")}`);const processingFile=resolve(root,'data/public-processing.sqlite');
if(existsSync(processingFile)){const database=new DatabaseSync(processingFile,{readOnly:true});try{jobs=applyImportedReceipts(jobs,database.prepare('SELECT id,session,model,media_sha256,duration,official_url,language,imported_at FROM transcripts').all());}finally{database.close();}}
const alignmentFile=resolve(root,'data/alignment-review/candidates.json');if(existsSync(alignmentFile))jobs=applyAlignmentCandidates(jobs,JSON.parse(readFileSync(alignmentFile,'utf8')));
const raw=JSON.stringify(jobs),summary=summarizeProcessingJobs(jobs),generatedAt=new Date().toISOString(),pending=jobs.filter(job=>job.asr!=='complete');
const writeAtomic=(file,value)=>{const temporary=`${file}.tmp`;writeFileSync(temporary,value);renameSync(temporary,file);};
writeAtomic(queueFile,raw);writeAtomic(resolve(root,'data/public-session-pending.json'),JSON.stringify(pending));writeAtomic(manifestFile,JSON.stringify({schemaVersion:1,generatedAt,sha256:createHash('sha256').update(raw).digest('hex'),sessions:sessionQueues.length,pendingAsr:pending.length,...summary},null,2));
console.log(JSON.stringify({generatedAt,sessions:sessionQueues.length,pendingAsr:pending.length,...summary},null,2));
