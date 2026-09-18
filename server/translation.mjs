import {createHash} from 'node:crypto';
const supported=['en','de','fr','it'];
const cache=new Map();
export async function translatePassage(passage,target,env,fetchImpl=fetch){
 if(!supported.includes(target)||!supported.includes(passage.language))return {status:'translation-unavailable',reason:'Automatic translation currently supports English, French, German and Italian.',original:passage.text};
 if(target===passage.language)return {status:'ok',mode:'original',text:passage.text,original:passage.text,sourceLanguage:passage.language,targetLanguage:target,evidenceId:passage.id};
 if(!env.TRANSLATION_BASE_URL)return {status:'provider-unavailable'};
 const sourceHash=createHash('sha256').update(passage.text).digest('hex'),key=JSON.stringify([sourceHash,passage.language,target,env.TRANSLATION_BASE_URL]);
 const prior=cache.get(key);if(prior&&Date.now()-prior.at<600000)return {...prior.value,evidenceId:passage.id,sourceUrl:passage.officialUrl,cacheHit:true};
 const r=await fetchImpl(env.TRANSLATION_BASE_URL.replace(/\/$/,'')+'/translate',{method:'POST',signal:AbortSignal.timeout(90000),headers:{'Content-Type':'application/json'},body:JSON.stringify({text:passage.text,source:passage.language,target})});
 if(!r.ok)throw Object.assign(Error(r.status===429?'TRANSLATOR_BUSY':'TRANSLATION_UNAVAILABLE'),{status:r.status===429?429:502});
 const out=await r.json();if(typeof out.text!=='string'||!out.text.trim()||out.text.length>30000||out.source!==passage.language||out.target!==target||typeof out.model!=='string'||typeof out.revision!=='string')throw Error('INVALID_TRANSLATION');
 const numbers=text=>String(text).match(/\d+(?:[.,]\d+)*/g)||[];
 const missingNumbers=numbers(passage.text).filter(n=>!numbers(out.text).includes(n));
 const addedNumbers=numbers(out.text).filter(n=>!numbers(passage.text).includes(n));
 if(missingNumbers.length||addedNumbers.length)throw Object.assign(Error('TRANSLATION_NUMBER_MISMATCH'),{status:502});
 const warnings=[];if(missingNumbers.length)warnings.push('Number formatting or values differ from the source; review against the original.');if(out.text.length<passage.text.length*.4)warnings.push('Translation is unusually short; check for omissions.');
 const value={status:'ok',mode:'machine-translation',text:out.text,original:passage.text,evidenceId:passage.id,sourceLanguage:passage.language,targetLanguage:target,pivot:out.pivot||null,detectedLanguage:out.detectedLanguage,sourceHash,sourceUrl:passage.officialUrl,model:out.model,revision:out.revision,latencyMs:out.latencyMs,reviewState:'machine-translated; human review pending',warnings,cacheHit:false};
 if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,{at:Date.now(),value});return value;
}
