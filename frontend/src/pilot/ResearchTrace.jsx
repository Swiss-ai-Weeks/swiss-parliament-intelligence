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
 const reported=[...STAGE_ORDER,'web'].filter(s=>stages.some(x=>x.stage===s)),total=Math.max(STAGE_ORDER.length,reported.length);
 const [shown,setShown]=useState(0),last=useRef(0);
 useEffect(()=>{
  if(shown>=reported.length)return;
  const wait=Math.max(0,MIN_STEP_MS-(Date.now()-last.current));
  const timer=setTimeout(()=>{last.current=Date.now();setShown(n=>Math.min(n+1,reported.length));},wait);
  return()=>clearTimeout(timer);
 },[shown,reported.length]);
 const current=reported[Math.max(0,shown-1)]||'understanding',index=Math.max(1,reported.indexOf(current)+1);
 const event=stages.find(x=>x.stage===current)||{},done=reported.slice(0,Math.max(0,shown-1));
 const [open,setOpen]=useState(false);
 // Quiet, left-aligned status like a person thinking aloud: one live line; earlier steps behind a caret.
 return <div className="research-think" role="status" aria-live="polite">
  <button type="button" className="research-think-line" aria-expanded={open} onClick={()=>setOpen(v=>!v)} disabled={!done.length}>
   <CaretRight size={12} className="research-think-caret" aria-hidden="true"/>
   <span key={current} className="research-think-text">{stageLabel(current,event,t)}</span>
   <small>{t(`${index}/${total}`,`${index}/${total}`)}</small>
  </button>
  {open&&done.length>0&&<ol className="research-think-steps">{done.map(s=><li key={s}>{stageLabel(s,stages.find(x=>x.stage===s)||{},t)}</li>)}</ol>}
 </div>;
}

// After the answer: a quiet, expandable record of the steps with their timing.
export function ResearchTrail({trace,t}){
 const total=trace.at(-1)?.ms||0,steps=trace.filter(x=>STAGE_ORDER.includes(x.stage)||x.stage==='web');
 if(!steps.length)return null;
 return <details className="research-trail"><summary><CaretRight size={12} className="research-trail-caret"/>{t(`Researched for ${(total/1000).toFixed(1)} s · ${steps.length} steps`,`Recherche en ${(total/1000).toFixed(1)} s · ${steps.length} étapes`)}</summary>
  <ol>{steps.map(x=><li key={x.stage}><span>{stageLabel(x.stage,x,t)}</span><small>{(x.ms/1000).toFixed(1)} s</small></li>)}</ol>
 </details>;
}
