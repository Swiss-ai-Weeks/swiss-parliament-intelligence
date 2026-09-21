import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const required=[
  'data/parliament.sqlite',
  'data/public-embeddings.sqlite',
  'data/public-processing.sqlite',
  'data/public-session-queue.json',
  'data/alignment-review/candidates.json'
];

const number=value=>Number(value||0);
const group=(rows,key)=>Object.fromEntries(rows.map(row=>[String(row[key]),number(row.n)]));

export function missingStatusArtifacts(){
  return required.filter(file=>!existsSync(join(root,file)));
}

export function collectSessionStatus(){
  const missing=missingStatusArtifacts();
  if(missing.length)throw new Error(`Operational status artifacts are unavailable: ${missing.join(', ')}`);

  const parliament=new DatabaseSync(join(root,'data/parliament.sqlite'),{readOnly:true});
  const processing=new DatabaseSync(join(root,'data/public-processing.sqlite'),{readOnly:true});
  const embeddings=new DatabaseSync(join(root,'data/public-embeddings.sqlite'),{readOnly:true});
  try{
    const speechRows=parliament.prepare("SELECT id,json_extract(payload,'$.sessionId') session FROM records WHERE kind='speech'").all();
    const passageSession=new Map(speechRows.map(row=>[String(row.id),row.session?String(row.session):'additional']));
    const passages={};for(const session of passageSession.values())passages[session]=(passages[session]||0)+1;

    const queue=JSON.parse(readFileSync(join(root,'data/public-session-queue.json'),'utf8'));
    const recordingJobs={};for(const job of queue){const session=String(job.sessionId);recordingJobs[session]=(recordingJobs[session]||0)+1;}

    const chunks={};
    for(const row of embeddings.prepare('SELECT metadata FROM embeddings').iterate()){
      const id=String(JSON.parse(row.metadata).id);
      const session=passageSession.get(id)||'additional';
      chunks[session]=(chunks[session]||0)+1;
    }

    const receipts=group(processing.prepare('SELECT session,count(*) n FROM transcripts GROUP BY session').all(),'session');
    const transcriptSession=new Map(processing.prepare('SELECT id,session FROM transcripts').all().map(row=>[String(row.id),String(row.session)]));
    const candidates=JSON.parse(readFileSync(join(root,'data/alignment-review/candidates.json'),'utf8'));
    if(!Array.isArray(candidates))throw new Error('Alignment candidates must be a JSON array');
    const timing={};
    for(const candidate of candidates){
      const session=transcriptSession.get(String(candidate.transcriptId))||'unknown';
      timing[session]??={candidates:0,recordings:new Set(),humanReviewed:0};
      timing[session].candidates++;
      timing[session].recordings.add(String(candidate.transcriptId));
      if(/^human-reviewed(?:$|[;: ])/i.test(candidate.reviewState||''))timing[session].humanReviewed++;
    }

    const vss={};
    for(const session of ['5213','5214','5215']){
      const file=join(root,`data/parliament/session-${session}/media-jobs.json`);
      if(!existsSync(file))throw new Error(`Operational status artifact is unavailable: ${file}`);
      const complete=JSON.parse(readFileSync(file,'utf8')).filter(job=>job.vss==='complete');
      vss[session]={recordings:complete.length,chunks:complete.reduce((sum,job)=>sum+number(job.vssChunks),0)};
    }

    const sourceDates=[
      ...parliament.prepare("SELECT retrieved_at value FROM records WHERE kind='session'").all().map(row=>row.value),
      ...processing.prepare('SELECT imported_at value FROM transcripts').all().map(row=>row.value)
    ].filter(Boolean).map(value=>String(value).slice(0,10)).sort();

    const sessions=['5213','5214','5215'].map(session=>({
      session,
      passages:passages[session]||0,
      recordingJobs:recordingJobs[session]||0,
      e5Chunks:chunks[session]||0,
      canaryReceipts:receipts[session]||0,
      timingCandidates:timing[session]?.candidates||0,
      timingRecordings:timing[session]?.recordings.size||0,
      vssRecordings:vss[session].recordings,
      vssChunks:vss[session].chunks,
      humanReviewedTimings:timing[session]?.humanReviewed||0
    }));
    const additional={session:'additional',passages:passages.additional||0,recordingJobs:0,e5Chunks:chunks.additional||0,canaryReceipts:0,timingCandidates:0,timingRecordings:0,vssRecordings:0,vssChunks:0,humanReviewedTimings:0};
    const total=sessions.concat(additional).reduce((out,row)=>{for(const key of Object.keys(additional))if(key!=='session')out[key]=(out[key]||0)+row[key];return out;},{session:'total'});
    return {asOf:sourceDates.at(-1),sessions,additional,total};
  }finally{
    parliament.close();processing.close();embeddings.close();
  }
}

const fmt=value=>new Intl.NumberFormat('en-US').format(value);
const timing=row=>row.timingCandidates?`${fmt(row.timingCandidates)} across ${fmt(row.timingRecordings)} recordings`:'0';
const visual=row=>row.vssRecordings?`${fmt(row.vssRecordings)} recordings / ${fmt(row.vssChunks)} chunks`:'0';
export function statusMarkdown(report){
  const rows=[...report.sessions,report.additional,report.total];
  return [
    `Snapshot: ${report.asOf}. Counts describe local validated public-processing artifacts, not live remote-worker state.`,
    '',
    '| Session | Passages | Recording jobs | E5 chunks | Validated Canary receipts | Timing candidates | VSS | Human-reviewed timings |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...rows.map(row=>`| ${row.session==='additional'?'Additional imported records':row.session==='total'?'Total':row.session} | ${fmt(row.passages)} | ${row.session==='additional'?'—':fmt(row.recordingJobs)} | ${fmt(row.e5Chunks)} | ${row.session==='additional'?'—':fmt(row.canaryReceipts)} | ${row.session==='additional'?'—':timing(row)} | ${row.session==='additional'?'—':visual(row)} | ${row.session==='additional'?'—':fmt(row.humanReviewedTimings)} |`)
  ].join('\n');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const report=collectSessionStatus();
    console.log(process.argv.includes('--json')?JSON.stringify(report,null,2):statusMarkdown(report));
  }catch(error){
    console.error(error.message);process.exitCode=1;
  }
}
