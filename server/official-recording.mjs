// A verified full intervention is not a word-aligned quotation.
const cache=new Map();
export async function officialRecording(speech,fetchImpl=fetch){
 if(!/^\d+$/.test(speech?.transcriptId||''))return {status:'unavailable'};
 const key=speech.transcriptId,prior=cache.get(key);if(prior&&Date.now()-prior.at<3600000)return prior.value;
 let value;try{
  const page=new URL(speech.officialUrl);if(page.protocol!=='https:'||page.hostname!=='www.parlament.ch'||page.searchParams.get('TranscriptId')!==key)throw Error('UNVERIFIED_SOURCE');
  const response=await fetchImpl(page,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('SOURCE_UNAVAILABLE');
  const html=await response.text(),template=html.match(/"OnDemandDownloadUrl"\s*:\s*"([^"\r\n]+)"/)?.[1];if(!template)throw Error('NO_RECORDING');
  const url=new URL(JSON.parse('"'+template+'"').replace('{0}',key));if(url.protocol!=='https:'||url.hostname!=='par-pcache.simplex.tv'||url.searchParams.get('externalid')!==key)throw Error('UNVERIFIED_MEDIA');
  const media=await fetchImpl(url,{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(15000)});if(!media.ok||!media.headers.get('content-type')?.startsWith('video/'))throw Error('RECORDING_UNAVAILABLE');
  value={status:'available',url:url.href,scope:'full-intervention',transcriptId:key,sourceUrl:page.href,checkedAt:new Date().toISOString()};
 }catch{value={status:'unavailable',transcriptId:key,checkedAt:new Date().toISOString()};}
 if(cache.size>500)cache.clear();cache.set(key,{at:Date.now(),value});return value;
}
