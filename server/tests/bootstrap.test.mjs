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

test('a dropped download resumes with a Range request',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'swiss-data-'));
 const pkg=packageOf({'parliament.sqlite':'resumed corpus '+'x'.repeat(4000)});const half=Math.floor(pkg.bytes.length/2);const ranges=[];
 const fetchImpl=async(url,options)=>{const range=options?.headers?.Range;ranges.push(range||'none');
  if(!range)return new Response(new ReadableStream({sent:false,async pull(c){if(this.sent){await new Promise(done=>setTimeout(done,50));return c.error(new TypeError('other side closed'));}this.sent=true;c.enqueue(pkg.bytes.subarray(0,half));}}));
  const from=Number(range.match(/bytes=(\d+)-/)[1]);return new Response(pkg.bytes.subarray(from),{status:206});};
 assert.equal(await applyArchive({name:'corpus',url:'https://example.test/c.tgz',sha256:pkg.sha256,dataDir,fetchImpl,retry:{backoffMs:1}}),'applied');
 assert.deepEqual(ranges,['none','bytes='+half+'-']);  // written bytes are kept; only the rest is fetched
 assert.match(readFileSync(join(dataDir,'parliament.sqlite'),'utf8'),/^resumed corpus/);
 rmSync(dataDir,{recursive:true,force:true});
});

test('a replaced database never replays the old write-ahead log',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const {copyFileSync}=await import('node:fs');
 const dataDir=mkdtempSync(join(tmpdir(),'swiss-data-')),src=mkdtempSync(join(tmpdir(),'swiss-src-'));
 const fresh=new DatabaseSync(join(src,'parliament.sqlite'));fresh.exec("CREATE TABLE records(id);CREATE TABLE speech_business_links(id);INSERT INTO records VALUES('new');");fresh.close();
 const old=new DatabaseSync(join(dataDir,'parliament.sqlite'));old.exec("PRAGMA journal_mode=WAL;PRAGMA wal_autocheckpoint=0;CREATE TABLE records(id);INSERT INTO records VALUES('old');");
 for(const s of ['-wal','-shm'])copyFileSync(join(dataDir,'parliament.sqlite'+s),join(dataDir,'keep'+s));old.close();
 for(const s of ['-wal','-shm'])copyFileSync(join(dataDir,'keep'+s),join(dataDir,'parliament.sqlite'+s));
 execFileSync('tar',['-czf','p.tgz','parliament.sqlite'],{cwd:src});const bytes=readFileSync(join(src,'p.tgz'));
 await applyArchive({name:'corpus',url:'https://example.test/c.tgz',sha256:createHash('sha256').update(bytes).digest('hex'),dataDir,fetchImpl:serve(bytes)});
 const db=new DatabaseSync(join(dataDir,'parliament.sqlite'));
 assert.equal(db.prepare('SELECT id FROM records').get().id,'new');db.prepare('SELECT * FROM speech_business_links').all();db.close();
 rmSync(dataDir,{recursive:true,force:true});rmSync(src,{recursive:true,force:true});
});
