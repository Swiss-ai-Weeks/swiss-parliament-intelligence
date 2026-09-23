import {createHash} from 'node:crypto';
import {copyFileSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {basename,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..'),destination=resolve(root,'artifacts/gpu-handoff');
const sources=[
 ['data/public-session-pending.json','public-session-pending.json','canary-asr-queue'],
 ['data/public-embedding-input.jsonl','public-embedding-input.jsonl','multilingual-e5-input'],
 ['scripts/process-public-sessions.py','process-public-sessions.py','canary-worker'],
 ['scripts/embed-public-corpus.py','embed-public-corpus.py','e5-worker']
];
for(const [source] of sources)if(!existsSync(resolve(root,source)))throw new Error(`GPU_HANDOFF_SOURCE_MISSING ${source}`);
const queue=JSON.parse(readFileSync(resolve(root,sources[0][0]),'utf8'));
if(!Array.isArray(queue)||queue.some(job=>!/^\d+$/.test(String(job.id))||job.asr==='complete'||!/^https:\/\/www\.parlament\.ch\//.test(job.officialPage)))throw new Error('INVALID_PENDING_GPU_QUEUE');
if(existsSync(destination)){
 const resolved=resolve(destination),allowed=resolve(root,'artifacts');if(!resolved.startsWith(allowed+'\\'))throw new Error('REFUSING_GPU_HANDOFF_CLEANUP');rmSync(resolved,{recursive:true,force:true});
}
mkdirSync(destination,{recursive:true});const files=[];
for(const [source,name,purpose] of sources){const from=resolve(root,source),to=resolve(destination,name);copyFileSync(from,to);const bytes=readFileSync(to);files.push({name,purpose,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
const manifest={schemaVersion:1,createdAt:new Date().toISOString(),scope:'Public Swiss Parliament material only. No environment files, credentials, accounts, conversations, feedback or profile preferences.',pendingAsrJobs:queue.length,embeddingPassages:readFileSync(resolve(root,'data/public-embedding-input.jsonl'),'utf8').trim().split('\n').length,files};
writeFileSync(resolve(destination,'manifest.json'),JSON.stringify(manifest,null,2));
writeFileSync(resolve(destination,'RUN.md'),`# H100 public-processing handoff\n\nVerify hashes before running. This package contains public parliamentary material only. It contains no credentials. Inspect \`nvidia-smi\` and the active service processes before selecting the batch GPU; do not assume a device number. Run E5 and Canary sequentially when they share a GPU with live services.\n\n\`\`\`bash\npython verify-handoff.py\nexport CUDA_VISIBLE_DEVICES="\${BATCH_GPU:?set BATCH_GPU after checking live allocation}"\npython embed-public-corpus.py public-embedding-input.jsonl public-embeddings.sqlite\npython process-public-sessions.py public-session-pending.json\n\`\`\`\n\nThe Canary worker writes resumable receipts under \`session-output/\` and a local \`public-processing.sqlite\` state database. Return those outputs through the existing receipt-import validation path. The E5 worker updates \`public-embeddings.sqlite\` by source hash and model revision.\n`);
writeFileSync(resolve(destination,'verify-handoff.py'),`import hashlib,json\nfrom pathlib import Path\nroot=Path(__file__).parent\nmanifest=json.loads((root/'manifest.json').read_text())\nfor item in manifest['files']:\n p=root/item['name']\n assert p.is_file() and p.stat().st_size==item['bytes'], item['name']+' size mismatch'\n assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'], item['name']+' hash mismatch'\nprint(json.dumps({'status':'verified','files':len(manifest['files']),'pendingAsrJobs':manifest['pendingAsrJobs'],'embeddingPassages':manifest['embeddingPassages']}))\n`);
console.log(JSON.stringify({...manifest,destination},null,2));
