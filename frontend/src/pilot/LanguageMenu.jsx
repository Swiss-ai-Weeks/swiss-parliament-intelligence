import React,{useEffect,useRef,useState} from 'react';
import {Globe,Check} from '@phosphor-icons/react';

// A globe button that opens a small language menu; replaces the native select in the header.
export default function LanguageMenu({value,names,onChange,label='Language'}){
 const [open,setOpen]=useState(false),root=useRef(null),items=useRef([]);
 useEffect(()=>{if(!open)return;const close=e=>{if(!root.current?.contains(e.target))setOpen(false);};const key=e=>{if(e.key==='Escape'){setOpen(false);root.current?.querySelector('button')?.focus();}};
  addEventListener('pointerdown',close);addEventListener('keydown',key);requestAnimationFrame(()=>items.current[Object.keys(names).indexOf(value)]?.focus());
  return()=>{removeEventListener('pointerdown',close);removeEventListener('keydown',key);};},[open]);
 function move(e,i){const n=Object.keys(names).length;if(e.key==='ArrowDown'){e.preventDefault();items.current[(i+1)%n]?.focus();}if(e.key==='ArrowUp'){e.preventDefault();items.current[(i-1+n)%n]?.focus();}}
 return <div className="language-menu" ref={root}>
  <button type="button" className="language-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={`${label}: ${names[value]}`} title={names[value]} onClick={()=>setOpen(v=>!v)}><Globe size={20}/><span>{value.toUpperCase()}</span></button>
  {open&&<div className="language-popover" role="menu" aria-label={label}>{Object.entries(names).map(([code,name],i)=><button key={code} ref={el=>items.current[i]=el} role="menuitemradio" aria-checked={code===value} onKeyDown={e=>move(e,i)} onClick={()=>{onChange(code);setOpen(false);}}><span>{name}</span><small>{code.toUpperCase()}</small>{code===value&&<Check size={14}/>}</button>)}</div>}
 </div>;
}
