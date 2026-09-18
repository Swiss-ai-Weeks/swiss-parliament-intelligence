import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackService} from '../feedback.mjs';
const answer=c=>String(c.question.match(/\d+/g).map(Number).reduce((a,b)=>a+b));
test('feedback fixes recipient, excludes context, requires single-use check and provider acceptance',async()=>{
 let sent;const service=feedbackService({FEEDBACK_RESEND_KEY:'test',FEEDBACK_FROM:'feedback@example.com'},async(u,o)=>{sent=JSON.parse(o.body);return {ok:true,json:async()=>({id:'accepted'})};});
 const c=service.challenge('ip'),b={challenge:c.id,answer:answer(c),message:'The calendar could be clearer.',to:'attacker@example.com',conversation:'private'};
 assert.equal((await service.send(b,'ip')).status,'accepted');assert.deepEqual(sent.to,['contact@midnight.vote']);assert.equal(sent.conversation,undefined);await assert.rejects(service.send(b,'ip'),/CHECK_FAILED/);
 const other=service.challenge('ip');await assert.rejects(service.send({...b,challenge:other.id,answer:'wrong'},'ip'),/CHECK_FAILED/);
});
test('feedback fails closed when unconfigured, provider unavailable or challenge expired',async()=>{
 assert.deepEqual(feedbackService({}).challenge('ip'),{available:false});
 let now=0;const s=feedbackService({FEEDBACK_RESEND_KEY:'test',FEEDBACK_FROM:'x'},async()=>({ok:false}),()=>now),c=s.challenge('ip');
 await assert.rejects(s.send({challenge:c.id,answer:answer(c),message:'Long enough feedback'},'ip'),/DELIVERY_FAILED/);
 const c2=s.challenge('ip');now=600001;await assert.rejects(s.send({challenge:c2.id,answer:answer(c2),message:'Long enough feedback'},'ip'),/CHECK_FAILED/);
});
