import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const MODEL='cosmos-embed1-448p';
export function cosine(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length||a.some(x=>!Number.isFinite(x))||b.some(x=>!Number.isFinite(x)))throw Error('INVALID_EMBEDDING');
 let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}if(!aa||!bb)throw Error('ZERO_EMBEDDING');return dot/Math.sqrt(aa*bb);
}
export function loadVideoIndex(root,store){
 const chunks=[],speechMap=new Map();for(const s of store.speeches())if(!speechMap.has(s.transcriptId))speechMap.set(s.transcriptId,s);
 if(!existsSync(root))return chunks;
 for(const name of readdirSync(root).filter(n=>/^session-\d+$/.test(n))){
  const dir=join(root,name),manifest=join(dir,'media-jobs.json');if(!existsSync(manifest))continue;
  for(const job of JSON.parse(readFileSync(manifest))){
   if(job.vss!=='complete'||!/^\d+$/.test(job.id))continue;
   const file=join(dir,job.id+'-embeddings.json');if(!existsSync(file))continue;
   const data=JSON.parse(readFileSync(file)),receipt=JSON.parse(readFileSync(join(dir,job.id+'-vss.json'))),s=speechMap.get(job.id);
   if(!s||data.model!==MODEL||receipt.sha256!==job.mediaSha256||data.chunk_responses?.length!==job.vssChunks)continue;
   for(const c of data.chunk_responses){const start=Number(c.start_time),end=Number(c.end_time);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>(job.mediaDurationSeconds||job.durationHintSeconds)+.1)continue;
    chunks.push({id:job.id+':'+start,transcriptId:job.id,personId:s.personId,businessId:s.businessId,speaker:s.speaker,date:s.date,language:s.language,sourceUrl:s.officialUrl,mediaUrl:'/media/'+job.mediaFile,start,end,embedding:c.embeddings});
   }
  }
 }return chunks;
}
export function rankVideoChunks(chunks,vector,limit=4){
 const ranked=chunks.map(c=>({...c,score:cosine(vector,c.embedding)})).sort((a,b)=>b.score-a.score),selected=[];
 for(const c of ranked){if(selected.some(x=>x.transcriptId===c.transcriptId&&Math.abs(x.start-c.start)<20))continue;if(selected.filter(x=>x.transcriptId===c.transcriptId).length>=2)continue;const {embedding,...safe}=c;selected.push(safe);if(selected.length>=limit)break;}return selected;
}
export async function searchVideo({root,store,query,mode='spoken',personId,businessId,env,fetchImpl=fetch}){
 const started=Date.now();
 if(mode==='spoken'){
  const matches=store.search(query,{personId,businessId,limit:20});
  return {mode,status:'ok',matches:matches.filter(s=>s.video).slice(0,6).map(s=>({id:s.id,speaker:s.speaker,date:s.date,language:s.language,text:s.text,sourceUrl:s.officialUrl,mediaUrl:s.video.url,start:s.video.start,end:s.video.end,reviewState:s.video.reviewState})),unavailableTiming:matches.filter(s=>!s.video).length,latencyMs:Date.now()-started};
 }
 const chunks=loadVideoIndex(root,store).filter(c=>(!personId||c.personId===personId)&&(!businessId||c.businessId===businessId));
 if(!chunks.length)return {mode,status:'ok',matches:[],indexedChunks:0};
 if(!env.VSS_EMBED_BASE_URL)throw Error('VIDEO_MODEL_UNAVAILABLE');
 const r=await fetchImpl(env.VSS_EMBED_BASE_URL.replace(/\/$/,'')+'/v1/generate_text_embeddings',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({text_input:query,model:MODEL})});
 if(!r.ok)throw Error('VIDEO_MODEL_UNAVAILABLE');const data=await r.json();if(data.model!==MODEL||data.data?.[0]?.text_input!==query)throw Error('INVALID_VIDEO_MODEL_OUTPUT');
 return {mode,status:'ok',matches:rankVideoChunks(chunks,data.data[0].embeddings),indexedChunks:chunks.length,model:MODEL,latencyMs:Date.now()-started,reviewState:'Exploratory visual similarity; not evidence of spoken content. Scores are not confidence probabilities.'};
}
