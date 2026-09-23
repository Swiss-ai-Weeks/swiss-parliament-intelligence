import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {dirname, extname, join, normalize, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSessionStatus, missingStatusArtifacts} from './session-status.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const canonical=[
  'README.md','CONTRIBUTING.md','docs/README.md','docs/ARCHITECTURE.md','docs/STATUS.md',
  'docs/SESSION-PIPELINE.md','docs/OPERATIONS.md','docs/PRODUCT-SPEC.md','docs/USER-GUIDE.md',
  'docs/AUTH-PROVIDERS-CHECKLIST.md','docs/DEMO-AND-USER-TEST.md'
];
const failures=[];
for(const file of canonical)if(!existsSync(join(root,file)))failures.push(`Missing canonical document: ${file}`);

function walk(directory){
  if(!existsSync(directory))return [];
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(directory,entry.name)):[join(directory,entry.name)]);
}
const markdown=[join(root,'README.md'),join(root,'CONTRIBUTING.md'),join(root,'frontend/AGENTS.md'),...walk(join(root,'docs'))].filter(file=>existsSync(file)&&extname(file).toLowerCase()==='.md');
const slug=value=>value.trim().toLowerCase().replace(/<[^>]+>/g,'').replace(/[`*_~]/g,'').replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,'-').replace(/-+/g,'-');
function anchors(file){
  const counts=new Map(),result=new Set();
  for(const match of readFileSync(file,'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)){
    const base=slug(match[1]),count=counts.get(base)||0;counts.set(base,count+1);result.add(count?`${base}-${count}`:base);
  }
  return result;
}
for(const source of markdown){
  const text=readFileSync(source,'utf8');
  for(const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
    let target=match[1].trim().replace(/^<|>$/g,'');
    if(!target||/^(?:https?:|mailto:|tel:|data:|codex:)/i.test(target)||target.startsWith('/'))continue;
    const hashAt=target.indexOf('#'),fragment=hashAt>=0?decodeURIComponent(target.slice(hashAt+1)):'';
    target=decodeURIComponent((hashAt>=0?target.slice(0,hashAt):target).split('?')[0]);
    const destination=target?resolve(dirname(source),target):source;
    if(!existsSync(destination)){failures.push(`${relative(root,source)} links to missing ${target||'(self)'}`);continue;}
    if(fragment&&statSync(destination).isFile()&&extname(destination).toLowerCase()==='.md'&&!anchors(destination).has(fragment.toLowerCase()))failures.push(`${relative(root,source)} links to missing anchor #${fragment} in ${relative(root,destination)}`);
  }
}

const missing=missingStatusArtifacts();
if(missing.length){console.log(`SKIP status comparison: ${missing.join(', ')}`);}else{
  const report=collectSessionStatus(),expected={passages:16224,recordingJobs:3346,e5Chunks:16241,canaryReceipts:3327,timingCandidates:4899,timingRecordings:1738,vssRecordings:9,vssChunks:400,humanReviewedTimings:0};
  for(const [key,value] of Object.entries(expected))if(report.total[key]!==value)failures.push(`Status mismatch for ${key}: expected ${value}, found ${report.total[key]}`);
  const status=readFileSync(join(root,'docs/STATUS.md'),'utf8'),marker=status.match(/<!-- session-status: (\{.+\}) -->/);
  if(!marker)failures.push('docs/STATUS.md is missing its session-status marker');
  else{
    const recorded=JSON.parse(marker[1]);
    for(const [key,value] of Object.entries(expected))if(recorded[key]!==value)failures.push(`Committed status marker mismatch for ${key}: expected ${value}, found ${recorded[key]}`);
  }
}

if(failures.length){for(const failure of failures)console.error(`ERROR ${failure}`);process.exitCode=1;}
else console.log(`Documentation check passed: ${markdown.length} Markdown files, ${canonical.length} canonical documents.`);
