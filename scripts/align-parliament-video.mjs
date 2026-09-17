import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openParliament} from '../server/parliament.mjs';
const asr=JSON.parse(readFileSync('artifacts/parliament-336838-asr.json','utf8'));
const db=openParliament(),normalize=t=>t.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
const words=asr.segments.flatMap(s=>s.words).flatMap(w=>normalize(w.word).map(token=>({...w,token})));
const alignments={};
for(const id of ['336838-2','336838-4']){
 const s=db.get('speech',id),prefix=normalize(s.text).slice(0,5);
 const matches=words.map((w,i)=>prefix.every((t,j)=>words[i+j]?.token===t)?i:-1).filter(i=>i>=0);
 if(matches.length!==1)throw new Error('Non-unique alignment anchor for '+id);
 const start=words[matches[0]].start;
 // Paragraph end comes from the next spoken paragraph's segment boundary.
 const next=id==='336838-2'?'Autre élément intéressant':'In validant';
 const end=asr.segments.find(s=>s.start>start&&s.text.startsWith(next))?.start;
 if(!end||end<=start)throw new Error('Missing alignment endpoint');
 alignments[id]={url:'/media/parliament-336838.mp4',start,end,officialVideoUrl:'https://par-pcache.simplex.tv/content/simvid_1.mp4?externalid=336838',method:'NVIDIA Parakeet word-timestamp prefix match and following paragraph boundary',reviewState:'machine-aligned; human timing review pending',anchor:prefix.join(' '),model:asr.model,mediaSha256:createHash('sha256').update(readFileSync('data/media/parliament-336838.mp4')).digest('hex')};
}
writeFileSync('data/parliament/video-alignments.json',JSON.stringify(alignments,null,2));writeFileSync('artifacts/parliament-video-alignment.json',JSON.stringify({at:new Date().toISOString(),transcriptId:'336838',duration:asr.duration_seconds,alignments},null,2));db.close();console.log(alignments);
