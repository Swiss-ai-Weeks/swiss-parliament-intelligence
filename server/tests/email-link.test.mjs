import test from 'node:test';
import assert from 'node:assert/strict';
import {safeConfirmationUrl} from '../../frontend/src/pilot/email-link.mjs';
const origin='https://midnight.vote',base='/Switzerland/';
const good=new URL('https://qtrgnmdxpigxgsmwzkcl.supabase.co/auth/v1/verify');
good.search=new URLSearchParams({token:'a'.repeat(64),type:'magiclink',redirect_to:origin+base+'api/auth/callback'});
test('email confirmation accepts only our provider and exact application callback',()=>{
 assert.equal(safeConfirmationUrl(good.href,origin,base),good.href);
 assert.equal(safeConfirmationUrl(encodeURIComponent(good.href),origin,base),good.href);
 assert.equal(safeConfirmationUrl('https%3A%2F%2Fevil.example',origin,base),null);
 for(const [key,value] of [['hostname','evil.example'],['pathname','/arbitrary'],['username','attacker'],['hash','#secret']]){const bad=new URL(good);bad[key]=value;assert.equal(safeConfirmationUrl(bad.href,origin,base),null);}
 for(const [key,value] of [['redirect_to','https://evil.example'],['type','invite'],['token','short']]){const bad=new URL(good);bad.searchParams.set(key,value);assert.equal(safeConfirmationUrl(bad.href,origin,base),null);}
 assert.equal(safeConfirmationUrl('javascript:alert(1)',origin,base),null);
});
