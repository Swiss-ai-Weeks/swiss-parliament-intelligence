import {existsSync,readFileSync} from 'node:fs';
export function processingCoverage(root,session){
 const file=`${root}/session-${session.id}/media-jobs.json`;if(!existsSync(file))return session;
 try{const jobs=JSON.parse(readFileSync(file));return {...session,processing:{queued:jobs.length,downloaded:jobs.filter(j=>j.mediaSha256).length,transcribed:jobs.filter(j=>j.asr==='complete').length,aligned:jobs.reduce((n,j)=>n+(j.alignedParagraphs||0),0),vss:jobs.filter(j=>j.vss==='complete').length,failed:jobs.filter(j=>j.stage==='failed'||j.asr==='failed').length}};}catch{return {...session,processing:{status:'unavailable'}};}
}
