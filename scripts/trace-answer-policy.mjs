import {openParliament} from '../server/parliament.mjs';
import {answerParliament} from '../server/parliament-ai.mjs';
import {writeFileSync} from 'node:fs';
const traces=[],store=openParliament();
const traced=async(url,options)=>{const request=JSON.parse(options.body);const response=await fetch(url,options);const clone=response.clone();traces.push({schema:request.response_format?.json_schema?.name,input:request.messages.at(-1).content,output:await clone.json()});return response;};
let answer;try{answer=await answerParliament(store,{question:'What does Parliament say about data protection?',language:'en'},process.env,traced);}catch(e){answer={status:e.message};}
writeFileSync('artifacts/answer-policy-trace.json',JSON.stringify({answer,traces},null,2));console.log(JSON.stringify({status:answer.status,withheld:answer.withheldClaims,traces:traces.map(t=>({schema:t.schema,output:t.output.choices?.[0]?.message?.content||t.output}))}));store.close();
