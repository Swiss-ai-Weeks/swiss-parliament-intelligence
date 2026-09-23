// Initialises and upgrades the persistent data volume from checksummed public archives, then starts the API.
// Archives are streamed to disk and hashed on the way: the corpus is several GB, far more than the container's
// RAM or /tmp. Each archive is applied once per checksum, so a restart never downloads again, and account data
// (sessions, readers' saved sources) is never replaced by a newer public package.
import {createReadStream,createWriteStream,existsSync,mkdirSync,readFileSync,readdirSync,renameSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {basename,join} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

// pilot.sqlite is seeded once from the package, then holds readers' saved sources.
const PROTECTED=['sessions.sqlite','pilot.sqlite'];

function merge(from,to){
 for(const name of readdirSync(from)){
  const src=join(from,name),dst=join(to,name);
  if(statSync(src).isDirectory()){mkdirSync(dst,{recursive:true});merge(src,dst);}
  else{
   // A replaced SQLite database must not meet the old one's write-ahead log: SQLite would replay the old
   // pages onto the new file (tables vanish, old rows return).
   if(/\.sqlite$/.test(name))for(const suffix of ['-wal','-shm','-journal'])rmSync(dst+suffix,{force:true});
   renameSync(src,dst);
  }
 }
}

// Resumes with an HTTP Range request when the connection drops; a restarted container also resumes,
// because the partial file is named after the checksum it must reach.
async function download(url,file,fetchImpl,{attempts=6,backoffMs=2000}={}){
 for(let attempt=1;;attempt++){
  const have=existsSync(file)?statSync(file).size:0;
  try{
   const r=await fetchImpl(url,have?{headers:{Range:'bytes='+have+'-'}}:undefined);
   if(have&&r.status===416)return;
   if(!r.ok||!r.body)throw new Error('BOOTSTRAP_DOWNLOAD_FAILED');
   await pipeline(Readable.fromWeb(r.body),createWriteStream(file,{flags:have&&r.status===206?'a':'w',mode:0o600}));
   return;
  }catch(error){
   if(attempt>=attempts)throw error;
   console.log('bootstrap download interrupted ('+(error.cause?.code||error.message)+'), resuming: attempt '+(attempt+1));
   await new Promise(done=>setTimeout(done,backoffMs*attempt));
  }
 }
}
const sha256Of=file=>new Promise((done,fail)=>{const h=createHash('sha256');createReadStream(file).on('data',c=>h.update(c)).on('end',()=>done(h.digest('hex'))).on('error',fail);});

export async function applyArchive({name,url,sha256,dataDir,fetchImpl=fetch,retry}){
 if(!url||!/^[0-9a-f]{64}$/.test(sha256||''))return 'not-configured';
 // v2: archives applied before stale-WAL removal are re-applied once.
 const marker=join(dataDir,'.bootstrap-'+name),applied=sha256+' v2';
 if(existsSync(marker)&&readFileSync(marker,'utf8').trim()===applied)return 'current';
 const archive=join(dataDir,'.incoming-'+name+'-'+sha256.slice(0,16)+'.tgz'),staging=join(dataDir,'.staging-'+name);
 for(const old of readdirSync(dataDir))if(old.startsWith('.incoming-'+name+'-')&&join(dataDir,old)!==archive)rmSync(join(dataDir,old),{force:true});
 rmSync(staging,{recursive:true,force:true});
 await download(url,archive,fetchImpl,retry);
 if(await sha256Of(archive)!==sha256){rmSync(archive,{force:true});throw new Error('BOOTSTRAP_CHECKSUM_FAILED');}
 mkdirSync(staging,{recursive:true});
 try{
  // Relative paths: GNU tar reads "C:\..." as a remote host.
  execFileSync('tar',['-xzf',basename(archive),'-C',basename(staging)],{cwd:dataDir});
  for(const file of PROTECTED)if(existsSync(join(dataDir,file)))rmSync(join(staging,file),{force:true});
  merge(staging,dataDir);
 }finally{rmSync(staging,{recursive:true,force:true});rmSync(archive,{force:true});}
 writeFileSync(marker,applied);
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
