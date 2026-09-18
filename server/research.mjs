import {readFileSync} from 'node:fs';
import {evidencePolicy,ANSWER_POLICY_VERSION,unsupportedCollectiveClaim} from './answer-policy.mjs';
export const languages = ['en','fr','de','it','rm'];
export const actions = ['explain','compare','translate','brief'];
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function retrieve(dossier, question, action) {
  const items = dossier.evidence.filter(e=>e.id!=='rm-civic-passage');
  if (!question) return action === 'compare' ? items.filter(e=>['support','opposition'].includes(e.stance)) : items;
  const q=normalize(question);
  // In extract mode, only explicitly supported question families are answered.
  if (/(weather|meteo|tomorrow|demain|password|mot de passe|recommend.*vot|should i vote|dois.je voter|predict|prediction|who.*vot|qui.*vote|secret|ignore|instruction|donald|bitcoin)/.test(q)) return [];
  if (/(official video|video officielle|video officiel|offiziell.*video)/.test(q)) return items.filter(e=>e.kind==='video');
  if (/(when|date|result|outcome|accepted|rejected|quand|resultat|accepte|rejete|wann|ergebnis|quando|risultato)/.test(q)) return items.filter(e=>e.id.endsWith('overview'));
  if (/(compar|argument|disagree|positions|pour et contre)/.test(q)) return items.filter(e=>['support','opposition'].includes(e.stance));
  if (/(opponent|against|risk|privacy|opposant|contre|risque|vie privee|datenschutz)/.test(q)) return items.filter(e=>e.stance==='opposition');
  if (/(support|voluntary|optional|facultati|partisan)/.test(q)) return items.filter(e=>e.stance==='support');
  if (/^(explain (this|the proposal|the initiative)|summari[sz]e (this|the proposal|the initiative)|what (is|was) (this|the proposal|the initiative|e-id)|explique (ce|cette|le projet)|resume (ce|cette|le projet)|de quoi parle|qu.est.ce que (ce projet|cette initiative|l.e-id)|worum geht|spiega (questa|questo))/.test(q)) return items;
  return [];
}
export function validateClaims(claims, evidence) {
  if(!Array.isArray(claims)||claims.length>12) throw new Error('INVALID_MODEL_CLAIMS');
  return claims.map(c=>{
    const e=evidence.find(e=>e.id===c.evidenceId);
    if(!e||typeof c.text!=='string'||!c.text.trim()||c.text.length>2500||typeof c.quote!=='string'||c.quote.trim().length<4||!e.text.includes(c.quote)) throw new Error('INVALID_MODEL_CITATION');
    return {text:c.text,evidenceId:e.id,quote:c.quote};
  });
}
export async function research(dossier,{question='',action='explain',language='en'},env=process.env,fetchImpl=fetch,selectedEvidence=null) {
  if(env.DEMO_REPLAY_FILE){
    const archive=JSON.parse(readFileSync(env.DEMO_REPLAY_FILE,'utf8'));
    const row=archive.results.find(r=>r.dossierId===dossier.id&&r.question===question&&(r.action||'explain')===action&&r.language===language&&r.pass);
    if(!row)return {status:'insufficient-evidence',mode:'recorded-replay',claims:[],language};
    validateClaims(row.response.claims,dossier.evidence);
    return {...row.response,mode:'recorded-replay',recordedAt:archive.at};
  }
  const retrieved=selectedEvidence||retrieve(dossier,question,action);
  const videoLanguage=['de','fr','it','rm'].includes(language)?language:'fr';
  const evidence=retrieved.filter(e=>e.kind!=='video'||e.language===videoLanguage);
  if(!evidence.length) return {status:'insufficient-evidence',mode:'extractive',claims:[],language};
  if(!env.INFERENCE_BASE_URL || !env.INFERENCE_MODEL) {
    if(action==='translate' && !evidence.every(e=>e.language===language || e.translations?.[language])) return {status:'translation-unavailable',mode:'extractive',claims:[],language};
    return {status:'ok',mode:'editorial-extracts',language,claims:evidence.map(e=>({text:e.translations?.[language]||e.text,evidenceId:e.id,quote:e.text,language:e.translations?.[language]?language:e.language})),notice:'Source-backed editorial extracts; no live model used.'};
  }
  if(language==='rm') return {status:'translation-unavailable',mode:'curated-romansh-only',claims:[],language};
  async function infer(evidence) {
  const response=await fetchImpl(env.INFERENCE_BASE_URL.replace(/\/$/,'')+'/chat/completions',{
    method:'POST',signal:AbortSignal.timeout(45000),headers:{'Content-Type':'application/json',...(env.INFERENCE_API_KEY?{Authorization:'Bearer '+env.INFERENCE_API_KEY}:{})},
    body:JSON.stringify({model:env.INFERENCE_MODEL,temperature:0,max_tokens:2400,response_format:{type:'json_schema',json_schema:{name:'cited_answer',strict:true,schema:{type:'object',additionalProperties:false,required:['claims'],properties:{claims:{type:'array',maxItems:12,items:{anyOf:evidence.map(e=>({type:'object',additionalProperties:false,required:['text','evidenceId'],properties:{text:{type:'string'},evidenceId:{type:'string',enum:[e.id]}}}))}}}}}},messages:[
      {role:'system',content:'/no_think\n'+evidencePolicy+'\nReturn only JSON with claims: [{text, evidenceId}]. Cite only the supplied evidence ID. The server attaches the exact quotation; do not generate a quote field. Each claim must be supported entirely by this one record. At most two short sentences per claim. For translation, translate the supplied text faithfully instead of answering a factual question. For comparisons retain attributed positions. Return empty claims when the record is irrelevant. For parliamentary speech claims, begin the answer with the recorded speaker name followed by a colon. If a broad question asks what Parliament says, describe what this named speaker says about that subject; do not substitute Parliament for the speaker.'},
      {role:'user',content:JSON.stringify({dossierTitle:dossier.title?.en,question:question||({explain:'Explain the supplied passage.',compare:'State the supplied side of the argument, naming its proponent. The application will assemble both sides.',translate:'Translate the supplied passage into the requested language, preserving attribution.',brief:'Write one factual briefing point supported by this passage.'}[action]),action,language,scope:'You are processing one source record. Answer only the part supported by that record. The application assembles records afterwards. Do not add an introductory summary of the broader issue.',evidence:evidence.map(({id,text,attribution,stance,sourceKind,speaker,speakerRole,date})=>({id,text,attribution,stance,sourceKind,speaker,speakerRole,date}))})}
    ]})
  });
  if(!response.ok) throw new Error('INFERENCE_UNAVAILABLE');
  const payload=await response.json();
  const generated=JSON.parse(payload.choices?.[0]?.message?.content||'{}').claims;
  if(!Array.isArray(generated))throw new Error('INVALID_MODEL_CLAIMS');
  const claims=validateClaims(generated.map(c=>({...c,quote:evidence.find(e=>e.id===c.evidenceId)?.text})),evidence);
  return claims;
  }
  // Isolate generation by source so a fluent synthesis cannot silently cite just
  // one passage for facts that came from several unrelated records.
  // Keep each inference isolated to one source, but overlap two requests.
  const groups=[];
  for(let i=0;i<evidence.length;i+=2)groups.push(...await Promise.all(evidence.slice(i,i+2).map(entry=>infer([entry]))));
  const generatedClaims=groups.flat();
  const claims=generatedClaims.filter(c=>!unsupportedCollectiveClaim(c.text,evidence.find(e=>e.id===c.evidenceId)));
  const withheldClaims=generatedClaims.length-claims.length;
  return {status:claims.length?'ok':'insufficient-evidence',mode:'live-inference',model:env.INFERENCE_MODEL,claims,language,withheldClaims,policyVersion:ANSWER_POLICY_VERSION};
}
export function markdownBrief(dossier,items,language='en') {
  const title=dossier.shortTitle[language]||dossier.shortTitle.en;
  return `# ${title}\n\nMidnight Vote — Swiss Pilot\nHistorical vote: ${dossier.date} · ${dossier.result}\n\nSource-backed editorial evidence collection. Human review required before publication.\n\n`+items.map(e=>`## ${e.attribution}\n\n${e.translations?.[language]||e.text}\n\n[${e.source.title}](${e.source.url}) · Evidence ${e.id}, revision ${e.revision}${e.kind==='video'?` · ${e.start}–${e.end}s`:''}\n`).join('\n');
}
