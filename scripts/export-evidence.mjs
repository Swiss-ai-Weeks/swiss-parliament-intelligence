import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createStore} from '../server/store.mjs';
const s=createStore();const data={exportedAt:new Date().toISOString(),dossiers:s.listDossiers().map(d=>s.getDossier(d.id)),note:'Public evidence only. No sessions, account data, credentials or saved political interests.'};
const body=JSON.stringify(data,null,2);mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/public-evidence.json',body);writeFileSync('artifacts/public-evidence.sha256',createHash('sha256').update(body).digest('hex'));s.close();console.log('Exported public evidence and SHA-256 manifest. Media stays in data/media.');
