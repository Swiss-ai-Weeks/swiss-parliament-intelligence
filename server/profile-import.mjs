import {memberBiography} from './member-biography.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {officialPortrait} from './official-portrait.mjs';
import {officialDate,plainText} from './parliament.mjs';
const base='https://ws.parlament.ch/odata.svc/';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function safeContact(address){
 const value=String(address||'').trim();
 if(/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@parl\.ch$/i.test(value))return {kind:'email',value,href:'mailto:'+value};
 try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password)return {kind:'website',value:u.hostname,href:u.href};}catch{}
 return null;
}
export async function collectVotingHistory(query,{pageSize=500,pageLimit=200}={}){
 if(!Number.isInteger(pageSize)||pageSize<1||!Number.isInteger(pageLimit)||pageLimit<1)throw new Error('INVALID_VOTE_PAGINATION');
 const votes=[];let complete=false;
 for(let pageNumber=0;pageNumber<pageLimit;pageNumber++){
  const page=await query('Voting',{'$orderby':'ID asc','$top':String(pageSize),'$skip':String(pageNumber*pageSize)});
  votes.push(...page);if(page.length<pageSize){complete=true;break;}
 }
 if(!complete)throw new Error('VOTE_HISTORY_PAGE_LIMIT');
 if(new Set(votes.map(v=>v.ID)).size!==votes.length)throw new Error('UNSTABLE_VOTE_PAGINATION');
 return votes;
}
export async function syncPerson(store,id,{fetchImpl=fetch,rawDir='data/parliament/raw',votePageSize=500,votePageLimit=200}={}){
 if(!/^\d{1,6}$/.test(id)||!store.people().some(p=>p.id===id))throw new Error('UNKNOWN_PERSON');
 mkdirSync(rawDir,{recursive:true});const started=new Date().toISOString(),queries=[];
 async function query(table,extra={}){
  const u=new URL(table,base);u.searchParams.set('$format','json');u.searchParams.set('$filter',`PersonNumber eq ${id} and Language eq 'FR'`);for(const[k,v]of Object.entries(extra))u.searchParams.set(k,v);
  const r=await fetchImpl(u,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error('OFFICIAL_SOURCE_UNAVAILABLE');const raw=await r.text(),j=JSON.parse(raw),rows=j.d?.results||j.d;if(!Array.isArray(rows))throw new Error('INVALID_OFFICIAL_RESPONSE');
  const sha=hash(raw);writeFileSync(rawDir+'/'+sha+'.json',raw);queries.push({url:u.href,sha256:sha,rows:rows.length,retrievedAt:new Date().toISOString()});return rows;
 }
 const [members,contacts,occupations,committees,history]=await Promise.all([
  query('MemberCouncil',{'$select':'ID,Language,PersonNumber,FirstName,LastName,Active,CantonAbbreviation,CouncilName,ParlGroupName,Party,PartyName,DateJoining,DateElection,DateLeaving,Mandates'}),
  query('PersonCommunication',{'$select':'ID,Language,PersonNumber,Address,CommunicationTypeText'}),
  query('PersonOccupation',{'$select':'ID,Language,PersonNumber,OccupationName,Employer,JobTitle,StartDate,EndDate'}),query('MemberCommittee',{'$select':'ID,Language,PersonNumber,CommitteeName,CommitteeFunctionName'}),query('MemberCouncilHistory')]);
 if(members.length!==1)throw new Error('AMBIGUOUS_MEMBERSHIP');const r=members[0];
 const votes=await collectVotingHistory(query,{pageSize:votePageSize,pageLimit:votePageLimit});
 let portrait={portraitUrl:null,portraitIdentityVerified:false};
 try{portrait=await officialPortrait(id,fetchImpl);}catch{}
 const portraitUrl=portrait.portraitUrl;
 const profile={id,name:[r.FirstName,r.LastName].join(' '),active:r.Active,canton:r.CantonAbbreviation,council:r.CouncilName,group:r.ParlGroupName,party:r.PartyName,partyId:String(r.Party),joined:officialDate(r.DateJoining),elected:officialDate(r.DateElection),left:officialDate(r.DateLeaving),declaredMandates:plainText(r.Mandates),portraitUrl,
  contacts:contacts.flatMap(c=>{const safe=safeContact(c.Address);return safe?[{...safe,sourceUrl:c.__metadata.uri}]:[];}),
  occupations:occupations.map(o=>({title:o.OccupationName,employer:o.Employer,role:o.JobTitle,start:officialDate(o.StartDate),end:officialDate(o.EndDate),sourceUrl:o.__metadata.uri})),
  committees:committees.map(c=>({name:c.CommitteeName,role:c.CommitteeFunctionName,sourceUrl:c.__metadata.uri})),
  profileCoverage:'enriched-official-profile',voteHistory:{status:'complete-service-query',count:votes.length,retrievedAt:started,scope:'All individual roll-call records returned by the official Voting service for this person. National Council service coverage; not all political decisions or a guarantee of a complete career archive.'}};
 Object.assign(profile,memberBiography(r,history));const previous=store.get('person',id);Object.assign(profile,portrait.portraitIdentityVerified?portrait:previous?.portraitIdentityVerified?{portraitUrl:previous.portraitUrl,portraitSourceUrl:previous.portraitSourceUrl,portraitIdentityVerified:true}:portrait);
 function put(kind,row,payload){const text=JSON.stringify(payload),sha=hash(text),url=row.__metadata?.uri;if(!url?.startsWith('https://ws.parlament.ch/'))throw new Error('MISSING_PROVENANCE');store.db.prepare('INSERT OR IGNORE INTO revisions VALUES(?,?,?,?,?)').run(kind,payload.id,sha,text,started);store.db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?)').run(kind,payload.id,text,url,started,sha);}
 store.db.exec('BEGIN');try{
  put('person',r,profile);
  for(const v of votes)put('voting',v,{id:String(v.ID),voteId:String(v.IdVote),businessId:String(v.BusinessNumber),personId:id,personName:profile.name,canton:v.Canton,group:v.ParlGroupNameAbbreviation,decisionCode:v.Decision,decisionText:v.DecisionText,title:v.BusinessTitle,subject:v.Subject,billTitle:v.BillTitle,meaningYes:v.MeaningYes,meaningNo:v.MeaningNo,date:officialDate(v.VoteEndWithTimezone||v.VoteEnd)});
  store.db.prepare('INSERT OR REPLACE INTO runs VALUES(?,?)').run(started,JSON.stringify({id:started,personId:id,status:'complete',finished:new Date().toISOString(),queries}));store.db.exec('COMMIT');
 }catch(e){store.db.exec('ROLLBACK');throw e;}
 return store.person(id);
}
