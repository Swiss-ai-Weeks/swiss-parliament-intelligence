const stop=new Set('a an the of for in on and or de des du la le les un une et en dans au aux di della dei il lo e der die das den dem des und von zu im'.split(' '));
const fold=s=>s.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
const stem=s=>s.length>4?s.replace(/s$/,''):s;
function near(a,b){
 if(a===b)return true;
 if(Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
 return edits+(a.length-i)+(b.length-j)<=1;
}
export function searchDebateText(store,query,{personId,businessId,limit=20}={}){
 const terms=[...new Set((fold(query).match(/[\p{L}\p{N}]+/gu)||[]).filter(x=>!stop.has(x)).map(stem))].slice(0,15);
 if(!terms.length)return [];
 const found=[];
 for(const s of store.speeches()){
  if(personId&&s.personId!==personId||businessId&&s.businessId!==businessId&&!s.businessIds?.includes(businessId))continue;
  const words=[...s.text.matchAll(/[\p{L}\p{N}]+/gu)].map(m=>({word:stem(fold(m[0])),start:m.index,end:m.index+m[0].length,text:m[0]}));
  const groups=terms.map(term=>{const exact=words.filter(w=>w.word===term);return exact.length?exact:words.filter(w=>near(term,w.word));});
  if(groups.some(g=>!g.length))continue;
  // A phrase must occur in query order and in a local context, not in unrelated clauses.
  const spans=groups[0].flatMap(first=>{let last=first;for(const group of groups.slice(1)){const next=group.find(w=>w.start>=last.end&&w.start-last.end<=80);if(!next)return [];last=next;}return [last.end-first.start];});
  if(!spans.length)continue;
  const matched=[...new Map(groups.flat().map(w=>[w.start,w])).values()].sort((a,b)=>a.start-b.start);
  const corrections=groups.flatMap((g,i)=>g[0].word!==terms[i]?[{query:terms[i],matched:g[0].text}]:[]);
  found.push({...s,highlights:matched.map(w=>[w.start,w.end]),corrections,searchScore:corrections.length*10000+Math.min(...spans)});
 }
 return found.sort((a,b)=>a.searchScore-b.searchScore).slice(0,limit);
}
