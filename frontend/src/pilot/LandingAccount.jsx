import React,{useEffect,useRef} from 'react';
import {X} from '@phosphor-icons/react';
import AuthPanel from './AuthPanel.jsx';
export default function LandingAccount({open,onClose,onUser,onGuest}){
 const ref=useRef(null);
 useEffect(()=>{if(open)ref.current?.showModal();else ref.current?.close();},[open]);
 return <dialog ref={ref} className="landing-account" aria-labelledby="account-title" onCancel={onClose} onClose={onClose}><button className="account-close" aria-label="Close account window" onClick={onClose}><X size={20}/></button>{open&&<AuthPanel initialMode="magic" onUser={onUser} onClose={onClose} onGuest={onGuest}/>}</dialog>;
}
