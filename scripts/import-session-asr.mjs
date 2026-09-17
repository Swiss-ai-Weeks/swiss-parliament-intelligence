import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {openParliament} from '../server/parliament.mjs';
import {alignParagraph} from '../server/word-alignment.mjs';
const sessionId=process.argv.find(a=>a.startsWith('--session='))?.split('=')[1]||'5214';if(!/^\d{4}$/.test(sessionId))throw Error('Invalid session');
const dir=`data/parliament/session-${sessionId}`,jobs=JSON.parse(readFileSync(dir+'/media-jobs.json')),file='data/parliament/video-alignments.json',alignments=existsSync(file)?JSON.parse(readFileSync(file)):{};const store=openParliament();
for(const job of jobs){const path=dir+'/'+job.id+'-asr.json';if(!existsSync(path))continue;const asr=JSON.parse(readFileSync(path));if(!Array.isArray(asr.segments)||!asr.segments.length)throw Error('Empty ASR result');job.asr='complete';job.alignedParagraphs=0;
 for(const s of store.speeches().filter(s=>s.transcriptId===job.id)){const found=alignParagraph(s.text,asr.segments.flatMap(s=>s.words||[]),asr.duration_seconds);if(!found)continue;alignments[s.id]={...found,url:'/media/'+job.mediaFile,officialVideoUrl:job.officialVideoUrl,mediaSha256:job.mediaSha256,model:asr.model,method:'Unique original-text prefix and suffix anchors with ordered token check',reviewState:'machine-aligned; human timing review pending'};job.alignedParagraphs++;}
 job.alignment=job.alignedParagraphs?'partial-machine-alignment':'needs-review';job.stage='transcribed';console.log(job.id,job.language,job.alignedParagraphs,'aligned paragraphs');}
writeFileSync(file,JSON.stringify(alignments,null,2));writeFileSync(dir+'/media-jobs.json',JSON.stringify(jobs,null,2));store.close();
