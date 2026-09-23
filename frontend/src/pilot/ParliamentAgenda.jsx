import React,{useMemo,useState} from 'react';
import {CaretLeft,CaretRight,ChatCircleDots,ArrowUpRight} from '@phosphor-icons/react';

// One agenda: a single month control drives a single list. Items expand in place and one click asks
// Cleisthenes a question that fits the item (what happened, or what is planned).
const zurichToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const shiftMonth=(value,delta)=>{const [y,m]=value.split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;};
const chamberName={nr:['National Council','Conseil national'],sr:['Council of States','Conseil des Etats']};

export default function ParliamentAgenda({events,language='en',chamberSlot,retrievedAt,stale,loading,onAsk,onNavigate}){
 const fr=language==='fr',t=(en,frText)=>fr?frText:en,locale=fr?'fr-CH':'en-GB',today=zurichToday();
 const [month,setMonth]=useState(today.slice(0,7)),[day,setDay]=useState(null),[chamber,setChamber]=useState('all'),[open,setOpen]=useState(null);
 const inChamber=e=>chamber==='all'||!e.chamber||e.chamber===chamber;
 const overlaps=(e,from,to)=>(e.endDate||e.date)>=from&&e.date<=to;
 const monthEnd=month+'-31';
 const monthEvents=useMemo(()=>events.filter(e=>inChamber(e)&&overlaps(e,month+'-01',monthEnd)).sort((a,b)=>(a.type==='session'?-1:0)-(b.type==='session'?-1:0)||a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')),[events,month,chamber]);
 const shown=day?monthEvents.filter(e=>e.type==='session'?overlaps(e,day,day):e.date===day):monthEvents;
 const start=new Date(month+'-01T12:00:00Z'),count=new Date(start.getUTCFullYear(),start.getUTCMonth()+1,0).getDate();
 const nextSession=events.filter(e=>e.type==='session'&&e.date>today).sort((a,b)=>a.date.localeCompare(b.date))[0];
 const fmt=(d,opts)=>new Date(d+'T12:00:00Z').toLocaleDateString(locale,opts);
 function go(nextMonth,nextDay=null){setMonth(nextMonth);setDay(nextDay);setOpen(null);}
 function question(e){
  const past=(e.endDate||e.date)<today,current=e.date<=today&&(e.endDate||e.date)>=today;
  if(e.type==='session'){
   if(e.date>today)return {prompt:t(`What is on the agenda of the ${e.title} (${e.date} to ${e.endDate})?`,`Qu’est-ce qui est prévu pour la ${e.title} (du ${e.date} au ${e.endDate}) ?`),filters:{from:e.date,to:e.endDate}};
   return {prompt:t(`What were the main debates of the ${e.title}${current?' so far':''}?`,`Quels ont été les principaux débats de la ${e.title}${current?' jusqu’ici':''} ?`),filters:{from:e.date,to:current?today:e.endDate}};
  }
  if(e.date>today)return {prompt:t(`What is planned for the ${e.title} on ${e.date}?`,`Qu’est-ce qui est prévu pour la ${e.title} du ${e.date} ?`),filters:{date:e.date}};
  return {prompt:t(`What was discussed in the ${e.title} on ${e.date}?`,`De quoi a-t-on débattu lors de la ${e.title} du ${e.date} ?`),filters:{...(e.sessionId?{session:e.sessionId}:{}),date:e.date,...(e.chamber?{chamber:e.chamber}:{})}};
 }
 function ask(e){const q=question(e);onAsk({kind:'agenda',id:e.id,title:e.title,filters:q.filters},{prompt:q.prompt,autoSend:true});}
 function status(e){
  if(e.type==='popular-vote')return t('Popular vote','Votation populaire');
  if(e.type==='session')return e.date>today?t('Upcoming session','Session à venir'):(e.endDate>=today?t('Session in progress','Session en cours'):t('Past session','Session passée'));
  return e.date>today?t('Scheduled sitting','Séance prévue'):e.status==='completed'?t('Debate imported','Débat importé'):t('Past sitting','Séance passée');
 }
 return <section className="workspace-card agenda-card" aria-labelledby="agenda-title">
  <header className="agenda-header">
   <div><h2 id="agenda-title">{t('Parliament agenda','Agenda du Parlement')}</h2><p>{t('Sessions and sittings from the official schedule. Pick one to see what happened or what is planned.','Sessions et séances selon le calendrier officiel. Choisissez-en une pour voir ce qui s’est passé ou ce qui est prévu.')}</p></div>
   {chamberSlot}
  </header>
  <div className="agenda-controls">
   <div className="agenda-month" role="group" aria-label={t('Month','Mois')}>
    <button aria-label={t('Previous month','Mois précédent')} onClick={()=>go(shiftMonth(month,-1))}><CaretLeft/></button>
    <strong>{fmt(month+'-01',{month:'long',year:'numeric'})}</strong>
    <button aria-label={t('Next month','Mois suivant')} onClick={()=>go(shiftMonth(month,1))}><CaretRight/></button>
   </div>
   <div className="agenda-chips" role="group" aria-label={t('Quick jumps and chamber','Raccourcis et conseil')}>
    <button onClick={()=>go(today.slice(0,7),today)} aria-pressed={day===today}>{t('Today','Aujourd’hui')}</button>
    {nextSession&&<button onClick={()=>go(nextSession.date.slice(0,7))}>{t('Next session','Prochaine session')}</button>}
    <span className="agenda-divider" aria-hidden="true"/>
    {[['all',t('Both chambers','Les deux conseils')],['nr',chamberName.nr[fr?1:0]],['sr',chamberName.sr[fr?1:0]]].map(([id,label])=><button key={id} aria-pressed={chamber===id} onClick={()=>{setChamber(id);setOpen(null);}}>{label}</button>)}
   </div>
  </div>
  <div className="agenda-strip" role="group" aria-label={t('Days of the month','Jours du mois')}>{Array.from({length:count},(_,i)=>{const d=month+'-'+String(i+1).padStart(2,'0'),n=monthEvents.filter(e=>e.type!=='session'&&e.date===d).length,inSession=monthEvents.some(e=>e.type==='session'&&overlaps(e,d,d));
   return <button key={d} aria-pressed={day===d} aria-current={d===today?'date':undefined} data-session={inSession?'':undefined} aria-label={`${fmt(d,{weekday:'long',day:'numeric',month:'long'})}${n?`, ${n} ${t('sittings','séances')}`:''}`} onClick={()=>{setDay(day===d?null:d);setOpen(null);}}><small>{fmt(d,{weekday:'narrow'})}</small>{i+1}{n>0&&<i/>}</button>;})}</div>
  {day&&<p className="agenda-filter-note">{t('Showing','Affichage :')} {fmt(day,{weekday:'long',day:'numeric',month:'long'})} · <button className="text-button" onClick={()=>setDay(null)}>{t('Show whole month','Voir tout le mois')}</button></p>}
  <ol className="agenda-list">{shown.map(e=>{const expanded=open===e.id;
   return <li key={e.id} className={expanded?'open':''} data-type={e.type}>
    <button className="agenda-row" aria-expanded={expanded} onClick={()=>setOpen(expanded?null:e.id)}>
     <time dateTime={e.date}><b>{e.date.slice(8)}</b>{fmt(e.date,{month:'short'})}</time>
     <span><strong>{e.title}</strong><small>{e.type==='session'?`${fmt(e.date,{day:'numeric',month:'short'})} – ${fmt(e.endDate,{day:'numeric',month:'short',year:'numeric'})}`:[e.time,e.chamber&&chamberName[e.chamber]?.[fr?1:0]].filter(Boolean).join(' · ')} · {status(e)}</small></span>
     <CaretRight className="agenda-caret" aria-hidden="true"/>
    </button>
    {expanded&&<div className="agenda-detail">
     <p>{e.type==='session'?(e.date>today?t('The detailed programme appears on parlament.ch shortly before the session. Cleisthenes can say what is known so far.','Le programme détaillé paraît sur parlament.ch peu avant la session. Cleisthenes peut dire ce que l’on sait déjà.'):t('Cleisthenes reads the debates recorded during this session and summarises the main ones, with sources.','Cleisthenes lit les débats consignés pendant cette session et résume les principaux, sources à l’appui.')):e.date>today?t('Sitting times are official; the agenda of the day is published shortly before.','L’horaire est officiel ; l’ordre du jour paraît peu avant.'):t('Ask what was debated in this sitting; answers cite the Official Bulletin.','Demandez ce qui a été débattu ; les réponses citent le Bulletin officiel.')}</p>
     <div className="agenda-actions">{e.dossierId?<button className="agenda-ask" onClick={()=>onNavigate(e.dossierId)}>{t('Open the dossier','Ouvrir le dossier')} <ArrowUpRight size={14}/></button>:<button className="agenda-ask" onClick={()=>ask(e)}><ChatCircleDots size={16}/>{e.type==='session'&&e.date>today?t('What is planned?','Qu’est-ce qui est prévu ?'):t('What happened?','Que s’est-il passé ?')}</button>}
      {(e.officialUrl||e.sourceUrl)&&!e.dossierId&&<a href={e.officialUrl||e.sourceUrl} target="_blank" rel="noreferrer">{t('Official source','Source officielle')} ↗</a>}</div>
    </div>}
   </li>;})}</ol>
  {loading&&!shown.length&&<div className="agenda-empty" role="status"><p>{t('Loading the official schedule…','Chargement du calendrier officiel…')}</p></div>}
  {!loading&&!shown.length&&<div className="agenda-empty"><p>{t('No sittings this month. Parliament meets in four ordinary sessions a year.','Aucune séance ce mois-ci. Le Parlement siège en quatre sessions ordinaires par an.')}</p>{nextSession&&<button className="text-button" onClick={()=>go(nextSession.date.slice(0,7))}>{t(`Go to the ${nextSession.title}`,`Aller à la ${nextSession.title}`)} →</button>}</div>}
  <footer className="agenda-footer"><small>{t('Official schedule · refreshed','Calendrier officiel · actualisé')} {retrievedAt?new Date(retrievedAt).toLocaleString(locale,{timeZone:'Europe/Zurich',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}{stale?t(' · showing last snapshot',' · dernière version affichée'):''}</small><a href="https://www.parlament.ch/en/ratsbetrieb/sessions/schedule" target="_blank" rel="noreferrer">parlament.ch ↗</a></footer>
 </section>;
}
