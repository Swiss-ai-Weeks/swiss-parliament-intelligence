import React,{useEffect,useState} from 'react';
import {ShieldCheck} from '@phosphor-icons/react';
import {pilotApi as api} from '../services/pilotApi.js';
export default function MfaChallenge({onVerified}){
 const [factors,setFactors]=useState([]),[id,setId]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{api.security().then(s=>{const f=s.factors.filter(f=>f.status==='verified');setFactors(f);setId(f[0]?.id||'');}).catch(()=>setError('Could not load your authenticator. Please retry.'));},[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{onVerified(await api.verifyMfa({id,code}));}catch{setError('That code could not be verified. Use the current six-digit code and try again.');}finally{setBusy(false);setCode('');}}
 return <section className="mfa-challenge"><ShieldCheck size={40}/><h2>One more check</h2><p>Enter the code from your authenticator to unlock your account.</p><form onSubmit={submit}>{factors.length>1&&<label>Authenticator<select value={id} onChange={e=>setId(e.target.value)}>{factors.map(f=><option key={f.id} value={f.id}>{f.name||'Authenticator'}</option>)}</select></label>}<label>Six-digit code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label><button className="primary" disabled={busy||!id||code.length!==6}>{busy?'Verifying…':'Verify and continue'}</button></form>{error&&<p role="alert">{error}</p>}</section>;
}
