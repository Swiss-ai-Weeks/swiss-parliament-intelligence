import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeArchiveManifest} from '../archive-coverage.mjs';

test('archive coverage keeps stage gaps explicit',()=>{
  const report=summarizeArchiveManifest({schemaVersion:1,generatedAt:'2026-09-22T00:00:00Z',boundary:{fromYear:1990,toYear:2026},source:{name:'fixture'},sessions:[
    {id:'1',coverage:{officialTextPassages:10,recordingJobs:2,canaryReceipts:1,e5Chunks:10,timingCandidates:3},stages:{text:'complete',media:'partial',asr:'partial',embeddings:'complete',alignment:'partial'}},
    {id:'2',coverage:{},stages:{text:'pending',media:'pending',asr:'pending',embeddings:'pending',alignment:'pending'}}
  ]});
  assert.equal(report.totals.sessions,2);assert.equal(report.totals.officialTextPassages,10);assert.equal(report.totals.stages.text.complete,1);assert.equal(report.totals.stages.text.pending,1);
});

test('archive coverage rejects unversioned manifests',()=>assert.throws(()=>summarizeArchiveManifest({sessions:[]}),/INVALID_ARCHIVE_MANIFEST/));
