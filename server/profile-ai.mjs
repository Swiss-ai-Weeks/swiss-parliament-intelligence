import {reviewClaims} from './claim-review.mjs';
import {partyCatalog} from './party-catalog.mjs';
import {research} from './research.mjs';
import {publicTypeSafeReview,reviewClaimsWithTypeSafe} from './typesafe-review.mjs';
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
 function passage(id,text,url,kind,speaker=p.name){return {id,evidenceId:id,text,language:'fr',officialUrl:url,sourceKind:kind,speaker,date:p.retrievedAt,personId:kind==='party-self-description'?undefined:p.id,portraitUrl:kind==='party-self-description'||!p.portraitIdentityVerified?undefined:p.portraitUrl};}
 // Who the answer is about, so the interface can show the portrait and link the full profile page.
 const profile={id:p.id,name:p.name,portraitUrl:p.portraitIdentityVerified?p.portraitUrl:null,party:p.party||null,group:p.group||null,canton:p.canton||null,council:p.council||null,active:Boolean(p.active),voteCount:p.votes?.length||0,voteHistoryComplete:p.voteHistory?.status==='complete-service-query'};
 if(intent==='membership'||intent==='profile'){
  const text=intent==='membership'?`${p.name} — Parti : ${p.party||'non renseigné'}. Groupe parlementaire : ${p.group||'non renseigné'}.`:
   `${p.name}. Parti : ${p.party||'non renseigné'}. Canton : ${p.canton}. Conseil : ${p.council}. Première entrée au Parlement : ${p.firstJoined?.slice(0,10)||'non renseignée'}. Début du mandat actuel : ${p.joined?.slice(0,10)||'non renseigné'}. Parcours déclaré : ${p.declaredMandates||'non renseigné'}. Élection : ${p.elected?.slice(0,10)||'non renseignée'}.`;
  if(p.sourceUrl)passages.push(passage('profile-'+p.id,text,p.sourceUrl,'official-structured-record'));
  if(intent==='profile'){
   for(const [i,o]of(p.occupations||[]).entries())passages.push(passage('occupation-'+p.id+'-'+i,`${p.name} — Profession déclarée : ${o.title}; employeur : ${o.employer||'non renseigné'}; fonction : ${o.role||'non renseignée'}; début : ${o.start?.slice(0,10)||'non renseigné'}; fin : ${o.end?.slice(0,10)||'non renseignée'}.`,o.sourceUrl,'official-structured-record'));
   // Richer official background: terms, committees, recorded-vote counts and speaking activity.
   const terms=(p.membershipHistory||[]).filter(m=>m.start).sort((a,b)=>a.start.localeCompare(b.start));
   if(terms.length)passages.push(passage('terms-'+p.id,`${p.name} — Mandats parlementaires officiels : ${terms.map(m=>`${m.council} (${m.canton||p.canton}) du ${m.start.slice(0,10)} au ${m.end?.slice(0,10)||'aujourd’hui'}`).join(' ; ')}.`,terms[0].sourceUrl||p.sourceUrl,'official-structured-record'));
   if(p.committees?.length)passages.push(passage('committees-'+p.id,`${p.name} — Commissions actuelles : ${p.committees.map(c=>`${c.name}${c.role?` (${c.role})`:''}`).join(' ; ')}.`,p.committees[0].sourceUrl||p.sourceUrl,'official-structured-record'));
   if(p.voteHistory?.status==='complete-service-query'&&p.decisionCounts){const d=p.decisionCounts,n=k=>Object.entries(d).filter(([key])=>k.test(key)).reduce((s,[,v])=>s+v,0);
    passages.push(passage('votes-'+p.id,`${p.name} — Votes nominatifs enregistrés au Conseil national (service officiel des votes) : ${p.votes.length} scrutins ; oui : ${n(/^ja$/i)} ; non : ${n(/^nein$/i)} ; abstentions : ${n(/enthaltung/i)} ; n’a pas participé ou excusé : ${n(/teilgenommen|entschuldigt/i)}. Ces nombres ne décrivent pas une position politique.`,p.sourceUrl,'official-structured-record'));}
   if(p.speeches?.length){const byBusiness=new Map();for(const s of p.speeches)if(s.businessId)byBusiness.set(s.businessId,(byBusiness.get(s.businessId)||0)+1);
    const top=[...byBusiness].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([id,count])=>`${store.get?.('business',id)?.title||id} (${count} interventions)`);
    passages.push(passage('speaking-'+p.id,`${p.name} — Interventions consignées au Bulletin officiel : ${p.speeches.length}. Objets sur lesquels il ou elle est le plus intervenu(e) : ${top.join(' ; ')}.`,p.sourceUrl,'official-structured-record'));}
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
  return {...empty('Use the profile’s voting history to filter dated roll calls and inspect what yes and no meant. No aggregate stance is inferred.'),status:'open-vote-history',profileId:p.id,voteCount:p.votes.length,profile};
 }
 if(!passages.length)return empty('This type of official profile evidence has not been imported yet. Load the profile’s official records.');
 const evidence=passages.slice(0,intent==='profile'?7:3).map(s=>({id:s.id,text:s.text,language:s.language,kind:'document',sourceKind:s.sourceKind,speaker:s.speaker,date:s.date,attribution:s.sourceKind==='party-self-description'?'Reviewed editorial summary of the party’s own description; attribute to the party, not the individual.':`Official structured record for ${p.name}, normalized into text.`,source:{url:s.officialUrl}}));
 const started=performance.now();const answer=await research({id:'profile-'+p.id,title:{en:'Official profile and attributed party background'},evidence},{question:input.question,language:input.language||'en'},env,fetchImpl,evidence);
 if(answer.mode==='live-inference'){
  const reviewed=await reviewClaims(answer.claims,env,fetchImpl,{question:input.question,evidence});answer.claims=reviewed.claims;answer.withheldClaims=(answer.withheldClaims||0)+reviewed.withheld;if(!answer.claims.length)answer.status='insufficient-evidence';
  if(answer.claims.length&&env.TYPESAFE_MODE&&env.TYPESAFE_MODE!=='off')try{const typed=await reviewClaimsWithTypeSafe(answer.claims,env,fetchImpl,{evidence});answer.typesafeReview=publicTypeSafeReview(typed);if(typed.mode==='enforce'){answer.claims=typed.claims;answer.withheldClaims=(answer.withheldClaims||0)+typed.withheld;if(!answer.claims.length)answer.status='insufficient-evidence';}}catch{answer.typesafeReview={status:'unavailable',mode:env.TYPESAFE_MODE,model:env.TYPESAFE_MODEL||'jev-latest'};if(env.TYPESAFE_MODE==='enforce'){answer.claims=[];answer.status='sources-only';answer.mode='source-fallback';answer.notice='The secondary evidence review is unavailable; showing retrieved official profile sources instead.';}}
 }
 return {...answer,profile,passages,context,latencyMs:Math.round(performance.now()-started),retrieval:{method:'source-type-routing',sourceType:intent},coverage:intent==='party'?'Reviewed summary of party self-description; not a personal position or independent evaluation.':'Official public profile snapshot; normalized structured fields.'};
}
