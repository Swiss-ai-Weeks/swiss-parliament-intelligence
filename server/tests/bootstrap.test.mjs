import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {applyArchive} from '../../deploy/switzerland/bootstrap.mjs';

function packageOf(files){
 const dir=mkdtempSync(join(tmpdir(),'swiss-pkg-')),src=join(dir,'src');
 for(const [name,text] of Object.entries(files)){const file=join(src,name);mkdirSync(join(file,'..'),{recursive:true});writeFileSync(file,text);}
 execFileSync('tar',['-czf','package.tgz','-C','src','.'],{cwd:dir});
 const bytes=readFileSync(join(dir,'package.tgz'));rmSync(dir,{recursive:true,force:true});
 return {bytes,sha256:createHash('sha256').update(bytes).digest('hex')};
}
const serve=bytes=>{let calls=0;const f=async()=>{calls++;return new Response(bytes);};f.calls=()=>calls;return f;};

test('an archive is streamed, verified, applied once, and never replaces account data',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'swiss-data-'));
 writeFileSync(join(dataDir,'sessions.sqlite'),'accounts');writeFileSync(join(dataDir,'pilot.sqlite'),'saved sources');writeFileSync(join(dataDir,'parliament.sqlite'),'old corpus');
 const pkg=packageOf({'parliament.sqlite':'new corpus','pilot.sqlite':'seed','sessions.sqlite':'x','embeddings/index.json':'{}'});
 const fetchImpl=serve(pkg.bytes);
 assert.equal(await applyArchive({name:'corpus',url:'https://example.test/c.tgz',sha256:pkg.sha256,dataDir,fetchImpl}),'applied');
 assert.equal(readFileSync(join(dataDir,'parliament.sqlite'),'utf8'),'new corpus');
 assert.equal(readFileSync(join(dataDir,'embeddings/index.json'),'utf8'),'{}');
 assert.equal(readFileSync(join(dataDir,'sessions.sqlite'),'utf8'),'accounts');
 assert.equal(readFileSync(join(dataDir,'pilot.sqlite'),'utf8'),'saved sources');
 assert.deepEqual(readdirSync(dataDir).filter(n=>/^\.(incoming|staging)/.test(n)),[]);
 assert.equal(await applyArchive({name:'corpus',url:'https://example.test/c.tgz',sha256:pkg.sha256,dataDir,fetchImpl}),'current');
 assert.equal(fetchImpl.calls(),1);
 rmSync(dataDir,{recursive:true,force:true});
});

test('a checksum mismatch changes nothing',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'swiss-data-'));writeFileSync(join(dataDir,'parliament.sqlite'),'old corpus');
 const pkg=packageOf({'parliament.sqlite':'tampered'});
 await assert.rejects(applyArchive({name:'corpus',url:'https://example.test/c.tgz',sha256:'0'.repeat(64),dataDir,fetchImpl:serve(pkg.bytes)}),/BOOTSTRAP_CHECKSUM_FAILED/);
 assert.equal(readFileSync(join(dataDir,'parliament.sqlite'),'utf8'),'old corpus');
 assert.equal(existsSync(join(dataDir,'.bootstrap-corpus')),false);
 assert.equal(await applyArchive({name:'semantic-index',url:'',sha256:'',dataDir}),'not-configured');
 rmSync(dataDir,{recursive:true,force:true});
});
