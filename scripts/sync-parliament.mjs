import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openParliament,plainText,officialDate,statusGroup} from '../server/parliament.mjs';
const flags=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const business=flags.business||'20230073';if(!/^\d{8}$/.test(business))throw new Error('Use an eight-digit official business ID');
const recent=Number(flags.recent??100);if(!Number.isInteger(recent)||recent<0||recent>1000)throw new Error('recent must be 0–1000');
const base='https://ws.parlament.ch/odata.svc/';const started=new Date().toISOString();const db=openParliament();const run={id:started,businessId:business,started,queries:[],status:'running'};
mkdirSync('data/parliament/raw',{recursive:true});
const cached=flags.cached==='true'?JSON.parse(readFileSync('data/parliament/last-run.json','utf8')):null;
let transaction=false;let sourceRetrievedAt=started;
const hash=t=>createHash('sha256').update(t).digest('hex');
async function query(table,filter,extra={}){
 const u=new URL(table,base);u.searchParams.set('$format','json');u.searchParams.set('$filter',filter);for(const[k,v]of Object.entries(extra))u.searchParams.set(k,String(v));
 let url=u.href;const result=[];let pages=0;
 while(url){if(++pages>100)throw new Error('Pagination cap reached; split import');if(new URL(url).origin!==new URL(base).origin)throw new Error('Foreign pagination origin');
  const entry=cached?.queries.find(q=>q.url===url);if(cached&&!entry)throw new Error('No cached official response for '+url);
  let raw;if(entry){raw=readFileSync(`data/parliament/raw/${entry.sha256}.json`,'utf8');if(hash(raw)!==entry.sha256)throw new Error('Cache hash mismatch');}else{const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error(`Official API ${response.status}: ${table}`);raw=await response.text();}const j=JSON.parse(raw);const rows=Array.isArray(j.d)?j.d:j.d?.results;if(!Array.isArray(rows))throw new Error('Unexpected OData response');
  sourceRetrievedAt=entry?.retrievedAt||new Date().toISOString();
  const sha=hash(raw);writeFileSync(`data/parliament/raw/${sha}.json`,raw);run.queries.push({url,sha256:sha,rows:rows.length,retrievedAt:entry?.retrievedAt||new Date().toISOString()});result.push(...rows);url=j.d?.__next?new URL(j.d.__next,base).href:null;
 }
 console.log(`${table}: ${result.length} official records`);return result;
}
function put(kind,row,payload){const text=JSON.stringify(payload);const sha=hash(text);const source=row.__metadata?.uri;if(!source?.startsWith('https://ws.parlament.ch/'))throw new Error('Missing official provenance');const now=sourceRetrievedAt;
 db.db.prepare('INSERT OR IGNORE INTO revisions VALUES(?,?,?,?,?)').run(kind,String(payload.id),sha,text,now);
 db.db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?)').run(kind,String(payload.id),text,source,now,sha);
}
const businessRow=r=>({id:String(r.ID),number:r.BusinessShortNumber,title:plainText(r.Title),type:r.BusinessTypeName,status:r.BusinessStatusText,statusCode:r.BusinessStatus,statusGroup:statusGroup(r.BusinessStatusText),statusDate:officialDate(r.BusinessStatusDate),submitted:officialDate(r.SubmissionDate),modified:officialDate(r.Modified),sourceLanguage:r.Language.toLowerCase(),officialUrl:`https://www.parlament.ch/fr/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=${r.ID}`});
try{
 const rows=await query('Business',`ID eq ${business} and Language eq 'FR'`);if(rows.length!==1)throw new Error('Official business not uniquely found');
 for(const r of rows)put('business',r,businessRow(r));
 if(recent)for(const r of await query('Business',"Language eq 'FR'",{'$orderby':'Modified desc,ID desc','$top':recent}))put('business',r,businessRow(r));
 for(const r of await query('BusinessStatus',`BusinessNumber eq ${business} and Language eq 'FR'`))put('event',r,{id:String(r.ID),businessId:business,label:r.BusinessStatusName,date:officialDate(r.BusinessStatusDate)});
 db.db.exec('BEGIN');transaction=true;
 db.db.prepare("DELETE FROM speech_search WHERE business_id=?").run(business);
 db.db.prepare("DELETE FROM records WHERE kind='speech' AND json_extract(payload,'$.businessId')=?").run(business);
 const subjects=await query('SubjectBusiness',`BusinessNumber eq ${business} and Language eq 'FR'`);
 for(const subject of subjects){for(const r of await query('Transcript',`IdSubject eq ${subject.IdSubject}L and Language eq 'FR'`)){
  const text=plainText(r.Text);if(!text||r.DisplaySpeaker!==true||!r.LanguageOfText)continue; // Exclude procedural/bill text that carries a chair ID but is not displayed as speech.
  // Paragraph chunks preserve official speaker/context and never invent video offsets.
  const paras=String(r.Text).split(/<\/p>/i).map(plainText).filter(Boolean);
  for(const [i,text]of paras.entries()){const id=`${r.ID}-${i}`;const payload={id,transcriptId:String(r.ID),businessId:business,subjectId:String(subject.IdSubject),personId:r.PersonNumber?String(r.PersonNumber):null,speaker:r.SpeakerFullName||[r.SpeakerFirstName,r.SpeakerLastName].filter(Boolean).join(' ')||'Procedural record',speakerFunction:r.SpeakerFunction,roleReview:'unreviewed',language:(r.LanguageOfText||r.Language).toLowerCase(),date:officialDate(r.StartTimeWithTimezone||r.Start),text,council:r.CouncilName,group:r.ParlGroupAbbreviation,officialUrl:`https://www.parlament.ch/fr/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-die-verhandlungen?SubjectId=${subject.IdSubject}&TranscriptId=${r.ID}`,videoStatus:'not-aligned',reviewState:'official-bulletin-import'};
   put('speech',r,payload);db.db.prepare('DELETE FROM speech_search WHERE id=?').run(id);db.db.prepare('INSERT INTO speech_search(id,person_id,business_id,text) VALUES(?,?,?,?)').run(id,payload.personId,business,text);
  }
 }}
 db.db.exec('COMMIT');transaction=false;
 for(const r of await query('Vote',`BusinessNumber eq ${business} and Language eq 'FR'`))put('vote',r,{id:String(r.ID),businessId:business,title:r.BusinessTitle,subject:r.Subject,billNumber:r.BillNumber,billTitle:r.BillTitle,meaningYes:r.MeaningYes,meaningNo:r.MeaningNo,date:officialDate(r.VoteEndWithTimezone||r.VoteEnd),session:r.IdSession,chamber:'National Council (this vote service)',officialUrl:r.__metadata.uri});
 // The official service times out on broad Voting/BusinessNumber scans.
 // IdVote queries use its indexed access path and retain individual decision labels.
 for(const vote of db.votes().filter(v=>v.businessId===business))for(const r of await query('Voting',`IdVote eq ${vote.id} and Language eq 'FR'`))put('voting',r,{id:String(r.ID),voteId:String(r.IdVote),businessId:business,personId:r.PersonNumber?String(r.PersonNumber):null,personName:[r.FirstName,r.LastName].join(' '),canton:r.Canton,group:r.ParlGroupNameAbbreviation,decisionCode:r.Decision,decisionText:r.DecisionText,subject:r.Subject,billTitle:r.BillTitle,meaningYes:r.MeaningYes,meaningNo:r.MeaningNo,date:officialDate(r.VoteEndWithTimezone||r.VoteEnd)});
 const fields='ID,Language,PersonNumber,FirstName,LastName,Active,CantonAbbreviation,CouncilName,ParlGroupName,Party,PartyName,DateJoining,DateLeaving';
 for(const r of flags.members==='false'?[]:await query('MemberCouncil',"Language eq 'FR' and Active eq true",{'$select':fields}))put('person',r,{...db.get('person',r.PersonNumber),id:String(r.PersonNumber),name:[r.FirstName,r.LastName].join(' '),active:r.Active,canton:r.CantonAbbreviation,council:r.CouncilName,group:r.ParlGroupName,party:r.PartyName,partyId:String(r.Party),joined:officialDate(r.DateJoining),left:officialDate(r.DateLeaving),profileCoverage:db.get('person',r.PersonNumber)?.profileCoverage||'current-official-membership'});
 run.status='complete';
}catch(e){if(transaction)db.db.exec('ROLLBACK');run.status='failed';run.error=e.message;process.exitCode=1;console.error(e.message);}finally{run.finished=new Date().toISOString();run.sourceRetrievedAt=run.queries.map(q=>q.retrievedAt).sort().at(-1)||null;run.reprocessedFromCache=!!cached;db.db.prepare('INSERT OR REPLACE INTO runs VALUES(?,?)').run(run.id,JSON.stringify(run));writeFileSync('data/parliament/last-run.json',JSON.stringify(run,null,2));console.log(JSON.stringify(db.overview().counts));db.close();}
