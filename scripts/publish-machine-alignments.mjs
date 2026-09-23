// Publishes staged Canary alignment candidates to data/parliament/video-alignments.json so answers can
// open the official intervention video at the matched paragraph. Every entry stays labelled as a
// machine timing: nothing here is a human-reviewed quotation boundary.
import {existsSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const minFraction=Number(process.argv.find(a=>a.startsWith('--min-fraction='))?.split('=')[1]||0.85);
if(!(minFraction>=0.5&&minFraction<=1))throw new Error('INVALID_MIN_FRACTION');
const candidatesFile=resolve(root,'data/alignment-review/candidates.json'),target=resolve(root,'data/parliament/video-alignments.json');
if(!existsSync(candidatesFile))throw new Error('RUN_STAGE_PUBLIC_ALIGNMENTS_FIRST');
const candidates=JSON.parse(readFileSync(candidatesFile,'utf8'));
const published=existsSync(target)?JSON.parse(readFileSync(target,'utf8')):{};
const best=new Map();
for(const c of candidates){
 if(!/^\d+-\d+$/.test(c.passageId)||!/^\d+$/.test(c.transcriptId)||!c.passageId.startsWith(c.transcriptId+'-'))continue;
 if(!(c.matchedFraction>=minFraction)||!(c.start>=0)||!(c.end>c.start)||c.end-c.start>600)continue;
 if(!(best.get(c.passageId)?.matchedFraction>=c.matchedFraction))best.set(c.passageId,c);
}
let added=0,kept=0;
for(const [passageId,c] of best){
 // Earlier entries point at locally hosted clips; keep them rather than replacing with a stream URL.
 if(published[passageId]&&!published[passageId].method?.startsWith('NVIDIA Canary')){kept++;continue;}
 const officialVideoUrl=`https://par-pcache.simplex.tv/content/simvid_1.mp4?externalid=${c.transcriptId}`;
 published[passageId]={url:officialVideoUrl,start:c.start,end:c.end,officialVideoUrl,method:'NVIDIA Canary word timestamps matched to the official Bulletin paragraph',matchedFraction:Math.round(c.matchedFraction*1000)/1000,model:c.model,mediaSha256:c.mediaSha256,reviewState:'machine-aligned; human timing review pending'};
 added++;
}
const temporary=target+'.tmp';writeFileSync(temporary,JSON.stringify(published));renameSync(temporary,target);
console.log(JSON.stringify({minFraction,candidates:candidates.length,eligible:best.size,published:added,keptLocalClips:kept,total:Object.keys(published).length,reviewState:'machine-aligned; human timing review pending'}));
