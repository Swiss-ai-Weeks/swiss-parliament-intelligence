import {existsSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {openParliament} from '../server/parliament.mjs';
import {syncPerson} from '../server/profile-import.mjs';
import {buildProfileCoverage} from '../server/profile-coverage.mjs';

const root=resolve(import.meta.dirname,'..'),backlogFile=resolve(root,'data/parliament/profile-backlog.json');
if(!existsSync(backlogFile))throw new Error('PROFILE_BACKLOG_MISSING: run npm run profiles:backlog first');
const backlog=JSON.parse(readFileSync(backlogFile,'utf8'));
if(!Array.isArray(backlog.profiles))throw new Error('INVALID_PROFILE_BACKLOG');
const rawLimit=process.argv.find(value=>value.startsWith('--limit='))?.split('=')[1],limit=rawLimit===undefined?backlog.profiles.length:Number(rawLimit);
if(!Number.isInteger(limit)||limit<0)throw new Error('INVALID_PROFILE_LIMIT');
const selected=backlog.profiles.filter(profile=>profile.profileCoverage!=='enriched-official-profile').slice(0,limit);
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({pending:backlog.totals.pending,selected:selected.map(({id,name,active,missing})=>({id,name,active,missing}))},null,2));process.exit(0);}
const reportFile=resolve(root,'data/parliament/profile-enrichment-run.json'),report={schemaVersion:1,startedAt:new Date().toISOString(),requested:selected.length,completed:[],failed:[]};
const save=()=>{const temporary=`${reportFile}.tmp`;writeFileSync(temporary,JSON.stringify(report,null,2));renameSync(temporary,reportFile);};save();
const store=openParliament(resolve(root,'data/parliament.sqlite'));
try{
 for(const [index,profile] of selected.entries()){
  console.log(`Profile ${index+1}/${selected.length}: ${profile.name} (${profile.id})`);const startedAt=new Date().toISOString();
  try{const updated=await syncPerson(store,String(profile.id),{rawDir:resolve(root,'data/parliament/raw')});report.completed.push({id:profile.id,name:profile.name,startedAt,finishedAt:new Date().toISOString(),voteCount:updated?.votes?.length??0,contacts:updated?.contacts?.length??0,portrait:Boolean(updated.portraitIdentityVerified)});}
  catch(error){report.failed.push({id:profile.id,name:profile.name,startedAt,finishedAt:new Date().toISOString(),error:error.message});console.error(`${profile.id}: ${error.message}`);}save();
 }
}finally{store.close();}
const refreshed=openParliament(resolve(root,'data/parliament.sqlite'));try{const current=buildProfileCoverage(refreshed),temporary=`${backlogFile}.tmp`;writeFileSync(temporary,JSON.stringify(current,null,2));renameSync(temporary,backlogFile);report.totals=current.totals;}finally{refreshed.close();}
report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({requested:report.requested,completed:report.completed.length,failed:report.failed.length,totals:report.totals},null,2));if(report.failed.length)process.exitCode=1;
