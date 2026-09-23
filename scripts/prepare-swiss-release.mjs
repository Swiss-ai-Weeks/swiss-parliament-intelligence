// Builds the Swiss release: static site for shared hosting, plus three checksummed archives the VPS fetches
// (backend code, public corpus, semantic index). Only public data is packaged: no sessions, account data, keys
// or environment files, and readers' saved sources are emptied from the seed database.
// Usage: node scripts/prepare-swiss-release.mjs [--skip-media] [--skip-index]
import {mkdirSync,cpSync,copyFileSync,writeFileSync,readdirSync,readFileSync,createReadStream,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const args=new Set(process.argv.slice(2));
if(!readFileSync('frontend/dist/client/index.html','utf8').includes('/Switzerland/assets/'))throw Error('BUILD_WITH_SWISS_PUBLIC_PATH_FIRST');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),base='artifacts/swiss-release-'+stamp,site=base+'/site/Switzerland',data=base+'/public-data',index=base+'/semantic-index';
const sha256=file=>new Promise((done,fail)=>{const h=createHash('sha256');createReadStream(file).on('data',c=>h.update(c)).on('end',()=>done(h.digest('hex'))).on('error',fail);});
// Relative paths: GNU tar reads "C:\..." as a remote host.
const pack=(dir,archive)=>execFileSync('tar',['-czf',archive.slice(base.length+1),'-C',dir.slice(base.length+1),'.'],{cwd:base});
const log=step=>console.error(new Date().toISOString().slice(11,19),step);

mkdirSync(site+'/bootstrap',{recursive:true});mkdirSync(data,{recursive:true});
cpSync('frontend/dist/client',site,{recursive:true});
copyFileSync('deploy/switzerland/subdirectory.htaccess',site+'/.htaccess');copyFileSync('deploy/switzerland/proxy.php',site+'/proxy.php');
mkdirSync(base+'/site/switzerland-alias',{recursive:true});copyFileSync('deploy/switzerland/lowercase.htaccess',base+'/site/switzerland-alias/.htaccess');
if(!args.has('--skip-media'))cpSync('data/media',site+'/media',{recursive:true});

for(const name of ['parliament.sqlite','public-embeddings.sqlite','pilot.sqlite']){
 log('copy '+name);
 const db=new DatabaseSync('data/'+name,{readOnly:true});db.exec(`VACUUM INTO '${data+'/'+name}'`);db.close();
 const clean=new DatabaseSync(data+'/'+name);
 if(name==='pilot.sqlite')clean.exec('DELETE FROM saved; VACUUM');
 // Revision history is provenance for imports (about 3.5 GB) and is never read when serving; it stays in backups.
 if(name==='parliament.sqlite'){log('drop revision history from the release copy');clean.exec('DELETE FROM revisions; VACUUM');}
 clean.close();
}
mkdirSync(data+'/parliament',{recursive:true});
for(const file of ['parliament/video-alignments.json','parliament/archive-manifest.json','public-session-queue-manifest.json'])if(existsSync('data/'+file))copyFileSync('data/'+file,data+'/'+file);
for(const session of ['5213','5214','5215']){
 mkdirSync(data+'/parliament/session-'+session,{recursive:true});copyFileSync('data/parliament/session-'+session+'/media-jobs.json',data+'/parliament/session-'+session+'/media-jobs.json');
 for(const file of readdirSync('data/parliament/session-'+session))if(/^\d+-(asr|canary|embeddings|vss)\.json$/.test(file))copyFileSync('data/parliament/session-'+session+'/'+file,data+'/parliament/session-'+session+'/'+file);
}
const archive=base+'/public-data.tgz';log('pack corpus');pack(data,archive);const hash=await sha256(archive);

// Semantic search: int8 E5 index plus the pinned ONNX query model, so the server never downloads weights at runtime.
let indexArchive=null,indexHash=null;
if(!args.has('--skip-index')){
 const model='models/Xenova/multilingual-e5-large';
 mkdirSync(index+'/embeddings',{recursive:true});mkdirSync(index+'/'+model+'/onnx',{recursive:true});
 for(const ext of ['i8','ids.jsonl','json'])copyFileSync('data/embeddings/e5-index-20260923.'+ext,index+'/embeddings/e5-index-20260923.'+ext);
 for(const file of ['config.json','tokenizer.json','tokenizer_config.json','onnx/model_quantized.onnx'])copyFileSync('data/'+model+'/'+file,index+'/'+model+'/'+file);
 indexArchive=base+'/semantic-index.tgz';log('pack semantic index');pack(index,indexArchive);indexHash=await sha256(indexArchive);
}

const backend=base+'/backend';mkdirSync(backend,{recursive:true});
cpSync('server',backend+'/server',{recursive:true,filter:src=>!/[\\/]tests([\\/]|$)/.test(src)});cpSync('config',backend+'/config',{recursive:true});
for(const file of ['package.json','package-lock.json'])copyFileSync(file,backend+'/'+file);copyFileSync('deploy/switzerland/bootstrap.mjs',backend+'/bootstrap.mjs');
const appArchive=base+'/backend.tgz';pack(backend,appArchive);const appHash=await sha256(appArchive);

// Archives are served from unguessable checksum names; remove them from hosting once the VPS has bootstrapped.
log('stage archives for upload');
copyFileSync(appArchive,site+'/bootstrap/'+appHash+'.tgz');copyFileSync(archive,site+'/bootstrap/'+hash+'.tgz');if(indexArchive)copyFileSync(indexArchive,site+'/bootstrap/'+indexHash+'.tgz');
const url=h=>'https://midnight.vote/Switzerland/bootstrap/'+h+'.tgz';
const manifest={base,site,archive,appArchive,indexArchive,appArchiveSha256:appHash,appArchiveUrl:url(appHash),publicDataSha256:hash,publicDataUrl:url(hash),
 semanticIndexSha256:indexHash,semanticIndexUrl:indexHash&&url(indexHash),
 excluded:['saved sources owned by users','sessions','private keys','environment files','import revision history (kept in backups)'],createdAt:new Date().toISOString()};
writeFileSync(base+'/release.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest));
