import {mkdirSync,cpSync,copyFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createStore} from '../server/store.mjs';
import {openParliament} from '../server/parliament.mjs';
const dest='artifacts/demo-bundle';
mkdirSync(dest,{recursive:true});
for(const dir of ['server','frontend/dist/client','data/media'])if(existsSync(dir))cpSync(dir,`${dest}/${dir}`,{recursive:true});
copyFileSync('package.json',`${dest}/package.json`);
const source=createStore();const target=createStore(`${dest}/data/pilot.sqlite`);
// Copy only public tables, never saved interests, sessions, keys, or local .env.
target.db.exec('DELETE FROM saved; DELETE FROM evidence; DELETE FROM dossiers; DELETE FROM sources;');
for(const table of ['dossiers','sources','evidence'])for(const row of source.db.prepare(`SELECT * FROM ${table}`).all()){
 const keys=Object.keys(row);target.db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>row[k]));
}
source.close();target.close();
if(existsSync('data/parliament/video-alignments.json')){mkdirSync(`${dest}/data/parliament`,{recursive:true});copyFileSync('data/parliament/video-alignments.json',`${dest}/data/parliament/video-alignments.json`);}
if(existsSync('data/parliament'))for(const dir of readdirSync('data/parliament').filter(n=>/^session-\d+$/.test(n))){
 mkdirSync(`${dest}/data/parliament/${dir}`,{recursive:true});
 for(const file of readdirSync(`data/parliament/${dir}`).filter(n=>n==='media-jobs.json'||/^\d+-(embeddings|vss|canary)\.json$/.test(n)))copyFileSync(`data/parliament/${dir}/${file}`,`${dest}/data/parliament/${dir}/${file}`);
}
if(existsSync('data/parliament.sqlite')){
 const source=openParliament();const target=openParliament(`${dest}/data/parliament.sqlite`);
 // This separate database contains public parliamentary records only.
 for(const table of ['records','revisions','runs','speech_search']){
  target.db.exec(`DELETE FROM ${table}`);
  for(const row of source.db.prepare(`SELECT * FROM ${table}`).all()){
   const keys=Object.keys(row);target.db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>row[k]));
  }
 }
 source.close();target.close();
}
if(existsSync('artifacts/live-evaluation.json'))copyFileSync('artifacts/live-evaluation.json',`${dest}/recorded-responses.json`);
mkdirSync(`${dest}/processing`,{recursive:true});
for(const name of ['canary-alignment-evaluation.json','vss-batch-evaluation.json','video-search-evaluation.json','riva-cross-language-evaluation.json','riva-translation-evaluation.json'])if(existsSync(`artifacts/${name}`))copyFileSync(`artifacts/${name}`,`${dest}/processing/${name}`);
if(existsSync('artifacts/profile-evaluation.json'))copyFileSync('artifacts/profile-evaluation.json',`${dest}/processing/profile-evaluation.json`);
for(const name of ['cleisthenes-evaluation.json','parliament-336838-asr.json','parliament-video-alignment.json','parliament-live-spike.json','parliament-evaluation.json','nvidia-parakeet-fr.json','vss-upload.json','vss-complete.json','evaluation.json','live-evaluation.json','public-evidence.json','public-evidence.sha256'])if(existsSync(`artifacts/${name}`))copyFileSync(`artifacts/${name}`,`${dest}/processing/${name}`);
writeFileSync(`${dest}/.env`,'HOST=127.0.0.1\nPORT=4318\nPUBLIC_ORIGIN=http://localhost:4318\nDEMO_REPLAY_FILE=recorded-responses.json\n');
writeFileSync(`${dest}/START.txt`,'Requires Node.js 24. In this folder run: npm start\nOpen http://localhost:4318\nAnswers are explicitly labelled recorded NVIDIA responses, matched only to captured questions/actions/languages. Unknown prompts refuse. Accounts are unavailable offline. No GPU, network or npm install required.\nTo use prepared editorial extracts instead, remove DEMO_REPLAY_FILE from .env.\nMedia contains official public explainers. Confirm redistribution terms before distributing this bundle.\n');
console.log(`Packaged ${dest}. No accounts or credentials included.`);
