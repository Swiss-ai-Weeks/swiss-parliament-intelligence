import React,{useEffect,useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
import PoliticianProfile from './PoliticianProfile.jsx';
import DebateReader from './DebateReader.jsx';
import FollowButton from './FollowButton.jsx';
export default function MemberPage({id,language,user,onAsk,onAccount}){
 const [person,setPerson]=useState(null),[error,setError]=useState('');useEffect(()=>{let live=true;setPerson(null);api.parliamentPerson(id).then(p=>live&&setPerson(p)).catch(()=>live&&setError('Profile unavailable. Please try again.'));return()=>{live=false;};},[id]);
 if(!person)return <p role="status">{error||'Loading official profile…'}</p>;
 return <section className="member-page"><p className="eyebrow">Public representative · {person.canton}</p><div className="workspace-heading"><h1>{person.name}</h1><FollowButton user={user} kind="person" id={id} title={person.name} onAccount={onAccount}/></div><PoliticianProfile person={person} language={language} onUpdate={setPerson}/><div className="member-actions"><button className="primary" onClick={()=>onAsk({kind:'person',id,title:person.name},{prompt:'What issues has '+person.name+' discussed?'})}>Ask Cleisthenes about {person.name.split(' ')[0]} →</button><button className="secondary" onClick={()=>navigator.clipboard.writeText(location.href).then(()=>setError('Profile link copied.')).catch(()=>setError('Copy the URL in the address bar to share this profile.'))}>Copy profile link</button></div>{error&&<p role="status">{error}</p>}<h2>In their own words</h2><DebateReader language={language} person={id}/></section>;
}
