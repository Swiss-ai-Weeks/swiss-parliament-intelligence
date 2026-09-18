import {existsSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const marker='/app/data/.initialized';
if(!existsSync(marker)){
 const r=await fetch(process.env.PUBLIC_DATA_URL);if(!r.ok)throw Error('BOOTSTRAP_DOWNLOAD_FAILED');
 const bytes=Buffer.from(await r.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==process.env.PUBLIC_DATA_SHA256)throw Error('BOOTSTRAP_CHECKSUM_FAILED');
 writeFileSync('/tmp/public-data.tgz',bytes,{mode:0o600});execFileSync('tar',['-xzf','/tmp/public-data.tgz','-C','/app/data']);writeFileSync(marker,new Date().toISOString());
}
// index.mjs only starts automatically when it is the entrypoint.
const {createServer}=await import('/app/server/index.mjs');
const {server}=createServer({authFile:'/app/data/sessions.sqlite'});server.listen(4318,'0.0.0.0');
