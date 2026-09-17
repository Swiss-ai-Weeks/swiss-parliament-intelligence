import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
// Inputs are the publisher subtitles and ffprobe outputs cached from the official-linked videos.
const ids={de:'AZI56JPOcpM',fr:'ViBVK74mxS8',it:'UNT0qj0Kx8Q',rm:'jlwArM-AB8c'};
const seconds=s=>s.split(':').reduce((n,v)=>n*60+Number(v),0);
for(const [language,id] of Object.entries(ids)){
 const vtt=readFileSync(`data/imports/eid-${language}.${language}.vtt`,'utf8');
 const cues=[...vtt.matchAll(/(\d\d:\d\d:\d\d\.\d+) --> (\d\d:\d\d:\d\d\.\d+)[^\n]*\n([\s\S]*?)(?=\r?\n\r?\n|$)/g)];
 if(!cues.length)throw new Error('No captions: '+language);
 const first=cues[0];
 const duration=Number(JSON.parse(readFileSync(`data/imports/eid-${language}-probe.json`,'utf8')).format.duration);
 const manifest={dossierId:'eid',mediaPath:resolve(`data/imports/eid-${language}-web.mp4`),duration,
  source:{id:`eid-official-video-${language}`,title:`Federal Council e-ID explainer (${language.toUpperCase()}, 2025)`,url:`https://www.youtube.com/watch?v=${id}`,publisherPage:'https://www.eid.admin.ch/en/abstimmungsvideo-zur-e-id-ist-veroeffentlicht-e',checkedAt:'2026-09-17'},
  sourceKind:'federal-council-explainer',reviewState:'official-publisher-captions',reviewedBy:'Publisher-caption provenance checked by Codex; independent language review pending',
  rightsNote:'Official federal public-information video linked by eid.admin.ch; retained for this attributed local research pilot. Confirm reuse terms before public redistribution.',
  pipeline:'Publisher subtitles; H.264/AAC transcoding without timeline change. French also processed separately by NVIDIA Parakeet; ASR is not substituted for captions.',
  segments:[{start:seconds(first[1]),end:seconds(first[2]),text:first[3].replace(/&nbsp;/g,' ').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim(),language,stance:'context',speaker:'Federal Council explainer narrator'}]};
 writeFileSync(`data/imports/eid-${language}-manifest.json`,JSON.stringify(manifest,null,2));
}
console.log('Prepared four provenance-linked publisher-caption manifests.');
