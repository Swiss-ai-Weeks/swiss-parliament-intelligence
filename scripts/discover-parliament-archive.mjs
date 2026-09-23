import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {officialDate} from '../server/parliament.mjs';

const root=resolve(import.meta.dirname,'..');
const data=resolve(root,'data');
const archiveDir=resolve(data,'parliament/archive');
const responses=resolve(archiveDir,'responses');
mkdirSync(responses,{recursive:true});
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const year=value=>{const parsed=Number(value);if(!Number.isInteger(parsed)||parsed<1848||parsed>2100)throw new Error(`INVALID_${value}_YEAR`);return parsed;};
const fromYear=year(arg('from-year')||1990),toYear=year(arg('to-year')||new Date().getUTCFullYear());
if(fromYear>toYear)throw new Error('INVALID_ARCHIVE_BOUNDARY');
const offline=process.argv.includes('--offline');
const hash=value=>createHash('sha256').update(value).digest('hex');
const writeAtomic=(file,value)=>{const temporary=`${file}.tmp`;writeFileSync(temporary,JSON.stringify(value,null,2));renameSync(temporary,file);};

async function page(url){
  const file=resolve(responses,`${hash(url)}.json`);
  if(offline){if(!existsSync(file))throw new Error(`OFFLINE_SNAPSHOT_MISSING ${url}`);const saved=JSON.parse(readFileSync(file,'utf8'));if(hash(saved.raw)!==saved.sha256)throw new Error('ARCHIVE_SNAPSHOT_CHECKSUM_MISMATCH');return saved;}
  const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(`SESSION_DISCOVERY_${response.status}`);
  const raw=await response.text();const saved={url,retrievedAt:new Date().toISOString(),raw,sha256:hash(raw)};writeAtomic(file,saved);return saved;
}

async function discover(){
  const sessions=[];
  for(let skip=0;skip<10000;skip+=200){
    const url=new URL('Session','https://ws.parlament.ch/odata.svc/');
    for(const [key,value] of Object.entries({'$format':'json','$filter':"Language eq 'FR'",'$orderby':'ID asc','$top':'200','$skip':String(skip)}))url.searchParams.set(key,value);
    const saved=await page(url.href),json=JSON.parse(saved.raw),rows=Array.isArray(json.d)?json.d:json.d?.results;
    if(!Array.isArray(rows))throw new Error('INVALID_SESSION_DISCOVERY_RESPONSE');
    sessions.push(...rows);process.stdout.write(`\rDiscovered ${sessions.length} official sessions`);
    if(rows.length<200)break;
  }
  process.stdout.write('\n');return sessions;
}

const readJson=file=>{try{return JSON.parse(readFileSync(file,'utf8'));}catch{return null;}};
const stage=(complete,total,failed=0)=>failed?'attention':total&&complete>=total?'complete':complete?'partial':'pending';
const parliamentFile=resolve(data,'parliament.sqlite');
const parliament=existsSync(parliamentFile)?new DatabaseSync(parliamentFile,{readOnly:true}):null;
const processingFile=resolve(data,'public-processing.sqlite');
const processing=existsSync(processingFile)?new DatabaseSync(processingFile,{readOnly:true}):null;
const embeddingsFile=resolve(data,'public-embeddings.sqlite');
const embeddings=existsSync(embeddingsFile)?new DatabaseSync(embeddingsFile,{readOnly:true}):null;
try{
  const imported=new Map(parliament?parliament.prepare("SELECT id,payload FROM records WHERE kind='session'").all().map(row=>[String(row.id),JSON.parse(row.payload)]):[]);
  const passages=new Map(parliament?parliament.prepare("SELECT json_extract(payload,'$.sessionId') session,count(*) n FROM records WHERE kind='speech' GROUP BY session").all().map(row=>[String(row.session),Number(row.n)]):[]);
  const receipts=new Map(processing?processing.prepare('SELECT session,count(*) n FROM transcripts GROUP BY session').all().map(row=>[String(row.session),Number(row.n)]):[]);
  const passageSession=new Map(parliament?parliament.prepare("SELECT id,json_extract(payload,'$.sessionId') session FROM records WHERE kind='speech'").all().map(row=>[String(row.id),String(row.session)]):[]);
  const chunks=new Map();
  if(embeddings)for(const row of embeddings.prepare('SELECT metadata FROM embeddings').iterate()){const session=passageSession.get(String(JSON.parse(row.metadata).id));if(session)chunks.set(session,(chunks.get(session)||0)+1);}
  const official=await discover(),seen=new Set(),sessions=[];
  for(const row of official){
    const id=String(row.ID),start=officialDate(row.StartDate),end=officialDate(row.EndDate);if(seen.has(id)||!start)continue;seen.add(id);
    const sessionYear=Number(start.slice(0,4));if(sessionYear<fromYear||sessionYear>toYear)continue;
    const directory=resolve(data,`parliament/session-${id}`),jobs=readJson(resolve(directory,'media-jobs.json'))||[],progress=readJson(resolve(directory,'progress.json'));
    const asr=receipts.get(id)||0,e5=chunks.get(id)||0,textPassages=passages.get(id)||0,mediaComplete=jobs.filter(job=>job.mediaSha256||job.stage==='downloaded'||job.asr==='complete').length;
    const mediaFailed=jobs.filter(job=>job.stage==='failed').length,alignment=jobs.reduce((sum,job)=>sum+Number(job.alignedParagraphs||0),0);
    const textComplete=imported.get(id)?.ingestion?.status==='text-indexed';
    sessions.push({id,title:row.SessionName,start,end,type:row.TypeName,officialSource:row.__metadata?.uri,retrievedAt:new Date().toISOString(),coverage:{officialTextPassages:textPassages,recordingJobs:jobs.length,mediaResolved:mediaComplete,mediaFailed,canaryReceipts:asr,e5Chunks:e5,timingCandidates:alignment},stages:{text:progress?.status==='failed'?'attention':textComplete?'complete':textPassages?'partial':'pending',media:stage(mediaComplete,jobs.length,mediaFailed),asr:stage(asr,jobs.length),embeddings:stage(e5,textPassages),alignment:alignment?'partial':'pending'}});
  }
  sessions.sort((a,b)=>b.start.localeCompare(a.start));
  const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),boundary:{fromYear,toYear,definition:'All French-language Session records returned by the official Swiss Parliament OData service whose start date falls inside this inclusive year range.'},source:{name:'Swiss Parliament OData Session',url:'https://ws.parlament.ch/odata.svc/Session',language:'FR'},sessions};
  writeAtomic(resolve(data,'parliament/archive-manifest.json'),manifest);
  const queue=sessions.filter(session=>session.stages.text!=='complete').map(session=>({sessionId:session.id,start:session.start,title:session.title,command:`node scripts/ingest-session.mjs --session=${session.id}`,state:session.stages.text}));
  writeAtomic(resolve(data,'parliament/archive-text-queue.json'),{schemaVersion:1,generatedAt:manifest.generatedAt,boundary:manifest.boundary,sessions:queue});
  console.log(JSON.stringify({boundary:manifest.boundary,sessions:sessions.length,textComplete:sessions.filter(session=>session.stages.text==='complete').length,textQueued:queue.length},null,2));
}finally{parliament?.close();processing?.close();embeddings?.close();}
