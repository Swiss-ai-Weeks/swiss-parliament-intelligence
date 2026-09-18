import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createAuth} from '../auth.mjs';
import {accountStore} from '../account-store.mjs';
import {readChamber,validateChamber} from '../chambers.mjs';
import {encryptBackup,decryptBackup} from '../backup.mjs';
import {zurichDate,broadcastState,workspaceService,parseSessionSchedule} from '../workspace.mjs';
import {createServer} from '../index.mjs';
import {createStore} from '../store.mjs';
import {DatabaseSync} from 'node:sqlite';
import {discover} from '../discovery.mjs';
const reply=(value,status=200)=>({ok:status<400,status,json:async()=>value});
test('both verified chambers reconcile every member, party and parliamentary group',()=>{
 for(const [c,n]of [['nr',200],['sr',46]]){const s=readChamber(c);assert.equal(validateChamber(s).occupied,n);assert.equal(new Set(s.seats.map(x=>x.member.id)).size,n);assert.equal(s.parties.reduce((n,p)=>n+p.count,0),n);assert.equal(s.groups.reduce((n,p)=>n+p.count,0),n);assert.ok(s.parties.some(p=>p.count===1));assert.equal(s.seats.filter(x=>x.seatId==='1').length,1);}
 const nr=readChamber('nr');assert.equal(nr.parties.find(p=>p.abbreviation==='Lega').count,1);assert.equal(nr.parties.find(p=>p.abbreviation==='EVP').count,2);assert.equal(nr.parties.find(p=>p.abbreviation==='EDU').count,2);assert.equal(readChamber('sr').parties.find(p=>p.abbreviation==='Independent').count,1);
});
test('snapshots reject missing data, duplicated presidency, invented vacancy and collapsed parties',()=>{
 const change=fn=>{const s=structuredClone(readChamber('nr'));fn(s);assert.throws(()=>validateChamber(s),/INVALID_CHAMBER/);};
 change(s=>s.seats.pop());change(s=>s.seats[1].member=s.seats[0].member);change(s=>s.seats[0].status='missing');change(s=>s.seats[0].status='vacant');change(s=>s.parties.pop());change(s=>s.groups[0].count++);change(s=>s.seats[0].geometry=null);
});
test('versioned snapshots are isolated from mutation and path traversal',()=>{const s=readChamber('sr'),name=s.seats[0].member.name;s.seats[0].member.name='changed';assert.equal(readChamber('sr',s.version).seats[0].member.name,name);assert.throws(()=>readChamber('sr','../../secrets'),/NOT_FOUND/);});
test('encrypted server sessions survive restart, refresh and logout without plaintext tokens',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'civic-session-')),file=join(dir,'sessions.sqlite');let refreshed=0;
 const env={SUPABASE_URL:'https://auth.example',SUPABASE_ANON_KEY:'public'};
 const fetcher=async(url,options)=>url.includes('grant_type=refresh_token')?(refreshed++,reply({user:{id:'alice',email:'a@example.test'},access_token:'fresh-secret',refresh_token:'rotated-secret',expires_in:3600})):url.includes('token?')?reply({user:{id:'alice',email:'a@example.test'},access_token:'access-secret',refresh_token:'refresh-secret',expires_in:1}):reply({id:'alice',email:'a@example.test'});
 try{let auth=createAuth(env,fetcher,{file});const r=await auth.login('a@example.test','password');auth.close();assert.ok(!readFileSync(file).includes(Buffer.from('access-secret')));auth=createAuth(env,fetcher,{file});assert.equal((await auth.user('pilot_session='+r.sid)).id,'alice');assert.equal(refreshed,1);auth.logout('pilot_session='+r.sid);await assert.rejects(()=>auth.user('pilot_session='+r.sid),/SIGN_IN_REQUIRED/);auth.close();}finally{rmSync(dir,{recursive:true,force:true});}
});
test('registration, verification, recovery and OAuth exchange are distinct and single-use',async()=>{
 const calls=[],env={SUPABASE_URL:'https://auth.example',SUPABASE_ANON_KEY:'public',PUBLIC_ORIGIN:'https://midnight.vote',PUBLIC_BASE_PATH:'/Switzerland'};
 const auth=createAuth(env,async(url,options)=>{calls.push({url,body:options.body?JSON.parse(options.body):null});if(url.includes('signup'))return reply({id:'alice'});if(url.includes('recover'))return reply({});if(url.endsWith('/user'))return reply({id:'alice',email:'a@example.test'});return reply({user:{id:'alice',email:'a@example.test'},access_token:'access',refresh_token:'refresh'});});
 try{const registration=await auth.signup('a@example.test','password','Alice');assert.equal(registration.status,'check-email');assert.equal(calls[0].body.data.display_name,'Alice');await auth.recover('a@example.test');assert.ok(decodeURIComponent(calls[1].url).includes('/Switzerland/api/auth/callback'));const verified=await auth.exchange('verification-code',registration.flowId);assert.equal(verified.user.id,'alice');await auth.password('pilot_session='+verified.sid,'new-password');const flow=await auth.oauth();const u=new URL(flow.url);assert.equal(u.searchParams.get('code_challenge_method'),'s256');assert.equal(u.searchParams.get('redirect_to'),'https://midnight.vote/Switzerland/api/auth/callback');assert.equal((await auth.exchange('code',flow.id)).user.id,'alice');await assert.rejects(()=>auth.exchange('code',flow.id),/AUTH_FLOW_EXPIRED/);}finally{auth.close();}
});
test('account storage enforces server ownership and rejects malformed conversation writes',async()=>{
 let sent;const items=accountStore({SUPABASE_URL:'https://db.example',SUPABASE_ANON_KEY:'public'},async(url,options)=>(sent={url,options},reply([])));
 const session={user:{id:'alice'},token:'alice-token'};await items(session,'preference','reading','POST',{largeText:true,user_id:'bob'});assert.equal(JSON.parse(sent.options.body).user_id,'alice');assert.equal(sent.options.headers.Authorization,'Bearer alice-token');await items(session,'conversation');assert.equal(new URL(sent.url).searchParams.get('user_id'),'eq.alice');await assert.rejects(()=>items(session,'conversation','id','POST',{id:'other',messages:[]}),/INVALID_PAYLOAD/);await assert.rejects(()=>items(session,'secret'),/INVALID_ITEM/);
});
test('backup restores complete application data, excludes secrets and detects tampering',()=>{
 const key=randomBytes(32),rows=[{user_id:'alice',kind:'conversation',id:'one',payload:{messages:[{role:'user',text:'Question'}]},updated_at:'2026-09-18',access_token:'secret-excluded'}];
 const archive=encryptBackup(rows,key);assert.ok(!archive.includes(Buffer.from('Question')));const restored=decryptBackup(archive,key);assert.deepEqual(restored.rows[0].payload,rows[0].payload);assert.ok(!('access_token' in restored.rows[0]));const damaged=Buffer.from(archive);damaged[damaged.length-1]^=1;assert.throws(()=>decryptBackup(damaged,key));assert.throws(()=>decryptBackup(archive,randomBytes(32)));
});
test('restoration rehearsal preserves original ownership in an isolated database',()=>{
 const source=[{user_id:'alice',kind:'saved',id:'eid-for',payload:{evidenceId:'eid-for'},updated_at:'2026-09-18'},{user_id:'bob',kind:'conversation',id:'chat',payload:{messages:[{role:'user',text:'My question'}]},updated_at:'2026-09-18'}],key=randomBytes(32),restored=decryptBackup(encryptBackup(source,key),key),db=new DatabaseSync(':memory:');
 try{db.exec('create table civic_user_items(user_id text,kind text,id text,payload text,updated_at text,primary key(user_id,kind,id))');for(const r of restored.rows)db.prepare('insert into civic_user_items values(?,?,?,?,?)').run(r.user_id,r.kind,r.id,JSON.stringify(r.payload),r.updated_at);assert.equal(db.prepare('select count(*) n from civic_user_items where user_id=?').get('alice').n,1);assert.deepEqual(JSON.parse(db.prepare('select payload from civic_user_items where user_id=?').get('bob').payload),source[1].payload);}finally{db.close();}
});
test('assisted discovery preserves type, stage, dates and language restrictions',()=>{
 const store=createStore(':memory:'),par={listBusinesses:()=>[{id:'42',title:'Identité numérique',status:'En commission',statusGroup:'proceedings',submitted:'2026-09-10'}]};try{const r=discover(store,par,{question:'identity',filters:{q:'',type:'popular-vote',from:'2025-01-01',to:'2025-12-31'}});assert.ok(r.records.some(x=>x.id==='eid'));assert.ok(r.records.every(x=>x.type==='popular-vote'));assert.equal(discover(store,par,{question:'numérique',filters:{type:'proposal',stage:'concluded'}}).total,0);assert.equal(discover(store,par,{question:'numérique',filters:{type:'proposal',language:'de'}}).total,0);assert.equal(discover(store,par,{question:'numérique',filters:{type:'proposal',language:'fr'}}).records[0].id,'42');}finally{store.close();}
});
test('published future sessions retain date ranges without invented daily sitting times',()=>{
 const source='Schedule of sessions 2026 ORDINARY SESSIONS Spring: 02 – 20 March Summer: 01 – 19 June Autumn: 14 September – 02 October Winter: 30 November – 18 December SPECIAL SESSION';const events=parseSessionSchedule(source,2026);assert.equal(events.length,4);assert.equal(events[3].date,'2026-11-30');assert.equal(events[3].endDate,'2026-12-18');assert.equal(events[3].time,null);assert.equal(events[3].status,'scheduled');assert.throws(()=>parseSessionSchedule('format changed',2026));
});
test('calendar uses Zurich date boundaries and no schedule can imply a live broadcast',()=>{
 assert.equal(zurichDate('2026-03-28T23:30:00Z'),'2026-03-29');assert.equal(zurichDate('2026-10-25T23:30:00Z'),'2026-10-26');assert.equal(broadcastState({scheduledStart:'2026-09-18T09:00:00Z'}),'unverified');const now=Date.now();assert.equal(broadcastState({verified:true,state:'live',checkedAt:new Date(now-1000).toISOString()},now),'live');assert.equal(broadcastState({verified:true,state:'live',checkedAt:new Date(now-120000).toISOString()},now),'unverified');
});
test('stale agenda retains its last snapshot and exposes refresh failure',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'civic-agenda-'));let fail=false;const ws=workspaceService({directory:dir,par:()=>({speeches:()=>[]}),fetchImpl:async(url)=>{if(String(url).includes('sessions/schedule'))return {ok:true,text:async()=>"Schedule of sessions 2026 Spring: 02 – 20 March Summer: 01 – 19 June Autumn: 14 September – 02 October Winter: 30 November – 18 December SPECIAL SESSION"};if(fail)throw Error('offline');return reply({d:[{ID:1,Council:1,Date:'/Date(1789689600000)/',Begin:'0900',IdSession:1,MeetingOrderText:'Sitting',CouncilName:'NR',__metadata:{uri:'https://ws.parlament.ch/official'}}]});}});
 try{const first=await ws.agenda();assert.equal(first.events[0].status,'scheduled');assert.equal(first.stale,false);fail=true;writeFileSync(join(dir,'agenda.json'),JSON.stringify({...first,retrievedAt:'2000-01-01T00:00:00Z'}));const offline=workspaceService({directory:dir,par:()=>({}),fetchImpl:async()=>{throw Error('offline');}});const stale=await offline.agenda();assert.equal(stale.stale,true);assert.equal(stale.events.length,first.events.length);assert.equal(stale.retrievedAt,'2000-01-01T00:00:00Z');}finally{rmSync(dir,{recursive:true,force:true});}
});
test('BFF issues secure opaque cookies, rejects cross-account writes and handles OAuth cancellation',async()=>{
 const store=createStore(':memory:'),env={SUPABASE_URL:'https://auth.example',SUPABASE_ANON_KEY:'public',PUBLIC_ORIGIN:'https://midnight.vote',PUBLIC_BASE_PATH:'/Switzerland'};
 const fetcher=async url=>reply(url.includes('token?')?{user:{id:'alice',email:'a@example.test'},access_token:'upstream-secret',refresh_token:'refresh'}:{id:'alice',email:'a@example.test'});
 const {server}=createServer({store,env,fetchImpl:fetcher});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/Switzerland';
 try{const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'a@example.test',password:'password'})});const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly; SameSite=Lax; Path=\/Switzerland/);assert.match(cookie,/Secure/);assert.ok(!JSON.stringify(await r.json()).includes('upstream-secret'));const changed=await fetch(base+'/api/me/items/preference',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie.split(';')[0]},body:JSON.stringify({id:'reading',payload:{},accountId:'bob'})});assert.equal(changed.status,409);const cancelled=await fetch(base+'/api/auth/callback?error=access_denied',{redirect:'manual'});assert.equal(cancelled.status,303);assert.match(cancelled.headers.get('location'),/auth=cancelled/);}finally{await new Promise(r=>server.close(r));store.close();}
});
