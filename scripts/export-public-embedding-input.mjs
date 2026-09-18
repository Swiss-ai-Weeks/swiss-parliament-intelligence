import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
const db=new DatabaseSync('data/parliament.sqlite',{readOnly:true});
const rows=db.prepare("SELECT id,payload,sha256,source_url,retrieved_at FROM records WHERE kind='speech' ORDER BY id").all().map(r=>{const p=JSON.parse(r.payload);return {id:r.id,text:p.text,sha256:r.sha256,sourceUrl:p.officialUrl||r.source_url,retrievedAt:r.retrieved_at,sessionId:p.sessionId,personId:p.personId,businessId:p.businessId,language:p.language};});
writeFileSync('data/public-embedding-input.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');db.close();console.log(JSON.stringify({publicPassages:rows.length}));
