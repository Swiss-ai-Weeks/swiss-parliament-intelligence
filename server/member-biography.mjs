import {officialDate,plainText} from './parliament.mjs';
export function memberBiography(row,history=[]){
 const id=String(row.PersonNumber),slug=[row.FirstName,row.LastName].join('-').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9-]+/g,'-');
 const terms=history.filter(h=>String(h.PersonNumber)===id&&[1,2].includes(h.Council)).map(h=>({id:String(h.ID),council:h.CouncilName,canton:h.CantonAbbreviation,start:officialDate(h.DateJoining),end:officialDate(h.DateLeaving),sourceUrl:h.__metadata?.uri})).filter(h=>h.start).sort((a,b)=>a.start.localeCompare(b.start));
 return {officialUrl:`https://www.parlament.ch/fr/biografie/${slug}/${id}`,declaredMandates:plainText(row.Mandates),membershipHistory:terms,firstJoined:terms[0]?.start||null,careerHistoryStatus:history.length?'official-history':'not-imported'};
}
