// Synthetic evaluation only. These examples are never imported as public evidence.
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewClaimsWithTypeSafe} from '../server/typesafe-review.mjs';

if(!process.env.TYPESAFE_API_KEY)throw new Error('TYPESAFE_API_KEY_REQUIRED');
const fixtures=[
 ['support','Je soutiens le projet.','Alex Example supports the proposal.','supports','fr'],
 ['negation','Nous ne soutenons pas cette motion.','Alex Example supports the motion.','contradicts','fr'],
 ['committee','La majorité de la commission recommande le rejet. Je présente ici son rapport.','The committee majority recommends rejection.','supports','fr'],
 ['personal','La majorité de la commission recommande le rejet. Je présente ici son rapport.','Alex Example personally opposes the proposal.','says_nothing','fr'],
 ['conditional','Je soutiendrai ce projet si la protection des données est garantie.','Support is conditional on data-protection guarantees.','supports','fr'],
 ['stage','The committee recommends adoption. The council has not yet voted.','Parliament has adopted the proposal.','contradicts','en'],
 ['uncertain','Les effets ne sont pas encore connus.','The effects are not yet known.','supports','fr'],
 ['invented','Le coût est inconnu.','The cost is exactly ten million francs.','says_nothing','fr']
];
const evidence=fixtures.map(([id,source,,,language])=>({id,text:source,language,sourceKind:'synthetic-evaluation',speaker:'Alex Example',speakerRole:'member',date:'2026-01-01'}));
const claims=fixtures.map(([id,source,claim])=>({text:claim,evidenceId:id,quote:source}));
const started=performance.now(),result=await reviewClaimsWithTypeSafe(claims,{...process.env,TYPESAFE_MODE:'shadow'},fetch,{evidence});
const rows=result.decisions.map((decision,index)=>({id:fixtures[index][0],expected:fixtures[index][3],actual:decision.relation,confidence:decision.confidence,auto:decision.auto,pass:decision.relation===fixtures[index][3]}));
const report={at:new Date().toISOString(),scope:'Synthetic claim/source relations in English and French; not a guarantee on the parliamentary corpus',model:result.model,threshold:result.threshold,latencyMs:Math.round(performance.now()-started),usage:result.usage,passed:rows.filter(row=>row.pass).length,total:rows.length,results:rows};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/typesafe-evaluation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(rows.some(row=>!row.pass))process.exitCode=1;
