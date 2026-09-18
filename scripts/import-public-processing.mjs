import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
const directory=process.argv[2]||'data/gpu-processing/session-output';
const jobs=new Map(JSON.parse(readFileSync('data/public-session-queue.json','utf8')).map(j=>[String(j.id),j]));
const db=new DatabaseSync('data/public-processing.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS transcripts(id TEXT PRIMARY KEY,session TEXT,model TEXT,media_sha256 TEXT,duration REAL,official_url TEXT,language TEXT,text TEXT,payload TEXT,imported_at TEXT)');
const save=db.prepare("INSERT OR REPLACE INTO transcripts VALUES(?,?,?,?,?,?,?,?,?,datetime('now'))");
let count=0,legacySkipped=0;
for(const name of readdirSync(directory)){
 if(!/^\d+-canary\.json$/.test(name))continue;
 const id=name.split('-')[0],j=jobs.get(id),r=JSON.parse(readFileSync(path.join(directory,name),'utf8'));
 if(!r.officialPage||!r.sessionId){legacySkipped++;continue;}
 if(!j||r.officialPage!==j.officialPage||r.sessionId!==j.sessionId||r.language!==j.language||!/^https:\/\/www\.parlament\.ch\//.test(r.officialPage))throw Error('SOURCE_MISMATCH '+id);
 if(!/^[a-f0-9]{64}$/.test(r.mediaSha256)||!Number.isFinite(r.duration_seconds)||r.duration_seconds<=0||typeof r.text!=='string'||!r.text.trim()||r.model!=='nvidia/canary-1b-v2')throw Error('INVALID_RECEIPT '+id);
 const words=r.segments?.flatMap(s=>s.words||[]);if(!words?.length||words.some(w=>!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<w.start||w.end>r.duration_seconds+1))throw Error('INVALID_WORD_TIMING '+id);
 save.run(id,r.sessionId,r.model,r.mediaSha256,r.duration_seconds,r.officialPage,r.language,r.text,JSON.stringify(r));count++;
}
console.log(JSON.stringify({imported:count,legacySkipped,total:db.prepare('SELECT count(*) n FROM transcripts').get().n,scope:'Public ASR receipts; not verified quotations or alignments'}));db.close();
