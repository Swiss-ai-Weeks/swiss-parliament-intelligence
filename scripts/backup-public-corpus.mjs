// Public content only: never open pilot.sqlite, sessions.sqlite, .env or account exports.
import {DatabaseSync} from 'node:sqlite';
import {mkdir,readFile,writeFile,readdir,lstat,unlink} from 'node:fs/promises';
import {createReadStream,createWriteStream,existsSync} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),output=path.resolve(process.env.CORPUS_BACKUP_DIRECTORY||'data/public-backups'),keyFile=path.resolve(process.env.CORPUS_BACKUP_KEY_FILE||'');
if(!process.env.CORPUS_BACKUP_KEY_FILE||!path.relative(output,keyFile).startsWith('..'))throw Error('PROTECTED_KEY_OUTSIDE_BACKUPS_REQUIRED');
const key=await readFile(keyFile);if(key.length!==32)throw Error('32_BYTE_KEY_REQUIRED');
const destination=path.join(output,new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(destination,{recursive:true});
const snapshot=path.join(destination,'public.sqlite');const db=new DatabaseSync('data/parliament.sqlite',{readOnly:true});db.exec(`VACUUM INTO '${snapshot.replaceAll("'","''")}'`);db.close();
const manifest={version:1,createdAt:new Date().toISOString(),scope:'official-public-corpus-only',files:[]};
async function protect(file,name){
 if((await lstat(file)).isSymbolicLink())throw Error('SYMLINK_REFUSED');
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),hash=createHash('sha256');
 const stream=createReadStream(file);stream.on('data',b=>hash.update(b));
 const encrypted=path.join(destination,String(manifest.files.length)+'.enc');
 await pipeline(stream,cipher,createWriteStream(encrypted,{flags:'wx',mode:0o600}));
 const entry={name,blob:path.basename(encrypted),iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),sha256:hash.digest('hex')};
 const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(Buffer.from(entry.tag,'hex'));const restored=createHash('sha256');
 await pipeline(createReadStream(encrypted),decipher,restored);
 if(restored.digest('hex')!==entry.sha256)throw Error('RESTORE_HASH_MISMATCH');manifest.files.push(entry);
}
await protect(snapshot,'data/parliament.sqlite');
if(existsSync('data/public-embeddings.sqlite')){
 const vectorSnapshot=path.join(destination,'vectors.sqlite'),vectors=new DatabaseSync('data/public-embeddings.sqlite',{readOnly:true});
 vectors.exec(`VACUUM INTO '${vectorSnapshot.replaceAll("'","''")}'`);vectors.close();
 await protect(vectorSnapshot,'data/public-embeddings.sqlite');await unlink(vectorSnapshot);
}
const corpus=new DatabaseSync(snapshot,{readOnly:true}),ragFile=path.join(destination,'public-passages.jsonl');
const passages=corpus.prepare("SELECT id,payload,source_url,retrieved_at,sha256 FROM records WHERE kind='speech' ORDER BY id").all();
await writeFile(ragFile,passages.map(r=>JSON.stringify({id:r.id,sourceUrl:r.source_url,retrievedAt:r.retrieved_at,sourceHash:r.sha256,passage:JSON.parse(r.payload)})).join('\n')+'\n',{flag:'wx',mode:0o600});corpus.close();
await protect(ragFile,'public-passages.jsonl');await unlink(ragFile);

const restored=path.join(destination,'restore-check.sqlite'),first=manifest.files[0],decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(first.iv,'hex'));decipher.setAuthTag(Buffer.from(first.tag,'hex'));
await pipeline(createReadStream(path.join(destination,first.blob)),decipher,createWriteStream(restored,{flags:'wx',mode:0o600}));
const check=new DatabaseSync(restored,{readOnly:true});if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('SQLITE_RESTORE_FAILED');manifest.records=check.prepare('SELECT count(*) AS n FROM records').get().n;check.close();await unlink(restored);await unlink(snapshot);
const code=path.join(destination,'code.tar');execFileSync('git',['archive','--format=tar','--output='+code,'HEAD','server','scripts','frontend/src','frontend/public','frontend/package.json','frontend/package-lock.json','package.json','deploy','docs']);await protect(code,'code.tar');await unlink(code);
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(entry.isFile()&&(/^(\d+-(asr|canary|embeddings|vss)|video-alignments)\.json$/.test(entry.name)||/^parliament-\d+\.mp4$/.test(entry.name)))await protect(file,path.relative(root,file).replaceAll('\\','/'));}}
await walk(path.join(root,'data/parliament'));await walk(path.join(root,'data/media'));
await writeFile(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'encrypted-and-restore-verified',destination,files:manifest.files.length,records:manifest.records,codeRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}));
