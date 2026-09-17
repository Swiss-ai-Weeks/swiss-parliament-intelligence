import {writeFileSync} from 'node:fs';import {openParliament} from '../server/parliament.mjs';import {answerParliament} from '../server/parliament-ai.mjs';
const store=openParliament(),results=[];
for(const input of [
 {personId:'4025',businessId:'20260206',question:'What did Roland Rino Büchel say about Barbara Portmann?',language:'en',expectedLanguage:'de'},
 {personId:'4220',businessId:'20200406',question:'What did Benjamin Roduit say about access to unemployment benefits?',language:'en',expectedLanguage:'fr'},
 {personId:'11505',businessId:'20254187',question:'What did Giorgio Fonio say about regulatory costs for small businesses?',language:'en',expectedLanguage:'it'},
 {personId:'11505',businessId:'20254187',question:'What did Giorgio Fonio say about tomorrow’s weather on Mars?',language:'en',unsupported:true}
]){const at=performance.now();try{const response=await answerParliament(store,input,process.env);const pass=input.unsupported?response.status==='insufficient-evidence':response.status==='ok'&&response.claims.length>0&&response.claims.every(c=>response.passages.some(p=>'parl-'+p.id===c.evidenceId&&p.personId===input.personId&&p.language===input.expectedLanguage&&p.text.includes(c.quote)));results.push({input,response,latencyMs:Math.round(performance.now()-at),pass});console.log(JSON.stringify({question:input.question,pass,ms:results.at(-1).latencyMs,claims:response.claims?.map(c=>c.text)}));}catch(e){results.push({input,error:e.message,pass:false});}}
writeFileSync('artifacts/session-5214-evaluation.json',JSON.stringify({at:new Date().toISOString(),results},null,2));store.close();if(results.some(r=>!r.pass))process.exitCode=1;
