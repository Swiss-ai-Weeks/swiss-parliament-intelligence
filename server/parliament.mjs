import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {partyCatalog} from './party-catalog.mjs';
import {processingCoverage} from './session-processing.mjs';
import {readDebate,passageContext} from './debate-reader.mjs';
export function plainText(html=''){return String(html).replace(/<[^>]*>/g,' ').replace(/&nbsp;|\[NB\]/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();}
export function officialDate(value){if(!value)return null;const m=String(value).match(/\/Date\((-?\d+)/);return m?new Date(Number(m[1])).toISOString():null;}
export function statusGroup(text){if(/^(Liquidé|Retiré|Classé|Rejeté|Erledigt|Abgeschrieben|Zurückgezogen)$/i.test(text||''))return 'concluded';if(/déposé|conseil|commission|délibération|eingereicht|rat|kommission/i.test(text||''))return 'proceedings';return 'unclassified';}
// Partial expression indexes keep per-person, per-business and per-recording lookups
// off full-table scans. Without ANALYZE statistics SQLite prefers the (kind,id) key, so queries pin them with INDEXED BY.
export const RECORD_INDEXES=`CREATE INDEX IF NOT EXISTS records_speech_person ON records(json_extract(payload,'$.personId')) WHERE kind='speech';
 CREATE INDEX IF NOT EXISTS records_speech_business ON records(json_extract(payload,'$.businessId')) WHERE kind='speech';
 CREATE INDEX IF NOT EXISTS records_speech_transcript ON records(json_extract(payload,'$.transcriptId')) WHERE kind='speech';
 CREATE INDEX IF NOT EXISTS records_speech_date ON records(json_extract(payload,'$.date')) WHERE kind='speech';
 CREATE INDEX IF NOT EXISTS records_voting_person ON records(json_extract(payload,'$.personId')) WHERE kind='voting';`;
export function openParliament(file='data/parliament.sqlite'){
 if(file!==':memory:')mkdirSync(dirname(file),{recursive:true});const db=new DatabaseSync(file);
 db.exec(`PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS records(kind TEXT,id TEXT,payload TEXT NOT NULL,source_url TEXT NOT NULL,retrieved_at TEXT NOT NULL,sha256 TEXT NOT NULL,PRIMARY KEY(kind,id));
 CREATE TABLE IF NOT EXISTS revisions(kind TEXT,id TEXT,sha256 TEXT,payload TEXT,retrieved_at TEXT,PRIMARY KEY(kind,id,sha256));
 CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,payload TEXT);
 CREATE VIRTUAL TABLE IF NOT EXISTS speech_search USING fts5(id UNINDEXED,person_id UNINDEXED,business_id UNINDEXED,text,tokenize='unicode61 remove_diacritics 2');`);
 db.exec('PRAGMA busy_timeout=30000;');
 db.exec(RECORD_INDEXES);
 const alignmentFile=dirname(file)+'/parliament/video-alignments.json';const alignments=existsSync(alignmentFile)?JSON.parse(readFileSync(alignmentFile,'utf8')):{};
 const decode=r=>r?{...JSON.parse(r.payload),...(r.kind==='speech'&&alignments[r.id]?{video:alignments[r.id],videoStatus:'machine-aligned'}:{}),sourceUrl:r.source_url,retrievedAt:r.retrieved_at,sha256:r.sha256}:null;
 const all=kind=>db.prepare('SELECT * FROM records WHERE kind=?').all(kind).map(decode);
 const get=(kind,id)=>decode(db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,String(id)));
 const cache=new Map(),cached=(key,build,ttl=300000)=>{const hit=cache.get(key);if(hit&&Date.now()-hit.at<ttl)return hit.value;const value=build();cache.set(key,{at:Date.now(),value});return value;};
 const indexFor={speech:{personId:'records_speech_person',businessId:'records_speech_business',transcriptId:'records_speech_transcript',date:'records_speech_date'},voting:{personId:'records_voting_person'}};
 const counts=(kind,field)=>cached('count:'+kind+field,()=>new Map(db.prepare(`SELECT json_extract(payload,'$.${field}') k,count(*) n FROM records INDEXED BY ${indexFor[kind][field]} WHERE kind='${kind}' AND json_extract(payload,'$.${field}') IS NOT NULL GROUP BY 1`).all().map(r=>[String(r.k),r.n])));
 const speechCounts={byBusiness:()=>counts('speech','businessId'),byPerson:()=>counts('speech','personId')},votingCounts={byPerson:()=>counts('voting','personId')};
 const byField={personId:"json_extract(payload,'$.personId')",businessId:"json_extract(payload,'$.businessId')",transcriptId:"json_extract(payload,'$.transcriptId')"};
 function speechesWhere(filter={},{limit}={}){const [field,value]=Object.entries(filter).find(([k,v])=>byField[k]&&v!=null)||[];if(!field)throw new Error('SPEECH_FILTER_REQUIRED');const rows=db.prepare(`SELECT * FROM records INDEXED BY ${indexFor.speech[field]} WHERE kind='speech' AND ${byField[field]}=? ORDER BY id${limit?' LIMIT '+Number(limit):''}`).all(String(value)).map(decode);return rows.filter(s=>Object.entries(filter).every(([k,v])=>v==null||!byField[k]||String(s[k])===String(v)));}
 const votingsFor=personId=>db.prepare(`SELECT * FROM records INDEXED BY records_voting_person WHERE kind='voting' AND json_extract(payload,'$.personId')=?`).all(String(personId)).map(decode);
 const firstFor=(kind,personId)=>decode(db.prepare(`SELECT * FROM records INDEXED BY ${indexFor[kind].personId} WHERE kind='${kind}' AND json_extract(payload,'$.personId')=? LIMIT 1`).get(String(personId)));
 const speechDaysSince=date=>db.prepare(`SELECT DISTINCT json_extract(payload,'$.sessionId') sessionId,json_extract(payload,'$.date') date FROM records INDEXED BY records_speech_date WHERE kind='speech' AND json_extract(payload,'$.date')>=?`).all(String(date));
 const listBusinesses=()=>cached('businesses',()=>{const n=speechCounts.byBusiness();return all('business').map(b=>({...b,passageCount:n.get(String(b.id))||0})).sort((a,b)=>(b.modified||'').localeCompare(a.modified||''));});
 // Full-table readers remain for small fixtures and offline scripts; request paths use the indexed helpers.
 const speeches=()=>all('speech');const votes=()=>all('vote');const votings=()=>all('voting');
 const people=()=>cached('people',()=>{const map=new Map(all('person').map(p=>[String(p.id),p]));for(const id of votingCounts.byPerson().keys())if(!map.has(id)){const v=firstFor('voting',id);if(v)map.set(id,{id,name:v.personName,canton:v.canton,group:v.group,profileCoverage:'vote-record-only'});}for(const id of speechCounts.byPerson().keys())if(!map.has(id)){const s=firstFor('speech',id);if(s)map.set(id,{id,name:s.speaker,group:s.group,profileCoverage:'speech-record-only'});}return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)));});
 function search(query,{businessId,personId,limit=8}={}){const terms=String(query||'').match(/[\p{L}\p{N}]{2,}/gu)?.filter(t=>!new Set('what does the this that how about who when where which are was were with from have has will be do can could would should did is to of it me tell more on a an was sagt zum zur der die das und ist sind wie mit von auf es che cosa dice dei delle della degli il lo gli una nel nella per come si que qui quoi dit les des une est dans sur pour par aux du de la le et en un ce ces cette ses son quels quelle comment'.split(' ')).has(t.toLowerCase())).slice(0,15)||[];if(!terms.length)return [];const filter=terms.map(t=>'"'+t+'"').join(' OR ');const rows=db.prepare(`SELECT id,bm25(speech_search) rank FROM speech_search WHERE speech_search MATCH ? ${businessId?'AND business_id=?':''} ${personId?'AND person_id=?':''} ORDER BY rank LIMIT ?`).all(filter,...(businessId?[String(businessId)]:[]),...(personId?[String(personId)]:[]),Math.min(20,limit));return rows.map(r=>get('speech',r.id));}
 function searchCandidates(query,{businessId,personId,limit=300}={}){const terms=String(query||'').match(/[\p{L}\p{N}]{2,}/gu)?.slice(0,15)||[];if(!terms.length)return [];const rows=db.prepare(`SELECT id FROM speech_search WHERE speech_search MATCH ? ${businessId?'AND business_id=?':''} ${personId?'AND person_id=?':''} ORDER BY bm25(speech_search) LIMIT ?`).all(terms.map(t=>'"'+t+'"').join(' OR '),...(businessId?[String(businessId)]:[]),...(personId?[String(personId)]:[]),limit);return rows.map(r=>get('speech',r.id)).filter(Boolean);}
 return {db,all,get,listBusinesses,people,search,searchCandidates,speeches,speechesWhere,speechCounts,votingCounts,votingsFor,speechDaysSince,votes,votings,readDebate:filters=>readDebate(db,decode,filters),passageContext:id=>passageContext(db,decode,id),
  overview:()=>({sessions:all('session').map(s=>processingCoverage(dirname(file)+'/parliament',s)),counts:Object.fromEntries(db.prepare('SELECT kind,count(*) n FROM records GROUP BY kind').all().map(r=>[r.kind,r.n])),runs:db.prepare('SELECT payload FROM runs ORDER BY id DESC LIMIT 5').all().map(r=>JSON.parse(r.payload)),coverage:'Official-source snapshots; inspect per-session text and media coverage. Member vote history covers only imported roll calls. Not a live voting feed.'}),
  business:id=>{const b=get('business',id);return b?{...b,timeline:all('event').filter(e=>e.businessId===String(id)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')),votes:votes().filter(v=>v.businessId===String(id)),speeches:speechesWhere({businessId:id}),popularVote:id==='20230073'?{date:'2025-09-28',status:'completed',result:'accepted',sourceUrl:'https://www.admin.ch/en/e-id-act'}:null}:null;},
  person:id=>{const p=people().find(p=>String(p.id)===String(id));if(!p)return null;const records=votingsFor(id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));return {...p,partyBackground:partyCatalog[p.partyId]||null,votes:records,speeches:speechesWhere({personId:id}),coverage:'Imported roll calls only. Missing records are not abstentions. Party/group labels on votes describe the time of that vote.',decisionCounts:records.reduce((o,v)=>(o[v.decisionText]=(o[v.decisionText]||0)+1,o),{})};},
  close:()=>db.close()};
}
