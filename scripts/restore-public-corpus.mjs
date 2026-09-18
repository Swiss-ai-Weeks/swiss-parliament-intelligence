import {readFile,mkdir,access} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createDecipheriv,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
const [archiveArg,targetArg]=process.argv.slice(2);
if(!archiveArg||!targetArg||!process.env.CORPUS_BACKUP_KEY_FILE)throw Error('Usage: restore-public-corpus.mjs ARCHIVE NEW_EMPTY_DESTINATION with CORPUS_BACKUP_KEY_FILE');
const archive=path.resolve(archiveArg),target=path.resolve(targetArg),key=await readFile(process.env.CORPUS_BACKUP_KEY_FILE);
try{await access(target);throw Error('RESTORE_DESTINATION_MUST_NOT_EXIST');}catch(e){if(e.code!=='ENOENT')throw e;}
const manifest=JSON.parse(await readFile(path.join(archive,'manifest.json'),'utf8'));
if(manifest.version!==1||manifest.scope!=='official-public-corpus-only'||!Array.isArray(manifest.files))throw Error('INVALID_MANIFEST');
const names=new Set();for(const entry of manifest.files){
 if(!/^(code\.tar|public-passages\.jsonl|data\/parliament\.sqlite|data\/media\/parliament-\d+\.mp4|data\/parliament\/(session-\d+\/)?(\d+-(asr|canary|vss|embeddings)|video-alignments)\.json)$/.test(entry.name)||!/^\d+\.enc$/.test(entry.blob)||names.has(entry.name))throw Error('INVALID_ARCHIVE_PATH');names.add(entry.name);
}
await mkdir(target,{recursive:true});
for(const entry of manifest.files){
 const file=path.join(target,entry.name);await mkdir(path.dirname(file),{recursive:true});
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(entry.iv,'hex'));decipher.setAuthTag(Buffer.from(entry.tag,'hex'));const hash=createHash('sha256');decipher.on('data',b=>hash.update(b));
 await pipeline(createReadStream(path.join(archive,entry.blob)),decipher,createWriteStream(file,{flags:'wx',mode:0o600}));
 if(hash.digest('hex')!==entry.sha256)throw Error('RESTORE_HASH_MISMATCH');
}
const db=new DatabaseSync(path.join(target,'data/parliament.sqlite'),{readOnly:true});if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('DATABASE_RESTORE_FAILED');db.close();
console.log(JSON.stringify({status:'restored-to-isolated-directory',target,files:manifest.files.length}));
