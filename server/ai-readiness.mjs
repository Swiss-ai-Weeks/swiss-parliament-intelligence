// Semantic readiness: a configured endpoint is not a working model. A one-word live completion
// proves the tunnel, the model server and the model all answer, and how quickly.
let last=null,pending=null;
export async function probeInference(env,fetchImpl=fetch,{maxAgeMs=60000}={}){
 if(!env.INFERENCE_BASE_URL||!env.INFERENCE_MODEL)return {state:'not-configured',checkedAt:new Date().toISOString()};
 if(last&&Date.now()-Date.parse(last.checkedAt)<maxAgeMs)return last;
 if(pending)return pending;
 pending=(async()=>{
  const started=performance.now();
  try{
   const r=await fetchImpl(env.INFERENCE_BASE_URL.replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json',...(env.INFERENCE_API_KEY?{Authorization:'Bearer '+env.INFERENCE_API_KEY}:{})},
    body:JSON.stringify({model:env.INFERENCE_MODEL,temperature:0,max_tokens:4,messages:[{role:'system',content:'/no_think\nReply with the single word: ready'},{role:'user',content:'Status?'}]})});
   const text=r.ok?(await r.json()).choices?.[0]?.message?.content||'':'';
   last={state:r.ok&&/ready/i.test(text)?'ready':r.ok?'degraded':'unreachable',model:env.INFERENCE_MODEL,latencyMs:Math.round(performance.now()-started),checkedAt:new Date().toISOString()};
  }catch{last={state:'unreachable',model:env.INFERENCE_MODEL,latencyMs:Math.round(performance.now()-started),checkedAt:new Date().toISOString()};}
  finally{pending=null;}
  return last;
 })();
 return pending;
}
export const lastInferenceProbe=()=>last;
