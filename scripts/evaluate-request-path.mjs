import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.PILOT_TEST_ORIGIN||'http://127.0.0.1:5173';
const inputs=[
 {question:'What does Parliament say about data protection?',language:'en'},
 {question:'What does Parliament say about data protection?',language:'en'},
 {question:'Que dit le Parlement sur la protection des données ?',language:'fr'},
 {question:'What is the weather tomorrow on Mars?',language:'en',expected:'insufficient-evidence'}
];
const results=[];
for(const {expected='ok',...input} of inputs){const start=performance.now();try{
 const r=await fetch(base+'/api/parliament/ask',{method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(base).origin},body:JSON.stringify(input),signal:AbortSignal.timeout(90000)}),answer=await r.json();
 const valid=answer.claims?.every(c=>answer.passages?.some(p=>'parl-'+p.id===c.evidenceId&&p.text.includes(c.quote)));
 results.push({input,http:r.status,status:answer.status,mode:answer.mode,cacheHit:answer.cacheHit,claims:answer.claims?.length,passages:answer.passages?.length,latencyMs:Math.round(performance.now()-start),pass:r.ok&&answer.status===expected&&(expected!=='ok'||valid&&answer.claims.length>0),error:answer.error});
 }catch(e){results.push({input,error:e.message,pass:false});}}
mkdirSync('artifacts',{recursive:true});const report={at:new Date().toISOString(),base,scope:'HTTP origin, status and citation mechanics; not independent semantic review',results};writeFileSync('artifacts/request-path-evaluation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(results.some(r=>!r.pass))process.exitCode=1;
