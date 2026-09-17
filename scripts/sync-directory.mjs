import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {openParliament,officialDate} from '../server/parliament.mjs';
// Lightweight official identity import; detailed votes/contacts remain a separate sync.
const store=openParliament(),at=new Date().toISOString(),wanted=new Set(store.people().map(p=>p.id));
const hash=s=>createHash('sha256').update(s).digest('hex');
mkdirSync('data/parliament/raw',{recursive:true});
let updated=0,portraits=0;
try{
 const rows=[];
 for(let skip=0;skip<10000;skip+=500){
  const url=new URL('https://ws.parlament.ch/odata.svc/MemberCouncil');
  for(const[k,v]of Object.entries({'$format':'json','$filter':"Language eq 'FR'",'$orderby':'ID asc','$top':'500','$skip':String(skip),'$select':'ID,PersonNumber,FirstName,LastName,Active,CantonAbbreviation,CouncilName,ParlGroupName,Party,PartyName,DateJoining,DateElection,DateLeaving'}))url.searchParams.set(k,v);
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('OFFICIAL_DIRECTORY_UNAVAILABLE');
  const raw=await response.text(),parsed=JSON.parse(raw),page=parsed.d?.results||parsed.d;if(!Array.isArray(page))throw Error('INVALID_DIRECTORY');
  writeFileSync('data/parliament/raw/'+hash(raw)+'.json',raw);rows.push(...page);if(page.length<500)break;if(skip===9500)throw Error('DIRECTORY_PAGE_LIMIT');
 }
 const groups=new Map();for(const row of rows){const id=String(row.PersonNumber);if(!wanted.has(id))continue;groups.set(id,[...(groups.get(id)||[]),row]);}
 for(const[id,members]of groups){
  const active=members.filter(r=>r.Active),candidates=active.length?active:members;if(candidates.length!==1)continue;
  const r=candidates[0],sourceUrl=r.__metadata?.uri;if(!sourceUrl?.startsWith('https://ws.parlament.ch/'))continue;
  const previous=store.get('person',id)||{};
  const portrait='https://www.parlament.ch/sitecollectionimages/profil/original/'+id+'.jpg';let portraitUrl=previous.portraitUrl||null;
  try{const image=await fetch(portrait,{method:'HEAD',signal:AbortSignal.timeout(5000)});if(image.ok&&image.headers.get('content-type')?.startsWith('image/'))portraitUrl=portrait;}catch{}
  const payload={...previous,id,name:[r.FirstName,r.LastName].join(' '),active:r.Active,canton:r.CantonAbbreviation,council:r.CouncilName,group:r.ParlGroupName,party:r.PartyName,partyId:String(r.Party),joined:officialDate(r.DateJoining),elected:officialDate(r.DateElection),left:officialDate(r.DateLeaving),portraitUrl,portraitSourceUrl:portraitUrl,profileCoverage:previous.profileCoverage==='enriched-official-profile'?previous.profileCoverage:'official-directory'};
  delete payload.sha256;delete payload.retrievedAt;delete payload.sourceUrl;
  const text=JSON.stringify(payload),sha=hash(text);
  store.db.exec('BEGIN');try{store.db.prepare('INSERT OR IGNORE INTO revisions VALUES(?,?,?,?,?)').run('person',id,sha,text,at);store.db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?)').run('person',id,text,sourceUrl,at,sha);store.db.exec('COMMIT');}catch(e){store.db.exec('ROLLBACK');throw e;}
  updated++;if(portraitUrl)portraits++;if(updated%25===0)console.log(JSON.stringify({updated,portraits}));
 }
 console.log(JSON.stringify({status:'complete',updated,portraits,totalImportedPeople:wanted.size,at}));
}finally{store.close();}
