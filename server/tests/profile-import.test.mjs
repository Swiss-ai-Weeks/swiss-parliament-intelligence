import test from 'node:test';
import assert from 'node:assert/strict';
import {collectVotingHistory} from '../profile-import.mjs';

test('vote history pagination accepts long official histories and proves termination',async()=>{
 const total=20313,calls=[];
 const rows=await collectVotingHistory(async(table,parameters)=>{
  calls.push({table,parameters});const skip=Number(parameters.$skip),top=Number(parameters.$top);
  return Array.from({length:Math.min(top,total-skip)},(_,index)=>({ID:skip+index+1}));
 });
 assert.equal(rows.length,total);
 assert.equal(calls.length,41);
 assert.deepEqual(calls.at(-1),{table:'Voting',parameters:{'$orderby':'ID asc','$top':'500','$skip':'20000'}});
});

test('vote history pagination rejects endless and unstable services',async()=>{
 await assert.rejects(()=>collectVotingHistory(async()=>Array.from({length:2},(_,index)=>({ID:index+1})),{pageSize:2,pageLimit:3}),/VOTE_HISTORY_PAGE_LIMIT/);
 await assert.rejects(()=>collectVotingHistory(async(_table,parameters)=>Number(parameters.$skip)===0?[{ID:1},{ID:2}]:[{ID:2}],{pageSize:2,pageLimit:3}),/UNSTABLE_VOTE_PAGINATION/);
});
