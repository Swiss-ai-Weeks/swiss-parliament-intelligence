import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {openParliament,officialDate} from '../server/parliament.mjs';
const root='data/parliament';mkdirSync(root,{recursive:true});
const now=new Date(),date=now.toISOString().slice(0,10);
async function get(entity,filter,extra={}){const u=new URL(entity,'https://ws.parlament.ch/odata.svc/');for(const[k,v]of Object.entries({'$format':'json','$filter':filter,...extra}))u.searchParams.set(k,v);const r=await fetch(u,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error('Official API '+r.status);const j=await r.json();return {url:u.href,retrievedAt:new Date().toISOString(),rows:Array.isArray(j.d)?j.d:j.d.results};}
const sessions=await get('Session',`Language eq 'FR' and StartDate le datetime'${date}T23:59:59' and EndDate ge datetime'${date}T00:00:00'`);
if(sessions.rows.length!==1)throw new Error('No unique current session; choose a reviewed session explicitly.');
const session=sessions.rows[0];const votes=await get('Vote',`Language eq 'FR' and IdSession eq ${session.ID}`,{'$orderby':'ID desc','$top':'20'});
const ids=[...new Set(votes.rows.map(v=>String(v.BusinessNumber)))].slice(0,4);
const file=`${root}/session-${session.ID}-checkpoint.json`;
const checkpoint=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{sessionId:session.ID,completed:[]};
writeFileSync(`${root}/session-${session.ID}-discovery.json`,JSON.stringify({sessions,votes},null,2));
for(const id of ids){if(checkpoint.completed.includes(id)&&!process.argv.includes('--refresh')){console.log('Already imported',id);continue;}const r=spawnSync(process.execPath,['scripts/sync-parliament.mjs','--business='+id,'--recent=0','--members=false'],{stdio:'inherit'});if(r.status!==0)throw new Error('Import failed; checkpoint retained for '+id);if(!checkpoint.completed.includes(id))checkpoint.completed.push(id);checkpoint.updatedAt=new Date().toISOString();writeFileSync(file,JSON.stringify(checkpoint,null,2));}
const db=openParliament();const payload={id:String(session.ID),title:session.SessionName,start:officialDate(session.StartDate),end:officialDate(session.EndDate),businessIds:ids,coverage:'Four most recent distinct proposals among the latest twenty published session roll calls; not the entire session.'};db.db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?)').run('session',payload.id,JSON.stringify(payload),sessions.url,sessions.retrievedAt,createHash('sha256').update(JSON.stringify(payload)).digest('hex'));db.close();console.log('Current session import complete:',payload.title,ids);
