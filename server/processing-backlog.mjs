const stableJob=job=>JSON.stringify({sessionId:String(job.sessionId),subjectId:String(job.subjectId),personId:job.personId===null?null:String(job.personId||''),language:job.language,officialPage:job.officialPage,durationHintSeconds:job.durationHintSeconds});

export function mergeProcessingJobs(sessionQueues,previous=[]){
 const old=new Map(previous.map(job=>[String(job.id),job])),jobs=new Map(),rejected=[];
 for(const [sessionId,entries] of sessionQueues){
  if(!/^\d{4}$/.test(String(sessionId))||!Array.isArray(entries))throw new Error('INVALID_SESSION_QUEUE');
  for(const item of entries){
   const current=Object.fromEntries(Object.entries(item).filter(([,value])=>value!==undefined));const job={...old.get(String(item.id)),...current,id:String(item.id),sessionId:String(item.sessionId)};
   if(!/^\d+$/.test(job.id)||job.sessionId!==String(sessionId)||!['de','fr','it','en'].includes(job.language)||!/^https:\/\/www\.parlament\.ch\//.test(job.officialPage))throw new Error(`INVALID_PROCESSING_JOB ${job.id}`);
   // Some 1999-2000 source records end before they start; without a usable duration the job cannot be scheduled, so it is set aside and counted.
   if(!Number.isFinite(job.durationHintSeconds)||job.durationHintSeconds<0){rejected.push({id:job.id,sessionId:job.sessionId,reason:'invalid-source-duration'});continue;}
   const prior=jobs.get(job.id);if(prior&&stableJob(prior)!==stableJob(job))throw new Error(`CONFLICTING_PROCESSING_JOB ${job.id}`);jobs.set(job.id,job);
  }
 }
 const merged=[...jobs.values()].sort((a,b)=>Number(b.sessionId)-Number(a.sessionId)||Number(a.id)-Number(b.id));
 return Object.assign(merged,{rejected});
}

export function summarizeProcessingJobs(jobs){
 const bySession={},states={mediaResolved:0,mediaFailed:0,asrComplete:0,asrFailed:0,alignmentCandidates:0,vssComplete:0};
 for(const job of jobs){
  const session=String(job.sessionId);bySession[session]??={jobs:0,mediaResolved:0,asrComplete:0,alignmentCandidates:0,vssComplete:0};bySession[session].jobs++;
  if(job.mediaSha256||job.stage==='downloaded'||job.asr==='complete'){states.mediaResolved++;bySession[session].mediaResolved++;}
  if(job.stage==='failed')states.mediaFailed++;
  if(job.asr==='complete'){states.asrComplete++;bySession[session].asrComplete++;}
  if(job.asr==='failed')states.asrFailed++;
  const aligned=Number(job.alignedParagraphs||0);states.alignmentCandidates+=aligned;bySession[session].alignmentCandidates+=aligned;
  if(job.vss==='complete'){states.vssComplete++;bySession[session].vssComplete++;}
 }
 return {jobs:jobs.length,states,bySession};
}

export function applyImportedReceipts(jobs,receipts){
 const byId=new Map(jobs.map(job=>[String(job.id),job]));
 for(const receipt of receipts){
  const job=byId.get(String(receipt.id));if(!job)continue;
  if(String(receipt.session)!==String(job.sessionId)||receipt.official_url!==job.officialPage||receipt.language!==job.language||!/^nvidia\/canary-1b-v2$/.test(receipt.model)||!Number.isFinite(receipt.duration)||receipt.duration<=0||!/^[a-f0-9]{64}$/.test(receipt.media_sha256))throw new Error(`PROCESSING_RECEIPT_MISMATCH ${receipt.id}`);
  Object.assign(job,{stage:'transcribed',asr:'complete',asrModel:receipt.model,mediaSha256:receipt.media_sha256,mediaDurationSeconds:receipt.duration,receiptImportedAt:receipt.imported_at});
 }
 return jobs;
}

export function applyAlignmentCandidates(jobs,candidates){
 if(!Array.isArray(candidates))throw new Error('INVALID_ALIGNMENT_CANDIDATES');
 const byId=new Map(jobs.map(job=>[String(job.id),job])),passages=new Map();
 for(const candidate of candidates){
  const transcriptId=String(candidate?.transcriptId||''),passageId=String(candidate?.passageId||'');
  if(!/^\d+$/.test(transcriptId)||!passageId||!byId.has(transcriptId))throw new Error(`ALIGNMENT_CANDIDATE_MISMATCH ${transcriptId||'missing'}`);
  if(!passages.has(transcriptId))passages.set(transcriptId,new Set());passages.get(transcriptId).add(passageId);
 }
 for(const job of jobs)job.alignedParagraphs=passages.get(String(job.id))?.size||0;
 return jobs;
}

export function readProcessingBacklog(root){
 const file=join(root,'data/public-session-queue-manifest.json');
 if(!existsSync(file))return {status:'not-reconciled',message:'Run npm run processing:backlog after importing sessions.'};
 const report=JSON.parse(readFileSync(file,'utf8'));if(report.schemaVersion!==1||!Number.isInteger(report.jobs)||!Number.isInteger(report.pendingAsr))throw new Error('INVALID_PROCESSING_BACKLOG');return {status:'reconciled',...report};
}
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
