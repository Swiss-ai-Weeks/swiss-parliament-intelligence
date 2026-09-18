import {mkdirSync,cpSync,copyFileSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
if(!readFileSync('frontend/dist/client/index.html','utf8').includes('/Switzerland/assets/'))throw Error('BUILD_WITH_SWISS_PUBLIC_PATH_FIRST');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),base='artifacts/swiss-release-'+stamp,site=base+'/site/Switzerland',data=base+'/public-data';
mkdirSync(site,{recursive:true});mkdirSync(data,{recursive:true});
cpSync('frontend/dist/client',site,{recursive:true});
copyFileSync('deploy/switzerland/subdirectory.htaccess',site+'/.htaccess');copyFileSync('deploy/switzerland/proxy.php',site+'/proxy.php');
mkdirSync(base+'/site/switzerland-alias',{recursive:true});copyFileSync('deploy/switzerland/lowercase.htaccess',base+'/site/switzerland-alias/.htaccess');
cpSync('data/media',site+'/media',{recursive:true});
for(const name of ['parliament.sqlite','public-embeddings.sqlite','pilot.sqlite']){
 const db=new DatabaseSync('data/'+name,{readOnly:true});db.exec(`VACUUM INTO '${data+'/'+name}'`);db.close();
 if(name==='pilot.sqlite'){const clean=new DatabaseSync(data+'/'+name);clean.exec('DELETE FROM saved; VACUUM');clean.close();}
}
mkdirSync(data+'/parliament',{recursive:true});copyFileSync('data/parliament/video-alignments.json',data+'/parliament/video-alignments.json');
for(const session of ['5213','5214','5215']){mkdirSync(data+'/parliament/session-'+session,{recursive:true});copyFileSync('data/parliament/session-'+session+'/media-jobs.json',data+'/parliament/session-'+session+'/media-jobs.json');}
for(const session of ['5213','5214','5215'])for(const file of readdirSync('data/parliament/session-'+session))if(/^\d+-(asr|canary|embeddings|vss)\.json$/.test(file))copyFileSync('data/parliament/session-'+session+'/'+file,data+'/parliament/session-'+session+'/'+file);
const archive=base+'/public-data.tgz';execFileSync('tar',['-czf',archive,'-C',data,'.']);const hash=createHash('sha256').update(readFileSync(archive)).digest('hex');
mkdirSync(site+'/bootstrap',{recursive:true});copyFileSync(archive,site+'/bootstrap/'+hash+'.tgz');
const backend=base+'/backend';mkdirSync(backend,{recursive:true});cpSync('server',backend+'/server',{recursive:true});copyFileSync('package.json',backend+'/package.json');copyFileSync('deploy/switzerland/bootstrap.mjs',backend+'/bootstrap.mjs');
const appArchive=base+'/backend.tgz';execFileSync('tar',['-czf',appArchive,'-C',backend,'.']);const appHash=createHash('sha256').update(readFileSync(appArchive)).digest('hex');copyFileSync(appArchive,site+'/bootstrap/'+appHash+'.tgz');
const manifest={base,site,archive,appArchive,appArchiveSha256:appHash,appArchiveUrl:'https://midnight.vote/Switzerland/bootstrap/'+appHash+'.tgz',publicDataSha256:hash,publicDataUrl:'https://midnight.vote/Switzerland/bootstrap/'+hash+'.tgz',excluded:['saved sources owned by users','sessions','private keys','environment files'],createdAt:new Date().toISOString()};writeFileSync(base+'/release.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest));
