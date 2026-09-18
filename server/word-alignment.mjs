export const tokens=text=>String(text).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^\p{L}\p{N} ]/gu,' ').split(/\s+/).filter(Boolean);
export function alignParagraph(text,words,duration){
 const target=tokens(text);if(target.length<12)return null;
 const normalized=words.flatMap(w=>tokens(w.word).map(token=>({...w,token})));
 function find(anchor){return normalized.flatMap((w,i)=>anchor.every((t,j)=>normalized[i+j]?.token===t)?[i]:[]);}
 const start=find(target.slice(0,5)),end=find(target.slice(-5));if(start.length!==1||end.length!==1||end[0]<start[0])return null;
 const a=normalized[start[0]].start,b=normalized[end[0]+4].end;
 if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a||b>duration+.1)return null;
 // Anchors alone can surround unrelated text: require most paragraph tokens to occur in order.
 const slice=normalized.slice(start[0],end[0]+5).map(w=>w.token);let i=0;for(const token of slice)if(token===target[i])i++;
 if(i/target.length<.8||slice.length>target.length*1.6)return null;
 return {start:a,end:b,matchedFraction:i/target.length};
}

// Candidate alignment tolerant of isolated ASR spelling errors. Official edited
// text is never substituted with ASR; ambiguous candidate spans are rejected.
export function alignEditedParagraph(text,words,duration){
 const target=tokens(text);if(target.length<12)return null;
 const normalized=words.flatMap(w=>tokens(w.word).map(token=>({...w,token})));
 const near=(a,b)=>{if(a===b)return true;if(Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,edits=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;}else{if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}}return edits+a.length-i+b.length-j<=1;};
 const anchor=(a,i)=>a.every((t,j)=>normalized[i+j]&&near(t,normalized[i+j].token));
 // Edited Bulletin text can change the first word (e.g. Die/Diese).
 // Permit one boundary substitution only with the next five words anchored;
 // retain the same length, monotonicity, overlap and ambiguity checks below.
 const starts=normalized.flatMap((_,i)=>(anchor(target.slice(0,5),i)||(target.length>=20&&anchor(target.slice(1,6),i+1)))?[i]:[]),ends=normalized.flatMap((_,i)=>anchor(target.slice(-5),i)?[i]:[]),candidates=[];
 for(const start of starts)for(const end of ends){
  if(end<start||end+5-start>target.length*1.35||end+5-start<target.length*.75)continue;
  const slice=normalized.slice(start,end+5),a=slice[0].start,b=slice.at(-1).end;
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a||b>duration+.1||slice.some((w,i)=>!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.end<w.start||(i&&w.start<slice[i-1].start)))continue;
  let previous=new Uint16Array(slice.length+1);
  for(const t of target){const row=new Uint16Array(slice.length+1);for(let j=1;j<=slice.length;j++)row[j]=near(t,slice[j-1].token)?previous[j-1]+1:Math.max(previous[j],row[j-1]);previous=row;}
  const matchedFraction=previous[slice.length]/Math.max(target.length,slice.length);
  if(matchedFraction>=.85)candidates.push({start:a,end:b,matchedFraction});
 }
 return candidates.length===1?candidates[0]:null;
}
