import test from 'node:test';
import assert from 'node:assert/strict';
import {loadConversations,saveConversations,appendMessage} from '../../frontend/src/pilot/chat-history.mjs';
test('a late answer goes to its originating chat and survives storage',()=>{
 const rows=[{id:'new',messages:[]},{id:'old',messages:[{role:'user',text:'Question'}],scope:{id:'42',kind:'person'}}];
 const result=appendMessage(rows,'old',{role:'assistant',answer:{claims:[]}});
 assert.equal(result[0].messages.length,0);assert.equal(result[1].messages.length,2);
 let raw;const storage={getItem:()=>raw,setItem:(_,s)=>{raw=s;}};
 assert.equal(saveConversations(storage,result),true);assert.equal(loadConversations(storage)[0].scope.id,'42');
 assert.deepEqual(appendMessage([], 'deleted', {role:'assistant'}),[]);
 assert.deepEqual(loadConversations({getItem:()=>'{broken'}),[]);
 assert.equal(saveConversations({setItem:()=>{throw Error('quota');}},result),false);
});
