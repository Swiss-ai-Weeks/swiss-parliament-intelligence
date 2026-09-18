import React,{useEffect,useState} from 'react';
import {pilotApi as api} from '../services/pilotApi.js';
let cached=null;
function followsFor(id){if(cached?.id===id&&Date.now()-cached.at<15000)return cached.promise;const promise=api.items('follow');cached={id,at:Date.now(),promise};promise.catch(()=>{if(cached?.promise===promise)cached=null;});return promise;}
export default function FollowButton({user,kind,id,title,onAccount}){
 const key=kind+':'+id,[following,setFollowing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let live=true;setFollowing(false);setError('');const refresh=()=>{if(user)followsFor(user.id).then(rows=>live&&setFollowing(rows.some(r=>r.id===key))).catch(()=>live&&setError('Follows unavailable'));};refresh();addEventListener('follows-changed',refresh);return()=>{live=false;removeEventListener('follows-changed',refresh);};},[user?.id,key]);
 return <span className="follow-control"><button className="secondary" aria-pressed={following} disabled={busy} onClick={async()=>{if(!user){onAccount?.();return;}setBusy(true);setError('');try{following?await api.deleteItem('follow',key,user.id):await api.putItem('follow',key,{kind,id,title},user.id);setFollowing(!following);cached=null;window.dispatchEvent(new Event('follows-changed'));}catch{setError('Could not save this follow.');}finally{setBusy(false);}}}>{following?'✓ Following':'+ Follow'}</button>{error&&<small role="status">{error}</small>}</span>;
}
