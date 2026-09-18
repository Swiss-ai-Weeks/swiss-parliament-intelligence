import React,{useEffect,useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
export default function SavedBriefs({user,onNavigate}){
 const [rows,setRows]=useState([]),[error,setError]=useState('');useEffect(()=>{let live=true;if(user)api.items('brief').then(r=>live&&setRows(r)).catch(()=>live&&setError('Saved briefs could not load.'));return()=>{live=false;};},[user?.id]);
 if(!user)return null;
 return <section className="saved-briefs"><h2>Your briefs</h2><p>Briefs you build while signed in are saved to your account.</p>{error&&<p role="status">{error}</p>}{rows.map(r=><article className="workspace-card" key={r.id}><h3>{r.payload.title||'Research brief'}</h3><small>{new Date(r.updated_at).toLocaleDateString('en-GB')}</small><div className="member-actions"><button className="secondary" onClick={()=>{const u=URL.createObjectURL(new Blob([r.payload.markdown],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='midnight-research-brief.md';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}}>Download brief</button><button className="text-button" onClick={()=>onNavigate(r.payload.dossierId)}>Open dossier →</button></div></article>)}{!rows.length&&!error&&<p className="muted">Select source passages in a dossier, then build a brief.</p>}</section>;
}
