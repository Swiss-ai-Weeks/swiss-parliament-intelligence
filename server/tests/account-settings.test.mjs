import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuth} from '../auth.mjs';
import {profileInput,firstName,avatar} from '../account-profile.mjs';
const env={SUPABASE_URL:'https://auth.example',SUPABASE_ANON_KEY:'public'};
const factor='12345678-1234-1234-1234-123456789abc';
const token=aal=>'header.'+Buffer.from(JSON.stringify({aal})).toString('base64url')+'.signature';
const reply=x=>({ok:true,status:200,json:async()=>x});
test('profile updates accept raster uploads and names but reject unsafe or oversized metadata',()=>{
 assert.equal(firstName({full_name:'Tomas Garro'}),'Tomas');assert.equal(firstName({given_name:'Jessica',full_name:'Other Name'}),'Jessica');
 assert.deepEqual(profileInput({firstName:' Tomas '}),{first_name:'Tomas'});
 for(const avatar of ['https://evil.example/track','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,AAAA','x'.repeat(130001)])assert.throws(()=>profileInput({firstName:'Tomas',avatar}),/INVALID_PROFILE/);
 assert.throws(()=>profileInput({firstName:'<script>'}),/INVALID_PROFILE/);
 assert.equal(avatar({avatar_url:'javascript:alert(1)'}),'');assert.equal(avatar({pilot_avatar:'',avatar_url:'https://provider.example/picture'}),'');
});
test('verified MFA blocks account data and changes until a valid owned factor elevates the session',async()=>{
 const user={id:'owner',email:'owner@example.ch',user_metadata:{full_name:'Tomas Garro'},factors:[{id:factor,status:'verified',factor_type:'totp'}]};
 let rejectCode=true;const calls=[];
 const auth=createAuth(env,async(url,o)=>{calls.push(url);if(url.endsWith('/user'))return reply(user);if(url.includes('/challenge'))return reply({id:'challenge'});if(url.includes('/verify')){if(rejectCode)return {ok:false,status:400,json:async()=>({error_code:'mfa_verification_failed'})};return reply({user,access_token:token('aal2'),refresh_token:'new',expires_in:3600});}return reply({user,access_token:token('aal1'),refresh_token:'old',expires_in:3600});});
 try{const login=await auth.login(user.email,'password');const cookie='pilot_session='+login.sid;assert.equal(login.user.mfaRequired,true);assert.equal((await auth.user(cookie)).firstName,'Tomas');await assert.rejects(()=>auth.session(cookie),/MFA_REQUIRED/);await assert.rejects(()=>auth.profile(cookie,{firstName:'Other'}),/MFA_REQUIRED/);await assert.rejects(()=>auth.removeFactor(cookie,factor),/MFA_REQUIRED/);await assert.rejects(()=>auth.verifyFactor(cookie,'00000000-0000-0000-0000-000000000000','123456'),/UNKNOWN_FACTOR/);await assert.rejects(()=>auth.verifyFactor(cookie,factor,'123456'),/AUTH_FAILED/);assert.equal((await auth.user(cookie)).mfaRequired,true);rejectCode=false;const result=await auth.verifyFactor(cookie,factor,'654321');assert.equal(result.sid,login.sid);assert.equal(result.user.mfaRequired,false);assert.equal((await auth.session(cookie)).user.id,'owner');}finally{auth.close();}
});
test('global logout invalidates every local session for the account but preserves another user',async()=>{
 let current='a';const auth=createAuth(env,async(url)=>url.includes('logout')?reply({}):reply(url.endsWith('/user')?{id:current}:{user:{id:current},access_token:token('aal1'),expires_in:3600}));
 try{const one=await auth.login('a','password'),two=await auth.login('a','password');current='b';const other=await auth.login('b','password');current='a';await auth.logoutAll('pilot_session='+one.sid);await assert.rejects(()=>auth.user('pilot_session='+one.sid),/SIGN_IN_REQUIRED/);await assert.rejects(()=>auth.user('pilot_session='+two.sid),/SIGN_IN_REQUIRED/);current='b';assert.equal((await auth.user('pilot_session='+other.sid)).id,'b');}finally{auth.close();}
});
