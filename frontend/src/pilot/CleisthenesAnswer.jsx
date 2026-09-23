import React,{useEffect,useRef,useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
import {ArrowUpRight,MagnifyingGlass,Play,Quotes} from '@phosphor-icons/react';
import PassageVideo from './PassageVideo.jsx';
import {openProfile} from './navigation.js';
import './cleisthenes-answer.css';

const LANGUAGE_LABEL={fr:'FR',de:'DE',it:'IT',rm:'RM',en:'EN'};
const excerpt=(text,max=220)=>{const t=String(text||'').replace(/\s+/g,' ').trim();return t.length>max?t.slice(0,max).replace(/\s+\S*$/,'')+'…':t;};

// Maps a typed citation back to the passage shape the evidence drawer and video player expect.
export function citationPassage(answer,citation){
 const p=answer.passages?.find(x=>x.id===citation.passageId);
 return {...(p||{}),id:citation.passageId,transcriptId:citation.transcriptId,speaker:citation.speaker,date:citation.date,text:p?.text||citation.quote,language:citation.originalLanguage,officialUrl:citation.officialUrl,personId:citation.personId,speakerFunction:citation.role,council:citation.council,sourceKind:citation.sourceType,...(citation.video?{video:citation.video}:{})};
}

export default function CleisthenesAnswer({answer,language,onCite,onFollowUp,disabled}){
 const fr=language==='fr',t=(en,frText)=>fr?frText:en;
 const citations=answer.citations||[],number=id=>citations.findIndex(c=>c.id===id)+1;
 const day=value=>value?new Date(value).toLocaleDateString(fr?'fr-CH':'en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
 const chips=ids=>ids.map(id=>{const c=citations.find(x=>x.id===id);if(!c)return null;const n=number(id);
  return <span className="cite" key={id}><button type="button" className="cite-chip" onClick={()=>cite(c)} aria-label={t(`Source ${n}: ${c.speaker}, ${day(c.date)}. Open evidence`,`Source ${n} : ${c.speaker}, ${day(c.date)}. Ouvrir la preuve`)}>{n}</button>
   <span className="cite-preview" role="tooltip"><strong>{c.speaker}</strong><small>{day(c.date)} · {LANGUAGE_LABEL[c.originalLanguage]||''}{c.video?t(' · video moment',' · moment vidéo'):''}</small><span>“{excerpt(c.quote,160)}”</span></span></span>;});
 const paragraph=(p,key,className)=><p key={key} className={className}>{p.text} {chips(p.citationIds||[])}</p>;
 const featured=citations.find(c=>c.video)||citations[0],summary=answer.researchSummary;
 const [active,setActive]=useState(featured?.id);
 // Every way into a source (chip, list, tab) keeps the evidence card on that same source.
 const cite=c=>{setActive(c.id);onCite(c);};
 return <div className="cleisthenes-answer">
  {answer.mode==='recorded-replay'&&<p className="answer-notice" role="note">{t(`Recorded answer from ${day(answer.recordedAt)}: the live model is unavailable right now, so Cleisthenes is showing the verified answer it produced earlier for this exact question.`,`Réponse enregistrée le ${day(answer.recordedAt)} : le modèle en direct est indisponible, Cleisthenes affiche la réponse vérifiée produite plus tôt pour cette question.`)}</p>}
  {summary?.broadened&&<p className="answer-notice" role="note">{summary.broadened.to==='debate'?t(`Nothing in the selected passage answered this, so Cleisthenes widened the search to the whole debate${summary.broadened.title?` on “${summary.broadened.title}”`:''}.`,`L’extrait sélectionné ne répondait pas à la question : Cleisthenes a élargi la recherche à tout le débat${summary.broadened.title?` sur « ${summary.broadened.title} »`:''}.`):t('Nothing in the selected scope answered this, so Cleisthenes searched the whole imported record.','La sélection ne répondait pas à la question : Cleisthenes a cherché dans l’ensemble des documents importés.')}</p>}
  {answer.profile&&<ProfileCard profile={answer.profile} t={t}/>}
  {paragraph(answer.answer.lead,'lead','answer-lead')}
  {answer.answer.sections?.map((s,i)=><section key={i} className="answer-section"><h3>{s.title}</h3>{s.paragraphs.map((p,j)=>paragraph(p,j))}</section>)}
  {featured&&<EvidenceMoments answer={answer} citations={citations} active={active} setActive={setActive} onOpen={c=>onCite(c)} language={language} t={t} day={day}/>}
  {citations.length>0&&<ol className="answer-sources" aria-label={t('Sources','Sources')}>{citations.map((c,i)=><li key={c.id}><button type="button" onClick={()=>cite(c)}><span className="answer-source-n">{i+1}</span><span><strong>{c.speaker}</strong><small>{day(c.date)} · {LANGUAGE_LABEL[c.originalLanguage]||''}{c.title?` · ${excerpt(c.title,70)}`:''}{c.video?t(' · video',' · vidéo'):''}</small></span></button></li>)}</ol>}
  {answer.web&&<WebResearch web={answer.web} t={t}/>}
  {summary&&<ResearchSummary summary={summary} t={t}/>}
  {answer.suggestedFollowUps?.length>0&&<div className="answer-followups"><p>{t('Continue exploring','Continuer l’exploration')}</p>{answer.suggestedFollowUps.map(q=><button type="button" key={q} disabled={disabled} onClick={()=>onFollowUp(q)}>{q}<ArrowUpRight size={13}/></button>)}</div>}
 </div>;
}

function methodLabel(summary,t){
 if(summary.method==='official-profile')return t('Official Parliament profile records for this person','Données officielles du profil parlementaire de cette personne');
 if(summary.method==='resolved-proposal')return t(`Recognised the proposal “${summary.proposal?.title||''}” and read its debate in the original languages`,`Objet reconnu « ${summary.proposal?.title||''} », débat lu dans les langues originales`);
 if(summary.method==='multilingual-search')return t('Full-text search of the original French, German and Italian records','Recherche plein texte dans les textes originaux en français, allemand et italien');
 if(summary.method==='selected-passage')return t('The passage you selected','L’extrait sélectionné');
 if(summary.method==='selected-record')return t('Passages of the selected record','Extraits du document sélectionné');
 return t('Full-text search of the imported records','Recherche plein texte dans les documents importés');
}
function limitationLabel(l,t){
 if(l.code==='speech-not-decision')return t('Each source is one recorded intervention in the Official Bulletin, not a decision of Parliament.','Chaque source est une intervention consignée au Bulletin officiel, pas une décision du Parlement.');
 if(l.code==='text-coverage')return t(`Searchable official text covers ${l.textSessions} of ${l.totalSessions} sessions (${l.fromYear}–${l.toYear}); older sessions have no digital transcript in the official service.`,`Le texte officiel consultable couvre ${l.textSessions} sessions sur ${l.totalSessions} (${l.fromYear}–${l.toYear}) ; les sessions plus anciennes n’ont pas de transcription numérique officielle.`);
 if(l.code==='machine-video-timing')return t('Video timestamps are machine-aligned and not yet reviewed by a person.','Les minutages vidéo sont alignés automatiquement et pas encore vérifiés par une personne.');
 if(l.code==='withheld')return t(`${l.count} generated statement${l.count===1?' was':'s were'} withheld because the source did not fully support ${l.count===1?'it':'them'}.`,`${l.count} affirmation${l.count===1?'':'s'} générée${l.count===1?'':'s'} retirée${l.count===1?'':'s'} car la source ne ${l.count===1?'la':'les'} soutenait pas entièrement.`);
 return null;
}
export function ResearchSummary({summary,t,open=false}){
 return <details className="answer-research" open={open}><summary><MagnifyingGlass size={14}/>{t('How Cleisthenes researched this','Comment Cleisthenes a cherché')}<small>{t(`${summary.recordsConsidered} records considered · ${summary.sourcesUsed} cited`,`${summary.recordsConsidered} documents examinés · ${summary.sourcesUsed} cités`)}</small></summary>
  <dl>
   <dt>{t('Scope','Périmètre')}</dt><dd>{summary.scope||t('All imported parliamentary records','Tous les débats parlementaires importés')}</dd>
   <dt>{t('Method','Méthode')}</dt><dd>{methodLabel(summary,t)}{summary.searchTerms?.length?<><br/><small>{summary.searchTerms.join(' · ')}</small></>:null}</dd>
   {summary.originalLanguages?.length>0&&<><dt>{t('Original languages','Langues originales')}</dt><dd>{summary.originalLanguages.map(l=>l.toUpperCase()).join(', ')}</dd></>}
   {summary.period&&<><dt>{t('Period of sources','Période des sources')}</dt><dd>{summary.period.from} – {summary.period.to}</dd></>}
  </dl>
  {summary.limitations?.length>0&&<ul>{summary.limitations.map(l=>limitationLabel(l,t)).filter(Boolean).map(l=><li key={l}>{l}</li>)}</ul>}
 </details>;
}

// Who a profile answer is about, with the way into our full profile and complete vote history.
export function ProfileCard({profile,t}){
 return <div className="answer-profile">
  {profile.portraitUrl?<img src={profile.portraitUrl} alt=""/>:<span className="answer-profile-initials" aria-hidden="true">{String(profile.name||'?').split(/s+/).map(x=>x[0]).slice(0,2).join('')}</span>}
  <div><strong>{profile.name}</strong><small>{[profile.party,profile.canton,profile.council].filter(Boolean).join(' · ')}</small>
   <div className="answer-profile-actions"><button type="button" className="cta" onClick={()=>openProfile(profile.id)}>{t('Open full profile','Ouvrir le profil complet')} <ArrowUpRight size={13}/></button>
    <button type="button" onClick={()=>openProfile(profile.id,'votes')}>{profile.voteHistoryComplete?t(`All recorded votes · ${profile.voteCount.toLocaleString()}`,`Tous les votes · ${profile.voteCount.toLocaleString()}`):t(`Recorded votes · ${profile.voteCount} (partial)`,`Votes enregistrés · ${profile.voteCount} (partiel)`)}</button></div></div>
 </div>;
}

// The featured evidence card: numbered speaker tabs swap quote and video in place; the quote is shown in the
// reader's language (labelled machine translation) with the original one click away.
function EvidenceMoments({answer,citations,active,setActive,onOpen,language,t,day}){
 const current=citations.find(c=>c.id===active)||citations[0],n=citations.indexOf(current)+1;
 const [videoOpen,setVideoOpen]=useState(false),[showOriginal,setShowOriginal]=useState(false),[translated,setTranslated]=useState(null),cache=useRef(new Map());
 const target=['en','fr','de','it'].includes(language)?language:'en',needsTranslation=current.originalLanguage&&current.originalLanguage!==target&&['en','fr','de','it'].includes(current.originalLanguage);
 useEffect(()=>{setShowOriginal(false);if(!needsTranslation){setTranslated(null);return;}const key=current.passageId+'|'+target;
  if(cache.current.has(key)){setTranslated(cache.current.get(key));return;}setTranslated(null);let live=true;
  api.translatePassage({evidenceId:current.passageId,language:target}).then(r=>{if(r.status==='ok'&&r.text){cache.current.set(key,r.text);if(live)setTranslated(r.text);}}).catch(()=>{});
  return()=>{live=false;};},[current.passageId,target]);
 // Warm the other sources' translations so switching speakers is instant.
 useEffect(()=>{let live=true;(async()=>{for(const c of citations){const key=c.passageId+'|'+target;if(!live||cache.current.has(key)||!c.originalLanguage||c.originalLanguage===target)continue;try{const r=await api.translatePassage({evidenceId:c.passageId,language:target});if(r.status==='ok'&&r.text)cache.current.set(key,r.text);}catch{}}})();return()=>{live=false;};},[target,citations.length]);
 const quote=needsTranslation&&translated&&!showOriginal?translated:current.quote;
 return <figure className="answer-evidence">
  <figcaption><span className="answer-evidence-kind">{current.video?<><Play size={13} weight="fill"/>{t('Evidence moment · parliamentary video','Moment clé · vidéo parlementaire')}</>:<><Quotes size={13} weight="fill"/>{t('Evidence moment · official quotation','Moment clé · citation officielle')}</>}</span>
   <button type="button" className="answer-evidence-open" onClick={()=>onOpen(current)}>{t('Open evidence','Ouvrir la preuve')} <ArrowUpRight size={13}/></button></figcaption>
  {citations.length>1&&<div className="evidence-tabs" role="tablist" aria-label={t('Evidence moments','Moments clés')}>{citations.map((c,i)=><button key={c.id} type="button" role="tab" aria-selected={c.id===current.id} onClick={()=>setActive(c.id)}><span>{i+1}</span>{String(c.speaker||'').split(/s+/)[0]}</button>)}</div>}
  <blockquote lang={quote===current.quote?current.originalLanguage:target}>“{excerpt(quote,300)}”</blockquote>
  <p className="answer-evidence-meta"><strong>{current.speaker}</strong> · {day(current.date)}{current.role?` · ${current.role}`:''}
   {needsTranslation&&<>{' · '}{translated&&!showOriginal?t(`Machine translation · ${String(current.originalLanguage).toUpperCase()} → ${target.toUpperCase()}`,`Traduction automatique · ${String(current.originalLanguage).toUpperCase()} → ${target.toUpperCase()}`):t(`Original ${String(current.originalLanguage).toUpperCase()}`,`Original ${String(current.originalLanguage).toUpperCase()}`)}
    {translated&&<button type="button" className="evidence-original-toggle" onClick={()=>setShowOriginal(v=>!v)}>{showOriginal?t('Show translation','Voir la traduction'):t(`Show original (${String(current.originalLanguage).toUpperCase()})`,`Voir l’original (${String(current.originalLanguage).toUpperCase()})`)}</button>}</>}</p>
  {current.video?<PassageVideo key={current.id} source={citationPassage(answer,current)} language={language} open={videoOpen} autoPlay={videoOpen} onOpenChange={setVideoOpen}/>:<p className="answer-evidence-novideo">{t('No aligned video for this source yet.','Pas encore de vidéo alignée pour cette source.')}</p>}
  <span className="sr-only" aria-live="polite">{t(`Showing source ${n}`,`Source ${n} affichée`)}</span>
 </figure>;
}

// Web findings sit apart from the record: their own label, their own sources, never numbered record citations.
export function WebResearch({web,t,intro}){
 const day=value=>value?new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
 return <section className="answer-web" aria-label={t('Beyond the parliamentary record','Au-delà des archives parlementaires')}>
  <p className="answer-web-label">{t('Beyond the parliamentary record · web sources','Au-delà des archives parlementaires · sources web')}</p>
  {intro&&<p className="answer-web-intro">{intro}</p>}
  {webParagraphs(web.summary).map((p,i)=><p key={i}>{p}</p>)}
  <ul>{web.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><small>{s.publisher}</small></li>)}</ul>
  <small className="answer-web-note">{t(`Found by web search on ${day(web.searchedAt)}. Not part of the official parliamentary record; check each source.`,`Trouvé par recherche web le ${day(web.searchedAt)}. Hors des archives parlementaires officielles ; vérifiez chaque source.`)}</small>
 </section>;
}

// Web summaries may carry inline markdown links; sources are listed separately, so keep plain sentences.
function webParagraphs(text){
 return String(text||'').split(/\n+/).map(p=>p.replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g,'').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,'$1').replace(/\*\*/g,'').trim()).filter(Boolean);
}
