import {readFileSync,copyFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {createStore} from '../server/store.mjs';
// Input is a reviewed transcript or a provenance-checked publisher caption manifest.
const manifest=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(!manifest.source?.url?.startsWith('https://')||!manifest.source.title||!manifest.source.id||!manifest.rightsNote||!manifest.pipeline||!manifest.reviewedBy||!Number.isFinite(manifest.duration)||manifest.duration<=0||manifest.duration>1200||!Array.isArray(manifest.segments)||!manifest.segments.length)throw new Error('Manifest requires provenance, reviewer, duration <=1200s and segments');
const reviewState=manifest.reviewState||'operator-reviewed';
if(!['operator-reviewed','official-publisher-captions'].includes(reviewState))throw new Error('Unsupported review state');
if(reviewState==='official-publisher-captions'&&!manifest.source.publisherPage?.startsWith('https://'))throw new Error('Publisher captions require an official linking page');
const media=resolve(manifest.mediaPath);if(!existsSync(media)||!media.endsWith('.mp4'))throw new Error('Local MP4 required');
const bytes=readFileSync(media);const hash=createHash('sha256').update(bytes).digest('hex');const name=hash.slice(0,20)+'-'+basename(media).replace(/[^a-zA-Z0-9._-]/g,'_');
const s=createStore();try{
 if(!s.getDossier(manifest.dossierId))throw new Error('Unknown dossier');
 let previous=-1;const rows=manifest.segments.map((segment,i)=>{
  if(!Number.isFinite(segment.start)||!Number.isFinite(segment.end)||segment.start<0||segment.end<=segment.start||segment.end>manifest.duration||segment.start<previous||typeof segment.text!=='string'||!segment.text.trim()||!['de','fr','it','rm','en'].includes(segment.language))throw new Error('Invalid timestamp/text/language at segment '+i);
  previous=segment.end;const id=hash.slice(0,16)+'-'+i;if(s.getEvidence(id))throw new Error('Evidence already imported');
  return {...segment,id,dossierId:manifest.dossierId,sourceId:manifest.source.id,kind:'video',sourceKind:manifest.sourceKind||'parliamentary-recording',mediaUrl:'/media/'+name,revision:1,reviewState,attribution:segment.speaker||'Speaker unconfirmed',speaker:segment.speaker||null,pipeline:manifest.pipeline,rightsNote:manifest.rightsNote,reviewedBy:manifest.reviewedBy,mediaSha256:hash};
 });
 mkdirSync('data/media',{recursive:true});copyFileSync(media,'data/media/'+name);
 s.db.exec('BEGIN');try{s.db.prepare('INSERT OR REPLACE INTO sources VALUES(?,?)').run(manifest.source.id,JSON.stringify(manifest.source));for(const row of rows)s.db.prepare('INSERT INTO evidence VALUES(?,?,?)').run(row.id,row.dossierId,JSON.stringify(row));s.db.exec('COMMIT');}catch(err){s.db.exec('ROLLBACK');throw err;}
 console.log(`Imported ${rows.length} reviewed video passages. Verify player timing before demo.`);
}finally{s.close();}
