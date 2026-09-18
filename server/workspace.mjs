import {readFileSync,writeFileSync,mkdirSync,renameSync,existsSync} from 'node:fs';
import {officialDate} from './parliament.mjs';
export const zurichDate=(value=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function parseSessionSchedule(html,year=new Date().getUTCFullYear()){
 const text=html.replace(/<[^>]*>/g,' ').replace(/&#58;/g,':').replace(/&#160;|&nbsp;/g,' ').replace(/[\u200b-\u200f\ufeff]/g,'').replace(/\s+/g,' '),sourceUrl='https://www.parlament.ch/en/ratsbetrieb/sessions/schedule',events=[];
 const months='January February March April May June July August September October November December'.split(' '),iso=(y,m,d)=>`${y}-${String(months.indexOf(m)+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 for(const y of [year,year+1]){const block=text.split('Schedule of sessions '+y)[1]?.split('SPECIAL SESSION')[0];if(!block)continue;for(const match of block.matchAll(/(Spring|Summer|Autumn|Winter):\s*(\d{1,2})\s*(\w+)?\s*[–−-]\s*(\d{1,2})\s*(\w+)/g)){const[,season,d1,m1,d2,m2]=match;if(!months.includes(m2)||m1&&!months.includes(m1))throw Error('UNRECOGNISED_CALENDAR_MONTH');events.push({id:`session-${y}-${season.toLowerCase()}`,type:'session',title:season+' session '+y,date:iso(y,m1||m2,d1),endDate:iso(y,m2,d2),time:null,timeZone:'Europe/Zurich',status:'scheduled',sourceUrl,officialUrl:sourceUrl});}}
 if(events.length<4)throw Error('PUBLISHED_CALENDAR_FORMAT_CHANGED');return events;
}
export function broadcastState(record,now=Date.now()){
 return record?.verified===true&&record?.state==='live'&&now-Date.parse(record.checkedAt)<90000&&now>=Date.parse(record.checkedAt)?'live':'unverified';
}
export const publisherAdapters=[
 {id:'srf',name:'SRF',url:'https://www.srf.ch/news/schweiz',feedDirectory:'https://www.srf.ch/really-simple-syndication-rss-feeds-von-srf',status:'link-only',reason:'SRG reuse permission required',terms:'https://www.srgssr.ch/de/nutzungsbedingungen',reviewedAt:'2026-09-18'},
 {id:'rts',name:'RTS',url:'https://www.rts.ch/info/suisse/',status:'link-only',reason:'Feed and republication permission not verified',terms:'https://www.srgssr.ch/de/nutzungsbedingungen',reviewedAt:'2026-09-18'},
 {id:'swi',name:'SWI swissinfo',url:'https://www.swissinfo.ch/eng/swiss-politics',status:'link-only',reason:'Feed and republication permission not verified',terms:'https://www.srgssr.ch/de/nutzungsbedingungen',reviewedAt:'2026-09-18'}
];
export function workspaceService({par,fetchImpl=fetch,directory='data/workspace'}={}){
 let agendaCache=null,pending=null;mkdirSync(directory,{recursive:true});
 try{agendaCache=JSON.parse(readFileSync(directory+'/agenda.json','utf8'));}catch{}
 async function agenda(){
  if(agendaCache?.schemaVersion===2&&Date.now()-Date.parse(agendaCache.retrievedAt)<3600000)return {...agendaCache,stale:false};
  if(pending)return pending;
  pending=(async()=>{try{const rows=[],sources=[];for(let skip=0;skip<3000;skip+=500){const u=new URL('https://ws.parlament.ch/odata.svc/Meeting');const since=new Date(Date.now()-120*86400000).toISOString().slice(0,10);for(const[k,v]of Object.entries({'$format':'json','$filter':`Language eq 'FR' and Date ge datetime'${since}T00:00:00'`,'$orderby':'ID asc','$top':'500','$skip':String(skip)}))u.searchParams.set(k,v);const r=await fetchImpl(u,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('AGENDA_UNAVAILABLE');const j=await r.json(),page=j.d?.results||j.d;if(!Array.isArray(page))throw Error('INVALID_AGENDA');sources.push(u.href);rows.push(...page);if(page.length<500)break;if(skip===2500)throw Error('AGENDA_PAGE_LIMIT');}
    if(new Set(rows.map(r=>r.ID)).size!==rows.length)throw Error('UNSTABLE_AGENDA');
    const days=new Set(par().speeches().map(s=>s.sessionId+':'+zurichDate(s.date))),retrievedAt=new Date().toISOString();
    const events=rows.filter(r=>[1,2].includes(r.Council)).map(r=>{const date=officialDate(r.Date)?.slice(0,10);if(!date)throw Error('INVALID_MEETING_DATE');return {id:'meeting-'+r.ID,type:'sitting',title:r.MeetingOrderText+' · '+r.CouncilName,sessionId:String(r.IdSession),chamber:r.Council===1?'nr':'sr',date,time:/^\d{4}$/.test(r.Begin)?r.Begin.slice(0,2)+':'+r.Begin.slice(2):null,timeZone:'Europe/Zurich',status:days.has(r.IdSession+':'+date)&&date<zurichDate()?'completed':'scheduled',publicationStatus:r.PublicationStatus,sourceUrl:r.__metadata.uri,officialUrl:'https://www.parlament.ch/fr/ratsbetrieb/sessions',modified:officialDate(r.Modified)};}).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
    const calendarUrl='https://www.parlament.ch/en/ratsbetrieb/sessions/schedule',calendar=await fetchImpl(calendarUrl,{signal:AbortSignal.timeout(20000)});if(!calendar.ok)throw Error('CALENDAR_UNAVAILABLE');const planned=parseSessionSchedule(await calendar.text());sources.push(calendarUrl);
    events.push(...planned.filter(e=>e.endDate>=zurichDate()));events.sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
    agendaCache={schemaVersion:2,events,retrievedAt,timeZone:'Europe/Zurich',refreshSeconds:3600,sources};writeFileSync(directory+'/agenda.tmp',JSON.stringify(agendaCache));renameSync(directory+'/agenda.tmp',directory+'/agenda.json');return {...agendaCache,stale:false};
   }catch{return {...(agendaCache||{events:[],retrievedAt:null,timeZone:'Europe/Zurich',sources:[]}),stale:true,error:'Official agenda could not be refreshed.'};}finally{pending=null;}})();return pending;
 }
 function feed(){const p=par(),items=p.listBusinesses().slice(0,30).map(b=>({id:'business-'+b.id,title:b.title,type:'official-update',date:b.modified||b.submitted,sourceUrl:b.officialUrl||b.sourceUrl,publisher:'Swiss Parliament',readScope:'record-metadata',businessId:b.id,stage:b.status,language:'fr',retrievedAt:b.retrievedAt}));return {items,publishers:publisherAdapters,refreshSeconds:1800,retrievedAt:items.map(x=>x.retrievedAt).filter(Boolean).sort().at(-1)||null,stale:items.some(x=>Date.now()-Date.parse(x.retrievedAt)>86400000),note:'Imported official proposal updates. Publisher links open the full article on the publisher’s site; articles have not been read by Cleisthenes.'};}
 return {agenda,feed,broadcast:()=>({state:'unverified',checkedAt:new Date().toISOString(),refreshSeconds:60,reason:'An independently verified live signal is not configured.',url:'https://www.parlament.ch/en/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-videos'}),async dashboard(){return {agenda:await agenda(),feed:feed(),today:zurichDate(),counts:par().overview().counts};}};
}
