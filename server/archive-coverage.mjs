import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const totals=sessions=>sessions.reduce((out,session)=>{
  out.sessions++;
  for(const key of ['officialTextPassages','recordingJobs','canaryReceipts','e5Chunks','timingCandidates'])out[key]+=Number(session.coverage?.[key]||0);
  for(const key of ['text','media','asr','embeddings','alignment'])out.stages[key][session.stages?.[key]||'pending']=(out.stages[key][session.stages?.[key]||'pending']||0)+1;
  return out;
},{sessions:0,officialTextPassages:0,recordingJobs:0,canaryReceipts:0,e5Chunks:0,timingCandidates:0,stages:{text:{},media:{},asr:{},embeddings:{},alignment:{}}});

export function summarizeArchiveManifest(manifest){
  if(!manifest||manifest.schemaVersion!==1||!Array.isArray(manifest.sessions))throw new Error('INVALID_ARCHIVE_MANIFEST');
  return {
    status:'declared',
    generatedAt:manifest.generatedAt,
    boundary:manifest.boundary,
    source:manifest.source,
    totals:totals(manifest.sessions),
    sessions:manifest.sessions
  };
}

export function readArchiveCoverage(root){
  const file=join(root,'data/parliament/archive-manifest.json');
  if(!existsSync(file))return {status:'not-declared',message:'Run npm run archive:discover to declare and reconcile the official archive boundary.'};
  return summarizeArchiveManifest(JSON.parse(readFileSync(file,'utf8')));
}
