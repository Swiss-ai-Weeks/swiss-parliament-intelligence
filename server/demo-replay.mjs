// Recorded answers for the prepared demonstration questions only. They are used when the live model
// is unreachable or fails, and always carry their recording time so they are never mistaken for live.
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const key=(question,language)=>String(language||'en')+'|'+String(question||'').normalize('NFKC').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').replace(/[\s?!.]+$/,'').trim();
let cache=null;
export function loadRecordedAnswers(root){
 const file=join(root,'config/demo-answers.json');
 if(!existsSync(file))return new Map();
 const mtime=readFileSync(file,'utf8');if(cache?.source===mtime)return cache.map;
 const data=JSON.parse(mtime);
 const map=new Map((data.answers||[]).filter(a=>a.question&&a.answer&&['ok','refused'].includes(a.answer.status)).map(a=>[key(a.question,a.language),a]));
 cache={source:mtime,map};return map;
}
export function findRecordedAnswer(root,question,language){return loadRecordedAnswers(root).get(key(question,language))||null;}
export function replayRecorded(recorded){
 return {...recorded.answer,mode:'recorded-replay',recordedAt:recorded.recordedAt,recordedModel:recorded.model,cacheHit:false,
  notice:'Recorded answer: the live model is unavailable right now, so this is the verified answer Cleisthenes produced for this exact question earlier.'};
}
// Only infrastructure failures fall back; an honest refusal or "not enough evidence" is never replaced.
export const infrastructureFailure=answer=>answer?.status==='provider-unavailable'||answer?.mode==='source-fallback';
