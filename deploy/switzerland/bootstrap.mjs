// Initialises and upgrades the persistent data volume from checksummed public archives, then starts the API.
// Archives are streamed to disk and hashed on the way: the corpus is several GB, far more than the container's
// RAM or /tmp. Each archive is applied once per checksum, so a restart never downloads again, and account data
// (sessions, readers' saved sources) is never replaced by a newer public package.
import {createWriteStream,existsSync,mkdirSync,readFileSync,readdirSync,renameSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {basename,join} from 'node:path';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

// pilot.sqlite is seeded once from the package, then holds readers' saved sources.
const PROTECTED=['sessions.sqlite','pilot.sqlite'];

function merge(from,to){
 for(const name of readdirSync(from)){
  const src=join(from,name),dst=join(to,name);
  if(statSync(src).isDirectory()){mkdirSync(dst,{recursive:true});merge(src,dst);}
  else renameSync(src,dst);
 }
}

export async function applyArchive({name,url,sha256,dataDir,fetchImpl=fetch}){
 if(!url||!/^[0-9a-f]{64}$/.test(sha256||''))return 'not-configured';
 const marker=join(dataDir,'.bootstrap-'+name);
 if(existsSync(marker)&&readFileSync(marker,'utf8').trim()===sha256)return 'current';
 const archive=join(dataDir,'.incoming-'+name+'.tgz'),staging=join(dataDir,'.staging-'+name);
 rmSync(staging,{recursive:true,force:true});
 const r=await fetchImpl(url);if(!r.ok||!r.body)throw new Error('BOOTSTRAP_DOWNLOAD_FAILED');
 const hash=createHash('sha256');
 await pipeline(Readable.fromWeb(r.body),new Transform({transform(chunk,_,done){hash.update(chunk);done(null,chunk);}}),createWriteStream(archive,{mode:0o600}));
 if(hash.digest('hex')!==sha256){rmSync(archive,{force:true});throw new Error('BOOTSTRAP_CHECKSUM_FAILED');}
 mkdirSync(staging,{recursive:true});
 try{
  // Relative paths: GNU tar reads "C:\..." as a remote host.
  execFileSync('tar',['-xzf',basename(archive),'-C',basename(staging)],{cwd:dataDir});
  for(const file of PROTECTED)if(existsSync(join(dataDir,file)))rmSync(join(staging,file),{force:true});
  merge(staging,dataDir);
 }finally{rmSync(staging,{recursive:true,force:true});rmSync(archive,{force:true});}
 writeFileSync(marker,sha256);
 return 'applied';
}

export async function start({dataDir='/app/data',env=process.env}={}){
 for(const [name,url,sha256] of [['corpus',env.PUBLIC_DATA_URL,env.PUBLIC_DATA_SHA256],['semantic-index',env.SEMANTIC_INDEX_URL,env.SEMANTIC_INDEX_SHA256]])
  console.log(`bootstrap ${name}: ${await applyArchive({name,url,sha256,dataDir})}`);
 // index.mjs only starts automatically when it is the entrypoint.
 const {createServer}=await import(new URL('./server/index.mjs',import.meta.url));
 const {server}=createServer({authFile:join(dataDir,'sessions.sqlite')});
 server.listen(Number(env.PORT||4318),'0.0.0.0',()=>console.log('Swiss pilot API listening'));
}
