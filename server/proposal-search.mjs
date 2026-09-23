// In-page proposal search over the whole imported archive (~54k businesses). Every meaningful word must
// match the title (accents and plurals tolerated); English queries fall back to model-translated French
// terms because official titles are stored in French.
import {multilingualQueries} from './parliament-ai.mjs';

const STOP=new Set('the and for with about what who how are was were into from this that les des une pour sur par aux dans avec que qui est sont der die das und fur von mit ist il lo la gli di che per con initiative populaire'.split(' '));
const fold=v=>String(v||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export const searchTerms=v=>[...new Set((fold(v).match(/[\p{L}\p{N}]+/gu)||[]).map(t=>t.replace(/(?<=\p{L}{4})[sx]$/u,'')).filter(t=>(t.length>=3||/^\p{N}+$/u.test(t))&&!STOP.has(t)))];
const number=b=>b.number||(/^\d{8}$/.test(String(b.id))?`${String(b.id).slice(2,4)}.${String(b.id).slice(4).replace(/^0/,"")}`:'');

export function matchProposals(businesses,query,{stage,from,to,mode='all'}={}){
 const q=String(query||'').trim(),byNumber=q.match(/^(\d{2})\.(\d{3,4})$/);
 const terms=searchTerms(q);
 const hits=new Map();
 return businesses.filter(b=>{
  if(stage&&b.statusGroup!==stage)return false;
  const date=(b.submitted||b.modified||'').slice(0,10);if(from&&date<from)return false;if(to&&date>to)return false;
  if(byNumber)return number(b)===q;
  if(!terms.length)return true;
  const words=new Set(searchTerms(b.title+' '+(b.number||'')));
  const matched=terms.filter(t=>words.has(t)||[...words].some(w=>w.startsWith(t)&&t.length>=5)).length;hits.set(b.id,matched);
  // Typed queries need every word; translated natural-language queries rank by how many terms match.
  return mode==='any'?matched>0:matched===terms.length;
 }).sort((a,b)=>(hits.get(b.id)||0)-(hits.get(a.id)||0)||(b.passageCount>0)-(a.passageCount>0)||(b.modified||'').localeCompare(a.modified||''));
}

export async function searchProposals(store,{q,stage,from,to,page=0,pageSize=50},env,fetchImpl=fetch){
 const all=store.listBusinesses();
 let matches=matchProposals(all,q,{stage,from,to}),translated=null;
 if(q&&!matches.length&&env?.INFERENCE_BASE_URL&&env?.INFERENCE_MODEL){
  try{const {queries}=await multilingualQueries(q,env,fetchImpl);translated=queries[0];matches=matchProposals(all,translated,{stage,from,to,mode:'any'});}catch{}
 }
 const start=Math.max(0,Number(page)||0)*pageSize;
 return {total:matches.length,archive:all.length,translatedQuery:translated,page:Number(page)||0,pageSize,
  results:matches.slice(start,start+pageSize).map(b=>({id:b.id,number:number(b),title:b.title,status:b.status,statusGroup:b.statusGroup,date:(b.submitted||b.modified||'').slice(0,10),passageCount:b.passageCount||0,officialUrl:b.officialUrl||null}))};
}
