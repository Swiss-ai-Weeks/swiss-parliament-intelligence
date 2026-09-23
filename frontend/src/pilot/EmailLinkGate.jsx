import {SealCheck} from '@phosphor-icons/react';
import MfaChallenge from './MfaChallenge.jsx';
import './settings-dashboard.css';
import React,{useEffect,useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
import {safeConfirmationUrl} from './email-link.mjs';

export default function EmailLinkGate({status,rawLink}) {
 const base=import.meta.env.BASE_URL;
 const target=safeConfirmationUrl(rawLink,location.origin,base);
 const [state,setState]=useState(status==='complete'?'checking':status==='confirm'&&target?'confirm':'expired');
 useEffect(()=>{history.replaceState({},'',location.pathname+'?view=dashboard');if(status==='complete')api.me().then(u=>setState(u.mfaRequired?'mfa':'success')).catch(()=>setState('expired'));},[]);
 const go=()=>location.assign(base+'?view=dashboard'+(state==='success'?'':'&auth=retry'));
 if(state==='mfa')return <MfaChallenge onVerified={()=>setState('success')}/>;
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,boxSizing:'border-box',background:'#f3eddf',color:'#252823',fontFamily:'Arial,sans-serif'}}><section style={{width:'100%',maxWidth:440,boxSizing:'border-box',background:'#fffaf0',border:'1px solid #d9cbb4',borderRadius:28,padding:'40px 32px',textAlign:'center'}}>
 {state==='success'?<div className="account-success-icon"><SealCheck size={64} weight="duotone" aria-label="Sign-in successful"/></div>:<img src={base+'images/cleisthenes.png'} alt="Cleisthenes" width="96" height="96" style={{objectFit:'cover',borderRadius:'50%'}}/>}<p style={{fontFamily:'Georgia,serif',fontSize:24}}>Cleisthenes</p>
 <h1 style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:400}}>{({confirm:'One step to your account',checking:'Checking your sign-in…',success:'You’re signed in',expired:'Let’s get you a fresh link'})[state]}</h1>
 <p role="status" style={{fontSize:18,lineHeight:1.6}}>{({confirm:'Continue in the browser where you requested this email. Your link is only used when you press the button.',checking:'Confirming your secure session.',success:'Your account is ready. Continue your research with Cleisthenes.',expired:'This link could not complete sign-in. It may have expired or already been used. Request a new link and open the latest email in the same browser.'})[state]}</p>
 {state!=='checking'&&<button onClick={()=>state==='confirm'?location.assign(target):go()} style={{cursor:'pointer',border:0,borderRadius:12,padding:'16px 24px',fontSize:18,fontWeight:600,color:'#fffaf0',background:'#2c4438'}}>{state==='confirm'?'Confirm sign-in':state==='success'?'Continue to my workspace':'Request a new link'}</button>}
 </section></main>;
}
