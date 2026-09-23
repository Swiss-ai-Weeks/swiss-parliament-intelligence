import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAlignmentCandidates,applyImportedReceipts,mergeProcessingJobs,summarizeProcessingJobs} from '../processing-backlog.mjs';

const job=(id,sessionId,extra={})=>({id:String(id),sessionId:String(sessionId),subjectId:'1',personId:2,language:'fr',officialPage:`https://www.parlament.ch/source/${id}`,durationHintSeconds:30,stage:'source-verification-pending',asr:'pending',alignment:'pending',vss:'pending',...extra});
test('processing backlog merges session queues and preserves worker state',()=>{
 const jobs=mergeProcessingJobs([['5215',[job(1,5215)]],['5214',[job(2,5214)]]],[job(1,5215,{asr:'complete',mediaSha256:'a'.repeat(64)})]);
 assert.deepEqual(jobs.map(item=>item.id),['1','2']);assert.equal(jobs[0].asr,'pending');
 const carried=mergeProcessingJobs([['5215',[{...job(1,5215),asr:undefined}]]],[job(1,5215,{asr:'complete',mediaSha256:'a'.repeat(64)})]);assert.equal(carried[0].asr,'complete');assert.equal(carried[0].mediaSha256,'a'.repeat(64));
});
test('processing summary keeps media, ASR, alignment and VSS separate',()=>{
 const summary=summarizeProcessingJobs([job(1,5215,{mediaSha256:'a'.repeat(64),asr:'complete',alignedParagraphs:3,vss:'complete'}),job(2,5215,{stage:'failed',asr:'failed'})]);
 assert.deepEqual(summary.states,{mediaResolved:1,mediaFailed:1,asrComplete:1,asrFailed:1,alignmentCandidates:3,vssComplete:1});
});
test('processing backlog rejects cross-session identity conflicts',()=>assert.throws(()=>mergeProcessingJobs([['5215',[job(1,5215)]],['5214',[job(1,5214)]]]),/CONFLICTING_PROCESSING_JOB/));
test('validated processing receipts remove completed jobs from the ASR backlog',()=>{
 const jobs=[job(1,5215)],receipt={id:'1',session:'5215',model:'nvidia/canary-1b-v2',media_sha256:'a'.repeat(64),duration:30,official_url:jobs[0].officialPage,language:'fr',imported_at:'2026-09-22'};
 assert.equal(applyImportedReceipts(jobs,[receipt])[0].asr,'complete');assert.throws(()=>applyImportedReceipts([job(1,5215)],[{...receipt,session:'5214'}]),/PROCESSING_RECEIPT_MISMATCH/);
});
test('staged alignment candidates replace stale queue counts and deduplicate passages',()=>{
 const jobs=[job(1,5215,{alignedParagraphs:9}),job(2,5215,{alignedParagraphs:4})];
 const candidates=[{transcriptId:'1',passageId:'1-0'},{transcriptId:'1',passageId:'1-0'},{transcriptId:'1',passageId:'1-1'}];
 applyAlignmentCandidates(jobs,candidates);assert.equal(jobs[0].alignedParagraphs,2);assert.equal(jobs[1].alignedParagraphs,0);
 assert.throws(()=>applyAlignmentCandidates(jobs,[{transcriptId:'99',passageId:'99-0'}]),/ALIGNMENT_CANDIDATE_MISMATCH/);
});
