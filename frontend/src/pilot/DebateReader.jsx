import React, {useEffect, useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
import PassageTranslation from './PassageTranslation.jsx';
import './reader.css';

export function PassageContext({id, language='en'}) {
 const [context,setContext]=useState(null),[error,setError]=useState(false);
 const fr=language==='fr';
 return <details className="reader-context" onToggle={e=>{if(e.currentTarget.open&&!context)api.passageContext(id).then(setContext).catch(()=>setError(true));}}>
  <summary>{fr?'Lire les paragraphes voisins':'Read surrounding paragraphs'}</summary>
  {error?<p role="alert">{fr?'Contexte indisponible. Consultez la source officielle.':'Context unavailable. Open the official source.'}</p>:!context?<p role="status">{fr?'Chargement…':'Loading…'}</p>:<div><small>{fr?'Même intervention · texte original':'Same intervention · original text'}</small>{context.passages.map(p=><p key={p.id} className={p.id===id?'reader-selected':''}>{p.id===id&&<strong>{fr?'Extrait sélectionné':'Selected passage'}<br/></strong>}{p.text}</p>)}</div>}
 </details>;
}

export default function DebateReader({language='en',business,person,sessions=[]}) {
 const fr=language==='fr',t=(en,frText)=>fr?frText:en;
 const [draft,setDraft]=useState(''),[filters,setFilters]=useState({q:'',session:'',person:'',language:'',date:''}),[offset,setOffset]=useState(0),[data,setData]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;setBusy(true);setError('');api.readDebate({...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)),...(business?{business}:{}),...(person?{person}:{}),offset}).then(d=>{if(active)setData(d);}).catch(()=>{if(active)setError(t('The text could not be loaded. Please try again.','Le texte n’a pas pu être chargé. Veuillez réessayer.'));}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[filters,offset,business,person,language]);
 function change(key,value){setOffset(0);setFilters(f=>({...f,[key]:value}));}
 return <section className="debate-reader" aria-busy={busy}>
  <p className="eyebrow">{t('In their own words','Dans leurs propres mots')}</p><h2>{t('Read the debate','Lire les débats')}</h2>
  <p>{t('Browse the original record, one passage at a time. Filter the collection or search a phrase in its original language.','Parcourez le compte rendu original, extrait par extrait. Filtrez la collection ou recherchez une expression dans sa langue originale.')}</p>
  <form className="reader-search" onSubmit={e=>{e.preventDefault();change('q',draft);}}><input aria-label={t('Search original text','Rechercher dans le texte original')} placeholder={t('Search a word or phrase…','Rechercher un mot ou une expression…')} value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500}/><button type="submit">{t('Search text','Rechercher')}</button></form>
  <div className="reader-filters">
   {!business&&<label>{t('Session','Session')}<select value={filters.session} onChange={e=>change('session',e.target.value)}><option value="">{t('All imported sessions','Toutes les sessions importées')}</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.title||s.id} · {s.start?.slice(0,10)}</option>)}</select></label>}
   {!person&&<label>{t('Speaker','Intervenant')}<select value={filters.person} onChange={e=>change('person',e.target.value)}><option value="">{t('All speakers','Tous les intervenants')}</option>{data?.speakers.filter(s=>s.id).map(s=><option key={s.id+s.name} value={s.id}>{s.name}</option>)}</select></label>}
   <label>{t('Original language','Langue originale')}<select value={filters.language} onChange={e=>change('language',e.target.value)}><option value="">{t('All languages','Toutes les langues')}</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="it">Italiano</option><option value="rm">Rumantsch</option></select></label>
   <label>{t('Sitting date','Date de séance')}<input type="date" value={filters.date} onChange={e=>change('date',e.target.value)}/></label>
  </div>
  <div role="status">{busy?t('Loading passages…','Chargement des extraits…'):error||`${data?.total||0} ${t('matching passages · imported text only','extraits correspondants · textes importés uniquement')}`}</div>
  {!busy&&!error&&data?.total===0&&<p>{t('No passages match these filters. Try another phrase or clear the filters.','Aucun extrait ne correspond. Essayez une autre expression ou effacez les filtres.')}</p>}
  <button className="reader-reset" onClick={()=>{setDraft('');setOffset(0);setFilters({q:'',session:'',person:'',language:'',date:''});}}>{t('Clear filters','Effacer les filtres')}</button>
  {!busy&&!error&&data?.passages.map((p,i)=><React.Fragment key={p.id}>{(i===0||data.passages[i-1].date?.slice(0,10)!==p.date?.slice(0,10))&&<h3 className="reader-date">{p.date?new Date(p.date).toLocaleDateString(fr?'fr-CH':'en-GB',{day:'numeric',month:'long',year:'numeric'}):t('Date not available','Date indisponible')}</h3>}<article className="parliament-passage"><div className="evidence-meta"><span>{p.language?.toUpperCase()} · {t('Official Bulletin','Bulletin officiel')}</span><span>{p.council}</span></div><h3>{p.speaker}</h3><small>{t('Recorded role','Rôle enregistré')}: {p.speakerFunction||'—'}</small><blockquote>{p.text}</blockquote><PassageContext id={p.id} language={language}/><PassageTranslation passage={p} language={language}/><a href={p.officialUrl} target="_blank" rel="noreferrer">{t('Official source ↗','Source officielle ↗')}</a>{p.video&&<details><summary>{t('Watch this extract · machine timing, awaiting review','Voir cet extrait · minutage automatique à vérifier')}</summary><video controls preload="none" src={p.video.url+'#t='+p.video.start} onLoadedMetadata={e=>{e.currentTarget.currentTime=p.video.start;}}/></details>}</article></React.Fragment>)}
  {data&&<nav className="reader-pagination" aria-label={t('Passage pages','Pages des extraits')}><button disabled={busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-20))}>{t('Previous','Précédent')}</button><span>{data.total?`${offset+1}–${Math.min(offset+20,data.total)} / ${data.total}`:'0'}</span><button disabled={busy||data.nextOffset===null} onClick={()=>setOffset(data.nextOffset)}>{t('Next','Suivant')}</button></nav>}
 </section>;
}
