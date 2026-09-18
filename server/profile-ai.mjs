import {partyCatalog} from './party-catalog.mjs';
import {research} from './research.mjs';
const norm=s=>String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function profileIntent(question,context={}){
 const q=norm(question);
 if(/\b(say|said|speech|intervention|dit|disait|sagt|gesagt|discorso|dice)\b/.test(q)&&!/\bparty|\bparti\b|\bpartei\b|\bpartito\b/.test(q))return 'speech';
 if(/\b(voted|vote history|voting history|roll.call|votes|scrutins|abstimm|votazioni)\b/.test(q))return 'votes';
 if(/(which|what|quel|quelle|welch|quale).{0,24}(party|parti\b|partei|partito)|belong.{0,24}party|party.{0,24}belong|appartient.{0,24}parti/.test(q))return 'membership';
 if(/\b(party|parti|partei|partito|socialist|socialiste)\b/.test(q))return 'party';
 if(/\b(background|biography|profile|occupation|profession|elected|election|contact|email|e-mail|committee|commissions?|beruf|elu|elue|parcours)\b/.test(q)||/who is|qui est/.test(q))return 'profile';
 if(context.topic==='party'&&/^(and|what about|tell me more|can you tell|et |pourquoi|their |its |und |e )/.test(q))return 'party';
 return 'speech';
}
export async function answerProfile(store,input,env,fetchImpl=fetch){
 const q=norm(input.question),people=store.people?.()||[];
 const named=people.filter(p=>{const parts=norm(p.name).split(/\s+/);return parts.length>1&&parts.every(x=>q.includes(x));});
 const personId=named.length===1?named[0].id:input.personId||(!input.businessId?input.context?.personId:null);
 const p=personId?store.person(String(personId)):null;
 const intent=profileIntent(input.question,input.context);
 if(intent==='speech')return null;
 const context={personId:p?.id,partyId:p?.partyId,topic:intent==='membership'?'party':intent};
 const empty=reason=>({status:'insufficient-evidence',claims:[],passages:[],context,retrieval:{method:'source-type-routing',sourceType:intent},coverage:reason});
 if(!p)return empty('Choose a politician or name them in full so the source can be identified.');
 let passages=[];
 function passage(id,text,url,kind,speaker=p.name){return {id,evidenceId:id,text,language:'fr',officialUrl:url,sourceKind:kind,speaker,date:p.retrievedAt};}
 if(intent==='membership'||intent==='profile'){
  const text=intent==='membership'?`${p.name} — Parti : ${p.party||'non renseigné'}. Groupe parlementaire : ${p.group||'non renseigné'}.`:
   `${p.name}. Parti : ${p.party||'non renseigné'}. Canton : ${p.canton}. Conseil : ${p.council}. Première entrée au Parlement : ${p.firstJoined?.slice(0,10)||'non renseignée'}. Début du mandat actuel : ${p.joined?.slice(0,10)||'non renseigné'}. Parcours déclaré : ${p.declaredMandates||'non renseigné'}. Élection : ${p.elected?.slice(0,10)||'non renseignée'}.`;
  if(p.sourceUrl)passages.push(passage('profile-'+p.id,text,p.sourceUrl,'official-structured-record'));
  if(intent==='profile'){
   for(const [i,o]of(p.occupations||[]).entries())passages.push(passage('occupation-'+p.id+'-'+i,`${p.name} — Profession déclarée : ${o.title}; employeur : ${o.employer||'non renseigné'}; fonction : ${o.role||'non renseignée'}; début : ${o.start?.slice(0,10)||'non renseigné'}; fin : ${o.end?.slice(0,10)||'non renseignée'}.`,o.sourceUrl,'official-structured-record'));
   if(/contact|email|e-mail/.test(q))passages=(p.contacts||[]).map((c,i)=>passage('contact-'+p.id+'-'+i,`${p.name} — Contact professionnel publié : ${c.value}`,c.sourceUrl,'official-structured-record'));
   if(/committee|commission/.test(q))passages=(p.committees||[]).map((c,i)=>passage('committee-'+p.id+'-'+i,`${p.name} — ${c.name} : ${c.role}`,c.sourceUrl,'official-structured-record'));
  }
 }else if(intent==='party'){
  const party=partyCatalog[p.partyId];if(!party)return empty('This party’s background has not yet been reviewed and imported. A parliamentary speech is not a substitute.');
  let topics=party.topics;
  if(/climat|klima|nature|energy|energie/.test(q))topics=topics.filter(t=>t.id==='climate');
  else if(/equal|egal|rights|droits/.test(q))topics=topics.filter(t=>t.id==='equality');
  else if(/rent|pension|cost|money|economic|logement|retrait|cout/.test(q))topics=topics.filter(t=>t.id==='living');
  passages=topics.map(t=>({...passage('party-'+party.id+'-'+t.id,t.text,party.sourceUrl,'party-self-description',party.name),date:party.reviewedAt}));
 }else if(intent==='votes'){
  // Vote browsing is exact and explicit; don't have a model generalize a career from a few votes.
  return {...empty('Use the profile’s voting history to filter dated roll calls and inspect what yes and no meant. No aggregate stance is inferred.'),status:'open-vote-history',profileId:p.id,voteCount:p.votes.length};
 }
 if(!passages.length)return empty('This type of official profile evidence has not been imported yet. Load the profile’s official records.');
 const evidence=passages.slice(0,3).map(s=>({id:s.id,text:s.text,language:s.language,kind:'document',attribution:s.sourceKind==='party-self-description'?'Reviewed editorial summary of the party’s own description; attribute to the party, not the individual.':`Official structured record for ${p.name}, normalized into text.`,source:{url:s.officialUrl}}));
 const started=performance.now();const answer=await research({id:'profile-'+p.id,title:{en:'Official profile and attributed party background'},evidence},{question:input.question,language:input.language||'en'},env,fetchImpl,evidence);
 return {...answer,passages,context,latencyMs:Math.round(performance.now()-started),retrieval:{method:'source-type-routing',sourceType:intent},coverage:intent==='party'?'Reviewed summary of party self-description; not a personal position or independent evaluation.':'Official public profile snapshot; normalized structured fields.'};
}
