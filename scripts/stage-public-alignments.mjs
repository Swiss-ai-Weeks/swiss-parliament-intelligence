// Stage timing candidates only. Does not alter live video links or mark human review complete.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,mkdirSync} from 'node:fs';
import {openParliament} from '../server/parliament.mjs';
import {alignEditedParagraph} from '../server/word-alignment.mjs';
const db=new DatabaseSync('data/public-processing.sqlite',{readOnly:true}),store=openParliament(),byTranscript=new Map();
for(const s of store.speeches()){const key=String(s.transcriptId);if(!byTranscript.has(key))byTranscript.set(key,[]);byTranscript.get(key).push(s);}
const candidates=[];let recordings=0,matchedRecordings=0;
for(const row of db.prepare('SELECT id,payload FROM transcripts').iterate()){
 const receipt=JSON.parse(row.payload),passages=byTranscript.get(row.id)||[];recordings++;
 if(!passages.length)continue;const words=receipt.segments.flatMap(s=>s.words||[]);let matches=0;
 for(const passage of passages){const timing=alignEditedParagraph(passage.text,words,receipt.duration_seconds);if(!timing)continue;matches++;
  candidates.push({passageId:passage.id,transcriptId:row.id,speaker:passage.speaker,language:passage.language,sourceText:passage.text,sourceUrl:passage.officialUrl,...timing,mediaSha256:receipt.mediaSha256,model:receipt.model,reviewState:'machine-timing-candidate; media availability and human timing review required'});
 }
 if(matches)matchedRecordings++;
}
mkdirSync('data/alignment-review',{recursive:true});writeFileSync('data/alignment-review/candidates.json',JSON.stringify(candidates,null,2));
const report={at:new Date().toISOString(),recordings,matchedRecordings,candidates:candidates.length,published:false};writeFileSync('artifacts/alignment-staging-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));db.close();store.close();
