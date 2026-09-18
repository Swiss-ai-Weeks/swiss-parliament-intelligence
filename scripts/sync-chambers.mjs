// Parse official literal geometry; never evaluate downloaded JavaScript.
import {readFileSync,writeFileSync,mkdirSync,renameSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateChamber} from '../server/chambers.mjs';
import {openParliament,officialDate} from '../server/parliament.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const at=new Date().toISOString(),asOf=at.slice(0,10),dir='server/chamber-snapshots/';mkdirSync(dir,{recursive:true});mkdirSync('data/chamber',{recursive:true});
const sources=[];
async function load(url){const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('SOURCE_UNAVAILABLE '+url);const text=await r.text();sources.push({url,retrievedAt:new Date().toISOString(),sha256:hash(text)});writeFileSync('data/chamber/'+hash(text)+'.txt',text);return text;}
async function query(table){const u=new URL('https://ws.parlament.ch/odata.svc/'+table);u.searchParams.set('$format','json');u.searchParams.set('$filter',"Language eq 'DE'"+(table==='MemberCouncil'?' and Active eq true':''));const j=JSON.parse(await load(u.href));if(j.d?.__next)throw Error('PAGINATED_SOURCE_REQUIRES_REVIEW');const rows=j.d?.results||j.d;if(!Array.isArray(rows))throw Error('INVALID_SOURCE');return rows;}
const bundle=await load('https://www.parlament.ch/JavascriptBundleLoader.js?v=1983687063');
const roster=await query('MemberCouncil'),store=openParliament();
const groupColors={0:'#826E1A',3:'#FB7203',1:'#0044D5',136:'#ffe540',4:'#007832',6:'#03F61A',137:'#7e3874',2:'#FF0000',139:'#FB7203'};
// App display palette: identities come exclusively from the roster. Group colours
// reproduce the official seating app; party hues are labelled as presentation colours.
const partyColors={12:'#d5202f',13:'#36833c',15:'#0065ab',16:'#0065ab',18:'#e6b824',20:'#65a531',23:'#235b92',24:'#bc3336',26:'#77776d',1336:'#9cbf38',1576:'#d89b22',1584:'#65a531',1586:'#ed7b24'};
const snapshots=[];
try{for(const [chamber,table,v,council]of [['nr','SeatOrganisationNr','D',1],['sr','SeatOrganisationSr','P',2]]){
 const pageUrl='https://www.parlament.ch/de/organe/'+(chamber==='nr'?'nationalrat/sitzordnung-nr':'staenderat/sitzordnung-sr'),page=await load(pageUrl);
 const rows=await query(table),members=roster.filter(x=>x.Council===council),geometry=new Map([...bundle.matchAll(new RegExp('l\\('+v+',(\\d+),"([^"]+)","([^"]+)","([^"]+)"\\)','g'))].map(x=>[Number(x[1]),{path:x[2],x:Number(x[3]),y:Number(x[4])}]));
 if(rows.length!==members.length)throw Error('ROSTER_CAPACITY_CONFLICT');
 const seats=rows.map(r=>{const matches=members.filter(x=>x.PersonNumber===r.PersonNumber);if(matches.length!==1)throw Error('AMBIGUOUS_MEMBER_ID');const m=matches[0];if(m.ParlGroupNumber!==r.ParlGroupNumber||m.CantonAbbreviation!==r.CantonAbbreviation)throw Error('MEMBERSHIP_CONFLICT');const previous=store.get('person',String(m.PersonNumber));return {seatId:String(r.SeatNumber),geometry:geometry.get(r.SeatNumber),status:'occupied',verifiedAt:asOf,sourceUrl:r.__metadata.uri,member:{id:String(m.PersonNumber),chamber,name:m.FirstName+' '+m.LastName,canton:m.CantonAbbreviation,partyId:String(m.Party),groupId:String(m.ParlGroupNumber??'independent'),party:m.PartyName,partyAbbreviation:m.PartyAbbreviation==='-'?'Independent':m.PartyAbbreviation,group:m.ParlGroupName||'Independent',groupAbbreviation:m.ParlGroupAbbreviation||'Independent',joined:officialDate(m.DateJoining),left:officialDate(m.DateLeaving),sourceUrl:m.__metadata.uri,portraitUrl:previous?.portraitIdentityVerified?previous.portraitUrl:null}};});
 if(new Set(members.map(x=>String(x.PersonNumber))).size!==seats.length)throw Error('ROSTER_DUPLICATES');
 const legend=(key,name,abbreviation,colors)=>[...new Set(seats.map(s=>s.member[key]))].map((id,index)=>{const rows=seats.filter(s=>s.member[key]===id);return {id,name:rows[0].member[name],abbreviation:rows[0].member[abbreviation],count:rows.length,color:colors[id]||'#77776d',pattern:index%4};}).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 const background=page.match(/<g class="background">([\s\S]*?)<\/g>/)?.[1]||'';
 const architecture=[...background.matchAll(/<path\s[^>]*d="([^"]+)"/g)].map(x=>x[1]);
 if(!architecture.length)throw Error('MISSING_ROOM_OUTLINE');
 const s={schemaVersion:1,chamber,capacity:chamber==='nr'?200:46,asOf,retrievedAt:at,effectiveFrom:null,effectiveUntil:null,dateBasis:'Official live seating service and active roster reconciled on retrieval date; not a historical effective-date assertion.',verification:'verified',geometrySource:'Official Parliament interactive seating app; literal SVG desk paths unchanged.',colorBasis:'Party presentation hues; parliamentary-group colours from the official seating application. Patterns and labels distinguish similar hues.',viewBox:[0,0,860,565],architecture,seats,parties:legend('partyId','party','partyAbbreviation',partyColors),groups:legend('groupId','group','groupAbbreviation',groupColors),sources:[...sources],officialPlanUrl:pageUrl};
 validateChamber(s);s.version=asOf+'-'+hash(JSON.stringify(s)).slice(0,12);snapshots.push(s);
 }
 // Re-read before publication: membership changes during import invalidate the batch.
 const final=await query('MemberCouncil');if(JSON.stringify(roster)!==JSON.stringify(final))throw Error('ROSTER_CHANGED_DURING_IMPORT');
 const manifest=existsSync(dir+'manifest.json')?JSON.parse(readFileSync(dir+'manifest.json','utf8')):{};
 for(const s of snapshots){writeFileSync(dir+s.chamber+'-'+s.version+'.json',JSON.stringify(s,null,2),{flag:'wx'});manifest[s.chamber]=s.version;}
 writeFileSync(dir+'manifest.next.json',JSON.stringify(manifest,null,2));renameSync(dir+'manifest.next.json',dir+'manifest.json');
 console.log(JSON.stringify(snapshots.map(s=>({chamber:s.chamber,version:s.version,...validateChamber(s)}))));
}finally{store.close();}
