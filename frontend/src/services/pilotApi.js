const publicBase=import.meta.env?.BASE_URL || '/';
export function prefixMedia(value,base=publicBase){
  if(typeof value==='string')return value.startsWith('/media/') ? base.replace(/\/$/,'')+value : value;
  if(Array.isArray(value))return value.map(v=>prefixMedia(v,base));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,prefixMedia(v,base)]));
  return value;
}
export function createPilotApi({baseUrl=publicBase+'api',fetchImpl=fetch}={}) {
  async function request(path,method='GET',body) {
    const res=await fetchImpl(baseUrl+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
    const data=await res.json();
    if(!res.ok)throw Object.assign(new Error(data.error||'REQUEST_FAILED'),{status:res.status});
    return prefixMedia(data);
  }
  return {
    feedbackChallenge:()=>request('/feedback/challenge'),feedback:p=>request('/feedback','POST',p),
    discoverySearch:p=>request('/discovery/search','POST',p),
    broadcast:()=>request('/broadcast'),
    provider:provider=>request('/auth/provider','POST',{provider}),providers:()=>request('/auth/providers'),magic:p=>request('/auth/magic','POST',p),recover:p=>request('/auth/recover','POST',p),password:p=>request('/auth/password','POST',p),google:()=>request('/auth/google','POST',{}),
    items:(kind)=>request('/me/items/'+kind),putItem:(kind,id,payload,accountId)=>request('/me/items/'+kind,'POST',{id,payload,accountId}),deleteItem:(kind,id,accountId)=>request('/me/items/'+kind,'DELETE',{id,accountId}),
    chamber:(council,version)=>request('/chambers/'+council+(version?'?version='+encodeURIComponent(version):'')),dashboard:()=>request('/dashboard'),agenda:()=>request('/agenda'),feed:()=>request('/feed'),
    readDebate:filters=>request('/parliament/read?'+new URLSearchParams(filters)),
    recording:id=>request('/parliament/recording?id='+encodeURIComponent(id)),
    passageContext:id=>request('/parliament/context?id='+encodeURIComponent(id)),
    videoSearch:payload=>request('/parliament/video-search','POST',payload),
    translatePassage:payload=>request('/parliament/translate','POST',payload),
    refreshProfile:personId=>request('/parliament/profile-refresh','POST',{personId}),draftMessage:payload=>request('/parliament/draft','POST',payload),
    parliament:()=>request('/parliament'),parliamentBusiness:id=>request('/parliament/business/'+encodeURIComponent(id)),parliamentPerson:id=>request('/parliament/person/'+encodeURIComponent(id)),parliamentSearch:q=>request('/parliament/search?q='+encodeURIComponent(q)),parliamentAsk:payload=>request('/parliament/ask','POST',payload),compareStatements:payload=>request('/parliament/compare','POST',payload),
    health:()=>request('/health'),dossiers:()=>request('/dossiers'),dossier:id=>request('/dossiers/'+encodeURIComponent(id)),
    ask:payload=>request('/ask','POST',payload),brief:payload=>request('/brief','POST',payload),
    me:()=>request('/me'),login:payload=>request('/auth/login','POST',payload),signup:payload=>request('/auth/signup','POST',payload),logout:()=>request('/auth/logout','POST',{}),
    saved:()=>request('/me/saved'),save:evidenceId=>request('/me/saved','POST',{evidenceId}),remove:evidenceId=>request('/me/saved','DELETE',{evidenceId}),
  };
}
export const pilotApi=createPilotApi();
