// Code-only update. Existing production account and public-data volumes remain untouched.
import {mkdirSync,cpSync,copyFileSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
if(!readFileSync('frontend/dist/client/index.html','utf8').includes('/Switzerland/assets/'))throw Error('INVALID_MOUNT');
const base='artifacts/swiss-code-release-'+new Date().toISOString().replace(/[:.]/g,'-');
const site=base+'/site/Switzerland',backend=base+'/backend';mkdirSync(site,{recursive:true});mkdirSync(backend,{recursive:true});
cpSync('frontend/dist/client',site,{recursive:true});cpSync('server',backend+'/server',{recursive:true});
copyFileSync('package.json',backend+'/package.json');copyFileSync('deploy/switzerland/bootstrap.mjs',backend+'/bootstrap.mjs');
const archive=base+'/backend.tgz';execFileSync('tar',['-czf',archive,'-C',backend,'.']);
const appArchiveSha256=createHash('sha256').update(readFileSync(archive)).digest('hex');
mkdirSync(site+'/bootstrap',{recursive:true});copyFileSync(archive,site+'/bootstrap/'+appArchiveSha256+'.tgz');
const report={base,site,appArchiveSha256,appArchiveUrl:'https://midnight.vote/Switzerland/bootstrap/'+appArchiveSha256+'.tgz',dataUpdate:false};
writeFileSync(base+'/release.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
