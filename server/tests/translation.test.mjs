import test from 'node:test';import assert from 'node:assert/strict';import {translatePassage} from '../translation.mjs';
const p={id:'a',text:'La mozione 25.4187',language:'it',officialUrl:'https://www.parlament.ch/a'};
const env={TRANSLATION_BASE_URL:'http://translator-test'};
const response=text=>async()=>({ok:true,json:async()=>({text,source:'it',target:'fr',model:'riva',revision:'test',detectedLanguage:'fr',pivot:'en'})});
test('rejects invented and omitted parliamentary identifiers',async()=>{
 await assert.rejects(translatePassage(p,'fr',env,response('La résolution B8-0254/2018')),/NUMBER_MISMATCH/);
});
test('cached translations retain the requesting source identity',async()=>{
 const a=await translatePassage(p,'fr',env,response('La motion 25.4187'));
 const b=await translatePassage({...p,id:'b',officialUrl:'https://www.parlament.ch/b'},'fr',env,()=>{throw Error('must use cache');});
 assert.equal(a.pivot,'en');assert.equal(b.evidenceId,'b');assert.equal(b.sourceUrl,'https://www.parlament.ch/b');assert.equal(b.cacheHit,true);
});
test('Romansh is not passed to an unsupported model',async()=>{
 assert.equal((await translatePassage(p,'rm',env,()=>{throw Error('must not call');})).status,'translation-unavailable');
});
