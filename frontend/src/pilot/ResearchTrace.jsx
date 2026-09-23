import React,{useEffect,useRef,useState} from 'react';
import {CaretRight} from '@phosphor-icons/react';

// Operational research steps only (what is searched and checked), never model reasoning.
export const STAGE_ORDER=['understanding','searching','reading','checking','writing'];
const MIN_STEP_MS=450;

export function stageLabel(stage,e={},t){
 if(stage==='understanding')return t('Understanding your question','Compréhension de la question');
 if(stage==='searching')return e.sessions?t(`Searching ${e.sessions} parliamentary sessions in French, German and Italian`,`Recherche dans ${e.sessions} sessions parlementaires en français, allemand et italien`):t('Searching the official record','Recherche dans les archives officielles');
 if(stage==='reading')return e.passages?t(`Reading the ${e.passages} most relevant of ${Number(e.candidates||e.passages).toLocaleString()} passages`,`Lecture des ${e.passages} extraits les plus pertinents sur ${Number(e.candidates||e.passages).toLocaleString()}`):t('Reading passages','Lecture des extraits');
 if(stage==='checking')return e.claims?t(`Checking ${e.claims} statements against their sources`,`Vérification de ${e.claims} affirmations auprès des sources`):t('Checking statements against sources','Vérification auprès des sources');
 if(stage==='web')return t('Searching beyond the parliamentary record','Recherche au-delà des archives parlementaires');
 return t('Writing a cited answer','Rédaction d’une réponse sourcée');
}

// One live line that advances step by step, even when the server reports several steps at once.
export function LiveResearch({stages,t}){
 const reported=STAGE_ORDER.filter(s=>stages.some(x=>x.stage===s));
 const [shown,setShown]=useState(0),last=useRef(0);
 useEffect(()=>{
  if(shown>=reported.length)return;
  const wait=Math.max(0,MIN_STEP_MS-(Date.now()-last.current));
  const timer=setTimeout(()=>{last.current=Date.now();setShown(n=>Math.min(n+1,reported.length));},wait);
  return()=>clearTimeout(timer);
 },[shown,reported.length]);
 const current=reported[Math.max(0,shown-1)]||'understanding',index=Math.max(1,STAGE_ORDER.indexOf(current)+1);
 const event=stages.find(x=>x.stage===current)||{};
 return <div className="research-live" role="status" aria-live="polite">
  <div className="research-live-meta"><span>{t(`Step ${index} of ${STAGE_ORDER.length}`,`Étape ${index} sur ${STAGE_ORDER.length}`)}</span>
   <span className="research-live-bar" aria-hidden="true">{STAGE_ORDER.map((s,i)=><i key={s} data-done={i<index-1?'':undefined} data-active={i===index-1?'':undefined}/>)}</span></div>
  <p key={current} className="research-live-line">{stageLabel(current,event,t)}</p>
 </div>;
}

// After the answer: a quiet, expandable record of the steps with their timing.
export function ResearchTrail({trace,t}){
 const total=trace.at(-1)?.ms||0,steps=trace.filter(x=>STAGE_ORDER.includes(x.stage)||x.stage==='web');
 if(!steps.length)return null;
 return <details className="research-trail"><summary><CaretRight size={12} className="research-trail-caret"/>{t(`${steps.length} research steps · ${(total/1000).toFixed(1)} s`,`${steps.length} étapes de recherche · ${(total/1000).toFixed(1)} s`)}</summary>
  <ol>{steps.map(x=><li key={x.stage}><span>{stageLabel(x.stage,x,t)}</span><small>{(x.ms/1000).toFixed(1)} s</small></li>)}</ol>
 </details>;
}
