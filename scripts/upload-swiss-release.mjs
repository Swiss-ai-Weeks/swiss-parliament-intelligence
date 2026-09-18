import {readFile, readdir, stat, open} from 'node:fs/promises';
import path from 'node:path';
const [credentials,root,phase='assets']=process.argv.slice(2);
if(!credentials||!root)throw Error('Usage: upload-swiss-release.mjs CREDENTIAL_FILE SITE_DIRECTORY [assets|activate]');
const auth=JSON.parse(await readFile(credentials,'utf8'));
const headers={'X-Auth':auth.auth_key,'X-Auth-Rest':auth.rest_auth_key,'Tus-Resumable':'1.0.0'};
async function walk(dir){let files=[];for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())files.push(...await walk(p));else if(item.isFile())files.push(p);}return files;}
for(const file of await walk(root)){
 const name=path.relative(root,file).replaceAll('\\','/');
 if(!/^(Switzerland\/|switzerland\/\.htaccess$)/.test(name))throw Error('OUTSIDE_SWISS_DIRECTORY');
 const activates=/(^|\/)(index\.html|proxy\.php|\.htaccess)$/.test(name);
 if(activates!==(phase==='activate'))continue;
 const size=(await stat(file)).size,url=auth.url.replace(/\/$/,'')+'/'+name.split('/').map(encodeURIComponent).join('/')+'?override=true';
 const r=await fetch(url,{method:'POST',headers:{...headers,'Upload-Length':String(size),'Upload-Offset':'0'},signal:AbortSignal.timeout(60000)});
 if(r.status!==201)throw Error('UPLOAD_CREATE_FAILED '+name+' '+r.status);
 const f=await open(file);try{let offset=0;while(offset<size){const chunk=Buffer.alloc(Math.min(8*1024*1024,size-offset));const {bytesRead}=await f.read(chunk,0,chunk.length,offset);
  const sent=await fetch(url,{method:'PATCH',headers:{...headers,'Content-Type':'application/offset+octet-stream','Upload-Offset':String(offset)},body:chunk.subarray(0,bytesRead),signal:AbortSignal.timeout(180000)});
  if(sent.status!==204||Number(sent.headers.get('Upload-Offset'))!==offset+bytesRead)throw Error('UPLOAD_CHUNK_FAILED '+name+' '+sent.status);offset+=bytesRead;
 }}finally{await f.close();}
 console.log(JSON.stringify({uploaded:name,bytes:size}));
}
