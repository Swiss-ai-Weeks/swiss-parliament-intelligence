import {mkdirSync,writeFileSync,readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {openParliament} from '../server/parliament.mjs';

// Explicit allowlist: never archive .env, SSH keys, or the user/account database.
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const name=`public-content-${stamp}`;
mkdirSync('artifacts',{recursive:true});
const db=openParliament();
const overview=db.overview();
db.db.exec(`VACUUM INTO 'artifacts/${name}.sqlite'`);
db.close();
const archive=`artifacts/${name}.tar.gz`;
const result=spawnSync('tar',['-czf',archive,'-C','artifacts',`${name}.sqlite`,'-C','../data','parliament'],{stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)throw Error('Public source archive failed');
const manifest={createdAt:new Date().toISOString(),archive,bytes:statSync(archive).size,sha256:createHash('sha256').update(readFileSync(archive)).digest('hex'),contents:['public parliamentary SQLite snapshot','official raw responses, processing manifests and receipts'],excluded:['credentials','SSH keys','user/account data','media files (stored separately)'],counts:overview.counts,sessions:overview.sessions.map(s=>({id:s.id,title:s.title,paragraphs:s.ingestion?.paragraphs,processing:s.processing}))};
writeFileSync(`artifacts/${name}.json`,JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest,null,2));
