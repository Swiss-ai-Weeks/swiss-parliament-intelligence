import {randomInt,randomUUID} from 'node:crypto';
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export function feedbackService(env,fetchImpl=fetch,now=Date.now){
 const challenges=new Map(),rates=new Map();
 const configured=Boolean(env.FEEDBACK_RESEND_KEY&&env.FEEDBACK_FROM);
 function limit(ip){
  const t=now();for(const [k,v]of rates)if(v.until<t)rates.delete(k);
  const v=rates.get(ip)||{n:0,until:t+3600000};v.n++;rates.set(ip,v);
  if(v.n>10||rates.size>10000)throw fail('FEEDBACK_RATE_LIMIT',429);
 }
 return {
  challenge(ip){
   if(!configured)return {available:false};limit(ip);
   for(const [id,c]of challenges)if(c.expires<now())challenges.delete(id);
   if(challenges.size>=10000)throw fail('FEEDBACK_BUSY',429);
   const a=randomInt(1,10),b=randomInt(1,10),id=randomUUID();
   challenges.set(id,{answer:String(a+b),ip,expires:now()+600000});
   return {available:true,id,question:`What is ${a} + ${b}?`};
  },
  async send(b,ip){
   if(!configured)throw fail('FEEDBACK_NOT_CONFIGURED',503);limit(ip);
   const c=challenges.get(b.challenge);challenges.delete(b.challenge);
   if(b.website||!c||c.ip!==ip||c.expires<now()||String(b.answer).trim()!==c.answer)throw fail('FEEDBACK_CHECK_FAILED');
   if(typeof b.message!=='string'||b.message.trim().length<10||b.message.length>4000)throw fail('FEEDBACK_MESSAGE_INVALID');
   if(b.email&&(typeof b.email!=='string'||b.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(b.email)||/[\r\n]/.test(b.email)))throw fail('FEEDBACK_EMAIL_INVALID');
   // Fixed recipient, plain text only. Never attach account details, chat history or page queries.
   let r;try{r=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.FEEDBACK_RESEND_KEY}`,'Content-Type':'application/json','Idempotency-Key':b.challenge},body:JSON.stringify({from:env.FEEDBACK_FROM,to:['contact@midnight.vote'],subject:'Swiss pilot feedback',text:b.message.trim(),...(b.email?{reply_to:b.email}:{})}),signal:AbortSignal.timeout(15000)});}catch{throw fail('FEEDBACK_DELIVERY_FAILED',502);}
   if(!r.ok)throw fail('FEEDBACK_DELIVERY_FAILED',502);
   const result=await r.json();if(!result.id)throw fail('FEEDBACK_DELIVERY_FAILED',502);
   return {status:'accepted'};
  }
 };
}
