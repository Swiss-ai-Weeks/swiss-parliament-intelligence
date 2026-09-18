// Apply an explicit, hash-bound extraction review. Changed sources require a new review.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const reviews=JSON.parse(readFileSync('config/party-source-reviews.json','utf8'));
const rows=[];
for(const review of reviews){
 const source=JSON.parse(readFileSync(`data/parties/${review.id}.json`,'utf8'));
 if(source.sourceUrl!==review.sourceUrl||hash(source.text)!==review.extractedSha256)throw Error('REVIEW_STALE:'+review.id);
 let text=source.text;
 if(review.start){const i=text.indexOf(review.start);if(i<0)throw Error('START_MISSING');text=text.slice(i);}
 if(review.end){const i=text.indexOf(review.end);if(i<0)throw Error('END_MISSING');text=text.slice(0,i);}
 text=text.replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n)))
  .replace(/&rsquo;/g,'’').replace(/&lsquo;/g,'‘').replace(/&copy;/g,'©').replace(/&ndash;/g,'–');
 text=text.split('\n').filter(l=>!review.removeLines?.includes(l.trim())).join('\n').trim();
 if(/&(?:#\w+|\w+);/.test(text))throw Error('UNDECODED_ENTITY:'+review.id);
 rows.push({...source,text,sha256:hash(text),extractedSha256:review.extractedSha256,reviewState:'agent-reviewed-extraction',review,independentHumanReview:'pending'});
}
writeFileSync('data/parties/reviewed-input.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log(JSON.stringify({documents:rows.length,scope:'Source and extraction review by coding agent; not independent factual or language adjudication',publication:'staging-only'}));
