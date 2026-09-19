// Bounded, explicitly listed public sources. Staging only: never publish unreviewed extraction.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=text=>createHash('sha256').update(text).digest('hex');
const sources=JSON.parse(readFileSync('config/party-sources.json','utf8'));
const directory='data/parties';mkdirSync(directory,{recursive:true});
function knownDiv(html,pattern){
 const start=pattern.exec(html);if(!start)return null;
 const rest=html.slice(start.index+start[0].length);let depth=1;
 for(const match of rest.matchAll(/<\/?div\b[^>]*>/gi)){depth+=match[0].startsWith('</')?-1:1;if(!depth)return rest.slice(0,match.index);}
 return null;
}
const rows=[],failures=[];
for(const source of sources){
 try{
  const url=new URL(source.url);if(url.protocol!=='https:'||!/^[a-z0-9-]+$/.test(source.id))throw Error('INVALID_SOURCE');
  const receipt=directory+'/'+source.id+'.json';
  if(existsSync(receipt)&&!process.argv.includes('--refresh')){rows.push(JSON.parse(readFileSync(receipt,'utf8')));continue;}
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000),headers:{'User-Agent':'SwissCivicPilot/0.1 (public-source-research)'}});
  if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('SOURCE_HTTP_'+response.status);
  const reader=response.body.getReader();let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4000000){await reader.cancel();throw Error('SOURCE_TOO_LARGE');}chunks.push(value);}
  const html=Buffer.concat(chunks).toString('utf8'),sha=hash(html);
  writeFileSync(directory+'/'+source.id+'-'+sha+'.html',html);
  const selectors={'sp-programme':/<div\b[^>]*class="title-text-text"[^>]*>/i,'plr-exterieur':/<div\b[^>]*id="main-content"[^>]*>/i,'udc-formation':/<div\b[^>]*class="uk-width-3-5@m"[^>]*>/i};
  const selectorId=({'sp-programm-de':'sp-programme','fdp-europa-de':'plr-exterieur','svp-bildung-de':'udc-formation'})[source.id]||source.id;
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||(selectors[selectorId]&&knownDiv(html,selectors[selectorId]));
  if(!main)throw Error('MAIN_CONTENT_REVIEW_REQUIRED');
  const text=main.replace(/<(script|style|nav|header|footer|form)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\/(p|div|h[1-6]|li|section)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
  if(text.length<150)throw Error('INSUFFICIENT_BODY');
  const row={...source,sourceUrl:source.url,sourceKind:'party-self-description',publisher:source.party,retrievedAt:new Date().toISOString(),publishedAt:null,htmlSha256:sha,sha256:hash(text),reviewState:'extraction-review-required',text};
  writeFileSync(receipt,JSON.stringify(row,null,2));rows.push(row);
 }catch(e){failures.push({id:source.id,error:e.message});}
}
writeFileSync(directory+'/embedding-input.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
const report={at:new Date().toISOString(),imported:rows.length,failures,publication:'staging-only',note:'Publication date unknown unless reviewed; retrieval time is not publication date. No personal beliefs inferred.'};
writeFileSync(directory+'/import-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
