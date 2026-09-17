import test from 'node:test';import assert from 'node:assert/strict';
import {profileIntent,answerProfile} from '../profile-ai.mjs';
import {safeContact} from '../profile-import.mjs';
const person={id:'10820',name:'Jessica Jaccoud',party:'Parti socialiste suisse',partyId:'12',group:'Groupe socialiste',canton:'VD',council:'Conseil national',sourceUrl:'https://ws.parlament.ch/odata.svc/MemberCouncil',retrievedAt:'2026-09-17',votes:[]};
const store={people:()=>[person],person:id=>id===person.id?person:null};
test('party follow-ups route away from speeches and personal speech questions reset the topic',()=>{
 assert.equal(profileIntent('What party does she belong to?'),'membership');
 assert.equal(profileIntent('Can you tell me more about that political party?'),'party');
 assert.equal(profileIntent('What about their climate policy?',{topic:'party'}),'party');
 assert.equal(profileIntent('What does Jessica Jaccoud say about data protection?',{topic:'party'}),'speech');
 assert.equal(profileIntent('À quel parti appartient-elle ?'),'membership');
});
test('membership cites an official profile, while party background cites only party material',async()=>{
 const member=await answerProfile(store,{personId:'10820',question:'Which party is she in?'},{},()=>{throw Error('unexpected model');});
 assert.equal(member.claims[0].evidenceId,'profile-10820');assert.equal(member.context.topic,'party');
 const party=await answerProfile(store,{question:'Can you tell me more about that political party?',context:member.context},{},()=>{throw Error('unexpected model');});
 assert.equal(party.claims.length,3);assert.ok(party.passages.every(p=>p.sourceKind==='party-self-description'&&p.officialUrl.includes('sp-ps.ch')));
 const climate=await answerProfile(store,{question:'What about their climate policy?',context:party.context},{},()=>{});assert.equal(climate.claims.length,1);assert.equal(climate.claims[0].evidenceId,'party-12-climate');
});
test('missing party knowledge refuses instead of falling back to unrelated speeches',async()=>{
 const other={...person,partyId:'999'};const s={people:()=>[other],person:()=>other};const out=await answerProfile(s,{personId:other.id,question:'Tell me more about her party'},{},()=>{throw Error('must not call model');});assert.equal(out.status,'insufficient-evidence');assert.equal(out.passages.length,0);
});
test('public contacts exclude private mail, executable URLs and malformed email',()=>{
 assert.equal(safeContact('person@gmail.com'),null);assert.equal(safeContact('javascript:alert(1)'),null);assert.equal(safeContact('person@parl.ch\r\nBCC:x@y.com'),null);assert.equal(safeContact('jessica.jaccoud@parl.ch').kind,'email');assert.equal(safeContact('https://example.org/profile').kind,'website');
});
