import React,{useEffect,useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
export default function PassageTranslation({passage,language}){
 const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const fr=language==='fr';
 useEffect(()=>{setResult(null);setError('');},[language,passage.id]);
 if(passage.language===language)return null;
 async function translate(){setBusy(true);setError('');try{const r=await api.translatePassage({evidenceId:passage.id,language});if(r.status!=='ok')throw Error();setResult(r);}catch{setError(fr?'Traduction indisponible. Le texte original reste accessible.':'Translation unavailable. The original text remains available.');}finally{setBusy(false);}}
 return <div className="passage-translation" style={{margin:'16px 0'}}><button className="secondary" disabled={busy||language==='rm'} onClick={translate}>{busy?(fr?'Traduction…':'Translating…'):(fr?'Traduire cet extrait':'Translate this passage')}{' → '+language.toUpperCase()}</button>{language==='rm'&&<small> · {fr?'Traduction romanche humaine requise':'Romansh requires human translation'}</small>}{error&&<p role="alert">{error}</p>}{result&&<div style={{padding:'18px',borderLeft:'3px solid #9b4940',background:'#f3f1eb',marginTop:'12px'}}><small>NVIDIA Riva Translate v2 · {result.sourceLanguage.toUpperCase()} → {result.targetLanguage.toUpperCase()} · {fr?'Traduction automatique à vérifier':'Machine translation · review required'}{result.cacheHit?' · cache':''}</small><p style={{whiteSpace:'pre-wrap'}}>{result.text}</p>{result.warnings?.map(w=><small key={w}>{w}</small>)}</div>}</div>;
}
