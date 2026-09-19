import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuth} from '../auth.mjs';
const env={SUPABASE_URL:'https://auth.example',SUPABASE_ANON_KEY:'public',PUBLIC_ORIGIN:'https://midnight.vote',PUBLIC_BASE_PATH:'/Switzerland'};
const reply=x=>({ok:true,status:200,json:async()=>x});

test('magic link uses the production callback and a single-use server-held PKCE flow',async()=>{
 const calls=[];const auth=createAuth(env,async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return reply(url.includes('grant_type=pkce')?{user:{id:'magic-user',email:'reader@example.ch'},access_token:'test-access',refresh_token:'test-refresh',expires_in:3600}:{});});
 try{const flow=await auth.magic('reader@example.ch','Reader');assert.equal(flow.status,'check-email');assert.equal(new URL(calls[0].url).searchParams.get('redirect_to'),'https://midnight.vote/Switzerland/api/auth/callback');assert.equal(calls[0].body.create_user,true);assert.equal(calls[0].body.data.display_name,'Reader');assert.equal(calls[0].body.code_challenge_method,'s256');assert.ok(!('verifier' in flow));const result=await auth.exchange('test-code',flow.flowId);assert.equal(result.mode,'magic');assert.equal(result.user.id,'magic-user');assert.ok(calls[1].body.code_verifier);await assert.rejects(()=>auth.exchange('test-code',flow.flowId),/AUTH_FLOW_EXPIRED/);}finally{auth.close();}
});
test('provider discovery advertises only enabled social methods and fails closed',async()=>{
 const auth=createAuth(env,async()=>reply({external:{email:true,google:true,apple:false,discord:true}}));
 try{assert.deepEqual(await auth.providers(),{email:true,google:true,apple:false,discord:true,sso:false});for(const provider of ['google','apple','discord']){const flow=await auth.oauth(provider),url=new URL(flow.url);assert.equal(url.searchParams.get('provider'),provider);assert.equal(url.searchParams.get('code_challenge_method'),'s256');assert.equal(url.searchParams.get('redirect_to'),'https://midnight.vote/Switzerland/api/auth/callback');}await assert.rejects(()=>auth.oauth('arbitrary'),/INVALID_PROVIDER/);await assert.rejects(()=>auth.sso(),/SSO_NOT_CONFIGURED/);}finally{auth.close();}
 const failed=createAuth(env,async()=>{throw Error('offline')});try{assert.ok(Object.values(await failed.providers()).every(v=>v===false));}finally{failed.close();}
});
test('organization SSO uses the configured identity provider and server-held PKCE verifier',async()=>{
 let sent;const auth=createAuth({...env,SUPABASE_SSO_PROVIDER_ID:'test-organization'},async(url,options)=>{sent={url,body:JSON.parse(options.body)};return reply({url:'https://idp.example/signin'});});
 try{const flow=await auth.sso();assert.equal(flow.url,'https://idp.example/signin');assert.equal(sent.body.provider_id,'test-organization');assert.equal(sent.body.code_challenge_method,'s256');assert.equal(sent.body.skip_http_redirect,true);assert.ok(!('code_verifier' in sent.body));assert.ok(!('verifier' in flow));}finally{auth.close();}
});
