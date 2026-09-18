export function accountStore(env,fetchImpl=fetch){
 const kinds=new Set(['follow','conversation','preference','brief','saved','profile']);
 return async function items(session,kind,id,method='GET',payload){
  if(!kinds.has(kind)||id!==undefined&&(typeof id!=='string'||!id.length||id.length>200))throw Object.assign(new Error('INVALID_ITEM'),{status:400});
  if(method==='POST'){
   const invalid=()=>{throw Object.assign(new Error('INVALID_PAYLOAD'),{status:400});};
   if(!payload||typeof payload!=='object'||Array.isArray(payload))invalid();
   if(kind==='conversation'&&(payload.id!==id||!Array.isArray(payload.messages)||payload.messages.length>40||!Number.isFinite(Date.parse(payload.updatedAt))))invalid();
   if(kind==='follow'&&(!['person','party','topic','business'].includes(payload.kind)||typeof payload.id!=='string'||typeof payload.title!=='string'||payload.title.length>1500||id!==payload.kind+':'+payload.id))invalid();
   if(kind==='saved'&&(payload.evidenceId!==id))invalid();
  }
  if(payload&&JSON.stringify(payload).length>180000)throw Object.assign(new Error('ITEM_TOO_LARGE'),{status:413});
  const q=new URLSearchParams({user_id:'eq.'+session.user.id,kind:'eq.'+kind,...(id?{id:'eq.'+id}:{})});
  const url=env.SUPABASE_URL+'/rest/v1/civic_user_items?'+(method==='POST'?'on_conflict=user_id,kind,id':q);
  const r=await fetchImpl(url,{method,signal:AbortSignal.timeout(12000),headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+session.token,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},...(method==='POST'?{body:JSON.stringify({user_id:session.user.id,kind,id,payload,updated_at:new Date().toISOString()})}:{})});
  if(!r.ok)throw Object.assign(new Error('ACCOUNT_STORAGE_UNAVAILABLE'),{status:503});return r.status===204?[]:r.json();
 };
}
