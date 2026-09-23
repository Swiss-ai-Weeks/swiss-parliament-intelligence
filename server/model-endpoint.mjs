// Keeps answers on NVIDIA models when the LaunchPad GPU endpoint goes away: model calls aimed at
// INFERENCE_BASE_URL are sent to NVIDIA's hosted API catalog (OpenAI-compatible) when the primary is
// unreachable, or always when INFERENCE_PROVIDER=nvidia-catalog. Nothing else is intercepted.
const CATALOG='https://integrate.api.nvidia.com/v1';
// Verified 23 Sep 2026: strict JSON-schema output in ~1 s. Nano-3 is listed but not served to this account;
// Lightning ignores /no_think and takes minutes.
export const DEFAULT_CATALOG_MODEL='nvidia/nemotron-3-super-120b-a12b';
// Second verified model, used when the first answers 429/5xx (the hosted catalog is sometimes "temporarily overloaded").
export const SECONDARY_CATALOG_MODEL='nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

export function catalogConfigured(env){return Boolean(env.NVIDIA_API_KEY);}
export function modelRoute(env){return {primary:env.INFERENCE_BASE_URL||null,catalog:catalogConfigured(env)?(env.INFERENCE_FALLBACK_BASE_URL||CATALOG):null,catalogModel:env.INFERENCE_FALLBACK_MODEL||DEFAULT_CATALOG_MODEL,catalogModels:[...new Set([env.INFERENCE_FALLBACK_MODEL||DEFAULT_CATALOG_MODEL,...(env.INFERENCE_FALLBACK_MODEL_2??SECONDARY_CATALOG_MODEL).split(',').filter(Boolean)])],forced:env.INFERENCE_PROVIDER==='nvidia-catalog'};}

export function createModelFetch(env,fetchImpl=fetch){
 const route=modelRoute(env);
 if(!route.primary||!route.catalog)return Object.assign(fetchImpl,{route:()=>({provider:'launchpad'})});
 const primary=route.primary.replace(/\/$/,'');let primaryDownUntil=0,last='launchpad';
 const toCatalog=async(url,options)=>{
  const body=options?.body?JSON.parse(options.body):{};body.chat_template_kwargs={enable_thinking:false,...(body.chat_template_kwargs||{})};
  last='nvidia-catalog';let response;
  // Up to three attempts, alternating models, while the catalog answers 429/5xx and the caller has not given up.
  for(let attempt=0;attempt<3;attempt++){
   if(attempt)await new Promise(done=>setTimeout(done,400*attempt));
   if(options?.signal?.aborted)break;
   body.model=route.catalogModels[attempt%route.catalogModels.length];
   response=await fetchImpl(route.catalog.replace(/\/$/,'')+String(url).slice(primary.length),{...options,headers:{...(options?.headers||{}),Authorization:'Bearer '+env.NVIDIA_API_KEY},body:JSON.stringify(body)});
   if(response.status!==429&&response.status<500)return response;
  }
  return response;
 };
 const wrapped=async(url,options)=>{
  if(!String(url).startsWith(primary))return fetchImpl(url,options);
  if(route.forced||Date.now()<primaryDownUntil)return toCatalog(url,options);
  try{const r=await fetchImpl(url,options);if(r.status>=500){primaryDownUntil=Date.now()+60000;return toCatalog(url,options);}last='launchpad';return r;}
  // Unreachable GPU host: switch to the catalog for a minute before trying the primary again.
  catch(error){if(error?.name==='AbortError'&&options?.signal?.aborted)throw error;primaryDownUntil=Date.now()+60000;return toCatalog(url,options);}
 };
 wrapped.route=()=>({provider:last,catalogModel:route.catalogModel,forced:route.forced});
 return wrapped;
}
