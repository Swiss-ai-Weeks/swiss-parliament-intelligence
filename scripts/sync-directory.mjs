import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {openParliament,officialDate} from '../server/parliament.mjs';
import {officialPortrait} from '../server/official-portrait.mjs';
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
 const groups=new Map();for(const row of rows){const id=String(row.PersonNumber);if(!row.Active&&!wanted.has(id))continue;groups.set(id,[...(groups.get(id)||[]),row]);}
 for(const[id,members]of groups){
  const active=members.filter(r=>r.Active),candidates=active.length?active:members;if(candidates.length!==1)continue;
  const r=candidates[0],sourceUrl=r.__metadata?.uri;if(!sourceUrl?.startsWith('https://ws.parlament.ch/'))continue;
  const previous=store.get('person',id)||{};
  let image=previous.portraitIdentityVerified?{portraitUrl:previous.portraitUrl,portraitSourceUrl:previous.portraitSourceUrl,portraitIdentityVerified:true}:{portraitUrl:null,portraitIdentityVerified:false};
  if(!image.portraitIdentityVerified)try{image=await officialPortrait(id);}catch{}
  const portraitUrl=image.portraitUrl;
  const payload={...previous,id,name:[r.FirstName,r.LastName].join(' '),active:r.Active,canton:r.CantonAbbreviation,council:r.CouncilName,group:r.ParlGroupName,party:r.PartyName,partyId:String(r.Party),joined:officialDate(r.DateJoining),elected:officialDate(r.DateElection),left:officialDate(r.DateLeaving),portraitUrl,portraitSourceUrl:portraitUrl,profileCoverage:previous.profileCoverage==='enriched-official-profile'?previous.profileCoverage:'official-directory'};
  Object.assign(payload,image);delete payload.sha256;delete payload.retrievedAt;delete payload.sourceUrl;
  const text=JSON.stringify(payload),sha=hash(text);
  store.db.exec('BEGIN');try{store.db.prepare('INSERT OR IGNORE INTO revisions VALUES(?,?,?,?,?)').run('person',id,sha,text,at);store.db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?)').run('person',id,text,sourceUrl,at,sha);store.db.exec('COMMIT');}catch(e){store.db.exec('ROLLBACK');throw e;}
  updated++;if(portraitUrl)portraits++;if(updated%25===0)console.log(JSON.stringify({updated,portraits}));
 }
 console.log(JSON.stringify({status:'complete',updated,portraits,totalImportedPeople:store.people().length,at}));
}finally{store.close();}
