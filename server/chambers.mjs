import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const directory=fileURLToPath(new URL('./chamber-snapshots/',import.meta.url));
export function validateChamber(s){
 const fail=m=>{throw new Error('INVALID_CHAMBER: '+m);},capacity={nr:200,sr:46}[s.chamber];
 if(!capacity||s.capacity!==capacity||s.seats.length!==capacity)fail('capacity');
 if(new Set(s.seats.map(x=>x.seatId)).size!==capacity)fail('duplicate seat');
 const occupied=s.seats.filter(x=>x.status==='occupied'),vacant=s.seats.filter(x=>x.status==='vacant');
 if(occupied.length+vacant.length!==capacity)fail('missing assignment');
 if(new Set(occupied.map(x=>x.member.id)).size!==occupied.length)fail('duplicate member or presidency');
 for(const x of s.seats){if(!x.geometry?.path||!Number.isFinite(x.geometry.x)||!Number.isFinite(x.geometry.y)||!x.sourceUrl||x.verifiedAt!==s.asOf)fail('geometry or provenance');if(x.status==='vacant'&&!x.vacancySource)fail('unverified vacancy');if(x.status==='occupied'&&(!x.member.partyId||!x.member.groupId||!x.member.id||x.member.chamber!==s.chamber))fail('membership');}
 for(const [list,key]of [[s.parties,'partyId'],[s.groups,'groupId']]){if(new Set(list.map(x=>x.id)).size!==list.length)fail('duplicate legend');for(const entry of list)if(entry.count!==occupied.filter(x=>x.member[key]===entry.id).length||entry.count<1)fail('legend totals');if(list.reduce((n,x)=>n+x.count,0)!==occupied.length)fail('missing small party/group');}
 if(!s.asOf||!s.sources?.length||s.verification!=='verified')fail('unverified snapshot');
 return {capacity,occupied:occupied.length,vacant:vacant.length,parties:s.parties.length,groups:s.groups.length};
}
export function readChamber(chamber,version){
 if(!['nr','sr'].includes(chamber)||version&&!/^\d{4}-\d{2}-\d{2}-[a-f0-9]{12}$/.test(version))throw Object.assign(new Error('NOT_FOUND'),{status:404});
 const manifest=JSON.parse(readFileSync(directory+'manifest.json','utf8')),v=version||manifest[chamber];
 try{const s=JSON.parse(readFileSync(directory+chamber+'-'+v+'.json','utf8'));const counts=validateChamber(s);return {...s,counts};}catch{throw Object.assign(new Error('VERIFIED_CHAMBER_UNAVAILABLE'),{status:503});}
}
