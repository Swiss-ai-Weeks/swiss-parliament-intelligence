export async function officialPortrait(id,fetchImpl=fetch){
 const source=`https://ws-old.parlament.ch/councillors/${encodeURIComponent(id)}?format=json&lang=en&nativeLanguageFilter=true`;
 const r=await fetchImpl(source,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('PORTRAIT_IDENTITY_UNAVAILABLE');
 const p=await r.json();if(String(p.id)!==String(id)||!Number.isSafeInteger(p.number)||p.number<=0)throw Error('PORTRAIT_IDENTITY_MISMATCH');
 // Portrait filenames use the official councillor NUMBER, not the public profile ID.
 const portraitUrl=`https://www.parlament.ch/sitecollectionimages/profil/original/${p.number}.jpg`;
 const image=await fetchImpl(portraitUrl,{method:'HEAD',signal:AbortSignal.timeout(15000)});
 if(!image.ok||!image.headers.get('content-type')?.startsWith('image/'))return {portraitUrl:null,portraitIdentityVerified:false};
 return {portraitUrl,portraitSourceUrl:source,portraitIdentityVerified:true,portraitNumber:p.number,portraitCheckedAt:new Date().toISOString()};
}
