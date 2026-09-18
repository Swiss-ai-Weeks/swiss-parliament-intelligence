import test from 'node:test';
import assert from 'node:assert/strict';
import {memberBiography} from '../member-biography.mjs';
import {officialRecording} from '../official-recording.mjs';
import {overviewEvidence} from '../overview-evidence.mjs';
test('career entry uses historical terms, not current re-election or a namesake',()=>{
 const date=y=>`/Date(${Date.UTC(y,11,2)})/`,row={PersonNumber:42,FirstName:'Anna',LastName:'Giacometti',DateJoining:date(2023),Mandates:'Municipal executive: 2010–2020'};
 const result=memberBiography(row,[{PersonNumber:42,ID:'old',Council:1,DateJoining:date(2019)},{PersonNumber:42,ID:'new',Council:1,DateJoining:date(2023)},{PersonNumber:99,ID:'other',Council:1,DateJoining:date(1990)}]);
 assert.equal(result.firstJoined.slice(0,4),'2019');assert.equal(result.membershipHistory.length,2);assert.match(result.officialUrl,/www.parlament.ch\/fr\/biografie\/anna-giacometti\/42$/);assert.equal(memberBiography(row).firstJoined,null);
});
test('official recording resolves only the source-owned transcript and never invents a quote time',async()=>{
 const speech={transcriptId:'700001',officialUrl:'https://www.parlament.ch/fr/bulletin?TranscriptId=700001'};
 const calls=[];const result=await officialRecording(speech,async(url,opts)=>{calls.push([String(url),opts.method]);return opts.method==='HEAD'?new Response(null,{headers:{'Content-Type':'video/mp4'}}):new Response('"OnDemandDownloadUrl":"https://par-pcache.simplex.tv/content/simvid_1.mp4?externalid={0}"');});
 assert.equal(result.scope,'full-intervention');assert.equal(result.start,undefined);assert.match(result.url,/externalid=700001$/);assert.equal(calls.length,2);
 const denied=await officialRecording({...speech,transcriptId:'700002'},()=>{throw Error('must not fetch mismatched source');});assert.equal(denied.status,'unavailable');
 const noVideo=await officialRecording({...speech,transcriptId:'700003',officialUrl:speech.officialUrl.replace('700001','700003')},async()=>new Response('No recording'));assert.equal(noVideo.status,'unavailable');
});
test('the profile suggested question retrieves a scoped overview without searching the person name',()=>{
 const collection=[{id:'one',personId:'42',text:'An imported speech with enough substantive original parliamentary wording for a useful answer.'}];
 assert.equal(overviewEvidence({personId:'42',question:'What issues has Anna Giacometti discussed?'},collection)[0].id,'one');assert.equal(overviewEvidence({question:'What issues has Anna Giacometti discussed?'},collection),null);
});
