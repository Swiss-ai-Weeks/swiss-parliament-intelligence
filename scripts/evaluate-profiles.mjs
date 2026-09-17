import {writeFileSync} from 'node:fs';
const results=[];let context;
for(const question of ['What party does Jessica Jaccoud belong to?','Can you tell me more about that political party?','What about their climate policy?','What does Jessica Jaccoud say about data protection?']){
 const at=performance.now();const r=await fetch('http://127.0.0.1:4318/api/parliament/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personId:'10820',question,language:'en',context})});const response=await r.json();context=response.context;results.push({question,http:r.status,latencyMs:Math.round(performance.now()-at),response});console.log(JSON.stringify({question,status:response.status,route:response.retrieval?.sourceType||response.retrieval?.method,claims:response.claims?.map(c=>({text:c.text,id:c.evidenceId})),ms:results.at(-1).latencyMs}));
}
writeFileSync('artifacts/profile-evaluation.json',JSON.stringify({at:new Date().toISOString(),results},null,2));
