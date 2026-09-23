// Keeps answers on NVIDIA models when the LaunchPad GPU endpoint goes away: model calls aimed at
// INFERENCE_BASE_URL are sent to NVIDIA's hosted API catalog (OpenAI-compatible) when the primary is
// unreachable, or always when INFERENCE_PROVIDER=nvidia-catalog. Nothing else is intercepted.
const CATALOG='https://integrate.api.nvidia.com/v1';
export const DEFAULT_CATALOG_MODEL='nvidia/nemotron-nano-3-30b-a3b';

export function catalogConfigured(env){return Boolean(env.NVIDIA_API_KEY);}
export function modelRoute(env){return {primary:env.INFERENCE_BASE_URL||null,catalog:catalogConfigured(env)?(env.INFERENCE_FALLBACK_BASE_URL||CATALOG):null,catalogModel:env.INFERENCE_FALLBACK_MODEL||DEFAULT_CATALOG_MODEL,forced:env.INFERENCE_PROVIDER==='nvidia-catalog'};}

export function createModelFetch(env,fetchImpl=fetch){
 const route=modelRoute(env);
 if(!route.primary||!route.catalog)return Object.assign(fetchImpl,{route:()=>({provider:'launchpad'})});
 const primary=route.primary.replace(/\/$/,'');let primaryDownUntil=0,last='launchpad';
 const toCatalog=(url,options)=>{
  const body=options?.body?JSON.parse(options.body):{};body.model=route.catalogModel;
  last='nvidia-catalog';
  return fetchImpl(route.catalog.replace(/\/$/,'')+String(url).slice(primary.length),{...options,headers:{...(options?.headers||{}),Authorization:'Bearer '+env.NVIDIA_API_KEY},body:JSON.stringify(body)});
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
