import React,{useEffect,useState} from 'react';
import {ChatCircleDots,Plus,Trash,MagnifyingGlass} from '@phosphor-icons/react';
import {pilotApi as api} from '../services/pilotApi.js';
import {loadConversations} from './chat-history.mjs';
import {askCleisthenes} from './navigation.js';
import './chats.css';

// Every conversation in one place: device chats for anonymous readers, account chats when signed in.
export default function ChatsPage({user,language='en',onNavigate}){
 const fr=language==='fr',t=(en,frText)=>fr?frText:en;
 const [chats,setChats]=useState(null),[filter,setFilter]=useState(''),[error,setError]=useState('');
 function load(){setError('');if(user)api.items('conversation').then(rows=>setChats(rows.map(r=>r.payload).filter(c=>Array.isArray(c.messages)))).catch(()=>{setChats([]);setError(t('Your account conversations could not be loaded.','Impossible de charger les discussions du compte.'));});else setChats(loadConversations(localStorage));}
 useEffect(()=>{load();addEventListener('conversations-changed',load);return()=>removeEventListener('conversations-changed',load);},[user?.id]);
 const list=(chats||[]).filter(c=>c.messages.some(m=>m.role==='user')).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))
  .filter(c=>!filter||`${c.messages.find(m=>m.role==='user')?.text||''} ${c.scope?.title||''}`.toLowerCase().includes(filter.toLowerCase()));
 function open(id){onNavigate(null,'chat');window.dispatchEvent(new CustomEvent('open-conversation',{detail:id}));}
 function remove(id){window.dispatchEvent(new CustomEvent('delete-conversation',{detail:id}));setChats(c=>(c||[]).filter(x=>x.id!==id));}
 const day=v=>v?new Date(v).toLocaleDateString(fr?'fr-CH':'en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
 return <section className="chats-page">
  <header><div><p className="eyebrow">{t('Your research','Vos recherches')}</p><h1>{t('My chats','Mes discussions')}</h1><p>{user?t('Conversations synced to your account.','Discussions synchronisées avec votre compte.'):t('Saved on this device only, up to 20 chats. Sign in to keep them across devices.','Enregistrées sur cet appareil uniquement (20 au maximum). Connectez-vous pour les retrouver partout.')}</p></div>
   <button className="chats-new" onClick={()=>askCleisthenes(null,{newChat:true})}><Plus size={16}/>{t('New chat','Nouvelle discussion')}</button></header>
  <label className="chats-filter"><MagnifyingGlass size={16}/><span className="sr-only">{t('Filter chats','Filtrer')}</span><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t('Search your chats…','Rechercher dans vos discussions…')}/></label>
  {error&&<p role="alert">{error}</p>}
  {chats===null?<p role="status">{t('Loading…','Chargement…')}</p>:list.length?<ol className="chats-list">{list.map(c=>{const first=c.messages.find(m=>m.role==='user')?.text||t('Conversation','Discussion'),questions=c.messages.filter(m=>m.role==='user').length,last=[...c.messages].reverse().find(m=>m.role==='assistant')?.answer?.answer?.lead?.text;
   return <li key={c.id}><button className="chats-open" onClick={()=>open(c.id)}><ChatCircleDots size={20}/><span><strong>{first}</strong>{last&&<em>{last.length>150?last.slice(0,150)+'…':last}</em>}<small>{c.scope?.title||t('All parliamentary records','Tous les débats')} · {day(c.updatedAt)} · {questions} {questions===1?t('question','question'):t('questions','questions')}</small></span></button>
    <button className="chats-delete" onClick={()=>remove(c.id)} aria-label={t('Delete chat: ','Supprimer : ')+first}><Trash size={16}/></button></li>;})}</ol>
  :<div className="chats-empty"><p>{filter?t('No chats match this search.','Aucune discussion ne correspond.'):t('Your conversations with Cleisthenes will appear here.','Vos discussions avec Cleisthenes apparaîtront ici.')}</p>{!filter&&<button className="chats-new" onClick={()=>askCleisthenes(null,{prompt:"What are the arguments for and against the initiative 'No to a Switzerland of 10 million'?",autoSend:true})}>{t('Try: the 10-million initiative','Essayer : l’initiative 10 millions')}</button>}</div>}
 </section>;
}
